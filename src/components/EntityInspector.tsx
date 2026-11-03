'use client';

import React, { useState } from 'react';
import {
  ListFilter,
  Eye,
  EyeOff,
  Copy,
  Check,
  Tag,
  ToggleLeft,
  ToggleRight,
  Download,
  Info,
} from 'lucide-react';
import { EntityMapping, EntityType } from '@/lib/anonymizer/types';

interface EntityInspectorProps {
  mappings: EntityMapping[];
  onToggleMapping: (id: string) => void;
  onClearMappings: () => void;
}

const TYPE_BADGE_COLORS: Record<EntityType, { bg: string; text: string; border: string }> = {
  CODICE_FISCALE: { bg: 'bg-emerald-50 dark:bg-emerald-950/60', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800' },
  PARTITA_IVA: { bg: 'bg-teal-50 dark:bg-teal-950/60', text: 'text-teal-700 dark:text-teal-300', border: 'border-teal-200 dark:border-teal-800' },
  IBAN: { bg: 'bg-blue-50 dark:bg-blue-950/60', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800' },
  BANK_CODE: { bg: 'bg-sky-50 dark:bg-sky-950/60', text: 'text-sky-700 dark:text-sky-300', border: 'border-sky-200 dark:border-sky-800' },
  CREDIT_CARD: { bg: 'bg-purple-50 dark:bg-purple-950/60', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800' },
  EMAIL: { bg: 'bg-amber-50 dark:bg-amber-950/60', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800' },
  PHONE: { bg: 'bg-orange-50 dark:bg-orange-950/60', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-800' },
  DOCUMENT_ID: { bg: 'bg-rose-50 dark:bg-rose-950/60', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-800' },
  API_KEY: { bg: 'bg-red-50 dark:bg-red-950/60', text: 'text-red-700 dark:text-red-300', border: 'border-red-200 dark:border-red-800' },
  IP_ADDRESS: { bg: 'bg-cyan-50 dark:bg-cyan-950/60', text: 'text-cyan-700 dark:text-cyan-300', border: 'border-cyan-200 dark:border-cyan-800' },
  MAC_ADDRESS: { bg: 'bg-indigo-50 dark:bg-indigo-950/60', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-800' },
  UUID: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-300 dark:border-slate-700' },
  URL: { bg: 'bg-lime-50 dark:bg-lime-950/60', text: 'text-lime-700 dark:text-lime-300', border: 'border-lime-200 dark:border-lime-800' },
  CUSTOM: { bg: 'bg-fuchsia-50 dark:bg-fuchsia-950/60', text: 'text-fuchsia-700 dark:text-fuchsia-300', border: 'border-fuchsia-200 dark:border-fuchsia-800' },
};

export function EntityInspector({
  mappings,
  onToggleMapping,
  onClearMappings,
}: EntityInspectorProps) {
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportMappingJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(mappings, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `anonymizer_dictionary_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  if (mappings.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center shadow-xs">
        <Tag className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Nessuna etichetta di anonimizzazione attiva
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
          Incolla un prompt o seleziona un esempio per analizzare ed estrarre automaticamente Codici Fiscali, IBAN, Carte di Credito, Email, Telefoni e chiavi API.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
      {/* Table Header / Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <ListFilter className="w-4 h-4 text-indigo-500" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Registro Etichette & Corrispondenze Bidirezionali ({mappings.length})
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportMappingJson}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
            title="Esporta dizionario di conversione in JSON"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Esporta JSON</span>
          </button>
        </div>
      </div>

      {/* Table / List */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
              <th className="pb-2 pl-2">Stato</th>
              <th className="pb-2">Etichetta Placeholder</th>
              <th className="pb-2">Tipologia</th>
              <th className="pb-2">Valore Originale Protetto</th>
              <th className="pb-2 text-center">Occorrenze</th>
              <th className="pb-2 pr-2 text-right">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {mappings.map((m) => {
              const isRevealed = revealedIds[m.id];
              const colors = TYPE_BADGE_COLORS[m.type] || {
                bg: 'bg-slate-100 dark:bg-slate-800',
                text: 'text-slate-800 dark:text-slate-200',
                border: 'border-slate-300 dark:border-slate-700',
              };

              return (
                <tr
                  key={m.id}
                  className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                    !m.enabled ? 'opacity-50' : ''
                  }`}
                >
                  {/* Status Toggle */}
                  <td className="py-2.5 pl-2">
                    <button
                      onClick={() => onToggleMapping(m.id)}
                      title={m.enabled ? 'Disabilita anonimizzazione per questo dato' : 'Abilita'}
                      className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                    >
                      {m.enabled ? (
                        <ToggleRight className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-slate-400" />
                      )}
                    </button>
                  </td>

                  {/* Placeholder */}
                  <td className="py-2.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    <button
                      onClick={() => copyToClipboard(m.placeholder, `ph_${m.id}`)}
                      className="inline-flex items-center gap-1 hover:underline cursor-pointer"
                      title="Clicca per copiare il tag"
                    >
                      <span>{m.placeholder}</span>
                      {copiedId === `ph_${m.id}` ? (
                        <Check className="w-3 h-3 text-emerald-500" />
                      ) : null}
                    </button>
                  </td>

                  {/* Type badge */}
                  <td className="py-2.5">
                    <span
                      className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded-md border ${colors.bg} ${colors.text} ${colors.border}`}
                    >
                      {m.categoryName || m.type}
                    </span>
                  </td>

                  {/* Original Value */}
                  <td className="py-2.5 font-mono">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-800 dark:text-slate-200">
                        {isRevealed
                          ? m.originalValue
                          : m.originalValue.slice(0, 3) + '••••••••' + (m.originalValue.length > 8 ? m.originalValue.slice(-2) : '')}
                      </span>
                      <button
                        onClick={() => toggleReveal(m.id)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        title={isRevealed ? 'Nascondi valore' : 'Mostra valore'}
                      >
                        {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </td>

                  {/* Count */}
                  <td className="py-2.5 text-center font-semibold text-slate-600 dark:text-slate-400">
                    {m.count}
                  </td>

                  {/* Actions */}
                  <td className="py-2.5 pr-2 text-right">
                    <button
                      onClick={() => copyToClipboard(m.originalValue, `val_${m.id}`)}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                      title="Copia valore originale"
                    >
                      {copiedId === `val_${m.id}` ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

