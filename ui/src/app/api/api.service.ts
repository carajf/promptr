import { inject, Injectable } from '@angular/core';
import {
  AnswerDiscussion,
  AnswerStatus,
  genId,
  Question,
  QuestionGradeResponse,
  QuestionResponse,
  QuestionVersion,
  UserAnswer,
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

  async markAnswer(
    question: QuestionVersion,
    answer: UserAnswer,
  ): Promise<UserAnswer> {
    const apiResponse: QuestionGradeResponse =
      await this.openAiService.gradeAnswer(
        question.question,
        question.answer,
        answer.text,
      );

    // Map response to answer
    answer = {
      ...answer,
      feedback: apiResponse.feedback,
      status: this.mapToAnswerStatus(apiResponse.grade),
    };

    return answer;
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

  private mapToAnswerStatus(
    input: QuestionGradeResponse['grade'],
  ): AnswerStatus {
    switch (input.pass) {
      case true:
        return 'correct';
      case false:
        return 'incorrect';
      default:
        return 'unchecked';
    }
  }

  async chat(
    question: QuestionVersion,
    answer: UserAnswer,
    discussion: AnswerDiscussion,
  ): Promise<string> {
    return await this.openAiService.chat(question, answer, discussion);
  }
}
