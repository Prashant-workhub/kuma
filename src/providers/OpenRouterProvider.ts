import { BaseProvider, extractJsonObject, safeJsonParse } from './AIProvider';
import { OpenRouterAdapter } from './ValidationAdapters';

/**
 * Executes an OpenRouter API request with adaptive max_tokens credit fallback.
 * If OpenRouter returns HTTP 402 ("can only afford X tokens"), automatically
 * resends the request using the affordable token budget or omits max_tokens.
 */
export async function postOpenRouterWithCreditFallback(
  apiKey: string,
  payload: any,
  requestedMaxTokens?: number
): Promise<any> {
  const FREE_MODELS_POOL = [
    'nvidia/nemotron-3-ultra-550b-a55b:free'
  ];

  const attemptRequest = async (modelName: string | string[], tokens?: number, omitFormat = false): Promise<Response> => {
    const body: any = { ...payload };
    if (Array.isArray(modelName)) {
      body.models = modelName;
      delete body.model;
    } else {
      body.model = modelName;
      delete body.models;
    }

    if (tokens !== undefined && tokens > 0) {
      body.max_tokens = tokens;
    } else {
      delete body.max_tokens;
    }

    if (omitFormat) {
      delete body.response_format;
    }

    return await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://noteit.ai',
        'X-Title': 'NoteIT'
      },
      body: JSON.stringify(body)
    });
  };

  let initialModel = payload.model || 'nvidia/nemotron-3-ultra-550b-a55b:free';
  if (
    !initialModel ||
    initialModel.startsWith('sk-') ||
    initialModel.startsWith('sk-or-') ||
    initialModel.startsWith('AIza') ||
    initialModel.startsWith('gsk_') ||
    initialModel.startsWith('nvapi-') ||
    initialModel.startsWith('ms-') ||
    initialModel.startsWith('xai-') ||
    (initialModel.length > 40 && !initialModel.includes('/')) ||
    /^[a-zA-Z0-9_\-]{40,}$/.test(initialModel)
  ) {
    console.warn(`[OpenRouter] Invalid model string detected ("${initialModel?.slice(0, 12)}..."). Fallback to free models pool.`);
    initialModel = 'nvidia/nemotron-3-ultra-550b-a55b:free';
  }

  // 1. Initial Attempt using specified model or free pool
  let response = await attemptRequest(initialModel, requestedMaxTokens);

  // 2. If initial attempt succeeded, return data
  if (response.ok) {
    return await response.json();
  }

  const errText = await response.text().catch(() => '');
  console.warn(`[OpenRouter] Initial request status ${response.status} with model=${initialModel}. Executing fallback sequence...`, errText);

  // 3. Retry with affordable token budget if 402/403 max_tokens credit reservation error
  if (response.status === 402 || response.status === 403) {
    const match = errText.match(/can only afford (\d+)/i);
    if (match && match[1]) {
      const affordableTokens = Math.max(300, Math.floor(parseInt(match[1], 10) * 0.9));
      console.log(`[OpenRouter] Retrying request with affordable max_tokens: ${affordableTokens}`);
      response = await attemptRequest(initialModel, affordableTokens);
      if (response.ok) return await response.json();
    }
  }

  // 4. Try native OpenRouter multi-model router array across FREE models pool (omitting max_tokens reservation)
  console.log('[OpenRouter] Executing multi-model fallback across OpenRouter Free pool...');
  const poolResponse = await attemptRequest(FREE_MODELS_POOL, undefined);
  if (poolResponse.ok) {
    console.log('[OpenRouter] Successfully generated response via OpenRouter Free model router array.');
    return await poolResponse.json();
  }

  // 5. Try free models individually (also test without response_format if json_object caused 400)
  for (const freeModel of FREE_MODELS_POOL) {
    console.log(`[OpenRouter] Retrying individual free model: ${freeModel}`);
    const freeRes = await attemptRequest(freeModel, undefined, false);
    if (freeRes.ok) return await freeRes.json();

    // Retry without response_format in case upstream provider doesn't support json_object mode
    if (payload.response_format) {
      const plainRes = await attemptRequest(freeModel, undefined, true);
      if (plainRes.ok) return await plainRes.json();
    }
  }

  // 6. Handle final failure with clear, friendly explanation
  if (response.status === 402 || poolResponse.status === 402) {
    throw new Error('OpenRouter API limit reached: Accounts with $0 credits have a daily free quota of 50 requests/day. Add $5-$10 credits to OpenRouter to expand limits to 1,000/day, or switch your AI Provider to Google Gemini API Key in Settings.');
  }

  if (response.status === 429 || poolResponse.status === 429) {
    throw new Error('OpenRouter rate limit reached (20 req/min). Please wait 30 seconds or switch your AI Provider to Google Gemini API Key in Settings.');
  }

  throw new Error(`OpenRouter API error (${response.status}): ${errText || 'Service temporarily unavailable.'}`);
}

export class OpenRouterProvider extends BaseProvider {
  constructor(apiKey: string) {
    super(apiKey, 'nvidia/nemotron-3-ultra-550b-a55b:free');
  }

  getAvailableModels(): string[] {
    return [
      'google/gemini-2.0-flash-001',
      'google/gemini-2.0-flash-exp:free',
      'meta-llama/llama-3.3-70b-instruct:free',
      'deepseek/deepseek-chat',
      'anthropic/claude-3.5-sonnet',
      'openai/gpt-4o-mini'
    ];
  }

  async validateKey(): Promise<boolean> {
    try {
      const adapter = new OpenRouterAdapter();
      await adapter.validate(this.apiKey, this.defaultModel);
      return true;
    } catch (err) {
      console.error('[OpenRouterProvider] Key validation failed:', err);
      return false;
    }
  }

  async generateText(prompt: string, model?: string): Promise<string> {
    const activeModel = model || this.defaultModel;
    const payload = {
      model: activeModel,
      messages: [{ role: 'user', content: prompt }]
    };

    const data = await postOpenRouterWithCreditFallback(this.apiKey, payload, undefined);
    return data.choices?.[0]?.message?.content || '';
  }

  async generateStructuredOutput(prompt: string, schema: any, model?: string): Promise<any> {
    const activeModel = model || this.defaultModel;
    const payload = {
      model: activeModel,
      messages: [{ role: 'user', content: `${prompt}\n\nYou MUST return the response strictly matching this JSON schema: ${JSON.stringify(schema)}` }],
      response_format: { type: 'json_object' }
    };

    const data = await postOpenRouterWithCreditFallback(this.apiKey, payload, undefined);
    const text = data.choices?.[0]?.message?.content || '';
    return safeJsonParse(text);
  }

  async transcribeAudio(base64Audio: string, mimeType: string, model?: string): Promise<string> {
    throw new Error('OpenRouter does not support audio transcription natively. Please switch your AI Provider to Google Gemini, Groq, or OpenAI to transcribe audio.');
  }
}
