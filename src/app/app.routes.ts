import { Routes } from '@angular/router';
import { HomeComponent } from './home.component';
import { ReviewComponent } from './review.component';
import { HistoryComponent } from './history.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'review', component: ReviewComponent },
  { path: 'history', component: HistoryComponent },
  { path: '**', redirectTo: '' }
];
