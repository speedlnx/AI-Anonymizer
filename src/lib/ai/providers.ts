export interface ModelMeta {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'mock';
  apiModelId: string;
  contextWindow: number;
  maxOutputTokens: number;
  costPer1kPromptUsd: number;
  costPer1kCompletionUsd: number;
  description: string;
}

export const SUPPORTED_MODELS: ModelMeta[] = [
  // Anthropic Claude (Generazione 5.x)
  {
    id: 'claude-haiku-5-5',
    name: 'Claude Haiku 5.5',
    provider: 'anthropic',
    apiModelId: 'claude-haiku-5-5',
    contextWindow: 1000000,
    maxOutputTokens: 8192,
    costPer1kPromptUsd: 0.001,
    costPer1kCompletionUsd: 0.005,
    description: 'Modello ultra-rapido, leggero ed efficiente per analisi e compiti ad alta velocità',
  },
  {
    id: 'claude-sonnet-5-5',
    name: 'Claude Sonnet 5.5',
    provider: 'anthropic',
    apiModelId: 'claude-sonnet-5-5',
    contextWindow: 1000000,
    maxOutputTokens: 8192,
    costPer1kPromptUsd: 0.003,
    costPer1kCompletionUsd: 0.015,
    description: 'Modello bilanciato ad altissima intelligenza per analisi complesse e programmazione',
  },
  {
    id: 'claude-opus-5-5',
    name: 'Claude Opus 5.5',
    provider: 'anthropic',
    apiModelId: 'claude-opus-5-5',
    contextWindow: 1000000,
    maxOutputTokens: 16384,
    costPer1kPromptUsd: 0.004,
    costPer1kCompletionUsd: 0.02,
    description: 'Modello di punta per massimo ragionamento, elaborazione concettuale e sintesi avanzata',
  },
  {
    id: 'claude-fable-5-2',
    name: 'Claude Fable 5.2',
    provider: 'anthropic',
    apiModelId: 'claude-fable-5-2',
    contextWindow: 1000000,
    maxOutputTokens: 16384,
    costPer1kPromptUsd: 0.008,
    costPer1kCompletionUsd: 0.04,
    description: 'Modello premier per le sfide tecniche e scientifiche più complesse e architetture multi-agente',
  },

  // OpenAI
  {
    id: 'gpt-4o',
    name: 'OpenAI GPT-4o',
    provider: 'openai',
    apiModelId: 'gpt-4o',
    contextWindow: 128000,
    maxOutputTokens: 4096,
    costPer1kPromptUsd: 0.0025,
    costPer1kCompletionUsd: 0.01,
    description: 'Modello flagship OpenAI per compiti complessi, analisi e multimodale',
  },
  {
    id: 'gpt-4o-mini',
    name: 'OpenAI GPT-4o Mini',
    provider: 'openai',
    apiModelId: 'gpt-4o-mini',
    contextWindow: 128000,
    maxOutputTokens: 4096,
    costPer1kPromptUsd: 0.00015,
    costPer1kCompletionUsd: 0.0006,
    description: 'Modello compatto, rapido ed economico di OpenAI',
  },

  // Mock / Simulatore locale
  {
    id: 'mock-ai-assistant',
    name: 'Simulatore AI Locale (Test Senza API Key)',
    provider: 'mock',
    apiModelId: 'mock',
    contextWindow: 128000,
    maxOutputTokens: 2048,
    costPer1kPromptUsd: 0.0,
    costPer1kCompletionUsd: 0.0,
    description: 'Simula risposte AI preservando i tag anonimi per testare la riconversione',
  },
];

export function getModelMeta(modelId: string): ModelMeta {
  if (!modelId) return SUPPORTED_MODELS[0];
  const normalized = modelId.toLowerCase().replace(/[._]/g, '-');

  // Exact ID match
  const found = SUPPORTED_MODELS.find(
    (m) => m.id === modelId || m.id.toLowerCase().replace(/[._]/g, '-') === normalized
  );
  if (found) return found;

  // Handle Claude aliases and legacy strings
  if (normalized.includes('haiku')) {
    return SUPPORTED_MODELS.find((m) => m.id === 'claude-haiku-5-5')!;
  }
  if (normalized.includes('sonnet')) {
    return SUPPORTED_MODELS.find((m) => m.id === 'claude-sonnet-5-5')!;
  }
  if (normalized.includes('opus')) {
    return SUPPORTED_MODELS.find((m) => m.id === 'claude-opus-5-5')!;
  }
  if (normalized.includes('fable')) {
    return SUPPORTED_MODELS.find((m) => m.id === 'claude-fable-5-2')!;
  }

  // Handle OpenAI aliases
  if (normalized.includes('mini')) {
    return SUPPORTED_MODELS.find((m) => m.id === 'gpt-4o-mini')!;
  }
  if (normalized.includes('gpt')) {
    return SUPPORTED_MODELS.find((m) => m.id === 'gpt-4o')!;
  }

  const isClaude = normalized.startsWith('claude');
  return {
    id: modelId,
    name: modelId,
    provider: isClaude ? 'anthropic' : 'openai',
    apiModelId: isClaude ? 'claude-haiku-5-5' : 'gpt-4o',
    contextWindow: 128000,
    maxOutputTokens: 4096,
    costPer1kPromptUsd: 0.002,
    costPer1kCompletionUsd: 0.008,
    description: 'Modello personalizzato',
  };
}

// Rough token estimation (approx 4 chars per token for Latin/Italian text)
export function estimateTokenCount(text: string): number {
  if (!text) return 0;
  return Math.max(1, Math.ceil(text.length / 3.8));
}
