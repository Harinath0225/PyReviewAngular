import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReviewService, Severity } from './review.service';

@Component({
  selector: 'app-review', standalone: true, imports: [RouterLink],
  template: `
    @if (review(); as item) {
      <section class="page review-page">
        <div class="eyebrow">REVIEW COMPLETE <span></span> {{ item.comments.length }} / 03</div>
        <div class="review-header">
          <div>
            <a routerLink="/" class="back">← New review</a>
            <h1>{{ item.name }}</h1>
            <div class="meta"><span class="python-badge">PY</span> Python <span>·</span> {{ item.source }} <span>·</span> {{ item.time }} <span>·</span> ID {{ item.id }}</div>
          </div>
          <div class="score">
            <small>CODE HEALTH</small>
            <strong>{{ item.score }}<sup>/100</sup></strong>
            <span>{{ item.criticalFindings }} critical issues caught</span>
          </div>
        </div>

        <div class="summary-banner">
          <strong>Review summary</strong>
          <p>{{ item.summary ?? 'The review flagged a few high-priority issues that deserve attention before shipping.' }}</p>
          <div class="summary-tags">
            @for (tag of item.owaspContext ?? []; track tag) {
              <span>{{ tag }}</span>
            }
          </div>
        </div>

        <div class="review-grid">
          <div class="code-panel">
            <div class="panel-top"><span>source / {{ item.name }}</span><span>{{ item.code.split('\n').length }} lines <button title="Copy code">⧉</button></span></div>
            <div class="code-view">
              @for (line of item.code.split('\n'); track $index) {
                <div class="code-line" [class.has-comment]="commentFor($index + 1)" [class.secret-line]="isSecret(commentFor($index + 1))">
                  <span class="line-no">{{ ($index + 1).toString().padStart(2, '0') }}</span>
                  @if (commentFor($index + 1); as note) {
                    @let parts = codeParts(line || ' ', note);
                    <code>{{ parts.before }}@if (parts.match) {<mark class="evidence-highlight" [class.secret-highlight]="isSecret(note)">{{ parts.match }}</mark>}{{ parts.after }}</code>
                    <button class="marker" [class]="note.severity" [class.active]="selectedFinding()?.line === note.line" [attr.aria-label]="'Show details for line ' + note.line" (click)="selectFinding(note); $event.stopPropagation()">{{ marker(note.severity) }}</button>
                  } @else { <code>{{ line || ' ' }}</code> }
                </div>
                @if (selectedFinding()?.line === $index + 1) {
                  <div class="issue-popover">
                    <div class="popover-heading"><span class="severity-label">{{ severityLabel(selectedFinding()!.severity) }}</span><button title="Close details" (click)="selectedFinding.set(null)">×</button></div>
                    <strong>{{ selectedFinding()!.title }}</strong>
                    <p>{{ selectedFinding()!.body }}</p>
                    <span class="popover-action">Suggested replacement is shown below ↓</span>
                  </div>
                }
              }
            </div>
          </div>

          <aside class="findings">
            <div class="findings-head">
              <div><span class="panel-kicker">AI FINDINGS</span><h2>{{ item.findings }} things worth a look</h2></div>
              <button class="filter">All <span>⌄</span></button>
            </div>
            @for (note of item.comments; track note.line) {
              <article class="finding" [class]="note.severity" [class.selected]="selectedFinding()?.line === note.line" (click)="selectFinding(note)">
                <div class="finding-line">
                  <span class="severity-dot"></span>
                  <span class="severity-label">{{ severityLabel(note.severity) }}</span>
                  <span class="line-label">line {{ note.line }}</span>
                </div>
                <h3>{{ note.title }}</h3>
                <p>{{ note.body }}</p>
              </article>
            }
          </aside>
        </div>

        @if (selectedFinding(); as note) {
          <section class="comparison-panel">
            <div class="comparison-header"><div><span class="panel-kicker">SUGGESTED CHANGE</span><h2>{{ note.title }}</h2></div><span>line {{ note.line }}</span></div>
            <div class="comparison-grid">
              <div class="comparison-pane removed"><div class="comparison-label"><span>−</span> Current code</div><pre>{{ sourceLine(item.code, note.line) }}</pre></div>
              <div class="comparison-pane added"><div class="comparison-label"><span>+</span> Suggested replacement</div><pre>{{ note.replacement || 'No replacement snippet provided.' }}</pre></div>
            </div>
          </section>
        }

        <div class="feedback">
          <span>Was this review helpful?</span>
          <button [class.chosen]="feedback() === 'yes'" (click)="feedback.set('yes')">♧ Yes</button>
          <button [class.chosen]="feedback() === 'no'" (click)="feedback.set('no')">♧ Not quite</button>
          @if (feedback()) { <em>Thanks for the signal.</em> }
        </div>
      </section>
    } @else {
      <section class="page empty-state"><h1>No review yet.</h1><a routerLink="/">Start a new review →</a></section>
    }
  `
})
export class ReviewComponent {
  private readonly service = inject(ReviewService); private readonly route = inject(ActivatedRoute); private readonly router = inject(Router); readonly review = this.service.current; readonly feedback = signal<'yes' | 'no' | ''>(''); readonly selectedFinding = signal<ReturnType<typeof this.commentFor> | null>(null);
  constructor() { const id = this.route.snapshot.paramMap.get('id'); if (!id) { this.router.navigate(['/']); return; } this.service.loadById(id); if (!this.service.current()) this.router.navigate(['/']); }
  commentFor(line: number) { return this.review()?.comments.find(comment => comment.line === line); }
  selectFinding(note: NonNullable<ReturnType<typeof this.commentFor>>): void { this.selectedFinding.set(note); }
  sourceLine(code: string, line: number): string { return code.split('\n')[line - 1] || ''; }
  codeParts(line: string, note: { evidence?: string }): { before: string; match: string; after: string } {
    const evidence = note.evidence;
    if (!evidence) return { before: line, match: '', after: '' };
    const index = line.indexOf(evidence);
    if (index < 0) return { before: line, match: '', after: '' };
    return { before: line.slice(0, index), match: evidence, after: line.slice(index + evidence.length) };
  }
  isSecret(note: { title: string; evidence?: string } | undefined): boolean {
    const text = `${note?.evidence ?? ''} ${note?.title ?? ''}`.toLowerCase();
    return !!note && ['key', 'password', 'secret', 'token', 'credential', 'sensitive'].some(term => text.includes(term));
  }
  marker(severity: Severity): string { return severity === 'critical' || severity === 'high' ? '!' : severity === 'warning' || severity === 'medium' ? '▲' : '·'; }
  severityLabel(severity: Severity): string { return severity === 'critical' || severity === 'high' ? 'critical' : severity === 'warning' || severity === 'medium' ? 'warning' : 'suggestion'; }
}
