import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <header class="topbar">
      <a class="brand" routerLink="/"><span class="brand-mark">P</span><span class="brand-copy"><strong>PyReview</strong><small>by PyNgineers</small></span></a>
      <nav aria-label="Primary navigation"><a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}"><i class="material-symbols-outlined">edit_note</i><span>New review</span></a><a routerLink="/history" routerLinkActive="active"><i class="material-symbols-outlined">history</i><span>History</span></a><a routerLink="/agent-lab" routerLinkActive="active"><i class="material-symbols-outlined">science</i><span>Agent lab</span></a></nav>
      <div class="topbar-tools"><div class="status"><span class="status-dot"></span> API connected</div></div>
    </header>
    <main><router-outlet /></main>
    <footer><span>PYREVIEW / REVIEW ENGINE</span><span>Built for thoughtful code</span></footer>
  `
})
export class AppComponent {
  constructor() {
    document.body.dataset['theme'] = 'light';
  }
}
