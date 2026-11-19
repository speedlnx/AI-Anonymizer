'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from '@/components/Header';
import { StatsPanel } from '@/components/StatsPanel';
import { DualEditor } from '@/components/DualEditor';
import { EntityInspector } from '@/components/EntityInspector';
import { AiResponseViewer } from '@/components/AiResponseViewer';
import { CustomEntitiesModal } from '@/components/CustomEntitiesModal';
import { AiConfigModal } from '@/components/AiConfigModal';
import { PrivacyModal } from '@/components/PrivacyModal';
import { AnonymizerEngine } from '@/lib/anonymizer/engine';
import { EntityMapping, CustomRule, TokenUsageStats, DeanonymizationResult } from '@/lib/anonymizer/types';
import { SamplePrompt, SAMPLE_PROMPTS } from '@/lib/anonymizer/samples';
import { getModelMeta, estimateTokenCount, SUPPORTED_MODELS } from '@/lib/ai/providers';
import {
  AlertTriangle,
  CheckCircle2,
  Bug,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Settings2,
} from 'lucide-react';

export default function Home() {
  // State for prompt texts
  const [originalText, setOriginalText] = useState('');
  const [anonymizedText, setAnonymizedText] = useState('');
  const [mappings, setMappings] = useState<EntityMapping[]>([]);
  const [customRules, setCustomRules] = useState<CustomRule[]>([]);

  // Modals state
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [isAiConfigOpen, setIsAiConfigOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

  // AI Configuration state
  const [aiProvider, setAiProvider] = useState<'openai' | 'anthropic' | 'mock'>('mock');
  const [aiModel, setAiModel] = useState<string>('mock-ai-assistant');
  const [customApiModel, setCustomApiModel] = useState<string>('');
  const [aiApiKey, setAiApiKey] = useState<string>('');

  // AI execution state
  const [isSendingAi, setIsSendingAi] = useState(false);
  const [rawAiResponse, setRawAiResponse] = useState<string>('');
  const [deanonymizedResult, setDeanonymizedResult] = useState<DeanonymizationResult | null>(null);
  const [aiLatencyMs, setAiLatencyMs] = useState<number | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<Record<string, unknown> | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [copiedDebug, setCopiedDebug] = useState(false);
  const [securityNotification, setSecurityNotification] = useState<string | null>(null);

  // Always-visible Token usage stats
  const [tokenStats, setTokenStats] = useState<TokenUsageStats>(() => {
    const meta = getModelMeta('mock-ai-assistant');
    return {
      provider: 'mock',
      model: 'Simulatore Locale (Test Gratuito)',
      lastPromptTokens: 0,
      lastCompletionTokens: 0,
      lastTotalTokens: 0,
      sessionPromptTokens: 0,
      sessionCompletionTokens: 0,
      sessionTotalTokens: 0,
      contextWindow: meta.contextWindow,
      tokensRemaining: meta.contextWindow,
      requestCount: 0,
      lastRequestTimestamp: null,
      estimatedCostUsd: 0,
    };
  });

  // Track if text is currently being edited to avoid loop feedback
  const isInternalUpdate = useRef(false);

  // Load saved settings from localStorage on initial mount
  useEffect(() => {
    try {
      const savedProvider = localStorage.getItem('anonymizer_ai_provider');
      const savedModel = localStorage.getItem('anonymizer_ai_model');
      const savedCustomApiModel = localStorage.getItem('anonymizer_custom_api_model');
      const savedKey = localStorage.getItem('anonymizer_ai_key');
      const savedCustomRules = localStorage.getItem('anonymizer_custom_rules');

      const targetProvider: 'openai' | 'anthropic' | 'mock' =
        savedProvider && ['openai', 'anthropic', 'mock'].includes(savedProvider)
          ? (savedProvider as 'openai' | 'anthropic' | 'mock')
          : 'mock';
      setAiProvider(targetProvider);

      const availableForProvider = SUPPORTED_MODELS.filter((m) => m.provider === targetProvider);
      const isModelValid = availableForProvider.some((m) => m.id === savedModel);
      if (isModelValid && savedModel) {
        setAiModel(savedModel);
      } else if (availableForProvider.length > 0) {
        setAiModel(availableForProvider[0].id);
      }

      if (savedCustomApiModel) setCustomApiModel(savedCustomApiModel);
      if (savedKey) setAiApiKey(savedKey);
      if (savedCustomRules) {
        setCustomRules(JSON.parse(savedCustomRules));
      }
    } catch (e) {
      console.warn('Could not read from localStorage', e);
    }
  }, []);

  // Save settings when changed
  useEffect(() => {
    try {
      localStorage.setItem('anonymizer_ai_provider', aiProvider);
      localStorage.setItem('anonymizer_ai_model', aiModel);
      if (customApiModel) localStorage.setItem('anonymizer_custom_api_model', customApiModel);
      else localStorage.removeItem('anonymizer_custom_api_model');
      if (aiApiKey) localStorage.setItem('anonymizer_ai_key', aiApiKey);
      localStorage.setItem('anonymizer_custom_rules', JSON.stringify(customRules));
    } catch (e) {
      console.warn('Could not write to localStorage', e);
    }
  }, [aiProvider, aiModel, customApiModel, aiApiKey, customRules]);

  // Keep tokenStats updated with current model metadata
  useEffect(() => {
    const meta = getModelMeta(aiModel);
    setTokenStats((prev) => {
      const remaining = Math.max(0, meta.contextWindow - prev.sessionTotalTokens);
      return {
        ...prev,
        provider: meta.provider,
        model: meta.name,
        contextWindow: meta.contextWindow,
        tokensRemaining: remaining,
      };
    });
  }, [aiModel, aiProvider]);

  // Core anonymization handler
  const handlePerformAnonymization = useCallback(
    (textToProcess: string, rulesToUse: CustomRule[] = customRules) => {
      if (!textToProcess.trim()) {
        setAnonymizedText('');
        setMappings([]);
        return;
      }

      const result = AnonymizerEngine.anonymize(textToProcess, rulesToUse, mappings);
      isInternalUpdate.current = true;
      setAnonymizedText(result.anonymizedText);
      setMappings(result.mappings);
      setTimeout(() => {
        isInternalUpdate.current = false;
      }, 50);
    },
    [customRules, mappings]
  );

  // When original text changes in left box
  const handleOriginalChange = (newText: string) => {
    setOriginalText(newText);
    setErrorMessage(null);
    handlePerformAnonymization(newText);
  };

  // When anonymized text is edited directly in right box (Reverse Deanonymization)
  const handleAnonymizedChange = (newAnonymized: string) => {
    setAnonymizedText(newAnonymized);
    if (isInternalUpdate.current) return;

    // Perform de-anonymization back to original
    const restored = AnonymizerEngine.deanonymize(newAnonymized, mappings);
    isInternalUpdate.current = true;
    setOriginalText(restored.restoredText);
    setTimeout(() => {
      isInternalUpdate.current = false;
    }, 50);
  };

  // Explicit reverse restitution button
  const handleRestoreOriginalFromAnonymized = () => {
    if (!anonymizedText) return;
    const restored = AnonymizerEngine.deanonymize(anonymizedText, mappings);
    setOriginalText(restored.restoredText);
    setSecurityNotification(`Riconversione inversa eseguita: ${restored.restorationsCount} etichette ripristinate con successo.`);
    setTimeout(() => setSecurityNotification(null), 3000);
  };

  // Toggle individual mapping
  const handleToggleMapping = (id: string) => {
    const updated = mappings.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m));
    setMappings(updated);

    // Recompute anonymized text with updated enabled mappings
    const result = AnonymizerEngine.anonymize(originalText, customRules, updated);
    setAnonymizedText(result.anonymizedText);
  };

  // Add custom rule
  const handleAddCustomRule = (newRule: Omit<CustomRule, 'id'>) => {
    const rule: CustomRule = {
      ...newRule,
      id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    const updatedRules = [...customRules, rule];
    setCustomRules(updatedRules);
    handlePerformAnonymization(originalText, updatedRules);
  };

  // Remove custom rule
  const handleRemoveCustomRule = (id: string) => {
    const updatedRules = customRules.filter((r) => r.id !== id);
    setCustomRules(updatedRules);
    handlePerformAnonymization(originalText, updatedRules);
  };

  // Sample prompt selection
  const handleSelectSample = (sample: SamplePrompt) => {
    setOriginalText(sample.prompt);

    // Merge custom rules if any
    let updatedRules = [...customRules];
    if (sample.customRules) {
      for (const cr of sample.customRules) {
        if (!updatedRules.some((r) => r.text.toLowerCase() === cr.text.toLowerCase())) {
          updatedRules.push({
            id: `sample_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            text: cr.text,
            isRegex: false,
            caseSensitive: false,
            categoryLabel: cr.categoryLabel,
          });
        }
      }
      setCustomRules(updatedRules);
    }

    handlePerformAnonymization(sample.prompt, updatedRules);
  };

  // Reset Session Stats
  const handleResetSessionStats = () => {
    const meta = getModelMeta(aiModel);
    setTokenStats((prev) => ({
      ...prev,
      lastPromptTokens: 0,
      lastCompletionTokens: 0,
      lastTotalTokens: 0,
      sessionPromptTokens: 0,
      sessionCompletionTokens: 0,
      sessionTotalTokens: 0,
      tokensRemaining: meta.contextWindow,
      requestCount: 0,
      lastRequestTimestamp: null,
      estimatedCostUsd: 0,
    }));
  };

  // SEND TO AI WITH AUTOMATIC RESTITUTION
  const handleSendToAi = async () => {
    setErrorMessage(null);
    setSecurityNotification(null);

    if (!anonymizedText || anonymizedText.trim() === '') {
      setErrorMessage('Nessun prompt anonimizzato da inviare.');
      return;
    }

    if (aiProvider !== 'mock' && (!aiApiKey || !aiApiKey.trim())) {
      setIsAiConfigOpen(true);
      setErrorMessage(`Inserisci una chiave API valida per ${aiProvider === 'openai' ? 'OpenAI' : 'Anthropic Claude'}.`);
      return;
    }

    // --- ZERO-LEAK CLIENT PRE-FLIGHT VERIFICATION ---
    // Assert that no original sensitive value is present in the payload to be sent!
    const audit = AnonymizerEngine.auditForDataLeak(anonymizedText, mappings);
    if (!audit.safe) {
      setErrorMessage(
        `BLOCCO DI SICUREZZA ZERO-LEAK: Rilevati dati originali in chiaro nel testo anonimizzato (${audit.leakedValues.join(
          ', '
        )}). L'invio all'AI è stato bloccato.`
      );
      return;
    }

    setIsSendingAi(true);
    setErrorMessage(null);
    setDebugInfo(null);
    setShowDebug(false);
    const startTime = Date.now();

    try {
      // Collect forbidden secrets for server-side double assertion
      const forbiddenSecrets = mappings
        .filter((m) => m.enabled)
        .map((m) => m.originalValue);

      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: anonymizedText,
          systemPrompt:
            'Sei un assistente AI professionale e accurato. Rispondi in italiano mantenendo inalterati i codici e le etichette segnaposto (come [CODICE_FISCALE_X], [IBAN_X], [EMAIL_X], ecc.) esattamente nella forma in cui ti sono stati forniti.',
          provider: aiProvider,
          model: aiModel,
          customApiModel: customApiModel || undefined,
          apiKey: aiApiKey,
          forbiddenSecrets,
        }),
      });

      const data = await res.json();
      const latency = Date.now() - startTime;
      setAiLatencyMs(latency);

      if (!res.ok) {
        setErrorMessage(data.error || `Errore richiesta AI (${res.status})`);
        if (data.debug) {
          setDebugInfo(data.debug);
        } else {
          setDebugInfo({
            httpStatus: res.status,
            statusText: res.statusText,
            rawError: data,
          });
        }
        return;
      }

      const receivedContent = data.content || '';
      setRawAiResponse(receivedContent);

      // --- AUTOMATIC RESTITUTION (BIDIRECTIONAL DE-ANONYMIZATION) ---
      const restored = AnonymizerEngine.deanonymize(receivedContent, mappings);
      setDeanonymizedResult(restored);

      // Update Token Usage Statistics
      const meta = getModelMeta(aiModel);
      const promptToks = data.usage?.promptTokens || estimateTokenCount(anonymizedText);
      const completionToks = data.usage?.completionTokens || estimateTokenCount(receivedContent);
      const totalToks = data.usage?.totalTokens || promptToks + completionToks;

      const callCost =
        (promptToks / 1000) * meta.costPer1kPromptUsd +
        (completionToks / 1000) * meta.costPer1kCompletionUsd;

      setTokenStats((prev) => {
        const newSessionPrompt = prev.sessionPromptTokens + promptToks;
        const newSessionComp = prev.sessionCompletionTokens + completionToks;
        const newSessionTotal = prev.sessionTotalTokens + totalToks;
        const remaining = Math.max(0, meta.contextWindow - newSessionTotal);

        return {
          ...prev,
          lastPromptTokens: promptToks,
          lastCompletionTokens: completionToks,
          lastTotalTokens: totalToks,
          sessionPromptTokens: newSessionPrompt,
          sessionCompletionTokens: newSessionComp,
          sessionTotalTokens: newSessionTotal,
          contextWindow: meta.contextWindow,
          tokensRemaining: remaining,
          requestCount: prev.requestCount + 1,
          lastRequestTimestamp: Date.now(),
          estimatedCostUsd: prev.estimatedCostUsd + callCost,
        };
      });

      setSecurityNotification(
        `Risposta AI ricevuta in ${latency}ms! ${restored.restorationsCount} etichette ripristinate automaticamente.`
      );
    } catch (err: unknown) {
      console.error('Send to AI error:', err);
      const msg = err instanceof Error ? err.message : 'Errore sconosciuto durante la chiamata AI.';
      setErrorMessage(msg);
      setDebugInfo({ exception: msg });
    } finally {
      setIsSendingAi(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      {/* Top Navigation & Controls */}
      <Header
        onSelectSample={handleSelectSample}
        onOpenCustomRules={() => setIsCustomModalOpen(true)}
        onOpenAiConfig={() => setIsAiConfigOpen(true)}
        onOpenPrivacyInfo={() => setIsPrivacyModalOpen(true)}
        hasApiKey={Boolean(aiApiKey || aiProvider === 'mock')}
        activeModelName={getModelMeta(aiModel).name}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 space-y-5">
        {/* ALWAYS VISIBLE STATS BOX (Required by user) */}
        <StatsPanel
          stats={tokenStats}
          onResetSessionStats={handleResetSessionStats}
          onConfigureAi={() => setIsAiConfigOpen(true)}
          isSending={isSendingAi}
        />

        {/* Notifications & Security Alerts */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-200 text-xs shadow-xs space-y-3 animate-in fade-in duration-200">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold">Attenzione: </strong>
                  <span>{errorMessage}</span>
                </div>
              </div>

              {debugInfo && (
                <button
                  type="button"
                  onClick={() => setShowDebug(!showDebug)}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-red-100 hover:bg-red-200 dark:bg-red-900/60 dark:hover:bg-red-900 text-red-900 dark:text-red-100 transition-colors shrink-0"
                >
                  <Bug className="w-3.5 h-3.5" />
                  <span>{showDebug ? 'Nascondi Debug' : 'Mostra Debug'}</span>
                  {showDebug ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>

            {/* Collapsible Debug Panel */}
            {debugInfo && showDebug && (
              <div className="bg-red-100/70 dark:bg-red-950/80 rounded-xl p-3 border border-red-200/80 dark:border-red-800/80 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[11px] uppercase tracking-wider text-red-900 dark:text-red-300 flex items-center gap-1.5">
                    <Bug className="w-3.5 h-3.5" />
                    Dettagli Tecnici & Risposta API Provider
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2));
                      setCopiedDebug(true);
                      setTimeout(() => setCopiedDebug(false), 2000);
                    }}
                    className="flex items-center gap-1 text-[11px] font-medium text-red-700 dark:text-red-300 hover:underline"
                  >
                    {copiedDebug ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedDebug ? 'Copiato!' : 'Copia Dati Debug'}</span>
                  </button>
                </div>

                {typeof debugInfo.hint === 'string' && (
                  <div className="p-2.5 rounded-lg bg-white/70 dark:bg-slate-900/70 border border-red-200 dark:border-red-900/50 text-[11px] leading-relaxed text-red-950 dark:text-red-200">
                    💡 <strong>Suggerimento:</strong> {debugInfo.hint}
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-mono">
                  {Boolean(debugInfo.httpStatus) && (
                    <div className="p-1.5 bg-white/60 dark:bg-slate-900/60 rounded border border-red-200/50 dark:border-red-900/40">
                      <span className="text-slate-500 block text-[9px] uppercase">HTTP Status</span>
                      <span className="font-bold">
                        {String(debugInfo.httpStatus)} {String(debugInfo.statusText || '')}
                      </span>
                    </div>
                  )}
                  {Boolean(debugInfo.apiModelAttempted) && (
                    <div className="p-1.5 bg-white/60 dark:bg-slate-900/60 rounded border border-red-200/50 dark:border-red-900/40">
                      <span className="text-slate-500 block text-[9px] uppercase">Modello Tentato</span>
                      <span className="font-bold">{String(debugInfo.apiModelAttempted)}</span>
                    </div>
                  )}
                  {Boolean(debugInfo.provider) && (
                    <div className="p-1.5 bg-white/60 dark:bg-slate-900/60 rounded border border-red-200/50 dark:border-red-900/40">
                      <span className="text-slate-500 block text-[9px] uppercase">Provider</span>
                      <span className="font-bold uppercase">{String(debugInfo.provider)}</span>
                    </div>
                  )}
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-mono block mb-1">
                    Payload Risposta Grezza dal Server:
                  </span>
                  <pre className="p-2.5 rounded-lg bg-slate-900 text-slate-100 font-mono text-[10px] overflow-x-auto max-h-48 leading-snug">
                    {JSON.stringify(debugInfo.rawError || debugInfo, null, 2)}
                  </pre>
                </div>

                <div className="pt-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsAiConfigOpen(true)}
                    className="flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                    <span>Apri Configurazione Modello</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {securityNotification && (
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center gap-2.5 text-xs shadow-xs animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{securityNotification}</span>
          </div>
        )}

        {/* SIDE-BY-SIDE DUAL TEXTBOXES (Required by user) */}
        <DualEditor
          originalText={originalText}
          onChangeOriginal={handleOriginalChange}
          anonymizedText={anonymizedText}
          onChangeAnonymized={handleAnonymizedChange}
          mappings={mappings}
          onAnonymizeNow={() => handlePerformAnonymization(originalText)}
          onSendToAi={handleSendToAi}
          isSendingAi={isSendingAi}
          onRestoreOriginal={handleRestoreOriginalFromAnonymized}
        />

        {/* AI RESPONSE SECTION WITH AUTOMATIC RESTITUTION */}
        {rawAiResponse && (
          <AiResponseViewer
            rawResponse={rawAiResponse}
            deanonymizedResult={deanonymizedResult}
            model={getModelMeta(aiModel).name}
            onClear={() => {
              setRawAiResponse('');
              setDeanonymizedResult(null);
            }}
            latencyMs={aiLatencyMs}
          />
        )}

        {/* BIDIRECTIONAL MAPPINGS REGISTRY & INSPECTOR */}
        <EntityInspector
          mappings={mappings}
          onToggleMapping={handleToggleMapping}
          onClearMappings={() => setMappings([])}
        />
      </main>

      {/* Modals */}
      <CustomEntitiesModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        customRules={customRules}
        onAddRule={handleAddCustomRule}
        onRemoveRule={handleRemoveCustomRule}
      />

      <AiConfigModal
        isOpen={isAiConfigOpen}
        onClose={() => setIsAiConfigOpen(false)}
        provider={aiProvider}
        onChangeProvider={setAiProvider}
        model={aiModel}
        onChangeModel={setAiModel}
        apiKey={aiApiKey}
        onChangeApiKey={setAiApiKey}
        customApiModel={customApiModel}
        onChangeCustomApiModel={setCustomApiModel}
      />

      <PrivacyModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-4 text-center text-xs text-slate-500 dark:text-slate-400 bg-white/40 dark:bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>AI Anonymizer &bull; Riservatezza Prompt & Standard Italiani</span>
          <span className="flex items-center gap-1 text-[11px]">
            Nessun dato grezzo esce all'esterno &bull; 100% Elaborazione Locale
          </span>
        </div>
      </footer>
    </div>
  );
}
