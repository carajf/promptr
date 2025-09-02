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

export type QuestionResponse = z.infer<typeof QuestionResponseSchema>;
// Client-side schema
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
/* ------------------------
   Persistence constants + helpers
   ------------------------ */

export const QUESTIONS_STORAGE_KEY = 'promptr.questions.v1';
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
