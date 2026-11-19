'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Bot,
  Copy,
  Check,
  ArrowLeftRight,
  ShieldCheck,
  Clock,
  Maximize2,
  Minimize2,
  FileText,
  FileCode,
  X,
} from 'lucide-react';
import { DeanonymizationResult } from '@/lib/anonymizer/types';
import { renderMarkdownToHtml } from '@/lib/markdown';

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
  const [renderMarkdown, setRenderMarkdown] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [copied, setCopied] = useState(false);

  // Close fullscreen on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  if (!rawResponse) return null;

  const restoredText = deanonymizedResult ? deanonymizedResult.restoredText : rawResponse;
  const restorationsCount = deanonymizedResult ? deanonymizedResult.restorationsCount : 0;
  const currentTextToDisplay = activeTab === 'restored' ? restoredText : rawResponse;

  // Render markdown with self-contained, zero-dependency renderer
  const parsedHtml = useMemo(() => {
    if (!currentTextToDisplay) return '';
    try {
      return renderMarkdownToHtml(currentTextToDisplay);
    } catch (err) {
      console.error('Markdown parse error:', err);
      return '';
    }
  }, [currentTextToDisplay]);

  const handleCopy = () => {
    navigator.clipboard.writeText(currentTextToDisplay);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const contentComponent = (
    <div
      className={`bg-white dark:bg-slate-900 flex flex-col ${
        isFullscreen
          ? 'fixed inset-0 z-50 p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md justify-center items-center'
          : 'border-2 border-indigo-200 dark:border-indigo-900/60 rounded-2xl shadow-md overflow-hidden transition-all'
      }`}
    >
      <div
        className={`w-full flex flex-col bg-white dark:bg-slate-900 ${
          isFullscreen
            ? 'max-w-6xl h-[94vh] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden'
            : ''
        }`}
      >
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-gradient-to-r from-indigo-50/80 to-slate-50 dark:from-indigo-950/40 dark:to-slate-900 border-b border-indigo-100 dark:border-indigo-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Risposta Ricevuta dall'AI
                </h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 font-mono">
                  {model}
                </span>
                {isFullscreen && (
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300">
                    Fullscreen
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
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

          {/* Controls: Tabs, Markdown Toggle, Fullscreen, Copy */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Tab Switcher: Restored vs Raw */}
            <div className="flex rounded-lg bg-slate-200/70 dark:bg-slate-800 p-0.5 text-xs font-medium">
              <button
                type="button"
                onClick={() => setActiveTab('restored')}
                className={`px-3 py-1 rounded-md transition-all ${
                  activeTab === 'restored'
                    ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Ripristinata
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('raw')}
                className={`px-3 py-1 rounded-md transition-all ${
                  activeTab === 'raw'
                    ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Grezza (Tag)
              </button>
            </div>

            {/* Markdown Toggle */}
            <button
              type="button"
              onClick={() => setRenderMarkdown(!renderMarkdown)}
              title={renderMarkdown ? 'Mostra testo non formattato' : 'Interpreta e formatta come Markdown'}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                renderMarkdown
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              {renderMarkdown ? (
                <>
                  <FileText className="w-3.5 h-3.5" />
                  <span>Markdown</span>
                </>
              ) : (
                <>
                  <FileCode className="w-3.5 h-3.5" />
                  <span>Testo Grezzo</span>
                </>
              )}
            </button>

            {/* Copy Button */}
            <button
              type="button"
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
                  <span>Copia</span>
                </>
              )}
            </button>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Riduci finestra (Esc)' : 'Apri a schermo intero'}
              className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700"
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>

            {isFullscreen && (
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                title="Chiudi schermo intero"
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className={`p-4 bg-white dark:bg-slate-900 flex-1 overflow-hidden flex flex-col`}>
          <div
            className={`w-full overflow-y-auto font-sans leading-relaxed text-slate-800 dark:text-slate-200 p-4 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800 select-text ${
              isFullscreen ? 'flex-1 min-h-[300px]' : 'min-h-[160px] max-h-[500px]'
            }`}
          >
            {renderMarkdown ? (
              <div
                className="markdown-body text-slate-800 dark:text-slate-200"
                dangerouslySetInnerHTML={{ __html: parsedHtml }}
              />
            ) : (
              <div className="whitespace-pre-wrap text-sm font-mono">
                {currentTextToDisplay}
              </div>
            )}
          </div>
        </div>

        {/* Footer Info */}
        <div className="px-4 py-2.5 bg-slate-50/80 dark:bg-slate-800/40 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>
              {activeTab === 'restored'
                ? 'I segnaposto anonimi sono stati riconvertiti nei dati originali localmente sul dispositivo.'
                : 'Visualizzazione grezza con etichette placeholder trasmesse al provider AI.'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {isFullscreen && (
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Esci da Fullscreen
              </button>
            )}
            <button
              type="button"
              onClick={onClear}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              Chiudi
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return contentComponent;
}
