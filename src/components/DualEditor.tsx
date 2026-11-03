'use client';

import React, { useState } from 'react';
import {
  Copy,
  Check,
  Trash2,
  Send,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  ArrowLeftRight,
  RotateCcw,
  Sparkles,
  Eye,
  EyeOff,
} from 'lucide-react';
import { EntityMapping } from '@/lib/anonymizer/types';
import { estimateTokenCount } from '@/lib/ai/providers';

interface DualEditorProps {
  originalText: string;
  onChangeOriginal: (val: string) => void;
  anonymizedText: string;
  onChangeAnonymized: (val: string) => void;
  mappings: EntityMapping[];
  onAnonymizeNow: () => void;
  onSendToAi: () => void;
  isSendingAi: boolean;
  onRestoreOriginal: () => void;
}

export function DualEditor({
  originalText,
  onChangeOriginal,
  anonymizedText,
  onChangeAnonymized,
  mappings,
  onAnonymizeNow,
  onSendToAi,
  isSendingAi,
  onRestoreOriginal,
}: DualEditorProps) {
  const [copiedOriginal, setCopiedOriginal] = useState(false);
  const [copiedAnonymized, setCopiedAnonymized] = useState(false);
  const [showOriginalSecretValues, setShowOriginalSecretValues] = useState(true);

  const handleCopyOriginal = () => {
    if (!originalText) return;
    navigator.clipboard.writeText(originalText);
    setCopiedOriginal(true);
    setTimeout(() => setCopiedOriginal(false), 2000);
  };

  const handleCopyAnonymized = () => {
    if (!anonymizedText) return;
    navigator.clipboard.writeText(anonymizedText);
    setCopiedAnonymized(true);
    setTimeout(() => setCopiedAnonymized(false), 2000);
  };

  const originalTokens = estimateTokenCount(originalText);
  const anonymizedTokens = estimateTokenCount(anonymizedText);
  const activeMappingsCount = mappings.filter((m) => m.enabled).length;

  return (
    <div className="space-y-3">
      {/* Action Toolbar above editors */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Editor Bidirezionale Affiancato
          </span>
          {activeMappingsCount > 0 && (
            <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              {activeMappingsCount} entità identificate e protette
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowOriginalSecretValues(!showOriginalSecretValues)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
            title="Mostra/Nascondi visivamente i dati sensibili per privacy a schermo"
          >
            {showOriginalSecretValues ? (
              <>
                <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                <span>Maschera Dati a Schermo</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-emerald-500" />
                <span>Mostra Dati Originali</span>
              </>
            )}
          </button>

          <button
            onClick={onRestoreOriginal}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-lg transition-colors border border-indigo-200 dark:border-indigo-800"
            title="Esegui de-anonimizzazione inversa (ripristina testo originale da quello anonimizzato)"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Riconverti Inverso (De-anonimizza)</span>
          </button>
        </div>
      </div>

      {/* The 2 Side-by-Side Boxes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* LEFT BOX: Original Prompt */}
        <div className="flex flex-col bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 focus-within:border-indigo-500 dark:focus-within:border-indigo-500 shadow-sm transition-all overflow-hidden">
          {/* Header of Left Box */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Box Sinistra: Prompt da Anonimizzare (Originale)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCopyOriginal}
                disabled={!originalText}
                className="p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors"
                title="Copia testo originale"
              >
                {copiedOriginal ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                onClick={() => {
                  onChangeOriginal('');
                  onChangeAnonymized('');
                }}
                disabled={!originalText && !anonymizedText}
                className="p-1.5 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors"
                title="Svuota box"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Textarea Left */}
          <div className="relative flex-1 min-h-[340px]">
            <textarea
              value={originalText}
              onChange={(e) => onChangeOriginal(e.target.value)}
              placeholder="Incolla o digita qui il prompt da anonimizzare...&#10;&#10;Esempio: 'Verifica la fattura per Mario Rossi con CF: RSSMRA85M01H501Z, invia copia a mario.rossi@email.it e accredita su IBAN IT60X0542811101000000123456'."
              className={`w-full h-full p-4 resize-none bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none font-mono text-sm leading-relaxed ${
                !showOriginalSecretValues ? 'blur-sm hover:blur-none transition-all duration-300' : ''
              }`}
            />
          </div>

          {/* Footer of Left Box */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/80 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-3">
              <span>{originalText.length} caratteri</span>
              <span>{originalText.trim() ? originalText.trim().split(/\s+/).length : 0} parole</span>
              <span>~{originalTokens} token</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-amber-700 dark:text-amber-400 font-medium">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Dati sensibili in chiaro (Locali)</span>
            </div>
          </div>
        </div>

        {/* RIGHT BOX: Anonymized Output */}
        <div className="flex flex-col bg-white dark:bg-slate-900 rounded-2xl border-2 border-emerald-300 dark:border-emerald-800 focus-within:border-emerald-500 dark:focus-within:border-emerald-400 shadow-sm transition-all overflow-hidden">
          {/* Header of Right Box */}
          <div className="flex items-center justify-between px-4 py-3 bg-emerald-50/80 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-800/60">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider flex items-center gap-1">
                Box Destra: Prompt Anonimizzato (Sanificato)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCopyAnonymized}
                disabled={!anonymizedText}
                className="flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors text-xs font-medium border border-slate-200 dark:border-slate-700 shadow-xs"
                title="Copia testo anonimizzato"
              >
                {copiedAnonymized ? (
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
            </div>
          </div>

          {/* Textarea Right */}
          <div className="relative flex-1 min-h-[340px]">
            <textarea
              value={anonymizedText}
              onChange={(e) => onChangeAnonymized(e.target.value)}
              placeholder="Qui comparirà automaticamente il testo anonimizzato con le etichette dei dati sostituiti...&#10;&#10;Esempio: 'Verifica la fattura per [CUSTOM_1] con CF: [CODICE_FISCALE_1], invia copia a [EMAIL_1] e accredita su IBAN [IBAN_1].'"
              className="w-full h-full p-4 resize-none bg-transparent text-emerald-950 dark:text-emerald-100 placeholder:text-slate-400 focus:outline-none font-mono text-sm leading-relaxed"
            />
          </div>

          {/* Footer of Right Box */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-emerald-50/60 dark:bg-emerald-950/20 border-t border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-800 dark:text-emerald-300">
            <div className="flex items-center gap-3">
              <span>{anonymizedText.length} caratteri</span>
              <span>~{anonymizedTokens} token</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Pronto per invio sicuro all'AI</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Action Call-to-Actions (Buttons bar) */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <button
            onClick={onAnonymizeNow}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90 transition-opacity shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
            <span>Rianalizza & Anonimizza</span>
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onSendToAi}
            disabled={!anonymizedText || isSendingAi}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-600/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all transform active:scale-98"
          >
            {isSendingAi ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Invio sicuro all'AI in corso...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Invia Anonimizzato ad AI & Ripristina Risposta</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

