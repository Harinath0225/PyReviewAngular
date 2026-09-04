import { Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ReviewInput, ReviewService } from './review.service';

@Component({
  selector: 'app-home', standalone: true, imports: [FormsModule],
  template: `
    <section class="page home-page">
      <div class="eyebrow">AI-POWERED CODE REVIEW <span></span> 01 / 03</div>
      <div class="hero-heading"><div><h1>Ship code<br><em>with clarity.</em></h1></div><p><strong>Your Agentic AI pair reviewer for Python.</strong><br><br>Get a second pair of eyes before your code meets production. Fast, precise feedback from an AI that understands how developers think.</p></div>
      <div class="input-card">
        <div class="source-tabs"><button [class.selected]="source() === 'Paste code'" (click)="select('Paste code')"><span class="tab-num">01</span> Paste code</button><button [class.selected]="source() === 'Upload file'" (click)="select('Upload file')"><span class="tab-num">02</span> Upload file</button><button [class.selected]="source() === 'GitHub URL'" (click)="select('GitHub URL')"><span class="tab-num">03</span> GitHub URL</button></div>
        @if (source() === 'Paste code') { <textarea [(ngModel)]="code" placeholder="Paste your Python code here..." spellcheck="false"></textarea> }
        @if (source() === 'Upload file') { <div class="dropzone" (click)="fileInput.click()"><input #fileInput type="file" accept=".py,.pyw,.txt" (change)="onFile($event)" hidden><div class="upload-icon">↑</div><strong>{{ fileName || 'Drop a Python file here' }}</strong><span>{{ fileName ? 'Ready for review' : 'or click to browse from your computer' }}</span></div> }
        @if (source() === 'GitHub URL') { <div class="url-input"><span>↗</span><input [(ngModel)]="githubUrl" placeholder="https://github.com/you/repository/blob/main/file.py"></div> }
        <div class="input-footer"><span class="language"><b>PY</b> Python 3.12 <span>⌄</span></span><span class="input-hint">{{ source() === 'Paste code' ? 'Ctrl + Enter to review' : 'Ready when you are' }}</span></div>
      </div>
      <div class="action-row"><button class="primary-btn" (click)="review()">Review my code <span>→</span></button><span class="privacy"><span>✦</span> Your code is private and never used to train models</span></div>
      <div class="feature-strip"><div><strong>01</strong><span><b>Inline feedback</b>Every finding, right where it matters.</span></div><div><strong>02</strong><span><b>Severity that speaks</b>Know what to fix first.</span></div><div><strong>03</strong><span><b>Learn as you go</b>Clear explanations, no gatekeeping.</span></div></div>
    </section>
  `
})
export class HomeComponent {
  private readonly service = inject(ReviewService); private readonly router = inject(Router);
  readonly source = signal<ReviewInput>('Paste code'); code = ''; githubUrl = ''; fileName = ''; fileCode = '';
  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;
  select(value: ReviewInput): void { this.source.set(value); }
  onFile(event: Event): void { const file = (event.target as HTMLInputElement).files?.[0]; if (!file) return; this.fileName = file.name; const reader = new FileReader(); reader.onload = () => this.fileCode = String(reader.result); reader.readAsText(file); }
  review(): void { const code = this.source() === 'Paste code' ? this.code : this.source() === 'Upload file' ? this.fileCode : this.githubUrl; this.service.submit(this.source(), this.fileName || (this.source() === 'GitHub URL' ? 'github-snippet.py' : 'pasted-snippet.py'), code); this.router.navigate(['/review']); }
}
