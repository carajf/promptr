import { Routes } from '@angular/router';
import { TopicsComponent } from '../pages/topics/topics.component';

const topicsPage = {
  path: 'topics',
  component: TopicsComponent,
};

export const routes: Routes = [
  { path: '', component: TopicsComponent },
  topicsPage,
];
