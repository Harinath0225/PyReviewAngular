import { Component, input } from '@angular/core';
import { Kpi, KpiScorecard, KpiStatus } from './scorecard.models';

const STATUS_LABELS: Record<KpiStatus, string> = {
  met: 'Target met',
  at_risk: 'At risk',
  missed: 'Missed',
  no_data: 'No data'
};

@Component({
  selector: 'app-kpi-mapping',
  standalone: true,
  template: `
    <section class="sc-card">
      <h2>KPIs &amp; mapped metrics</h2>
      <p class="sc-muted sc-kpi-intro">Each KPI is built from the evaluation metrics listed under it. Metrics marked "context" are shown but do not move the KPI.</p>
      <div class="sc-kpi-grid">
        @for (kpi of kpis(); track kpi.id) {
          <article class="sc-kpi" [class]="'sc-kpi ' + kpi.status">
            <header>
              <strong>{{ kpi.name }}</strong>
              <span class="sc-kpi-status" [class]="'sc-kpi-status ' + kpi.status">{{ statusLabel(kpi.status) }}</span>
            </header>
            <div class="sc-kpi-value">{{ kpi.value === null ? 'n/a' : kpi.value }}<small>/ target {{ kpi.target }}</small></div>
            <div class="sc-bar sc-kpi-bar" [attr.aria-label]="kpi.name + ' progress toward target'">
              <span [style.width.%]="kpi.value ?? 0"></span>
              <i [style.left.%]="kpi.target"></i>
            </div>
            <p class="sc-muted">{{ kpi.description }}</p>
            <ul>
              @for (metric of kpi.metrics; track metric.key) {
                <li [class.context]="metric.weight === 0">
                  <span>{{ metric.label }}@if (metric.weight === 0) { <em> context</em> }</span>
                  <b>{{ metric.value === null ? 'n/a' : metric.value }}</b>
                  <small>{{ metric.samples }} {{ metric.samples === 1 ? 'sample' : 'samples' }}</small>
                </li>
              }
            </ul>
          </article>
        }
      </div>
    </section>
  `
})
export class KpiMappingComponent {
  readonly scorecard = input<KpiScorecard | null>(null);

  kpis(): Kpi[] {
    return this.scorecard()?.kpis ?? [];
  }

  statusLabel(status: KpiStatus): string {
    return STATUS_LABELS[status];
  }
}
