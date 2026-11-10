/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldCheck, FileText, X, Check, Printer } from 'lucide-react';
import { PlatformSettings } from '../../types/saas';

interface TermsPrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings?: PlatformSettings | null;
  initialTab?: 'terms' | 'privacy';
}

export const TermsPrivacyModal: React.FC<TermsPrivacyModalProps> = ({
  isOpen,
  onClose,
  settings,
  initialTab = 'terms',
}) => {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>(initialTab);

  if (!isOpen) return null;

  const termsText = settings?.termsOfService || `MASHARTI NA VIGEZO VYA UTUMIAJI WA KAZIDESK (TERMS OF SERVICE)

1. UTANGULIZI:
Karibu KaziDesk, mfumo wa kidijitali wa usimamizi wa ofisi unaoendeshwa na ${settings?.ownerCompanyName || 'ZynetTech Tanzania Ltd'}. Kwa kutumia au kusajili akaunti, unakubaliana na masharti haya.

2. USAJILI WA KAMPUNI NA USALAMA WA AKAUNTI:
Kila kampuni inawajibika kulinda taarifa zake za siri na nywila za wasimamizi na wafanyakazi. KaziDesk inalinda data zote kwa teknolojia ya utenganisho thabiti (Strict Multi-Tenant Isolation).

3. MIPANGO NA MALIPO YA USAJILI:
Mfumo unafanya kazi kwa usajili wa kila mwezi (Monthly Subscription). Malipo yanafanyika kupitia njia zilizoidhinishwa (M-Pesa, Tigo Pesa, Airtel Money, na Benki). Kushindwa kulipia baada ya siku 7 za nyongeza (grace period) kunaweza kusababisha huduma kusitishwa kwa muda.

4. HAKI MILIKI YA DATA:
Data zote zilizowekwa kwenye mfumo (wafanyakazi, nyaraka, ankara, stoo, mishahara) ni mali ya kampuni yako pekee. Msimamizi ana haki ya kupakua nakala kamili ya data (JSON backup) wakati wowote.

5. SHERIA ZINAZOTUMIKA:
Masharti haya yanaongozwa na sheria za Jamhuri ya Muungano wa Tanzania ikiwemo usimamizi wa kodi (TRA) kwa viwango vya VAT 18%.`;

  const privacyText = settings?.privacyPolicy || `SERA YA FARAGHA YA KAZIDESK (PRIVACY POLICY)

1. TAARIFA TUNAZOKUSANYA:
Tunakusanya taarifa zinazohitajika pekee kuendesha ofisi yako: Jina la kampuni, TIN/VRN, namba za simu, barua pepe, orodha ya wafanyakazi, saa za kuingia na kutoka, ankara na stoo.

2. USIRI NA UTENGANISHO WA DATA (DATA ISOLATION):
Kila kampuni inatengewa chumba chake salama (isolated Firestore partition). Kampuni nyingine haiwezi kuona wala kuingilia data za kampuni yako.

3. KUTOSHIRIKISHA DATA NA WATU WA NJE:
Hatuuzi wala kushirikisha data ya biashara yako na washirika wa kibiashara au watangazaji wa nje.

4. HAKI YA KUFUTA DATA (RIGHT TO BE FORGOTTEN):
Msimamizi wa kampuni anaweza kufuta akaunti na data zote za kampuni moja kwa moja kupitia jopo la usimamizi wa data.`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100 flex flex-col max-h-[85vh] my-6">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Sheria, Masharti & Sera ya Faragha
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                {settings?.platformName || 'KaziDesk'} Legal & Privacy Center
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 pt-3 gap-2 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            onClick={() => setActiveTab('terms')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'terms'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Masharti ya Utumiaji (Terms)</span>
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'privacy'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Sera ya Faragha (Privacy)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans whitespace-pre-line">
          {activeTab === 'terms' ? termsText : privacyText}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between">
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Chapa (Print)</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Check className="w-4 h-4" />
            <span>Nimeelewa & Funga</span>
          </button>
        </div>

      </div>
    </div>
  );
};
