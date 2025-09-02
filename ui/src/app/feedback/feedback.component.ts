import { Component, computed, inject, input } from '@angular/core';
import { QuestionService } from '../questions/question.service';
import { QuestionVersion } from '../questions/question.schema';
import { MatCard, MatCardContent } from '@angular/material/card';
import { NgIf } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { MatFormField, MatInput, MatLabel } from '@angular/material/input';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FeedbackService } from './feedback.service';
import { MatMiniFabButton } from '@angular/material/button';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';

@Component({
  selector: 'app-feedback',
  imports: [
    MatCard,
    MatCardContent,
    NgIf,
    MatIcon,
    MatFormField,
    MatInput,
    MatLabel,
    ReactiveFormsModule,
    MatFormField,
    MatMiniFabButton,
    CdkTextareaAutosize,
    FormsModule,
  ],
  templateUrl: './feedback.component.html',
  styleUrl: './feedback.component.scss',
})
export class FeedbackComponent {
  readonly questionVersionId = input.required<QuestionVersion['versionId']>();

  private feedbackService = inject(FeedbackService);
  private questionService = inject(QuestionService);

  chatMessage = new FormControl('', { nonNullable: true });

  answer = computed(() => {
    const vid = this.questionVersionId();
    return this.questionService
      .state()
      .answers.find((a) => a.questionVersionId === vid);
  });

  discussion = computed(() => {
    let answer = this.answer();
    if (!answer) return;
    return this.feedbackService.getDiscussion(answer.id);
  });

  async sendMessage() {
    let answer = this.answer();
    if (!answer) {
      throw new Error('Could not find answer for message');
    }
    let message = this.chatMessage.value;

    await this.feedbackService.sendMessage(answer.id, message);
  }
}
