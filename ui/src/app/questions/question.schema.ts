import { z } from 'zod';

// API-facing schema
export const QuestionResponseSchema = z.object({
  topics: z.array(z.string()),
  question: z.string(),
  answer: z.string(),
});

export const QuestionListResponseSchema = z.object({
  questions: z.array(QuestionResponseSchema),
});

export const QuestionGradeResponseSchema = z.object({
  question: z.string(),
  userAnswer: z.string(),
  feedback: z.string(),
  grade: z.object({ pass: z.boolean() }),
  suggestedSolution: z.optional(z.string()).nullable(),
});

export type QuestionResponse = z.infer<typeof QuestionResponseSchema>;
export type QuestionGradeResponse = z.infer<typeof QuestionGradeResponseSchema>;

// Client-side schema
export type AnswerStatus = 'unchecked' | 'correct' | 'incorrect';

export interface UserAnswer {
  id: string;
  questionId: Question['id'];
  questionVersionId: QuestionVersion['versionId'];
  text: string;
  status: AnswerStatus;
  feedback?: string;
}

export interface QuestionVersion {
  versionId: string;
  topics: string[];
  question: string;
  answer: string;
  userFeedback?: string;
}

export interface Question {
  id: string;
  versions: QuestionVersion[];
}

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: Date;
}

export interface AnswerDiscussion {
  id: string;
  userAnswerId: UserAnswer['id'];
  messages: ChatMessage[];
}

/* ------------------------
   Persistence constants + helpers
   ------------------------ */

export const QUESTIONS_STORAGE_KEY = 'promptr.questions.v1';
export const ANSWERS_STORAGE_KEY = 'promptr.answers.v1';

/** Minimal id generator for local ids. Replace with uuid.v4() if you already have that dependency */
export function genId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export const testQuestions: Question[] = [
  {
    id: '1',
    versions: [
      {
        versionId: 'v1-1',
        userFeedback: undefined,
        topics: ['Angular', 'Components', 'Data Binding'],
        question: `Explain the purpose of the \`@Input()\` decorator in Angular. Include a code example showing how to use it.

\`\`\`typescript
@Component({
  selector: "app-child",
  template: "<p>{{data}}</p>"
})
export class ChildComponent {
  // Complete the code
}
\`\`\``,
        answer: `The \`@Input()\` decorator allows a component to receive data from its parent component. It creates a property binding that can pass data from parent to child.

\`\`\`typescript
@Input() data: string;
\`\`\`

The parent component can then bind to this property using square bracket syntax: \`[data]="parentData"\`.`,
      },
    ],
  },

  {
    id: '2',
    versions: [
      {
        versionId: 'v1-2',
        userFeedback: undefined,
        topics: ['TypeScript', 'Generics'],
        question: `What will be the output of this code?

\`\`\`typescript
function identity<T>(arg: T): T {
    return arg;
}

const result = identity("TypeScript");
console.log(typeof result);
\`\`\``,
        answer: `The output will be: "string"

Explanation:
- The \`identity\` function is a generic function that returns the same type as its input.
- When called with \`"TypeScript"\`, type inference determines \`T\` is \`string\`.
- \`typeof result\` therefore returns \`"string"\`.`,
      },
    ],
  },

  {
    id: '3',
    versions: [
      {
        versionId: 'v1-3',
        userFeedback: undefined,
        topics: ['RxJS', 'Operators'],
        question: `Complete the following code to transform an observable of numbers into their squared values using RxJS operators:

\`\`\`typescript
import { from } from "rxjs";
import { /* add required operator */ } from "rxjs/operators";

const numbers$ = from([1, 2, 3, 4, 5]);
numbers$.pipe(
  // Add operator here
).subscribe(console.log);
\`\`\``,
        answer: `Here's the solution using the \`map\` operator:

\`\`\`typescript
import { from } from "rxjs";
import { map } from "rxjs/operators";

const numbers$ = from([1, 2, 3, 4, 5]);
numbers$.pipe(
  map(x => x * x)
).subscribe(console.log);
\`\`\`

This will output: 1, 4, 9, 16, 25.`,
      },
    ],
  },

  {
    id: '4',
    versions: [
      {
        versionId: 'v1-4',
        userFeedback: undefined,
        topics: ['Angular', 'Services', 'Dependency Injection'],
        question: `Identify and fix the issue in this service implementation:

\`\`\`typescript
@Injectable()
export class UserService {
  private users: User[] = [];

  constructor(private http: HttpClient) {}

  getUsers() {
    return this.http.get<User[]>("/api/users");
  }
}
\`\`\``,
        answer: `The issue is missing the \`providedIn\` property in the \`@Injectable()\` decorator. Here's the fixed version:

\`\`\`typescript
@Injectable({
  providedIn: "root"
})
export class UserService {
  private users: User[] = [];

  constructor(private http: HttpClient) {}

  getUsers() {
    return this.http.get<User[]>("/api/users");
  }
}
\`\`\`

Without \`providedIn: "root"\`, the service needs to be manually provided in a module.`,
      },
    ],
  },

  {
    id: '5',
    versions: [
      {
        versionId: 'v1-5',
        userFeedback: undefined,
        topics: ['CSS', 'Grid Layout', 'Responsive Design'],
        question: `Explain what this CSS code does and provide an example use case:

\`\`\`css
.container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}
\`\`\``,
        answer: `This CSS creates a responsive grid layout where:

- \`display: grid\` establishes a grid container.
- \`grid-template-columns\` creates columns that:
  - \`auto-fit\` automatically fits as many columns as possible.
  - \`minmax(250px, 1fr)\` ensures each column is at least 250px wide and shares available space equally.
- \`gap: 1rem\` adds 1rem spacing between grid items.

This is perfect for responsive card layouts, image galleries, or product grids that automatically adjust based on screen size.`,
      },
    ],
  },
];
export const testAnswers: UserAnswer[] = [
  {
    id: 'a1',
    questionId: '1',
    questionVersionId: 'v1-1',
    text: `The \`@Input()\` decorator allows a component to receive data from its parent component. It creates a property binding that can pass data from parent to child.

\`\`\`typescript
@Input() data: string;
\`\`\`

The parent component can then bind to this property using square bracket syntax: \`[data]="parentData"\`.`,
    status: 'correct',
    feedback: 'Nice job! Clear explanation and correct usage.',
  },
  {
    id: 'a2',
    questionId: '2',
    questionVersionId: 'v1-2',
    text: `The output will be: "object"`, // deliberately wrong
    status: 'incorrect',
    feedback:
      'Remember that `typeof` on a string literal returns "string", not "object".',
  },
  // question 3 has no saved answer yet → form starts empty
  // question 4 also empty for now
  // question 5 also empty for now
];

export const testDiscussions: AnswerDiscussion[] = [
  {
    id: 'd1',
    userAnswerId: testAnswers[0].id, // a1
    messages: [
      {
        id: 'm1',
        role: 'user',
        content:
          'Can you explain more about when I should use @Input vs a service?',
        createdAt: new Date('2025-08-01T10:00:00Z'),
      },
      {
        id: 'm2',
        role: 'assistant',
        content:
          'Great question! Use `@Input` when the data is directly relevant to a parent-child relationship. If you need to share state across unrelated components, a shared service (possibly with RxJS) is more appropriate.',
        createdAt: new Date('2025-08-01T10:00:10Z'),
      },
      {
        id: 'm3',
        role: 'user',
        content: 'Got it — so Inputs are for direct bindings only?',
        createdAt: new Date('2025-08-01T10:01:00Z'),
      },
      {
        id: 'm4',
        role: 'assistant',
        content:
          'Exactly. Think of Inputs as configuration or data that the parent owns. Once you need decoupling or shared state, services are the better tool.',
        createdAt: new Date('2025-08-01T10:01:15Z'),
      },
    ],
  },
  {
    id: 'd2',
    userAnswerId: testAnswers[1].id, // a2
    messages: [
      {
        id: 'm5',
        role: 'user',
        content:
          'Why does typeof return "string" here? I thought strings were objects.',
        createdAt: new Date('2025-08-02T09:30:00Z'),
      },
      {
        id: 'm6',
        role: 'assistant',
        content:
          'In JavaScript, primitive strings are their own type. Only when you use `new String("...")` do you create an object wrapper. `typeof "TypeScript"` returns `"string"`, while `typeof new String("TypeScript")` returns `"object"`.',
        createdAt: new Date('2025-08-02T09:30:15Z'),
      },
    ],
  },
  // no discussion yet for a3, a4, a5
];
