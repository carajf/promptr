import { inject, Injectable } from '@angular/core';
import { ApiService, GeneratedQuestions } from '../api.service';

@Injectable({
  providedIn: 'root',
})
export class QuestionService {
  readonly apiService = inject(ApiService);

  async generateQuestions(
    topics: string,
    numberOfQuestions: number,
    subtopics?: string[],
  ): Promise<void> {
    const questions: GeneratedQuestions =
      await this.apiService.generateQuestions(
        topics,
        numberOfQuestions,
        subtopics,
      );

    console.log(questions);
  }
}
