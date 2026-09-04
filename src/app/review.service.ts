import { Injectable, signal } from '@angular/core';

export type ReviewInput = 'Paste code' | 'Upload file' | 'GitHub URL';
export type Severity = 'critical' | 'warning' | 'suggestion';
export interface InlineComment { line: number; severity: Severity; title: string; body: string; }
export interface ReviewRecord { id: number; name: string; source: ReviewInput; language: string; score: number; findings: number; time: string; code: string; comments: InlineComment[]; }

@Injectable({ providedIn: 'root' })
export class ReviewService {
  readonly current = signal<ReviewRecord | null>(null);
  readonly history = signal<ReviewRecord[]>([
    { id: 1, name: 'csv_processor.py', source: 'Upload file', language: 'Python', score: 78, findings: 4, time: 'Today, 10:42 AM', code: '', comments: [] },
    { id: 2, name: 'rate_limiter.py', source: 'GitHub URL', language: 'Python', score: 91, findings: 2, time: 'Yesterday, 4:18 PM', code: '', comments: [] },
    { id: 3, name: 'data_cleaning.py', source: 'Paste code', language: 'Python', score: 86, findings: 3, time: 'Aug 27, 2026', code: '', comments: [] }
  ]);

  submit(source: ReviewInput, name: string, code: string): void {
    const comments: InlineComment[] = [
      { line: 4, severity: 'critical', title: 'Mutable default argument', body: 'Using a list as a default argument can leak state between calls. Use None and initialize inside the function.' },
      { line: 8, severity: 'warning', title: 'Broad exception handler', body: 'Catching Exception can hide unexpected failures. Catch the specific errors you expect from the parser.' },
      { line: 12, severity: 'suggestion', title: 'Prefer a generator', body: 'This list can be streamed with a generator expression to reduce memory usage on large inputs.' }
    ];
    const review: ReviewRecord = { id: Date.now(), name: name || 'untitled.py', source, language: 'Python', score: 78, findings: comments.length, time: 'Just now', code: code || this.sampleCode, comments };
    this.current.set(review);
    this.history.update(items => [review, ...items]);
  }

  load(review: ReviewRecord): void { this.current.set(review); }

  readonly sampleCode = `def load_users(path, cache=[]):\n    with open(path) as file:\n        rows = file.readlines()\n\n    try:\n        return [parse_user(row) for row in rows]\n    except Exception:\n        return []\n\n\ndef active_users(users):\n    return [user for user in users if user.is_active]`;
}
