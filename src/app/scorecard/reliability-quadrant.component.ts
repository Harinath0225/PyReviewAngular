import { Component, computed, input } from '@angular/core';
import { ReliabilityMetrics } from './scorecard.models';

interface Dimension {
  key: keyof Pick<ReliabilityMetrics, 'consistency' | 'robustness' | 'predictability' | 'safety'>;
  label: string;
  hint: string;
}

const DIMENSIONS: Dimension[] = [
  { key: 'consistency', label: 'Consistency', hint: 'Stability of trajectory length across repeated runs' },
  { key: 'robustness', label: 'Robustness', hint: 'Pass rate under injected noise and faults' },
  { key: 'predictability', label: 'Predictability', hint: 'Stated confidence vs. actual success' },
  { key: 'safety', label: 'Safety', hint: 'Guardrail coverage and critical-failure flags' }
];

const CENTER = 100;
const RADIUS = 80;

@Component({
  selector: 'app-reliability-quadrant',
  standalone: true,
  template: `
    <section class="sc-card">
      <h2>Reliability quadrant</h2>
      <div class="sc-quadrant">
        <svg viewBox="0 0 200 200" role="img" aria-label="Reliability radar chart">
          @for (level of levels; track level) {
            <polygon [attr.points]="ring(level)" class="sc-radar-grid" />
          }
          @for (axis of axes(); track axis.label) {
            <line [attr.x1]="center" [attr.y1]="center" [attr.x2]="axis.x" [attr.y2]="axis.y" class="sc-radar-grid" />
            <text [attr.x]="axis.lx" [attr.y]="axis.ly" text-anchor="middle" class="sc-radar-label">{{ axis.label }}</text>
          }
          <polygon [attr.points]="shape()" class="sc-radar-shape" />
        </svg>
        <div class="sc-quad-grid">
          @for (d of dimensions; track d.key) {
            <div class="sc-quad-cell">
              <span class="sc-kicker">{{ d.label }}</span>
              <strong>{{ value(d.key) === null ? 'n/a' : value(d.key) }}</strong>
              <small>{{ d.hint }}</small>
            </div>
          }
        </div>
      </div>
    </section>
  `
})
export class ReliabilityQuadrantComponent {
  readonly metrics = input<ReliabilityMetrics | null>(null);
  readonly dimensions = DIMENSIONS;
  readonly center = CENTER;
  readonly levels = [0.25, 0.5, 0.75, 1];

  readonly axes = computed(() =>
    DIMENSIONS.map((d, i) => {
      const [x, y] = this.point(i, 1);
      const [lx, ly] = this.point(i, 1.14);
      return { label: d.label, x, y, lx, ly: ly + 3 };
    })
  );

  readonly shape = computed(() =>
    DIMENSIONS.map((d, i) => this.point(i, (this.value(d.key) ?? 0) / 100).join(',')).join(' ')
  );

  value(key: Dimension['key']): number | null {
    return this.metrics()?.[key] ?? null;
  }

  ring(level: number): string {
    return DIMENSIONS.map((_, i) => this.point(i, level).join(',')).join(' ');
  }

  private point(index: number, scale: number): [number, number] {
    const angle = (Math.PI * 2 * index) / DIMENSIONS.length - Math.PI / 2;
    return [CENTER + Math.cos(angle) * RADIUS * scale, CENTER + Math.sin(angle) * RADIUS * scale];
  }
}
