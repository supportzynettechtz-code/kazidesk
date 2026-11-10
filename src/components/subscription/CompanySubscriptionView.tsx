/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  Printer,
  ShieldCheck,
  FileText,
  Phone,
  Mail,
  Building2,
  Sparkles,
  ArrowUpRight,
  Copy,
  Check,
  Users,
  Layers,
  FileCheck,
  RefreshCw,
  ExternalLink,
  MessageCircle
} from 'lucide-react';
import { Company, SaaSPlan, PlatformSettings, SubscriptionPayment } from '../../types/saas';
import { Employee, Invoice } from '../../types/office';
import { getSubscriptionPayments, getPlans, DEFAULT_PLATFORM_SETTINGS, DEFAULT_PLANS } from '../../services/tenantService';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface CompanySubscriptionViewProps {
  company: Company | null;
  settings?: PlatformSettings | null;
  lang: 'sw' | 'en';
  currency: 'TZS' | 'USD';
  employees?: Employee[];
  invoices?: Invoice[];
  onNavigateTab?: (tab: string) => void;
}

export const CompanySubscriptionView: React.FC<CompanySubscriptionViewProps> = ({
  company,
  settings,
  lang,
  currency,
  employees = [],
  invoices = [],
  onNavigateTab,
}) => {
  const [plans, setPlans] = useState<SaaSPlan[]>(DEFAULT_PLANS);
  const [payments, setPayments] = useState<SubscriptionPayment[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<SubscriptionPayment | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const safeSettings: PlatformSettings = settings || DEFAULT_PLATFORM_SETTINGS;

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const [planList, payList] = await Promise.all([
          getPlans(),
          company?.id ? getSubscriptionPayments(company.id) : Promise.resolve([]),
        ]);
        if (isMounted) {
          if (planList && planList.length > 0) setPlans(planList);
          if (payList) setPayments(payList);
        }
      } catch (e) {
        console.warn('Subscription view load warning:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [company?.id]);

  const copyToClipboard = (text: string, key: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    }
  };

  // Safe Fallback Company if null or still bootstrapping
  const safeCompany: Company = company || {
    id: 'demo-company-tz',
    name: 'Kampuni Yako (KaziDesk Workspace)',
    tin: '123-456-789',
    address: 'Dar es Salaam, Tanzania',
    contactPerson: 'Mkurugenzi Mtendaji',
    phone: '+255775740386',
    email: 'info@kazidesk.co.tz',
    planId: 'growth',
    status: 'active',
    subscriptionStartDate: new Date().toISOString().split('T')[0],
    subscriptionDueDate: new Date(Date.now() + 25 * 86400000).toISOString().split('T')[0],
    adminEmail: 'admin@kazidesk.co.tz',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const currentPlan = plans.find(p => p.id === safeCompany.planId) || plans[1] || DEFAULT_PLANS[1];

  // Due date & Warning calculation
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = safeCompany.subscriptionDueDate ? new Date(safeCompany.subscriptionDueDate) : new Date();
  dueDate.setHours(0, 0, 0, 0);

  const diffTime = dueDate.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const isExpiringSoon = daysRemaining <= 7 && daysRemaining >= 0;
  const isOverdue = daysRemaining < 0;

  // Plan limits vs usage calculations
  const currentMonthPrefix = new Date().toISOString().substring(0, 7);
  const staffCount = employees.length;
  const invoicesThisMonthCount = invoices.filter(inv => (inv.date || inv.createdAt || '').startsWith(currentMonthPrefix)).length;

  const staffUsagePercent = Math.min(100, Math.round((staffCount / Math.max(1, currentPlan.maxStaff)) * 100));
  const invoiceUsagePercent = Math.min(100, Math.round((invoicesThisMonthCount / Math.max(1, currentPlan.maxInvoicesPerMonth)) * 100));

  const handleDownloadReceiptHtml = (pay: SubscriptionPayment) => {
    const htmlContent = `
<!DOCTYPE html>
<html lang="sw">
<head>
  <meta charset="UTF-8">
  <title>Stakabadhi ya Malipo - ${pay.receiptNo}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 40px; color: #0f172a; }
    .header { border-bottom: 2px solid #059669; padding-bottom: 20px; display: flex; justify-content: space-between; }
    .title { color: #059669; font-size: 24px; font-weight: bold; margin: 0; }
    .badge { background: #ecfdf5; color: #065f46; padding: 4px 12px; border-radius: 999px; font-weight: bold; font-size: 12px; border: 1px solid #a7f3d0; }
    .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .amount { font-size: 28px; font-weight: bold; color: #059669; font-family: monospace; }
    .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 11px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div style="font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">KAZIDESK SAAS PLATFORM</div>
      <h1 class="title">Stakabadhi Rasmi ya Malipo (Official Receipt)</h1>
      <p style="margin: 4px 0 0; font-family: monospace; font-size: 14px; font-weight: bold;">Nambari: ${pay.receiptNo}</p>
    </div>
    <div style="text-align: right;">
      <span class="badge">IMELIPWA KIKAMILIFU</span>
      <p style="font-size: 12px; color: #64748b; margin-top: 8px;">Tarehe: <strong>${pay.date}</strong></p>
    </div>
  </div>

  <div class="box">
    <div class="grid">
      <div>
        <p style="font-size: 11px; color: #64748b; text-transform: uppercase; margin: 0 0 4px; font-weight: bold;">Imetolewa Kwa Kampuni:</p>
        <h3 style="margin: 0; font-size: 18px;">${safeCompany.name}</h3>
        <p style="margin: 4px 0 0; font-size: 13px; color: #475569;">${safeCompany.email} · ${safeCompany.phone}</p>
        <p style="margin: 2px 0 0; font-size: 12px; color: #64748b;">TIN: ${safeCompany.tin || '-'}</p>
      </div>
      <div>
        <p style="font-size: 11px; color: #64748b; text-transform: uppercase; margin: 0 0 4px; font-weight: bold;">Mtoa Huduma (Platform Provider):</p>
        <h3 style="margin: 0; font-size: 16px;">${safeSettings.ownerCompanyName}</h3>
        <p style="margin: 4px 0 0; font-size: 13px; color: #475569;">Email: ${safeSettings.supportEmail || safeSettings.ownerEmail}</p>
        <p style="margin: 2px 0 0; font-size: 12px; color: #64748b;">WhatsApp / Simu: ${safeSettings.supportWhatsApp || safeSettings.ownerPhone}</p>
      </div>
    </div>
  </div>

  <div style="margin: 24px 0;">
    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
      <thead>
        <tr style="background: #f1f5f9; text-align: left; text-transform: uppercase; font-size: 11px; color: #475569;">
          <th style="padding: 12px;">Maelezo ya Huduma</th>
          <th style="padding: 12px;">Njia ya Malipo</th>
          <th style="padding: 12px;">Kumbukumbu (Ref)</th>
          <th style="padding: 12px; text-align: right;">Kiasi (TZS)</th>
        </tr>
      </thead>
      <tbody>
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 16px 12px;">
            <strong>Usajili wa KaziDesk - Mpango wa ${pay.planName}</strong><br>
            <span style="font-size: 12px; color: #64748b;">Muda wa matumizi umeongezwa hadi <strong>${pay.newDueDate}</strong></span>
          </td>
          <td style="padding: 16px 12px; text-transform: uppercase; font-weight: bold;">${pay.paymentMethod}</td>
          <td style="padding: 16px 12px; font-family: monospace;">${pay.referenceNo}</td>
          <td style="padding: 16px 12px; text-align: right; font-weight: bold; font-family: monospace; font-size: 15px;">
            ${pay.amountTZS.toLocaleString()} TZS
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <div style="text-align: right; margin-top: 20px;">
    <p style="font-size: 12px; color: #64748b; margin: 0;">Jumla Kuu Iliyolipwa:</p>
    <div class="amount">${pay.amountTZS.toLocaleString()} TZS</div>
  </div>

  <div class="footer">
    <p>Stakabadhi hii imetolewa na mfumo wa kidijitali wa KaziDesk. Hati halali ya kisheria na kodi.</p>
    <p>Asante kwa kuchagua KaziDesk kuendesha ofisi yako kidijitali!</p>
  </div>
</body>
</html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Stakabadhi_KaziDesk_${pay.receiptNo}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      
      {/* Expiry Warning Banner (7 days before due date) */}
      {isExpiringSoon && (
        <div className="bg-amber-500/15 border-2 border-amber-500/40 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-amber-900 dark:text-amber-200 animate-in fade-in">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm sm:text-base">
                Tahadhari ya Kuisha kwa Usajili (Subscription Due Soon)
              </h4>
              <p className="text-xs text-amber-800 dark:text-amber-300 mt-1 max-w-2xl leading-relaxed">
                Usajili wa kampuni yako utaisha ndani ya <strong>siku {daysRemaining}</strong> (tarehe <strong>{safeCompany.subscriptionDueDate}</strong>).
                Tafadhali fanya malipo mapema kupitia Lipa Namba au Benki hapa chini ili kuepuka usumbufu wa kusitishiwa huduma.
              </p>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <span className="px-4 py-2 bg-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-sm">
              Siku {daysRemaining} Zimebaki
            </span>
          </div>
        </div>
      )}

      {/* Overdue Banner */}
      {isOverdue && (
        <div className="bg-rose-500/15 border-2 border-rose-500/40 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-rose-900 dark:text-rose-200 animate-in fade-in">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-2xl bg-rose-500/20 text-rose-600 dark:text-rose-400 shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm sm:text-base">
                Tarehe ya Mwisho wa Malipo Imepita (Subscription Overdue)
              </h4>
              <p className="text-xs text-rose-800 dark:text-rose-300 mt-1 max-w-2xl leading-relaxed">
                Muda wako wa usajili uliisha tarehe <strong>{safeCompany.subscriptionDueDate}</strong>. Upo katika muda wa nyongeza (grace period ya siku {safeSettings.gracePeriodDays || 7}).
                Tafadhali fanya malipo sasa kabla ya akaunti kufungwa kiotomatiki.
              </p>
            </div>
          </div>
          <div className="shrink-0">
            <span className="px-4 py-2 bg-rose-600 text-white font-black text-xs rounded-xl shadow-sm">
              Imechelewa Siku {Math.abs(daysRemaining)}
            </span>
          </div>
        </div>
      )}

      {/* Main Grid: Plan Info + Payment Instructions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Current Plan & Limits Card */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">
                  Mpango Uliojiunga Nao Sasa
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {currentPlan.name}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${
                safeCompany.status === 'active' ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30' :
                safeCompany.status === 'trial' ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30' :
                safeCompany.status === 'past_due' ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30' :
                'bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30'
              }`}>
                {safeCompany.status === 'trial' ? 'Majaribio (Trial)' :
                 safeCompany.status === 'active' ? 'Inafanya Kazi (Active)' :
                 safeCompany.status === 'past_due' ? 'Muda Umepita (Past Due)' :
                 safeCompany.status === 'cancelled' ? 'Imesitishwa (Cancelled)' : 'Imezuiwa (Suspended)'}
              </span>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase font-black tracking-wider">Gharama ya Usajili</span>
              <strong className="text-xl font-black text-slate-900 dark:text-white font-mono block mt-1">
                {formatCurrency(currentPlan.priceMonthlyTZS, 'TZS')}
              </strong>
              <span className="text-[11px] text-slate-400 block mt-0.5">kila mwezi</span>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase font-black tracking-wider">Tarehe ya Malipo Ijayo</span>
              <strong className="text-xl font-black text-slate-900 dark:text-white font-mono block mt-1">
                {safeCompany.subscriptionDueDate || '-'}
              </strong>
              <span className={`text-[11px] font-bold block mt-0.5 ${
                daysRemaining < 0 ? 'text-rose-500' : daysRemaining <= 7 ? 'text-amber-500' : 'text-emerald-500'
              }`}>
                {daysRemaining > 0 ? `Zimebaki siku ${daysRemaining}` : `Imechelewa siku ${Math.abs(daysRemaining)}`}
              </span>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase font-black tracking-wider">Muda wa Nyongeza</span>
              <strong className="text-xl font-black text-slate-900 dark:text-white block mt-1">
                Siku {safeSettings.gracePeriodDays || 7}
              </strong>
              <span className="text-[11px] text-slate-400 block mt-0.5">baada ya due date</span>
            </div>
          </div>

          {/* PLAN LIMITS VS CURRENT USAGE BARS (STEP 1 requirement) */}
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-500" />
                <span>Matumizi Halisi Dhidi ya Vikomo vya Mpango (Plan Limits vs Usage)</span>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Staff Quota Bar */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-blue-500" />
                    <span>Wafanyakazi (Staff Quota)</span>
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {staffCount} / {currentPlan.maxStaff}
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      staffUsagePercent >= 100 ? 'bg-rose-500' : staffUsagePercent >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${staffUsagePercent}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-500">
                  <span>{staffUsagePercent}% imetumika</span>
                  <span>Nafasi {Math.max(0, currentPlan.maxStaff - staffCount)} zimebaki</span>
                </div>
              </div>

              {/* Invoices Quota Bar */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Ankara za Mwezi Huu (Monthly Invoices)</span>
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {invoicesThisMonthCount} / {currentPlan.maxInvoicesPerMonth}
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      invoiceUsagePercent >= 100 ? 'bg-rose-500' : invoiceUsagePercent >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${invoiceUsagePercent}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-500">
                  <span>{invoiceUsagePercent}% imetumika</span>
                  <span>Ankara {Math.max(0, currentPlan.maxInvoicesPerMonth - invoicesThisMonthCount)} zimebaki</span>
                </div>
              </div>
            </div>
          </div>

          {/* Features Included List */}
          <div className="pt-2">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-3">
              Huduma Zinazopatikana Kwenye Mpango Huu:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              {(currentPlan.features || []).map((feature, i) => (
                <div key={i} className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300 font-medium">
                  <div className="w-4 h-4 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Official Payment Instructions Card */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <CreditCard className="w-4 h-4" />
                <span>Njia Rasmi za Malipo</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Imethibitishwa
              </span>
            </div>

            <div>
              <h3 className="text-lg font-black text-white">
                Kulipia Usajili wa KaziDesk
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Tuma malipo yako moja kwa moja kwa Mtoa Huduma wa Mfumo ({safeSettings.ownerCompanyName}) kupitia namba zifuatazo:
              </p>
            </div>

            <div className="space-y-3 text-xs pt-1">
              
              {/* M-Pesa / Tigo Pesa Lipa Namba */}
              <div className="p-3.5 bg-slate-800/80 rounded-2xl border border-slate-700/80 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Lipa Namba ya Simu:</span>
                  <button
                    onClick={() => copyToClipboard(safeSettings.mpesaLipaNamba, 'mpesa')}
                    className="p-1 hover:bg-slate-700 rounded-lg text-emerald-400 text-[10px] font-bold flex items-center gap-1 transition-colors"
                  >
                    {copiedKey === 'mpesa' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'mpesa' ? 'Imenakiliwa' : 'Nakili'}</span>
                  </button>
                </div>
                <span className="font-mono text-base font-black text-emerald-400 block tracking-wider">
                  {safeSettings.mpesaLipaNamba}
                </span>
                <span className="text-[11px] text-slate-300 block">Mtandao: Vodacom M-Pesa / Tigo Pesa / Airtel Money</span>
              </div>

              {/* CRDB / Bank Account */}
              <div className="p-3.5 bg-slate-800/80 rounded-2xl border border-slate-700/80 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Akaunti ya Benki ({safeSettings.bankName}):</span>
                  <button
                    onClick={() => copyToClipboard(safeSettings.bankAccountNumber, 'bank')}
                    className="p-1 hover:bg-slate-700 rounded-lg text-emerald-400 text-[10px] font-bold flex items-center gap-1 transition-colors"
                  >
                    {copiedKey === 'bank' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'bank' ? 'Imenakiliwa' : 'Nakili'}</span>
                  </button>
                </div>
                <span className="font-mono text-base font-bold text-white block tracking-wider">
                  {safeSettings.bankAccountNumber}
                </span>
                <span className="text-[11px] text-slate-200 block font-semibold">{safeSettings.bankAccountName}</span>
                <span className="text-[10px] text-slate-400 block">{safeSettings.bankBranch}</span>
              </div>

            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
            {(() => {
              const supportPhone = safeSettings.supportWhatsApp || safeSettings.ownerPhone || '+255775740386';
              const cleanWhatsApp = supportPhone.replace(/[^0-9]/g, '');
              const supportEmail = safeSettings.supportEmail || safeSettings.ownerEmail || 'support.zynettechtz@gmail.com';
              return (
                <>
                  <div className="flex items-center gap-2">
                    <span>Msaada (WhatsApp):</span>
                    <a
                      href={`https://wa.me/${cleanWhatsApp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 hover:text-emerald-300 font-bold font-mono hover:underline inline-flex items-center gap-1"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>{supportPhone.split('/')[0].trim()}</span>
                    </a>
                  </div>
                  <a
                    href={`mailto:${supportEmail}?subject=Uthibitisho wa Malipo ya KaziDesk: ${encodeURIComponent(safeCompany.name)}`}
                    className="text-emerald-400 hover:text-emerald-300 font-bold underline shrink-0 inline-flex items-center gap-1"
                  >
                    <span>Tuma Uthibitisho (Email)</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </>
              );
            })()}
          </div>
        </div>

      </div>

      {/* ALL PLANS COMPARISON & UPGRADE GRID */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full inline-block mb-1.5">
              KaziDesk SaaS Pricing & Module Breakdown
            </span>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              Mipango Yote ya KaziDesk na Moduli Zilizojumuishwa
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Chagua au kagua mpango unaofaa ukubwa na mahitaji ya ofisi yako. Mpango wako wa sasa umewekewa alama maalum ya <strong className="text-emerald-600 font-bold">"Mpango Wako wa Sasa"</strong>.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {plans.map(p => {
            const isCurrent = p.id === safeCompany.planId;
            return (
              <div
                key={p.id}
                className={`rounded-2xl p-5 flex flex-col justify-between border-2 transition-all relative ${
                  isCurrent
                    ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20 shadow-md ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-sm">
                    Mpango Wako wa Sasa
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between pt-1">
                    <h4 className="font-black text-base text-slate-900 dark:text-white">{p.name}</h4>
                  </div>

                  <div>
                    <span className="text-xl font-black font-mono text-slate-900 dark:text-white">
                      {formatCurrency(p.priceMonthlyTZS, 'TZS')}
                    </span>
                    <span className="text-[11px] text-slate-400"> / mwezi</span>
                  </div>

                  <div className="p-2.5 bg-slate-100/70 dark:bg-slate-800/70 rounded-xl space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Max Staff:</span>
                      <strong className="text-slate-900 dark:text-white font-bold">{p.maxStaff}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Max Invoices:</span>
                      <strong className="text-slate-900 dark:text-white font-bold">{p.maxInvoicesPerMonth}/mwezi</strong>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      Moduli Zilizowezeshwa:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {p.enabledModules?.map(m => (
                        <span key={m} className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {m === 'meetings' ? 'Mikutano Live' :
                           m === 'permissions' ? 'Ruhusa & Mipaka' :
                           m === 'reports' ? 'Ripoti za Uongozi' :
                           m === 'help' ? 'Mwongozo & Msaada' :
                           m === 'quotations' ? 'Nukuu & Ankara' :
                           m === 'attendance' ? 'Mahudhurio' :
                           m === 'employees' ? 'Wafanyakazi' :
                           m === 'tasks' ? 'Majukumu' :
                           m === 'payroll' ? 'Payroll' :
                           m === 'sales' ? 'Mauzo CRM' :
                           m === 'assets' ? 'Stoo & Vifaa' :
                           m === 'pettyCash' ? 'Petty Cash' :
                           m === 'documents' ? 'Nyaraka' :
                           m === 'cards' ? 'Smart Cards' : m}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300">
                    {p.features?.map((f, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="truncate">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                  {isCurrent ? (
                    <div className="w-full py-2 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-bold text-xs rounded-xl text-center">
                      Mpango Amilifu
                    </div>
                  ) : (
                    <a
                      href={`mailto:${safeSettings.ownerEmail}?subject=Ombi la Kuboresha Mpango wa KaziDesk kwenda ${encodeURIComponent(p.name)}: ${encodeURIComponent(safeCompany.name)}`}
                      className="w-full py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs rounded-xl text-center block transition-colors"
                    >
                      Boresha Kwenda Mpango Huu
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment History and Invoices/Receipts */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                Historia ya Malipo ya Usajili & Stakabadhi (Official Receipts)
              </h4>
              <span className="text-xs text-slate-400">
                Stakabadhi zote rasmi za malipo ya usajili wa kampuni hii
              </span>
            </div>
          </div>
          <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
            {payments.length} Malipo Yaliyorekodiwa
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" />
            <span>Inapakia historia ya malipo...</span>
          </div>
        ) : payments.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-2">
            <FileText className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
            <p className="font-bold text-slate-600 dark:text-slate-400">
              Hakuna malipo yaliyorekodiwa bado.
            </p>
            <p className="text-[11px] text-slate-400 max-w-md mx-auto">
              Ukifanya malipo kupitia namba za hapo juu, Msimamizi Mkuu atathibitisha na stakabadhi itatokea hapa pamoja na uwezo wa kuipakua na kuichapa.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="py-3.5 px-5">Stakabadhi #</th>
                  <th className="py-3.5 px-5">Tarehe</th>
                  <th className="py-3.5 px-5">Mpango</th>
                  <th className="py-3.5 px-5">Kiasi (TZS)</th>
                  <th className="py-3.5 px-5">Njia ya Malipo</th>
                  <th className="py-3.5 px-5">Kumbukumbu / Ref</th>
                  <th className="py-3.5 px-5">Iliendelezwa Hadi</th>
                  <th className="py-3.5 px-5 text-right">Vitendo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {payments.map(pay => (
                  <tr key={pay.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-5 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {pay.receiptNo}
                    </td>
                    <td className="py-4 px-5 text-slate-700 dark:text-slate-300">
                      {formatDate(pay.date, lang)}
                    </td>
                    <td className="py-4 px-5 font-semibold text-slate-900 dark:text-white">
                      {pay.planName}
                    </td>
                    <td className="py-4 px-5 font-mono font-black text-slate-900 dark:text-white">
                      {formatCurrency(pay.amountTZS, 'TZS')}
                    </td>
                    <td className="py-4 px-5 uppercase font-bold text-slate-600 dark:text-slate-300">
                      {pay.paymentMethod}
                    </td>
                    <td className="py-4 px-5 font-mono text-slate-500 text-[11px]">
                      {pay.referenceNo}
                    </td>
                    <td className="py-4 px-5 font-mono font-bold text-emerald-600">
                      {pay.newDueDate}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedReceipt(pay)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-[11px] inline-flex items-center gap-1 transition-colors"
                          title="Angalia na Chapa Risiti"
                        >
                          <Printer className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Angalia</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadReceiptHtml(pay)}
                          className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded-xl font-bold text-[11px] inline-flex items-center gap-1 transition-colors"
                          title="Pakua Stakabadhi ya Malipo"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Pakua</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Printable Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden p-6 sm:p-8 relative border border-slate-200 my-6">
            
            <div className="flex justify-between items-start border-b border-slate-200 pb-5 mb-5">
              <div>
                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest block">
                  KAZIDESK SAAS PLATFORM
                </span>
                <h3 className="text-xl font-black text-slate-900">
                  Stakabadhi Rasmi ya Malipo
                </h3>
                <span className="font-mono text-xs font-bold text-slate-500 block mt-0.5">
                  Nambari: {selectedReceipt.receiptNo}
                </span>
              </div>
              <div className="text-right text-xs">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Tarehe ya Malipo:</span>
                <strong className="font-mono text-sm">{selectedReceipt.date}</strong>
              </div>
            </div>

            <div className="space-y-4 text-xs mb-6">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-slate-400 text-[10px] font-black uppercase tracking-wider block">IMETOLEWA KWA (CLIENT):</span>
                <strong className="text-base font-bold text-slate-900 block">{safeCompany.name}</strong>
                <span className="text-slate-600 block">{safeCompany.email} · {safeCompany.phone}</span>
                <span className="text-slate-500 block text-[11px]">TIN: {safeCompany.tin || '-'} · {safeCompany.address}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1 text-slate-600">
                <span className="text-slate-400 text-[10px] font-black uppercase tracking-wider block">MTOA HUDUMA (PLATFORM PROVIDER):</span>
                <strong className="text-sm font-bold text-slate-900 block">{safeSettings.ownerCompanyName}</strong>
                <span className="block text-[11px]">
                  WhatsApp: <strong className="text-emerald-600 font-mono">{safeSettings.supportWhatsApp || safeSettings.ownerPhone || '+255775740386'}</strong> · Email: <strong className="text-slate-700">{safeSettings.supportEmail || safeSettings.ownerEmail || 'support.zynettechtz@gmail.com'}</strong>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200/80">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Mpango (Plan):</span>
                  <strong className="text-slate-900 font-bold text-sm">{selectedReceipt.planName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Kiasi Kilicholipwa:</span>
                  <strong className="font-mono font-black text-emerald-800 text-base">
                    {formatCurrency(selectedReceipt.amountTZS, 'TZS')}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Njia ya Malipo:</span>
                  <strong className="text-slate-900 uppercase font-bold">{selectedReceipt.paymentMethod}</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Kumbukumbu / Ref:</span>
                  <strong className="font-mono text-slate-900 font-bold">{selectedReceipt.referenceNo}</strong>
                </div>
                <div className="col-span-2 pt-2 border-t border-emerald-200 text-slate-700 flex items-center justify-between">
                  <span>Muda wa usajili umeongezwa hadi: </span>
                  <strong className="font-mono text-emerald-950 font-black text-sm">{selectedReceipt.newDueDate}</strong>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-5 flex flex-wrap justify-between items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Imethibitishwa na Mfumo wa KaziDesk</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadReceiptHtml(selectedReceipt)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Pakua (HTML)</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-md transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Chapa (Print)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedReceipt(null)}
                  className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-colors"
                >
                  Funga
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
