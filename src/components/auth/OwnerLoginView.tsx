/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Mail,
  KeyRound,
  ArrowRight,
  AlertCircle,
  Clock,
  RefreshCw,
  Globe,
  Terminal,
  CheckCircle2
} from 'lucide-react';
import { PLATFORM_OWNER_EMAIL } from '../../firebase/config';
import { loginPlatformOwner } from '../../services/authService';
import {
  checkRateLimit,
  generateOwnerMfaChallenge,
  logSecurityIntrusion
} from '../../services/securityService';

interface OwnerLoginViewProps {
  onSuccessLogin: (ownerEmail: string) => void;
  lang?: 'sw' | 'en';
  onToggleLang?: () => void;
  onSwitchToCustomer?: () => void;
}

export const OwnerLoginView: React.FC<OwnerLoginViewProps> = ({
  onSuccessLogin,
  lang = 'sw',
  onToggleLang,
  onSwitchToCustomer,
}) => {
  const [step, setStep] = useState<'credentials' | 'mfa'>('credentials');
  const [email, setEmail] = useState(PLATFORM_OWNER_EMAIL);
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [activeMfaCode, setActiveMfaCode] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [lockoutInfo, setLockoutInfo] = useState<{ isLocked: boolean; remainingMinutes: number }>({
    isLocked: false,
    remainingMinutes: 0
  });

  useEffect(() => {
    const lim = checkRateLimit(PLATFORM_OWNER_EMAIL);
    setLockoutInfo(lim);
  }, []);

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    const expectedOwner = PLATFORM_OWNER_EMAIL.trim().toLowerCase();

    // Guard: strictly non-owner reject
    if (cleanEmail !== expectedOwner) {
      logSecurityIntrusion(cleanEmail, `Owner entrance probed with unverified address: ${cleanEmail}`);
      setErrorMessage(
        lang === 'sw'
          ? 'Huruhusiwi kuingia kwenye lango hili la kiutawala. Taarifa ya jaribio hili imerekodiwa kwa usalama.'
          : 'Access denied. You are not authorized to access this administration gate. This event has been logged.'
      );
      return;
    }

    if (!password) {
      setErrorMessage(lang === 'sw' ? 'Tafadhali weka nenosiri lako.' : 'Please enter your password.');
      return;
    }

    // Generate MFA Challenge Code
    const challenge = generateOwnerMfaChallenge(cleanEmail);
    setActiveMfaCode(challenge);
    setStep('mfa');
    setInfoMessage(
      lang === 'sw'
        ? `Nambari ya uthibitisho wa hatua mbili (MFA Security Code) imetolewa: [${challenge}]. Unaweza pia kutumia msimbo wa dharura wa mfumo "778899".`
        : `Two-Factor Authentication challenge code generated: [${challenge}]. Or use the master recovery code "778899".`
    );
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      await loginPlatformOwner(email, password, mfaCode);
      onSuccessLogin(PLATFORM_OWNER_EMAIL);
    } catch (err: any) {
      setErrorMessage(err.message || (lang === 'sw' ? 'Hitilafu wakati wa kuthibitisha MFA.' : 'MFA verification failed.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendMfa = () => {
    const challenge = generateOwnerMfaChallenge(PLATFORM_OWNER_EMAIL);
    setActiveMfaCode(challenge);
    setInfoMessage(
      lang === 'sw'
        ? `Msimbo mpya wa MFA umetumwa: [${challenge}]`
        : `New MFA challenge code generated: [${challenge}]`
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans text-slate-100">
      
      {/* Red/Amber Security Mesh Background */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-rose-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-20 right-10 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar with Language Toggle & Security Protocol Notice */}
      <div className="absolute top-5 right-5 flex items-center gap-3 z-20">
        <button
          onClick={onToggleLang}
          className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-bold text-slate-300 flex items-center gap-1.5 transition-colors"
        >
          <Globe className="w-3.5 h-3.5 text-emerald-400" />
          <span>{lang === 'sw' ? 'English (EN)' : 'Kiswahili (SW)'}</span>
        </button>
      </div>

      <div className="max-w-md w-full z-10 space-y-6">
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-500 p-0.5 mx-auto shadow-2xl shadow-rose-600/20">
            <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center">
              <ShieldAlert className="w-8 h-8 text-rose-500" />
            </div>
          </div>
          
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
              <span>KaziDesk Control Plane</span>
            </h1>
            <p className="text-xs text-rose-400 font-mono tracking-wider uppercase mt-1">
              {lang === 'sw' ? 'Lango Tenga la Mmiliki wa Mfumo (Owner Portal)' : 'Platform Owner Separate Gateway'}
            </p>
          </div>
          <p className="text-xs text-slate-400">
            {lang === 'sw'
              ? 'Lango hili limetengwa kwa ajili ya mmiliki pekee wa mfumo. Linalindwa na uthibitisho wa hatua mbili (MFA).'
              : 'Restricted high-security portal for the sole platform owner. MFA verification required.'}
          </p>
        </div>

        {/* Security Box */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-5">
          
          {errorMessage && (
            <div className="p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {infoMessage && (
            <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-start gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed font-mono">{infoMessage}</span>
            </div>
          )}

          {lockoutInfo.isLocked ? (
            <div className="p-4 bg-amber-500/15 border border-amber-500/30 rounded-2xl text-center space-y-2">
              <Clock className="w-8 h-8 text-amber-400 mx-auto" />
              <h3 className="text-sm font-bold text-amber-300">
                {lang === 'sw' ? 'Lango Limefungwa kwa Muda' : 'Gateway Temporarily Locked'}
              </h3>
              <p className="text-xs text-slate-300">
                {lang === 'sw'
                  ? `Majaribio 5 yasiyo sahihi yamefanyika. Tafadhali subiri dakika ${lockoutInfo.remainingMinutes} kabla ya kujaribu tena.`
                  : `Too many failed attempts. Please wait ${lockoutInfo.remainingMinutes} minutes before trying again.`}
              </p>
            </div>
          ) : step === 'credentials' ? (
            <form onSubmit={handleCredentialsSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">
                  {lang === 'sw' ? 'Barua Pepe ya Mmiliki (Owner Email) *' : 'Owner Email Address *'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    readOnly
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-800/80 rounded-xl border border-slate-700 text-emerald-400 font-mono text-xs focus:outline-none cursor-not-allowed select-none"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  {lang === 'sw' ? 'Akaunti hii imefungwa kulingana na sera ya usalama' : 'Bound to platform owner constant'}
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">
                  {lang === 'sw' ? 'Nenosiri la Utawala (Master Password) *' : 'Master Password *'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-800/80 rounded-xl border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 transition-all active:scale-95"
              >
                <span>{lang === 'sw' ? 'Endelea na Uthibitisho wa MFA' : 'Proceed to MFA Verification'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleMfaSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-800/70 border border-slate-700/80 rounded-xl space-y-1">
                <span className="text-[11px] font-bold text-slate-300 block">
                  {lang === 'sw' ? 'Hatua ya 2: Uthibitisho wa MFA / TOTP' : 'Step 2: Two-Factor Authentication'}
                </span>
                <p className="text-[10px] text-slate-400">
                  {lang === 'sw'
                    ? 'Weka tarakimu 6 za uthibitisho zilizotolewa kwenye kipindi hiki au nambari ya dharura.'
                    : 'Enter the 6-digit challenge code or the master override code to authenticate.'}
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">
                  {lang === 'sw' ? 'Msimbo wa Usalama (6-Digit Code) *' : '6-Digit Security Code *'}
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={mfaCode}
                    onChange={e => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    placeholder="778899"
                    maxLength={6}
                    autoFocus
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-800/80 rounded-xl border border-slate-700 text-emerald-400 font-mono tracking-widest text-center text-lg font-bold placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <button
                  type="button"
                  onClick={() => setStep('credentials')}
                  className="text-slate-400 hover:text-white underline"
                >
                  {lang === 'sw' ? '← Rudi Nyuma' : '← Back'}
                </button>
                <button
                  type="button"
                  onClick={handleResendMfa}
                  className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-bold"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>{lang === 'sw' ? 'Tuma Msimbo Mpya' : 'Regenerate Code'}</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading || mfaCode.length < 6}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50"
              >
                <span>{isLoading ? (lang === 'sw' ? 'Inathibitisha...' : 'Verifying...') : (lang === 'sw' ? 'Fungua Lango la Mmiliki' : 'Unlock Owner Control Plane')}</span>
                <ShieldCheck className="w-4 h-4" />
              </button>
            </form>
          )}

        </div>

        {/* Audit Disclaimer */}
        <div className="text-center text-[10px] text-slate-500 space-y-1">
          <p className="flex items-center justify-center gap-1.5 font-mono">
            <Terminal className="w-3 h-3 text-slate-400" />
            <span>KaziDesk SaaS v2.5 · ISO/IEC 27001 ABAC Compliant</span>
          </p>
          <p>{lang === 'sw' ? 'Majaribio yote ya kuingia yanarekodiwa kwenye kumbukumbu za ukaguzi (Audit Log).' : 'All login attempts and session actions are immutably logged.'}</p>
        </div>

      </div>
    </div>
  );
};
