import { inject, Injectable, signal } from '@angular/core';
import {
  ANSWERS_STORAGE_KEY,
  genId,
  Question,
  QuestionResponse,
  QUESTIONS_STORAGE_KEY,
  QuestionVersion,
  testAnswers,
  testQuestions,
  UserAnswer,
} from './question.schema';
import { Router } from '@angular/router';
import { QUESTIONS_PATH } from '../app.routes';
import { BehaviorSubject } from 'rxjs';
import { ApiService } from '../api/api.service';

export interface QuestionsState {
  questions: Question[];
  answers: UserAnswer[];
  loading: boolean;
  error?: unknown;
}

@Injectable({
  providedIn: 'root',
})
export class QuestionService {
  readonly apiService = inject(ApiService);
  readonly router = inject(Router);

  private _state = signal<QuestionsState>({
    questions: testQuestions,
    answers: testAnswers,
    loading: false,
  });
  readonly state = this._state.asReadonly();

  private readonly _loading$ = new BehaviorSubject<boolean>(
    this._state().loading,
  );
  readonly loading$ = this._loading$.asObservable();

  constructor() {
    this.initializeStateFromStorage();
  }

  // State management
  patchState(patch: Partial<QuestionsState>) {
    this._state.update((current) => ({ ...current, ...patch }));
    this.emitState();
  }

  getQuestionById(id: string) {
    return this._state().questions.find((question) => question.id === id);
  }

  getQuestionByVersionId(versionId: string): Question | undefined {
    return this._state().questions.find((question) =>
      question.versions.some((version) => version.versionId === versionId),
    );
  }

  getQuestionVersionByVersionId(
    versionId: string,
  ): QuestionVersion | undefined {
    return this.getQuestionByVersionId(versionId)?.versions.find(
      (version) => version.versionId === versionId,
    );
  }

  // Question generation
  async generateQuestions(
    topics: string,
    numberOfQuestions: number,
    subtopics?: string[],
  ): Promise<void> {
    this.patchState({ loading: true });

    await this.navigateToQuestions();

    try {
      const newQuestions = await this.apiService.generateQuestions(
        topics,
        numberOfQuestions,
        subtopics,
      );

      this.patchState({ loading: false });
      this.patchState({ questions: newQuestions });
    } catch (error) {
      this.patchState({ loading: false });
      this.patchState({ error });
      console.log(error);
    }
  }
  async navigateToQuestions() {
    await this.router.navigate([QUESTIONS_PATH]);
  }

  // Answers
  getAnswerById(answerId: UserAnswer['id']): UserAnswer | undefined {
    return this.state().answers.find((answer) => answer.id === answerId);
  }

  saveAnswer(answer: UserAnswer): void {
    const existingIndex = this.state().answers.findIndex(
      (a) => a.id === answer.id,
    );

    let updatedAnswers;

    if (existingIndex > -1) {
      // overwrite
      updatedAnswers = [...this.state().answers];
      updatedAnswers[existingIndex] = answer;
    } else {
      // add
      updatedAnswers = [...this.state().answers, answer];
    }

    this.patchState({ answers: updatedAnswers });
  }

  async checkAnswer(
    questionVersionId: QuestionVersion['versionId'],
    answerId: UserAnswer['id'],
  ) {
    const questionVersion =
      this.getQuestionVersionByVersionId(questionVersionId);
    const answer = this.getAnswerById(answerId);

    // TODO Add safeguards around question/version/answer match
    if (!questionVersion || !answer) {
      throw new Error(
        'Something went wrong getting the question or answer to be checked',
      );
    }

    const result = await this.apiService.markAnswer(questionVersion, answer);

    const checkedAnswer = {
      ...answer,
      status: result.status,
      feedback: result.feedback,
    };
    // Update answer feedback
    this.saveAnswer(checkedAnswer);
  }

  private patchQuestion(id: string, updatedQuestion: Question): void {
    const questions = this._state().questions.map((q) =>
      q.id === id ? updatedQuestion : q,
    );
    this.patchState({ questions });
    this.persistQuestionsToSession(questions);
  }

  private addVersionToQuestion(
    question: Question,
    apiResp: QuestionResponse,
  ): void {
    const newVersion: QuestionVersion = {
      versionId: genId(),
      topics: apiResp.topics,
      question: apiResp.question,
      answer: apiResp.answer,
    };

    const updatedQuestion = {
      ...question,
      versions: [...question.versions, newVersion],
    };

    this.patchQuestion(question.id, updatedQuestion);
  }

  private emitState() {
    const s = this._state();
    this._loading$.next(s.loading);
  }

  /* ------------------------
     Session storage helpers
     ------------------------ */

  /** Persist questions to sessionStorage (no runtime schema validation here). */
  private persistQuestionsToSession(questions: Question[]): void {
    try {
      sessionStorage.setItem(QUESTIONS_STORAGE_KEY, JSON.stringify(questions));
    } catch (err) {
      console.warn('Failed to persist questions to sessionStorage', err);
    }
  }

  // TODO Save answers with a 'save' button
  private persistAnswersToSession(answers: UserAnswer[]): void {
    try {
      sessionStorage.setItem(ANSWERS_STORAGE_KEY, JSON.stringify(answers));
    } catch (err) {
      console.warn('Failed to persist answers to sessionStorage', err);
    }
  }

  private loadQuestionsFromSession(): Question[] {
    try {
      const stored = sessionStorage.getItem(QUESTIONS_STORAGE_KEY);
      if (!stored) return [];
      return JSON.parse(stored) as Question[];
    } catch (err) {
      console.warn('Failed to load questions from sessionStorage', err);
      return [];
    }
  }

  private loadAnswersFromSession(): UserAnswer[] {
    try {
      const stored = sessionStorage.getItem(ANSWERS_STORAGE_KEY);
      if (!stored) return [];
      return JSON.parse(stored) as UserAnswer[];
    } catch (err) {
      console.warn('Failed to load answers from sessionStorage', err);
      return [];
    }
  }

  private initializeStateFromStorage(): void {
    if (this._state().questions.length === 0) {
      const storedQuestions = this.loadQuestionsFromSession();
      const storedAnswers = this.loadAnswersFromSession();
      if (storedQuestions.length > 0) {
        this.patchState({ questions: storedQuestions });
      }
      if (storedAnswers.length > 0) {
        this.patchState({ answers: storedAnswers });
      }
    }
  }
}
