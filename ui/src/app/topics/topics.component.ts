import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { MatFormField, MatInput, MatLabel } from '@angular/material/input';
import { MatDivider } from '@angular/material/divider';
import { MatIcon } from '@angular/material/icon';
import {
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatOption, MatSelect } from '@angular/material/select';
import { QuestionService } from '../questions/question.service';

@Component({
  selector: 'app-topics',
  imports: [
    MatFormField,
    MatLabel,
    MatInput,
    MatDivider,
    MatIcon,
    MatButton,
    ReactiveFormsModule,
    MatSelect,
    MatOption,
  ],
  templateUrl: './topics.component.html',
  styleUrl: './topics.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopicsComponent implements OnInit {
  readonly questionService = inject(QuestionService);
  readonly maxNumberOfQuestions: number = 20;

  readonly form = new FormGroup({
    topic: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    subtopics: new FormArray<FormControl<string>>([]),
    numberOfQuestions: new FormControl<number>(5, {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.min(1),
        Validators.max(this.maxNumberOfQuestions),
      ],
    }),
  });

  readonly numberOfQuestions: number[] = Array.from(
    { length: this.maxNumberOfQuestions },
    (_, i) => i + 1,
  );

  get subtopics(): FormArray<FormControl<string>> {
    return this.form.controls.subtopics;
  }

  ngOnInit(): void {
    const subtopics = this.form.controls.subtopics;
    const numberOfQuestions = this.form.controls.numberOfQuestions;

    const applyMin = () => {
      const min = Math.max(1, subtopics.length + 1);
      numberOfQuestions.setValidators([Validators.min(min)]);
      numberOfQuestions.updateValueAndValidity({ emitEvent: false });
    };

    applyMin();
    subtopics.valueChanges.subscribe(applyMin);
  }

  addTopicInput(): void {
    this.subtopics?.push(new FormControl<string>('', { nonNullable: true }));
  }

  async onSubmit(): Promise<void> {
    console.log('Form submitted!');
    await this.questionService.generateQuestions(
      this.form.value.topic!,
      this.form.value.numberOfQuestions!,
      this.form.value.subtopics,
    );
  }
}
