/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Building2,
  DollarSign,
  Users,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Plus,
  Edit2,
  Trash2,
  Lock,
  Unlock,
  Eye,
  FileText,
  CreditCard,
  Settings,
  History,
  CheckCircle2,
  Calendar,
  Search,
  ExternalLink,
  Save,
  X,
  Printer,
  Sparkles,
  Phone,
  Mail,
  ShieldAlert,
  MessageSquare,
  UserCheck
} from 'lucide-react';
import { collection, getDocs, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db, PLATFORM_OWNER_EMAIL } from '../../firebase/config';
import { AuditLogsView } from './AuditLogsView';
import { Company, SaaSPlan, SubscriptionPayment, PlatformSettings, AuditLogEntry, SubscriptionStatus } from '../../types/saas';
import { KYCApplication } from '../../types/kyc';
import { getAllKYCApplications } from '../../services/kycService';
import { OwnerKYCReviewQueue } from '../kyc/OwnerKYCReviewQueue';
import { SaaSTestSuiteModal } from '../testing/SaaSTestSuiteModal';
import {
  getCompanies,
  createCompany,
  updateCompany,
  deleteCompany,
  setCompanyStatus,
  getPlans,
  savePlan,
  getSubscriptionPayments,
  recordSubscriptionPayment,
  getPlatformSettings,
  savePlatformSettings,
  getAuditLogs,
  logAuditAction
} from '../../services/tenantService';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface SuperAdminPortalProps {
  lang: 'sw' | 'en';
  currency: 'TZS' | 'USD';
  onEnterReadOnlyCompanyView: (company: Company) => void;
}

export const SuperAdminPortal: React.FC<SuperAdminPortalProps> = ({
  lang,
  currency,
  onEnterReadOnlyCompanyView,
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'registrations' | 'companies' | 'plans' | 'billing' | 'settings' | 'audit' | 'tickets'>('dashboard');

  // State Collections
  const [companies, setCompanies] = useState<Company[]>([]);
  const [plans, setPlans] = useState<SaaSPlan[]>([]);
  const [payments, setPayments] = useState<SubscriptionPayment[]>([]);
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [kycApplications, setKycApplications] = useState<KYCApplication[]>([]);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [selectedTicketForReply, setSelectedTicketForReply] = useState<any | null>(null);
  const [ownerReplyText, setOwnerReplyText] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedCompanyForPayment, setSelectedCompanyForPayment] = useState<Company | null>(null);

  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SaaSPlan | null>(null);

  const [newCompanyAdminCreds, setNewCompanyAdminCreds] = useState<{ email: string; pass: string; companyName: string } | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [isTestSuiteOpen, setIsTestSuiteOpen] = useState(false);

  // Reload all data
  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [compList, planList, payList, setts, logs, kycList] = await Promise.all([
        getCompanies(),
        getPlans(),
        getSubscriptionPayments(),
        getPlatformSettings(),
        getAuditLogs(),
        getAllKYCApplications(),
      ]);
      setCompanies(compList);
      setPlans(planList);
      setPayments(payList);
      setSettings(setts);
      setAuditLogs(logs);
      setKycApplications(kycList);

      // Load support tickets
      try {
        const snap = await getDocs(collection(db, 'supportTickets'));
        const ticketList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        ticketList.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setSupportTickets(ticketList);
      } catch (err) {
        console.warn('Could not load support tickets:', err);
      }
    } catch (e) {
      console.warn('Super Admin load error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();

    // Live listener for support tickets in Super Admin
    const unsub = onSnapshot(collection(db, 'supportTickets'), snap => {
      const ticketList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      ticketList.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setSupportTickets(ticketList);
    }, () => {});

    return () => unsub();
  }, []);

  const showNotification = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  // -------------------------------------------------------------------------
  // METRICS CALCULATIONS
  // -------------------------------------------------------------------------
  const totalCompanies = companies.length;
  const activeCompanies = companies.filter(c => c.status === 'active').length;
  const trialCompanies = companies.filter(c => c.status === 'trial').length;
  const pastDueCompanies = companies.filter(c => c.status === 'past_due').length;
  const suspendedCompanies = companies.filter(c => c.status === 'suspended').length;

  // Monthly Recurring Revenue (MRR)
  const mrrTZS = companies
    .filter(c => c.status === 'active')
    .reduce((sum, comp) => {
      const plan = plans.find(p => p.id === comp.planId);
      return sum + (plan ? plan.priceMonthlyTZS : 0);
    }, 0);

  // Payments Due in the next 7 days
  const today = new Date();
  const nextWeek = new Date(today.getTime() + 7 * 86400000);
  const dueThisWeek = companies.filter(c => {
    if (!c.subscriptionDueDate) return false;
    const d = new Date(c.subscriptionDueDate);
    return d >= today && d <= nextWeek;
  });

  // -------------------------------------------------------------------------
  // COMPANY ACTIONS
  // -------------------------------------------------------------------------
  const handleSaveCompany = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = fd.get('name') as string;
    const email = fd.get('email') as string;
    const phone = fd.get('phone') as string;
    const address = fd.get('address') as string;
    const tin = fd.get('tin') as string;
    const contactPerson = fd.get('contactPerson') as string;
    const planId = fd.get('planId') as string;
    const tempPassword = (fd.get('tempPassword') as string) || 'KaziDesk2026!';

    if (editingCompany) {
      await updateCompany(editingCompany.id, {
        name,
        email,
        phone,
        address,
        tin,
        contactPerson,
        planId,
      });
      showNotification(`Kampuni ya ${name} imesasishwa kwa mafanikio.`);
    } else {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      const created = await createCompany({
        name,
        email,
        phone,
        address,
        tin,
        contactPerson,
        planId,
        status: 'trial',
        subscriptionStartDate: new Date().toISOString().split('T')[0],
        subscriptionDueDate: dueDate.toISOString().split('T')[0],
        adminEmail: email,
      }, tempPassword);

      setNewCompanyAdminCreds({
        companyName: name,
        email,
        pass: tempPassword,
      });

      showNotification(`Kampuni ya ${name} imeundwa na akaunti ya Msimamizi imetengenezwa.`);
    }

    setIsCompanyModalOpen(false);
    setEditingCompany(null);
    loadAllData();
  };

  const handleToggleSuspend = async (company: Company) => {
    const newStatus: SubscriptionStatus = company.status === 'suspended' ? 'active' : 'suspended';
    const actionLabel = newStatus === 'suspended' ? 'kusimamisha' : 'kufungua';
    if (confirm(`Je, una uhakika unataka ${actionLabel} huduma kwa kampuni ya ${company.name}?`)) {
      await setCompanyStatus(company.id, newStatus, company.name);
      showNotification(`Hali ya kampuni ya ${company.name} imebadilishwa kuwa ${newStatus}.`);
      loadAllData();
    }
  };

  const handleDeleteCompany = async (company: Company) => {
    if (confirm(`ONYO KALI: Je, una uhakika unataka kuifuta kabisa kampuni ya "${company.name}"? Hatua hii haiwezi kurudishwa.`)) {
      await deleteCompany(company.id, company.name);
      showNotification(`Kampuni ya ${company.name} imefutwa.`);
      loadAllData();
    }
  };

  // -------------------------------------------------------------------------
  // RECORD PAYMENT
  // -------------------------------------------------------------------------
  const handleRecordPayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCompanyForPayment) return;
    const fd = new FormData(e.currentTarget);
    const amountTZS = Number(fd.get('amountTZS'));
    const paymentMethod = fd.get('paymentMethod') as any;
    const referenceNo = fd.get('referenceNo') as string;
    const notes = fd.get('notes') as string;

    await recordSubscriptionPayment({
      companyId: selectedCompanyForPayment.id,
      amountTZS,
      paymentMethod,
      referenceNo,
      notes,
    });

    showNotification(`Malipo ya TZS ${amountTZS.toLocaleString()} yamerekodiwa kwa ${selectedCompanyForPayment.name}. Muda wa usajili umeongezwa mwezi mmoja.`);
    setIsPaymentModalOpen(false);
    setSelectedCompanyForPayment(null);
    loadAllData();
  };

  // -------------------------------------------------------------------------
  // SAVE PLATFORM SETTINGS
  // -------------------------------------------------------------------------
  const handleSaveSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!settings) return;
    setSettingsError(null);
    const fd = new FormData(e.currentTarget);

    let rawWhatsApp = (fd.get('supportWhatsApp') as string || '').trim();
    const rawEmail = (fd.get('supportEmail') as string || '').trim();

    // 1. Validate & Normalize Tanzanian Phone Number (+255 format)
    if (rawWhatsApp.startsWith('0')) {
      rawWhatsApp = '+255' + rawWhatsApp.slice(1).replace(/[\s-]/g, '');
    } else if (rawWhatsApp.startsWith('255')) {
      rawWhatsApp = '+' + rawWhatsApp.replace(/[\s-]/g, '');
    } else {
      rawWhatsApp = rawWhatsApp.replace(/[\s-]/g, '');
    }

    const tanzaniaPhoneRegex = /^\+255[67]\d{8}$/;
    if (!tanzaniaPhoneRegex.test(rawWhatsApp)) {
      setSettingsError(
        lang === 'sw'
          ? 'Namba ya WhatsApp ya msaada lazima iwe katika muundo sahihi wa Tanzania (+255 ikifuatiwa na tarakimu 9 za simu, mfano: +255775740386).'
          : 'Support WhatsApp number must be in valid Tanzanian format (+255 followed by 9 digits, e.g. +255775740386).'
      );
      return;
    }

    // 2. Validate Support Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(rawEmail)) {
      setSettingsError(
        lang === 'sw'
          ? 'Barua pepe ya msaada si sahihi. Tafadhali weka barua pepe kamili (mfano: support.zynettechtz@gmail.com).'
          : 'Invalid support email format. Please provide a valid email address (e.g. support.zynettechtz@gmail.com).'
      );
      return;
    }

    const updated: PlatformSettings = {
      ...settings,
      supportWhatsApp: rawWhatsApp,
      supportEmail: rawEmail,
      ownerPhone: rawWhatsApp,
      ownerEmail: rawEmail,
      platformName: (fd.get('platformName') as string) || 'KaziDesk',
      platformLogoUrl: (fd.get('platformLogoUrl') as string) || '',
      ownerCompanyName: fd.get('ownerCompanyName') as string,
      mpesaLipaNamba: fd.get('mpesaLipaNamba') as string,
      tigoPesaLipaNamba: fd.get('tigoPesaLipaNamba') as string,
      bankName: fd.get('bankName') as string,
      bankAccountName: fd.get('bankAccountName') as string,
      bankAccountNumber: fd.get('bankAccountNumber') as string,
      bankBranch: fd.get('bankBranch') as string,
      gracePeriodDays: Number(fd.get('gracePeriodDays') || 7),
      termsOfService: (fd.get('termsOfService') as string) || settings.termsOfService,
      privacyPolicy: (fd.get('privacyPolicy') as string) || settings.privacyPolicy,
    };
    await savePlatformSettings(updated);
    setSettings(updated);
    showNotification('Mipangilio ya mawasiliano ya jukwaa na malipo imesasishwa kikamilifu.');
  };

  // -------------------------------------------------------------------------
  // READ-ONLY "VIEW COMPANY" (AUDITED)
  // -------------------------------------------------------------------------
  const handleViewCompany = async (company: Company) => {
    await logAuditAction(
      'SUPER_ADMIN_VIEW_COMPANY_READONLY',
      company.id,
      company.name,
      `Super admin entered secure read-only mode to audit internal company records.`
    );
    onEnterReadOnlyCompanyView(company);
  };

  // Filtered companies
  const filteredCompanies = companies.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.tin.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">

      {/* Top Banner & Title */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-900/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>PORTAL YA MMILIKI WA MFUMO (SUPER ADMIN)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            KaziDesk SaaS Platform Engine
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Simamia makampuni yote, usajili wa kila mwezi, mapato ya jukwaa (MRR), na ukaguzi wa data kwa usalama wa kiwango cha juu.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={() => {
              setEditingCompany(null);
              setIsCompanyModalOpen(true);
            }}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg transition-transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Sajili Kampuni Mpya</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {successToast && (
        <div className="bg-emerald-500 text-slate-950 px-4 py-3 rounded-xl font-bold text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-1 text-xs font-bold">
        {[
          { id: 'dashboard', label: 'Dashibodi ya Mapato (SaaS)', icon: TrendingUp },
          { id: 'registrations', label: `Maombi & KYC (${kycApplications.filter(a => a.status === 'submitted' || a.status === 'under_review').length})`, icon: UserCheck },
          { id: 'companies', label: `Makampuni (${companies.length})`, icon: Building2 },
          { id: 'plans', label: `Mipango ya Bei (${plans.length})`, icon: Sparkles },
          { id: 'billing', label: `Malipo ya Usajili (${payments.length})`, icon: CreditCard },
          { id: 'tickets', label: `Tiketi za Msaada (${supportTickets.filter(t => t.status === 'open').length})`, icon: MessageSquare },
          { id: 'settings', label: 'Mipangilio ya Mfumo & Lipa Namba', icon: Settings },
          { id: 'audit', label: `Kumbukumbu za Ukaguzi (${auditLogs.length})`, icon: History },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl flex items-center gap-2 shrink-0 transition-all ${
                isActive
                  ? 'bg-slate-900 text-white dark:bg-emerald-600 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* =================================================================== */}
      {/* 2. REGISTRATIONS & KYC REVIEW QUEUE                                 */}
      {/* =================================================================== */}
      {activeTab === 'registrations' && (
        <OwnerKYCReviewQueue
          applications={kycApplications}
          onRefresh={loadAllData}
          reviewerEmail={settings?.ownerEmail || PLATFORM_OWNER_EMAIL}
          lang={lang}
        />
      )}

      {/* =================================================================== */}
      {/* 1. DASHBOARD VIEW */}
      {/* =================================================================== */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* MRR */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Mapato ya Kila Mwezi (MRR)
              </span>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                {formatCurrency(mrrTZS, 'TZS')}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Kutoka kwa makampuni {activeCompanies} yanayolipa
              </span>
            </div>

            {/* Total Companies */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Jumla ya Makampuni
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
                {totalCompanies}
              </div>
              <div className="flex gap-2 text-[11px] text-slate-500 mt-1">
                <span className="text-emerald-600 font-bold">{activeCompanies} Active</span>
                <span>·</span>
                <span className="text-blue-600 font-bold">{trialCompanies} Trial</span>
              </div>
            </div>

            {/* Payments Due This Week */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Malipo Yanayokaribia (Siku 7)
              </span>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono mt-1">
                {dueThisWeek.length}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Makampuni yanayohitaji kulipa wiki hii
              </span>
            </div>

            {/* Past Due & Suspended */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Zilizochelewa / Zilizofungwa
              </span>
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono mt-1">
                {pastDueCompanies + suspendedCompanies}
              </div>
              <div className="flex gap-2 text-[11px] text-slate-500 mt-1">
                <span className="text-amber-600 font-bold">{pastDueCompanies} Past Due</span>
                <span>·</span>
                <span className="text-rose-600 font-bold">{suspendedCompanies} Suspended</span>
              </div>
            </div>

          </div>

          {/* Attention Alerts Section */}
          {(dueThisWeek.length > 0 || pastDueCompanies > 0 || suspendedCompanies > 0) && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Tahadhari za Usajili Zinazohitaji Ufuatiliaji:</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {dueThisWeek.map(c => (
                  <div key={c.id} className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <strong className="text-slate-900 dark:text-white block">{c.name}</strong>
                      <span className="text-slate-500 text-[11px]">Tarehe ya mwisho: {c.subscriptionDueDate}</span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedCompanyForPayment(c);
                        setIsPaymentModalOpen(true);
                      }}
                      className="px-2.5 py-1 bg-emerald-600 text-white rounded font-bold text-[11px]"
                    >
                      Rekodi Malipo
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Companies Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Muhtasari wa Makampuni & Hali za Usajili
              </h3>
              <button
                onClick={() => setActiveTab('companies')}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-500"
              >
                Tazama Orodha Kamili →
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="py-2.5 px-3">Kampuni</th>
                    <th className="py-2.5 px-3">Mawasiliano</th>
                    <th className="py-2.5 px-3">Mpango</th>
                    <th className="py-2.5 px-3">Hali</th>
                    <th className="py-2.5 px-3">Tarehe ya Malipo</th>
                    <th className="py-2.5 px-3 text-right">Hatua</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {companies.slice(0, 5).map(c => (
                    <tr key={c.id}>
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">{c.name}</td>
                      <td className="py-3 px-3 text-slate-500">{c.contactPerson} ({c.phone})</td>
                      <td className="py-3 px-3 font-semibold uppercase">{c.planId}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          c.status === 'active' ? 'bg-emerald-500/20 text-emerald-600' :
                          c.status === 'trial' ? 'bg-blue-500/20 text-blue-600' :
                          c.status === 'past_due' ? 'bg-amber-500/20 text-amber-600' : 'bg-rose-500/20 text-rose-600'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono">{c.subscriptionDueDate}</td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleViewCompany(c)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded font-bold text-[10px]"
                        >
                          Kagua (Read-Only)
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* =================================================================== */}
      {/* 2. COMPANIES LIST TAB */}
      {/* =================================================================== */}
      {activeTab === 'companies' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
          
          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Tafuta jina la kampuni, barua pepe au TIN..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium"
              >
                <option value="all">Hali Zote</option>
                <option value="active">Active (Wanaofanya Kazi)</option>
                <option value="trial">Trial (Majaribio)</option>
                <option value="past_due">Past Due (Muda Umepita)</option>
                <option value="suspended">Suspended (Waliozuiwa)</option>
              </select>

              <button
                onClick={() => {
                  setEditingCompany(null);
                  setIsCompanyModalOpen(true);
                }}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ongeza Kampuni</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 uppercase text-[10px] font-bold">
                <tr>
                  <th className="py-3 px-3">Kampuni</th>
                  <th className="py-3 px-3">TIN / VRN</th>
                  <th className="py-3 px-3">Msimamizi & Simu</th>
                  <th className="py-3 px-3">Mpango (Plan)</th>
                  <th className="py-3 px-3">Hali (Status)</th>
                  <th className="py-3 px-3">Mwisho wa Malipo</th>
                  <th className="py-3 px-3 text-right">Vitendo vya Utawala</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredCompanies.map(c => {
                  const plan = plans.find(p => p.id === c.planId);
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-3">
                        <strong className="text-slate-900 dark:text-white block font-bold text-sm">
                          {c.name}
                        </strong>
                        <span className="text-[11px] text-slate-400 block">{c.address}</span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400">
                        {c.tin}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900 dark:text-white">{c.contactPerson}</div>
                        <div className="text-[11px] text-slate-500">{c.email}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{c.phone}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {plan?.name || c.planId}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {plan ? `${formatCurrency(plan.priceMonthlyTZS, 'TZS')}/mwezi` : ''}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          c.status === 'active' ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30' :
                          c.status === 'trial' ? 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-500/30' :
                          c.status === 'past_due' ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30' :
                          'bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-500/30'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono font-semibold text-slate-900 dark:text-white">
                        {c.subscriptionDueDate || '-'}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* Sandbox Testing Tools (Only for Sandbox / Demo company in Owner Portal) */}
                          {(c.id === 'demo-company-tz' || c.id.includes('sandbox') || c.id.includes('demo')) && (
                            <button
                              onClick={() => setIsTestSuiteOpen(true)}
                              title="Fanya Majaribio ya Kiufundi (Sandbox System Tests)"
                              className="p-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 text-amber-600 rounded-lg flex items-center gap-1 font-bold text-[10px]"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span className="hidden xl:inline">Test Tools</span>
                            </button>
                          )}

                          {/* Read-only Inspect */}
                          <button
                            onClick={() => handleViewCompany(c)}
                            title="Kagua Data za Kampuni (Read-Only Mode yenye Audit Log)"
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 rounded-lg"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Record Payment */}
                          <button
                            onClick={() => {
                              setSelectedCompanyForPayment(c);
                              setIsPaymentModalOpen(true);
                            }}
                            title="Rekodi Malipo ya Mwezi"
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 text-emerald-600 rounded-lg"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => {
                              setEditingCompany(c);
                              setIsCompanyModalOpen(true);
                            }}
                            title="Hariri Kampuni"
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Suspend / Unsuspend */}
                          <button
                            onClick={() => handleToggleSuspend(c)}
                            title={c.status === 'suspended' ? 'Fungua Huduma (Reactivate)' : 'Simamisha Huduma (Suspend)'}
                            className={`p-1.5 rounded-lg ${
                              c.status === 'suspended'
                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                            }`}
                          >
                            {c.status === 'suspended' ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteCompany(c)}
                            title="Futa Kampuni"
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/30 dark:hover:bg-rose-900/50 text-rose-600 rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* =================================================================== */}
      {/* 3. SAAS PLANS TAB */}
      {/* =================================================================== */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Mipango ya usajili wa KaziDesk kwa makampuni ya Tanzania. Kila mpango unadhibiti idadi ya wafanyakazi na ankara.
            </p>
            <button
              onClick={() => {
                setEditingPlan(null);
                setIsPlanModalOpen(true);
              }}
              className="px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tengeneza Mpango Mpya</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map(p => (
              <div key={p.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between shadow-sm space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">{p.name}</h3>
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-600 rounded text-[10px] font-bold">
                      {p.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </div>

                  <div className="mt-3">
                    <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                      {formatCurrency(p.priceMonthlyTZS, 'TZS')}
                    </span>
                    <span className="text-xs text-slate-400"> / kwa mwezi</span>
                  </div>

                  <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Upeo wa Wafanyakazi:</span>
                      <strong className="text-slate-900 dark:text-white">{p.maxStaff} staff</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Ankara kwa Mwezi:</span>
                      <strong className="text-slate-900 dark:text-white">{p.maxInvoicesPerMonth} inv/mo</strong>
                    </div>
                  </div>

                  <div className="mt-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    {p.features?.map((f, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      setEditingPlan(p);
                      setIsPlanModalOpen(true);
                    }}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Hariri Mpango Huu</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 4. BILLING & PAYMENTS TAB */}
      {/* =================================================================== */}
      {activeTab === 'billing' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Rekodi Zote za Malipo ya Usajili ya Makampuni
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 uppercase text-[10px] font-bold">
                <tr>
                  <th className="py-3 px-3">Risiti #</th>
                  <th className="py-3 px-3">Tarehe</th>
                  <th className="py-3 px-3">Kampuni</th>
                  <th className="py-3 px-3">Kiasi (TZS)</th>
                  <th className="py-3 px-3">Njia</th>
                  <th className="py-3 px-3">Kumbukumbu / Ref</th>
                  <th className="py-3 px-3">Iliendelezwa Hadi</th>
                  <th className="py-3 px-3">Imerekodiwa Na</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {payments.map(p => (
                  <tr key={p.id}>
                    <td className="py-3 px-3 font-mono font-bold text-emerald-600">{p.receiptNo}</td>
                    <td className="py-3 px-3">{p.date}</td>
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">{p.companyName}</td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                      {formatCurrency(p.amountTZS, 'TZS')}
                    </td>
                    <td className="py-3 px-3 uppercase font-semibold text-slate-600 dark:text-slate-300">
                      {p.paymentMethod}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-500">{p.referenceNo}</td>
                    <td className="py-3 px-3 font-mono text-emerald-600 font-bold">{p.newDueDate}</td>
                    <td className="py-3 px-3 text-slate-500 text-[11px]">{p.recordedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 5. PLATFORM SETTINGS TAB */}
      {/* =================================================================== */}
      {activeTab === 'settings' && settings && (
        <form onSubmit={handleSaveSettings} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-6 max-w-3xl">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Mipangilio ya Jukwaa & Njia za Kupokea Malipo
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Maelezo haya yanaonekana kwa makampuni yote wakati wa kulipia usajili wa KaziDesk.
            </p>
          </div>

          {settingsError && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-500 flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{settingsError}</span>
            </div>
          )}

          {/* Unified Platform Support Contacts Section */}
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-3">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                {lang === 'sw' ? 'Mawasiliano Rasmi ya Jukwaa (Platform Support Contacts)' : 'Official Platform Support Contacts'}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              {lang === 'sw'
                ? 'Mawasiliano haya yanasomwa na kuonekana kwenye skrini zote za mfumo (Login, Usajili/KYC, Moduli Zilizofungwa, Maelezo ya Malipo, Stakabadhi, Mwongozo, na Skrini ya Kusimamishwa).'
                : 'These contacts are read dynamically across all screens (Login, Registration/KYC, Locked Modules, Payment Instructions, Receipts, Help Guide, and Suspended Screen).'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'sw' ? 'WhatsApp ya Msaada (Support WhatsApp)' : 'Support WhatsApp'}
                </label>
                <input
                  type="text"
                  name="supportWhatsApp"
                  defaultValue={settings.supportWhatsApp || settings.ownerPhone || '+255775740386'}
                  placeholder="+255775740386"
                  required
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-mono font-bold text-emerald-600"
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  {lang === 'sw' ? 'Muundo wa Tanzania (+255 ikifuatiwa na tarakimu 9, mfano: +255775740386).' : 'Tanzanian format (+255 followed by 9 digits, e.g. +255775740386).'}
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'sw' ? 'Barua Pepe ya Msaada (Support Email)' : 'Support Email'}
                </label>
                <input
                  type="email"
                  name="supportEmail"
                  defaultValue={settings.supportEmail || settings.ownerEmail || 'support.zynettechtz@gmail.com'}
                  placeholder="support.zynettechtz@gmail.com"
                  required
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-medium"
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  {lang === 'sw' ? 'Barua pepe rasmi ya kupokea maombi ya msaada na uthibitisho wa malipo.' : 'Official support email for customer assistance and payment slips.'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Jina la Kampuni Yako (Provider)</label>
              <input
                type="text"
                name="ownerCompanyName"
                defaultValue={settings.ownerCompanyName}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Lipa Namba (M-Pesa / Tigo Pesa)</label>
              <input
                type="text"
                name="mpesaLipaNamba"
                defaultValue={settings.mpesaLipaNamba}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-mono font-bold text-emerald-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Muda wa Nyongeza (Grace Period Days)</label>
              <input
                type="number"
                name="gracePeriodDays"
                defaultValue={settings.gracePeriodDays}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
              />
              <span className="text-[10px] text-slate-400">Siku kabla ya akaunti kusimamishwa kiotomatiki (Chaguomsingi: 7)</span>
            </div>

            <div className="sm:col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase block mb-3">
                Taarifa za Benki ya Kupokea Fedha
              </span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Jina la Benki</label>
              <input
                type="text"
                name="bankName"
                defaultValue={settings.bankName}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Namba ya Akaunti</label>
              <input
                type="text"
                name="bankAccountNumber"
                defaultValue={settings.bankAccountNumber}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Jina la Akaunti (Account Name)</label>
              <input
                type="text"
                name="bankAccountName"
                defaultValue={settings.bankAccountName}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tawi la Benki (Branch)</label>
              <input
                type="text"
                name="bankBranch"
                defaultValue={settings.bankBranch}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-medium"
              />
            </div>

            <div className="sm:col-span-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase block mb-3">
                Chapa ya Jukwaa (Platform Branding)
              </span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Jina la Jukwaa (Platform Name)</label>
              <input
                type="text"
                name="platformName"
                defaultValue={settings.platformName || 'KaziDesk'}
                placeholder="Mf. KaziDesk"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Logo URL ya Jukwaa (Platform Logo URL)</label>
              <input
                type="url"
                name="platformLogoUrl"
                defaultValue={settings.platformLogoUrl || ''}
                placeholder="https://... (Wacha tupu kutumia default)"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-[11px]"
              />
            </div>

            <div className="sm:col-span-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase block mb-1">
                Vigezo vya Huduma & Sera ya Faragha (Terms & Privacy)
              </span>
              <p className="text-[11px] text-slate-500 mb-3">
                Wateja wataona na kukubali vigezo hivi wanaposajili kampuni mpya au kubofya viungo vya faragha.
              </p>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Vigezo vya Huduma (Terms of Service)</label>
              <textarea
                name="termsOfService"
                defaultValue={settings.termsOfService}
                rows={5}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-[11px] leading-relaxed"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Sera ya Faragha (Privacy Policy)</label>
              <textarea
                name="privacyPolicy"
                defaultValue={settings.privacyPolicy}
                rows={5}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-[11px] leading-relaxed"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md"
            >
              <Save className="w-4 h-4" />
              <span>Hifadhi Mipangilio</span>
            </button>
          </div>
        </form>
      )}

      {/* =================================================================== */}
      {/* 6. AUDIT LOG TAB */}
      {/* =================================================================== */}
      {activeTab === 'audit' && (
        <AuditLogsView companies={companies} lang={lang} />
      )}

      {/* =================================================================== */}
      {/* 7. SUPPORT TICKETS TAB (PLATFORM OWNER PORTAL) */}
      {/* =================================================================== */}
      {activeTab === 'tickets' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Tiketi Zote za Msaada za Makampuni (Support Desk)
              </h3>
              <p className="text-xs text-slate-400">
                Tazama na jibu maombi ya wateja kutoka kwa makampuni yote yanayotumia KaziDesk.
              </p>
            </div>
            <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full font-mono text-xs text-slate-600 dark:text-slate-300 font-bold">
              {supportTickets.length} Tiketi
            </span>
          </div>

          {supportTickets.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              Hakuna tiketi za msaada zilizofunguliwa bado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="py-3 px-3">Tiketi #</th>
                    <th className="py-3 px-3">Kampuni</th>
                    <th className="py-3 px-3">Mhusika (User)</th>
                    <th className="py-3 px-3">Mada (Subject)</th>
                    <th className="py-3 px-3">Aina / Priority</th>
                    <th className="py-3 px-3">Hali (Status)</th>
                    <th className="py-3 px-3">Tarehe</th>
                    <th className="py-3 px-3 text-right">Kitendo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {supportTickets.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-3 font-mono font-bold text-emerald-600">{t.id}</td>
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">{t.companyName}</td>
                      <td className="py-3 px-3">
                        <span className="block font-semibold">{t.userName}</span>
                        <span className="text-[10px] text-slate-400">{t.userEmail}</span>
                      </td>
                      <td className="py-3 px-3 max-w-xs truncate font-medium">{t.subject}</td>
                      <td className="py-3 px-3 uppercase text-[10px] font-bold text-slate-500">
                        {t.category} · {t.priority}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          t.status === 'open' ? 'bg-amber-100 text-amber-800' :
                          t.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-emerald-100 text-emerald-800'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-[10px] text-slate-400">
                        {t.createdAt?.substring(0, 10)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => setSelectedTicketForReply(t)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors"
                        >
                          Fungua & Jibu
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Owner Reply Modal */}
          {selectedTicketForReply && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
              <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl shadow-2xl p-6 border border-slate-200 dark:border-slate-800 my-8 space-y-4">
                <div className="flex justify-between items-start pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="font-mono text-[10px] text-slate-400 block">{selectedTicketForReply.id} · {selectedTicketForReply.companyName}</span>
                    <h3 className="font-black text-base text-slate-900 dark:text-white">{selectedTicketForReply.subject}</h3>
                    <span className="text-xs text-slate-500">Kutoka: {selectedTicketForReply.userName} ({selectedTicketForReply.userEmail})</span>
                  </div>
                  <button onClick={() => setSelectedTicketForReply(null)} className="text-slate-400">✕</button>
                </div>

                <div className="space-y-3 max-h-72 overflow-y-auto p-2">
                  {(selectedTicketForReply.messages || []).map((msg: any) => (
                    <div
                      key={msg.id}
                      className={`p-3.5 rounded-2xl text-xs space-y-1 ${
                        msg.isOwnerReply
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 ml-6'
                          : 'bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 mr-6'
                      }`}
                    >
                      <div className="flex justify-between items-center text-[10px] text-slate-400">
                        <strong className={msg.isOwnerReply ? 'text-emerald-700 dark:text-emerald-300 font-bold' : 'text-slate-700 dark:text-slate-300 font-bold'}>
                          {msg.senderName} {msg.isOwnerReply && '(KaziDesk Platform Owner)'}
                        </strong>
                        <span className="font-mono">{msg.timestamp?.substring(0, 16).replace('T', ' ')}</span>
                      </div>
                      <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium">{msg.message}</p>
                    </div>
                  ))}
                </div>

                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (!ownerReplyText.trim()) return;

                  const newMsg = {
                    id: `MSG-${Date.now()}`,
                    senderUid: 'owner-superadmin',
                    senderName: 'Platform Support Engineer',
                    senderEmail: settings?.ownerEmail || 'support.zynettechtz@gmail.com',
                    isOwnerReply: true,
                    message: ownerReplyText.trim(),
                    timestamp: new Date().toISOString(),
                  };

                  const updatedMessages = [...(selectedTicketForReply.messages || []), newMsg];
                  await setDoc(doc(db, 'supportTickets', selectedTicketForReply.id), {
                    messages: updatedMessages,
                    status: 'resolved',
                    updatedAt: new Date().toISOString(),
                  }, { merge: true });

                  setOwnerReplyText('');
                  showNotification('Jibu lako limetumwa kwa mteja na tiketi imewekwa Resolved!');
                  setSelectedTicketForReply(null);
                  loadAllData();
                }} className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <textarea
                    rows={3}
                    value={ownerReplyText}
                    onChange={e => setOwnerReplyText(e.target.value)}
                    placeholder="Andika jibu rasmi kutoka kwa mmiliki wa jukwaa..."
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedTicketForReply(null)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                    >
                      Funga
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md"
                    >
                      Tuma Jibu & Kamilisha Tiketi
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: ADD / EDIT COMPANY */}
      {/* =================================================================== */}
      {isCompanyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-xl shadow-2xl p-6 border border-slate-200 dark:border-slate-800 my-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {editingCompany ? 'Hariri Taarifa za Kampuni' : 'Sajili Kampuni Mpya KaziDesk'}
              </h3>
              <button onClick={() => setIsCompanyModalOpen(false)}><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSaveCompany} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Jina Kamili la Kampuni *</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingCompany?.name || ''}
                  required
                  placeholder="Mf. Twiga Logistics Ltd"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">TIN Number *</label>
                  <input
                    type="text"
                    name="tin"
                    defaultValue={editingCompany?.tin || ''}
                    required
                    placeholder="123-456-789"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Mtu wa Mawasiliano (Admin Name) *</label>
                  <input
                    type="text"
                    name="contactPerson"
                    defaultValue={editingCompany?.contactPerson || ''}
                    required
                    placeholder="Jina la Mkurugenzi / HR"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Barua Pepe ya Kampuni / Admin *</label>
                  <input
                    type="email"
                    name="email"
                    defaultValue={editingCompany?.email || ''}
                    required
                    placeholder="admin@kampuni.co.tz"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Namba ya Simu *</label>
                  <input
                    type="text"
                    name="phone"
                    defaultValue={editingCompany?.phone || ''}
                    required
                    placeholder="+255 754 ..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Anuani ya Ofisi / Mji</label>
                <input
                  type="text"
                  name="address"
                  defaultValue={editingCompany?.address || ''}
                  placeholder="Posta Mpya, Mtaa wa Samora, Dar es Salaam"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Mpango wa Usajili (Plan) *</label>
                <select
                  name="planId"
                  defaultValue={editingCompany?.planId || 'growth'}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
                >
                  {plans.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {formatCurrency(p.priceMonthlyTZS, 'TZS')}/mwezi (Max {p.maxStaff} staff)
                    </option>
                  ))}
                </select>
              </div>

              {!editingCompany && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl">
                  <label className="block font-bold text-amber-900 dark:text-amber-300 mb-1">
                    Nenosiri la Awali (Temporary Password)
                  </label>
                  <input
                    type="text"
                    name="tempPassword"
                    defaultValue="KaziDesk2026!"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 rounded-lg border border-amber-300 dark:border-amber-700 font-mono text-xs"
                  />
                  <span className="text-[10px] text-amber-800 dark:text-amber-400 mt-1 block">
                    Mtumiaji huyu atalazimishwa kubadilisha nenosiri mara ya kwanza atakapoingia.
                  </span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCompanyModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold"
                >
                  Ghairi
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md"
                >
                  {editingCompany ? 'Hifadhi Mabadiliko' : 'Kamilisha Usajili'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: RECORD SUBSCRIPTION PAYMENT */}
      {/* =================================================================== */}
      {isPaymentModalOpen && selectedCompanyForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl p-6 border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Rekodi Malipo ya Usajili
                </h3>
                <span className="text-xs text-emerald-600 font-bold block">{selectedCompanyForPayment.name}</span>
              </div>
              <button onClick={() => setIsPaymentModalOpen(false)}><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Kiasi Kilicholipwa (TZS) *</label>
                {(() => {
                  const plan = plans.find(p => p.id === selectedCompanyForPayment.planId);
                  const defaultPrice = plan?.priceMonthlyTZS || 350000;
                  return (
                    <input
                      type="number"
                      name="amountTZS"
                      defaultValue={defaultPrice}
                      required
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-mono font-bold text-base text-emerald-600"
                    />
                  );
                })()}
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Njia ya Malipo (Payment Method) *</label>
                <select
                  name="paymentMethod"
                  defaultValue="mpesa"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold"
                >
                  <option value="mpesa">Vodacom M-Pesa (Lipa Namba)</option>
                  <option value="tigopesa">Tigo Pesa</option>
                  <option value="airtelmoney">Airtel Money</option>
                  <option value="bank">Benki (CRDB Bank)</option>
                  <option value="cash">Fedha Taslimu (Cash)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Namba ya Kumbukumbu / Reference No *</label>
                <input
                  type="text"
                  name="referenceNo"
                  required
                  placeholder="Mf. QWE892189 au Slip No"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Maelezo ya Ziada (Notes)</label>
                <input
                  type="text"
                  name="notes"
                  placeholder="Mf. Malipo ya mwezi Machi 2026"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300">
                Kurekodi malipo haya kutaongeza siku 30 kwenye tarehe ya mwisho ya kampuni hii na kutoa stakabadhi rasmi kiotomatiki.
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold"
                >
                  Ghairi
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md"
                >
                  Thibitisha & Toa Stakabadhi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: NEW COMPANY ADMIN CREDENTIALS DISPLAY */}
      {/* =================================================================== */}
      {newCompanyAdminCreds && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl p-6 border-2 border-emerald-500 text-slate-900 dark:text-white text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-600 mx-auto flex items-center justify-center mb-3">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <h3 className="text-lg font-black mb-1">
              Kampuni Imesajiliwa Kikamilifu!
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Mpe mteja wa <strong>{newCompanyAdminCreds.companyName}</strong> taarifa zifuatazo za kuingia:
            </p>

            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl text-left space-y-2 border border-slate-200 dark:border-slate-700 text-xs font-mono">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Barua Pepe (Email):</span>
                <strong className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{newCompanyAdminCreds.email}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Nenosiri la Awali:</span>
                <strong className="text-sm font-bold text-slate-900 dark:text-white">{newCompanyAdminCreds.pass}</strong>
              </div>
            </div>

            <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-3 italic">
              Mfumo utamlazimisha kubadilisha nenosiri mara ya kwanza atakapoingia.
            </p>

            <button
              onClick={() => setNewCompanyAdminCreds(null)}
              className="mt-5 w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs"
            >
              Nimehifadhi / Funga
            </button>
          </div>
        </div>
      )}

      {/* Sandbox System Test Suite Modal (Restricted to Owner Portal) */}
      <SaaSTestSuiteModal
        isOpen={isTestSuiteOpen}
        onClose={() => setIsTestSuiteOpen(false)}
      />

    </div>
  );
};
