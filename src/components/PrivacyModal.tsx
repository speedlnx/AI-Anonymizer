'use client';

import React from 'react';
import { X, ShieldCheck, CheckCircle2, Lock, ArrowLeftRight, FileText } from 'lucide-react';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PrivacyModal({ isOpen, onClose }: PrivacyModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Architettura Zero-Leak & Standard Supportati
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Come l'applicazione protegge i tuoi dati prima di qualunque chiamata AI
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
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-600 dark:text-slate-300">
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800">
            <h4 className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5 mb-1 text-sm">
              <Lock className="w-4 h-4 text-emerald-600" />
              Garanzia Assoluta di Riservatezza
            </h4>
            <p className="text-emerald-800 dark:text-emerald-300 leading-relaxed">
              L'anonimizzazione viene eseguita rigorosamente prima dell'uscita di qualunque dato. I server o le API esterne di ChatGPT / Claude ricevono <strong>esclusivamente il testo sanificato con etichette placeholder</strong> (es. <code>[CODICE_FISCALE_1]</code>, <code>[IBAN_1]</code>).
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
              Tipologie di dati rilevate secondo standard italiani & internazionali:
            </h4>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <li className="flex items-start gap-1.5 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Codice Fiscale</strong> (con algoritmo di controllo carattere e omocodie)</span>
              </li>
              <li className="flex items-start gap-1.5 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Documenti d'Identità IT</strong> (CIE 3.0, Passaporto, Patente, Cartacea)</span>
              </li>
              <li className="flex items-start gap-1.5 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>IBAN & Codici Bancari</strong> (IBAN IT con MOD-97, ABI, CAB, SWIFT/BIC)</span>
              </li>
              <li className="flex items-start gap-1.5 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Carte di Credito</strong> (Visa, Mastercard, Amex con algoritmo Luhn)</span>
              </li>
              <li className="flex items-start gap-1.5 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Numeri Telefonici</strong> (prefissi italiani +39, 0xx fissi, 3xx mobili)</span>
              </li>
              <li className="flex items-start gap-1.5 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Email & URL</strong> (indirizzi e-mail RFC e link Web)</span>
              </li>
              <li className="flex items-start gap-1.5 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Indirizzi IP & MAC</strong> (IPv4, IPv6, MAC address)</span>
              </li>
              <li className="flex items-start gap-1.5 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>API Keys & UUID</strong> (OpenAI, Anthropic, AWS, GitHub, tokens)</span>
              </li>
            </ul>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mb-1 text-xs">
              <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-500" />
              Come funziona la riconversione bidirezionale?
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Durante l'anonimizzazione, il sistema crea una tabella di decodifica protetta. Quando l'AI risponde citando le etichette (es. <em>"Confermo l'operazione per [CODICE_FISCALE_1]"</em>), il convertitore locale ripristina all'istante il testo originale sostituendo le etichette senza esporre mai i dati a terzi.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
}

