import {
  Component,
  computed,
  effect,
  inject,
  OnDestroy,
  signal,
} from '@angular/core';
import { QuestionService } from './question.service';
import { MatDivider, MatListItem, MatNavList } from '@angular/material/list';
import {
  genId,
  Question,
  QuestionVersion,
  UserAnswer,
} from './question.schema';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  Subject,
  takeUntil,
} from 'rxjs';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatInput, MatLabel } from '@angular/material/input';
import { MatIcon } from '@angular/material/icon';
import { NgForOf, NgIf } from '@angular/common';
import { MatChipListbox, MatChipOption } from '@angular/material/chips';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MarkdownComponent } from 'ngx-markdown';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTab, MatTabChangeEvent, MatTabGroup } from '@angular/material/tabs';
import { FeedbackComponent } from '../feedback/feedback.component';

@Component({
  selector: 'app-question',
  imports: [
    MatNavList,
    MatListItem,
    MatFormField,
    MatButton,
    MatInput,
    MatFormField,
    MatLabel,
    MatDivider,
    MatIcon,
    NgIf,
    MatChipListbox,
    MatChipOption,
    MatProgressSpinner,
    MarkdownComponent,
    FormsModule,
    MatTabGroup,
    MatTab,
    ReactiveFormsModule,
    FeedbackComponent,
    NgForOf,
  ],
  templateUrl: './question.component.html',
  styleUrl: './question.component.scss',
})
export class QuestionComponent implements OnDestroy {
  readonly questionService = inject(QuestionService);

  selectedQuestionId = signal<Question['id'] | undefined>(undefined);
  selectedQuestionVersionId = signal<QuestionVersion['versionId'] | undefined>(
    undefined,
  );
  // RxJS
  private readonly destroy$ = new Subject<void>();
  answerControl = new FormControl('');

  constructor() {
    // Init questions from state
    this.questionService.loading$
      .pipe(
        takeUntil(this.destroy$),
        filter((loading) => loading === false), // Don't load questions if questions haven't loaded yet,
      )
      .subscribe(() => {
        // Get the current list of questions
        const qs = this.questions();
        // Exit if there are no questions available
        if (!qs || qs.length === 0) {
          return;
        }

        // If no question is currently selected, select the first question & version
        if (this.selectedQuestionId() == undefined) {
          this.selectedQuestionId.set(qs[0].id);
          this.selectedQuestionVersionId.set(qs[0].versions?.[0]?.versionId);
        } else {
          // Check if the currently selected question still exists in the list
          const exists = qs.some((q) => q.id === this.selectedQuestionId());
          // If not, default to selecting the first question
          if (!exists) {
            this.selectedQuestionId.set(qs[0].id);
            this.selectedQuestionVersionId.set(qs[0].versions?.[0]?.versionId);
          }
        }
      });

    // Subscribe to answer changes
    this.answerControl.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(1000),
        distinctUntilChanged(),
      )
      .subscribe((value) => this.saveAnswer(value));

    // Pre-load answer if already written
    effect(() => {
      this.answerControl.setValue(this.currentAnswer()?.text ?? '', {
        emitEvent: false, // <- prevents saving immediately
      });
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  questions = computed((): Question[] => {
    return this.questionService.state().questions;
  });

  readonly selectedQuestion = computed(() => {
    const id = this.selectedQuestionId();
    return id ? this.questionService.getQuestionById(id) : undefined;
  });

  readonly selectedQuestionVersion = computed(() => {
    const vid = this.selectedQuestionVersionId();
    return vid
      ? this.questionService.getQuestionVersionByVersionId(vid)
      : undefined;
  });

  readonly selectedVersionIndex = computed(() => {
    const q = this.selectedQuestion();
    const vid = this.selectedQuestionVersionId();
    if (!q || !vid) return 0;
    const idx = q.versions.findIndex((v) => v.versionId === vid);
    return idx >= 0 ? idx : 0;
  });

  currentAnswer = computed(() => {
    const vid = this.selectedQuestionVersionId();
    if (!vid) return undefined;
    return this.questionService
      .state()
      .answers.find((a) => a.questionVersionId === vid);
  });

  getLatestAnswerForQuestion(question: Question): UserAnswer | undefined {
    const answers = this.questionService.state().answers;
    if (!question.versions || question.versions.length === 0) return undefined;

    // Prefer answer for the newest version (last in array)
    const lastVersionId =
      question.versions[question.versions.length - 1].versionId;
    const forLast = answers.find(
      (a) =>
        a.questionId === question.id && a.questionVersionId === lastVersionId,
    );
    if (forLast) return forLast;

    // Otherwise return any answer for that question (fallback)
    return answers.find((a) => a.questionId === question.id);
  }

  trackByQuestionId(_: number, q: Question) {
    return q.id;
  }

  trackByVersionId(_: number, v: QuestionVersion) {
    return v.versionId;
  }

  selectQuestion(questionId: Question['id']) {
    this.selectedQuestionId.set(questionId);

    // set a default selected version for the just-selected question
    const q = this.questionService.getQuestionById(questionId);
    this.selectedQuestionVersionId.set(q?.versions?.[0]?.versionId);
  }

  selectQuestionVersion(event: MatTabChangeEvent) {
    const idx = event.index;
    const versions = this.selectedQuestion()?.versions;
    if (versions && versions.length > idx) {
      this.selectedQuestionVersionId.set(versions[idx].versionId);
    }
  }

  saveAnswer(value: string | null) {
    if (value) {
      // Overwrite existing answer if question version has an answer
      const existingAnswer = this.currentAnswer();
      const answerId = existingAnswer ? existingAnswer.id : genId();
      this.questionService.saveAnswer({
        id: answerId,
        questionId: this.selectedQuestionId()!,
        questionVersionId: this.selectedQuestionVersionId()!,
        text: value,
        status: 'unchecked',
      });
    }
  }

  async checkAnswer() {
    const current = this.currentAnswer();
    const selectedQuestionVersionId = this.selectedQuestionVersionId();
    if (!selectedQuestionVersionId || !current) return;
    await this.questionService.checkAnswer(
      selectedQuestionVersionId,
      current.id,
    );
  }
}
