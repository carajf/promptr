import { Injectable } from '@angular/core';
import { OpenAI } from 'openai/client';
import { environment } from '../../environments/environment';
import { zodTextFormat } from 'openai/helpers/zod';
import {
  AnswerDiscussion,
  QuestionGradeResponse,
  QuestionGradeResponseSchema,
  QuestionListResponseSchema,
  QuestionResponse,
  QuestionVersion,
  UserAnswer,
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

  async gradeAnswer(
    question: string,
    originalAnswer: string,
    userAnswer: string,
  ): Promise<QuestionGradeResponse> {
    console.log('Answer being checked!');

    const response = await this.client.responses.parse({
      model: 'gpt-4o-mini',
      input: [
        { role: 'system', content: EXAM_GENERATOR_PROMPT },
        {
          role: 'user',
          content: `
        Question: ${question}
        Your answer: ${originalAnswer}
        Answer: ${userAnswer}

        Give clear feedback, a pass/fail mark, then a suggested correct solution (if required).`,
        },
      ],
      text: {
        format: zodTextFormat(
          QuestionGradeResponseSchema,
          'question_grade_schema',
        ),
      },
    });

    console.log('Answer checked!');
    return await this.parseWithSchema(response, QuestionGradeResponseSchema);
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

  async chat(
    question: QuestionVersion,
    answer: UserAnswer,
    discussion: AnswerDiscussion,
  ) {
    const prompt = `
You are an expert coding tutor.
The user answered a coding interview-style question.
They received initial feedback. Now they want to have a back-and-forth chat.
You will receive the necessary context, and the entire discussion history including the latest message to be responded to.

- Be constructive and educational.
- Reference the question, their answer, and the feedback when relevant.
- Keep answers clear and concise, but you can expand if they ask.
  `;

    alert('OpenAI is being called!');

    const response = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: prompt },
        {
          role: 'assistant',
          content: `Here is the context of the task:
      Question: ${question.question}
      Answer: ${question.answer}
      User's Answer: ${answer.text}
      Feedback: ${answer.feedback}`,
        },
        ...discussion.messages,
      ],
      temperature: 0.7,
    });

    return response.choices[0].message?.content ?? '';
  }
}
