import { Component, input, output } from '@angular/core';
import { SourceBreakdown, SourceFilter } from './scorecard.models';

@Component({
  selector: 'app-source-comparison',
  standalone: true,
  template: `
    @if (breakdown(); as b) {
      <section class="sc-card sc-compare">
        <h2>Results by source</h2>
        <table class="sc-table">
          <thead>
            <tr><th>Source</th><th>Runs</th><th>Passed</th><th>Capability</th><th>Reliability</th><th>Avg score</th><th>Steps</th><th>Latency</th><th>Cost / task</th><th>Last run</th></tr>
          </thead>
          <tbody>
            @for (entry of b.sources; track entry.source) {
              <tr class="sc-compare-row" [class.selected]="selected() === entry.source" (click)="select.emit(entry.source)" tabindex="0" (keydown.enter)="select.emit(entry.source)">
                <td><span class="sc-src-pill" [class]="entry.source">{{ entry.label }}</span></td>
                <td>{{ entry.total_runs }}</td>
                <td>{{ entry.passed_runs }}</td>
                <td>{{ entry.capability_score }}</td>
                <td>{{ entry.reliability_index }}</td>
                <td>{{ entry.average_score }}</td>
                <td>{{ entry.steps_median }}</td>
                <td>{{ entry.latency_ms_median === null ? 'n/a' : Math.round(entry.latency_ms_median) + ' ms' }}</td>
                <td>{{ '$' + entry.cost_usd_per_task.toFixed(5) }}</td>
                <td class="sc-muted">{{ entry.last_run_at ?? 'never' }}</td>
              </tr>
            }
          </tbody>
          <tfoot>
            <tr class="sc-compare-row sc-compare-combined" [class.selected]="selected() === 'all'" (click)="select.emit('all')" tabindex="0" (keydown.enter)="select.emit('all')">
              <td><span class="sc-src-pill all">{{ b.combined.label }}</span></td>
              <td>{{ b.combined.total_runs }}</td>
              <td>{{ b.combined.passed_runs }}</td>
              <td>{{ b.combined.capability_score }}</td>
              <td>{{ b.combined.reliability_index }}</td>
              <td>{{ b.combined.average_score }}</td>
              <td>{{ b.combined.steps_median }}</td>
              <td>{{ b.combined.latency_ms_median === null ? 'n/a' : Math.round(b.combined.latency_ms_median) + ' ms' }}</td>
              <td>{{ '$' + b.combined.cost_usd_per_task.toFixed(5) }}</td>
              <td class="sc-muted">{{ b.combined.last_run_at ?? 'never' }}</td>
            </tr>
          </tfoot>
        </table>
      </section>
    }
  `
})
export class SourceComparisonComponent {
  readonly breakdown = input<SourceBreakdown | null>(null);
  readonly selected = input<SourceFilter>('all');
  readonly select = output<SourceFilter>();
  protected readonly Math = Math;
}
