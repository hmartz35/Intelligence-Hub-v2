/**
 * War Room module — Phase 2
 *
 * Panels (state.drillDown["war-room"].panel):
 *   overview     → threat matrix, protocol board, strike planner, command log
 *   turn-engine  → 10-week timeline, 4 action tracks, 6-actor posture board, resolve
 *   causal       → 18-node causal graph (canvas 2D, no Three.js)
 *
 * Data sources:
 *   state.strikePlanner, state.threatMatrix, state.system
 *   STRIKE_SOLUTIONS, THREAT_PROTOCOLS, WAR_GAME_ACTORS (hub-controller)
 *
 * Events dispatched:
 *   lockStrikeSolution, initiateThreatProtocol, advanceWarRoom
 *   updateDrillDownState (panel switch, screen routing)
 *   selectScreen
 */

import {
  lockStrikeSolution,
  initiateThreatProtocol,
  advanceWarRoom,
  updateDrillDownState,
  selectScreen,
  getCausalChainSummary,
  getScreensForModule,
  STRIKE_SOLUTIONS,
  THREAT_PROTOCOLS,
  WAR_GAME_ACTORS,
  updateCausalBeliefs,
  setCausalIntervention,
  clearCausalInterventions,
  computeSensitivity,
  CAUSAL_NODE_ORDER
} from "../../hub-controller.js";

// ─── Action tracks ────────────────────────────────────────────────────────────

const ACTION_TRACKS = [
  {
    id: "military",
    label: "Military",
    icon: "target",
    directives: [
      { id: "mil1",   label: "Raise orbital asset readiness"    },
      { id: "drone5", label: "Retask UAV swarm to maritime ISR" }
    ]
  },
  {
    id: "diplomatic",
    label: "Diplomatic",
    icon: "handshake",
    directives: [
      { id: "dip3", label: "Open allied diplomatic backchannel" },
      { id: "dip1", label: "Engage Saudi Arabia liaison"        },
      { id: "dip2", label: "Activate UAE backchannel"           }
    ]
  },
  {
    id: "intelligence",
    label: "Intelligence",
    icon: "radar",
    directives: [
      { id: "sig2", label: "Escalate signal-intelligence sweep" },
      { id: "int1", label: "SIGINT surge — Qeshm Island"        },
      { id: "int2", label: "HUMINT asset activation"            }
    ]
  },
  {
    id: "escalation",
    label: "Escalation",
    icon: "stacked_line_chart",
    directives: [
      { id: "hormuz7", label: "Advance Hormuz escalation ladder" }
    ]
  }
];

// ─── Actor posture derivation ─────────────────────────────────────────────────

function actorPosture(actorId, state) {
  const actors  = state.system.actors ?? {};
  const threat  = state.system.threat;
  const hormuz  = state.system.hormuzEscalation;
  const proto   = state.threatMatrix.activeProtocolId;

  switch (actorId) {
    case "us":
      return threat > 70 ? { label: "Strike-Ready", tone: "chip-red"   }
           : threat > 50 ? { label: "Deterrence",   tone: "chip-amber" }
           :               { label: "Monitoring",   tone: "chip-cyan"  };
    case "iran": {
      const h = actors.iran ?? (hormuz / 100);
      return h > 0.72 ? { label: "Hostile",     tone: "chip-red"   }
           : h > 0.50 ? { label: "Escalating",  tone: "chip-amber" }
           : h > 0.35 ? { label: "Provocative", tone: "chip-amber" }
           :             { label: "Restrained",  tone: "chip-cyan"  };
    }
    case "uae":
      return hormuz > 55 ? { label: "Alert",      tone: "chip-amber" }
           :               { label: "Monitoring", tone: "chip-cyan"  };
    case "ksa": {
      const h = actors.ksa ?? 0.25;
      return h < 0.15            ? { label: "Aligned",  tone: "chip-cyan"  }
           : proto === "deconflict" ? { label: "Engaged",  tone: "chip-cyan" }
           :                       { label: "Neutral",  tone: "chip-cyan"  };
    }
    case "oman":
      return hormuz > 55 ? { label: "Mediating",     tone: "chip-amber" }
           :               { label: "Passive",       tone: "chip-cyan"  };
    case "china":
      return hormuz > 72 ? { label: "Opportunistic", tone: "chip-amber" }
           :               { label: "Observing",     tone: "chip-cyan"  };
    default:
      return { label: "Unknown", tone: "chip-cyan" };
  }
}

// ─── Causal graph data ────────────────────────────────────────────────────────

const CAUSAL_NODES = [
  { id: "threat",      label: "THREAT",      x: 0.50, y: 0.10, color: "#ff4d4d",
    metric: s => s.system.threat },
  { id: "sys-stress",  label: "SYS STRESS",  x: 0.80, y: 0.10, color: "#ff4d4d",
    metric: s => Math.round(s.system.threat * 0.5 + s.system.hormuzEscalation * 0.3 + (100 - s.system.readiness) * 0.2) },
  { id: "readiness",   label: "READINESS",   x: 0.18, y: 0.27, color: "#0EA5E9",
    metric: s => s.system.readiness },
  { id: "confidence",  label: "CONFIDENCE",  x: 0.82, y: 0.27, color: "#38BDF8",
    metric: s => s.system.confidence },
  { id: "spectrum",    label: "SPECTRUM",    x: 0.08, y: 0.50, color: "#0EA5E9",
    metric: s => s.system.spectrumIntegrity },
  { id: "diplo",       label: "DIPLOMATIC",  x: 0.32, y: 0.45, color: "#38BDF8",
    metric: s => s.threatMatrix.activeProtocolId === "deconflict" ? 80 : s.threatMatrix.protocolCount * 15 },
  { id: "hormuz",      label: "HORMUZ ESC",  x: 0.50, y: 0.45, color: "#ffba20",
    metric: s => s.system.hormuzEscalation },
  { id: "swarm",       label: "SWARM COH",   x: 0.68, y: 0.45, color: "#0EA5E9",
    metric: s => s.system.swarmCohesion },
  { id: "lock-count",  label: "LOCK COUNT",  x: 0.92, y: 0.50, color: "#38BDF8",
    metric: s => Math.min(100, s.strikePlanner.lockCount * 25) },
  { id: "ew-density",  label: "EW DENSITY",  x: 0.08, y: 0.68, color: "#0EA5E9",
    metric: s => Math.round(s.system.spectrumIntegrity * 0.9) },
  { id: "naval",       label: "NAVAL POS",   x: 0.27, y: 0.65, color: "#ffba20",
    metric: s => (s.hormuzParameters?.navalPosture ?? 40) },
  { id: "eco",         label: "ECONOMIC",    x: 0.50, y: 0.72, color: "#ffba20",
    metric: s => (s.hormuzParameters?.economicPressure ?? 50) },
  { id: "alliance",    label: "ALLIANCE",    x: 0.73, y: 0.65, color: "#38BDF8",
    metric: s => (s.hormuzParameters?.allianceCohesion ?? 65) },
  { id: "isr",         label: "ISR COV",     x: 0.92, y: 0.68, color: "#0EA5E9",
    metric: s => Math.round(s.system.swarmCohesion * 0.8) },
  { id: "protocols",   label: "PROTOCOLS",   x: 0.18, y: 0.85, color: "#0EA5E9",
    metric: s => Math.min(100, s.threatMatrix.protocolCount * 20) },
  { id: "esc-rate",    label: "ESC RATE",    x: 0.36, y: 0.88, color: "#ff4d4d",
    metric: s => (s.hormuzParameters?.escalationRate ?? 35) },
  { id: "strike-lock", label: "STRIKE LOCK", x: 0.64, y: 0.88, color: "#38BDF8",
    metric: s => s.strikePlanner.lockedSolutionId ? 100 : 0 },
  { id: "week",        label: "WEEK PROG",   x: 0.82, y: 0.85, color: "#595f77",
    metric: s => (s.system.week / 10) * 100 }
];

const CAUSAL_EDGES = [
  ["threat",     "readiness"],  ["threat",    "confidence"],
  ["threat",     "sys-stress"], ["threat",    "esc-rate"],
  ["hormuz",     "threat"],     ["hormuz",    "eco"],
  ["hormuz",     "sys-stress"],
  ["naval",      "hormuz"],     ["naval",     "threat"],
  ["eco",        "esc-rate"],   ["esc-rate",  "threat"],
  ["alliance",   "diplo"],      ["alliance",  "confidence"],
  ["spectrum",   "isr"],        ["spectrum",  "ew-density"],
  ["swarm",      "isr"],        ["swarm",     "readiness"],
  ["protocols",  "threat"],     ["protocols", "spectrum"],
  ["strike-lock","confidence"], ["strike-lock","sys-stress"],
  ["diplo",      "alliance"],   ["week",      "hormuz"],
  ["lock-count", "confidence"]
];

function nodeRadius(val) {
  return 10 + (val / 100) * 11;
}

function drawCausalGraph(canvas, state, beliefs = null) {
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  // Build positioned node map
  const nodeMap = {};
  for (const n of CAUSAL_NODES) {
    nodeMap[n.id] = { ...n, px: n.x * W, py: n.y * H, val: Math.max(0, Math.min(100, n.metric(state))) };
  }

  // Draw edges
  for (const [fromId, toId] of CAUSAL_EDGES) {
    const a = nodeMap[fromId];
    const b = nodeMap[toId];
    if (!a || !b) continue;
    const intensity = Math.min(1, (a.val + b.val) / 160);
    const cpx = (a.px + b.px) / 2;
    const cpy = (a.py + b.py) / 2 - 18;

    ctx.beginPath();
    ctx.moveTo(a.px, a.py);
    ctx.quadraticCurveTo(cpx, cpy, b.px, b.py);
    ctx.strokeStyle = `rgba(14,165,233,${0.06 + intensity * 0.28})`;
    ctx.lineWidth = 0.8 + intensity * 1.2;
    ctx.stroke();

    // Arrow tip at destination
    const angle = Math.atan2(b.py - cpy, b.px - cpx);
    const r = nodeRadius(b.val);
    const tx = b.px - r * Math.cos(angle);
    const ty = b.py - r * Math.sin(angle);
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(tx - 7 * Math.cos(angle - 0.45), ty - 7 * Math.sin(angle - 0.45));
    ctx.lineTo(tx - 7 * Math.cos(angle + 0.45), ty - 7 * Math.sin(angle + 0.45));
    ctx.closePath();
    ctx.fillStyle = `rgba(14,165,233,${0.15 + intensity * 0.35})`;
    ctx.fill();
  }

  // Draw nodes
  for (const n of Object.values(nodeMap)) {
    const r = nodeRadius(n.val);
    // Glow ring
    ctx.beginPath();
    ctx.arc(n.px, n.py, r + 4, 0, Math.PI * 2);
    ctx.strokeStyle = n.color + "22";
    ctx.lineWidth = 1;
    ctx.stroke();
    // Fill
    ctx.beginPath();
    ctx.arc(n.px, n.py, r, 0, Math.PI * 2);
    ctx.fillStyle = n.color + "18";
    ctx.fill();
    ctx.strokeStyle = n.color;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Value
    ctx.font = `bold 9px 'JetBrains Mono', monospace`;
    ctx.fillStyle = n.color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(Math.round(n.val), n.px, n.py);
    // Label
    ctx.font = `7px 'JetBrains Mono', monospace`;
    ctx.fillStyle = "#595f77";
    ctx.textBaseline = "top";
    ctx.fillText(n.label, n.px, n.py + r + 4);

    // Belief arc overlay (Phase 3 — shown when causalBeliefs populated)
    if (beliefs && beliefs[n.id] !== undefined) {
      const p = beliefs[n.id];
      const arcEnd = -Math.PI / 2 + p * 2 * Math.PI;
      ctx.beginPath();
      ctx.arc(n.px, n.py, r + 6, -Math.PI / 2, arcEnd);
      ctx.strokeStyle = `rgba(56,189,248,0.65)`;
      ctx.lineWidth = 2;
      ctx.stroke();
      // P% label above node
      ctx.font = `bold 7px 'JetBrains Mono', monospace`;
      ctx.fillStyle = "rgba(56,189,248,0.9)";
      ctx.textBaseline = "bottom";
      ctx.fillText(`${Math.round(p * 100)}%`, n.px, n.py - r - 6);
    }
  }
}

// Wrapper so callers don't need to pass beliefs separately
function drawCausalGraphWithBeliefs(canvas, state) {
  drawCausalGraph(canvas, state, state.causalBeliefs ?? null);
}

// ─── Panel content ────────────────────────────────────────────────────────────

function panelOverview(state) {
  const chain = getCausalChainSummary(state);
  const riskLow = Math.max(0, chain.warRoomRiskCenter - chain.warRoomRiskSpread);
  const riskHigh = Math.min(100, chain.warRoomRiskCenter + chain.warRoomRiskSpread);
  return `
    <div class="threat-grid" style="margin-bottom:16px">
      <div class="threat-core">
        <div class="node-kicker">Composite Risk</div>
        <div class="threat-score">${state.system.threat}</div>
        <div class="data-sm uppercase text-muted">Readiness ${state.system.readiness}% / Spectrum ${state.system.spectrumIntegrity}%</div>
        <div class="data-card" style="margin-top:14px;border-color:rgba(255,186,32,0.25)">
          <div class="node-kicker">Risk Estimate Range</div>
          <div class="metric-value text-amber" style="font-size:2rem;margin-top:6px">${riskLow}-${riskHigh}<span>%</span></div>
          <div class="data-sm text-muted" style="margin-top:6px">Widened by sensor confidence ${chain.sensorConfidence}% and ISR certainty ${chain.orbitalISRCertainty}%.</div>
          <div class="data-sm text-muted" style="margin-top:6px">Iran posture ${Math.round(chain.actorPosture.iran * 100)}% / Houthi ${Math.round(chain.actorPosture.houthis * 100)}%.</div>
        </div>
      </div>
      <div class="grid gap-3">
        ${THREAT_PROTOCOLS.map(p => {
          const active = state.threatMatrix.activeProtocolId === p.id;
          return `
            <article class="target-card ${active ? "target-card-active" : ""}">
              ${active ? '<span class="neon-line"></span>' : ""}
              <div class="flex items-center justify-between gap-3">
                <div><div class="node-kicker">${p.id}</div><h4 class="node-title">${p.label}</h4></div>
                <span class="chip ${p.tone}">${p.delta}</span>
              </div>
              <button class="primary-action mt-4" data-wr-protocol="${p.id}">Initiate Protocol</button>
            </article>`;
        }).join("")}
      </div>
    </div>

    <div class="panel-head" style="margin-bottom:8px">
      <div><div class="node-kicker">Mission Planning</div><h3>Solution Board</h3></div>
      <span class="chip chip-cyan">${state.strikePlanner.lockCount} locks</span>
    </div>
    <div class="planner-grid" style="margin-bottom:16px">
      ${STRIKE_SOLUTIONS.map(sol => {
        const active = state.strikePlanner.lockedSolutionId === sol.id;
        return `
          <article class="target-card ${active ? "target-card-active" : ""}">
            ${active ? '<span class="neon-line"></span>' : ""}
            <div class="flex items-start justify-between gap-3">
              <div><div class="node-kicker">${sol.id}</div><h4 class="node-title">${sol.label}</h4></div>
              <span class="chip ${active ? "chip-cyan" : "chip-amber"}">${sol.eta}</span>
            </div>
            <dl class="mt-4 data-stack">
              <div><dt>Confidence</dt><dd>${sol.confidence}%</dd></div>
              <div><dt>Posture</dt><dd>${sol.posture}</dd></div>
              <div><dt>Lock</dt><dd>${active ? "LOCKED" : "open"}</dd></div>
            </dl>
            <button class="primary-action mt-4" data-wr-lock="${sol.id}">Lock Solution</button>
          </article>`;
      }).join("")}
    </div>

    <div class="panel-head" style="margin-bottom:4px">
      <div><div class="node-kicker">Event Log</div><h3>Recent Activity</h3></div>
    </div>
    ${state.system.log.slice(-6).reverse().map(e => `<div class="log-entry">${e}</div>`).join("")}
  `;
}

function panelTurnEngine(state) {
  const week = state.system.week;

  // Recent turn outcomes: log entries from the current week
  const outcomes = state.system.log.filter(e => e.startsWith(`W${week}:`)).slice(0, 5);

  return `
    <!-- Week timeline -->
    <div style="margin-bottom:20px">
      <div class="node-kicker" style="margin-bottom:8px">Campaign Timeline</div>
      <div style="display:flex;gap:4px;flex-wrap:wrap">
        ${Array.from({ length: 10 }, (_, i) => i + 1).map(w => {
          const cls = w === week    ? "timeline-week-active"
                    : w < week     ? "timeline-week-past"
                    :                "timeline-week-future";
          return `<div class="timeline-week ${cls}"><span>W${w}</span></div>`;
        }).join("")}
      </div>
      <div class="data-sm text-muted" style="margin-top:6px">
        Week ${week} / 10 — ${10 - week} weeks remaining
      </div>
    </div>

    <!-- Actor posture board -->
    <div style="margin-bottom:20px">
      <div class="node-kicker" style="margin-bottom:8px">Actor Posture Board</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px">
        ${WAR_GAME_ACTORS.map(actor => {
          const posture = actorPosture(actor.id, state);
          return `
            <div class="data-card" style="padding:10px 12px">
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
                <span class="material-symbols-outlined" style="font-size:14px;color:#595f77">${actor.icon}</span>
                <span class="data-sm text-ink" style="font-weight:600">${actor.label}</span>
              </div>
              <span class="chip ${posture.tone}" style="font-size:8px">${posture.label}</span>
            </div>`;
        }).join("")}
      </div>
    </div>

    <!-- Action tracks -->
    <div class="node-kicker" style="margin-bottom:8px">Directive Selection — Issue per Track</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px;margin-bottom:16px">
      ${ACTION_TRACKS.map(track => `
        <div class="panel" style="padding:12px;background:rgba(6,9,14,0.6)">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:10px">
            <span class="material-symbols-outlined" style="font-size:15px;color:#38BDF8">${track.icon}</span>
            <span class="data-sm text-cyan" style="font-weight:700;text-transform:uppercase;letter-spacing:0.08em">${track.label}</span>
          </div>
          ${track.directives.map(d => `
            <label style="display:flex;align-items:flex-start;gap:8px;margin-bottom:8px;cursor:pointer">
              <input type="checkbox" class="wr-directive" value="${d.id}"
                style="accent-color:#0EA5E9;width:13px;height:13px;flex-shrink:0;margin-top:2px">
              <span class="data-sm text-muted" style="line-height:1.4">${d.label}</span>
            </label>`).join("")}
        </div>`).join("")}
    </div>

    <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
      <button class="primary-action" data-wr-advance="all" style="flex:1">
        Resolve Week ${week} →
      </button>
      <span class="data-sm text-dim">Unchecked = no action issued this turn</span>
    </div>

    ${outcomes.length > 0 ? `
      <div style="margin-top:4px">
        <div class="node-kicker" style="margin-bottom:6px">W${week} Outcomes</div>
        ${outcomes.map(e => `<div class="log-entry">${e}</div>`).join("")}
      </div>` : ""}
  `;
}

function panelCausal() {
  return `
    <div class="node-kicker" style="margin-bottom:8px">Causal Cascade Analysis — 18 Nodes</div>
    <p class="data-sm text-muted" style="margin-bottom:12px;line-height:1.6">
      Node size and value reflect current state metrics. Edges show causal influence direction.
      Run the probabilistic assessment to overlay posterior probabilities as arc indicators.
    </p>
    <canvas id="causal-canvas"
      style="width:100%;height:420px;display:block;background:rgba(6,9,14,0.7);border:1px solid rgba(34,48,68,1);border-radius:4px">
    </canvas>
    <div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:10px">
      <span class="data-sm" style="color:#ff4d4d">● Threat / Stress</span>
      <span class="data-sm" style="color:#0EA5E9">● Readiness / Intel</span>
      <span class="data-sm" style="color:#ffba20">● Hormuz / Escalation</span>
      <span class="data-sm" style="color:#38BDF8">● Confidence / Alliance</span>
      <span class="data-sm" style="color:#595f77">● Timeline</span>
    </div>
  `;
}

// ─── Monte Carlo workbench panel ─────────────────────────────────────────────

const CAUSAL_NODE_LABELS = {
  "naval":       "Naval Posture",   "alliance":    "Alliance Cohesion",
  "eco":         "Economic Pressure","spectrum":   "Spectrum Integrity",
  "swarm":       "Swarm Cohesion",  "protocols":  "Protocol Count",
  "strike-lock": "Strike Lock",     "week":       "Week Progress",
  "lock-count":  "Lock Count",      "hormuz":     "Hormuz Escalation",
  "diplo":       "Diplomatic",      "esc-rate":   "Escalation Rate",
  "threat":      "THREAT",          "readiness":  "Readiness",
  "confidence":  "Confidence",      "sys-stress": "System Stress",
  "isr":         "ISR Coverage",    "ew-density": "EW Density"
};

function panelMonteCarlo(state) {
  const beliefs = state.causalBeliefs ?? {};
  const interventions = state.causalInterventions ?? {};
  const hasBeliefs = Object.keys(beliefs).length > 0;

  const sensitivityRows = hasBeliefs
    ? computeSensitivity(state, "threat", 120)
        .slice(0, 8)
        .map(({ nodeId, delta }) => {
          const pct = Math.abs(delta * 100);
          const dir = delta > 0 ? "↑" : "↓";
          const barColor = delta > 0 ? "#ff4d4d" : "#0EA5E9";
          return `
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:5px">
              <span class="data-sm text-muted" style="width:110px;flex-shrink:0">${CAUSAL_NODE_LABELS[nodeId] ?? nodeId}</span>
              <div style="flex:1;height:6px;background:rgba(34,48,68,0.8);border-radius:3px;overflow:hidden">
                <div style="width:${Math.min(100, pct * 4)}%;height:100%;background:${barColor};border-radius:3px"></div>
              </div>
              <span class="data-sm" style="color:${barColor};width:36px;text-align:right">${dir}${pct.toFixed(1)}%</span>
            </div>`;
        }).join("")
    : "";

  return `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
      <div>
        <div class="node-kicker">Probabilistic Assessment</div>
        <p class="data-sm text-muted" style="margin-top:4px;line-height:1.5">
          18-node Bayesian DAG · 1,000 forward samples · do-calculus interventions
        </p>
      </div>
      <div style="display:flex;gap:8px">
        <button class="primary-action" data-wr-mc-run="1" style="padding:6px 14px">Run Assessment</button>
        ${hasBeliefs ? `<button class="primary-action" data-wr-mc-clear="1" style="padding:6px 14px;opacity:0.7">Clear</button>` : ""}
      </div>
    </div>

    <!-- Belief table -->
    ${hasBeliefs ? `
      <div class="node-kicker" style="margin-bottom:8px">Node Posterior Beliefs</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:6px;margin-bottom:16px">
        ${CAUSAL_NODE_ORDER.map(id => {
          const p = beliefs[id] ?? 0;
          const label = CAUSAL_NODE_LABELS[id] ?? id;
          const pct = Math.round(p * 100);
          const clamped = interventions[id] !== undefined;
          const barColor = p > 0.65 ? "#ff4d4d" : p > 0.40 ? "#ffba20" : "#0EA5E9";
          return `
            <div class="data-card" style="padding:8px 10px;${clamped ? "border-color:rgba(56,189,248,0.5);" : ""}">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:5px">
                <span class="data-sm text-ink" style="font-weight:600">${label}</span>
                <div style="display:flex;align-items:center;gap:5px">
                  ${clamped ? `<span class="chip chip-cyan" style="font-size:7px">CLAMPED</span>` : ""}
                  <span class="data-sm" style="color:${barColor};font-weight:700">${pct}%</span>
                </div>
              </div>
              <div style="height:4px;background:rgba(34,48,68,0.8);border-radius:2px;overflow:hidden;margin-bottom:6px">
                <div style="width:${pct}%;height:100%;background:${barColor};border-radius:2px;transition:width 0.3s"></div>
              </div>
              <div style="display:flex;gap:5px">
                <button class="primary-action" data-wr-mc-intervene="${id}" data-wr-mc-val="0.9"
                  style="flex:1;padding:3px 6px;font-size:9px">HI</button>
                <button class="primary-action" data-wr-mc-intervene="${id}" data-wr-mc-val="0.1"
                  style="flex:1;padding:3px 6px;font-size:9px">LO</button>
                ${clamped ? `<button class="primary-action" data-wr-mc-intervene="${id}" data-wr-mc-val="release"
                  style="flex:1;padding:3px 6px;font-size:9px;opacity:0.6">FREE</button>` : ""}
              </div>
            </div>`;
        }).join("")}
      </div>

      <!-- Sensitivity analysis -->
      <div class="node-kicker" style="margin-bottom:8px">Sensitivity — Impact on THREAT</div>
      <div class="data-card" style="padding:10px 12px;margin-bottom:4px">
        ${sensitivityRows}
      </div>
    ` : `
      <div class="data-card" style="text-align:center;padding:32px;color:#595f77">
        <span class="material-symbols-outlined" style="font-size:40px;display:block;margin-bottom:8px">scatter_plot</span>
        <div class="data-sm">Click <strong style="color:#38BDF8">Run Assessment</strong> to propagate beliefs through the causal DAG</div>
      </div>
    `}
  `;
}

// ─── Full HTML shell ──────────────────────────────────────────────────────────

function statusClass(status) {
  return { nominal: "chip chip-cyan", watch: "chip chip-amber", critical: "chip chip-red" }[status] ?? "chip chip-cyan";
}

function html(state) {
  const panel   = state.drillDown["war-room"]?.panel ?? "overview";
  const screens = getScreensForModule("war-room");
  const chain = getCausalChainSummary(state);

  return `
    <div class="viewport-head" style="margin-bottom:16px">
      <div>
        <div class="node-kicker">Ops Cell / W${state.system.week}</div>
        <h2>Theater Operations</h2>
        <p>Threat protocols, mission planning, turn engine, and causal cascade.</p>
      </div>
      <div class="hero-panel">
        <span class="chip chip-red">THREAT ${state.system.threat}</span>
        <span class="chip chip-amber">RISK ${chain.warRoomRiskCenter}±${chain.warRoomRiskSpread}</span>
        <span class="chip chip-cyan">W${state.system.week}</span>
        <span class="chip chip-amber">READY ${state.system.readiness}%</span>
      </div>
    </div>

    <div class="workspace-grid">
      <!-- Main panel -->
      <section class="panel panel-large">
        <div class="panel-head" style="margin-bottom:12px">
          <div><div class="node-kicker">Operations Terminal</div><h3>Theater Control</h3></div>
          <span class="chip chip-red">${state.system.threat} threat</span>
        </div>

        <div class="segmented" style="margin-bottom:16px">
          <button class="${panel === "overview"      ? "segment-active" : ""}" data-wr-panel="overview">Status</button>
          <button class="${panel === "turn-engine"   ? "segment-active" : ""}" data-wr-panel="turn-engine">Turn Engine</button>
          <button class="${panel === "causal"        ? "segment-active" : ""}" data-wr-panel="causal">Causal Graph</button>
          <button class="${panel === "monte-carlo"   ? "segment-active" : ""}" data-wr-panel="monte-carlo">Prob. Assessment</button>
        </div>

        <div id="wr-panel-body">
          ${panel === "overview"     ? panelOverview(state)     :
            panel === "turn-engine"  ? panelTurnEngine(state)   :
            panel === "causal"       ? panelCausal()            :
            panel === "monte-carlo"  ? panelMonteCarlo(state)   : ""}
        </div>
      </section>

      <!-- Screen rail -->
      <div class="panel">
        <div class="panel-head">
          <div><div class="node-kicker">Ops Cell Screens</div><h3>Navigation</h3></div>
          <span class="chip chip-cyan">${screens.length}</span>
        </div>
        <div class="screen-list">
          ${screens.map(s => `
            <button class="screen-row ${s.screenId === state.activeScreenId ? "screen-row-active" : ""}"
              data-wr-screen="${s.screenId}">
              ${s.screenId === state.activeScreenId ? '<span class="neon-line"></span>' : ""}
              <span class="material-symbols-outlined text-[17px]">${s.icon}</span>
              <span class="min-w-0 flex-1">
                <span class="block truncate text-ink">${s.title}</span>
              </span>
              <span class="${statusClass(s.status)}">${s.status}</span>
            </button>`).join("")}
        </div>
      </div>
    </div>
  `;
}

// ─── Canvas lifecycle ─────────────────────────────────────────────────────────

let _causal = null; // canvas element when causal panel is active
let _container = null;
let _onClick = null;

export function cleanup() {
  if (_container && _onClick) {
    _container.removeEventListener("click", _onClick);
  }
  _causal = null;
  _container = null;
  _onClick = null;
}

function initCausal(container, state) {
  const canvas = container.querySelector("#causal-canvas");
  if (!canvas) return null;
  canvas.width  = canvas.offsetWidth  || 720;
  canvas.height = canvas.offsetHeight || 420;
  drawCausalGraphWithBeliefs(canvas, state);
  return canvas;
}

// ─── Module exports ───────────────────────────────────────────────────────────

export function mount(container, state, dispatch) {
  cleanup();
  container.innerHTML = html(state);

  const panel = state.drillDown["war-room"]?.panel ?? "overview";
  if (panel === "causal") {
    _causal = initCausal(container, state);
  }

  function onClick(e) {
    // Panel tab switch
    const panelBtn = e.target.closest("[data-wr-panel]");
    if (panelBtn) {
      dispatch(updateDrillDownState, "war-room", { panel: panelBtn.dataset.wrPanel });
      return;
    }
    // Screen rail
    const screenBtn = e.target.closest("[data-wr-screen]");
    if (screenBtn) {
      dispatch(selectScreen, screenBtn.dataset.wrScreen);
      return;
    }
    // Lock strike solution
    const lockBtn = e.target.closest("[data-wr-lock]");
    if (lockBtn) { dispatch(lockStrikeSolution, lockBtn.dataset.wrLock); return; }
    // Initiate protocol
    const protoBtn = e.target.closest("[data-wr-protocol]");
    if (protoBtn) { dispatch(initiateThreatProtocol, protoBtn.dataset.wrProtocol); return; }
    // Advance / resolve week
    const advBtn = e.target.closest("[data-wr-advance]");
    if (advBtn) {
      const checked = [...container.querySelectorAll(".wr-directive:checked")].map(cb => cb.value);
      dispatch(advanceWarRoom, checked.length > 0 ? checked : []);
      return;
    }
    // Monte Carlo: run simulation
    const mcRun = e.target.closest("[data-wr-mc-run]");
    if (mcRun) { dispatch(updateCausalBeliefs); return; }
    // Monte Carlo: clear interventions
    const mcClear = e.target.closest("[data-wr-mc-clear]");
    if (mcClear) { dispatch(clearCausalInterventions); return; }
    // Monte Carlo: intervene on a node
    const mcIntervene = e.target.closest("[data-wr-mc-intervene]");
    if (mcIntervene) {
      const nodeId = mcIntervene.dataset.wrMcIntervene;
      const val = mcIntervene.dataset.wrMcVal;
      dispatch(setCausalIntervention, nodeId, val === "release" ? null : parseFloat(val));
      return;
    }
  }

  container.addEventListener("click", onClick);
  _container = container;
  _onClick = onClick;
  return cleanup;
}

export function update(container, state) {
  const panel = state.drillDown["war-room"]?.panel ?? "overview";

  if (panel === "causal") {
    if (_causal) {
      const tabs = container.querySelectorAll("[data-wr-panel]");
      tabs.forEach(btn => {
        btn.classList.toggle("segment-active", btn.dataset.wrPanel === "causal");
      });
      drawCausalGraphWithBeliefs(_causal, state);
      return;
    }
    _causal = null;
    container.innerHTML = html(state);
    _causal = initCausal(container, state);
    return;
  }

  // Non-causal panels (including monte-carlo): safe innerHTML
  _causal = null;
  container.innerHTML = html(state);
}
