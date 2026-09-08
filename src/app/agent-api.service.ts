import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AgentApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8000/api/v1';

  modelArmor(text: string): Observable<Record<string, unknown>> {
    return this.http.post<Record<string, unknown>>(`${this.baseUrl}/security/model-armor/check`, { text, source: 'angular-agent-lab' });
  }

  evaluate(prompt: string, codeSnippet: string, expectedKeywords: string[]): Observable<Record<string, unknown>> {
    return this.http.post<Record<string, unknown>>(`${this.baseUrl}/agent/evaluate`, { prompt, code_snippet: codeSnippet, expected_keywords: expectedKeywords });
  }

  story(title: string, summary: string, findings: unknown[]): Observable<Record<string, unknown>> {
    return this.http.post<Record<string, unknown>>(`${this.baseUrl}/review/story`, { title, summary, findings });
  }

  githubReview(owner: string, repo: string, pullNumber: number, dryRun: boolean): Observable<Record<string, unknown>> {
    return this.http.post<Record<string, unknown>>(`${this.baseUrl}/review/github-pr`, { owner, repo, pull_number: pullNumber, dry_run: dryRun });
  }
}