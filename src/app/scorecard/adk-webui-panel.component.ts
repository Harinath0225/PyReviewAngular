import { Component, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-adk-webui-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="sc-card sc-adk-panel">
      <div class="sc-adk-head">
        <div class="sc-adk-title-group">
          <div class="sc-badge-row">
            <span class="sc-kicker">GOOGLE AGENT DEVELOPMENT KIT (ADK)</span>
            <span class="sc-adk-status-badge">
              <span class="pulse-dot-green"></span> RUNNING ON PORT 8085
            </span>
          </div>
          <h2>ADK Testing &amp; Evaluation WebUI</h2>
          <p class="sc-muted">Live interactive workbench from Google ADK. Run evaluation test suites, inspect agent tool call trajectories, review NLP metrics (BLEU, METEOR, ROUGE-L), and track token &amp; latency SLAs directly inside this dashboard.</p>
        </div>

        <div class="sc-adk-actions">
          <button type="button" class="sc-toggle-btn" (click)="toggleExpand()">
            {{ isExpanded() ? 'Hide Embedded WebUI' : 'Open Embedded WebUI' }}
          </button>
          <a [href]="rawAdkUrl" target="_blank" rel="noopener noreferrer" class="sc-external-link">
            Open in New Window &#x2197;
          </a>
          <button type="button" class="primary-btn sc-sync-mini-btn" (click)="triggerSync()">
            Sync Runs to Scorecard
          </button>
        </div>
      </div>

      <!-- EMBEDDED IFRAME WORKBENCH -->
      @if (isExpanded()) {
        <div class="sc-iframe-container" [class.tall]="isTall()">
          <div class="sc-iframe-bar">
            <div class="sc-browser-dots">
              <span class="dot red"></span>
              <span class="dot yellow"></span>
              <span class="dot green"></span>
            </div>
            <div class="sc-url-bar">
              <span class="lock-icon">&#x1F512;</span>
              <code>http://127.0.0.1:8085/dev-ui/</code>
            </div>
            <div class="sc-iframe-controls">
              <button type="button" class="sc-icon-btn" (click)="toggleTall()" [title]="isTall() ? 'Compact Height' : 'Expand Height'">
                {{ isTall() ? 'Compact View' : 'Expand View' }}
              </button>
              <button type="button" class="sc-icon-btn" (click)="refreshIframe()" title="Reload WebUI">
                &#x21BB; Reload
              </button>
            </div>
          </div>

          <iframe
            [src]="safeAdkUrl"
            class="sc-adk-iframe"
            title="Google ADK Web UI Workbench"
            allow="clipboard-read; clipboard-write">
          </iframe>

          <footer class="sc-iframe-footer">
            <div class="sc-hint">
              <strong>Tip for Demo:</strong> Navigate to the <b>Eval</b> tab inside ADK to run <code>eval_set_1.evalset.json</code> with registered custom metrics (BLEU, METEOR, Tokens, Latency). Once complete, click <b>"Sync Runs to Scorecard"</b> above to import the results immediately!
            </div>
          </footer>
        </div>
      } @else {
        <!-- COLLAPSED QUICK-OVERVIEW CARD -->
        <div class="sc-collapsed-preview" (click)="toggleExpand()">
          <div class="sc-preview-features">
            <div class="sc-feat-pill">
              <span class="sc-pill-icon">&#x2699;</span>
              <div>
                <strong>Active Agents</strong>
                <small>code_review_agent &bull; EvaluationGenerator</small>
              </div>
            </div>
            <div class="sc-feat-pill">
              <span class="sc-pill-icon">&#x1F4CA;</span>
              <div>
                <strong>Custom Metrics Active</strong>
                <small>Tokens, Latency SLA, Trajectory, BLEU, METEOR, ROUGE-L, Judge</small>
              </div>
            </div>
            <div class="sc-feat-pill">
              <span class="sc-pill-icon">&#x1F517;</span>
              <div>
                <strong>Local Endpoint</strong>
                <small>http://127.0.0.1:8085/dev-ui/</small>
              </div>
            </div>
          </div>
          <button type="button" class="sc-launch-preview-btn">
            Click to Expand &amp; Interact with ADK WebUI &darr;
          </button>
        </div>
      }
    </section>
  `,
  styles: [`
    .sc-adk-panel { margin-top: 6px; border: 1px solid color-mix(in srgb, var(--blue) 35%, var(--line)); }
    .sc-adk-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 14px; flex-wrap: wrap; }
    .sc-adk-title-group { max-width: 720px; }
    .sc-adk-head h2 { margin: 4px 0 6px; font-size: 18px; }
    .sc-badge-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .sc-adk-status-badge { display: flex; align-items: center; gap: 6px; font-size: 10px; font-weight: 700; color: var(--teal); border: 1px solid var(--teal); background: color-mix(in srgb, var(--teal) 10%, transparent); padding: 2px 8px; border-radius: 999px; }
    .pulse-dot-green { width: 6px; height: 6px; border-radius: 50%; background: var(--teal); box-shadow: 0 0 6px var(--teal); display: inline-block; }
    .sc-adk-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
    
    .sc-toggle-btn { all: unset; box-sizing: border-box; cursor: pointer; font-size: 12px; font-weight: 600; padding: 7px 12px; border-radius: 8px; border: 1px solid var(--line); color: var(--ink); background: var(--card); }
    .sc-toggle-btn:hover { border-color: var(--teal); color: var(--teal); }

    .sc-external-link { all: unset; box-sizing: border-box; cursor: pointer; font-size: 12px; font-weight: 600; padding: 7px 12px; border-radius: 8px; border: 1px solid var(--blue); color: var(--blue); background: color-mix(in srgb, var(--blue) 8%, transparent); text-decoration: none; }
    .sc-external-link:hover { background: color-mix(in srgb, var(--blue) 18%, transparent); }

    .sc-sync-mini-btn { font-size: 12px; padding: 7px 14px; }

    /* IFRAME BROWSER CONTAINER */
    .sc-iframe-container { border: 1px solid var(--line); border-radius: 10px; overflow: hidden; background: #121820; display: flex; flex-direction: column; transition: height .3s ease; height: 620px; }
    .sc-iframe-container.tall { height: 850px; }

    .sc-iframe-bar { display: flex; align-items: center; justify-content: space-between; padding: 8px 14px; background: #0b0f14; border-bottom: 1px solid var(--line); gap: 12px; }
    .sc-browser-dots { display: flex; gap: 6px; }
    .sc-browser-dots .dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
    .dot.red { background: #ff5f56; }
    .dot.yellow { background: #ffbd2e; }
    .dot.green { background: #27c93f; }

    .sc-url-bar { flex: 1; max-width: 480px; background: #17202a; border-radius: 6px; padding: 4px 10px; display: flex; align-items: center; gap: 8px; font-size: 11px; }
    .lock-icon { font-size: 11px; opacity: .7; }
    .sc-url-bar code { color: var(--teal); font-family: monospace; }

    .sc-iframe-controls { display: flex; gap: 6px; }
    .sc-icon-btn { all: unset; box-sizing: border-box; cursor: pointer; font-size: 11px; font-weight: 600; padding: 4px 8px; border-radius: 4px; border: 1px solid var(--line); color: var(--muted); }
    .sc-icon-btn:hover { color: var(--ink); border-color: var(--teal); }

    .sc-adk-iframe { width: 100%; flex: 1; border: none; background: #ffffff; }

    .sc-iframe-footer { padding: 8px 14px; background: #0b0f14; border-top: 1px solid var(--line); font-size: 11px; }
    .sc-hint { color: var(--muted); line-height: 1.4; }
    .sc-hint b, .sc-hint strong { color: var(--ink); }
    .sc-hint code { color: var(--teal); background: rgba(0,0,0,0.3); padding: 1px 4px; border-radius: 3px; font-size: 10px; }

    /* COLLAPSED PREVIEW */
    .sc-collapsed-preview { border: 1px dashed var(--line); border-radius: 8px; padding: 14px 18px; display: flex; align-items: center; justify-content: space-between; gap: 16px; cursor: pointer; background: color-mix(in srgb, var(--card) 95%, transparent); flex-wrap: wrap; }
    .sc-collapsed-preview:hover { border-color: var(--blue); background: color-mix(in srgb, var(--blue) 5%, var(--card)); }
    .sc-preview-features { display: flex; gap: 20px; flex-wrap: wrap; }
    .sc-feat-pill { display: flex; align-items: center; gap: 10px; font-size: 12px; }
    .sc-pill-icon { font-size: 18px; }
    .sc-feat-pill strong { display: block; font-size: 12px; }
    .sc-feat-pill small { color: var(--muted); font-size: 11px; }
    .sc-launch-preview-btn { all: unset; box-sizing: border-box; font-size: 11px; font-weight: 700; color: var(--blue); text-transform: uppercase; letter-spacing: .05em; }
  `]
})
export class AdkWebuiPanelComponent {
  private readonly sanitizer = inject(DomSanitizer);

  readonly onSync = output<void>();

  readonly rawAdkUrl = 'http://127.0.0.1:8085/dev-ui/';
  readonly safeAdkUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.rawAdkUrl);

  readonly isExpanded = signal(true);
  readonly isTall = signal(false);

  toggleExpand(): void {
    this.isExpanded.update(v => !v);
  }

  toggleTall(): void {
    this.isTall.update(v => !v);
  }

  refreshIframe(): void {
    this.isExpanded.set(false);
    setTimeout(() => this.isExpanded.set(true), 50);
  }

  triggerSync(): void {
    this.onSync.emit();
  }
}
