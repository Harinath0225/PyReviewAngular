import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReviewService } from './review.service';

@Component({ selector: 'app-history', standalone: true, imports: [RouterLink], template: `
  <section class="page history-page"><div class="eyebrow">YOUR REVIEWS <span></span> 03 / 03</div><div class="history-heading"><div><h1>Review history.</h1><p>A record of the code you are making better.</p></div><a routerLink="/" class="primary-btn">+ New review</a></div>
  <div class="history-table"><div class="table-head"><span>FILE / SOURCE</span><span>HEALTH</span><span>FINDINGS</span><span>REVIEWED</span><span></span></div>@for (item of history(); track item.id) { <a class="history-row" routerLink="/review" (click)="open(item)"><div class="file-cell"><span class="file-icon">PY</span><span><b>{{ item.name }}</b><small>{{ item.source }}</small></span></div><strong class="table-score" [class.high]="item.score > 85">{{ item.score }}<small>/100</small></strong><span class="finding-count">{{ item.findings }} <small>items</small></span><span class="reviewed">{{ item.time }}</span><span class="row-arrow">→</span></a> }</div><div class="history-note"><span>✦</span> Reviews are stored locally in this demo. Connect your BE to persist them for your team.</div></section>
` })
export class HistoryComponent { private readonly service = inject(ReviewService); readonly history = this.service.history; open(item: Parameters<typeof this.service.load>[0]): void { this.service.load(item); } }
