import { Injectable, signal } from '@angular/core';
import demoReviewOutput from '../../demo/sample_review_output.json';

export type ReviewInput = 'Paste code' | 'Upload file' | 'GitHub URL';
export type Severity = 'critical' | 'warning' | 'suggestion' | 'high' | 'medium' | 'low';

export interface InlineComment {
  line: number;
  severity: Severity;
  title: string;
  body: string;
  evidence?: string;
  replacement?: string;
}

interface DemoFinding {
  line: number;
  severity: 'high' | 'medium' | 'low';
  message: string;
  recommendation: string;
  evidence: string;
  replacement: string;
}

interface DemoReviewResponse {
  source_code: string;
  total_findings: number;
  findings: DemoFinding[];
  summary: string;
  owasp_context: string[];
}

const DEMO_REVIEW = demoReviewOutput as DemoReviewResponse;

export interface ReviewRecord {
  id: string;
  name: string;
  source: ReviewInput;
  language: string;
  score: number;
  findings: number;
  criticalFindings: number;
  time: string;
  code: string;
  comments: InlineComment[];
  summary?: string;
  owaspContext?: string[];
}

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private readonly storageKey = 'pyreview.history';
  readonly current = signal<ReviewRecord | null>(null);
  readonly history = signal<ReviewRecord[]>(this.readHistory());

  submit(source: ReviewInput, name: string, code: string): string {
    const mappedComments: InlineComment[] = DEMO_REVIEW.findings.map(finding => ({
      line: finding.line,
      severity: this.mapSeverity(finding.severity),
      title: finding.message,
      body: `${finding.recommendation} (${finding.evidence})`,
      evidence: finding.evidence,
      replacement: finding.replacement
    }));
    const criticalFindings = mappedComments.filter(comment => comment.severity === 'critical').length;
    const findings = mappedComments.length;

    const review: ReviewRecord = {
      id: this.createId(),
      name: 'sample_code_review.py',
      source,
      language: 'Python',
      score: 55,
      findings,
      criticalFindings,
      time: 'Just now',
      code: DEMO_REVIEW.source_code,
      comments: mappedComments,
      summary: DEMO_REVIEW.summary,
      owaspContext: DEMO_REVIEW.owasp_context
    };

    this.current.set(review);
    const nextHistory = [review, ...this.history()];
    this.history.set(nextHistory);
    this.saveHistory(nextHistory);
    return review.id;
  }

  load(review: ReviewRecord): void {
    this.current.set(review);
  }

  loadById(id: string): void {
    const review = this.history().find(item => item.id === id);
    this.current.set(review ?? null);
  }

  private createId(): string {
    const suffix = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2, 10);
    return `review-${Date.now()}-${suffix}`;
  }

  private readHistory(): ReviewRecord[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) as ReviewRecord[] : [];
    } catch {
      return [];
    }
  }

  private saveHistory(items: ReviewRecord[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(items));
    } catch {
      // Reviews remain available for the current session if storage is unavailable.
    }
  }

  private mapSeverity(severity: 'high' | 'medium' | 'low'): Severity {
    if (severity === 'high') return 'critical';
    if (severity === 'medium') return 'warning';
    return 'suggestion';
  }
}
