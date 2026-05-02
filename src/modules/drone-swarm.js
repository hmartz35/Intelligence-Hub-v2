/**
 * Drone Swarm module — Phase 4: Canvas 2D agent-based model (ABM).
 *
 * ABM mechanics:
 *   4 UAV agents navigate to geographic waypoints in the Gulf theater.
 *   Per-frame steering forces: waypoint attraction + separation + cohesion.
 *   Cohesion weight driven by state.system.swarmCohesion (0–100%).
 *   Agents orbit their waypoint at close range (not freezing on it).
 *
 * Canvas-safe lifecycle:
 *   _canvas, _animId, _agents stored module-scope.
 *   update() patches selected-card and cohesion-bar without innerHTML if canvas alive.
 *   Cleanup cancels animation and nulls refs.
 *
 * Geographic coordinate frame:
 *   Gulf sub-region: lat 24–28°N, lng 55–60°E mapped to canvas XY.
 *   UAV waypoints are real-world coordinates from THEATER_ASSETS.
 */

import {
  getScreensForModule,
  selectScreen,
  updateDrillDownState
} from "../../hub-controller.js";

// ─── UAV node definitions ─────────────────────────────────────────────────────

const UAV_NODES = [
  { id: "UAV-RAVEN-03",  type: "ISR",    lat: 26.1, lng: 56.3, status: "nominal", alt: 8200  },
  { id: "UAV-HAWK-07",   type: "STRIKE", lat: 25.4, lng: 57.8, status: "nominal", alt: 6800  },
  { id: "UAV-GHOST-12",  type: "EW",     lat: 27.2, lng: 55.1, status: "watch",   alt: 9100  },
  { id: "UAV-SHADE-19",  type: "RELAY",  lat: 24.8, lng: 58.5, status: "nominal", alt: 11000 }
];

const TYPE_COLOR = { ISR: "#0EA5E9", STRIKE: "#ff4d4d", EW: "#a78bfa", RELAY: "#ffba20" };
const TYPE_CHIP  = { ISR: "chip-cyan", STRIKE: "chip-red", EW: "chip-cyan", RELAY: "chip-amber" };

// Geographic bounds for canvas coordinate mapping
const GEO = { latMin: 24.0, latMax: 28.2, lngMin: 54.8, lngMax: 59.5 };

// ABM base parameters (threat modifies speed and separation at runtime)
const SEPARATION_RADIUS = 38;  // px — minimum agent spacing
const BASE_SEPARATION   = 1.4; // scales up with threat (tactical dispersal)
const BASE_MAX_SPEED    = 1.6; // scales up with threat (urgency)
const WAYPOINT_SPEED    = 0.5;
const COHESION_PULL     = 0.0012;
const ORBIT_RADIUS      = 18;  // px — orbit waypoint when this close

// Threat threshold above which EW aircraft divert/degrade
const EW_UAV_THREAT_LIMIT = 68;
// Spectrum integrity below which EW UAV is degraded
const EW_UAV_SI_LIMIT     = 52;

// ─── Module-scope canvas state ────────────────────────────────────────────────

let _canvas   = null;
let _ctx      = null;
let _animId   = null;
let _agents   = null;
let _swState  = null;  // latest state ref for animation loop
let _dispatch = null;

// ─── Coordinate mapping ───────────────────────────────────────────────────────

function geoToCanvas(lat, lng, W, H) {
  return {
    x: ((lng - GEO.lngMin) / (GEO.lngMax - GEO.lngMin)) * W,
    y: ((GEO.latMax - lat) / (GEO.latMax - GEO.latMin)) * H
  };
}

// ─── ABM agent initialization ─────────────────────────────────────────────────

function initAgents(W, H) {
  return UAV_NODES.map(node => {
    const wp = geoToCanvas(node.lat, node.lng, W, H);
    return {
      id:    node.id,
      type:  node.type,
      color: TYPE_COLOR[node.type],
      x:     wp.x + (Math.random() - 0.5) * 40,
      y:     wp.y + (Math.random() - 0.5) * 40,
      vx:    (Math.random() - 0.5) * 0.6,
      vy:    (Math.random() - 0.5) * 0.6,
      orbitAngle: Math.random() * Math.PI * 2,
      waypoint: wp
    };
  });
}

// ─── ABM step ────────────────────────────────────────────────────────────────

function stepAgents(agents, cohesion, threat, si) {
  const cw = (cohesion / 100) * COHESION_PULL;

  // Threat drives tactical dispersal (higher threat → faster, wider separation)
  const threatFactor  = Math.max(0, (threat - 50) / 100);
  const effectiveMaxSpeed = BASE_MAX_SPEED * (1 + threatFactor * 0.65);
  const effectiveSep      = BASE_SEPARATION * (1 + threatFactor * 0.9);

  // EW UAV degraded when SI low or threat high → drifts off-pattern
  const ewDegraded = si < EW_UAV_SI_LIMIT || threat > EW_UAV_THREAT_LIMIT;

  const cx = agents.reduce((s, a) => s + a.x, 0) / agents.length;
  const cy = agents.reduce((s, a) => s + a.y, 0) / agents.length;

  for (const a of agents) {
    const dxW = a.waypoint.x - a.x;
    const dyW = a.waypoint.y - a.y;
    const distW = Math.sqrt(dxW * dxW + dyW * dyW) || 1;

    let fx = 0, fy = 0;

    if (distW > ORBIT_RADIUS) {
      fx += (dxW / distW) * WAYPOINT_SPEED;
      fy += (dyW / distW) * WAYPOINT_SPEED;
    } else {
      // EW UAV: erratic orbit when degraded
      const orbitRate = (a.type === "EW" && ewDegraded) ? 0.025 : 0.012;
      a.orbitAngle += orbitRate;
      fx += Math.cos(a.orbitAngle) * 0.4;
      fy += Math.sin(a.orbitAngle) * 0.4;
    }

    // Separation
    for (const b of agents) {
      if (b === a) continue;
      const dx = a.x - b.x, dy = a.y - b.y;
      const d  = Math.sqrt(dx * dx + dy * dy) || 1;
      if (d < SEPARATION_RADIUS) {
        const push = (SEPARATION_RADIUS - d) / SEPARATION_RADIUS;
        fx += (dx / d) * push * effectiveSep;
        fy += (dy / d) * push * effectiveSep;
      }
    }

    // Cohesion
    fx += (cx - a.x) * cw;
    fy += (cy - a.y) * cw;

    a.vx = a.vx * 0.88 + fx * 0.12;
    a.vy = a.vy * 0.88 + fy * 0.12;

    const spd = Math.sqrt(a.vx * a.vx + a.vy * a.vy);
    if (spd > effectiveMaxSpeed) { a.vx = (a.vx / spd) * effectiveMaxSpeed; a.vy = (a.vy / spd) * effectiveMaxSpeed; }

    a.x += a.vx;
    a.y += a.vy;
  }
}

// ─── Canvas drawing ───────────────────────────────────────────────────────────

function drawSwarm(ctx, W, H, agents, selectedId, cohesion, threat, si) {
  const ewDegraded  = si < EW_UAV_SI_LIMIT || threat > EW_UAV_THREAT_LIMIT;
  const isrQuality  = threat > 80 ? "reduced" : threat > 55 ? "nominal" : "enhanced";
  ctx.clearRect(0, 0, W, H);

  // Background
  ctx.fillStyle = "#06090E";
  ctx.fillRect(0, 0, W, H);

  // Tactical grid
  ctx.strokeStyle = "rgba(26,37,53,0.8)";
  ctx.lineWidth = 0.5;
  const gx = W / 9, gy = H / 6;
  for (let x = 0; x < W; x += gx) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += gy) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  // Geographic labels (Hormuz Strait label)
  ctx.font = "8px 'JetBrains Mono', monospace";
  ctx.fillStyle = "rgba(89,95,119,0.6)";
  ctx.textAlign = "center";
  const hormuzPx = geoToCanvas(26.6, 56.4, W, H);
  ctx.fillText("HORMUZ STRAIT", hormuzPx.x, hormuzPx.y);

  const babPx = geoToCanvas(12.6, 43.4, W, H); // off-canvas but that's fine
  const bandarPx = geoToCanvas(27.2, 56.3, W, H);
  ctx.fillStyle = "rgba(255,77,77,0.4)";
  ctx.fillText("BANDAR ABBAS ▼", bandarPx.x, bandarPx.y - 6);

  // Cohesion web: draw lines between agents that are "in formation"
  ctx.setLineDash([]);
  for (let i = 0; i < agents.length; i++) {
    for (let j = i + 1; j < agents.length; j++) {
      const a = agents[i], b = agents[j];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d < 120) {
        const alpha = (1 - d / 120) * (cohesion / 100) * 0.25;
        ctx.strokeStyle = `rgba(14,165,233,${alpha.toFixed(3)})`;
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }

  // Waypoint rings (dashed, dim)
  ctx.setLineDash([3, 4]);
  ctx.lineWidth = 0.8;
  for (const a of agents) {
    ctx.strokeStyle = a.color + "28";
    ctx.beginPath();
    ctx.arc(a.waypoint.x, a.waypoint.y, ORBIT_RADIUS, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Agent triangles + labels
  for (const a of agents) {
    const sel      = a.id === selectedId;
    const angle    = Math.atan2(a.vy || 0.001, a.vx || 0.001);
    const s        = sel ? 10 : 7;
    const isEW     = a.type === "EW";
    const isISR    = a.type === "ISR";
    const agentDeg = isEW && ewDegraded;
    const drawColor = agentDeg ? "rgba(255,150,100,0.75)" : a.color;

    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(angle);

    if (sel) { ctx.shadowBlur = 14; ctx.shadowColor = a.color; }

    ctx.beginPath();
    ctx.moveTo(s, 0);
    ctx.lineTo(-s * 0.65, -s * 0.5);
    ctx.lineTo(-s * 0.65,  s * 0.5);
    ctx.closePath();
    ctx.fillStyle = drawColor;
    ctx.globalAlpha = agentDeg ? 0.6 : 1;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.restore();

    const shortId = a.id.split("-").slice(-2).join("-");
    ctx.font      = "7px 'JetBrains Mono', monospace";
    ctx.fillStyle = sel ? a.color : (agentDeg ? "rgba(255,150,100,0.65)" : a.color + "99");
    ctx.textAlign = "center";
    ctx.fillText(shortId, a.x, a.y - s - 5);

    // ISR UAV: show collection state
    if (isISR) {
      const collectLabel = isrQuality === "enhanced" ? "ISR+" : isrQuality === "reduced" ? "ISR-" : "ISR";
      const collectColor = isrQuality === "enhanced" ? "rgba(56,189,248,0.85)"
                         : isrQuality === "reduced"  ? "rgba(255,186,32,0.75)"
                         :                             a.color + "99";
      ctx.font      = "6px 'JetBrains Mono', monospace";
      ctx.fillStyle = collectColor;
      ctx.fillText(collectLabel, a.x, a.y + s + 10);
    }

    // EW UAV: show degraded status
    if (isEW && agentDeg) {
      ctx.font      = "6px 'JetBrains Mono', monospace";
      ctx.fillStyle = "rgba(255,150,100,0.8)";
      ctx.fillText("EW DEGRADED", a.x, a.y + s + 10);
    }
  }

  // HUD
  ctx.font = "8px 'JetBrains Mono', monospace";
  ctx.textAlign = "left";
  ctx.fillStyle = cohesion > 70 ? "rgba(14,165,233,0.7)" : "rgba(255,186,32,0.7)";
  ctx.fillText(`COHESION ${cohesion}%`, 8, H - 18);
  ctx.fillStyle = threat > 70 ? "rgba(255,100,100,0.75)" : "rgba(56,189,248,0.5)";
  ctx.fillText(`THREAT ${threat}`, 8, H - 7);
}

// ─── Canvas lifecycle ─────────────────────────────────────────────────────────

function initSwarmCanvas(container, state) {
  const wrap = container.querySelector("#swarm-canvas-wrap");
  if (!wrap) return;

  const W = wrap.clientWidth  || 520;
  const H = 260;

  const canvas  = document.createElement("canvas");
  canvas.width  = W;
  canvas.height = H;
  canvas.style.cssText = "display:block;width:100%;height:260px";
  wrap.innerHTML = "";
  wrap.appendChild(canvas);

  _canvas  = canvas;
  _ctx     = canvas.getContext("2d");
  _agents  = initAgents(W, H);

  function loop() {
    _animId = requestAnimationFrame(loop);
    if (!_swState) return;
    const cohesion = _swState.system.swarmCohesion;
    const threat   = _swState.system.threat;
    const si       = _swState.system.spectrumIntegrity;
    const selId    = _swState.drillDown?.["drone-swarm"]?.selectedNodeId ?? null;
    stepAgents(_agents, cohesion, threat, si);
    drawSwarm(_ctx, W, H, _agents, selId, cohesion, threat, si);
  }
  loop();
}

function destroySwarm() {
  if (_animId) { cancelAnimationFrame(_animId); _animId = null; }
  _canvas   = null;
  _ctx      = null;
  _agents   = null;
  _dispatch = null;
}

// ─── DOM helpers ─────────────────────────────────────────────────────────────

function selectedCardHTML(state) {
  const drill = state.drillDown["drone-swarm"] ?? {};
  const sel   = UAV_NODES.find(n => n.id === drill.selectedNodeId);
  if (!sel) {
    return `<p class="text-xs text-muted" style="margin-top:8px">Select a node on the canvas for drill-down telemetry.</p>`;
  }

  const threat   = state.system.threat;
  const si       = state.system.spectrumIntegrity;
  const ewDeg    = si < EW_UAV_SI_LIMIT || threat > EW_UAV_THREAT_LIMIT;

  // Per-type operational output
  let intelOutput = "";
  if (sel.type === "ISR") {
    const quality = threat > 80 ? "REDUCED — high threat degrades collection windows"
                  : threat > 55 ? "NOMINAL — standard IMINT/GEOINT collection"
                  :               "ENHANCED — low threat, full collection rate";
    const color   = threat > 80 ? "text-red" : threat > 55 ? "text-amber" : "text-cyan";
    intelOutput = `<div><dt>ISR Collection</dt><dd class="${color}">${quality}</dd></div>`;
  } else if (sel.type === "STRIKE") {
    const readiness = threat > 65 ? "WEAPONS HOT" : "STANDBY";
    intelOutput = `<div><dt>Strike Readiness</dt><dd class="${threat > 65 ? "text-red" : "text-muted"}">${readiness}</dd></div>`;
  } else if (sel.type === "EW") {
    const ewStatus = ewDeg
      ? `DEGRADED — ${si < EW_UAV_SI_LIMIT ? `SI ${si}% below threshold` : `THREAT ${threat} exceeds limit`}`
      : "ACTIVE — jamming nominal";
    intelOutput = `<div><dt>EW / Jamming</dt><dd class="${ewDeg ? "text-red" : "text-cyan"}">${ewStatus}</dd></div>`;
  } else if (sel.type === "RELAY") {
    const linkQ = Math.round(si * 0.8 + 20);
    intelOutput = `<div><dt>Link Quality</dt><dd class="${linkQ > 70 ? "text-cyan" : "text-amber"}">${linkQ}%</dd></div>`;
  }

  return `
    <div class="data-card" style="border-color:rgba(56,189,248,0.3);margin-top:8px">
      <div class="node-kicker">${sel.type} Node — Selected</div>
      <div class="node-title mt-1">${sel.id}</div>
      <dl class="mt-3 data-stack">
        <div><dt>Altitude</dt><dd>${sel.alt.toLocaleString()} ft</dd></div>
        <div><dt>Position</dt><dd>${sel.lat}°N ${sel.lng}°E</dd></div>
        <div><dt>Status</dt><dd class="${sel.status === "nominal" ? "text-cyan" : "text-amber"}">${sel.status.toUpperCase()}</dd></div>
        ${intelOutput}
      </dl>
    </div>
  `;
}

function patchSwarmInfo(container, state) {
  const cohesion = state.system.swarmCohesion;

  const barEl = container.querySelector("#swarm-cohesion-bar");
  if (barEl) {
    barEl.style.width      = `${cohesion}%`;
    barEl.style.background = cohesion > 70 ? "#0EA5E9" : "#ffba20";
  }
  const labelEl = container.querySelector("#swarm-cohesion-label");
  if (labelEl) {
    labelEl.textContent = `${cohesion}% — advance war game with drone5 directive to retask`;
  }
  const cardEl = container.querySelector("#swarm-selected-card");
  if (cardEl) cardEl.innerHTML = selectedCardHTML(state);

  const feedEl = container.querySelector("#swarm-intel-feed");
  if (feedEl) feedEl.innerHTML = swarmIntelFeedHTML(state);

  // Sync node list selection highlight
  container.querySelectorAll("[data-swarm-node]").forEach(btn => {
    const id = btn.dataset.swarmNode;
    const active = id === (state.drillDown["drone-swarm"]?.selectedNodeId ?? null);
    btn.classList.toggle("target-card-active", active);
    // neon-line: insert if active and not present
    const existingNeon = btn.querySelector(".neon-line");
    if (active && !existingNeon) {
      btn.insertAdjacentHTML("afterbegin", '<span class="neon-line"></span>');
    } else if (!active && existingNeon) {
      existingNeon.remove();
    }
  });
}

// ─── Intel feed ──────────────────────────────────────────────────────────────

function swarmIntelFeedHTML(state) {
  const threat = state.system.threat;
  const si     = state.system.spectrumIntegrity;
  const ewDeg  = si < EW_UAV_SI_LIMIT || threat > EW_UAV_THREAT_LIMIT;

  const isrQuality  = threat > 80 ? "REDUCED"  : threat > 55 ? "NOMINAL" : "ENHANCED";
  const isrColor    = threat > 80 ? "#FF6666"   : threat > 55 ? "#FBBF24" : "#38BDF8";
  const ewStatusStr = ewDeg ? "DEGRADED" : "ACTIVE";
  const ewColor     = ewDeg ? "#FF6666" : "#a78bfa";
  const linkQ       = Math.round(si * 0.8 + 20);
  const strikeReady = threat > 65;

  return `
    <div class="node-kicker" style="margin-bottom:6px">Swarm Intel Feed</div>
    <div class="data-card" style="padding:10px">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div>
          <div class="data-sm text-muted">ISR Collection</div>
          <div class="data-sm font-semibold" style="color:${isrColor}">${isrQuality}</div>
        </div>
        <div>
          <div class="data-sm text-muted">EW / Jamming</div>
          <div class="data-sm font-semibold" style="color:${ewColor}">${ewStatusStr}</div>
        </div>
        <div>
          <div class="data-sm text-muted">Strike Readiness</div>
          <div class="data-sm font-semibold" style="color:${strikeReady ? "#FF6666" : "rgba(255,255,255,0.4)"}">${strikeReady ? "WEAPONS HOT" : "STANDBY"}</div>
        </div>
        <div>
          <div class="data-sm text-muted">Relay Link</div>
          <div class="data-sm font-semibold" style="color:${linkQ > 70 ? "#38BDF8" : "#FBBF24"}">${linkQ}%</div>
        </div>
      </div>
      ${ewDeg ? `<div class="data-sm" style="color:rgba(255,150,100,0.8);margin-top:6px">⚠ EW node degraded — apply signal-sweep protocol to restore spectrum</div>` : ""}
    </div>
  `;
}

// ─── HTML shell ───────────────────────────────────────────────────────────────

function html(state) {
  const drill     = state.drillDown["drone-swarm"] ?? { selectedNodeId: null };
  const screens   = getScreensForModule("drone-swarm");
  const cohesion  = state.system.swarmCohesion;

  return `
    <div class="viewport-head" style="margin-bottom:16px">
      <div>
        <div class="node-kicker">Drone Swarm / W${state.system.week}</div>
        <h2>UAV Intelligence Terminal</h2>
        <p>Agent-based UAV swarm over the Gulf theater. Cohesion driven by war game directives.</p>
      </div>
      <div class="hero-panel">
        <span class="chip ${cohesion > 70 ? "chip-cyan" : "chip-amber"}">COHESION ${cohesion}%</span>
        <span class="chip chip-amber">W${state.system.week}</span>
      </div>
    </div>

    <div class="workspace-grid" style="margin-bottom:12px">
      <section class="panel panel-large">
        <div class="panel-head">
          <div><div class="node-kicker">UAV ABM — Gulf Theater</div><h3>Active Swarm Nodes</h3></div>
          <span class="chip ${cohesion > 70 ? "chip-cyan" : "chip-amber"}">${cohesion}% cohesion</span>
        </div>

        <!-- Canvas ABM -->
        <div id="swarm-canvas-wrap"
          style="width:100%;height:260px;background:rgba(6,9,14,0.9);border:1px solid rgba(34,48,68,1);border-radius:4px;overflow:hidden;margin-top:8px">
        </div>

        <div id="swarm-selected-card">${selectedCardHTML(state)}</div>

        <!-- Cohesion bar -->
        <div style="margin-top:12px">
          <div class="node-kicker" style="margin-bottom:6px">Swarm Cohesion</div>
          <div style="height:6px;background:rgba(255,255,255,0.06);border-radius:3px;overflow:hidden">
            <div id="swarm-cohesion-bar"
              style="height:100%;width:${cohesion}%;background:${cohesion > 70 ? "#0EA5E9" : "#ffba20"};transition:width 0.5s">
            </div>
          </div>
          <div id="swarm-cohesion-label" class="data-sm text-muted" style="margin-top:4px">
            ${cohesion}% — advance war game with drone5 directive to retask
          </div>
        </div>

        <!-- Swarm Intel Feed -->
        <div id="swarm-intel-feed" style="margin-top:12px">
          ${swarmIntelFeedHTML(state)}
        </div>
      </section>

      <div class="panel">
        <div class="panel-head">
          <div><div class="node-kicker">Swarm Nodes</div><h3>Unit Status</h3></div>
        </div>
        <div class="grid gap-2" style="margin-bottom:16px">
          ${UAV_NODES.map(n => `
            <button class="target-card ${drill.selectedNodeId === n.id ? "target-card-active" : ""}" data-swarm-node="${n.id}">
              ${drill.selectedNodeId === n.id ? '<span class="neon-line"></span>' : ""}
              <div class="flex items-start justify-between gap-3">
                <div>
                  <div class="node-kicker">${n.type}</div>
                  <div class="node-title">${n.id}</div>
                </div>
                <span class="chip ${TYPE_CHIP[n.type] ?? "chip-cyan"}">${n.status}</span>
              </div>
            </button>
          `).join("")}
        </div>
        <div class="panel-head">
          <div><div class="node-kicker">Screens</div><h3>Drone Swarm</h3></div>
          <span class="chip chip-cyan">${screens.length}</span>
        </div>
        <div class="screen-list">
          ${screens.map(s => `
            <button class="screen-row ${s.screenId === state.activeScreenId ? "screen-row-active" : ""}" data-swarm-screen="${s.screenId}">
              ${s.screenId === state.activeScreenId ? '<span class="neon-line"></span>' : ""}
              <span class="material-symbols-outlined text-[17px]">${s.icon}</span>
              <span class="min-w-0 flex-1 truncate text-ink">${s.title}</span>
            </button>
          `).join("")}
        </div>
      </div>
    </div>
  `;
}

// ─── Module exports ───────────────────────────────────────────────────────────

export function mount(container, state, dispatch) {
  destroySwarm();
  _swState  = state;
  _dispatch = dispatch;

  container.innerHTML = html(state);
  initSwarmCanvas(container, state);

  function onClick(e) {
    const nodeBtn = e.target.closest("[data-swarm-node]");
    if (nodeBtn) {
      dispatch(updateDrillDownState, "drone-swarm", { selectedNodeId: nodeBtn.dataset.swarmNode });
      return;
    }
    const screenBtn = e.target.closest("[data-swarm-screen]");
    if (screenBtn) { dispatch(selectScreen, screenBtn.dataset.swarmScreen); }
  }

  container.addEventListener("click", onClick);
  return () => {
    container.removeEventListener("click", onClick);
    destroySwarm();
  };
}

export function update(container, state) {
  _swState = state;

  if (_canvas) {
    // Canvas alive — patch info without innerHTML
    patchSwarmInfo(container, state);
    return;
  }

  // Canvas not alive (first render or after destroy) — full rebuild
  container.innerHTML = html(state);
  initSwarmCanvas(container, state);
}
