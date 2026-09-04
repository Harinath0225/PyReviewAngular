import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <header class="topbar">
      <a class="brand" routerLink="/"><span class="brand-mark">{{ '{' }} {{ '}' }}</span><span>PyReview</span></a>
      <nav><a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">New review</a><a routerLink="/history" routerLinkActive="active">History</a></nav>
      <div class="status"><span class="status-dot"></span> API connected</div>
    </header>
    <main><router-outlet /></main>
    <footer><span>PYREVIEW / REVIEW ENGINE</span><span>Built for thoughtful code</span></footer>
  `
})
export class AppComponent {}
