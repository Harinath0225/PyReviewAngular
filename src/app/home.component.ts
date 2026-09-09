import { Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ReviewInput, ReviewService, BusinessDocument } from './review.service';

@Component({
  selector: 'app-home', standalone: true, imports: [FormsModule],
  template: `
    <section class="page home-page">
      @if (reviewLoading()) { <div class="review-overlay" role="dialog" aria-modal="true" aria-label="Review in progress"><div class="review-modal"><div class="scan-ring"><span></span></div><span class="modal-kicker">MISSION CONTROL / PYREVIEW</span><strong>{{ reviewStage() }}</strong><p>Live events from the review agent.</p><div class="live-log">@for (event of liveEvents().slice(-5); track $index) { <div><i></i><span>{{ event.node }}</span><b>{{ event.event.replace('_', ' ') }}</b></div> }</div><small>Deterministic checks first // reasoning follows // awaiting completion</small></div></div> }
      <div class="eyebrow">AI-POWERED CODE REVIEW <span></span> 01 / 03</div>
      <div class="hero-heading"><div><h1>Intelligent reviews.<br><em>Seamless delivery.</em></h1></div><p><strong>Your Agentic AI pair reviewer for Python.</strong><br><br>Get a second pair of eyes before your code meets production. Fast, precise feedback from an AI that understands how developers think.</p></div>
      <div class="input-card">
        <div class="source-options">
          <button type="button" [class.selected]="source() === 'Paste code'" (click)="select('Paste code')"><span class="option-icon">&lt;/&gt;</span><span><b>Paste code</b><small>Review a snippet</small></span><span class="option-arrow">→</span></button>
          <button type="button" [class.selected]="source() === 'Upload file'" (click)="select('Upload file')"><span class="option-icon">↑</span><span><b>Upload file</b><small>Review a Python file</small></span><span class="option-arrow">→</span></button>
          <button type="button" [class.selected]="source() === 'GitHub URL'" (click)="select('GitHub URL')"><span class="option-icon">↗</span><span><b>GitHub URL</b><small>Connect a repository</small></span><span class="option-arrow">→</span></button>
        </div>
        @if (source() === 'Paste code') { <textarea [(ngModel)]="code" placeholder="Paste your Python code here..." spellcheck="false"></textarea> }
        @if (source() === 'Upload file') { <div class="dropzone" (click)="fileInput.click()"><input #fileInput type="file" accept=".py,.pyw,.txt" (change)="onFile($event)" hidden><div class="upload-icon" [class.loading]="fileLoading()">↑</div>@if (fileLoading()) { <div class="file-loading" aria-live="polite"><span class="loading-spinner"></span> Reading {{ fileName }}</div> } @else { <strong>{{ fileName || 'Drop a Python file here' }}</strong><span>{{ fileName ? 'Ready for review' : 'or click to browse from your computer' }}</span> }</div> }
        @if (source() === 'GitHub URL') { <div class="url-input"><span>↗</span><input [(ngModel)]="githubUrl" placeholder="https://github.com/you/repository/blob/main/file.py"></div> }
        <div class="input-footer"><span class="language"><b>PY</b> Python 3.12 <span>⌄</span></span><span class="input-hint">{{ source() === 'Paste code' ? 'Ctrl + Enter to review' : 'Ready when you are' }}</span></div>
      </div>
      <div class="business-context">
        <div class="business-header"><strong>+ Business Context</strong><span class="optional">(Optional)</span></div>
        <p>Upload Jira stories, specifications, or requirements to align code review with business logic.</p>
        <div class="business-upload">
          <button type="button" (click)="businessDocInput.click()" class="upload-business-btn">Choose business document</button>
          <input #businessDocInput type="file" accept=".txt,.md,.pdf" (change)="onBusinessDocument($event)" hidden>
          @for (doc of businessDocuments(); track doc.fileName) {
            <div class="doc-item">
              <span class="doc-icon">📄</span>
              <div class="doc-info">
                <strong>{{ doc.fileName }}</strong>
                <select [(ngModel)]="doc.type" class="doc-type">
                  <option value="jira">Jira Story</option>
                  <option value="specification">Specification</option>
                  <option value="requirements">Requirements</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <button type="button" class="doc-remove" (click)="removeBusinessDocument(doc.fileName)">×</button>
            </div>
          }
        </div>
      </div>
      <div class="input-footer"><span class="language"><b>PY</b> Python 3.12 <span>⌄</span></span><span class="input-hint">{{ source() === 'Paste code' ? 'Ctrl + Enter to review' : 'Ready when you are' }}</span></div>
      
      <div class="action-row">@if (reviewLoading()) { <div class="review-loading" role="status" aria-live="polite"><span class="loading-spinner"></span><span><strong>{{ reviewStage() }}</strong><small>Do not panic. The semicolons are being questioned.</small></span></div> } @else { <button class="primary-btn" [disabled]="fileLoading()" (click)="review()">Review my code <span>→</span></button> }<span class="privacy"><span>✦</span> Your code is private and never used to train models</span></div>
      @if (inputError()) { <p class="input-error" role="alert">{{ inputError() }}</p> }
      <div class="feature-strip"><div><strong>01</strong><span><b>Inline feedback</b>Every finding, right where it matters.</span></div><div><strong>02</strong><span><b>Severity that speaks</b>Know what to fix first.</span></div><div><strong>03</strong><span><b>Learn as you go</b>Clear explanations, no gatekeeping.</span></div></div>
    </section>
  `
})
export class HomeComponent {
  private readonly service = inject(ReviewService);
  private readonly router = inject(Router);
  readonly liveEvents = this.service.liveEvents;
  readonly source = signal<ReviewInput>('Paste code');
  readonly fileLoading = signal(false);
  readonly reviewLoading = signal(false);
  readonly reviewStage = signal('Booting the bug radar...');
  readonly inputError = signal('');
  readonly businessDocuments = signal<BusinessDocument[]>([]);
  code = '';
  githubUrl = '';
  fileName = '';
  fileCode = '';
  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;
  @ViewChild('businessDocInput') businessDocInput?: ElementRef<HTMLInputElement>;

  select(value: ReviewInput): void {
    this.source.set(value);
    this.inputError.set('');
  }

  onFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.inputError.set('');
    this.fileName = file.name;
    this.fileLoading.set(true);
    const reader = new FileReader();
    reader.onload = () => (this.fileCode = String(reader.result));
    reader.onloadend = () => this.fileLoading.set(false);
    reader.onerror = () => {
      this.fileCode = '';
      this.inputError.set('This file could not be read.');
    };
    reader.readAsText(file);
  }

  onBusinessDocument(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result);
      const businessDoc: BusinessDocument = {
        fileName: file.name,
        content: content,
        type: 'other',
        uploadedAt: new Date().toISOString()
      };
      this.businessDocuments.update(docs => [...docs, businessDoc]);
    };
    reader.onerror = () => {
      this.inputError.set(`Could not read business document: ${file.name}`);
    };
    reader.readAsText(file);
  }

  removeBusinessDocument(fileName: string): void {
    this.businessDocuments.update(docs => docs.filter(doc => doc.fileName !== fileName));
  }

  review(): void {
    const code = this.source() === 'Paste code' ? this.code : this.source() === 'Upload file' ? this.fileCode : this.githubUrl;
    if (this.fileLoading() || this.reviewLoading()) return;
    if (!code.trim()) {
      this.inputError.set('Add some Python code before starting the review.');
      return;
    }
    if (this.source() === 'GitHub URL') {
      this.inputError.set('GitHub URL review is not supported by the review endpoint yet. Upload or paste the code for now.');
      return;
    }
    this.reviewLoading.set(true);
    this.reviewStage.set('Launching the code-review mothership...');
    this.service.submit(this.source(), this.fileName || 'pasted-snippet.py', code, this.businessDocuments()).subscribe({
      next: review => this.router.navigate(['/review', review.id]),
      error: () => {
        this.reviewLoading.set(false);
        this.inputError.set('The review API could not be reached. Start the backend and try again.');
      }
    });
  }
}
