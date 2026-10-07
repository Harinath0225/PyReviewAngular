export interface AgentDna {
  base_model: string;
  harness: string;
  sub_agents: string[];
  environment: { type: string; sandbox: string };
}

export interface ScorecardSummary {
  total_runs: number;
  passed_runs: number;
  failed_runs: number;
  capability_score: number;
  average_score: number;
  reliability_index: number;
  agent_dna: Partial<AgentDna>;
}

export interface AdaptabilityCell {
  runs: number;
  pass_rate: number;
}

export interface ReliabilityMetrics {
  reliability_index: number;
  consistency: number | null;
  robustness: number | null;
  predictability: number | null;
  safety: number | null;
  adaptability_grid: Record<string, AdaptabilityCell>;
}

export interface EfficiencyMetrics {
  total_runs: number;
  steps_median: number;
  steps_p90: number;
  latency_ms_median: number | null;
  latency_ms_p90: number | null;
  prompt_tokens_total: number;
  completion_tokens_total: number;
  cost_usd_total: number;
  cost_usd_per_task: number;
}

export type VerifierType = 'hard' | 'soft' | 'hybrid';

export type RunSource = 'agent_lab' | 'adk_eval' | 'code_review';
export type SourceFilter = 'all' | RunSource;

export const SOURCE_LABELS: Record<SourceFilter, string> = {
  all: 'Unified Scorecard (Combined)',
  agent_lab: 'Lab Benchmarks',
  adk_eval: 'ADK Web Suite',
  code_review: 'Production PRs'
};

export interface SourceBreakdownEntry {
  source: SourceFilter;
  label: string;
  total_runs: number;
  passed_runs: number;
  failed_runs: number;
  capability_score: number;
  average_score: number;
  reliability_index: number;
  steps_median: number;
  latency_ms_median: number | null;
  cost_usd_per_task: number;
  last_run_at: string | null;
}

export interface SourceBreakdown {
  combined: SourceBreakdownEntry;
  sources: SourceBreakdownEntry[];
}

export interface EvaluationRun {
  session_id: string;
  source: RunSource;
  scenario_id: string | null;
  scenario_name: string | null;
  verifier_type: VerifierType;
  status: 'PASSED' | 'FAILED' | 'BLOCKED';
  score: number;
  grade: string | null;
  trajectory_length: number;
  latency_ms: number;
  prompt_tokens: number;
  completion_tokens: number;
  cost_usd: number;
  has_noise: number;
  created_at: string;
}

export interface TrajectoryStep {
  step: number;
  tool: string;
  phase: string;
  latency_ms: number;
  status: string;
  args: Record<string, unknown>;
  result: string;
  matched: boolean;
}

export interface TrajectoryDetail {
  session_id: string;
  source: RunSource;
  verifier_type: VerifierType;
  agent_dna: Partial<AgentDna>;
  conformance: { status: string; label: string } | null;
  trajectory: { expected: string[]; actual: string[]; match_score: number | null; steps: TrajectoryStep[] } | null;
  dimensions: Record<string, number> | null;
  efficiency: Record<string, number> | null;
  noise: Record<string, unknown> | null;
  metric_results: { metric_name: string; score: number; threshold: number; status: string }[] | null;
  quality_metrics: Record<string, number> | null;
  judge: JudgeVerdict | null;
}

export interface JudgeVerdict {
  mode: 'llm' | 'heuristic';
  model: string;
  criteria: Record<string, number>;
  raw_score: number;
  score: number;
  passed: boolean;
  pass_threshold: number;
  rationale: string;
  fallback_reason: string | null;
  calibration: { applied: boolean; id: number | null };
}

export type KpiStatus = 'met' | 'at_risk' | 'missed' | 'no_data';

export interface KpiMetric {
  key: string;
  label: string;
  weight: number;
  value: number | null;
  samples: number;
}

export interface Kpi {
  id: string;
  name: string;
  description: string;
  target: number;
  value: number | null;
  status: KpiStatus;
  sample_size: number;
  metrics: KpiMetric[];
}

export interface KpiScorecard {
  source: SourceFilter;
  total_runs: number;
  kpis: Kpi[];
  calibration_id: number | null;
}

export interface AgreementMetrics {
  n: number;
  mae: number | null;
  bias: number | null;
  rmse: number | null;
  pearson: number | null;
  spearman: number | null;
  agreement: number | null;
  kappa: number | null;
}

export interface CalibrationRound {
  round: number;
  slope: number;
  intercept: number;
  threshold: number;
  selected?: boolean;
  train: AgreementMetrics;
  validation: AgreementMetrics;
}

export interface CalibrationPoint {
  id: string;
  scenario: string;
  split: 'train' | 'validation';
  human: number;
  raw: number;
  calibrated: number;
  human_pass: boolean;
  judge_pass: boolean;
}

export interface CalibrationResult {
  id?: number;
  judge: { key: string; mode: string; model: string; requested_mode: string; fallback_reasons: string[] };
  example_count: number;
  train_count: number;
  validation_count: number;
  rounds: CalibrationRound[];
  converged: boolean;
  stop_reason: string;
  params: { slope: number; intercept: number; threshold: number };
  before: AgreementMetrics;
  after: AgreementMetrics;
  improvement: { validation_mae: number; validation_agreement: number };
  trust_score: number;
  points: CalibrationPoint[];
}

export interface CalibrationHistoryEntry {
  id: number;
  judge_mode: string;
  judge_model: string;
  created_at: string;
  trust_score: number | null;
  converged: boolean | null;
  rounds: number;
  validation_mae_before: number | null;
  validation_mae_after: number | null;
}

export interface JudgeCalibrationState {
  judge: {
    requested_mode: string;
    effective_mode: string;
    model: string;
    llm_available: boolean;
    criteria: { name: string; weight: number; description: string }[];
  };
  golden_set: { examples: number; pass_human_score: number };
  latest: { id: number; created_at: string; result: CalibrationResult } | null;
  history: CalibrationHistoryEntry[];
}

export type JudgeModeChoice = 'auto' | 'llm' | 'heuristic';

export const CAPABILITIES = ['execution', 'search', 'adaptability', 'time', 'ambiguity'] as const;
