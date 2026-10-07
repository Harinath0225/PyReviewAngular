import { Component, inject, input, signal } from '@angular/core';
import { DatePipe, JsonPipe } from '@angular/common';
import { EvaluationRun, SOURCE_LABELS, TrajectoryDetail, VerifierType } from './scorecard.models';
import { ScorecardService } from './scorecard.service';

const QUALITY_LABELS: Record<string, string> = {
  bleu: 'BLEU',
  meteor: 'METEOR',
  rouge1: 'ROUGE-1',
  rouge2: 'ROUGE-2',
  rougeL: 'ROUGE-L',
  llm_judge: 'LLM judge (calibrated)'
};

const VERIFIER_LABELS: Record<VerifierType, string> = {
  hard: 'Hard verifier (rules / unit tests)',
  soft: 'Soft verifier (LLM-as-judge / keywords)',
  hybrid: 'Hybrid verifier'
};

@Component({
  selector: 'app-trajectory-logs',
  standalone: true,
  imports: [DatePipe, JsonPipe],
  template: `
    <section class="sc-card">
      <h2>Traceability &amp; logs</h2>
      @if (!runs().length) {
        <p class="sc-muted">No evaluation sessions recorded yet. Run an evaluation in Agent Lab.</p>
      }
      @for (run of runs(); track run.session_id) {
        <div class="sc-session">
          <button type="button" class="sc-session-head" [attr.aria-expanded]="expanded() === run.session_id" (click)="toggle(run)">
            <span class="sc-src-pill" [class]="run.source">{{ sourceLabel(run.source) }}</span>
            <span class="sc-pill" [class]="run.status.toLowerCase()">{{ run.status }}</span>
            <span class="sc-session-name">{{ run.scenario_name || run.scenario_id || run.session_id }}</span>
            <span class="sc-pill verifier" [class]="run.verifier_type" [attr.title]="verifierLabel(run.verifier_type)">{{ run.verifier_type }}</span>
            <span class="sc-muted">{{ run.score }} / 100</span>
            <span class="sc-muted">{{ run.created_at | date: 'short' }}</span>
          </button>
          @if (expanded() === run.session_id) {
            <div class="sc-session-body">
              @if (loading()) { <p class="sc-muted">Loading trajectory...</p> }
              @if (error()) { <p class="sc-error">{{ error() }}</p> }
              @if (detail(); as d) {
                <p class="sc-muted">{{ verifierLabel(d.verifier_type) }} &middot; session {{ d.session_id }}</p>
                @if (d.quality_metrics && hasKeys(d.quality_metrics)) {
                  <table class="sc-table sc-metric-table">
                    <thead><tr><th>Answer quality (vs reference)</th><th>Score</th></tr></thead>
                    <tbody>
                      @for (entry of qualityEntries(d.quality_metrics); track entry.key) {
                        <tr><td>{{ entry.label }}</td><td>{{ entry.percent }}</td></tr>
                      }
                    </tbody>
                  </table>
                }
                @if (d.judge; as judge) {
                  <div class="sc-judge-card">
                    <div class="sc-judge-head">
                      <span class="sc-pill verifier" [class]="judge.mode === 'llm' ? 'soft' : 'hard'">{{ judge.mode === 'llm' ? 'LLM judge' : 'Heuristic judge' }}</span>
                      <b>{{ percent(judge.score) }} / 100</b>
                      <span class="sc-muted">raw {{ percent(judge.raw_score) }} &middot; {{ judge.calibration.applied ? 'calibrated (run #' + judge.calibration.id + ')' : 'not calibrated' }} &middot; pass at {{ percent(judge.pass_threshold) }}</span>
                    </div>
                    @for (c of criteriaEntries(judge.criteria); track c.name) {
                      <div class="sc-judge-row"><span>{{ c.name }}</span><div class="sc-bar"><span [style.width.%]="c.value"></span></div><b>{{ c.value }}</b></div>
                    }
                    @if (judge.rationale) { <p class="sc-muted">{{ judge.rationale }}</p> }
                    @if (judge.fallback_reason) { <p class="sc-muted">{{ judge.fallback_reason }}</p> }
                  </div>
                }
                @if (d.metric_results?.length) {
                  <table class="sc-table sc-metric-table">
                    <thead><tr><th>ADK metric</th><th>Score</th><th>Threshold</th><th>Status</th></tr></thead>
                    <tbody>
                      @for (metric of d.metric_results ?? []; track metric.metric_name) {
                        <tr>
                          <td>{{ metric.metric_name }}</td>
                          <td>{{ metric.score }}</td>
                          <td>{{ metric.threshold }}</td>
                          <td><span class="sc-pill" [class]="metric.status.toLowerCase()">{{ metric.status }}</span></td>
                        </tr>
                      }
                    </tbody>
                  </table>
                }
                @for (step of d.trajectory?.steps ?? []; track step.step) {
                  <div class="sc-step">
                    <div class="sc-step-head">
                      <strong>{{ step.step }}. {{ step.tool }}</strong>
                      <span class="sc-muted">{{ step.phase }} &middot; {{ step.latency_ms }} ms &middot; {{ step.status }}</span>
                    </div>
                    <pre>{{ step.args | json }}</pre>
                    <p>{{ step.result }}</p>
                  </div>
                }
              }
            </div>
          }
        </div>
      }
    </section>
  `
})
export class TrajectoryLogsComponent {
  private readonly service = inject(ScorecardService);

  readonly runs = input<EvaluationRun[]>([]);
  readonly expanded = signal<string | null>(null);
  readonly detail = signal<TrajectoryDetail | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');

  verifierLabel(type: VerifierType): string {
    return VERIFIER_LABELS[type] ?? type;
  }

  sourceLabel(source: EvaluationRun['source']): string {
    return SOURCE_LABELS[source] ?? source;
  }

  hasKeys(value: object): boolean {
    return Object.keys(value).length > 0;
  }

  percent(value: number): number {
    return Math.round(value * 100);
  }

  qualityEntries(metrics: Record<string, number>): { key: string; label: string; percent: number }[] {
    return Object.entries(metrics).map(([key, value]) => ({ key, label: QUALITY_LABELS[key] ?? key, percent: Math.round(value * 100) }));
  }

  criteriaEntries(criteria: Record<string, number>): { name: string; value: number }[] {
    return Object.entries(criteria).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value: Math.round(value * 100) }));
  }

  toggle(run: EvaluationRun): void {
    if (this.expanded() === run.session_id) {
      this.expanded.set(null);
      return;
    }
    this.expanded.set(run.session_id);
    this.detail.set(null);
    this.error.set('');
    this.loading.set(true);
    this.service.getTrajectory(run.session_id).subscribe({
      next: detail => {
        this.detail.set(detail);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load the trajectory for this session.');
        this.loading.set(false);
      }
    });
  }
}
