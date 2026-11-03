export type EntityType =
  | 'API_KEY'
  | 'EMAIL'
  | 'URL'
  | 'MAC_ADDRESS'
  | 'IP_ADDRESS'
  | 'UUID'
  | 'IBAN'
  | 'BANK_CODE'
  | 'CREDIT_CARD'
  | 'CODICE_FISCALE'
  | 'PARTITA_IVA'
  | 'PHONE'
  | 'DOCUMENT_ID'
  | 'CUSTOM';

export interface EntityMatch {
  type: EntityType;
  value: string;
  start: number;
  end: number;
  placeholder?: string;
  confidence: number;
  label?: string;
  details?: Record<string, unknown>;
}

export interface EntityMapping {
  id: string; // e.g. "CF_1", "EMAIL_2"
  placeholder: string; // e.g. "[CODICE_FISCALE_1]"
  type: EntityType;
  originalValue: string;
  categoryName: string;
  createdAt: number;
  count: number;
  enabled: boolean;
}

export interface CustomRule {
  id: string;
  text: string;
  isRegex: boolean;
  caseSensitive: boolean;
  categoryLabel?: string;
}

export interface AnonymizationResult {
  originalText: string;
  anonymizedText: string;
  mappings: EntityMapping[];
  stats: {
    totalEntitiesFound: number;
    entitiesAnonymized: number;
    byType: Record<EntityType, number>;
    durationMs: number;
  };
}

export interface DeanonymizationResult {
  restoredText: string;
  restorationsCount: number;
  restoredEntities: {
    placeholder: string;
    originalValue: string;
    type: EntityType;
    count: number;
  }[];
}

export interface AIProviderConfig {
  provider: 'openai' | 'anthropic' | 'mock';
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export interface TokenUsageStats {
  provider: string;
  model: string;
  lastPromptTokens: number;
  lastCompletionTokens: number;
  lastTotalTokens: number;
  sessionPromptTokens: number;
  sessionCompletionTokens: number;
  sessionTotalTokens: number;
  contextWindow: number;
  tokensRemaining: number;
  requestCount: number;
  lastRequestTimestamp: number | null;
  estimatedCostUsd: number;
}

