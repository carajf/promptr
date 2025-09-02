import { Routes } from '@angular/router';
import { TopicsComponent } from './topics/topics.component';
import { QuestionComponent } from './questions/question.component';

export const TOPICS_PATH = 'topics';
export const QUESTIONS_PATH = 'questions';

export const routes: Routes = [
  { path: '', component: TopicsComponent },
  { path: TOPICS_PATH, component: TopicsComponent },
  { path: QUESTIONS_PATH, component: QuestionComponent },
];
