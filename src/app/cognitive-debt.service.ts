import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TelemetryResult {
  max_nesting_score: number;
  net_new_logic_loc: number;
  mock_tautology_ratio: number;
  cdi_score: number;
  gate_blocked: boolean;
}

export interface ImplicitDecision {
  title: string;
  file_and_line: string;
  hidden_assumption: string;
  production_risk: string;
}

export interface PRReviewPayload {
  decisions: ImplicitDecision[];
  socratic_question: string;
}

export interface ExplainVerdict {
  approved: boolean;
  feedback: string;
}

export interface CognitiveDebtResponse {
  telemetry: TelemetryResult;
  payload: PRReviewPayload;
  comment_markdown: string;
  verdict?: ExplainVerdict | null;
}

export interface SampleDiffPreset {
  name: string;
  diff_text: string;
  pr_body: string;
  description: string;
}

export interface SampleDiffsResponse {
  bad_pr: SampleDiffPreset;
  clean_pr: SampleDiffPreset;
}

@Injectable({
  providedIn: 'root',
})
export class CognitiveDebtService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8000/api/v1/cognitive-debt';

  getSamples(): Observable<SampleDiffsResponse> {
    return this.http.get<SampleDiffsResponse>(`${this.baseUrl}/samples`);
  }

  analyze(diffText: string, prBody: string = ''): Observable<CognitiveDebtResponse> {
    return this.http.post<CognitiveDebtResponse>(`${this.baseUrl}/analyze`, {
      diff_text: diffText,
      pr_body: prBody,
      extract_decisions: true,
    });
  }

  explain(
    diffText: string,
    question: string,
    authorReply: string,
    telemetry?: TelemetryResult,
    payload?: PRReviewPayload
  ): Observable<CognitiveDebtResponse> {
    return this.http.post<CognitiveDebtResponse>(`${this.baseUrl}/explain`, {
      diff_text: diffText,
      question,
      author_reply: authorReply,
      telemetry,
      payload,
    });
  }
}
