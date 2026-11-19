export interface ModelMeta {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'mock';
  contextWindow: number;
  maxOutputTokens: number;
  costPer1kPromptUsd: number;
  costPer1kCompletionUsd: number;
  description: string;
}

export const SUPPORTED_MODELS: ModelMeta[] = [
  // OpenAI
  {
    id: 'gpt-6-luna',
    name: 'OpenAI GPT-6 Luna',
    provider: 'openai',
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
    contextWindow: 128000,
    maxOutputTokens: 4096,
    costPer1kPromptUsd: 0.0025,
    costPer1kCompletionUsd: 0.01,
    description: 'Modello flagship OpenAI per compiti complessi e multimodali',
  },
  {
    id: 'gpt-4o-mini',
    name: 'OpenAI GPT-4o Mini',
    provider: 'openai',
    contextWindow: 128000,
    maxOutputTokens: 4096,
    costPer1kPromptUsd: 0.00015,
    costPer1kCompletionUsd: 0.0006,
    description: 'Modello veloce ed economico ad alte prestazioni',
  },
  {
    id: 'gpt-4-turbo',
    name: 'OpenAI GPT-4 Turbo',
    provider: 'openai',
    contextWindow: 128000,
    maxOutputTokens: 4096,
    costPer1kPromptUsd: 0.01,
    costPer1kCompletionUsd: 0.03,
    description: 'GPT-4 con ampia finestra di contesto',
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'OpenAI GPT-3.5 Turbo',
    provider: 'openai',
    contextWindow: 16385,
    maxOutputTokens: 4096,
    costPer1kPromptUsd: 0.0005,
    costPer1kCompletionUsd: 0.0015,
    description: 'Modello legacy rapido',
  },

  // Anthropic Claude
  {
    id: 'claude-5-5-haiku',
    name: 'Claude 5.5 Haiku',
    provider: 'anthropic',
    contextWindow: 500000,
    maxOutputTokens: 16384,
    costPer1kPromptUsd: 0.001,
    costPer1kCompletionUsd: 0.005,
    description: 'Modello Anthropic di nuova generazione ultra-veloce, leggero ed economico con finestra estesa',
  },
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    contextWindow: 200000,
    maxOutputTokens: 8192,
    costPer1kPromptUsd: 0.003,
    costPer1kCompletionUsd: 0.015,
    description: 'Il modello più intelligente di Anthropic per coding e analisi',
  },
  {
    id: 'claude-3-5-haiku-20241022',
    name: 'Claude 3.5 Haiku',
    provider: 'anthropic',
    contextWindow: 200000,
    maxOutputTokens: 8192,
    costPer1kPromptUsd: 0.0008,
    costPer1kCompletionUsd: 0.004,
    description: 'Modello ultra-veloce e leggero di Claude',
  },
  {
    id: 'claude-3-opus-20240229',
    name: 'Claude 3 Opus',
    provider: 'anthropic',
    contextWindow: 200000,
    maxOutputTokens: 4096,
    costPer1kPromptUsd: 0.015,
    costPer1kCompletionUsd: 0.075,
    description: 'Modello ad altissimo ragionamento per task complessi',
  },

  // Mock / Simulatore locale
  {
    id: 'mock-ai-assistant',
    name: 'Simulatore AI Locale (Test Senza API Key)',
    provider: 'mock',
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

  // Handle Claude Haiku 5.5 aliases
  if (
    normalized &&
    normalized.includes('haiku') &&
    (normalized.includes('5-5') || normalized.includes('5.5'))
  ) {
    const haiku55 = SUPPORTED_MODELS.find((m) => m.id === 'claude-5-5-haiku');
    if (haiku55) return haiku55;
  }

  return {
    id: modelId,
    name: modelId,
    provider: modelId.startsWith('claude') ? 'anthropic' : 'openai',
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

