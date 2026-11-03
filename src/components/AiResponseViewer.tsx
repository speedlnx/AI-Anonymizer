'use client';

import React, { useState } from 'react';
import {
  Bot,
  Copy,
  Check,
  ArrowLeftRight,
  ShieldCheck,
  Sparkles,
  Layers,
  Clock,
  Zap,
} from 'lucide-react';
import { DeanonymizationResult } from '@/lib/anonymizer/types';

interface AiResponseViewerProps {
  rawResponse: string;
  deanonymizedResult: DeanonymizationResult | null;
  model: string;
  onClear: () => void;
  latencyMs?: number;
}

export function AiResponseViewer({
  rawResponse,
  deanonymizedResult,
  model,
  onClear,
  latencyMs,
}: AiResponseViewerProps) {
  const [activeTab, setActiveTab] = useState<'restored' | 'raw'>('restored');
  const [copied, setCopied] = useState(false);

  if (!rawResponse) return null;

  const restoredText = deanonymizedResult ? deanonymizedResult.restoredText : rawResponse;
  const restorationsCount = deanonymizedResult ? deanonymizedResult.restorationsCount : 0;

  const currentTextToDisplay = activeTab === 'restored' ? restoredText : rawResponse;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentTextToDisplay);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border-2 border-indigo-200 dark:border-indigo-900/60 rounded-2xl shadow-md overflow-hidden transition-all">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-gradient-to-r from-indigo-50/80 to-slate-50 dark:from-indigo-950/40 dark:to-slate-900 border-b border-indigo-100 dark:border-indigo-900/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Risposta Ricevuta dall'AI
              </h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200">
                {model}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
              {latencyMs && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {latencyMs}ms
                </span>
              )}
              {restorationsCount > 0 && (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <ArrowLeftRight className="w-3 h-3" />
                  {restorationsCount} etichette ripristinate con i dati originali
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tab Switcher & Actions */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg bg-slate-200/70 dark:bg-slate-800 p-0.5 text-xs font-medium">
            <button
              onClick={() => setActiveTab('restored')}
              className={`px-3 py-1 rounded-md transition-all ${
                activeTab === 'restored'
                  ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Ripristinata (Dati Reali)
            </button>
            <button
              onClick={() => setActiveTab('raw')}
              className={`px-3 py-1 rounded-md transition-all ${
                activeTab === 'raw'
                  ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Grezza (Anonimizzata)
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-3 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition-colors text-xs font-medium border border-slate-200 dark:border-slate-700 shadow-xs"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Copiato</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copia Risposta</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4 bg-white dark:bg-slate-900">
        <div className="w-full min-h-[140px] max-h-[460px] overflow-y-auto whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-800 dark:text-slate-200 p-3 bg-slate-50/60 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800 select-text">
          {currentTextToDisplay}
        </div>
      </div>

      {/* Footer Info */}
      <div className="px-4 py-2 bg-slate-50/80 dark:bg-slate-800/40 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>
            {activeTab === 'restored'
              ? 'Le etichette sono state riconvertite localmente nel testo originale sul tuo dispositivo.'
              : 'Questo è il testo esattamente come risposto dall\'AI con i tag placeholder.'}
          </span>
        </div>
        <button
          onClick={onClear}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          Chiudi
        </button>
      </div>
    </div>
  );
}

