'use client';

import React from 'react';
import { ShieldCheck, Lock, Sparkles, Sliders, Info, Zap } from 'lucide-react';
import { SAMPLE_PROMPTS, SamplePrompt } from '@/lib/anonymizer/samples';

interface HeaderProps {
  onSelectSample: (sample: SamplePrompt) => void;
  onOpenCustomRules: () => void;
  onOpenAiConfig: () => void;
  onOpenPrivacyInfo: () => void;
  hasApiKey: boolean;
  activeModelName: string;
}

export function Header({
  onSelectSample,
  onOpenCustomRules,
  onOpenAiConfig,
  onOpenPrivacyInfo,
  hasApiKey,
  activeModelName,
}: HeaderProps) {
  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                AI Anonymizer
              </h1>
              <span className="px-2 py-0.5 text-xs font-semibold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 rounded-full border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Standard IT
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Gateway di Anonimizzazione & Ripristino Bidirezionale Prompt AI
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Sample Prompts Dropdown */}
          <div className="relative group">
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition-colors border border-slate-200 dark:border-slate-700">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Carica Esempi</span>
            </button>
            <div className="hidden group-hover:block absolute right-0 mt-1 w-72 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-2 z-50">
              <div className="text-[11px] font-semibold text-slate-400 uppercase px-2 py-1">
                Seleziona scenario test:
              </div>
              {SAMPLE_PROMPTS.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => onSelectSample(sample)}
                  className="w-full text-left p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors text-xs"
                >
                  <div className="font-semibold text-slate-800 dark:text-slate-200">{sample.title}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                    {sample.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Rules Button */}
          <button
            onClick={onOpenCustomRules}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-500" />
            <span>Stringhe Personalizzate</span>
          </button>

          {/* AI Settings Button */}
          <button
            onClick={onOpenAiConfig}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all border ${
              hasApiKey
                ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
            }`}
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>AI: {activeModelName}</span>
          </button>

          {/* Privacy Guarantee Info */}
          <button
            onClick={onOpenPrivacyInfo}
            title="Garanzia Zero-Leak"
            className="p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

