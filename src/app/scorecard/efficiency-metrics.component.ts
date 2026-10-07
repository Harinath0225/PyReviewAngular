import { Component, computed, input } from '@angular/core';
import { EfficiencyMetrics, EvaluationRun } from './scorecard.models';

interface Row {
  label: string;
  median: string;
  p90: string;
  spark: string;
}

@Component({
  selector: 'app-efficiency-metrics',
  standalone: true,
  template: `
    <section class="sc-card">
      <h2>Operational efficiency</h2>
      <table class="sc-table">
        <thead><tr><th>Metric</th><th>Median</th><th>P90</th><th>Trend</th></tr></thead>
        <tbody>
          @for (row of rows(); track row.label) {
            <tr>
              <td>{{ row.label }}</td>
              <td>{{ row.median }}</td>
              <td>{{ row.p90 }}</td>
              <td>
                @if (row.spark) {
                  <svg class="sc-spark" viewBox="0 0 100 24" preserveAspectRatio="none" aria-hidden="true">
                    <polyline [attr.points]="row.spark" />
                  </svg>
                } @else { <span class="sc-muted">n/a</span> }
              </td>
            </tr>
          }
          <tr>
            <td>Tokens (input / output)</td>
            <td colspan="3">{{ metrics()?.prompt_tokens_total ?? 0 }} / {{ metrics()?.completion_tokens_total ?? 0 }}</td>
          </tr>
          <tr>
            <td>Cost per task</td>
            <td colspan="3">{{ '$' + (metrics()?.cost_usd_per_task ?? 0).toFixed(5) }} ({{ '$' + (metrics()?.cost_usd_total ?? 0).toFixed(5) }} total)</td>
          </tr>
        </tbody>
      </table>
    </section>
  `
})
export class EfficiencyMetricsComponent {
  readonly metrics = input<EfficiencyMetrics | null>(null);
  readonly runs = input<EvaluationRun[]>([]);

  readonly rows = computed<Row[]>(() => {
    const m = this.metrics();
    // Runs arrive newest-first; sparklines read oldest to newest.
    const ordered = [...this.runs()].reverse();
    return [
      {
        label: 'Steps / turns',
        median: String(m?.steps_median ?? 0),
        p90: String(m?.steps_p90 ?? 0),
        spark: this.spark(ordered.map(r => r.trajectory_length))
      },
      {
        label: 'Latency (ms)',
        median: m?.latency_ms_median == null ? 'n/a' : String(Math.round(m.latency_ms_median)),
        p90: m?.latency_ms_p90 == null ? 'n/a' : String(Math.round(m.latency_ms_p90)),
        spark: this.spark(ordered.map(r => r.latency_ms).filter(v => v > 0))
      },
      {
        label: 'Token count',
        median: String(this.median(ordered.map(r => r.prompt_tokens + r.completion_tokens))),
        p90: '-',
        spark: this.spark(ordered.map(r => r.prompt_tokens + r.completion_tokens))
      }
    ];
  });

  private median(values: number[]): number {
    if (!values.length) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  }

  private spark(values: number[]): string {
    if (values.length < 2) return '';
    const min = Math.min(...values);
    const span = Math.max(...values) - min || 1;
    return values
      .map((v, i) => `${(i / (values.length - 1)) * 100},${22 - ((v - min) / span) * 20}`)
      .join(' ');
  }
}
