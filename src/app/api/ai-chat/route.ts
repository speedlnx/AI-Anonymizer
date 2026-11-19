import { NextRequest, NextResponse } from 'next/server';
import { estimateTokenCount, getModelMeta } from '@/lib/ai/providers';

interface RequestBody {
  prompt: string;
  systemPrompt?: string;
  provider: 'openai' | 'anthropic' | 'mock';
  model: string;
  apiKey?: string;
  temperature?: number;
  forbiddenSecrets?: string[];
}

export async function POST(req: NextRequest) {
  try {
    const body: RequestBody = await req.json();
    const { prompt, systemPrompt, provider, model, apiKey, temperature = 0.7, forbiddenSecrets = [] } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt mancante o non valido.' }, { status: 400 });
    }

    // --- ZERO-LEAK SECURITY VERIFICATION ---
    // Assert that no unanonymized sensitive entity exists in the prompt being sent out!
    if (Array.isArray(forbiddenSecrets) && forbiddenSecrets.length > 0) {
      for (const secret of forbiddenSecrets) {
        if (secret && typeof secret === 'string' && secret.trim().length >= 4) {
          if (prompt.includes(secret.trim())) {
            return NextResponse.json(
              {
                error: 'SECURITY_ALERT: Rilevato dato non anonimizzato nel payload in uscita! Invio bloccato per sicurezza.',
                leakedSecretPreview: `${secret.slice(0, 3)}***`,
              },
              { status: 403 }
            );
          }
        }
      }
    }

    // --- MOCK PROVIDER (For testing without requiring a paid key) ---
    if (provider === 'mock') {
      // Find tags in the prompt
      const tagMatches = prompt.match(/\[[A-Z_]+_\d+\]/g) || [];
      const uniqueTags = Array.from(new Set(tagMatches));

      const tagsMentionText =
        uniqueTags.length > 0
          ? `\n\nHo elaborato i seguenti riferimenti anonimizzati ricevuti:\n${uniqueTags.map((t) => `- ${t}`).join('\n')}`
          : '';

      const mockResponse = `Ricevuta la tua richiesta!\n\nAnalisi completata con successo in totale sicurezza. I parametri elaborati confermano che tutti i riferimenti sono stati gestiti nel pieno rispetto degli standard di anonimizzazione e riservatezza.${tagsMentionText}\n\nConfermo che l'operazione per l'entità indicata è stata registrata con esito positivo.`;

      const promptTokens = estimateTokenCount(prompt + (systemPrompt || ''));
      const completionTokens = estimateTokenCount(mockResponse);

      return NextResponse.json({
        content: mockResponse,
        usage: {
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens,
        },
        model: 'mock-ai-assistant',
      });
    }

    // --- OPENAI INTEGRATION ---
    if (provider === 'openai') {
      if (!apiKey || apiKey.trim() === '') {
        return NextResponse.json({ error: 'Chiave API OpenAI non fornita.' }, { status: 400 });
      }

      const meta = getModelMeta(model || 'gpt-6-luna');
      const targetModel = meta.apiModelId || model || 'gpt-4o';

      const messages: Array<{ role: string; content: string }> = [];
      if (systemPrompt && systemPrompt.trim()) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      messages.push({ role: 'user', content: prompt });

      const callOpenAI = async (modelName: string) => {
        return fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey.trim()}`,
          },
          body: JSON.stringify({
            model: modelName,
            messages,
            temperature,
          }),
        });
      };

      let response = await callOpenAI(targetModel);

      // Fallback if model not found
      if (!response.ok && targetModel !== 'gpt-4o') {
        const errorPeek = await response.clone().json().catch(() => ({}));
        if (errorPeek.error?.code === 'model_not_found' || errorPeek.error?.message?.includes('model')) {
          console.warn(`OpenAI model "${targetModel}" not found, falling back to gpt-4o`);
          response = await callOpenAI('gpt-4o');
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return NextResponse.json(
          {
            error: errorData.error?.message || `Errore OpenAI (${response.status}): ${response.statusText}`,
          },
          { status: response.status }
        );
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      const usage = data.usage || {
        prompt_tokens: estimateTokenCount(prompt),
        completion_tokens: estimateTokenCount(content),
        total_tokens: estimateTokenCount(prompt + content),
      };

      return NextResponse.json({
        content,
        usage: {
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens,
        },
        model: data.model || meta.name || model,
      });
    }

    // --- ANTHROPIC CLAUDE INTEGRATION ---
    if (provider === 'anthropic') {
      if (!apiKey || apiKey.trim() === '') {
        return NextResponse.json({ error: 'Chiave API Anthropic Claude non fornita.' }, { status: 400 });
      }

      const meta = getModelMeta(model || 'claude-5-5-haiku');
      const targetModel = meta.apiModelId || 'claude-3-5-haiku-20241022';

      const callAnthropic = async (modelName: string) => {
        const bodyPayload: Record<string, unknown> = {
          model: modelName,
          max_tokens: meta.maxOutputTokens || 4096,
          temperature,
          messages: [{ role: 'user', content: prompt }],
        };

        if (systemPrompt && systemPrompt.trim()) {
          bodyPayload.system = systemPrompt;
        }

        return fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey.trim(),
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify(bodyPayload),
        });
      };

      let response = await callAnthropic(targetModel);

      // If Anthropic returns model not found (e.g. 400 "model: ..."), automatically try official fallback
      if (!response.ok && targetModel !== 'claude-3-5-haiku-20241022') {
        const errorPeek = await response.clone().json().catch(() => ({}));
        if (errorPeek.error?.message?.includes('model:')) {
          console.warn(`Anthropic model "${targetModel}" not recognized, falling back to claude-3-5-haiku-20241022`);
          response = await callAnthropic('claude-3-5-haiku-20241022');
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return NextResponse.json(
          {
            error: errorData.error?.message || `Errore Claude (${response.status}): ${response.statusText}`,
          },
          { status: response.status }
        );
      }

      const data = await response.json();
      const content =
        data.content
          ?.filter((c: { type: string }) => c.type === 'text')
          .map((c: { text: string }) => c.text)
          .join('\n') || '';

      const promptTokens = data.usage?.input_tokens || estimateTokenCount(prompt);
      const completionTokens = data.usage?.output_tokens || estimateTokenCount(content);

      return NextResponse.json({
        content,
        usage: {
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens,
        },
        model: data.model || meta.name || model,
      });
    }

    return NextResponse.json({ error: `Provider "${provider}" non supportato.` }, { status: 400 });
  } catch (error: unknown) {
    console.error('API Chat Error:', error);
    const message = error instanceof Error ? error.message : 'Errore interno del server';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

