import { NextRequest, NextResponse } from 'next/server';
import { estimateTokenCount, getModelMeta } from '@/lib/ai/providers';

interface RequestBody {
  prompt: string;
  systemPrompt?: string;
  provider: 'openai' | 'anthropic' | 'mock';
  model: string;
  customApiModel?: string;
  apiKey?: string;
  temperature?: number;
  forbiddenSecrets?: string[];
}

export async function POST(req: NextRequest) {
  try {
    const body: RequestBody = await req.json();
    const {
      prompt,
      systemPrompt,
      provider,
      model,
      customApiModel,
      apiKey,
      temperature = 0.7,
      forbiddenSecrets = [],
    } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        {
          error: 'Prompt mancante o non valido.',
          debug: { reason: 'MISSING_PROMPT' },
        },
        { status: 400 }
      );
    }

    // --- ZERO-LEAK SECURITY VERIFICATION ---
    if (Array.isArray(forbiddenSecrets) && forbiddenSecrets.length > 0) {
      for (const secret of forbiddenSecrets) {
        if (secret && typeof secret === 'string' && secret.trim().length >= 4) {
          if (prompt.includes(secret.trim())) {
            return NextResponse.json(
              {
                error:
                  'SECURITY_ALERT: Rilevato dato non anonimizzato nel payload in uscita! Invio bloccato per sicurezza.',
                leakedSecretPreview: `${secret.slice(0, 3)}***`,
                debug: { reason: 'ZERO_LEAK_TRIGGERED' },
              },
              { status: 403 }
            );
          }
        }
      }
    }

    // --- MOCK PROVIDER (Test locale senza API key) ---
    if (provider === 'mock') {
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
        return NextResponse.json(
          {
            error: 'Chiave API OpenAI non fornita.',
            debug: { provider: 'openai', reason: 'MISSING_API_KEY' },
          },
          { status: 400 }
        );
      }

      const meta = getModelMeta(model || 'gpt-4o');
      let targetModel = customApiModel?.trim() || meta.apiModelId || 'gpt-4o';

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
      const attemptedModels = [targetModel];

      // Fallback if model not found
      if (!response.ok && targetModel !== 'gpt-4o') {
        const errorPeek = await response.clone().json().catch(() => ({}));
        if (
          errorPeek.error?.code === 'model_not_found' ||
          errorPeek.error?.message?.includes('model')
        ) {
          console.warn(`OpenAI model "${targetModel}" not found, retrying with "gpt-4o"...`);
          attemptedModels.push('gpt-4o');
          const retryRes = await callOpenAI('gpt-4o');
          if (retryRes.ok) {
            response = retryRes;
            targetModel = 'gpt-4o';
          }
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const rawMessage =
          errorData.error?.message || `Errore OpenAI (${response.status}): ${response.statusText}`;

        return NextResponse.json(
          {
            error: `Errore OpenAI: ${rawMessage}`,
            debug: {
              provider: 'openai',
              endpoint: 'https://api.openai.com/v1/chat/completions',
              httpStatus: response.status,
              statusText: response.statusText,
              modelRequested: model,
              apiModelAttempted: targetModel,
              allAttemptedModels: attemptedModels,
              rawError: errorData,
              hint:
                rawMessage.includes('model')
                  ? 'Il modello specificato non è disponibile per la tua API key OpenAI. Prova a selezionare GPT-4o o GPT-4o Mini nelle impostazioni.'
                  : 'Verifica la validità della chiave API e la disponibilità di crediti OpenAI.',
            },
          },
          { status: response.status }
        );
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      const cachedTokens = data.usage?.prompt_tokens_details?.cached_tokens ?? 0;
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
          cachedTokens,
        },
        model: data.model || meta.name || model,
      });
    }

    // --- ANTHROPIC CLAUDE INTEGRATION ---
    if (provider === 'anthropic') {
      if (!apiKey || apiKey.trim() === '') {
        return NextResponse.json(
          {
            error: 'Chiave API Anthropic Claude non fornita.',
            debug: { provider: 'anthropic', reason: 'MISSING_API_KEY' },
          },
          { status: 400 }
        );
      }

      const meta = getModelMeta(model || 'claude-haiku-5-5');
      let targetModel = customApiModel?.trim() || meta.apiModelId || 'claude-haiku-5-5';

      // Auto-sanitize obsolete/legacy 3.x or alias model strings
      if (
        targetModel === 'claude-3-haiku-20240307' ||
        targetModel === 'claude-3-5-haiku-20241022' ||
        targetModel === 'claude-5-5-haiku'
      ) {
        targetModel = 'claude-haiku-5-5';
      } else if (
        targetModel === 'claude-3-5-sonnet-20241022' ||
        targetModel === 'claude-3-sonnet-20240229' ||
        targetModel === 'claude-5-5-sonnet'
      ) {
        targetModel = 'claude-sonnet-5-5';
      } else if (
        targetModel === 'claude-3-opus-20240229' ||
        targetModel === 'claude-5-5-opus'
      ) {
        targetModel = 'claude-opus-5-5';
      } else if (targetModel === 'claude-5-2-fable') {
        targetModel = 'claude-fable-5-2';
      }

      // Default system instruction to ensure prompt placeholder preservation & enable prompt caching
      const defaultSystemInstruction =
        "Sei un assistente AI professionale, accurato e sicuro. Ricevi testi pre-anonimizzati secondo rigorosi criteri di riservatezza GDPR. Rispondi con precisione alle richieste dell'utente preservando fedelmente e senza alcuna alterazione tutti i segnaposto ed etichette tra parentesi quadre (ad es. [CODICE_FISCALE_1], [IBAN_1], [EMAIL_1], [DOCUMENT_ID_1], ecc.), così che possano essere de-anonimizzati automaticamente nella restituzione finale.";

      const effectiveSystem = systemPrompt && systemPrompt.trim() ? systemPrompt.trim() : defaultSystemInstruction;

      const callAnthropic = async (modelName: string) => {
        // PROMPT CACHING & CLAUDE 5.x SAMPLING RULES:
        // 1. temperature is deprecated on Claude 5.x and MUST be omitted to avoid invalid_request_error
        // 2. cache_control: { type: 'ephemeral' } enables prompt caching on system and user blocks,
        //    reducing latency and granting up to 90% discount on cached input tokens!
        const bodyPayload: Record<string, unknown> = {
          model: modelName,
          max_tokens: meta.maxOutputTokens || 4096,
          system: [
            {
              type: 'text',
              text: effectiveSystem,
              cache_control: { type: 'ephemeral' },
            },
          ],
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: prompt,
                  cache_control: { type: 'ephemeral' },
                },
              ],
            },
          ],
        };

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
      const attemptedModels = [targetModel];

      // If Anthropic returns model not found (e.g. 404 not_found_error, 400 invalid_request_error, or "model: ..."), automatically try official 5.x fallbacks
      if (!response.ok) {
        const errorPeek = await response.clone().json().catch(() => ({}));
        const isModelError =
          errorPeek.error?.type === 'not_found_error' ||
          errorPeek.error?.type === 'invalid_request_error' ||
          (typeof errorPeek.error?.message === 'string' && errorPeek.error.message.includes('model:')) ||
          response.status === 404;

        if (isModelError) {
          // List of fallback candidates in order of 5.x availability
          const fallbackCandidates = ['claude-haiku-5-5', 'claude-sonnet-5-5', 'claude-opus-5-5', 'claude-fable-5-2'];
          for (const fallback of fallbackCandidates) {
            if (!attemptedModels.includes(fallback)) {
              console.warn(
                `Anthropic model "${targetModel}" returned ${errorPeek.error?.type || response.status}, retrying with fallback "${fallback}"...`
              );
              attemptedModels.push(fallback);
              const retryRes = await callAnthropic(fallback);
              if (retryRes.ok) {
                response = retryRes;
                targetModel = fallback;
                break;
              }
            }
          }
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const rawMessage =
          errorData.error?.message || `Errore Claude (${response.status}): ${response.statusText}`;

        let hint = 'Controlla che la chiave API sia corretta e che il tuo account Anthropic abbia crediti.';
        if (rawMessage.includes('model:') || errorData.error?.type === 'not_found_error') {
          hint = `Anthropic ha rifiutato l'identificativo '${targetModel}'. I modelli supportati tramite API sono: claude-haiku-5-5, claude-sonnet-5-5, claude-opus-5-5 e claude-fable-5-2. Verifica nella console Anthropic i modelli abilitati per la tua API key.`;
        } else if (errorData.error?.type === 'authentication_error') {
          hint = 'La chiave API Anthropic fornita non è valida o è scaduta. Controlla la Claude Console (https://platform.claude.com/dashboard).';
        } else if (
          rawMessage.includes('credit') ||
          rawMessage.includes('balance') ||
          rawMessage.includes('quota')
        ) {
          hint = 'Il saldo crediti del tuo account Anthropic è esaurito. Effettua una ricarica nella console Anthropic.';
        }

        return NextResponse.json(
          {
            error: `Errore Anthropic Claude: ${rawMessage}`,
            debug: {
              provider: 'anthropic',
              endpoint: 'https://api.anthropic.com/v1/messages',
              httpStatus: response.status,
              statusText: response.statusText,
              modelRequested: model,
              apiModelAttempted: targetModel,
              allAttemptedModels: attemptedModels,
              rawError: errorData,
              hint,
            },
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

      const inputTokens = data.usage?.input_tokens ?? 0;
      const outputTokens = data.usage?.output_tokens ?? 0;
      const cacheCreationTokens = data.usage?.cache_creation_input_tokens ?? 0;
      const cacheReadTokens = data.usage?.cache_read_input_tokens ?? 0;

      const totalPromptTokens =
        inputTokens + cacheCreationTokens + cacheReadTokens > 0
          ? inputTokens + cacheCreationTokens + cacheReadTokens
          : estimateTokenCount(prompt);

      const totalCompletionTokens =
        outputTokens > 0 ? outputTokens : estimateTokenCount(content);

      return NextResponse.json({
        content,
        usage: {
          promptTokens: totalPromptTokens,
          completionTokens: totalCompletionTokens,
          totalTokens: totalPromptTokens + totalCompletionTokens,
          cacheCreationInputTokens: cacheCreationTokens,
          cacheReadInputTokens: cacheReadTokens,
          cachedTokens: cacheReadTokens,
        },
        model: data.model || meta.name || model,
      });

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

    return NextResponse.json(
      {
        error: `Provider "${provider}" non supportato.`,
        debug: { provider },
      },
      { status: 400 }
    );
  } catch (error: unknown) {
    console.error('API Chat Error:', error);
    const message = error instanceof Error ? error.message : 'Errore interno del server';
    return NextResponse.json(
      {
        error: message,
        debug: { exception: message },
      },
      { status: 500 }
    );
  }
}
