import { CognitiveDebtComponent } from './cognitive-debt.component';
import { Routes } from '@angular/router';
import { HomeComponent } from './home.component';
import { ReviewComponent } from './review.component';
import { HistoryComponent } from './history.component';
import { AgentLabComponent } from './agent-lab.component';
import { ScorecardComponent } from './scorecard/scorecard.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'review/:id', component: ReviewComponent },
  { path: 'review', redirectTo: '', pathMatch: 'full' },
  { path: 'history', component: HistoryComponent },
  { path: 'agent-lab', redirectTo: 'scorecard', pathMatch: 'full' },
  { path: 'scorecard', component: ScorecardComponent },
  { path: 'cognitive-debt', component: CognitiveDebtComponent },
  { path: '**', redirectTo: '', pathMatch: 'full' }
];
