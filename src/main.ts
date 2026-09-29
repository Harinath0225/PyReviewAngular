import { provideMarkdown } from 'ngx-markdown';
import { SecurityContext } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';

bootstrapApplication(AppComponent, { providers: [provideRouter(routes), provideHttpClient(), provideMarkdown()] }).catch((error: unknown) => console.error(error));
