import axios from 'axios';
import { config } from '../config/index.js';

interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GroqRequest {
  model: string;
  messages: GroqMessage[];
  temperature: number;
  response_format?: { type: string };
  max_tokens?: number;
}

interface GroqResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export async function callGroqLLM(
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  if (!config.groq.apiKey) {
    throw new Error('GROQ_API_KEY not configured');
  }

  const payload: GroqRequest = {
    model: config.groq.model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    temperature: 0,
    response_format: { type: 'json_object' },
    max_tokens: 1024,
  };

  try {
    console.log(`[Groq] Calling ${config.groq.model}...`);
    const response = await axios.post<GroqResponse>(
      'https://api.groq.com/openai/v1/chat/completions',
      payload,
      {
        headers: {
          Authorization: `Bearer ${config.groq.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const content = response.data.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from Groq');
    }

    console.log('[Groq] Response received');
    return content;
  } catch (error) {
    console.error('[Groq Error]:', error);
    throw new Error('LLM call failed');
  }
}
