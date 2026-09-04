import { Injectable, signal } from '@angular/core';
import demoReviewOutput from '../../demo/sample_review_output.json';

export type ReviewInput = 'Paste code' | 'Upload file' | 'GitHub URL';
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'suggestion' | 'warning';

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
  severity: 'critical' | 'high' | 'medium' | 'low' | 'suggestion';
  message: string;
  recommendation: string;
  evidence: string;
  replacement: string;
}

interface DemoReviewResponse {
  source_code: string;
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
  highFindings: number;
  mediumFindings: number;
  lowFindings: number;
  suggestions: number;
  time: string;
  code: string;
  comments: InlineComment[];
  summary?: string;
  owaspContext?: string[];
}

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private readonly storageKey = 'pyreview.history.v2';
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
    const highFindings = mappedComments.filter(comment => comment.severity === 'high').length;
    const mediumFindings = mappedComments.filter(comment => comment.severity === 'medium').length;
    const lowFindings = mappedComments.filter(comment => comment.severity === 'low').length;
    const suggestions = mappedComments.filter(comment => comment.severity === 'suggestion').length;
    const findings = mappedComments.length;

    const review: ReviewRecord = {
      id: this.createId(),
      name: this.createUniqueName(),
      source,
      language: 'Python',
      score: Math.max(0, 100 - criticalFindings * 25 - highFindings * 15 - mediumFindings * 8 - lowFindings * 3 - suggestions * 2),
      findings,
      criticalFindings,
      highFindings,
      mediumFindings,
      lowFindings,
      suggestions,
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

  private createUniqueName(): string {
    const existingNames = new Set(this.history().map(item => item.name));
    let count = 1;
    while (existingNames.has(`sample_code_review-${String(count).padStart(2, '0')}.py`)) count++;
    return `sample_code_review-${String(count).padStart(2, '0')}.py`;
  }

  private readHistory(): ReviewRecord[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      const items = stored ? JSON.parse(stored) as Partial<ReviewRecord>[] : [];
      return items.map(item => ({
        ...item,
        id: item.id ?? this.createId(),
        highFindings: item.highFindings ?? 0,
        mediumFindings: item.mediumFindings ?? 0,
        lowFindings: item.lowFindings ?? 0,
        suggestions: item.suggestions ?? 0
      } as ReviewRecord));
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

  private mapSeverity(severity: DemoFinding['severity']): Severity {
    return severity;
  }
}
