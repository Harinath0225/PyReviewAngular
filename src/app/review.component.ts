import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReviewService, Severity } from './review.service';

@Component({
  selector: 'app-review', standalone: true, imports: [RouterLink],
  template: `
    @if (review(); as item) {
      <section class="page review-page"><div class="eyebrow">REVIEW COMPLETE <span></span> 02 / 03</div>
        <div class="review-header"><div><a routerLink="/" class="back">← New review</a><h1>{{ item.name }}</h1><div class="meta"><span class="python-badge">PY</span> Python <span>·</span> {{ item.source }} <span>·</span> Just now</div></div><div class="score"><small>CODE HEALTH</small><strong>{{ item.score }}<sup>/100</sup></strong><span>Good foundation, room to grow</span></div></div>
        <div class="review-grid"><div class="code-panel"><div class="panel-top"><span>source / {{ item.name }}</span><span>{{ item.code.split('\n').length }} lines <button title="Copy code">⧉</button></span></div><div class="code-view">@for (line of item.code.split('\n'); track $index) { <div class="code-line" [class.has-comment]="commentFor($index + 1)"><span class="line-no">{{ ($index + 1).toString().padStart(2, '0') }}</span><code>{{ line || ' ' }}</code>@if (commentFor($index + 1); as note) { <span class="marker" [class]="note.severity">{{ marker(note.severity) }}</span> }</div> }</div></div>
          <aside class="findings"><div class="findings-head"><div><span class="panel-kicker">AI FINDINGS</span><h2>{{ item.findings }} things worth a look</h2></div><button class="filter">All <span>⌄</span></button></div>@for (note of item.comments; track note.line) { <article class="finding" [class]="note.severity"><div class="finding-line"><span class="severity-dot"></span><span class="severity-label">{{ note.severity }}</span><span class="line-label">line {{ note.line }}</span></div><h3>{{ note.title }}</h3><p>{{ note.body }}</p></article> }</aside>
        </div><div class="feedback"><span>Was this review helpful?</span><button [class.chosen]="feedback() === 'yes'" (click)="feedback.set('yes')">♧ Yes</button><button [class.chosen]="feedback() === 'no'" (click)="feedback.set('no')">♧ Not quite</button>@if (feedback()) { <em>Thanks for the signal.</em> }</div>
      </section>
    } @else { <section class="page empty-state"><h1>No review yet.</h1><a routerLink="/">Start a new review →</a></section> }
  `
})
export class ReviewComponent {
  private readonly service = inject(ReviewService); readonly review = this.service.current; readonly feedback = signal<'yes' | 'no' | ''>('');
  commentFor(line: number) { return this.review()?.comments.find(comment => comment.line === line); }
  marker(severity: Severity): string { return severity === 'critical' ? '!' : severity === 'warning' ? '▲' : '·'; }
}
