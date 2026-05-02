/**
 * Executive Briefing module — decision-grade reports, briefing tools, policy tools.
 *
 * Data sources:
 *   EXECUTIVE_BRIEFING_TOOLS → 4 tools: impact-report, decision-log, scenario-builder, final-brief
 *   state.system.log          → command log (full history for briefing collation)
 *   state.system              → all current metrics for report generation
 *   state.strikePlanner       → locked solution for decision log
 *   state.threatMatrix        → active protocol for decision log
 *   getScreensForModule("executive-briefing") → 14 screens
 *
 * Outputs updated dynamically:
 *   - Briefing tool cards (each navigates to its associated screen)
 *   - Auto-generated situation report from current state
 *   - Decision log (strike locks + protocol activations from system log)
 *   - Screen rail for all 14 executive screens
 *
 * Events dispatched:
 *   selectScreen(state, screenId)
 *
 * Phase 8 will add: full report generation engine, PDF export stub,
 *   principal utility matrix (6 principals × 4 policy tracks).
 */

import {
  EXECUTIVE_BRIEFING_TOOLS,
  getScreensForModule,
  selectScreen,
  COMMAND_CENTER_PATHS
} from "../../hub-controller.js";

function generateSitRep(state) {
  const threat = state.system.threat;
  const readiness = state.system.readiness;
  const hormuz = state.system.hormuzEscalation;
  const si = state.system.spectrumIntegrity;
  const week = state.system.week;

  const threatLevel = threat > 70 ? "CRITICAL" : threat > 50 ? "ELEVATED" : "MANAGED";
  const readinessLevel = readiness > 80 ? "OPTIMAL" : readiness > 60 ? "ADEQUATE" : "DEGRADED";

  return `
    WEEK ${week} SITUATION REPORT
    ─────────────────────────────────────────
    THREAT STATUS:    ${threatLevel} (${threat} / 100)
    FORCE READINESS:  ${readinessLevel} (${readiness}%)
    SPECTRUM:         ${si >= 70 ? "NOMINAL" : "DEGRADED"} (${si}%)
    HORMUZ INDEX:     ${hormuz} / 100
    SWARM COHESION:   ${state.system.swarmCohesion}%
    CONFIDENCE:       ${state.system.confidence}%
    ─────────────────────────────────────────
    STRIKE SOLUTION:  ${state.strikePlanner.lockedSolutionId ?? "NONE LOCKED"}
    ACTIVE PROTOCOL:  ${state.threatMatrix.activeProtocolId ?? "NONE ACTIVE"}
    LOCKS ISSUED:     ${state.strikePlanner.lockCount}
    PROTOCOLS:        ${state.threatMatrix.protocolCount}
    ─────────────────────────────────────────
    ASSESSMENT: Theater posture is ${readinessLevel.toLowerCase()}.
    ${threat > 60 ? "Escalation trajectory warrants principal review." : "Situation remains within operational parameters."}
  `.trim().split("\n").map(line => line.trim()).join("\n");
}

function toolSubView(tool, state) {
  return `
    <div class="panel" style="margin-bottom:12px">
      <div class="panel-head">
        <div><div class="node-kicker">${tool.motion}</div><h3>${tool.label}</h3></div>
        <span class="chip chip-cyan">active</span>
      </div>
      <pre style="font-family:'JetBrains Mono',monospace;font-size:11px;line-height:1.7;color:#8b9199;white-space:pre-wrap;background:rgba(6,9,14,0.7);border:1px solid rgba(34,48,68,1);padding:12px;margin:0">${generateSitRep(state)}</pre>
      <div class="data-card" style="margin-top:12px;border-color:rgba(14,165,233,0.2)">
        <div class="node-kicker">Motion State: ${tool.motion}</div>
        <p class="mt-2 text-xs leading-5 text-muted">
          Full ${tool.label} generation engine arrives in Phase 8 (principal utility matrix,
          PDF export, Principals Chamber deliberation).
        </p>
      </div>
    </div>
  `;
}

function html(state) {
  const screens = getScreensForModule("executive-briefing");
  const sitRep = generateSitRep(state);
  const activeTool = EXECUTIVE_BRIEFING_TOOLS.find(t => t.screenId === state.activeScreenId);
  if (activeTool) {
    return `
      <div class="viewport-head" style="margin-bottom:16px">
        <div>
          <div class="node-kicker">Executive Briefing / ${activeTool.label}</div>
          <h2>${activeTool.label}</h2>
          <p>Decision-grade briefing tool — W${state.system.week}.</p>
        </div>
        <div class="hero-panel">
          <span class="chip chip-red">TOP SECRET</span>
          <span class="chip chip-cyan">${activeTool.motion}</span>
          <button class="chip chip-amber" data-brief-back="true" style="cursor:pointer;border:none;background:transparent">← Back</button>
        </div>
      </div>
      ${toolSubView(activeTool, state)}
    `;
  }

  return `
    <div class="viewport-head" style="margin-bottom:16px">
      <div>
        <div class="node-kicker">Executive Briefing / W${state.system.week}</div>
        <h2>Decision-Grade Reports</h2>
        <p>Prepare principal-level briefings, scenario analyses, and impact assessments.</p>
      </div>
      <div class="hero-panel">
        <span class="chip chip-red">TOP SECRET</span>
        <span class="chip chip-cyan">${screens.length} tools</span>
        <span class="chip chip-amber">W${state.system.week}</span>
      </div>
    </div>

    <div class="workspace-grid" style="margin-bottom:12px">
      <div>
        <!-- Briefing tools -->
        <section class="panel" style="margin-bottom:12px">
          <div class="panel-head">
            <div><div class="node-kicker">Briefing Tools</div><h3>Motion States</h3></div>
          </div>
          <div class="grid gap-2">
            ${EXECUTIVE_BRIEFING_TOOLS.map(tool => `
              <button class="briefing-tool" data-brief-screen="${tool.screenId}">
                <span>${tool.label}</span>
                <span class="data-sm uppercase text-cyan">${tool.motion}</span>
              </button>
            `).join("")}
          </div>
        </section>

        <!-- Auto-generated Sit Rep -->
        <section class="panel" style="margin-bottom:12px">
          <div class="panel-head">
            <div><div class="node-kicker">Auto-Generated / W${state.system.week}</div><h3>Situation Report</h3></div>
            <span class="chip chip-cyan">live</span>
          </div>
          <pre style="font-family:'JetBrains Mono',monospace;font-size:11px;line-height:1.7;color:#8b9199;white-space:pre-wrap;background:rgba(6,9,14,0.7);border:1px solid rgba(34,48,68,1);padding:12px;margin:0">${sitRep}</pre>
        </section>

        <!-- Command log -->
        <section class="panel">
          <div class="panel-head">
            <div><div class="node-kicker">Decision Log</div><h3>Full Command History</h3></div>
            <span class="chip chip-cyan">${state.system.log.length} entries</span>
          </div>
          <div style="max-height:320px;overflow-y:auto">
            ${state.system.log.slice().reverse().map((e, i) => `
              <div class="log-entry">
                <span class="data-sm text-dim" style="margin-right:8px">${String(state.system.log.length - i).padStart(3,"0")}</span>
                ${e}
              </div>
            `).join("")}
          </div>
        </section>
      </div>

      <!-- Screen rail -->
      <div class="panel">
        <div class="panel-head">
          <div><div class="node-kicker">Executive Screens</div><h3>Navigation</h3></div>
          <span class="chip chip-cyan">${screens.length}</span>
        </div>
        <div class="screen-list">
          ${screens.map(s => `
            <button class="screen-row ${s.screenId === state.activeScreenId ? "screen-row-active" : ""}" data-brief-screen="${s.screenId}">
              ${s.screenId === state.activeScreenId ? '<span class="neon-line"></span>' : ""}
              <span class="material-symbols-outlined text-[17px]">${s.icon}</span>
              <span class="min-w-0 flex-1">
                <span class="block truncate text-ink">${s.title}</span>
                <span class="block truncate data-sm uppercase text-dim">${s.route.replace(COMMAND_CENTER_PATHS.baseRoute, "")}</span>
              </span>
            </button>
          `).join("")}
        </div>

        <!-- Phase 8 note -->
        <div class="data-card" style="margin-top:16px;border-color:rgba(14,165,233,0.2)">
          <div class="node-kicker">Phase 8 — Report Engine</div>
          <p class="mt-2 text-xs leading-5 text-muted">
            Principal utility matrix (6 principals × 4 policy tracks), PDF export, and
            Principals Chamber deliberation will be added in Phase 8.
          </p>
        </div>
      </div>
    </div>
  `;
}

export function mount(container, state, dispatch) {
  container.innerHTML = html(state);

  function onClick(e) {
    if (e.target.closest("[data-brief-back]")) {
      dispatch(state => ({ ...state, activeScreenId: null }));
      return;
    }
    const btn = e.target.closest("[data-brief-screen]");
    if (btn) dispatch(selectScreen, btn.dataset.briefScreen);
  }

  container.addEventListener("click", onClick);
  return () => container.removeEventListener("click", onClick);
}

export function update(container, state) {
  container.innerHTML = html(state);
}
