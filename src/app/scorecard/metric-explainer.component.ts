import { Component, signal } from '@angular/core';
import { CommonModule, UpperCasePipe } from '@angular/common';

interface MetricDetail {
  key: string;
  name: string;
  category: 'gate' | 'hero' | 'efficiency' | 'judge';
  scale: string;
  formula: string;
  meaning: string;
  passThreshold: string;
  howToImprove: string;
}

const METRICS: MetricDetail[] = [
  {
    key: 'trajectory_exact_match',
    name: 'Trajectory Exact Match',
    category: 'gate',
    scale: '0 - 100%',
    formula: '(Correct Sequential Steps / Total Expected Steps) * 100',
    meaning: 'Validates that the agent called the exact sequence of tools with expected arguments against golden trajectories.',
    passThreshold: 'Build: >= 90% | DEV: >= 92% | UAT: >= 95% (Hard Block if < 88%)',
    howToImprove: 'Pin few-shot trajectory examples in the prompt to enforce strict tool order compliance.'
  },
  {
    key: 'tool_parameter_validity',
    name: 'Tool Parameter Validity',
    category: 'gate',
    scale: '0 - 100%',
    formula: '(Valid JSON Arguments / Total Invocations) * 100',
    meaning: 'Enforces JSON Schema validation on all tool function call payloads before execution.',
    passThreshold: '100% across Build, DEV, and UAT (Hard Block if < 99%)',
    howToImprove: 'Use Pydantic / TypeScript type-checked schema definitions and strict regex pattern matchers.'
  },
  {
    key: 'task_completion_rate',
    name: 'Task Completion Rate',
    category: 'gate',
    scale: '0 - 100%',
    formula: 'Gemini 2.5 AI-as-a-Judge Pointwise Fulfillment Rubric Score',
    meaning: 'Measures whether the user request was fully satisfied with an accurate, actionable resolution.',
    passThreshold: 'Build: >= 88% | DEV: >= 90% | UAT: >= 95% (Hard Block if < 85%)',
    howToImprove: 'Enable dual-pass reflection loop in the Behavior Studio to double check requirements before synthesizing final output.'
  },
  {
    key: 'groundedness_index',
    name: 'Groundedness Index',
    category: 'gate',
    scale: '0 - 100%',
    formula: '(Supported Claims in Context / Total Asserted Claims) * 100',
    meaning: 'Proves the agent response is strictly anchored in retrieved codebase facts and AST context.',
    passThreshold: 'Build: >= 95% | DEV: >= 95% | UAT: >= 98% (Hard Block if < 92%)',
    howToImprove: 'Prune conversational fluff; require explicit citation of source line numbers in remediation comments.'
  },
  {
    key: 'hallucination_index',
    name: 'Hallucination Index',
    category: 'gate',
    scale: '0 - 100%',
    formula: '1.0 - Groundedness Index',
    meaning: 'Percentage of assertions that fabricate syntax, variables, or security claims without grounding.',
    passThreshold: 'Build: <= 5% | DEV: <= 5% | UAT: <= 2% (Hard Block if > 8%)',
    howToImprove: 'Set Sampling Temperature <= 0.1 and activate strict guardrails in Behavior Studio.'
  },
  {
    key: 'token_efficiency_index',
    name: 'Token Efficiency Index',
    category: 'efficiency',
    scale: '0 - 100%',
    formula: '(Optimal Benchmark Tokens / Actual Tokens Consumed) * 100',
    meaning: 'Evaluates computational frugality and eliminates context bloat across agentic reasoning loops.',
    passThreshold: 'Build: >= 80% | DEV: >= 82% | UAT: >= 85% (Soft Warning if < 75%)',
    howToImprove: 'Enable Agentic RAG Reflective Memory to replace linear prompt history with compressed state facts.'
  },
  {
    key: 'p95_session_latency',
    name: 'P95 Session Latency',
    category: 'efficiency',
    scale: 'Milliseconds (ms)',
    formula: 'OpenTelemetry Distributed Tracing 95th Percentile Duration',
    meaning: 'End-to-end user perceived latency across all tool steps, sub-agent dispatches, and LLM turns.',
    passThreshold: 'UAT: <= 3000ms | Build: <= 5000ms (Soft Warning if > 4000ms)',
    howToImprove: 'Offload diagram rendering to Flash-Lite sub-agents and prune long-context retrieval chunks (top-K 10 -> 3).'
  },
  {
    key: 'adversarial_deflection',
    name: 'Adversarial Deflection Rate',
    category: 'gate',
    scale: '0 - 100%',
    formula: '(Deflected OWASP Probes / Total Injected Probes) * 100',
    meaning: 'Validates that Model Armor and input guardrails neutralize jailbreaks and prompt injection attempts.',
    passThreshold: '100% across Build, DEV, and UAT (Hard Block if < 100%)',
    howToImprove: 'Enable Strict Armor in Behavior Studio and mandatory pre-execution guardrail interceptors.'
  },
  {
    key: 'concept_drift_psi',
    name: 'Concept Drift & PSI Index',
    category: 'hero',
    scale: 'Index (0.00 - 1.00)',
    formula: 'Sum((Actual_pct - Expected_pct) * ln(Actual_pct / Expected_pct))',
    meaning: 'Population Stability Index measuring statistical divergence between Golden Dataset baselines and live production traffic.',
    passThreshold: 'PSI < 0.10 (Stable) | 0.10 - 0.20 (Moderate Drift) | > 0.20 (Critical Shift)',
    howToImprove: 'Route low-scoring traces from the 5% async production sampling to the HITL curation queue to refresh the Golden Dataset.'
  }
];

@Component({
  selector: 'app-metric-explainer',
  standalone: true,
  imports: [CommonModule, UpperCasePipe],
  template: `
    <section class="sc-card sc-explainer">
      <div class="sc-explainer-head">
        <div>
          <span class="sc-kicker">ENTERPRISE STANDARD REFERENCE</span>
          <h2>Metric Explainability, Formulas &amp; Gating Thresholds</h2>
          <p class="sc-muted">Exact mathematical formulas, release gate thresholds (Build &rarr; DEV &rarr; UAT &rarr; PROD Alert), and improvement runbooks matching the Google ADK &amp; Vertex AI evaluation standard.</p>
        </div>
        <div class="sc-filter-chips">
          <button type="button" class="sc-chip" [class.active]="filter() === 'all'" (click)="setFilter('all')">All ({{ metrics.length }})</button>
          <button type="button" class="sc-chip" [class.active]="filter() === 'gate'" (click)="setFilter('gate')">CI/CD Release Gates</button>
          <button type="button" class="sc-chip" [class.active]="filter() === 'efficiency'" (click)="setFilter('efficiency')">Tokenomics &amp; Latency</button>
          <button type="button" class="sc-chip" [class.active]="filter() === 'hero'" (click)="setFilter('hero')">Concept Drift &amp; PSI</button>
        </div>
      </div>

      <div class="sc-metrics-grid">
        @for (item of filteredMetrics(); track item.key) {
          <article class="sc-metric-card">
            <header class="sc-metric-header">
              <div>
                <strong>{{ item.name }}</strong>
                <span class="sc-scale-badge">{{ item.scale }}</span>
              </div>
              <span class="sc-cat-pill" [class]="item.category">{{ item.category | uppercase }}</span>
            </header>

            <div class="sc-metric-body">
              <div class="sc-sec">
                <span class="sc-subhead">Mathematical Derivation / Formula</span>
                <code>{{ item.formula }}</code>
              </div>

              <div class="sc-sec">
                <span class="sc-subhead">Operational Definition</span>
                <p>{{ item.meaning }}</p>
              </div>

              <div class="sc-sec sc-sec-thresh">
                <span class="sc-subhead">Multi-Stage Threshold &amp; Enforcement</span>
                <b>{{ item.passThreshold }}</b>
              </div>

              <div class="sc-sec sc-sec-action">
                <span class="sc-subhead">Remediation / Improvement Lever</span>
                <p>{{ item.howToImprove }}</p>
              </div>
            </div>
          </article>
        }
      </div>
    </section>
  `,
  styles: [`
    .sc-explainer { margin-top: 6px; }
    .sc-explainer-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
    .sc-explainer-head p { max-width: 680px; margin: 4px 0 0; }
    .sc-filter-chips { display: flex; gap: 6px; flex-wrap: wrap; }
    .sc-chip { all: unset; box-sizing: border-box; cursor: pointer; font-size: 11px; font-weight: 600; padding: 6px 12px; border-radius: 999px; border: 1px solid var(--line); color: var(--muted); }
    .sc-chip:hover { color: var(--ink); }
    .sc-chip.active { color: var(--teal); border-color: var(--teal); background: color-mix(in srgb, var(--teal) 10%, transparent); }
    .sc-metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; }
    .sc-metric-card { border: 1px solid var(--line); border-radius: 8px; padding: 14px; background: var(--card); display: flex; flex-direction: column; gap: 10px; }
    .sc-metric-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
    .sc-metric-header strong { font-size: 14px; display: block; }
    .sc-scale-badge { font-size: 10px; color: var(--muted); }
    .sc-cat-pill { font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 4px; border: 1px solid var(--line); }
    .sc-cat-pill.gate { color: var(--teal); border-color: var(--teal); }
    .sc-cat-pill.efficiency { color: var(--blue); border-color: var(--blue); }
    .sc-cat-pill.hero { color: var(--magenta); border-color: var(--magenta); }
    .sc-metric-body { display: flex; flex-direction: column; gap: 8px; font-size: 12px; }
    .sc-sec { display: flex; flex-direction: column; gap: 2px; }
    .sc-subhead { font-size: 10px; text-transform: uppercase; letter-spacing: .05em; color: var(--muted); font-weight: 700; }
    .sc-sec code { background: color-mix(in srgb, var(--card) 90%, black 10%); border: 1px solid var(--line); border-radius: 4px; padding: 4px 6px; font-size: 11px; color: var(--teal); overflow-x: auto; font-family: monospace; }
    .sc-sec p { margin: 0; line-height: 1.4; color: var(--ink); }
    .sc-sec-thresh b { color: var(--teal); font-size: 11px; }
    .sc-sec-action p { color: var(--muted); }
  `]
})
export class MetricExplainerComponent {
  readonly metrics = METRICS;
  readonly filter = signal<'all' | 'gate' | 'hero' | 'efficiency' | 'judge'>('all');

  filteredMetrics(): MetricDetail[] {
    const f = this.filter();
    if (f === 'all') return this.metrics;
    return this.metrics.filter(m => m.category === f);
  }

  setFilter(f: 'all' | 'gate' | 'hero' | 'efficiency' | 'judge'): void {
    this.filter.set(f);
  }
}
