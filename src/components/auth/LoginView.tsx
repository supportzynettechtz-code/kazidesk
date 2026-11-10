/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Building2,
  Lock,
  Mail,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Globe,
  Clock,
  UserPlus,
  Eye,
  EyeOff,
  Phone,
  MessageCircle,
  FileText,
  Shield,
  HelpCircle
} from 'lucide-react';
import { loginWithEmail, sendResetEmail, resendVerificationEmail } from '../../services/authService';
import { PLATFORM_OWNER_EMAIL } from '../../firebase/config';
import { mapFirebaseAuthError } from '../../firebase/errors';
import { PlatformSettings } from '../../types/saas';
import { TermsPrivacyModal } from '../common/TermsPrivacyModal';
import { checkRateLimit } from '../../services/securityService';
import { useTranslation } from '../../context/TranslationContext';

interface LoginViewProps {
  onSuccessLogin: (userEmail: string) => void;
  onOpenRegisterWizard?: () => void;
  settings?: PlatformSettings | null;
  lang?: 'sw' | 'en';
  onToggleLang?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onSuccessLogin,
  onOpenRegisterWizard,
  settings,
  lang: propLang,
  onToggleLang: propToggleLang,
}) => {
  // Use Translation Provider Context if available, fallback to props
  const translationCtx = useTranslation();
  const currentLang = propLang || translationCtx.lang || 'sw';
  const handleToggleLang = propToggleLang || translationCtx.toggleLang;
  const t = translationCtx.t?.auth || {
    badge: currentLang === 'sw' ? 'Mfumo wa Ofisi na Biashara' : 'Office & Business Management System',
    heroTitle: currentLang === 'sw' ? 'Usimamizi Madhubuti wa Ofisi & Biashara Yako' : 'Reliable Digital Management for Your Office & Business',
    heroSubtitle: currentLang === 'sw'
      ? 'Suluhisho la kina la uendeshaji wa ofisi kwa makampuni na mashirika: Nukuu & Ankara (VAT), Mahudhurio & Vitambulisho Mahiri (Smart ID), Payroll & Mishahara, Majukumu, Stoo ya Vifaa, na Usimamizi wa Wafanyakazi.'
      : 'Complete office automation suite for organizations: Tax Invoices & Quotations (VAT), Staff Attendance & Smart ID Cards, Payroll & Allowances, Task Workflows, Assets & Consumables, and Directory Management.',
    claim1: currentLang === 'sw' ? 'Data za kila kampuni zimetenganishwa na zinalindwa kwa usalama wa hali ya juu' : 'Company data is strictly separated and protected with enterprise security',
    claim2: currentLang === 'sw' ? 'Uhakiki wa kisheria na usajili rasmi wa kodi (KYC Verification)' : 'Legal compliance and verified business credentials (KYC Onboarding)',
    claim3: currentLang === 'sw' ? 'Malipo ya usajili yanalipwa kwa urahisi kupitia M-Pesa, Tigo Pesa, Airtel Money au Benki' : 'Subscriptions payable conveniently via M-Pesa, Tigo Pesa, Airtel Money, or Bank Transfer',
    signInTitle: currentLang === 'sw' ? 'Ingia Kwenye Akaunti Yako' : 'Sign in to Your Organization',
    signInSubtitle: currentLang === 'sw' ? 'Weka barua pepe na nenosiri la shirika lako' : 'Enter your registered work email and password',
    emailLabel: currentLang === 'sw' ? 'Barua Pepe ya Kazi (Work Email) *' : 'Work Email Address *',
    emailPlaceholder: 'jina@kampuni.co.tz',
    passwordLabel: currentLang === 'sw' ? 'Nenosiri (Password) *' : 'Password *',
    forgotPassword: currentLang === 'sw' ? 'Umesahau nenosiri?' : 'Forgot password?',
    showPassword: currentLang === 'sw' ? 'Onyesha nenosiri' : 'Show password',
    hidePassword: currentLang === 'sw' ? 'Ficha nenosiri' : 'Hide password',
    signInBtn: currentLang === 'sw' ? 'Ingia Kwenye Mfumo' : 'Sign In to Workspace',
    signingIn: currentLang === 'sw' ? 'Inaingia...' : 'Signing in...',
    newOrgQuestion: currentLang === 'sw' ? 'Je, shirika lako ni geni hapa?' : 'New to KaziDesk?',
    registerOrg: currentLang === 'sw' ? 'Sajili Shirika Lako' : 'Register Your Organization',
    startTrial: currentLang === 'sw' ? 'Sajili Sasa (Siku 14 Bure)' : 'Start 14-Day Free Trial',
    freeTrialNotice: currentLang === 'sw' ? 'Pata siku 14 za majaribio bila malipo na uhakiki wa haraka wa KYC.' : 'Get a 14-day free trial with fast-track KYC compliance verification.',
    supportHelp: currentLang === 'sw' ? 'Msaada wa Haraka (Customer Support):' : 'Direct Customer Support:',
    whatsappSupport: 'WhatsApp',
    emailSupport: currentLang === 'sw' ? 'Barua Pepe' : 'Email Support',
    termsLink: currentLang === 'sw' ? 'Vigezo vya Huduma' : 'Terms of Service',
    privacyLink: currentLang === 'sw' ? 'Sera ya Faragha' : 'Privacy Policy',
    allRights: currentLang === 'sw' ? 'Haki zote zimehifadhiwa.' : 'All rights reserved.',
    errWrongPassword: currentLang === 'sw' ? 'Barua pepe au nenosiri si sahihi. Tafadhali hakiki taarifa zako na ujaribu tena.' : 'Invalid email or password. Please verify your credentials and try again.',
    errUnverifiedEmail: currentLang === 'sw' ? 'Barua pepe yako haijathibitishwa bado. Tafadhali kagua sanduku lako la barua pepe kwa kiunganishi cha uthibitisho.' : 'Your email address is not verified yet. Please check your inbox for the verification link.',
    errPendingKyc: currentLang === 'sw' ? 'Usajili wa shirika lako bado unakaguliwa (Pending KYC). Utapokea taarifa punde utakapoidhinishwa.' : 'Your organization application is currently under review (Pending KYC). You will receive an update once approved.',
    errSuspendedCompany: currentLang === 'sw' ? 'Huduma za shirika hili zimesimamishwa kwa muda. Tafadhali wasiliana na huduma kwa wateja kwa ufafanuzi au malipo.' : 'Your organization services are temporarily suspended. Please contact customer support for assistance or subscription renewal.',
    errAccountDisabled: currentLang === 'sw' ? 'Akaunti hii imezimwa na msimamizi wa kampuni.' : 'This user account has been disabled by your company administrator.',
    errLocked: currentLang === 'sw' ? 'Akaunti imefungwa kwa usalama kwa dakika 15 kutokana na majaribio mengi ya nenosiri yasiyo sahihi.' : 'Account temporarily locked for 15 minutes due to multiple failed login attempts.',
    resendVerification: currentLang === 'sw' ? 'Tuma tena kiunganishi cha uthibitisho' : 'Resend verification email',
  };

  // Credentials & Visibility
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Error & Status Feedback
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [canResendEmail, setCanResendEmail] = useState(false);

  // Rate limiting & lockout state
  const [lockoutMinutes, setLockoutMinutes] = useState(0);

  // Password reset modal
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [resetEmailInput, setResetEmailInput] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  // Terms Modal
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [termsModalTab, setTermsModalTab] = useState<'terms' | 'privacy'>('terms');

  // Customer Support Contacts (editable in platform settings)
  const supportEmail = settings?.supportEmail || settings?.ownerEmail || 'support.zynettechtz@gmail.com';
  const supportPhone = settings?.supportWhatsApp || settings?.ownerPhone || '+255775740386';
  // Clean phone number for WhatsApp link
  const cleanWhatsAppNumber = supportPhone.replace(/[^0-9]/g, '');

  // Check lockout on email change
  useEffect(() => {
    if (email.trim().includes('@')) {
      const limit = checkRateLimit(email.trim());
      if (limit.isLocked) {
        setLockoutMinutes(limit.remainingMinutes);
      } else {
        setLockoutMinutes(0);
      }
    }
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setInfoMessage(null);
    setCanResendEmail(false);

    const cleanEmail = email.trim().toLowerCase();

    // Guard: Prevent platform owner from using the customer portal login
    if (cleanEmail === PLATFORM_OWNER_EMAIL.toLowerCase().trim()) {
      setIsLoading(false);
      setErrorMessage(
        currentLang === 'sw'
          ? 'Akaunti ya mmiliki wa mfumo hairuhusiwi kuingia hapa. Tumia lango maalum lililolindwa la kiutawala (/owner-login).'
          : 'Platform owner account must log in via the dedicated administration gateway (/owner-login).'
      );
      return;
    }

    try {
      const account = await loginWithEmail(cleanEmail, password);

      // Verify specific account and tenant statuses with friendly feedback
      if (account.status === 'disabled') {
        setErrorMessage(t.errAccountDisabled);
        setIsLoading(false);
        return;
      }

      if (account.kycStatus === 'submitted' || account.kycStatus === 'under_review') {
        setInfoMessage(t.errPendingKyc);
      }

      onSuccessLogin(cleanEmail);
    } catch (err: any) {
      const msg = err?.message || '';

      if (msg.includes('Akaunti imefungwa') || msg.includes('temporarily locked')) {
        setErrorMessage(t.errLocked);
      } else if (msg.includes('unverified') || msg.includes('auth/unverified-email')) {
        setErrorMessage(t.errUnverifiedEmail);
        setCanResendEmail(true);
      } else if (msg.includes('suspended')) {
        setErrorMessage(t.errSuspendedCompany);
      } else if (msg.includes('pending') || msg.includes('kyc')) {
        setErrorMessage(t.errPendingKyc);
      } else {
        const mapped = mapFirebaseAuthError(err, cleanEmail);
        setErrorMessage(currentLang === 'sw' ? mapped.sw : mapped.en);
      }

      // Re-check lockout
      const limit = checkRateLimit(cleanEmail);
      if (limit.isLocked) {
        setLockoutMinutes(limit.remainingMinutes);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await sendResetEmail(resetEmailInput);
      setResetSuccess(true);
    } catch (err: any) {
      const mapped = mapFirebaseAuthError(err, resetEmailInput);
      setErrorMessage(currentLang === 'sw' ? mapped.sw : mapped.en);
    }
  };

  const handleResendVerification = async () => {
    try {
      await resendVerificationEmail();
      setInfoMessage(currentLang === 'sw' ? 'Barua pepe ya uthibitisho imetumwa tena!' : 'Verification email has been resent!');
      setCanResendEmail(false);
    } catch (err: any) {
      const mapped = mapFirebaseAuthError(err, email);
      setErrorMessage(currentLang === 'sw' ? mapped.sw : mapped.en);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between items-center p-4 sm:p-6 relative overflow-hidden font-sans">
      
      {/* Background glow effects */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Row with Language Switcher */}
      <header className="w-full max-w-5xl flex items-center justify-between py-2 z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-xl text-slate-950 shadow-md shadow-emerald-500/20">
            K
          </div>
          <div>
            <span className="text-xl font-black text-white tracking-tight block">KaziDesk</span>
            <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider block">
              {t.badge}
            </span>
          </div>
        </div>

        {/* Dynamic SW / EN Language Toggle */}
        <button
          onClick={handleToggleLang}
          className="px-3 py-1.5 bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 rounded-xl text-xs font-bold text-slate-200 flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
          title={currentLang === 'sw' ? 'Switch to English' : 'Badili kwenda Kiswahili'}
        >
          <Globe className="w-3.5 h-3.5 text-emerald-400" />
          <span className="tracking-wide">{currentLang === 'sw' ? 'English (EN)' : 'Kiswahili (SW)'}</span>
        </button>
      </header>

      {/* Main Login Grid */}
      <main className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center my-auto py-6 z-10">
        
        {/* Left Column: Authentic Brand Presentation & Honest Promises */}
        <div className="lg:col-span-5 text-white space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-[11px] font-bold text-emerald-400">
            <Shield className="w-3.5 h-3.5" />
            <span>{t.badge}</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-2xl sm:text-3xl font-black leading-tight text-slate-100">
              {t.heroTitle}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              {t.heroSubtitle}
            </p>
          </div>

          {/* Honest Value Statements */}
          <div className="space-y-3 text-xs text-slate-300 pt-1">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="leading-snug">{t.claim1}</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="leading-snug">{t.claim2}</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="leading-snug">{t.claim3}</span>
            </div>
          </div>

          {/* Support Contacts Card */}
          <div className="p-4 bg-slate-900/80 border border-slate-800/80 rounded-2xl space-y-2 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              {t.supportHelp}
            </span>
            <div className="flex flex-wrap items-center gap-3">
              {cleanWhatsAppNumber && (
                <a
                  href={`https://wa.me/${cleanWhatsAppNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg transition-colors font-medium text-xs"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t.whatsappSupport}: {supportPhone.split('/')[0].trim()}</span>
                </a>
              )}
              {supportEmail && (
                <a
                  href={`mailto:${supportEmail}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg transition-colors font-medium text-xs truncate max-w-full"
                >
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{supportEmail}</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Customer Login Box */}
        <div className="lg:col-span-7 bg-slate-900/95 border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-5">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
            <div>
              <h2 className="text-xl font-black text-white">
                {t.signInTitle}
              </h2>
              <span className="text-xs text-slate-400">
                {t.signInSubtitle}
              </span>
            </div>

            {/* Launch KYC Registration Wizard */}
            {onOpenRegisterWizard && (
              <button
                type="button"
                onClick={onOpenRegisterWizard}
                className="self-start sm:self-auto px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{t.registerOrg}</span>
              </button>
            )}
          </div>

          {/* Feedback Messages */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="block leading-relaxed">{errorMessage}</span>
                {canResendEmail && (
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    className="text-emerald-400 hover:underline font-bold text-[11px] block mt-1"
                  >
                    {t.resendVerification}
                  </button>
                )}
              </div>
            </div>
          )}

          {infoMessage && (
            <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{infoMessage}</span>
            </div>
          )}

          {/* Rate limiting lockout countdown */}
          {lockoutMinutes > 0 ? (
            <div className="p-5 bg-amber-500/15 border border-amber-500/30 rounded-2xl text-center space-y-2">
              <Clock className="w-7 h-7 text-amber-400 mx-auto" />
              <h4 className="text-sm font-bold text-amber-300">
                {currentLang === 'sw' ? 'Akaunti Imefungwa kwa Usalama' : 'Account Temporarily Locked'}
              </h4>
              <p className="text-xs text-slate-300">
                {currentLang === 'sw'
                  ? `Majaribio mengi ya nenosiri yasiyo sahihi yamefanyika. Tafadhali subiri dakika ${lockoutMinutes} kabla ya kujaribu tena.`
                  : `Too many failed login attempts. Please wait ${lockoutMinutes} minutes before trying again.`}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Email Input */}
              <div>
                <label className="block font-bold text-slate-300 mb-1.5">
                  {t.emailLabel}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder={t.emailPlaceholder}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-800/90 rounded-xl border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs transition-all"
                  />
                </div>
              </div>

              {/* Password Input with Show/Hide Toggle */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="font-bold text-slate-300">
                    {t.passwordLabel}
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(true)}
                    className="text-[11px] text-slate-400 hover:text-emerald-400 transition-colors"
                  >
                    {t.forgotPassword}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-800/90 rounded-xl border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-slate-200 focus:outline-none"
                    title={showPassword ? t.hidePassword : t.showPassword}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-transform active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <span>{isLoading ? t.signingIn : t.signInBtn}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Registration Promotion Banner */}
          {onOpenRegisterWizard && (
            <div className="p-3.5 bg-slate-800/60 rounded-2xl border border-slate-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-bold text-slate-200 block">
                  {t.newOrgQuestion}
                </span>
                <span className="text-[11px] text-slate-400 leading-relaxed block">
                  {t.freeTrialNotice}
                </span>
              </div>
              <button
                type="button"
                onClick={onOpenRegisterWizard}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shrink-0 transition-colors shadow-md"
              >
                {t.startTrial}
              </button>
            </div>
          )}

        </div>

      </main>

      {/* Footer with Legal Links & Platform Details */}
      <footer className="w-full max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500 border-t border-slate-800/80 pt-4 pb-2 z-20">
        <div>
          <span>© {new Date().getFullYear()} KaziDesk. {t.allRights}</span>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => {
              setTermsModalTab('terms');
              setIsTermsModalOpen(true);
            }}
            className="hover:text-slate-300 transition-colors"
          >
            {t.termsLink}
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={() => {
              setTermsModalTab('privacy');
              setIsTermsModalOpen(true);
            }}
            className="hover:text-slate-300 transition-colors"
          >
            {t.privacyLink}
          </button>
        </div>
      </footer>

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base">
              {currentLang === 'sw' ? 'Rejesha Nenosiri Lako' : 'Reset Your Password'}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {currentLang === 'sw'
                ? 'Weka barua pepe yako na tutakutumia kiunganishi cha kubadilisha nenosiri.'
                : 'Enter your work email address and we will send you a password reset link.'}
            </p>

            {resetSuccess ? (
              <div className="p-4 bg-emerald-500/20 text-emerald-300 rounded-xl text-xs">
                {currentLang === 'sw'
                  ? 'Kiunganishi kimetumwa kwenye barua pepe yako. Tafadhali kagua sanduku lako la barua pepe.'
                  : 'Password reset link sent! Please check your email inbox.'}
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    {t.emailLabel}
                  </label>
                  <input
                    type="email"
                    value={resetEmailInput}
                    onChange={e => setResetEmailInput(e.target.value)}
                    required
                    placeholder="jina@kampuni.co.tz"
                    className="w-full px-3 py-2.5 bg-slate-800 rounded-xl border border-slate-700 text-white text-xs"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotModalOpen(false);
                      setResetSuccess(false);
                    }}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold"
                  >
                    {currentLang === 'sw' ? 'Funga' : 'Close'}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl"
                  >
                    {currentLang === 'sw' ? 'Tuma Kiunganishi' : 'Send Reset Link'}
                  </button>
                </div>
              </form>
            )}

            {resetSuccess && (
              <button
                onClick={() => {
                  setIsForgotModalOpen(false);
                  setResetSuccess(false);
                }}
                className="w-full py-2 bg-slate-800 text-white rounded-xl text-xs font-bold"
              >
                {currentLang === 'sw' ? 'Funga' : 'Close'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Terms & Privacy Modal */}
      <TermsPrivacyModal
        isOpen={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
        settings={settings}
        initialTab={termsModalTab}
      />

    </div>
  );
};
