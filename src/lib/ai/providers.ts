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
  // Anthropic Claude
  {
    id: 'claude-5-5-haiku',
    name: 'Claude Haiku 5.5',
    provider: 'anthropic',
    apiModelId: 'claude-3-5-haiku-20241022',
    contextWindow: 500000,
    maxOutputTokens: 8192,
    costPer1kPromptUsd: 0.001,
    costPer1kCompletionUsd: 0.005,
    description: 'Modello ultra-rapido, leggero ed efficiente per analisi e compiti ad alta velocità',
  },
  {
    id: 'claude-5-5-sonnet',
    name: 'Claude Sonnet 5.5',
    provider: 'anthropic',
    apiModelId: 'claude-3-5-sonnet-20241022',
    contextWindow: 500000,
    maxOutputTokens: 8192,
    costPer1kPromptUsd: 0.003,
    costPer1kCompletionUsd: 0.015,
    description: 'Modello bilanciato ad altissima intelligenza per analisi complesse e programmazione',
  },
  {
    id: 'claude-5-5-opus',
    name: 'Claude Opus 5.5',
    provider: 'anthropic',
    apiModelId: 'claude-3-opus-20240229',
    contextWindow: 500000,
    maxOutputTokens: 4096,
    costPer1kPromptUsd: 0.015,
    costPer1kCompletionUsd: 0.075,
    description: 'Modello di punta per massimo ragionamento, elaborazione concettuale e sintesi avanzata',
  },
  {
    id: 'claude-5-2-fable',
    name: 'Claude Fable 5.2',
    provider: 'anthropic',
    apiModelId: 'claude-3-5-sonnet-20241022',
    contextWindow: 300000,
    maxOutputTokens: 8192,
    costPer1kPromptUsd: 0.002,
    costPer1kCompletionUsd: 0.01,
    description: 'Modello specializzato in creatività, sintesi espressiva e narrative complesse',
  },

  // OpenAI
  {
    id: 'gpt-6-luna',
    name: 'OpenAI GPT-6 Luna',
    provider: 'openai',
    apiModelId: 'gpt-4o',
    contextWindow: 512000,
    maxOutputTokens: 16384,
    costPer1kPromptUsd: 0.005,
    costPer1kCompletionUsd: 0.02,
    description: 'Modello OpenAI di nuova generazione ad altissime prestazioni, ragionamento profondo e finestra estesa',
  },
  {
    id: 'gpt-4o',
    name: 'OpenAI GPT-4o',
    provider: 'openai',
    apiModelId: 'gpt-4o',
    contextWindow: 128000,
    maxOutputTokens: 4096,
    costPer1kPromptUsd: 0.0025,
    costPer1kCompletionUsd: 0.01,
    description: 'Modello flagship OpenAI per compiti complessi e multimodali',
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
  const normalized = modelId?.toLowerCase().replace(/[._]/g, '-');
  const found = SUPPORTED_MODELS.find(
    (m) => m.id === modelId || m.id.toLowerCase().replace(/[._]/g, '-') === normalized
  );
  if (found) return found;

  // Handle Claude aliases
  if (normalized) {
    if (normalized.includes('haiku')) {
      return SUPPORTED_MODELS.find((m) => m.id === 'claude-5-5-haiku')!;
    }
    if (normalized.includes('sonnet')) {
      return SUPPORTED_MODELS.find((m) => m.id === 'claude-5-5-sonnet')!;
    }
    if (normalized.includes('opus')) {
      return SUPPORTED_MODELS.find((m) => m.id === 'claude-5-5-opus')!;
    }
    if (normalized.includes('fable')) {
      return SUPPORTED_MODELS.find((m) => m.id === 'claude-5-2-fable')!;
    }
    if (normalized.includes('luna') || normalized.includes('gpt-6')) {
      return SUPPORTED_MODELS.find((m) => m.id === 'gpt-6-luna')!;
    }
  }

  const isClaude = modelId?.startsWith('claude');
  return {
    id: modelId,
    name: modelId,
    provider: isClaude ? 'anthropic' : 'openai',
    apiModelId: isClaude ? 'claude-3-5-haiku-20241022' : 'gpt-4o',
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
