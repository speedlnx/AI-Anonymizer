'use client';

import React, { useState } from 'react';
import {
  X,
  Key,
  Cpu,
  ShieldCheck,
  Eye,
  EyeOff,
  Check,
  Info,
  Zap,
} from 'lucide-react';
import { SUPPORTED_MODELS, ModelMeta } from '@/lib/ai/providers';

interface AiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: 'openai' | 'anthropic' | 'mock';
  onChangeProvider: (provider: 'openai' | 'anthropic' | 'mock') => void;
  model: string;
  onChangeModel: (model: string) => void;
  apiKey: string;
  onChangeApiKey: (apiKey: string) => void;
}

export function AiConfigModal({
  isOpen,
  onClose,
  provider,
  onChangeProvider,
  model,
  onChangeModel,
  apiKey,
  onChangeApiKey,
}: AiConfigModalProps) {
  const [showKey, setShowKey] = useState(false);

  const currentModels = SUPPORTED_MODELS.filter((m) => m.provider === provider);

  React.useEffect(() => {
    if (isOpen && currentModels.length > 0 && !currentModels.some((m) => m.id === model)) {
      onChangeModel(currentModels[0].id);
    }
  }, [isOpen, provider, model, currentModels, onChangeModel]);

  if (!isOpen) return null;

  const handleProviderSelect = (newProvider: 'openai' | 'anthropic' | 'mock') => {
    onChangeProvider(newProvider);
    const available = SUPPORTED_MODELS.filter((m) => m.provider === newProvider);
    if (available.length > 0) {
      onChangeModel(available[0].id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Configurazione Connessione AI
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Collega ChatGPT, Claude o usa il simulatore locale di prova
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Provider Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Provider AI
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleProviderSelect('openai')}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  provider === 'openai'
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 font-bold text-slate-900 dark:text-white shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="text-sm">ChatGPT</div>
                <div className="text-[10px] text-slate-500">OpenAI</div>
              </button>

              <button
                type="button"
                onClick={() => handleProviderSelect('anthropic')}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  provider === 'anthropic'
                    ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 font-bold text-slate-900 dark:text-white shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="text-sm">Claude</div>
                <div className="text-[10px] text-slate-500">Anthropic</div>
              </button>

              <button
                type="button"
                onClick={() => handleProviderSelect('mock')}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  provider === 'mock'
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 font-bold text-slate-900 dark:text-white shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="text-sm">Simulatore</div>
                <div className="text-[10px] text-slate-500">Test Locale Free</div>
              </button>
            </div>
          </div>

          {/* Model Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Modello AI
            </label>
            <div className="space-y-1.5">
              {currentModels.map((m) => (
                <div
                  key={m.id}
                  onClick={() => onChangeModel(m.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    model === m.id
                      ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20 text-slate-900 dark:text-white'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs">{m.name}</span>
                    <span className="text-[10px] text-slate-400">
                      Finestra: {(m.contextWindow / 1000).toFixed(0)}k token
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {m.description}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* API Key (only when not mock) */}
          {provider !== 'mock' ? (
            <div className="space-y-2 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Chiave API {provider === 'openai' ? 'OpenAI' : 'Anthropic'}</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs flex items-center gap-1"
                >
                  {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showKey ? 'Nascondi' : 'Mostra'}</span>
                </button>
              </div>

              <input
                type={showKey ? 'text' : 'password'}
                placeholder={provider === 'openai' ? 'sk-proj-...' : 'sk-ant-...'}
                value={apiKey}
                onChange={(e) => onChangeApiKey(e.target.value)}
                className="w-full px-3.5 py-2 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
              />

              <div className="flex items-start gap-1.5 text-[11px] text-slate-500 mt-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Massima Privacy:</strong> Il prompt viene trasmesso al provider <u>esclusivamente in forma anonimizzata</u>. Nessun codice fiscale, IBAN o dato originale lascia mai il dispositivo in chiaro.
                </span>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900 text-xs text-indigo-800 dark:text-indigo-300 flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Il simulatore locale permette di testare immediatamente l'intero ciclo: anonimizzazione prompt, ricezione risposta AI mock con etichette, e ripristino automatico dei dati reali. Nessuna API key richiesta.
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
          >
            Salva & Continua
          </button>
        </div>
      </div>
    </div>
  );
}

