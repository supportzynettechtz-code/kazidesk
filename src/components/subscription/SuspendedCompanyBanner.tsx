/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AlertOctagon, Phone, Mail, CreditCard, LogOut, ShieldAlert } from 'lucide-react';
import { Company, PlatformSettings } from '../../types/saas';

interface SuspendedCompanyBannerProps {
  company: Company;
  settings: PlatformSettings;
  onLogout: () => void;
}

export const SuspendedCompanyBanner: React.FC<SuspendedCompanyBannerProps> = ({
  company,
  settings,
  onLogout,
}) => {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-slate-950 border-2 border-rose-600/70 rounded-3xl p-8 shadow-2xl text-slate-100 text-center relative overflow-hidden">
        
        {/* Glow backdrop */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-rose-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-amber-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/50 flex items-center justify-center mx-auto mb-4 text-rose-500">
          <ShieldAlert className="w-9 h-9" />
        </div>

        <span className="inline-block px-3 py-1 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-full text-xs font-bold uppercase tracking-widest mb-3">
          Akaunti Imezuiwa · Account Suspended
        </span>

        <h1 className="text-2xl font-black text-white mb-2">
          Usajili wa Kampuni Umeisha
        </h1>

        <p className="text-sm text-slate-300 leading-relaxed mb-6">
          Huduma za mfumo wa <strong>{company.name}</strong> zimesitishwa kwa muda kwa sababu ya kuisha kwa muda wa usajili (iliyopita tarehe <strong>{company.subscriptionDueDate}</strong>).
        </p>

        <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 text-left space-y-3 mb-6 text-xs">
          <div className="flex items-center gap-2 text-amber-400 font-bold">
            <AlertOctagon className="w-4 h-4 shrink-0" />
            <span>Kumbuka: Data zako zote zipo salama na hazijafutwa.</span>
          </div>
          <p className="text-slate-400 text-[11px]">
            Ili kufungua mfumo na kuendelea na kazi za ofisi, tafadhali fanya malipo ya mwezi kulingana na mpango wako na wasiliana na mmiliki wa jukwaa (Platform Provider).
          </p>

          <div className="border-t border-slate-800 pt-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Mtoa Huduma:</span>
              <span className="font-semibold text-white">{settings.ownerCompanyName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Lipa Namba (M-Pesa / Tigo):</span>
              <span className="font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                {settings.mpesaLipaNamba}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Benki ({settings.bankName}):</span>
              <span className="font-mono text-white">{settings.bankAccountNumber} ({settings.bankAccountName})</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">WhatsApp ya Msaada:</span>
              <span className="font-mono text-emerald-400 font-bold">{settings.supportWhatsApp || settings.ownerPhone || '+255775740386'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Barua Pepe ya Msaada:</span>
              <span className="font-mono text-slate-200">{settings.supportEmail || settings.ownerEmail || 'support.zynettechtz@gmail.com'}</span>
            </div>
          </div>
        </div>

        {(() => {
          const supportPhone = settings.supportWhatsApp || settings.ownerPhone || '+255775740386';
          const cleanWhatsApp = supportPhone.replace(/[^0-9]/g, '');
          const supportEmail = settings.supportEmail || settings.ownerEmail || 'support.zynettechtz@gmail.com';

          return (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-xs">
              <a
                href={`https://wa.me/${cleanWhatsApp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-md"
              >
                <Phone className="w-4 h-4" />
                <span>WhatsApp: {supportPhone.split('/')[0].trim()}</span>
              </a>
              <a
                href={`mailto:${supportEmail}?subject=Kufungua Usajili: ${encodeURIComponent(company.name)}`}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl flex items-center justify-center gap-2 border border-slate-700 transition-colors"
              >
                <Mail className="w-4 h-4" />
                <span>Tuma Barua Pepe</span>
              </a>
              <button
                onClick={onLogout}
                className="w-full sm:w-auto px-4 py-2.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 font-bold rounded-xl flex items-center justify-center gap-2 border border-rose-800/60 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Toka (Logout)</span>
              </button>
            </div>
          );
        })()}

      </div>
    </div>
  );
};
