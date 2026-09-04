import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReviewService } from './review.service';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="page history-page">
      <div class="eyebrow">YOUR REVIEWS <span></span> {{ history().length }} / {{ history().length }}</div>
      <div class="history-heading">
        <div>
          <h1>Review history.</h1>
          <p>A record of the code you are making better.</p>
        </div>
        <a routerLink="/" class="primary-btn">+ New review</a>
      </div>

      <div class="stats-grid">
        <div class="stat-card critical">
          <span class="stat-label">Critical issues caught</span>
          <strong>{{ summary().critical }}</strong>
          <small>High-risk items flagged before release</small>
        </div>
        <div class="stat-card">
          <span class="stat-label">Findings reviewed</span>
          <strong>{{ summary().findings }}</strong>
          <small>Questions, risks, and quality gaps</small>
        </div>
        <div class="stat-card">
          <span class="stat-label">Avg. code health</span>
          <strong>{{ summary().score }}<em>/100</em></strong>
          <small>Across your review history</small>
        </div>
      </div>

      <div class="trend-panel">
        <div class="trend-header">
          <div><span class="trend-kicker">Risk overview</span><strong>Critical findings by review</strong></div>
          <span class="trend-total"><b>{{ summary().critical }}</b> critical total</span>
        </div>
        <div class="trend-legend"><span><i class="legend-critical"></i> Critical</span><span><i class="legend-total"></i> All findings</span></div>
        <div class="trend-chart">
          <div class="trend-axis" aria-hidden="true"><span>4</span><span>3</span><span>2</span><span>1</span><span>0</span></div>
          <div class="trend-plot">
            <div class="trend-grid" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div>
            <div class="trend-columns">
              @for (point of summary().trend; track point.id) {
                <div class="trend-column" [attr.aria-label]="point.name + ': ' + point.critical + ' critical findings out of ' + point.total + ' total'">
                  <div class="trend-values"><strong>{{ point.critical }}</strong><small>/{{ point.total }}</small></div>
                  <div class="trend-bars"><span class="trend-bar total" [style.height.%]="point.totalHeight"></span><span class="trend-bar critical" [style.height.%]="point.criticalHeight"></span></div>
                  <span class="trend-label">{{ point.label }}</span>
                </div>
              }
            </div>
          </div>
        </div>
      </div>

      <div class="history-table">
        <div class="table-head"><span>FILE / SOURCE</span><span>REVIEW ID</span><span>HEALTH</span><span>FINDINGS</span><span>REVIEWED</span><span></span></div>
        @for (item of history(); track item.id) {
          <a class="history-row" [routerLink]="['/review', item.id]" (click)="open(item)">
            <div class="file-cell">
              <span class="file-icon">PY</span>
              <span><b>{{ item.name }}</b><small>{{ item.source }}</small></span>
            </div>
            <span class="review-id">{{ item.id }}</span>
            <strong class="table-score" [class.high]="item.score > 85">{{ item.score }}<small>/100</small></strong>
            <span class="finding-count">
              @if (item.criticalFindings > 0) {
                <span class="critical-pill">{{ item.criticalFindings }}</span>
              }
              {{ item.findings }} <small>items</small>
            </span>
            <span class="reviewed">{{ item.time }}</span>
            <span class="row-arrow">→</span>
          </a>
        }
      </div>

      <div class="history-note"><span>✦</span> Reviews are stored locally in this demo. Connect your BE to persist them for your team.</div>
    </section>
  `
})
export class HistoryComponent {
  private readonly service = inject(ReviewService);
  readonly history = this.service.history;

  readonly summary = computed(() => {
    const items = this.history();
    const critical = items.reduce((sum, item) => sum + item.criticalFindings, 0);
    const findings = items.reduce((sum, item) => sum + item.findings, 0);
    const averageScore = Math.round(items.reduce((sum, item) => sum + item.score, 0) / Math.max(items.length, 1));
    const trendItems = items.slice(0, 5).reverse();
    const maxFindings = Math.max(...trendItems.map(item => item.findings), 1);
    const trend = trendItems.map(item => ({
      id: item.id,
      name: item.name,
      label: item.name.replace('.py', ''),
      critical: item.criticalFindings,
      total: item.findings,
      criticalHeight: Math.max(12, (item.criticalFindings / maxFindings) * 100),
      totalHeight: Math.max(18, (item.findings / maxFindings) * 100)
    }));

    return { critical, findings, score: averageScore, trend };
  });

  open(item: Parameters<typeof this.service.load>[0]): void {
    this.service.load(item);
  }
}
