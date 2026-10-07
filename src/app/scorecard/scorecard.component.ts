import { Component, OnInit, ViewEncapsulation, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { AdaptabilityGridComponent } from './adaptability-grid.component';
import { EfficiencyMetricsComponent } from './efficiency-metrics.component';
import { HeroStatsComponent } from './hero-stats.component';
import { JudgeCalibrationComponent } from './judge-calibration.component';
import { KpiMappingComponent } from './kpi-mapping.component';
import { ReliabilityQuadrantComponent } from './reliability-quadrant.component';
import {
  EfficiencyMetrics,
  EvaluationRun,
  KpiScorecard,
  ReliabilityMetrics,
  ScorecardSummary,
  SOURCE_LABELS,
  SourceBreakdown,
  SourceFilter
} from './scorecard.models';
import { ScorecardService } from './scorecard.service';
import { SourceComparisonComponent } from './source-comparison.component';
import { TrajectoryLogsComponent } from './trajectory-logs.component';
import { MetricExplainerComponent } from './metric-explainer.component';
import { BehaviorStudioComponent } from './behavior-studio.component';
import { TokenomicsDashboardComponent } from './tokenomics-dashboard.component';
import { AdkWebuiPanelComponent } from './adk-webui-panel.component';

@Component({
  selector: 'app-scorecard',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    HeroStatsComponent,
    ReliabilityQuadrantComponent,
    AdaptabilityGridComponent,
    EfficiencyMetricsComponent,
    TrajectoryLogsComponent,
    SourceComparisonComponent,
    KpiMappingComponent,
    JudgeCalibrationComponent,
    MetricExplainerComponent,
    BehaviorStudioComponent,
    TokenomicsDashboardComponent,
    AdkWebuiPanelComponent
  ],
  styles: [`
    .sc-page { display: grid; gap: 20px; }
    .sc-head { display: flex; justify-content: space-between; align-items: end; gap: 16px; }
    .sc-head h1 { margin: 0; }
    .sc-head p { margin: 4px 0 0; color: var(--muted); }
    .sc-card { background: var(--card); border: 1px solid var(--line); border-radius: 10px; padding: 18px; min-width: 0; }
    .sc-card h2 { margin: 0 0 14px; font-size: 16px; }
    .sc-kicker { color: var(--muted); font-size: 11px; letter-spacing: .08em; text-transform: uppercase; }
    .sc-muted { color: var(--muted); font-size: 12px; }
    .sc-error { color: var(--coral); }
    .sc-hero { display: grid; grid-template-columns: 1fr 1fr 1.3fr; gap: 16px; }
    .sc-gauge { display: flex; align-items: center; gap: 16px; }
    .sc-gauge svg { width: 130px; flex: none; }
    .sc-gauge p { margin: 6px 0 0; color: var(--muted); font-size: 12px; }
    .sc-ring-bg { fill: none; stroke: var(--line); stroke-width: 12; }
    .sc-ring-fg { fill: none; stroke-width: 12; stroke-linecap: round; transition: stroke-dashoffset .6s ease; }
    .sc-ring-value { fill: var(--ink); font-size: 30px; font-weight: 700; }
    .sc-dna dl { display: grid; grid-template-columns: auto 1fr; gap: 6px 14px; margin: 10px 0 0; font-size: 13px; }
    .sc-dna dt { color: var(--muted); }
    .sc-dna dd { margin: 0; overflow-wrap: anywhere; }
    .sc-quadrant { display: grid; grid-template-columns: minmax(180px, 260px) 1fr; gap: 20px; align-items: center; }
    .sc-radar-grid { fill: none; stroke: var(--line); stroke-width: 1; }
    .sc-radar-shape { fill: color-mix(in srgb, var(--teal) 30%, transparent); stroke: var(--teal); stroke-width: 2; }
    .sc-radar-label { fill: var(--muted); font-size: 8px; }
    .sc-quad-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .sc-quad-cell { border: 1px solid var(--line); border-radius: 8px; padding: 10px; display: flex; flex-direction: column; gap: 4px; }
    .sc-quad-cell strong { font-size: 24px; }
    .sc-quad-cell small { color: var(--muted); font-size: 11px; }
    .sc-heatmap { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; }
    .sc-heat-cell { border: 1px solid var(--line); border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 6px;
      background: color-mix(in srgb, var(--teal) calc(var(--heat, 0) * 28%), var(--card)); }
    .sc-heat-cell strong { font-size: 22px; }
    .sc-heat-cell small { color: var(--muted); font-size: 11px; }
    .sc-bar { height: 6px; background: var(--line); border-radius: 3px; overflow: hidden; }
    .sc-bar span { display: block; height: 100%; background: var(--teal); }
    .sc-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .sc-table th, .sc-table td { text-align: left; padding: 8px 10px; border-bottom: 1px solid var(--line); }
    .sc-table th { color: var(--muted); font-weight: 500; font-size: 11px; text-transform: uppercase; letter-spacing: .06em; }
    .sc-spark { width: 100px; height: 24px; }
    .sc-spark polyline { fill: none; stroke: var(--teal); stroke-width: 1.5; vector-effect: non-scaling-stroke; }
    .sc-session { border: 1px solid var(--line); border-radius: 8px; margin-bottom: 8px; overflow: hidden; }
    .sc-session-head { all: unset; box-sizing: border-box; display: flex; align-items: center; gap: 12px; width: 100%; padding: 10px 14px; cursor: pointer; }
    .sc-session-head:hover, .sc-session-head:focus-visible { background: color-mix(in srgb, var(--teal) 8%, transparent); }
    .sc-session-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .sc-session-body { padding: 4px 14px 14px; border-top: 1px solid var(--line); }
    .sc-step { border-left: 3px solid var(--teal); padding: 4px 0 4px 12px; margin: 10px 0; }
    .sc-step-head { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
    .sc-step pre { margin: 6px 0; font-size: 11px; white-space: pre-wrap; color: var(--muted); }
    .sc-step p { margin: 0; font-size: 13px; }
    .sc-pill { font-size: 10px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; padding: 2px 8px; border-radius: 999px; border: 1px solid var(--line); }
    .sc-pill.passed { color: var(--teal); border-color: var(--teal); }
    .sc-pill.failed { color: var(--coral); border-color: var(--coral); }
    .sc-pill.blocked { color: var(--amber); border-color: var(--amber); }
    .sc-pill.verifier.hard { color: var(--blue); border-color: var(--blue); }
    .sc-pill.verifier.soft { color: var(--magenta); border-color: var(--magenta); }
    .sc-pill.verifier.hybrid { color: var(--amber); border-color: var(--amber); }
    .sc-src-pill { font-size: 10px; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; padding: 2px 8px; border-radius: 999px; border: 1px solid var(--line); white-space: nowrap; }
    .sc-src-pill.agent_lab { color: var(--teal); border-color: var(--teal); }
    .sc-src-pill.adk_eval { color: var(--blue); border-color: var(--blue); }
    .sc-src-pill.code_review { color: var(--magenta); border-color: var(--magenta); }
    .sc-src-pill.all { color: var(--ink); border-color: var(--ink); }
    .sc-tabs { display: flex; gap: 6px; flex-wrap: wrap; }
    .sc-tab { all: unset; box-sizing: border-box; cursor: pointer; font-size: 12px; font-weight: 600; padding: 6px 14px; border-radius: 999px; border: 1px solid var(--line); color: var(--muted); }
    .sc-tab:hover, .sc-tab:focus-visible { color: var(--ink); }
    .sc-tab.active { color: var(--ink); border-color: var(--teal); background: color-mix(in srgb, var(--teal) 12%, transparent); }
    .sc-compare { overflow-x: auto; }
    .sc-compare-row { cursor: pointer; }
    .sc-compare-row.selected td { background: color-mix(in srgb, var(--teal) 7%, transparent); }
    .sc-compare-row:hover td { background: color-mix(in srgb, var(--teal) 5%, transparent); }
    .sc-metric-table { margin-bottom: 14px; }
    .sc-sync-note { color: var(--teal); font-size: 12px; margin: 6px 0 0; }
    .sc-head-actions { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
    .sc-sync-btn { all: unset; box-sizing: border-box; cursor: pointer; font-size: 12px; font-weight: 600; padding: 8px 14px; border-radius: 8px; border: 1px solid var(--line); color: var(--ink); }
    .sc-sync-btn:hover:not(:disabled), .sc-sync-btn:focus-visible:not(:disabled) { border-color: var(--teal); color: var(--teal); }
    .sc-sync-btn:disabled { opacity: .5; cursor: default; }
    .sc-kpi-intro { margin: -6px 0 14px; }
    .sc-kpi-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 12px; }
    .sc-kpi { border: 1px solid var(--line); border-radius: 8px; padding: 14px; display: flex; flex-direction: column; gap: 8px; border-top: 3px solid var(--line); }
    .sc-kpi.met { border-top-color: var(--teal); }
    .sc-kpi.at_risk { border-top-color: var(--amber); }
    .sc-kpi.missed { border-top-color: var(--coral); }
    .sc-kpi header { display: flex; justify-content: space-between; gap: 8px; align-items: center; }
    .sc-kpi-status { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; }
    .sc-kpi-status.met { color: var(--teal); }
    .sc-kpi-status.at_risk { color: var(--amber); }
    .sc-kpi-status.missed { color: var(--coral); }
    .sc-kpi-status.no_data { color: var(--muted); }
    .sc-kpi-value { font-size: 28px; font-weight: 700; }
    .sc-kpi-value small { font-size: 11px; font-weight: 400; color: var(--muted); margin-left: 6px; }
    .sc-kpi-bar { position: relative; overflow: visible; }
    .sc-kpi-bar i { position: absolute; top: -3px; bottom: -3px; width: 2px; background: var(--ink); }
    .sc-kpi p { margin: 0; }
    .sc-kpi ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 4px; font-size: 12px; }
    .sc-kpi li { display: grid; grid-template-columns: 1fr auto auto; gap: 8px; align-items: baseline; }
    .sc-kpi li.context { color: var(--muted); }
    .sc-kpi li em { font-size: 10px; }
    .sc-kpi li small { color: var(--muted); font-size: 10px; }
    .sc-cal-head { display: flex; justify-content: space-between; gap: 16px; align-items: start; flex-wrap: wrap; }
    .sc-cal-head h2 { margin-bottom: 4px; }
    .sc-cal-head p { margin: 0; max-width: 640px; }
    .sc-cal-actions { display: flex; gap: 8px; align-items: center; }
    .sc-select { background: var(--card); color: var(--ink); border: 1px solid var(--line); border-radius: 8px; padding: 8px 10px; }
    .sc-judge-info { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin: 12px 0 6px; }
    .sc-criteria { list-style: none; margin: 0 0 14px; padding: 0; display: flex; gap: 8px; flex-wrap: wrap; font-size: 12px; }
    .sc-criteria li { border: 1px solid var(--line); border-radius: 999px; padding: 3px 10px; display: flex; gap: 8px; }
    .sc-cal-summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin: 12px 0 6px; }
    .sc-cal-summary > div { border: 1px solid var(--line); border-radius: 8px; padding: 10px; display: flex; flex-direction: column; gap: 3px; }
    .sc-cal-summary strong { font-size: 18px; }
    .sc-cal-summary small { color: var(--muted); font-size: 11px; }
    .sc-cal-body { display: grid; grid-template-columns: 1fr minmax(220px, 280px); gap: 20px; align-items: start; margin-top: 8px; }
    .sc-cal-body h3, .sc-cal h3, .sc-card h3 { font-size: 13px; margin: 12px 0 8px; }
    .sc-round-selected td { background: color-mix(in srgb, var(--teal) 10%, transparent); font-weight: 600; }
    .sc-round-selected em { color: var(--teal); font-size: 10px; }
    .sc-plot { margin: 0; }
    .sc-plot svg { width: 100%; }
    .sc-plot figcaption { font-size: 11px; line-height: 1.5; }
    .sc-plot-frame { fill: none; stroke: var(--line); }
    .sc-plot-diagonal { stroke: var(--muted); stroke-dasharray: 3 3; }
    .sc-plot-move { stroke: var(--line); stroke-width: 1; }
    .sc-plot-raw { fill: none; stroke: var(--muted); }
    .sc-plot-cal.train { fill: var(--teal); }
    .sc-plot-cal.validation { fill: var(--magenta); }
    .sc-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin: 0 4px 0 8px; border: 1px solid var(--muted); }
    .sc-dot.train { background: var(--teal); border-color: var(--teal); }
    .sc-dot.validation { background: var(--magenta); border-color: var(--magenta); }
    .sc-judge-card { border: 1px solid var(--line); border-radius: 8px; padding: 12px; margin: 8px 0 14px; display: grid; gap: 6px; }
    .sc-judge-head { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
    .sc-judge-row { display: grid; grid-template-columns: 190px 1fr 36px; gap: 10px; align-items: center; font-size: 12px; text-transform: capitalize; }
    .sc-judge-card p { margin: 0; }
    .sc-two { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    @media (max-width: 900px) {
      .sc-hero, .sc-two, .sc-quadrant, .sc-cal-body { grid-template-columns: 1fr; }
      .sc-heatmap { grid-template-columns: repeat(2, 1fr); }
    }
  `],
  template: `
    <section class="page sc-page">
      <div class="sc-head">
        <div>
          <div class="eyebrow">PYREVIEW OBSERVABILITY <span></span> UNIFIED AGENT SCORECARD</div>
          <h1>Agent scorecard.</h1>
          <p>Unified capability, reliability, tokenomics and LLM-as-a-judge across benchmark and production runs.</p>
          @if (syncMessage()) { <p class="sc-sync-note">{{ syncMessage() }}</p> }
        </div>
        <div class="sc-head-actions">
          <button type="button" class="sc-sync-btn" (click)="syncAdk()" [disabled]="loading()" title="Import ADK Web UI eval results written under agents/<app>/.adk/eval_history">Sync ADK evals</button>
          <button type="button" class="primary-btn" (click)="load()" [disabled]="loading()">Refresh</button>
        </div>
      </div>



      @if (error()) { <p class="sc-error" role="alert">{{ error() }}</p> }

      <app-hero-stats [summary]="summary()" />
      <app-tokenomics-dashboard [metrics]="efficiency()" />
      <app-adk-webui-panel (onSync)="syncAdk()" />
      <app-behavior-studio [currentCapability]="summary()?.capability_score ?? 25" [currentReliability]="summary()?.reliability_index ?? 65" [currentCost]="efficiency()?.cost_usd_per_task ?? 0.003" />
      <app-judge-calibration (calibrated)="load()" />
      <app-metric-explainer />
      <app-reliability-quadrant [metrics]="reliability()" />
      <div class="sc-two">
        <app-adaptability-grid [metrics]="reliability()" />
        <app-efficiency-metrics [metrics]="efficiency()" [runs]="runs()" />
      </div>
      <app-kpi-mapping [scorecard]="kpis()" />
      <app-source-comparison [breakdown]="breakdown()" [selected]="source()" (select)="setSource($event)" />
      <app-trajectory-logs [runs]="runs()" />
    </section>
  `
})
export class ScorecardComponent implements OnInit {
  private readonly service = inject(ScorecardService);

  readonly summary = signal<ScorecardSummary | null>(null);
  readonly reliability = signal<ReliabilityMetrics | null>(null);
  readonly efficiency = signal<EfficiencyMetrics | null>(null);
  readonly runs = signal<EvaluationRun[]>([]);
  readonly breakdown = signal<SourceBreakdown | null>(null);
  readonly kpis = signal<KpiScorecard | null>(null);
  readonly source = signal<SourceFilter>('all');
  readonly loading = signal(false);
  readonly error = signal('');
  readonly syncMessage = signal('');

  readonly tabs: { value: SourceFilter; label: string }[] = (
    ['all', 'agent_lab', 'adk_eval', 'code_review'] as SourceFilter[]
  ).map(value => ({ value, label: SOURCE_LABELS[value] }));

  ngOnInit(): void {
    this.load();
  }

  setSource(source: SourceFilter): void {
    if (source === this.source()) return;
    this.source.set(source);
    this.load();
  }

  syncAdk(): void {
    this.syncMessage.set('');
    this.service.syncAdk().subscribe({
      next: result => {
        this.syncMessage.set(result.runs_recorded > 0
          ? `Imported ${result.runs_recorded} ADK run(s) from ${result.files_imported} file(s).`
          : 'ADK eval results are already up to date.');
        this.load();
      },
      error: () => this.syncMessage.set('ADK sync failed. Check that the backend is running.')
    });
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    const source = this.source();
    forkJoin({
      summary: this.service.getSummary(source),
      reliability: this.service.getReliability(source),
      efficiency: this.service.getEfficiency(source),
      runs: this.service.getRuns(50, source),
      breakdown: this.service.getSources(),
      kpis: this.service.getKpis(source)
    }).subscribe({
      next: ({ summary, reliability, efficiency, runs, breakdown, kpis }) => {
        this.summary.set(summary);
        this.reliability.set(reliability);
        this.efficiency.set(efficiency);
        this.runs.set(runs.runs);
        this.breakdown.set(breakdown);
        this.kpis.set(kpis);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load scorecard data. Is the API running on http://localhost:8000?');
        this.loading.set(false);
      }
    });
  }
}
