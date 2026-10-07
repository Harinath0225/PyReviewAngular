import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CalibrationResult,
  EfficiencyMetrics,
  EvaluationRun,
  JudgeCalibrationState,
  JudgeModeChoice,
  KpiScorecard,
  ReliabilityMetrics,
  ScorecardSummary,
  SourceBreakdown,
  SourceFilter,
  TrajectoryDetail
} from './scorecard.models';

@Injectable({ providedIn: 'root' })
export class ScorecardService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8000/api/evaluations';

  getSummary(source: SourceFilter = 'all'): Observable<ScorecardSummary> {
    return this.http.get<ScorecardSummary>(`${this.baseUrl}/scorecard-summary`, { params: { source } });
  }

  getReliability(source: SourceFilter = 'all'): Observable<ReliabilityMetrics> {
    return this.http.get<ReliabilityMetrics>(`${this.baseUrl}/reliability-metrics`, { params: { source } });
  }

  getEfficiency(source: SourceFilter = 'all'): Observable<EfficiencyMetrics> {
    return this.http.get<EfficiencyMetrics>(`${this.baseUrl}/efficiency-metrics`, { params: { source } });
  }

  getRuns(limit = 50, source: SourceFilter = 'all'): Observable<{ count: number; runs: EvaluationRun[] }> {
    return this.http.get<{ count: number; runs: EvaluationRun[] }>(`${this.baseUrl}/runs`, { params: { limit, source } });
  }

  getSources(): Observable<SourceBreakdown> {
    return this.http.get<SourceBreakdown>(`${this.baseUrl}/sources`);
  }

  getKpis(source: SourceFilter = 'all'): Observable<KpiScorecard> {
    return this.http.get<KpiScorecard>(`${this.baseUrl}/kpis`, { params: { source } });
  }

  getJudgeCalibration(): Observable<JudgeCalibrationState> {
    return this.http.get<JudgeCalibrationState>(`${this.baseUrl}/judge-calibration`);
  }

  runJudgeCalibration(mode: JudgeModeChoice, maxRounds: number = 5): Observable<CalibrationResult> {
    return this.http.post<CalibrationResult>(`${this.baseUrl}/judge-calibration/run`, { mode });
  }

  syncAdk(): Observable<{ files_imported: number; runs_recorded: number }> {
    return this.http.post<{ files_imported: number; runs_recorded: number }>(`${this.baseUrl}/sync`, {});
  }

  getTrajectory(sessionId: string): Observable<TrajectoryDetail> {
    return this.http.get<TrajectoryDetail>(`${this.baseUrl}/trajectories/${encodeURIComponent(sessionId)}`);
  }
}
