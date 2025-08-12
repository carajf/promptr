import { Injectable } from '@angular/core';
import { OpenAI } from 'openai/client';
import { environment } from '../environments/environment';
import { z } from 'zod';
import { zodTextFormat } from 'openai/helpers/zod';

const QuestionResponseSchema = z.object({
  topics: z.array(z.string()),
  question: z.string(),
  answer: z.string(),
});

const ApiResponseSchema = z.object({
  generatedQuestions: z.array(QuestionResponseSchema),
});

export type GeneratedQuestions = z.infer<typeof ApiResponseSchema>;

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  readonly client = new OpenAI({
    apiKey: environment.openApiKey,
    dangerouslyAllowBrowser: true,
  });

  async generateQuestions(
    topic: string,
    numberOfQuestions: number,
    subtopics?: string[],
  ): Promise<any> {
    alert('OpenAPI is being called');

    let response = await this.client.responses.parse({
      model: 'gpt-4o-mini',
      input: `You are an exam question generator for software development.

        General topic: ${topic}
        Subtopics: ${subtopics}
        Number of questions: ${numberOfQuestions}
        Question style: A mix of long-form text based, multiple choice, short answer, and code challenges

       Rules:
        - Only ask questions relevant to the general topic and subtopics (if provided)
        - If subtopics are provided, ask at least one question per sub-topic
        - Questions should be challenging but clear
        - Questions should not be overly long or complex or cover too many topics (keep them bitesize whilst challenging)
        - Each question should be self-contained and not require external resources
        - Respond with the specified JSON schema, where topic(s) is the topic(s) relevant to that specific question
       `,
      text: {
        format: zodTextFormat(ApiResponseSchema, 'api_response_schema'),
      },
    });

    return response.output_parsed;
  }
}
