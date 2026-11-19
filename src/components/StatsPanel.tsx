'use client';

import React from 'react';
import {
  Activity,
  Cpu,
  Coins,
  ShieldCheck,
  RotateCcw,
  Zap,
  Gauge,
  Layers,
} from 'lucide-react';
import { TokenUsageStats } from '@/lib/anonymizer/types';

interface StatsPanelProps {
  stats: TokenUsageStats;
  onResetSessionStats: () => void;
  onConfigureAi: () => void;
  isSending: boolean;
}

export function StatsPanel({
  stats,
  onResetSessionStats,
  onConfigureAi,
  isSending,
}: StatsPanelProps) {
  const percentUsed = Math.min(
    100,
    Math.max(0, (stats.sessionTotalTokens / (stats.contextWindow || 128000)) * 100)
  );

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('it-IT').format(num);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm transition-all relative overflow-hidden">
      {/* Top Bar / Header of the Stats Box */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Statistiche AI & Monitoraggio Token
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-blue-500" />
                {stats.model}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase">
                {stats.provider}
              </span>
              {isSending && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  In elaborazione...
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Prompt caching badge */}
          {(stats.sessionCachedTokens ?? 0) > 0 && (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-medium"
              title="Token recuperati istantaneamente dalla Prompt Cache (sconto del 90% sui costi)"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Cache: {formatNumber(stats.sessionCachedTokens || 0)} tok</span>
            </div>
          )}

          {/* Security zero-leak badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>0 Dati in Chiaro Inviati</span>
          </div>

          <button
            onClick={onResetSessionStats}
            title="Azzera statistiche sessione"
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onConfigureAi}
            className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            <Zap className="w-3 h-3" />
            Configura AI
          </button>
        </div>
      </div>

      {/* Grid of Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        {/* Metric 1: Token Rimanenti (Focus richiesto) */}
        <div className="bg-gradient-to-br from-indigo-50/70 to-blue-50/40 dark:from-indigo-950/30 dark:to-blue-950/20 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
          <div className="flex items-center justify-between text-xs text-indigo-700 dark:text-indigo-300 font-medium mb-1">
            <span className="flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5" />
              Token Rimanenti
            </span>
            <span className="text-[10px] font-bold">
              {Math.max(0, 100 - percentUsed).toFixed(1)}%
            </span>
          </div>
          <div className="text-lg font-black text-indigo-950 dark:text-indigo-100 tracking-tight">
            {formatNumber(stats.tokensRemaining)}
          </div>
          <div className="w-full bg-indigo-200/50 dark:bg-indigo-900/60 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(2, 100 - percentUsed))}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
            su {formatNumber(stats.contextWindow)} finestra max
          </div>
        </div>

        {/* Metric 2: Ultima Richiesta */}
        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            Ultima Chiamata
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white">
            {formatNumber(stats.lastTotalTokens)}{' '}
            <span className="text-xs font-normal text-slate-500">tok</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between gap-1">
            <span>In: {stats.lastPromptTokens}</span>
            <span>Out: {stats.lastCompletionTokens}</span>
            {stats.cachedTokens ? (
              <span className="text-amber-600 dark:text-amber-400 font-bold" title="Token recuperati da prompt cache (sconto 90%)">
                ⚡{stats.cachedTokens}
              </span>
            ) : null}
          </div>
        </div>

        {/* Metric 3: Token Totali Sessione */}
        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
            Totale Sessione
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white">
            {formatNumber(stats.sessionTotalTokens)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between gap-1">
            <span>In: {formatNumber(stats.sessionPromptTokens)}</span>
            <span>Out: {formatNumber(stats.sessionCompletionTokens)}</span>
            {(stats.sessionCachedTokens ?? 0) > 0 && (
              <span className="text-amber-600 dark:text-amber-400 font-bold" title="Token totali risparmiati con prompt cache">
                ⚡{formatNumber(stats.sessionCachedTokens || 0)}
              </span>
            )}
          </div>
        </div>

        {/* Metric 4: Richieste Eseguite */}
        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
            Richieste Eseguite
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white">
            {stats.requestCount}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {stats.lastRequestTimestamp
              ? `Ultima: ${new Date(stats.lastRequestTimestamp).toLocaleTimeString()}`
              : 'Nessuna chiamata effettuata'}
          </div>
        </div>

        {/* Metric 5: Stima Costo API */}
        <div className="col-span-2 sm:col-span-4 lg:col-span-1 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800">
          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
            <Coins className="w-3.5 h-3.5 text-amber-500" />
            Costo Stimato
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white">
            ${stats.estimatedCostUsd.toFixed(5)}
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
            {stats.provider === 'mock' ? 'Simulatore Gratuito' : 'Tariffa provider ufficiale'}
          </div>
        </div>
      </div>
    </div>
  );
}

