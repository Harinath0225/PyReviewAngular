import { Component, inject, signal, OnDestroy, ViewChild, ElementRef, effect } from '@angular/core';
import { SlicePipe, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReviewService, Severity } from './review.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

type WorkflowStatus = 'pending' | 'running' | 'completed';
interface WorkflowNode {
  id: string;
  label: string;
  detail: string;
}

@Component({
  selector: 'app-review', standalone: true, imports: [RouterLink, SlicePipe, DatePipe],
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
            <div class="review-counts"><b class="count-critical">{{ item.criticalFindings }} C</b><b class="count-high">{{ item.highFindings }} H</b><b class="count-medium">{{ item.mediumFindings }} M</b><b class="count-low">{{ item.lowFindings }} L</b><b class="count-suggestion">{{ item.suggestions }} S</b></div>
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

        <section class="dag-panel">
          <div class="dag-heading"><div><span class="panel-kicker">LIVE ORCHESTRATION</span><h2>Review execution</h2><p>Each stage begins after the preceding stage completes.</p></div><span>{{ workflowEvents(item).length }} events</span></div>
          <div class="workflow-legend"><span><i class="legend-running"></i>active</span><span><i class="legend-complete"></i>complete</span><span><i class="legend-pending"></i>waiting</span></div>
          <div class="workflow-lane" #workflowLane role="img" aria-label="Sequential agentic review workflow">
            @for (node of workflowNodes; track node.id) {
              <button class="workflow-node" [class]="workflowStatus(node.id, workflowEvents(item))" [class.selected]="selectedWorkflowNode() === node.id" (click)="selectedWorkflowNode.set(selectedWorkflowNode() === node.id ? '' : node.id)">
                <span class="workflow-node-top"><i></i><b>{{ node.label }}</b><em>{{ workflowStatus(node.id, workflowEvents(item)) }}</em></span>
                <strong>{{ node.detail }}</strong>
                <small>{{ latestEvent(node.id, workflowEvents(item)) }}</small>
              </button>
              @if (!$last) { <span class="workflow-connector" [class.active]="workflowStatus(node.id, workflowEvents(item)) === 'completed'"><i></i></span> }
            }
          </div>
          <div class="workflow-log">
            <div class="workflow-log-head"><span>LIVE EVENT LOG</span><button (click)="selectedWorkflowNode.set('')">All events</button></div>
            @for (event of visibleWorkflowEvents(item); track $index) {
              <div class="workflow-log-row"><time>{{ event.timestamp | slice:11:19 }}</time><b>{{ event.node.replaceAll('_', ' ') }}</b><span>{{ event.event.replaceAll('_', ' ') }}</span></div>
            }
          </div>
        </section>

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

        <section class="senior-guidance">
          <div><span class="panel-kicker">SENIOR DEVELOPER GUIDANCE</span><h2>Recommended next actions</h2></div>
          <ol>
            @for (recommendation of item.recommendations; track recommendation) { <li>{{ recommendation }}</li> }
            @empty { <li>Apply the suggested replacement, add a regression test, and rerun the review before merge.</li> }
          </ol>
          @if (item.owaspFindings.length) { <div class="owasp-links"><span>OWASP tool results</span>@for (finding of item.owaspFindings; track finding.category) { <a [href]="finding.url" target="_blank" rel="noopener">{{ finding.category }} <small>{{ finding.importance }}</small></a> }</div> }
        </section>

        @if (item.businessLogicFindings?.length) {
          <section class="business-logic-panel">
            <div class="business-logic-header"><span class="panel-kicker">BUSINESS LOGIC ALIGNMENT</span><h2>Requirements analysis</h2></div>
            <div class="business-logic-list">
              @for (finding of item.businessLogicFindings; track finding.issue) {
                <article class="business-finding" [class]="finding.severity">
                  <div class="finding-header">
                    <span class="severity-badge">{{ finding.severity.toUpperCase() }}</span>
                    <strong>{{ finding.issue }}</strong>
                  </div>
                  <div class="finding-details">
                    <p><strong>Context:</strong> {{ finding.context }}</p>
                    <p><strong>Impact:</strong> {{ finding.alignment }}</p>
                  </div>
                </article>
              }
            </div>
          </section>
        }

        @if (item.businessDocuments?.length) {
          <section class="business-documents-panel">
            <div class="business-docs-header"><span class="panel-kicker">BUSINESS CONTEXT</span><h2>Uploaded documents</h2></div>
            <div class="business-docs-list">
              @for (doc of item.businessDocuments; track doc.fileName) {
                <div class="doc-preview">
                  <span class="doc-type-badge">{{ doc.type }}</span>
                  <strong>{{ doc.fileName }}</strong>
                  <small>{{ doc.uploadedAt | date: 'short' }}</small>
                </div>
              }
            </div>
          </section>
        }

        <div class="feedback">
          <span>Help improve the agent</span>
          <button [class.chosen]="feedback() === 'helpful'" (click)="feedback.set('helpful')">Helpful</button>
          <button [class.chosen]="feedback() === 'needs_work'" (click)="feedback.set('needs_work')">Needs work</button>
          @if (feedback()) { <input #feedbackComment placeholder="What should the next review improve?" (keyup.enter)="sendFeedback(item.id, feedbackComment.value)"><button class="feedback-send" (click)="sendFeedback(item.id, feedbackComment.value)">Send feedback</button> }
          @if (feedbackSent()) { <em>Feedback recorded for future review improvements.</em> }
        </div>
      </section>
    } @else {
      <section class="page empty-state"><h1>No review yet.</h1><a routerLink="/">Start a new review →</a></section>
    }
  `
})
export class ReviewComponent implements OnDestroy {
  private readonly service = inject(ReviewService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();
  readonly review = this.service.current;
  readonly feedback = signal<'helpful' | 'needs_work' | ''>('');
  readonly feedbackSent = signal(false);
  readonly selectedFinding = signal<ReturnType<typeof this.commentFor> | null>(null);
  readonly selectedWorkflowNode = signal('');
  readonly workflowNodes: WorkflowNode[] = [
    { id: 'orchestrator', label: 'Orchestrator', detail: 'Pipeline control' },
    { id: 'deterministic_ast', label: 'Deterministic AST', detail: 'Static parsing' },
    { id: 'ruff', label: 'Ruff', detail: 'Lint security checks' },
    { id: 'rag', label: 'Tool call: RAG', detail: 'History retrieval' },
    { id: 'owasp', label: 'OWASP tool', detail: 'Category + links' },
    { id: 'llm_model', label: 'LLM model', detail: 'Reasoning and fixes' },
    { id: 'pull_request', label: 'PR review ready', detail: 'Ready to publish' }
  ];
  @ViewChild('workflowLane') workflowLane: ElementRef | undefined;

  constructor() { 
    const id = this.route.snapshot.paramMap.get('id'); 
    if (!id) { this.router.navigate(['/']); return; } 
    this.service.loadById(id); 
    if (!this.service.current()) this.router.navigate(['/']); 
    
    // Watch for running stage changes and auto-scroll
    effect(() => {
      const item = this.review();
      if (item && this.workflowLane) {
        setTimeout(() => this.autoScrollToActiveStage(item), 100);
      }
    });
  }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
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
  marker(severity: Severity): string { return severity === 'critical' ? '!' : severity === 'high' ? '◆' : severity === 'medium' || severity === 'warning' ? '▲' : severity === 'low' ? '•' : '·'; }
  severityLabel(severity: Severity): string { return severity === 'warning' ? 'medium' : severity; }
  workflowEvents(item: { dagEvents: import('./review.service').DagEvent[] }): import('./review.service').DagEvent[] { return this.service.liveEvents().length ? this.service.liveEvents() : item.dagEvents; }
  workflowStatus(node: string, events: import('./review.service').DagEvent[]): WorkflowStatus {
    const stageIndex = this.workflowNodes.findIndex(item => item.id === node);
    if (stageIndex < 0) return 'pending';
    if (this.isStageCompleted(node, events)) return 'completed';
    const activeIndex = this.workflowNodes.findIndex(item => this.isStageStarted(item.id, events) && !this.isStageCompleted(item.id, events));
    return activeIndex === stageIndex ? 'running' : 'pending';
  }
  latestEvent(node: string, events: import('./review.service').DagEvent[]): string { return this.stageEvents(node, events).at(-1)?.event.replaceAll('_', ' ') ?? 'waiting for upstream'; }
  visibleWorkflowEvents(item: { dagEvents: import('./review.service').DagEvent[] }): import('./review.service').DagEvent[] { const events = this.workflowEvents(item); return this.selectedWorkflowNode() ? this.stageEvents(this.selectedWorkflowNode(), events) : events; }
  sendFeedback(reviewId: string, comment: string): void {
    const rating = this.feedback();
    if (!rating) return;
    this.service.submitFeedback(reviewId, rating, comment)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.feedbackSent.set(true),
        error: (err) => console.error('Feedback submission failed:', err),
        complete: () => console.log('Feedback submitted')
      });
  }

  private autoScrollToActiveStage(item: { dagEvents: import('./review.service').DagEvent[] }): void {
    if (!this.workflowLane) return;
    const laneElement = this.workflowLane.nativeElement;
    const activeNode = laneElement.querySelector('.workflow-node.running');
    if (activeNode) {
      const nodeRect = activeNode.getBoundingClientRect();
      const laneRect = laneElement.getBoundingClientRect();
      const scrollLeft = laneElement.scrollLeft;
      const offset = nodeRect.left - laneRect.left;
      
      // Scroll to center the active node, leaving some space from the left
      laneElement.scrollTo({
        left: scrollLeft + offset - 100,
        behavior: 'smooth'
      });
    }
  }

  private stageEvents(stageId: string, events: import('./review.service').DagEvent[]): import('./review.service').DagEvent[] {
    return events.filter(event => {
      if (stageId === 'orchestrator') return event.node === 'orchestrator' || event.node === 'model_armor';
      if (stageId === 'deterministic_ast') return event.node === 'static_analysis' || event.event.includes('python_ast_scanner');
      if (stageId === 'ruff') return event.node === 'ruff';
      if (stageId === 'rag') return event.node === 'rag';
      if (stageId === 'owasp') return event.node === 'owasp' || event.event.includes('owasp_context');
      if (stageId === 'llm_model') return event.node === 'agent_reasoner' || event.node === 'review_reasoner';
      if (stageId === 'pull_request') return event.node === 'pull_request' || event.node === 'memory';
      return false;
    });
  }

  private isStageStarted(stageId: string, events: import('./review.service').DagEvent[]): boolean {
    return this.stageEvents(stageId, events).length > 0;
  }

  private isStageCompleted(stageId: string, events: import('./review.service').DagEvent[]): boolean {
    if (stageId === 'orchestrator') return events.some(event => event.node === 'orchestrator' && event.event === 'pipeline_completed');
    if (stageId === 'deterministic_ast') return events.some(event => event.node === 'static_analysis' && event.event === 'ast_completed') || events.some(event => event.node === 'deterministic_gate' && event.event === 'passed');
    if (stageId === 'ruff') return events.some(event => event.node === 'ruff' && (event.event === 'scan_completed' || event.event === 'scan_skipped'));
    if (stageId === 'rag') return events.some(event => event.node === 'rag' && event.event === 'retrieval_completed');
    if (stageId === 'owasp') return events.some(event => event.node === 'owasp' && event.event === 'lookup_completed') || events.some(event => event.event === 'owasp_context_loaded');
    if (stageId === 'llm_model') return events.some(event => event.node === 'agent_reasoner' && event.event === 'reasoning_completed');
    if (stageId === 'pull_request') return events.some(event => event.node === 'pull_request' && event.event === 'review_ready');
    return false;
  }
}
