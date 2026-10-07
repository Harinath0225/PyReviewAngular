import { Component, input } from '@angular/core';
import { ScorecardSummary } from './scorecard.models';

const RING_RADIUS = 54;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

@Component({
  selector: 'app-hero-stats',
  standalone: true,
  template: `
    <section class="sc-hero">
      @for (gauge of gauges(); track gauge.label) {
        <div class="sc-card sc-gauge">
          <svg viewBox="0 0 140 140" role="img" [attr.aria-label]="gauge.label + ' ' + gauge.value + ' out of 100'">
            <circle cx="70" cy="70" [attr.r]="radius" class="sc-ring-bg" />
            <circle cx="70" cy="70" [attr.r]="radius" class="sc-ring-fg" [style.stroke]="gauge.color"
              [attr.stroke-dasharray]="circumference" [attr.stroke-dashoffset]="circumference * (1 - gauge.value / 100)"
              transform="rotate(-90 70 70)" />
            <text x="70" y="76" text-anchor="middle" class="sc-ring-value">{{ gauge.value }}</text>
          </svg>
          <div>
            <span class="sc-kicker">{{ gauge.label }}</span>
            <p>{{ gauge.hint }}</p>
          </div>
        </div>
      }
      <div class="sc-card sc-dna">
        <span class="sc-kicker">Agent DNA</span>
        @if (summary(); as s) {
          <dl>
            <dt>Base model</dt><dd>{{ s.agent_dna.base_model || 'n/a' }}</dd>
            <dt>Harness</dt><dd>{{ s.agent_dna.harness || 'n/a' }}</dd>
            <dt>Sub-agents</dt><dd>{{ s.agent_dna.sub_agents?.join(', ') || 'n/a' }}</dd>
            <dt>Environment</dt>
            <dd>{{ s.agent_dna.environment?.type || 'n/a' }} / {{ s.agent_dna.environment?.sandbox || 'n/a' }}</dd>
            <dt>Runs</dt><dd>{{ s.passed_runs }} passed of {{ s.total_runs }}</dd>
          </dl>
        }
      </div>
    </section>
  `
})
export class HeroStatsComponent {
  readonly summary = input<ScorecardSummary | null>(null);
  readonly radius = RING_RADIUS;
  readonly circumference = RING_CIRCUMFERENCE;

  gauges() {
    const s = this.summary();
    return [
      {
        label: 'Capability score',
        value: Math.round(s?.capability_score ?? 0),
        hint: 'Success rate across evaluation runs (Pass@K).',
        color: 'var(--teal)'
      },
      {
        label: 'Reliability index',
        value: Math.round(s?.reliability_index ?? 0),
        hint: 'Composite of consistency, robustness, predictability and safety.',
        color: 'var(--magenta)'
      }
    ];
  }
}
