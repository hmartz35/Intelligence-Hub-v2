/**
 * Space / ISR Intelligence Layer — refactored from generic solar-system orrery.
 *
 * Operationally relevant satellite and airborne ISR coverage visualization
 * over the Gulf / Hormuz theater. Replaces decorative planetary graphics.
 *
 * Models five collection assets:
 *   KH-13     — optical IMINT (LEO, 92-min orbit, NW→SE pass)
 *   SIGINT-1  — signals intelligence (LEO, 95-min orbit, NW→SE pass)
 *   SAR-1     — synthetic aperture radar / GEOINT (LEO, 97-min orbit, W→E pass)
 *   RQ-4      — Global Hawk HALE ISR (persistent 8h racetrack patrol, central Gulf)
 *   P-8A      — Poseidon ELINT/ASW (persistent 6h patrol, Gulf of Oman)
 *
 * State connections:
 *   spectrumIntegrity < 55  → SIGINT satellite collection degrades
 *   system.threat > limit   → airborne assets rerouted from theater
 *   actors.iran             → A2/AD exclusion zone radius near Bandar Abbas
 *   system.week             → seeds orbit phase so pass timing is campaign-consistent
 *
 * Panels:
 *   coverage   — animated canvas: ground tracks, footprints, A2/AD zone, key locations
 *   timeline   — next overhead pass per asset (T+Hh Mm relative to campaign week)
 *   collection — per-type (IMINT/SIGINT/GEOINT/ISR/ELINT) collection quality summary
 *   gaps       — key location coverage analysis: covered/uncovered, risk, covering asset
 *
 * Canvas-safe lifecycle (same pattern as drone-swarm.js):
 *   _isrCanvas, _animId module-scope refs
 *   destroyISRCanvas() cancels rAF + nulls refs
 *   update() guards on _isrCanvas before deciding innerHTML vs. targeted patch
 */

import { updateDrillDownState } from "../../hub-controller.js";

// ISR animation time: 20 sim-minutes per real second
// → a 92-min LEO orbit completes visually in ~4.6 real seconds
const ISR_TIME_SCALE = 20;

// Theater geographic bounds (slightly wider than Gulf-only for full sensor geometry)
const THEATER = { latMin: 21.5, latMax: 30.5, lngMin: 49.0, lngMax: 64.0 };

// Key intelligence locations used in coverage analysis and gap reporting
const KEY_LOCS = [
  { id: "hormuz",  label: "HORMUZ STRAIT",  lat: 26.6, lng: 56.4, type: "chokepoint" },
  { id: "bandar",  label: "BANDAR ABBAS",   lat: 27.2, lng: 56.4, type: "threat"     },
  { id: "bushehr", label: "BUSHEHR",        lat: 28.9, lng: 50.8, type: "threat"     },
  { id: "oman",    label: "GULF OF OMAN",   lat: 23.5, lng: 58.5, type: "maritime"   },
  { id: "gulf",    label: "PERSIAN GULF",   lat: 26.0, lng: 52.5, type: "maritime"   },
  { id: "udeid",   label: "AL UDEID AB",    lat: 25.1, lng: 51.3, type: "base"       },
  { id: "dhafra",  label: "AL DHAFRA AB",   lat: 24.2, lng: 54.5, type: "base"       },
];

// ISR collection asset definitions
// track: ground track entry/exit lat-lng through theater (satellite moves from lat0/lng0 → lat1/lng1)
// phaseOffset: 0–1 orbit phase offset — unique per asset, campaign-week seeds position
// footprintDeg: coverage ellipse radius in degrees (latitude and longitude scale independently)
// sigDegrades: true if spectrum jamming degrades this asset's collection
// threatLimit: system.threat threshold above which aircraft are rerouted
const ISR_ASSETS = [
  {
    id:             "KH-13",
    label:          "KH-13 Optical IMINT",
    shortLabel:     "KH IMINT",
    type:           "IMINT",
    color:          "#38BDF8",
    orbitPeriodMin: 92,
    revisitHours:   4.5,
    phaseOffset:    0.08,
    footprintDeg:   1.9,
    track:          { lat0: 30.5, lng0: 50.0, lat1: 22.0, lng1: 61.5 },
    sigDegrades:    false,   // optical collection not affected by EW jamming
    threatLimit:    90,
    isAircraft:     false,
  },
  {
    id:             "SIGINT-1",
    label:          "SIGINT Satellite",
    shortLabel:     "SIGINT SAT",
    type:           "SIGINT",
    color:          "#a78bfa",
    orbitPeriodMin: 95,
    revisitHours:   2.2,
    phaseOffset:    0.34,
    footprintDeg:   4.2,
    track:          { lat0: 29.5, lng0: 49.5, lat1: 22.0, lng1: 58.5 },
    sigDegrades:    true,    // spectrum jamming degrades signals collection
    threatLimit:    100,
    isAircraft:     false,
  },
  {
    id:             "SAR-1",
    label:          "SAR Radar (GEOINT)",
    shortLabel:     "SAR GEOINT",
    type:           "GEOINT",
    color:          "#34D399",
    orbitPeriodMin: 97,
    revisitHours:   3.8,
    phaseOffset:    0.62,
    footprintDeg:   2.7,
    track:          { lat0: 29.0, lng0: 49.0, lat1: 23.0, lng1: 64.0 },
    sigDegrades:    false,
    threatLimit:    100,
    isAircraft:     false,
  },
  {
    id:             "RQ-4",
    label:          "RQ-4 Global Hawk",
    shortLabel:     "RQ-4 HALE",
    type:           "ISR",
    color:          "#FB923C",
    orbitPeriodMin: 480,      // 8h patrol cycle
    revisitHours:   0,        // persistent — always patrolling
    phaseOffset:    0.15,
    footprintDeg:   1.4,
    track:          { lat0: 25.5, lng0: 51.5, lat1: 26.0, lng1: 58.0 },
    sigDegrades:    false,
    threatLimit:    72,       // rerouted if threat exceeds this
    isAircraft:     true,
  },
  {
    id:             "P-8A",
    label:          "P-8A Poseidon ELINT",
    shortLabel:     "P-8 ELINT",
    type:           "ELINT",
    color:          "#FBBF24",
    orbitPeriodMin: 360,      // 6h patrol cycle
    revisitHours:   0,
    phaseOffset:    0.58,
    footprintDeg:   2.4,
    track:          { lat0: 22.5, lng0: 55.0, lat1: 23.5, lng1: 62.5 },
    sigDegrades:    false,
    threatLimit:    78,
    isAircraft:     true,
  },
];

// ─── Module-scope canvas state ────────────────────────────────────────────────

let _isrCanvas = null;
let _animId    = null;
let _simMin    = 0;       // accumulated sim-minutes (seeded from campaign week)
let _lastNow   = 0;
let _isrState  = null;    // latest state ref, updated every dispatch
let _container = null;
let _onClick   = null;

// ─── Coordinate mapping ───────────────────────────────────────────────────────

function geo2px(lat, lng, W, H) {
  return {
    x: ((lng - THEATER.lngMin) / (THEATER.lngMax - THEATER.lngMin)) * W,
    y: ((THEATER.latMax - lat) / (THEATER.latMax - THEATER.latMin)) * H,
  };
}

// ─── Asset position at a given sim-minute ────────────────────────────────────

function assetPos(asset, simMin) {
  const phase = ((asset.phaseOffset + simMin / asset.orbitPeriodMin) % 1 + 1) % 1;

  if (asset.isAircraft) {
    // Racetrack: 0→1 outbound leg, 1→0 return leg — always overhead
    const t = phase < 0.5 ? phase * 2 : (1 - phase) * 2;
    return {
      lat: asset.track.lat0 + t * (asset.track.lat1 - asset.track.lat0),
      lng: asset.track.lng0 + t * (asset.track.lng1 - asset.track.lng0),
      overhead: true,
      t,
    };
  }

  // Satellite: overhead during first 45% of orbit (theater crossing), off-canvas for remainder
  if (phase < 0.45) {
    const t = phase / 0.45;
    return {
      lat: asset.track.lat0 + t * (asset.track.lat1 - asset.track.lat0),
      lng: asset.track.lng0 + t * (asset.track.lng1 - asset.track.lng0),
      overhead: true,
      t,
    };
  }

  return { overhead: false, minutesToPass: (1 - phase) * asset.orbitPeriodMin };
}

// ─── Asset degradation status ─────────────────────────────────────────────────

function assetDegradation(asset, state) {
  const si     = state.system.spectrumIntegrity;
  const threat = state.system.threat;

  if (asset.sigDegrades && si < 55) {
    return { degraded: true, reason: `SI ${si}% — SIGINT collection degraded` };
  }
  if (threat > asset.threatLimit) {
    return { degraded: true, reason: `THREAT ${threat} — rerouted from theater` };
  }
  return { degraded: false, reason: null };
}

// ─── Coverage analysis (for timeline / gaps / collection panels) ──────────────

function coverageAnalysis(state, simMin) {
  return KEY_LOCS.map(loc => {
    for (const asset of ISR_ASSETS) {
      const pos = assetPos(asset, simMin);
      if (!pos.overhead) continue;
      const { degraded } = assetDegradation(asset, state);
      const dist = Math.hypot(loc.lat - pos.lat, loc.lng - pos.lng);
      if (dist < asset.footprintDeg) {
        return { ...loc, covered: true, quality: degraded ? "degraded" : "nominal", asset };
      }
    }
    return { ...loc, covered: false, quality: "none", asset: null };
  });
}

// ─── Pass schedule (next overhead window per asset) ───────────────────────────

function passSchedule(state, simMin) {
  return ISR_ASSETS.map(asset => {
    const { degraded, reason } = assetDegradation(asset, state);

    if (asset.isAircraft) {
      return { asset, persistent: true, degraded, reason };
    }

    const phase = ((asset.phaseOffset + simMin / asset.orbitPeriodMin) % 1 + 1) % 1;

    if (phase < 0.45) {
      // Currently overhead
      const durationMin = Math.round((0.45 - phase) * asset.orbitPeriodMin);
      return { asset, currentlyOverhead: true, durationMin, degraded, reason };
    }

    const minutesToPass = Math.round((1 - phase) * asset.orbitPeriodMin);
    const h = Math.floor(minutesToPass / 60);
    const m = minutesToPass % 60;
    return { asset, minutesToPass, h, m, degraded, reason };
  });
}

// ─── Canvas draw ──────────────────────────────────────────────────────────────

function drawISR(canvas, state, simMin) {
  const ctx  = canvas.getContext("2d");
  const W    = canvas.width;
  const H    = canvas.height;
  const iran = state.system.actors?.iran ?? 0.55;
  const si   = state.system.spectrumIntegrity;
  const thr  = state.system.threat;

  // Background
  ctx.fillStyle = "#06090E";
  ctx.fillRect(0, 0, W, H);

  // Tactical grid
  ctx.lineWidth = 0.5;
  ctx.strokeStyle = "rgba(56,189,248,0.05)";
  const gW = W / 15, gH = H / 9;
  for (let x = 0; x <= W; x += gW) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y <= H; y += gH) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  // ── A2/AD exclusion zone (centered on Bandar Abbas, scales with Iran hostility) ──
  {
    const p = geo2px(27.2, 56.4, W, H);
    const r = 30 + Math.max(0, (iran - 0.40) / 0.60) * 110; // 30–140px
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
    const a = 0.07 + iran * 0.13;
    g.addColorStop(0,   `rgba(255,50,50,${Math.min(0.35, a * 2).toFixed(2)})`);
    g.addColorStop(0.5, `rgba(255,50,50,${a.toFixed(2)})`);
    g.addColorStop(1,   "rgba(255,50,50,0)");
    ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fillStyle = g; ctx.fill();
    if (iran > 0.5) {
      ctx.setLineDash([4, 6]);
      ctx.strokeStyle = `rgba(255,70,70,${(0.15 + iran * 0.45).toFixed(2)})`;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
    }
    if (iran > 0.65) {
      ctx.font = "bold 7px 'JetBrains Mono', monospace";
      ctx.fillStyle = `rgba(255,80,80,${(0.5 + iran * 0.4).toFixed(2)})`;
      ctx.textAlign = "center";
      ctx.fillText("A2/AD ACTIVE", p.x, p.y - r - 5);
    }
  }

  // ── Ground tracks (faint dashed orbital paths) ──
  ctx.setLineDash([3, 7]);
  ctx.lineWidth = 0.7;
  for (const asset of ISR_ASSETS) {
    const s = geo2px(asset.track.lat0, asset.track.lng0, W, H);
    const e = geo2px(asset.track.lat1, asset.track.lng1, W, H);
    ctx.strokeStyle = asset.color + "1A";
    ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(e.x, e.y); ctx.stroke();
  }
  ctx.setLineDash([]);

  // ── Coverage footprints (overhead assets only) ──
  const latScale = H / (THEATER.latMax - THEATER.latMin);
  const lngScale = W / (THEATER.lngMax - THEATER.lngMin);

  for (const asset of ISR_ASSETS) {
    const pos = assetPos(asset, simMin);
    if (!pos.overhead) continue;

    const { degraded } = assetDegradation(asset, state);
    const c  = geo2px(pos.lat, pos.lng, W, H);
    const rx = asset.footprintDeg * lngScale;
    const ry = asset.footprintDeg * latScale;

    // Fill gradient
    const fillAlpha = degraded ? "14" : "28";
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = asset.color + fillAlpha;
    ctx.fill();

    // Outline
    ctx.lineWidth = 1.5;
    if (degraded) ctx.setLineDash([3, 4]);
    ctx.strokeStyle = asset.color + (degraded ? "50" : "99");
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Center dot
    ctx.beginPath();
    ctx.arc(c.x, c.y, degraded ? 3 : 4, 0, Math.PI * 2);
    ctx.fillStyle = degraded ? "rgba(255,120,100,0.85)" : asset.color;
    ctx.fill();

    // Asset label — clamped so large footprints (e.g. SIGINT 4.2°) don't push text off-canvas
    ctx.font = "bold 7px 'JetBrains Mono', monospace";
    ctx.fillStyle = degraded ? "rgba(255,120,100,0.9)" : asset.color;
    ctx.textAlign = "center";
    const labelY = Math.max(12, c.y - Math.min(ry, c.y - 12) - 5);
    ctx.fillText(asset.shortLabel, c.x, labelY);
    if (degraded) {
      ctx.font = "6px 'JetBrains Mono', monospace";
      ctx.fillStyle = "rgba(255,150,100,0.75)";
      const degradedY = Math.min(H - 5, c.y + Math.min(ry, H - c.y - 5) + 10);
      ctx.fillText("DEGRADED", c.x, degradedY);
    }
  }

  // ── Key location markers ──
  for (const loc of KEY_LOCS) {
    const p = geo2px(loc.lat, loc.lng, W, H);
    if (p.x < 4 || p.x > W - 4 || p.y < 4 || p.y > H - 4) continue;

    const color = loc.type === "threat"     ? "rgba(255,80,80,0.75)"
                : loc.type === "chokepoint" ? "rgba(255,186,32,0.85)"
                : loc.type === "base"       ? "rgba(56,189,248,0.65)"
                :                             "rgba(100,160,200,0.5)";

    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = color; ctx.fill();

    ctx.font = "7px 'JetBrains Mono', monospace";
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.fillText(loc.label, p.x, p.y - 6);
  }

  // ── HUD: threat + SI status (bottom-right) ──
  ctx.font = "8px 'JetBrains Mono', monospace";
  ctx.textAlign = "right";
  ctx.fillStyle = thr > 70 ? "rgba(255,100,100,0.85)" : "rgba(56,189,248,0.6)";
  ctx.fillText(`THREAT ${thr}`, W - 8, H - 18);
  ctx.fillStyle = si < 55 ? "rgba(255,186,32,0.85)" : "rgba(56,189,248,0.6)";
  ctx.fillText(`SPECTRUM ${si}%`, W - 8, H - 7);

  // ── Legend (top-left) ──
  const legend = [
    { color: "#38BDF8", label: "IMINT"  },
    { color: "#a78bfa", label: "SIGINT" },
    { color: "#34D399", label: "GEOINT" },
    { color: "#FB923C", label: "ISR"    },
    { color: "#FBBF24", label: "ELINT"  },
  ];
  ctx.font = "7px 'JetBrains Mono', monospace";
  ctx.textAlign = "left";
  legend.forEach((item, i) => {
    ctx.fillStyle = item.color;
    ctx.fillRect(8, 8 + i * 14, 8, 7);
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.fillText(item.label, 20, 15 + i * 14);
  });
}

// ─── Canvas lifecycle ─────────────────────────────────────────────────────────

function initISRCanvas(container, state) {
  destroyISRCanvas();
  const mount = container.querySelector("#isr-canvas-mount");
  if (!mount) return;

  mount.innerHTML = "";
  const W = mount.clientWidth || 620;
  const H = 340;
  const canvas       = document.createElement("canvas");
  canvas.width       = W;
  canvas.height      = H;
  canvas.style.cssText = "display:block;width:100%;height:100%";
  mount.appendChild(canvas);

  _isrCanvas = canvas;
  _isrState  = state;
  // Seed sim-minutes from campaign week so pass timing is campaign-consistent
  _simMin    = state.system.week * 7 * 24 * 60;
  _lastNow   = performance.now();

  function loop(now) {
    _animId = requestAnimationFrame(loop);
    const dt = Math.min(0.1, (now - _lastNow) / 1000);
    _lastNow = now;
    _simMin += dt * ISR_TIME_SCALE;
    if (_isrState) drawISR(_isrCanvas, _isrState, _simMin);
  }
  loop(performance.now());
}

function destroyISRCanvas() {
  if (_animId !== null) { cancelAnimationFrame(_animId); _animId = null; }
  if (_isrCanvas?.parentNode) _isrCanvas.parentNode.removeChild(_isrCanvas);
  _isrCanvas = null;
  _isrState  = null;
}

export function cleanup() {
  if (_container && _onClick) {
    _container.removeEventListener("click", _onClick);
  }
  destroyISRCanvas();
  _container = null;
  _onClick = null;
}

// ─── HTML panels ─────────────────────────────────────────────────────────────

function panelCoverage(state) {
  const si  = state.system.spectrumIntegrity;
  const thr = state.system.threat;
  return `
    <div class="panel-head" style="margin-bottom:8px">
      <div><div class="node-kicker">Live Theater Coverage</div><h3>ISR Footprints</h3></div>
      <span class="chip chip-cyan">live</span>
    </div>
    <p class="data-sm text-muted" style="margin-bottom:8px;line-height:1.5">
      Animated ground tracks and sensor footprints over Gulf / Hormuz theater.
      A2/AD zone (red) expands with Iran hostility — blocks collection near Bandar Abbas.
      SIGINT degrades when spectrum integrity drops below 55%.
    </p>
    <div id="isr-canvas-mount"
      style="width:100%;height:340px;background:rgba(6,9,14,0.9);border:1px solid rgba(56,189,248,0.15);border-radius:4px;overflow:hidden">
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:10px">
      ${ISR_ASSETS.map(a => {
        const { degraded, reason } = assetDegradation(a, state);
        return `
          <div style="display:flex;align-items:center;gap:6px">
            <span style="width:8px;height:8px;border-radius:50%;background:${degraded ? "#FF6B6B" : a.color};display:inline-block"></span>
            <span class="data-sm" style="color:${degraded ? "rgba(255,150,100,0.85)" : "rgba(255,255,255,0.6)"}">
              ${a.shortLabel}${degraded ? " ⚠ " + reason.split("—")[0].trim() : ""}
            </span>
          </div>`;
      }).join("")}
    </div>
  `;
}

function panelTimeline(state) {
  const simMin  = state.system.week * 7 * 24 * 60;
  const entries = passSchedule(state, simMin);
  return `
    <div class="panel-head" style="margin-bottom:8px">
      <div><div class="node-kicker">W${state.system.week} Pass Schedule</div><h3>Overhead Windows</h3></div>
    </div>
    <div class="planet-table">
      <div class="planet-row" style="color:#595f77;font-size:10px;padding-top:0">
        <span>ASSET</span><span>TYPE</span><span>NEXT PASS</span><span>STATUS</span>
      </div>
      ${entries.map(e => {
        const passLabel = e.persistent          ? "PERSISTENT"
                        : e.currentlyOverhead   ? `OVERHEAD ~${e.durationMin}m left`
                        : `T+${e.h}h ${e.m}m`;
        const statusLabel = e.degraded ? "DEGRADED" : e.persistent || e.currentlyOverhead ? "ACTIVE" : "NOMINAL";
        const statusColor = e.degraded ? "chip-red" : e.currentlyOverhead || e.persistent ? "chip-cyan" : "chip-amber";
        return `
          <div class="planet-row">
            <span class="font-semibold text-ink">${e.asset.shortLabel}</span>
            <span style="color:${e.asset.color}">${e.asset.type}</span>
            <span class="text-amber">${passLabel}</span>
            <span class="chip ${statusColor}" style="font-size:9px">${statusLabel}</span>
          </div>
        `;
      }).join("")}
    </div>
    <div class="data-sm text-muted" style="margin-top:10px;line-height:1.6">
      Revisit intervals: KH IMINT 4.5h · SIGINT SAT 2.2h · SAR GEOINT 3.8h · Aircraft persistent.
      Times are estimated from campaign week ${state.system.week} orbit phase.
    </div>
  `;
}

function panelCollection(state) {
  const simMin = state.system.week * 7 * 24 * 60;
  const si  = state.system.spectrumIntegrity;
  const thr = state.system.threat;

  const types = [
    { type: "IMINT",  label: "Imagery Intelligence",      assets: ["KH-13"]     },
    { type: "SIGINT", label: "Signals Intelligence",       assets: ["SIGINT-1"]  },
    { type: "GEOINT", label: "Geospatial Intelligence",    assets: ["SAR-1"]     },
    { type: "ISR",    label: "Airborne Recce (HALE)",      assets: ["RQ-4"]      },
    { type: "ELINT",  label: "Electronic Intel / ASW",     assets: ["P-8A"]      },
  ];

  return `
    <div class="panel-head" style="margin-bottom:8px">
      <div><div class="node-kicker">Collection Status</div><h3>Intelligence Domains</h3></div>
    </div>
    <div class="grid gap-3">
      ${types.map(({ type, label, assets: ids }) => {
        const assetList = ids.map(id => ISR_ASSETS.find(a => a.id === id));
        const contributions = assetList.map(a => {
          const pos = assetPos(a, simMin);
          const { degraded, reason } = assetDegradation(a, state);
          const overhead = pos.overhead;
          const quality  = !overhead ? "no coverage" : degraded ? "degraded" : "nominal";
          return { a, overhead, degraded, quality, reason };
        });
        const anyNominal   = contributions.some(c => c.overhead && !c.degraded);
        const anyDegraded  = contributions.some(c => c.overhead && c.degraded);
        const noCoverage   = contributions.every(c => !c.overhead);
        const qualityPct   = anyNominal ? 100 : anyDegraded ? 55 : 0;
        const barColor     = anyNominal ? "#38BDF8" : anyDegraded ? "#FBBF24" : "#FF4444";
        const chipClass    = anyNominal ? "chip-cyan" : anyDegraded ? "chip-amber" : "chip-red";
        const chipLabel    = anyNominal ? "NOMINAL" : anyDegraded ? "DEGRADED" : "NO COVERAGE";
        const note         = contributions.map(c => c.reason).filter(Boolean)[0]
                           || (noCoverage ? "asset not overhead" : "");
        return `
          <div class="data-card">
            <div style="display:flex;justify-content:space-between;align-items:flex-start">
              <div>
                <div class="node-kicker">${type}</div>
                <div class="data-sm text-muted">${label}</div>
              </div>
              <span class="chip ${chipClass}" style="font-size:9px">${chipLabel}</span>
            </div>
            <div style="height:4px;background:rgba(255,255,255,0.06);border-radius:2px;overflow:hidden;margin-top:8px">
              <div style="height:100%;width:${qualityPct}%;background:${barColor};transition:width 0.5s"></div>
            </div>
            ${note ? `<div class="data-sm text-muted" style="margin-top:4px">${note}</div>` : ""}
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function panelGaps(state) {
  const simMin  = state.system.week * 7 * 24 * 60;
  const coverage = coverageAnalysis(state, simMin);
  const uncovered = coverage.filter(c => !c.covered || c.quality === "degraded");
  const covered   = coverage.filter(c => c.covered && c.quality === "nominal");

  const riskColor = (loc) =>
    loc.type === "threat" || loc.type === "chokepoint" ? "#FF4444" : "#FBBF24";

  return `
    <div class="panel-head" style="margin-bottom:8px">
      <div><div class="node-kicker">Coverage Gap Analysis</div><h3>Blind Spots / Risk</h3></div>
      <span class="chip ${uncovered.length > 2 ? "chip-red" : "chip-amber"}">${uncovered.length} gaps</span>
    </div>
    <div class="data-sm text-muted" style="margin-bottom:10px">
      Locations with no nominal ISR coverage at W${state.system.week} orbit phase.
      High-priority targets without coverage represent collection risk.
    </div>
    <div class="grid gap-2" style="margin-bottom:14px">
      ${coverage.map(loc => {
        const icon      = loc.covered && loc.quality === "nominal" ? "✓" : loc.quality === "degraded" ? "⚠" : "✕";
        const iconColor = loc.covered && loc.quality === "nominal" ? "#34D399" : loc.quality === "degraded" ? "#FBBF24" : "#FF6666";
        const typeColor = loc.type === "threat" ? "rgba(255,80,80,0.8)"
                        : loc.type === "chokepoint" ? "rgba(255,186,32,0.9)"
                        : "rgba(56,189,248,0.7)";
        const coverLabel = loc.covered && loc.quality === "nominal"
                          ? `${loc.asset.shortLabel}`
                          : loc.quality === "degraded"
                          ? `${loc.asset.shortLabel} (degraded)`
                          : "UNCOVERED";
        const riskLabel = (!loc.covered || loc.quality !== "nominal") && (loc.type === "threat" || loc.type === "chokepoint")
                         ? "HIGH RISK" : "";
        return `
          <div class="data-card" style="border-color:${!loc.covered ? "rgba(255,80,80,0.2)" : "rgba(56,189,248,0.1)"}">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span class="font-semibold text-ink" style="font-size:11px">${loc.label}</span>
              <div style="display:flex;gap:6px;align-items:center">
                ${riskLabel ? `<span class="chip chip-red" style="font-size:8px">${riskLabel}</span>` : ""}
                <span style="color:${iconColor};font-weight:bold">${icon} ${coverLabel}</span>
              </div>
            </div>
            <div class="data-sm text-muted" style="margin-top:2px">
              ${loc.type.toUpperCase()} — ${loc.lat.toFixed(1)}°N ${loc.lng.toFixed(1)}°E
            </div>
          </div>
        `;
      }).join("")}
    </div>
    <div class="data-card" style="border-color:rgba(251,191,36,0.2)">
      <div class="node-kicker">Collection Summary</div>
      <div style="display:flex;gap:20px;margin-top:8px">
        <div>
          <div class="metric-value text-cyan" style="font-size:2rem">${covered.length}</div>
          <div class="data-sm text-muted">nominal coverage</div>
        </div>
        <div>
          <div class="metric-value text-amber" style="font-size:2rem">${coverage.filter(c=>c.quality==="degraded").length}</div>
          <div class="data-sm text-muted">degraded</div>
        </div>
        <div>
          <div class="metric-value" style="font-size:2rem;color:#FF6666">${coverage.filter(c=>!c.covered).length}</div>
          <div class="data-sm text-muted">uncovered</div>
        </div>
      </div>
    </div>
  `;
}

// ─── Active panel helper ──────────────────────────────────────────────────────

// Hub-controller initialises all drillDown panels as "overview".
// Normalise any unrecognised value (including "overview") to "coverage".
function activePanel(state) {
  const p = state.drillDown?.["planets"]?.panel ?? "coverage";
  return ["timeline", "collection", "gaps"].includes(p) ? p : "coverage";
}

// ─── HTML shell ───────────────────────────────────────────────────────────────

function html(state) {
  const panel = activePanel(state);
  const si    = state.system.spectrumIntegrity;
  const thr   = state.system.threat;
  const iran  = state.system.actors?.iran ?? 0.55;

  const panelContent = panel === "timeline"   ? panelTimeline(state)
                     : panel === "collection" ? panelCollection(state)
                     : panel === "gaps"       ? panelGaps(state)
                     :                          panelCoverage(state);

  return `
    <div class="viewport-head" style="margin-bottom:16px">
      <div>
        <div class="node-kicker">Space / ISR Intelligence / W${state.system.week}</div>
        <h2>ISR Coverage — Gulf Theater</h2>
        <p>Satellite and airborne ISR collection windows, sensor footprints, and coverage gaps over the Strait of Hormuz.</p>
      </div>
      <div class="hero-panel">
        <span class="chip ${si < 55 ? "chip-amber" : "chip-cyan"}">SI ${si}%</span>
        <span class="chip ${thr > 70 ? "chip-red" : "chip-amber"}">THREAT ${thr}</span>
        <span class="chip ${iran > 0.65 ? "chip-red" : "chip-amber"}">IRAN ${Math.round(iran * 100)}%</span>
      </div>
    </div>

    <div class="workspace-grid" style="margin-bottom:12px">
      <section class="panel panel-large">
        <div class="segmented" style="margin-bottom:16px">
          ${["coverage","timeline","collection","gaps"].map(p => `
            <button class="${panel === p ? "segment-active" : ""}" data-pl-panel="${p}">${p}</button>
          `).join("")}
        </div>
        ${panelContent}
      </section>

      <div class="panel">
        <div class="panel-head">
          <div><div class="node-kicker">ISR Assets</div><h3>Collection Status</h3></div>
          <span class="chip chip-cyan">${ISR_ASSETS.length}</span>
        </div>
        <div class="grid gap-2" style="margin-bottom:16px">
          ${ISR_ASSETS.map(a => {
            const { degraded, reason } = assetDegradation(a, state);
            const simMin  = state.system.week * 7 * 24 * 60;
            const pos = assetPos(a, simMin);
            const statusLabel = degraded          ? "DEGRADED"
                              : a.isAircraft      ? "PATROL"
                              : pos.overhead      ? "OVERHEAD"
                              :                     "NEXT PASS";
            const statusChip = degraded ? "chip-red" : pos.overhead || a.isAircraft ? "chip-cyan" : "chip-amber";
            return `
              <div class="data-card" style="padding:10px;border-color:${degraded ? "rgba(255,80,80,0.25)" : "rgba(56,189,248,0.12)"}">
                <div style="display:flex;justify-content:space-between;align-items:flex-start">
                  <div>
                    <div class="node-kicker" style="color:${a.color}">${a.type}</div>
                    <div class="data-sm font-semibold text-ink">${a.shortLabel}</div>
                  </div>
                  <span class="chip ${statusChip}" style="font-size:9px">${statusLabel}</span>
                </div>
                ${reason ? `<div class="data-sm" style="color:rgba(255,150,100,0.8);margin-top:4px">${reason}</div>` : ""}
              </div>
            `;
          }).join("")}
        </div>

        <div class="node-kicker" style="margin-bottom:8px">Theater Conditions</div>
        ${[
          { label: "Spectrum Integrity", value: si + "%", warn: si < 55 },
          { label: "Threat Level",       value: thr,      warn: thr > 70 },
          { label: "Iran Hostility",     value: Math.round(iran * 100) + "%", warn: iran > 0.65 },
          { label: "Campaign Week",      value: "W" + state.system.week, warn: false },
        ].map(({ label, value, warn }) => `
          <div style="display:flex;justify-content:space-between;margin-bottom:6px">
            <span class="data-sm text-muted">${label}</span>
            <span class="data-sm ${warn ? "text-amber" : "text-cyan"}">${value}</span>
          </div>
        `).join("")}

        <div class="node-kicker" style="margin-top:12px;margin-bottom:6px">Collection Types</div>
        ${[
          { color: "#38BDF8", label: "IMINT — optical imaging" },
          { color: "#a78bfa", label: "SIGINT — signals intel" },
          { color: "#34D399", label: "GEOINT — SAR radar" },
          { color: "#FB923C", label: "ISR — HALE recce" },
          { color: "#FBBF24", label: "ELINT — electronic / ASW" },
        ].map(({ color, label }) => `
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:5px">
            <span style="width:8px;height:8px;border-radius:50%;background:${color};flex-shrink:0"></span>
            <span class="data-sm text-muted">${label}</span>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

// ─── Module exports ───────────────────────────────────────────────────────────

export function mount(container, state, dispatch) {
  cleanup();
  container.innerHTML = html(state);

  if (activePanel(state) === "coverage") initISRCanvas(container, state);

  function onClick(e) {
    const btn = e.target.closest("[data-pl-panel]");
    if (!btn) return;
    dispatch(updateDrillDownState, "planets", { panel: btn.dataset.plPanel });
  }

  container.addEventListener("click", onClick);
  _container = container;
  _onClick = onClick;
  return cleanup;
}

export function update(container, state) {
  _isrState = state;

  if (activePanel(state) === "coverage" && _isrCanvas) {
    // Canvas alive — state update feeds through _isrState into rAF loop automatically.
    // Patch only the header chips so we don't touch the canvas mount.
    const si   = state.system.spectrumIntegrity;
    const thr  = state.system.threat;
    const iran = state.system.actors?.iran ?? 0.55;
    const head = container.querySelector(".viewport-head .hero-panel");
    if (head) {
      head.innerHTML = `
        <span class="chip ${si < 55 ? "chip-amber" : "chip-cyan"}">SI ${si}%</span>
        <span class="chip ${thr > 70 ? "chip-red" : "chip-amber"}">THREAT ${thr}</span>
        <span class="chip ${iran > 0.65 ? "chip-red" : "chip-amber"}">IRAN ${Math.round(iran * 100)}%</span>
      `;
    }
    // Re-render right panel (asset status + theater conditions; no canvas in right panel)
    const rightPanel = container.querySelector(".panel:not(.panel-large)");
    if (rightPanel) {
      // Targeted innerHTML for the right panel (no canvas involved)
      rightPanel.innerHTML = `
        <div class="panel-head">
          <div><div class="node-kicker">ISR Assets</div><h3>Collection Status</h3></div>
          <span class="chip chip-cyan">${ISR_ASSETS.length}</span>
        </div>
        <div class="grid gap-2" style="margin-bottom:16px">
          ${ISR_ASSETS.map(a => {
            const { degraded, reason } = assetDegradation(a, state);
            const simMin  = state.system.week * 7 * 24 * 60;
            const pos = assetPos(a, simMin);
            const statusLabel = degraded ? "DEGRADED" : a.isAircraft ? "PATROL" : pos.overhead ? "OVERHEAD" : "NEXT PASS";
            const statusChip  = degraded ? "chip-red" : pos.overhead || a.isAircraft ? "chip-cyan" : "chip-amber";
            return `
              <div class="data-card" style="padding:10px;border-color:${degraded ? "rgba(255,80,80,0.25)" : "rgba(56,189,248,0.12)"}">
                <div style="display:flex;justify-content:space-between;align-items:flex-start">
                  <div>
                    <div class="node-kicker" style="color:${a.color}">${a.type}</div>
                    <div class="data-sm font-semibold text-ink">${a.shortLabel}</div>
                  </div>
                  <span class="chip ${statusChip}" style="font-size:9px">${statusLabel}</span>
                </div>
                ${reason ? `<div class="data-sm" style="color:rgba(255,150,100,0.8);margin-top:4px">${reason}</div>` : ""}
              </div>
            `;
          }).join("")}
        </div>
        <div class="node-kicker" style="margin-bottom:8px">Theater Conditions</div>
        ${[
          { label: "Spectrum Integrity", value: si + "%",                      warn: si < 55 },
          { label: "Threat Level",       value: thr,                           warn: thr > 70 },
          { label: "Iran Hostility",     value: Math.round(iran * 100) + "%",  warn: iran > 0.65 },
          { label: "Campaign Week",      value: "W" + state.system.week,       warn: false },
        ].map(({ label, value, warn }) => `
          <div style="display:flex;justify-content:space-between;margin-bottom:6px">
            <span class="data-sm text-muted">${label}</span>
            <span class="data-sm ${warn ? "text-amber" : "text-cyan"}">${value}</span>
          </div>
        `).join("")}
      `;
    }
    return;
  }

  // Panel switch or canvas not alive — full re-render
  destroyISRCanvas();
  container.innerHTML = html(state);
  if (activePanel(state) === "coverage") initISRCanvas(container, state);
}
