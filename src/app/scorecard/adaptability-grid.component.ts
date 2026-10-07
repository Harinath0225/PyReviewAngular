import { Component, computed, input } from '@angular/core';
import { AdaptabilityCell, CAPABILITIES, ReliabilityMetrics } from './scorecard.models';

@Component({
  selector: 'app-adaptability-grid',
  standalone: true,
  template: `
    <section class="sc-card">
      <h2>Scenario &amp; adaptability</h2>
      <div class="sc-heatmap">
        @for (cell of cells(); track cell.name) {
          <div class="sc-heat-cell" [style.--heat]="cell.data ? cell.data.pass_rate / 100 : 0"
            [attr.title]="cell.data ? cell.data.runs + ' runs' : 'No runs tagged'">
            <span class="sc-kicker">{{ cell.name }}</span>
            <strong>{{ cell.data ? cell.data.pass_rate + '%' : 'n/a' }}</strong>
            <div class="sc-bar"><span [style.width.%]="cell.data?.pass_rate ?? 0"></span></div>
            <small>{{ cell.data ? cell.data.runs + ' runs' : 'untested' }}</small>
          </div>
        }
      </div>
    </section>
  `
})
export class AdaptabilityGridComponent {
  readonly metrics = input<ReliabilityMetrics | null>(null);

  readonly cells = computed(() => {
    const grid = this.metrics()?.adaptability_grid ?? {};
    return CAPABILITIES.map(name => ({ name, data: (grid[name] as AdaptabilityCell | undefined) ?? null }));
  });
}
