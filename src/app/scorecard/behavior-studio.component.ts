import { Component, computed, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface AgentBehaviorConfig {
  reasoningEffort: 'concise' | 'balanced' | 'deep';
  temperature: number;
  guardrailStrictness: 'standard' | 'strict' | 'permissive';
  promptStrategy: 'zero_shot' | 'few_shot' | 'dual_pass';
}

@Component({
  selector: 'app-behavior-studio',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="sc-card sc-studio">
      <div class="sc-studio-head">
        <div>
          <span class="sc-kicker">REAL-TIME BEHAVIOR TUNING, CONCEPT DRIFT &amp; RELEASE GATES (PHASE 2 &amp; 4)</span>
          <h2>Agent Behavior Studio &amp; Concept Drift Manager</h2>
          <p class="sc-muted">Monitor divergence between Golden Dataset Baseline vs. Online Sampling (Concept Drift &amp; PSI). Tune reasoning parameters in real-time to recover drifting metrics and enforce multi-stage CI/CD gates.</p>
        </div>
        <div class="sc-studio-badge">
          <span class="pulse-dot"></span> LIVE ENGINE LINKED
        </div>
      </div>

      <!-- CONCEPT DRIFT & CI/CD GATES STATUS CARD -->
      <div class="sc-drift-card">
        <div class="sc-drift-header">
          <div>
            <strong>Concept Drift Telemetry (BigQuery: agent_governance_ds)</strong>
            <span class="sc-muted">Comparing Golden Baseline vs. 5% Online Sampling Window</span>
          </div>
          <span class="sc-drift-tag" [class.drift-low]="driftSeverity() === 'LOW'" [class.drift-mod]="driftSeverity() === 'MODERATE'" [class.drift-high]="driftSeverity() === 'HIGH'">
            Drift Severity: {{ driftSeverity() }} (PSI: {{ psiScore().toFixed(2) }})
          </span>
        </div>

        <div class="sc-drift-metrics-grid">
          <div class="sc-drift-metric">
            <span>Golden Baseline Trajectory Match</span>
            <strong>{{ baselineAccuracy() }}%</strong>
            <small>Canonical dataset target</small>
          </div>
          <div class="sc-drift-metric">
            <span>Online Sampling Window</span>
            <strong [class.sc-warn]="onlineAccuracy() < 90">{{ onlineAccuracy() }}%</strong>
            <small>Last 24h rolling average</small>
          </div>
          <div class="sc-drift-metric">
            <span>Accuracy Drift (&Delta;)</span>
            <strong [class.sc-coral]="driftDelta() < -5" [class.sc-green]="driftDelta() >= 0">
              {{ driftDelta() >= 0 ? '+' : '' }}{{ driftDelta() }}%
            </strong>
            <small>Divergence from baseline</small>
          </div>
          <div class="sc-drift-metric">
            <span>HITL Escalation Rate</span>
            <strong>{{ hitlRate() }}%</strong>
            <small>Triggered by score &lt; 85% or loop</small>
          </div>
        </div>

        <!-- MULTI-STAGE GATING MATRIX -->
        <div class="sc-gates-table-wrap">
          <table class="sc-gates-table">
            <thead>
              <tr>
                <th>Gate Stage</th>
                <th>Trajectory Match</th>
                <th>Task Completion</th>
                <th>Groundedness</th>
                <th>Parameter Validity</th>
                <th>Current Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><b>1. Build Gate</b></td>
                <td>&ge; 90%</td>
                <td>&ge; 88%</td>
                <td>&ge; 95%</td>
                <td>100%</td>
                <td><span class="sc-gate-pass">PASS &#x2705;</span></td>
              </tr>
              <tr>
                <td><b>2. DEV Gate</b></td>
                <td>&ge; 92%</td>
                <td>&ge; 90%</td>
                <td>&ge; 95%</td>
                <td>100%</td>
                <td><span class="sc-gate-pass">PASS &#x2705;</span></td>
              </tr>
              <tr>
                <td><b>3. UAT Gate</b></td>
                <td>&ge; 95%</td>
                <td>&ge; 95%</td>
                <td>&ge; 98%</td>
                <td>100%</td>
                <td>
                  <span [class.sc-gate-pass]="projectedTrajectory() >= 95" [class.sc-gate-warn]="projectedTrajectory() < 95">
                    {{ projectedTrajectory() >= 95 ? 'PASS &#x2705;' : 'SOFT WARNING &#x26A0;&#xFE0F;' }}
                  </span>
                </td>
              </tr>
              <tr>
                <td><b>4. PROD Alert</b></td>
                <td>&lt; 88% (Alert)</td>
                <td>&lt; 85% (Alert)</td>
                <td>&lt; 92% (Alert)</td>
                <td>&lt; 99% (Alert)</td>
                <td><span class="sc-gate-pass">OPERATIONAL</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- BEHAVIOR CONTROLS & LIVE IMPACT SIMULATOR -->
      <div class="sc-studio-grid">
        <div class="sc-studio-controls">
          <div class="sc-ctrl-group">
            <div class="sc-ctrl-label">
              <label for="reasoning-effort">Reasoning Depth (Chain-of-Thought)</label>
              <span class="sc-val-tag">{{ reasoningEffort() | uppercase }}</span>
            </div>
            <div class="sc-btn-toggles">
              <button type="button" [class.active]="reasoningEffort() === 'concise'" (click)="reasoningEffort.set('concise')">Concise (Fast)</button>
              <button type="button" [class.active]="reasoningEffort() === 'balanced'" (click)="reasoningEffort.set('balanced')">Balanced</button>
              <button type="button" [class.active]="reasoningEffort() === 'deep'" (click)="reasoningEffort.set('deep')">Deep CoT</button>
            </div>
            <small class="sc-muted">Deep CoT chains multi-turn AST security checks and edge-case validation.</small>
          </div>

          <div class="sc-ctrl-group">
            <div class="sc-ctrl-label">
              <label for="temp-slider">Sampling Temperature (Determinism)</label>
              <span class="sc-val-tag">{{ temperature() }}</span>
            </div>
            <input id="temp-slider" type="range" min="0" max="0.7" step="0.05" [ngModel]="temperature()" (ngModelChange)="temperature.set($event)" class="sc-range">
            <div class="sc-range-labels">
              <span>0.0 (Strict / Auditable)</span>
              <span>0.35 (Standard)</span>
              <span>0.7 (Creative)</span>
            </div>
          </div>

          <div class="sc-ctrl-group">
            <div class="sc-ctrl-label">
              <label>Guardrail Strictness (Model Armor)</label>
              <span class="sc-val-tag">{{ guardrailStrictness() | uppercase }}</span>
            </div>
            <div class="sc-btn-toggles">
              <button type="button" [class.active]="guardrailStrictness() === 'permissive'" (click)="guardrailStrictness.set('permissive')">Permissive</button>
              <button type="button" [class.active]="guardrailStrictness() === 'standard'" (click)="guardrailStrictness.set('standard')">Standard</button>
              <button type="button" [class.active]="guardrailStrictness() === 'strict'" (click)="guardrailStrictness.set('strict')">Strict Armor</button>
            </div>
            <small class="sc-muted">Strict Armor intercepts prompt injection and enforces security gate verification.</small>
          </div>

          <div class="sc-ctrl-group">
            <div class="sc-ctrl-label">
              <label>Prompt Strategy</label>
              <span class="sc-val-tag">{{ strategyLabel() }}</span>
            </div>
            <div class="sc-btn-toggles">
              <button type="button" [class.active]="promptStrategy() === 'zero_shot'" (click)="promptStrategy.set('zero_shot')">Zero-Shot</button>
              <button type="button" [class.active]="promptStrategy() === 'few_shot'" (click)="promptStrategy.set('few_shot')">Few-Shot Anchors</button>
              <button type="button" [class.active]="promptStrategy() === 'dual_pass'" (click)="promptStrategy.set('dual_pass')">Dual-Pass Reflect</button>
            </div>
            <small class="sc-muted">Dual-pass runs reviewer then a critique pass before synthesizing final output.</small>
          </div>

          <div class="sc-quick-actions">
            <button type="button" class="sc-drift-heal-btn" (click)="healDrift()">
              Auto-Tune Parameters to Recover Concept Drift
            </button>
          </div>

          <div class="sc-apply-row">
            <button type="button" class="primary-btn" (click)="applyConfig()">
              {{ applied() ? 'Config Applied to Agent Runtime!' : 'Apply Behavior to Live Agent' }}
            </button>
            @if (applied()) {
              <span class="sc-save-msg">Active in Agent Runtime</span>
            }
          </div>
        </div>

        <div class="sc-studio-impact">
          <h3>Projected Impact &amp; Drift Recovery</h3>
          <p class="sc-muted">Real-time simulation of trajectory match, completion, and cost recovery:</p>

          <div class="sc-impact-cards">
            <div class="sc-impact-card" [class.positive]="impact().capabilityDelta > 0">
              <span class="sc-kicker">Trajectory Exact Match</span>
              <div class="sc-delta-val">
                <strong>{{ projectedTrajectory() }}%</strong>
                <span class="sc-delta-tag" [class.positive]="impact().capabilityDelta > 0">
                  {{ impact().capabilityDelta >= 0 ? '+' : '' }}{{ impact().capabilityDelta }}%
                </span>
              </div>
              <small>UAT Gate: &ge;95% &bull; Baseline: {{ baselineAccuracy() }}%</small>
            </div>

            <div class="sc-impact-card" [class.positive]="impact().reliabilityDelta > 0">
              <span class="sc-kicker">Groundedness &amp; Reliability</span>
              <div class="sc-delta-val">
                <strong>{{ Math.min(100, Math.round(currentReliability() + impact().reliabilityDelta)) }}%</strong>
                <span class="sc-delta-tag" [class.positive]="impact().reliabilityDelta > 0">
                  {{ impact().reliabilityDelta >= 0 ? '+' : '' }}{{ impact().reliabilityDelta }}%
                </span>
              </div>
              <small>Supported Claims / Total Claims (Gate: &ge;95%)</small>
            </div>

            <div class="sc-impact-card" [class.warning]="impact().costDelta > 0">
              <span class="sc-kicker">Cost / Session</span>
              <div class="sc-delta-val">
                <strong>&#36;{{ (currentCost() + impact().costDelta).toFixed(4) }}</strong>
                <span class="sc-delta-tag" [class.positive]="impact().costDelta <= 0" [class.warning]="impact().costDelta > 0">
                  {{ impact().costDelta >= 0 ? '+' : '' }}&#36;{{ impact().costDelta.toFixed(4) }}
                </span>
              </div>
              <small>P95 Latency: {{ p95Projected() }} ms (&le;3,000ms SLA)</small>
            </div>

            <div class="sc-impact-card positive">
              <span class="sc-kicker">Concept Drift Recovery</span>
              <div class="sc-delta-val">
                <strong class="sc-green">{{ Math.max(0, 100 - Math.abs(driftDelta() + impact().capabilityDelta)) }}%</strong>
                <span class="sc-delta-tag positive">Healed</span>
              </div>
              <small>Projected PSI drops from 0.14 &rarr; 0.04 (Stable)</small>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .sc-studio { margin-top: 6px; }
    .sc-studio-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
    .sc-studio-head p { max-width: 680px; margin: 4px 0 0; }
    .sc-studio-badge { display: flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 700; color: var(--teal); border: 1px solid var(--teal); background: color-mix(in srgb, var(--teal) 10%, transparent); padding: 6px 12px; border-radius: 999px; }
    .pulse-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--teal); box-shadow: 0 0 8px var(--teal); display: inline-block; }
    
    .sc-drift-card { border: 1px solid var(--line); border-radius: 8px; padding: 14px; background: color-mix(in srgb, var(--card) 95%, transparent); margin-bottom: 16px; }
    .sc-drift-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px; }
    .sc-drift-header strong { font-size: 13px; display: block; }
    .sc-drift-header span { font-size: 11px; }
    .sc-drift-tag { font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 999px; border: 1px solid var(--line); }
    .sc-drift-tag.drift-low { color: var(--teal); border-color: var(--teal); background: color-mix(in srgb, var(--teal) 10%, transparent); }
    .sc-drift-tag.drift-mod { color: var(--amber); border-color: var(--amber); background: color-mix(in srgb, var(--amber) 10%, transparent); }
    .sc-drift-tag.drift-high { color: var(--coral); border-color: var(--coral); background: color-mix(in srgb, var(--coral) 10%, transparent); }
    .sc-drift-metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; margin-bottom: 14px; }
    .sc-drift-metric { border: 1px solid var(--line); border-radius: 6px; padding: 10px; display: flex; flex-direction: column; gap: 2px; background: var(--card); }
    .sc-drift-metric span { font-size: 11px; color: var(--muted); }
    .sc-drift-metric strong { font-size: 18px; }
    .sc-drift-metric small { font-size: 10px; color: var(--muted); }
    .sc-green { color: var(--teal); }
    .sc-warn { color: var(--amber); }
    .sc-coral { color: var(--coral); }

    .sc-gates-table-wrap { overflow-x: auto; border-top: 1px solid var(--line); padding-top: 10px; }
    .sc-gates-table { width: 100%; border-collapse: collapse; font-size: 11px; text-align: left; }
    .sc-gates-table th, .sc-gates-table td { padding: 6px 10px; border-bottom: 1px solid var(--line); }
    .sc-gates-table th { color: var(--muted); text-transform: uppercase; font-size: 10px; }
    .sc-gate-pass { color: var(--teal); font-weight: 700; }
    .sc-gate-warn { color: var(--amber); font-weight: 700; }

    .sc-studio-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 20px; }
    @media (max-width: 850px) { .sc-studio-grid { grid-template-columns: 1fr; } }
    .sc-studio-controls { display: flex; flex-direction: column; gap: 14px; }
    .sc-ctrl-group { border: 1px solid var(--line); border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 8px; background: var(--card); }
    .sc-ctrl-label { display: flex; justify-content: space-between; align-items: center; font-size: 12px; font-weight: 600; }
    .sc-val-tag { font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; background: var(--line); color: var(--ink); }
    .sc-btn-toggles { display: flex; gap: 6px; }
    .sc-btn-toggles button { all: unset; box-sizing: border-box; cursor: pointer; flex: 1; text-align: center; font-size: 11px; font-weight: 600; padding: 6px 8px; border-radius: 6px; border: 1px solid var(--line); color: var(--muted); background: var(--card); }
    .sc-btn-toggles button:hover { color: var(--ink); }
    .sc-btn-toggles button.active { color: var(--teal); border-color: var(--teal); background: color-mix(in srgb, var(--teal) 10%, transparent); }
    .sc-range { width: 100%; accent-color: var(--teal); cursor: pointer; }
    .sc-range-labels { display: flex; justify-content: space-between; font-size: 10px; color: var(--muted); }
    .sc-quick-actions { margin-top: 4px; }
    .sc-drift-heal-btn { all: unset; box-sizing: border-box; cursor: pointer; width: 100%; text-align: center; font-size: 11px; font-weight: 700; padding: 8px 12px; border-radius: 8px; border: 1px dashed var(--teal); color: var(--teal); background: color-mix(in srgb, var(--teal) 8%, transparent); }
    .sc-drift-heal-btn:hover { background: color-mix(in srgb, var(--teal) 16%, transparent); }
    .sc-apply-row { display: flex; align-items: center; gap: 12px; margin-top: 6px; }
    .sc-save-msg { color: var(--teal); font-size: 12px; font-weight: 600; }
    .sc-studio-impact { border: 1px solid var(--line); border-radius: 8px; padding: 14px; background: color-mix(in srgb, var(--card) 95%, transparent); display: flex; flex-direction: column; gap: 12px; }
    .sc-studio-impact h3 { margin: 0; font-size: 14px; }
    .sc-studio-impact p { margin: 0; font-size: 12px; }
    .sc-impact-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .sc-impact-card { border: 1px solid var(--line); border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 4px; background: var(--card); }
    .sc-impact-card.positive { border-color: var(--teal); }
    .sc-impact-card.warning { border-color: var(--amber); }
    .sc-delta-val { display: flex; justify-content: space-between; align-items: baseline; }
    .sc-delta-val strong { font-size: 20px; }
    .sc-delta-tag { font-size: 11px; font-weight: 700; padding: 2px 6px; border-radius: 4px; }
    .sc-delta-tag.positive { color: var(--teal); background: color-mix(in srgb, var(--teal) 12%, transparent); }
    .sc-delta-tag.warning { color: var(--amber); background: color-mix(in srgb, var(--amber) 12%, transparent); }
    .sc-impact-card small { font-size: 10px; color: var(--muted); }
  `]
})
export class BehaviorStudioComponent {
  readonly currentCapability = input<number>(92);
  readonly currentReliability = input<number>(94);
  readonly currentCost = input<number>(0.003);

  readonly configChange = output<AgentBehaviorConfig>();

  readonly reasoningEffort = signal<'concise' | 'balanced' | 'deep'>('balanced');
  readonly temperature = signal(0.2);
  readonly guardrailStrictness = signal<'standard' | 'strict' | 'permissive'>('standard');
  readonly promptStrategy = signal<'zero_shot' | 'few_shot' | 'dual_pass'>('few_shot');
  readonly applied = signal(false);

  // Concept Drift Metrics (BigQuery agent_governance_ds)
  readonly baselineAccuracy = signal(94.2);
  readonly onlineAccuracy = signal(87.5);
  readonly psiScore = signal(0.14);
  readonly hitlRate = signal(2.1);

  readonly Math = Math;

  readonly driftDelta = computed(() => {
    return Math.round((this.onlineAccuracy() - this.baselineAccuracy()) * 10) / 10;
  });

  readonly driftSeverity = computed(() => {
    const psi = this.psiScore();
    if (psi < 0.1) return 'LOW';
    if (psi < 0.2) return 'MODERATE';
    return 'HIGH';
  });

  readonly strategyLabel = computed(() => {
    switch (this.promptStrategy()) {
      case 'zero_shot': return 'Zero-Shot Prompt';
      case 'few_shot': return 'Few-Shot Security Anchors';
      case 'dual_pass': return 'Dual-Pass Reflection Loop';
    }
  });

  readonly impact = computed(() => {
    let capabilityDelta = 0;
    let reliabilityDelta = 0;
    let costDelta = 0;

    // Reasoning Effort
    if (this.reasoningEffort() === 'deep') {
      capabilityDelta += 6.5;
      reliabilityDelta += 4.0;
      costDelta += 0.0012;
    } else if (this.reasoningEffort() === 'concise') {
      capabilityDelta -= 4.0;
      costDelta -= 0.0008;
    }

    // Temperature (Determinism)
    if (this.temperature() <= 0.1) {
      reliabilityDelta += 5.0;
      capabilityDelta += 2.0;
    } else if (this.temperature() > 0.4) {
      reliabilityDelta -= 6.0;
      capabilityDelta -= 2.0;
    }

    // Guardrail Strictness
    if (this.guardrailStrictness() === 'strict') {
      reliabilityDelta += 4.5;
      capabilityDelta += 1.0;
      costDelta += 0.0004;
    } else if (this.guardrailStrictness() === 'permissive') {
      reliabilityDelta -= 12.0;
    }

    // Prompt Strategy
    if (this.promptStrategy() === 'dual_pass') {
      capabilityDelta += 5.0;
      reliabilityDelta += 4.0;
      costDelta += 0.0015;
    } else if (this.promptStrategy() === 'zero_shot') {
      capabilityDelta -= 3.0;
      reliabilityDelta -= 3.0;
    }

    return {
      capabilityDelta: Math.round(capabilityDelta * 10) / 10,
      reliabilityDelta: Math.round(reliabilityDelta * 10) / 10,
      costDelta: Math.round(costDelta * 10000) / 10000
    };
  });

  readonly projectedTrajectory = computed(() => {
    return Math.min(100, Math.max(50, Math.round(this.onlineAccuracy() + this.impact().capabilityDelta)));
  });

  readonly p95Projected = computed(() => {
    return this.reasoningEffort() === 'deep' ? 2920 : 2650;
  });

  healDrift(): void {
    // Automatically apply optimal configuration to recover drift
    this.reasoningEffort.set('deep');
    this.temperature.set(0.1);
    this.guardrailStrictness.set('strict');
    this.promptStrategy.set('dual_pass');
    this.psiScore.set(0.04);
  }

  applyConfig(): void {
    this.applied.set(true);
    this.configChange.emit({
      reasoningEffort: this.reasoningEffort(),
      temperature: this.temperature(),
      guardrailStrictness: this.guardrailStrictness(),
      promptStrategy: this.promptStrategy()
    });
    setTimeout(() => this.applied.set(false), 3000);
  }
}
