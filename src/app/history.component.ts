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
        <div class="stat-card high-card"><span class="stat-label">High</span><strong>{{ summary().high }}</strong><small>Urgent risks</small></div>
        <div class="stat-card medium-card"><span class="stat-label">Medium</span><strong>{{ summary().medium }}</strong><small>Needs attention</small></div>
        <div class="stat-card low-card"><span class="stat-label">Low</span><strong>{{ summary().low }}</strong><small>Minor risks</small></div>
        <div class="stat-card suggestion-card"><span class="stat-label">Suggestions</span><strong>{{ summary().suggestions }}</strong><small>Quality improvements</small></div>
        <div class="stat-card">
          <span class="stat-label">Findings reviewed</span>
          <strong>{{ summary().findings }}</strong>
          <small>Questions, risks, and quality gaps</small>
        </div>
        <div class="stat-card findings-total-card">
          <span class="stat-label">Total findings</span>
          <strong>{{ summary().findings }}</strong>
          <small>Across your review history</small>
        </div>
      </div>

      <div class="trend-panel">
        <div class="trend-header">
          <div><span class="trend-kicker">Risk overview</span><strong>Findings by review</strong></div>
          <span class="trend-total"><b>{{ summary().findings }}</b> total findings</span>
        </div>
        <div class="trend-legend"><span><i class="legend-critical"></i> Critical</span><span><i class="legend-high"></i> High</span><span><i class="legend-medium"></i> Medium</span><span><i class="legend-low"></i> Low</span><span><i class="legend-suggestion"></i> Suggestions</span></div>
        <div class="trend-chart">
          <div class="trend-axis" aria-hidden="true"><span>{{ summary().maxCount }}</span><span>{{ summary().halfCount }}</span><span>0</span></div>
          <div class="trend-plot">
            <div class="trend-grid" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div>
            <div class="trend-columns">
              @for (point of summary().trend; track point.id) {
                <div class="trend-column" [attr.aria-label]="point.name + ': ' + point.total + ' findings'">
                  <div class="trend-values"><strong>{{ point.total }}</strong><small> findings</small></div>
                  <div class="trend-bars"><span class="trend-bar critical" [style.height.%]="point.criticalHeight"></span><span class="trend-bar high" [style.height.%]="point.highHeight"></span><span class="trend-bar medium" [style.height.%]="point.mediumHeight"></span><span class="trend-bar low" [style.height.%]="point.lowHeight"></span><span class="trend-bar suggestion" [style.height.%]="point.suggestionHeight"></span></div>
                  <span class="trend-label">{{ point.label }}</span>
                </div>
              }
            </div>
          </div>
        </div>
      </div>

      <div class="history-table">
        <div class="table-head"><span>FILE / SOURCE</span><span>REVIEW ID</span><span>SEVERITY</span><span>FINDINGS</span><span>REVIEWED</span><span></span></div>
        @for (item of history(); track item.id) {
          <a class="history-row" [routerLink]="['/review', item.id]" (click)="open(item)">
            <div class="file-cell">
              <span class="file-icon">PY</span>
              <span><b>{{ item.name }}</b><small>{{ item.language }} · {{ item.source }}</small></span>
            </div>
            <span class="review-id">{{ item.id }}</span>
            <span class="history-severity"><b class="count-critical">{{ item.criticalFindings }} C</b><b class="count-high">{{ item.highFindings }} H</b><b class="count-medium">{{ item.mediumFindings }} M</b></span>
            <span class="finding-count">
              @if (item.criticalFindings > 0) {
                <span class="critical-pill">{{ item.criticalFindings }}</span>
              }
              {{ item.findings }} <small>items</small><span class="history-breakdown">C {{ item.criticalFindings }} · H {{ item.highFindings }} · M {{ item.mediumFindings }} · L {{ item.lowFindings }} · S {{ item.suggestions }}</span>
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
    const high = items.reduce((sum, item) => sum + item.highFindings, 0);
    const medium = items.reduce((sum, item) => sum + item.mediumFindings, 0);
    const low = items.reduce((sum, item) => sum + item.lowFindings, 0);
    const suggestions = items.reduce((sum, item) => sum + item.suggestions, 0);
    const findings = items.reduce((sum, item) => sum + item.findings, 0);
    const trendItems = items.slice(0, 5).reverse();
    const maxFindings = Math.max(...trendItems.map(item => item.findings), 1);
    const trend = trendItems.map(item => ({
      id: item.id,
      name: item.name,
      label: item.name.replace('.py', ''),
      critical: item.criticalFindings,
      total: item.findings,
      criticalHeight: Math.max(12, (item.criticalFindings / maxFindings) * 100),
      highHeight: Math.max(5, (item.highFindings / maxFindings) * 100),
      mediumHeight: Math.max(5, (item.mediumFindings / maxFindings) * 100),
      lowHeight: Math.max(5, (item.lowFindings / maxFindings) * 100),
      suggestionHeight: Math.max(5, (item.suggestions / maxFindings) * 100)
    }));

    return { critical, high, medium, low, suggestions, findings, maxCount: maxFindings, halfCount: Math.ceil(maxFindings / 2), trend };
  });

  open(item: Parameters<typeof this.service.load>[0]): void {
    this.service.load(item);
  }
}
