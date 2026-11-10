/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  BookOpen,
  FileCheck,
  CalendarCheck,
  Users,
  Wallet,
  Package,
  Video,
  TrendingUp,
  DownloadCloud,
  ShieldCheck,
  Phone,
  Mail,
  Search,
  ChevronRight,
  Sparkles,
  ExternalLink,
  MessageSquare,
  Plus,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  LifeBuoy,
  Layers,
  Check,
  Info
} from 'lucide-react';
import { PlatformSettings } from '../../types/saas';
import { SupportTicket, TicketMessage, TicketPriority, TicketCategory, OnboardingStepItem } from '../../types/meetingsHelp';
import { db } from '../../firebase/config';
import { collection, onSnapshot, doc, setDoc, query, orderBy, where } from 'firebase/firestore';

interface ComprehensiveHelpGuideViewProps {
  companyId: string;
  companyName: string;
  lang: 'sw' | 'en';
  currentUser: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  settings?: PlatformSettings | null;
  onNavigateTab: (tab: string) => void;
}

export const ComprehensiveHelpGuideView: React.FC<ComprehensiveHelpGuideViewProps> = ({
  companyId,
  companyName,
  lang,
  currentUser,
  settings,
  onNavigateTab
}) => {
  const isSw = lang === 'sw';

  // Sub-tabs: 'kb' (Knowledge Base) | 'tickets' (Support Tickets) | 'checklist' (Getting Started) | 'about' (Status & Changelog)
  const [activeTab, setActiveTab] = useState<'kb' | 'tickets' | 'checklist' | 'about'>('kb');

  // Search & Knowledge Base state
  const [search, setSearch] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string>('billing');

  // Tickets state
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [ticketReplyText, setTicketReplyText] = useState('');
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Getting Started Checklist state (stored in localStorage or Firestore per company)
  const [checklist, setChecklist] = useState<OnboardingStepItem[]>(() => {
    const saved = localStorage.getItem(`kazidesk_checklist_${companyId}`);
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return [
      { id: 'step-1', titleSw: 'Weka Taarifa & Nembo ya Kampuni', titleEn: 'Set Company Profile & Logo', descSw: 'Weka TIN, anwani na nembo kwenye Company Profile.', descEn: 'Configure TIN, address and logo.', targetTab: 'quotations', isCompleted: true },
      { id: 'step-2', titleSw: 'Sajili Mfanyakazi wa Kwanza', titleEn: 'Add First Staff Member', descSw: 'Ingiza mfanyakazi mpya kwenye Staff Directory.', descEn: 'Onboard a staff member in Employees directory.', targetTab: 'employees', isCompleted: true },
      { id: 'step-3', titleSw: 'Tengeneza Nukuu ya Kwanza ya Bei', titleEn: 'Create First Quotation', descSw: 'Zalisha nukuu (Quotation) yenye hesabu ya VAT 18%.', descEn: 'Issue a quotation with automatic 18% VAT calculation.', targetTab: 'quotations', isCompleted: false },
      { id: 'step-4', titleSw: 'Badili Nukuu Kuwa Ankara (Invoice)', titleEn: 'Convert Quotation to Invoice', descSw: 'Bonyeza kitufe kimoja kugeuza nukuu kuwa ankara rasmi.', descEn: '1-click convert quotation to an invoice.', targetTab: 'quotations', isCompleted: false },
      { id: 'step-5', titleSw: 'Saini Kuingia Ofisini (Clock-in)', titleEn: 'Clock-in at Office or Kiosk', descSw: 'Saini kuingia kupitia web au Kiosk terminal.', descEn: 'Clock in via web or Reception Kiosk terminal.', targetTab: 'attendance', isCompleted: false },
      { id: 'step-6', titleSw: 'Panga Mkutano wa Video (Live Meeting)', titleEn: 'Schedule a Video Meeting', descSw: 'Unda chumba cha video cha Jitsi na kualika washiriki.', descEn: 'Generate a video room and invite attendees.', targetTab: 'meetings', isCompleted: false },
    ];
  });

  const toggleChecklistStep = (stepId: string) => {
    const updated = checklist.map(s => s.id === stepId ? { ...s, isCompleted: !s.isCompleted } : s);
    setChecklist(updated);
    localStorage.setItem(`kazidesk_checklist_${companyId}`, JSON.stringify(updated));
  };

  const completedStepsCount = checklist.filter(s => s.isCompleted).length;
  const checklistProgressPercent = Math.round((completedStepsCount / checklist.length) * 100);

  const showNotification = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 3500);
  };

  // ---------------------------------------------------------------------------
  // REAL-TIME FIRESTORE LISTENER FOR USER TICKETS
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!companyId) return;
    setIsLoadingTickets(true);

    const isPlatformOwner = currentUser.role === 'superadmin' || currentUser.email === settings?.ownerEmail;
    const ticketsRef = collection(db, 'supportTickets');

    // Super admin sees all company tickets; tenant sees their company tickets
    const q = isPlatformOwner
      ? query(ticketsRef, orderBy('createdAt', 'desc'))
      : query(ticketsRef, where('companyId', '==', companyId));

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SupportTicket));
        // Sort descending in client if composite index not ready
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setTickets(list);
        setIsLoadingTickets(false);

        // Keep active ticket in sync
        if (activeTicket) {
          const fresh = list.find(t => t.id === activeTicket.id);
          if (fresh) setActiveTicket(fresh);
        }
      },
      error => {
        console.warn('Tickets listener notice:', error);
        setIsLoadingTickets(false);
      }
    );

    return () => unsubscribe();
  }, [companyId, currentUser, activeTicket?.id, settings?.ownerEmail]);

  // ---------------------------------------------------------------------------
  // CREATE SUPPORT TICKET
  // ---------------------------------------------------------------------------
  const handleCreateTicket = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const subject = fd.get('subject') as string;
    const category = fd.get('category') as TicketCategory;
    const priority = fd.get('priority') as TicketPriority;
    const initialDescription = fd.get('description') as string;

    const ticketId = `TCK-${Date.now()}`;
    const now = new Date().toISOString();

    const newTicket: SupportTicket = {
      id: ticketId,
      companyId,
      companyName,
      userUid: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      subject,
      category,
      priority,
      status: 'open',
      initialDescription,
      messages: [
        {
          id: `MSG-${Date.now()}`,
          senderUid: currentUser.id,
          senderName: currentUser.name,
          senderEmail: currentUser.email,
          isOwnerReply: false,
          message: initialDescription,
          timestamp: now,
        }
      ],
      createdAt: now,
      updatedAt: now,
    };

    try {
      await setDoc(doc(db, 'supportTickets', ticketId), newTicket);
      showNotification(isSw ? 'Tiketi yako imetumwa kwa Mtoa Huduma!' : 'Ticket submitted successfully!');
      setIsNewTicketModalOpen(false);
    } catch (err) {
      console.error('Error submitting ticket:', err);
      alert('Error submitting ticket');
    }
  };

  // ---------------------------------------------------------------------------
  // REPLY TO TICKET
  // ---------------------------------------------------------------------------
  const handleSendTicketReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !ticketReplyText.trim()) return;

    const isOwner = currentUser.role === 'superadmin' || currentUser.email === settings?.ownerEmail;
    const newMsg: TicketMessage = {
      id: `MSG-${Date.now()}`,
      senderUid: currentUser.id,
      senderName: currentUser.name,
      senderEmail: currentUser.email,
      isOwnerReply: isOwner,
      message: ticketReplyText.trim(),
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...(activeTicket.messages || []), newMsg];
    const newStatus = isOwner ? 'in_progress' : activeTicket.status;

    try {
      await setDoc(doc(db, 'supportTickets', activeTicket.id), {
        messages: updatedMessages,
        status: newStatus,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      setTicketReplyText('');
      showNotification(isSw ? 'Jibu limetumwa kikamilifu!' : 'Reply sent successfully!');
    } catch (err) {
      console.error('Error sending reply:', err);
    }
  };

  // ---------------------------------------------------------------------------
  // KNOWLEDGE BASE GUIDES
  // ---------------------------------------------------------------------------
  const guides = [
    {
      id: 'billing',
      icon: FileCheck,
      titleSw: 'Nukuu & Ankara (Quotations & Invoices)',
      titleEn: 'Quotations & Invoices Management',
      descSw: 'Jinsi ya kutengeneza nukuu, kubadili kuwa ankara kwa kubofya mara moja, kuhesabu VAT 18%, na kurekodi malipo ya awamu.',
      descEn: 'How to create quotations, 1-click convert to invoices, compute 18% VAT, and record partial/full client payments.',
      stepsSw: [
        '1. Sajili wateja na orodha ya bidhaa/huduma zako kwenye kichupo cha "Wateja" na "Orodha ya Bidhaa".',
        '2. Bonyeza "+ Nukuu Mpya" (New Quotation), chagua mteja na weka vipengele. VAT 18% na punguzo huhesabiwa papo hapo.',
        '3. Mteja akiridhia, bonyeza "Badili Kuwa Ankara" (Convert to Invoice). Mfumo utazalisha ankara yenye namba ya kipekee (mf. INV-2026-001).',
        '4. Rekodi malipo ya mteja (M-Pesa, Benki au Fedha Taslimu) ili mfumo upunguze salio (Balance Due) na kuweka hali kuwa "Paid".',
        '5. Chapa stakabadhi au pakua PDF yenye nembo, TIN, na eneo la sahihi na mhuri wa kampuni.',
      ],
      stepsEn: [
        '1. Register your clients and product/service catalogue in the Clients and Catalogue tabs.',
        '2. Click "+ New Quotation", select a client and add line items. 18% VAT and discounts calculate automatically.',
        '3. When client approves, click "Convert to Invoice". A unique auto-numbered invoice is created (e.g. INV-2026-001).',
        '4. Record client payments (M-Pesa, Bank, or Cash) to reduce balance due and mark status as Paid.',
        '5. Print official documents or download PDF complete with company logo, TIN, signature, and stamp area.',
      ],
      targetTab: 'quotations',
    },
    {
      id: 'attendance',
      icon: CalendarCheck,
      titleSw: 'Mahudhurio & Kituo cha Mapokezi (Kiosk)',
      titleEn: 'Attendance & Reception Kiosk',
      descSw: 'Kusaini kuingia/kutoka ofisini kwa kutumia web au Kituo cha Mapokezi (PIN, Smart Card, na Alama ya Kidole).',
      descEn: 'Clock in/out at the office using web dash or the Reception Kiosk (PIN, Smart ID Card, and Fingerprint).',
      stepsSw: [
        '1. Wafanyakazi wanaweza kusaini kuingia kwa kubonyeza kitufe cha "Saini Kuingia" kwenye upau wa juu.',
        '2. Fungua "Kiosk Terminal" kwenye kompyuta au kibao cha mapokezi (Reception Tablet).',
        '3. Mfanyakazi anaweza kusoma kadi yake ya Smart ID au kuweka PIN yake ya tarakimu 4 kusaini ndani ya sekunde 2.',
        '4. Idara ya Rasilimali Watu (HR) inaweza kukagua ripoti ya mahudhurio ya kila siku na kuidhinisha maombi ya likizo.',
      ],
      stepsEn: [
        '1. Employees can clock in directly via the "Clock In" button on the top navigation bar.',
        '2. Open the "Kiosk Terminal" on the reception desk computer or tablet.',
        '3. Staff members scan their digital Smart ID or enter their 4-digit PIN to clock in within 2 seconds.',
        '4. HR managers can review daily attendance logs and approve or reject leave requests in real time.',
      ],
      targetTab: 'attendance',
    },
    {
      id: 'meetings',
      icon: Video,
      titleSw: 'Mikutano ya Video & Screen Sharing (Jitsi)',
      titleEn: 'Live Video Meetings & Boardroom',
      descSw: 'Kupanga mikutano ya mtandao yenye vyumba vya video vilivyotengwa kwa kila kampuni, kurekodi kumbukumbu na maazimio.',
      descEn: 'Schedule meetings with unique Jitsi Meet video rooms, share screens, and track minutes and action items.',
      stepsSw: [
        '1. Nenda kwenye kichupo cha "Mikutano Live" na ubonyeze "+ Panga Mkutano Mpya".',
        '2. Weka mada, ajenda, tarehe, na chagua wafanyakazi watakaoshiriki.',
        '3. Bonyeza "Ingia Mkutano" ili kufungua video ya Jitsi moja kwa moja ndani ya mfumo.',
        '4. Wakati mkutano ukiendelea, bonyeza "Kumbukumbu" kurekodi maamuzi na maagizo ya kazi.',
        '5. Maagizo (action items) yanaweza kugeuzwa kuwa kazi rasmi kwenye moduli ya Majukumu kwa kubonyeza "Geuza Kuwa Task".',
      ],
      stepsEn: [
        '1. Navigate to "Live Meetings" and click "+ Schedule Meeting".',
        '2. Enter title, agenda, date/time, and pick attendees from staff directory.',
        '3. Click "Join Room" to open the embedded Jitsi video room directly.',
        '4. Record minutes and decisions made during the call.',
        '5. Turn action items directly into tasks on the Tasks & Workflow board with 1 click.',
      ],
      targetTab: 'meetings',
    },
    {
      id: 'permissions',
      icon: ShieldCheck,
      titleSw: 'Ruhusa, Mipaka & Udhibiti wa Watumiaji (RBAC)',
      titleEn: 'Access Control & Security Roles',
      descSw: 'Kusimamia wadhifa (Roles), jedwali la ruhusa (View, Create, Edit, Delete, Export, Approve), na kumbukumbu za ukaguzi.',
      descEn: 'Manage roles (Admin, HR, Accountant, Sales, Staff), action permissions matrix, and audit trails.',
      stepsSw: [
        '1. Nenda kwenye "Ruhusa & Mipaka" ili kuona orodha ya wadhifa wa kampuni.',
        '2. Kwenye kichupo cha "Jedwali la Ruhusa", weka alama ya vema kwenye vitendo vinavyoruhusiwa kwa kila moduli.',
        '3. Kwenye kichupo cha "Wafanyakazi & Akaunti", mpangie kila mfanyakazi wadhifa unaomfaa.',
        '4. Mfumo unahakikisha mtumiaji hawezi kuona wala kufanya kitu asichoruhusiwa, kwenye UI na pia kwenye kanuni za Firestore.',
        '5. Mabadiliko yote yanarekodiwa kwenye Audit Log na yanaweza kupakuliwa kama CSV.',
      ],
      stepsEn: [
        '1. Open "Access & Permissions" to review existing roles.',
        '2. Use the "Permissions Matrix" to toggle View/Create/Edit/Delete/Export/Approve permissions per module.',
        '3. In "Staff Accounts", assign roles to each employee.',
        '4. Permissions are strictly enforced in UI and Firestore rules.',
        '5. Audit logs track every change and can be exported as CSV.',
      ],
      targetTab: 'permissions',
    },
    {
      id: 'reports',
      icon: TrendingUp,
      titleSw: 'Ripoti za Kina za Uongozi (Management Reports)',
      titleEn: 'Management & Leadership Analytics',
      descSw: 'Kuchambua mapato halisi, ankara zilizochelewa, mahudhurio, mishahara, na utendaji wa mauzo kwa vipindi mbalimbali.',
      descEn: 'Analyze revenue, outstanding debt, attendance, payroll costs, and sales pipeline over custom periods.',
      stepsSw: [
        '1. Fungua "Ripoti za Uongozi" kutoka kwenye menyu ya juu.',
        '2. Chagua kipindi: Mwezi Huu, Mwezi Uliopita, Robo Mwaka (Quarter), au Weka Tarehe Maalum.',
        '3. Kagua takwimu za Fedha, Wafanyakazi (HR), Mauzo, na Stoo.',
        '4. Chapa ripoti au bonyeza "Pakua CSV Kamili" kwa ajili ya kufanya tathmini ya bodi au ukaguzi wa fedha.',
      ],
      stepsEn: [
        '1. Open "Management Reports" from the top navigation.',
        '2. Filter by This Month, Last Month, Quarter, Year, or Custom date range.',
        '3. Review Financial, HR, Sales, and Inventory metrics.',
        '4. Print or export full CSV report for executive and accounting review.',
      ],
      targetTab: 'reports',
    },
  ];

  const filteredGuides = guides.filter(g =>
    g.titleSw.toLowerCase().includes(search.toLowerCase()) ||
    g.titleEn.toLowerCase().includes(search.toLowerCase()) ||
    g.descSw.toLowerCase().includes(search.toLowerCase()) ||
    g.descEn.toLowerCase().includes(search.toLowerCase())
  );

  const activeGuide = guides.find(g => g.id === selectedTopic) || guides[0];

  return (
    <div className="space-y-6">

      {/* Toast Notification */}
      {notificationMsg && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-teal-900/40">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-teal-500/20 text-teal-300 rounded-full text-[11px] font-black uppercase tracking-wider border border-teal-500/30">
              KaziDesk Knowledge & Support Center
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            {isSw ? 'Mwongozo wa Mfumo & Huduma kwa Wateja' : 'Help & Knowledge Base'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            {isSw
              ? 'Miongozo ya hatua kwa hatua ya kila moduli, orodha ya kuanza (getting started checklist), na mfumo wa kutuma tiketi ya msaada wa moja kwa moja kwa Mtoa Huduma wa KaziDesk.'
              : 'Step-by-step guides for every module, getting started checklist, and live support ticket dispatch to the platform provider.'}
          </p>
        </div>

        <button
          onClick={() => setIsNewTicketModalOpen(true)}
          className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-xs shadow-lg flex items-center gap-2 transition-all active:scale-95 shrink-0"
        >
          <LifeBuoy className="w-4 h-4" />
          <span>{isSw ? '+ Tuma Tiketi ya Msaada' : '+ Open Support Ticket'}</span>
        </button>
      </div>

      {/* Sub-Tabs Navigation */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-2 shadow-sm flex flex-wrap gap-1.5">
        <button
          onClick={() => setActiveTab('kb')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'kb'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>{isSw ? 'Miongozo ya Moduli (Knowledge Base)' : 'Knowledge Base'}</span>
        </button>

        <button
          onClick={() => setActiveTab('tickets')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'tickets'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>{isSw ? 'Tiketi za Msaada (Support Tickets)' : 'Support Tickets'}</span>
          {tickets.filter(t => t.status === 'open').length > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-400" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('checklist')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'checklist'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{isSw ? 'Orodha ya Kuanza (Getting Started)' : 'Getting Started'}</span>
          <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-600 rounded text-[10px] font-mono">
            {checklistProgressPercent}%
          </span>
        </button>

        <button
          onClick={() => setActiveTab('about')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'about'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Info className="w-3.5 h-3.5" />
          <span>{isSw ? 'Hali ya Mfumo & Mawasiliano' : 'System & Contact'}</span>
        </button>
      </div>

      {/* =================================================================== */}
      {/* 1. KNOWLEDGE BASE TAB */}
      {/* =================================================================== */}
      {activeTab === 'kb' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Topics List with Search */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={isSw ? 'Tafuta mada ya mwongozo...' : 'Search guide topics...'}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
              />
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-3 shadow-sm space-y-1">
              {filteredGuides.map(g => {
                const Icon = g.icon;
                const isSelected = selectedTopic === g.id;
                return (
                  <button
                    key={g.id}
                    onClick={() => setSelectedTopic(g.id)}
                    className={`w-full p-3 rounded-2xl text-left flex items-start gap-3 transition-all ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 shadow-xs'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className={`p-2 rounded-xl shrink-0 ${isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 truncate">
                      <strong className="block text-xs font-bold truncate">
                        {isSw ? g.titleSw : g.titleEn}
                      </strong>
                      <span className="text-[10px] text-slate-400 line-clamp-1">
                        {isSw ? g.descSw : g.descEn}
                      </span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 mt-1 shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Guide Reader Content */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full inline-block mb-1.5">
                  Mwongozo Rasmi
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  {isSw ? activeGuide.titleSw : activeGuide.titleEn}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {isSw ? activeGuide.descSw : activeGuide.descEn}
                </p>
              </div>

              <button
                onClick={() => onNavigateTab(activeGuide.targetTab)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shrink-0 transition-all active:scale-95"
              >
                <span>{isSw ? 'Fungua Moduli Hii' : 'Open Module'}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">
                {isSw ? 'Hatua za Utekelezaji (Step-by-Step Instructions):' : 'Step-by-Step Instructions:'}
              </h4>
              <div className="space-y-3">
                {(isSw ? activeGuide.stepsSw : activeGuide.stepsEn).map((step, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/60 text-xs font-medium text-slate-800 dark:text-slate-200 leading-relaxed flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center shrink-0 text-xs">
                      {idx + 1}
                    </span>
                    <span>{step.substring(step.indexOf('.') + 1).trim()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* =================================================================== */}
      {/* 2. SUPPORT TICKETS TAB */}
      {/* =================================================================== */}
      {activeTab === 'tickets' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
            <div>
              <h3 className="font-black text-base text-slate-900 dark:text-white">
                {isSw ? 'Tiketi za Msaada wa Kiufundi na Malipo' : 'Support Tickets'}
              </h3>
              <p className="text-xs text-slate-500">
                {isSw
                  ? 'Tuma maombi au changamoto yoyote moja kwa moja kwa Mtoa Huduma wa KaziDesk. Majibu yanaonekana hapa kwa wakati halisi.'
                  : 'Submit tickets directly to KaziDesk platform engineers. Responses appear live.'}
              </p>
            </div>

            <button
              onClick={() => setIsNewTicketModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isSw ? 'Unda Tiketi Mpya' : 'Open Ticket'}</span>
            </button>
          </div>

          {isLoadingTickets ? (
            <div className="p-12 text-center text-xs text-slate-400">
              {isSw ? 'Inapakia tiketi...' : 'Loading tickets...'}
            </div>
          ) : tickets.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
              <LifeBuoy className="w-8 h-8 text-slate-400 mx-auto" />
              <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                {isSw ? 'Hakuna tiketi iliyofunguliwa bado' : 'No support tickets found'}
              </h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                {isSw ? 'Ukipata hitilafu yoyote au kuwa na swali la kibiashara, unaweza kuanzisha tiketi mpya hapa.' : 'Create a ticket whenever you need assistance.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {tickets.map(t => (
                <div
                  key={t.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-all"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        t.status === 'open' ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300' :
                        t.status === 'in_progress' ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300' :
                        'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                      }`}>
                        {t.status === 'open' ? 'Wazi (Open)' : t.status === 'in_progress' ? 'Inafanyiwa Kazi' : 'Imetatuliwa'}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">{t.id}</span>
                    </div>

                    <h4 className="font-black text-sm text-slate-900 dark:text-white line-clamp-1">{t.subject}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">{t.initialDescription}</p>

                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1 text-[11px] text-slate-500">
                      <div className="flex justify-between">
                        <span>Aina:</span>
                        <strong className="text-slate-800 dark:text-slate-200 font-bold uppercase">{t.category}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Kipaumbele:</span>
                        <strong className="text-slate-800 dark:text-slate-200 font-bold uppercase">{t.priority}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Majibu:</span>
                        <strong className="text-emerald-600 font-bold">{t.messages?.length || 1} ujumbe</strong>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTicket(t)}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors"
                  >
                    {isSw ? 'Fungua & Jibu' : 'View & Reply'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* 3. GETTING STARTED CHECKLIST TAB */}
      {/* =================================================================== */}
      {activeTab === 'checklist' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="space-y-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-500/10 px-3 py-1 rounded-full inline-block">
              Onboarding Checklist
            </span>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              {isSw ? 'Orodha ya Hatua Muhimu za Kuanza (Getting Started)' : 'Getting Started Checklist'}
            </h3>
            <p className="text-xs text-slate-500">
              {isSw ? 'Kamilisha hatua hizi 6 ili kuweka ofisi yako tayari kwa 100% kidijitali.' : 'Complete these 6 steps to achieve 100% digital office readiness.'}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-slate-700 dark:text-slate-300">Maendeleo ya Usanidi wa Kampuni:</span>
              <span className="text-emerald-600 font-mono">{checklistProgressPercent}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${checklistProgressPercent}%` }} />
            </div>
          </div>

          {/* Steps List */}
          <div className="space-y-3">
            {checklist.map(step => (
              <div
                key={step.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  step.isCompleted
                    ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleChecklistStep(step.id)}
                    className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                      step.isCompleted ? 'bg-emerald-600 text-white' : 'border-2 border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {step.isCompleted && <Check className="w-4 h-4 stroke-[3]" />}
                  </button>
                  <div>
                    <strong className={`block text-xs font-bold ${step.isCompleted ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                      {isSw ? step.titleSw : step.titleEn}
                    </strong>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                      {isSw ? step.descSw : step.descEn}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onNavigateTab(step.targetTab)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold shrink-0 self-start sm:self-auto flex items-center gap-1"
                >
                  <span>{isSw ? 'Nenda Kwenye Moduli' : 'Go to module'}</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 4. SYSTEM STATUS & CHANGELOG TAB */}
      {/* =================================================================== */}
      {activeTab === 'about' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-4">
            <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <span>{isSw ? 'Hali ya Mfumo & Huduma za Wingu' : 'System Status & Infrastructure'}</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl flex justify-between items-center">
                <span className="text-slate-600 dark:text-slate-400">Database (Firestore Multi-Tenant):</span>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-600 font-bold rounded-full text-[10px]">● Operational 100%</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl flex justify-between items-center">
                <span className="text-slate-600 dark:text-slate-400">Video Server (Jitsi Meet WebRTC):</span>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-600 font-bold rounded-full text-[10px]">● Online & Ready</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl flex justify-between items-center">
                <span className="text-slate-600 dark:text-slate-400">Version Release:</span>
                <strong className="font-mono text-slate-900 dark:text-white">v3.4.0 (Commercial Edition)</strong>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 space-y-2">
              <p>Mawasiliano ya Mtoa Huduma (Platform Provider):</p>
              <strong className="text-slate-900 dark:text-white block font-bold">{settings?.ownerCompanyName || 'ZynetTech Tanzania Ltd'}</strong>
              {(() => {
                const supportPhone = settings?.supportWhatsApp || settings?.ownerPhone || '+255775740386';
                const cleanWhatsApp = supportPhone.replace(/[^0-9]/g, '');
                const supportEmail = settings?.supportEmail || settings?.ownerEmail || 'support.zynettechtz@gmail.com';

                return (
                  <div className="flex flex-col gap-1.5 pt-1">
                    <a
                      href={`https://wa.me/${cleanWhatsApp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1.5 font-medium"
                    >
                      <Phone className="w-3.5 h-3.5 shrink-0" />
                      <span>WhatsApp: {supportPhone}</span>
                    </a>
                    <a
                      href={`mailto:${supportEmail}`}
                      className="text-slate-600 dark:text-slate-300 hover:underline flex items-center gap-1.5"
                    >
                      <Mail className="w-3.5 h-3.5 shrink-0" />
                      <span>Email: {supportEmail}</span>
                    </a>
                  </div>
                );
              })()}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-4">
            <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>{isSw ? 'Maboresho Mapya (What\'s New Changelog)' : 'What\'s New Changelog'}</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl space-y-1 border-l-4 border-emerald-500">
                <strong className="font-bold text-slate-900 dark:text-white block">v3.4.0 - Live Video Meetings & Minutes</strong>
                <span className="text-slate-500 block">Kuunganisha vyumba vya video vya Jitsi, kuandika muhtasari (minutes) na kugeuza maagizo kuwa majukumu ya ofisi.</span>
              </div>
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl space-y-1 border-l-4 border-indigo-500">
                <strong className="font-bold text-slate-900 dark:text-white block">v3.3.0 - Granular RBAC Permissions</strong>
                <span className="text-slate-500 block">Udhibiti wa wadhifa na jedwali kamili la ruhusa za View/Create/Edit/Delete/Export/Approve per module.</span>
              </div>
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl space-y-1 border-l-4 border-blue-500">
                <strong className="font-bold text-slate-900 dark:text-white block">v3.2.0 - Comprehensive Executive Reports</strong>
                <span className="text-slate-500 block">Ripoti halisi za fedha, mishahara, stoo, na mauzo zenye date range filter na CSV export.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: NEW SUPPORT TICKET */}
      {/* =================================================================== */}
      {isNewTicketModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl p-6 border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="font-black text-base text-slate-900 dark:text-white">
                {isSw ? 'Unda Tiketi Mpya ya Msaada' : 'Open Support Ticket'}
              </h3>
              <button onClick={() => setIsNewTicketModalOpen(false)} className="text-slate-400">✕</button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isSw ? 'Kichwa cha Somo (Subject) *' : 'Subject *'}
                </label>
                <input
                  type="text"
                  name="subject"
                  required
                  placeholder={isSw ? 'Mf. Swali kuhusu nukuu na VAT 18%' : 'e.g. Question about VAT'}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isSw ? 'Aina ya Changamoto' : 'Category'}
                  </label>
                  <select
                    name="category"
                    defaultValue="technical"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-medium"
                  >
                    <option value="technical">Kiufundi (Technical)</option>
                    <option value="billing">Malipo & Usajili (Billing)</option>
                    <option value="feature_request">Ombi la Feature Mpya</option>
                    <option value="training">Mafunzo (Training)</option>
                    <option value="other">Nyingine (Other)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isSw ? 'Kipaumbele' : 'Priority'}
                  </label>
                  <select
                    name="priority"
                    defaultValue="medium"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-medium"
                  >
                    <option value="low">Chini (Low)</option>
                    <option value="medium">Wastani (Medium)</option>
                    <option value="high">Kikubwa (High)</option>
                    <option value="urgent">Dharura (Urgent)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isSw ? 'Maelezo Kamili ya Changamoto *' : 'Detailed Description *'}
                </label>
                <textarea
                  name="description"
                  rows={4}
                  required
                  placeholder={isSw ? 'Eleza kwa undani changamoto au swali lako hapa...' : 'Describe your request...'}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 leading-relaxed"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewTicketModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold"
                >
                  {isSw ? 'Ghairi' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md"
                >
                  {isSw ? 'Tuma Tiketi' : 'Submit Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: TICKET THREAD & REPLIES */}
      {/* =================================================================== */}
      {activeTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl shadow-2xl p-6 border border-slate-200 dark:border-slate-800 my-8 space-y-4">
            <div className="flex justify-between items-start pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="font-mono text-[10px] text-slate-400 block">{activeTicket.id} · {activeTicket.category.toUpperCase()}</span>
                <h3 className="font-black text-base text-slate-900 dark:text-white">{activeTicket.subject}</h3>
                <span className="text-xs text-slate-500">Kutoka: {activeTicket.userName} ({activeTicket.companyName})</span>
              </div>
              <button onClick={() => setActiveTicket(null)} className="text-slate-400">✕</button>
            </div>

            {/* Messages Thread */}
            <div className="space-y-3 max-h-72 overflow-y-auto p-2">
              {(activeTicket.messages || []).map(msg => (
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
                      {msg.senderName} {msg.isOwnerReply && '(KaziDesk Platform Support)'}
                    </strong>
                    <span className="font-mono">{msg.timestamp.substring(0, 16).replace('T', ' ')}</span>
                  </div>
                  <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium">{msg.message}</p>
                </div>
              ))}
            </div>

            {/* Reply Form */}
            <form onSubmit={handleSendTicketReply} className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <textarea
                rows={3}
                value={ticketReplyText}
                onChange={e => setTicketReplyText(e.target.value)}
                placeholder={isSw ? 'Andika jibu au maelezo ya ziada hapa...' : 'Type reply...'}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTicket(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                >
                  {isSw ? 'Funga' : 'Close'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSw ? 'Tuma Jibu' : 'Send Reply'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
