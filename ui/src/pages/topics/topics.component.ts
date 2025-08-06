import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatFormField, MatInput, MatLabel } from '@angular/material/input';

@Component({
  selector: 'app-topics',
  imports: [MatFormField, MatLabel, MatInput],
  templateUrl: './topics.component.html',
  styleUrl: './topics.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopicsComponent {}
