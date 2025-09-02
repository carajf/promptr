import { inject, Injectable, signal } from '@angular/core';
import {
  AnswerDiscussion,
  ChatMessage,
  genId,
  testDiscussions,
} from '../questions/question.schema';
import { ApiService } from '../api/api.service';
import { QuestionService } from '../questions/question.service';

export interface FeedbackState {
  discussions: AnswerDiscussion[];
}

@Injectable({
  providedIn: 'root',
})
export class FeedbackService {
  readonly apiService = inject(ApiService);
  readonly questionService = inject(QuestionService);

  private _state = signal<FeedbackState>({
    discussions: testDiscussions,
  });

  readonly state = this._state.asReadonly();
  constructor() {
    //   TODO Initialize state from storage
  }

  //   State management
  patchState(patch: Partial<FeedbackState>) {
    this._state.update((current) => ({ ...current, patch }));
  }

  getDiscussion(answerId: string) {
    return this.state().discussions.find((d) => d.userAnswerId === answerId);
  }

  startDiscussion(answerId: string) {
    if (!this.getDiscussion(answerId)) {
      this.addDiscussion({ id: genId(), userAnswerId: answerId, messages: [] });
    }
  }

  private addDiscussion(discussion: AnswerDiscussion) {
    let discussions = this.state().discussions;
    discussions.push(discussion);
    this.patchState({ discussions });
  }

  private updateDiscussion(discussion: AnswerDiscussion) {
    let discussions = this.state().discussions;
    discussions = discussions.filter(
      (d) => d.userAnswerId !== discussion.userAnswerId,
    );
    discussions.push(discussion);
    this.patchState({ discussions });
  }

  private addMessageToDiscussion(
    answerId: string,
    message: string,
    role: ChatMessage['role'],
  ) {
    let discussion = this.getDiscussion(answerId);
    if (!discussion) return;

    discussion.messages.push({
      id: genId(),
      content: message,
      createdAt: new Date(),
      role,
    });

    this.updateDiscussion(discussion);
  }

  //   Messaging
  async sendMessage(answerId: string, message: string) {
    // Guard context
    let discussion = this.getDiscussion(answerId);
    if (!discussion) {
      throw new Error('Could not find discussion to send message');
    }
    let answer = this.questionService.getAnswerById(answerId);
    if (!answer) {
      throw new Error('Could not find answer to give in context of message');
    }
    let question = this.questionService.getQuestionVersionByVersionId(
      answer.questionVersionId,
    );
    if (!question)
      throw new Error('Could not find question to give in context of message');

    // Add message to overall discussion
    this.addMessageToDiscussion(answerId, message, 'user');
    // Send message and get response
    const reply = await this.apiService.chat(question, answer, discussion);
    // Add response to discussion
    this.addMessageToDiscussion(answerId, reply, 'assistant');
  }
}
