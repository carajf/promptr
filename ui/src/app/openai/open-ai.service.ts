import { Injectable } from '@angular/core';
import { OpenAI } from 'openai/client';
import { environment } from '../../environments/environment';
import { zodTextFormat } from 'openai/helpers/zod';
import {
  QuestionListResponseSchema,
  QuestionResponse,
  QuestionVersion,
} from '../questions/question.schema';
import { ZodType } from 'zod';

const EXAM_GENERATOR_PROMPT = `
You are an exam assistant that can generate questions with answers and provide feedback.
The user will not see your answer until they have provided their own.
Talk about the answer rather than the user, e.g. "the answer addresses x, the answer does not address y".

Rules:
- Only ask questions relevant to the general topic and subtopics (if provided)
- If subtopics are provided, ask at least one question per sub-topic
- Questions should be challenging but clear
- Questions should not be overly long or complex or cover too many topics
- Each question should be self-contained and not require external resources
- Questions should be given with a corresponding answer
- Questions should be written in markdown for formatting
- When generating questions, always return JSON matching the schema
- When grading answers, return structured feedback
`;

@Injectable({
  providedIn: 'root',
})
export class OpenAiService {
  readonly client = new OpenAI({
    apiKey: environment.openApiKey,
    dangerouslyAllowBrowser: true,
  });

  async generateQuestions(
    topic: string,
    numberOfQuestions: number,
    subtopics?: string[],
  ): Promise<QuestionResponse[]> {
    alert('OpenAPI is being called');

    let response = await this.client.responses.parse({
      model: 'gpt-4o-mini',
      input: [
        {
          role: 'system',
          content: EXAM_GENERATOR_PROMPT,
        },
        {
          role: 'user',
          content: `
        Generate ${numberOfQuestions} exam questions.
        Topic: ${topic}
        Subtopics: ${subtopics ? subtopics.join(', ') : subtopics}`,
        },
      ],
      text: {
        format: zodTextFormat(
          QuestionListResponseSchema,
          'question_list_schema',
        ),
      },
    });

    const parsed = await this.parseWithSchema(
      response,
      QuestionListResponseSchema,
    );

    return parsed.questions;
  }

  private async parseWithSchema<T>(
    response: any,
    schema: ZodType<T>,
  ): Promise<T> {
    const rawCandidate = response.output_parsed;
    const parsedCandidate = schema.safeParse(rawCandidate);
    if (!parsedCandidate.success) {
      const zodErrorSummary = JSON.stringify(
        parsedCandidate.error.format(),
        null,
        2,
      );
      throw new Error(
        `OpenAI response did not match schema:\n${zodErrorSummary}`,
      );
    }

    return parsedCandidate.data;
  }
