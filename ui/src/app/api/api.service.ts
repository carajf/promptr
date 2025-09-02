import { inject, Injectable } from '@angular/core';
import {
  genId,
  Question,
  QuestionResponse,
  QuestionVersion,
} from '../questions/question.schema';
import { OpenAiService } from '../openai/open-ai.service';
@Injectable({
  providedIn: 'root',
})
export class ApiService {
  readonly openAiService = inject(OpenAiService);
  async generateQuestions(
    topics: string,
    numberOfQuestions: number,
    subtopics: string[] | undefined,
  ): Promise<Question[]> {
    const questions: QuestionResponse[] =
      await this.openAiService.generateQuestions(
        topics,
        numberOfQuestions,
        subtopics,
      );

    return questions.map((q) => this.mapToQuestion(q));
  }
  /** Create a client Question from an API response (initial version). */
  private mapToQuestion(apiResp: QuestionResponse): Question {
    const version: QuestionVersion = this.mapToQuestionVersion(apiResp);

    return {
      id: genId(),
      versions: [version],
    };
  }

  private mapToQuestionVersion(apiResp: QuestionResponse): QuestionVersion {
    return {
      versionId: genId(),
      topics: apiResp.topics,
      question: apiResp.question,
      answer: apiResp.answer,
    };
  }
