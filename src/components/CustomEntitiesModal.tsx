'use client';

import React, { useState } from 'react';
import { X, Plus, Trash2, Sliders, Shield, Check, AlertCircle } from 'lucide-react';
import { CustomRule } from '@/lib/anonymizer/types';

interface CustomEntitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  customRules: CustomRule[];
  onAddRule: (rule: Omit<CustomRule, 'id'>) => void;
  onRemoveRule: (id: string) => void;
}

export function CustomEntitiesModal({
  isOpen,
  onClose,
  customRules,
  onAddRule,
  onRemoveRule,
}: CustomEntitiesModalProps) {
  const [inputText, setInputText] = useState('');
  const [categoryLabel, setCategoryLabel] = useState('');
  const [isRegex, setIsRegex] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) {
      setError('Inserisci il testo o l\'espressione da anonimizzare.');
      return;
    }

    if (isRegex) {
      try {
        new RegExp(inputText.trim());
      } catch (err: unknown) {
        setError(`Espressione regolare non valida: ${err instanceof Error ? err.message : ''}`);
        return;
      }
    }

    onAddRule({
      text: inputText.trim(),
      categoryLabel: categoryLabel.trim() || 'Personalizzato',
      isRegex,
      caseSensitive,
    });

    setInputText('');
    setCategoryLabel('');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Stringhe Personalizzate da Anonimizzare
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Aggiungi nomi, parole chiave, aziende o regex ad hoc
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          <form onSubmit={handleAdd} className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60">
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Aggiungi nuova regola:
            </div>

            <div>
              <input
                type="text"
                placeholder="Testo da anonimizzare (es. Acme SpA, Mario Rossi, Password123)"
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  setError(null);
                }}
                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Etichetta / Categoria (opzionale, es. Nome Cliente)"
                value={categoryLabel}
                onChange={(e) => setCategoryLabel(e.target.value)}
                className="flex-1 px-3.5 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Aggiungi</span>
              </button>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400 pt-1">
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={caseSensitive}
                  onChange={(e) => setCaseSensitive(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Maiuscole/Minuscole esatte</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isRegex}
                  onChange={(e) => setIsRegex(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Regex avanzata</span>
              </label>
            </div>

            {error && (
              <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{error}</span>
              </div>
            )}
          </form>

          {/* List of defined custom rules */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Regole personalizzate attive ({customRules.length})
              </span>
            </div>

            {customRules.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 text-xs">
                Nessuna stringa personalizzata aggiunta. I filtri standard italiani rimangono sempre attivi.
              </div>
            ) : (
              <div className="space-y-2">
                {customRules.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {rule.text}
                        </span>
                        {rule.isRegex && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 font-mono">
                            regex
                          </span>
                        )}
                        {rule.caseSensitive && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono">
                            match-case
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Categoria: {rule.categoryLabel || 'Personalizzato'}
                      </div>
                    </div>

                    <button
                      onClick={() => onRemoveRule(rule.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      title="Rimuovi regola"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity"
          >
            Fatto
          </button>
        </div>
      </div>
    </div>
  );
}

