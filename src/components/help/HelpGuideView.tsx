/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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
  ExternalLink
} from 'lucide-react';
import { PlatformSettings } from '../../types/saas';

interface HelpGuideViewProps {
  lang: 'sw' | 'en';
  settings?: PlatformSettings | null;
  onNavigateTab: (tab: string) => void;
}

export const HelpGuideView: React.FC<HelpGuideViewProps> = ({
  lang,
  settings,
  onNavigateTab,
}) => {
  const [search, setSearch] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string>('billing');

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
      id: 'payroll',
      icon: Wallet,
      titleSw: 'Mishahara & Malipo (Payroll & Deductions)',
      titleEn: 'Payroll & Statutory Deductions',
      descSw: 'Mahesabu ya mishahara ya kila mwezi, makato ya kisheria (NSSF 10%, PAYE, NHIF), na stakabadhi za mishahara (Payslips).',
      descEn: 'Monthly payroll runs, statutory deductions (NSSF 10%, PAYE, NHIF), and downloadable payslips.',
      stepsSw: [
        '1. Kwenye kichupo cha "Payroll", kagua mishahara ya msingi, posho, na makato ya wafanyakazi wote.',
        '2. Mfumo huhesabu kiotomatiki makato ya kisheria ya Tanzania (NSSF, PAYE ya TRA, na NHIF).',
        '3. Bonyeza "Idhinisha Mwezi" kisha "Lipa Mishahara Yote" (Disburse All).',
        '4. Chapisha au pakua hati ya mshahara (Payslip) binafsi kwa kila mfanyakazi.',
      ],
      stepsEn: [
        '1. In the Payroll tab, review base salaries, allowances, and statutory deductions for all employees.',
        '2. The system automatically computes statutory Tanzania deductions (NSSF, TRA PAYE, and NHIF).',
        '3. Click "Approve Month" followed by "Disburse All".',
        '4. Print or export individual employee payslips with full breakdown.',
      ],
      targetTab: 'payroll',
    },
    {
      id: 'assets',
      icon: Package,
      titleSw: 'Vifaa, Mali & Stoo (Inventory Management)',
      titleEn: 'Assets & Inventory Tracking',
      descSw: 'Usimamizi wa vifaa vya ofisi (Asset Tagging), stoo ya bidhaa zinazotumika (consumables), na kutoa bidhaa.',
      descEn: 'Office asset tagging, consumable inventory levels, stock in/out tracking, and automatic deduction upon invoice.',
      stepsSw: [
        '1. Sajili kompyuta, fanicha, na magari na weka lebo ya utambulisho (mf. KD-AST-0104).',
        '2. Fuatilia vifaa vya stoo kama karatasi, wino, au bidhaa unazouza.',
        '3. Unganisha bidhaa ya stoo na Orodha ya Mauzo ili stoo ipungue kiotomatiki wakati ankara inapotengenezwa.',
      ],
      stepsEn: [
        '1. Register computers, furniture, and vehicles with unique asset tags (e.g. KD-AST-0104).',
        '2. Track consumable items such as paper, toner, or merchandise inventory.',
        '3. Link inventory items to the sales catalogue so stock levels decrement automatically upon invoicing.',
      ],
      targetTab: 'assets',
    },
    {
      id: 'backup',
      icon: DownloadCloud,
      titleSw: 'Usalama, Backup & Kurejesha Data (Backup & Restore)',
      titleEn: 'Data Safety, Backup & Restore',
      descSw: 'Jinsi ya kupakua nakala kamili ya data za kampuni yako (JSON) na kuirejesha wakati wowote.',
      descEn: 'How to export a complete JSON backup of your company data and restore it at any time.',
      stepsSw: [
        '1. Kwenye sehemu ya chini ya ukurasa (Footer), bonyeza "Pakua Backup ya Kampuni".',
        '2. Mfumo utakusanya wafanyakazi, ankara, stoo, na nyaraka zote za kampuni yako na kupakua faili salama la JSON.',
        '3. Iwapo utahitaji kurejesha data, tumia kitufe cha "Rejesha Data (Restore)" na chagua faili lako la backup.',
        '4. Data za kampuni yako zimetengwa kwa 100% na hazichanganyiki na kampuni nyingine.',
      ],
      stepsEn: [
        '1. In the application footer, click "Download Company Backup".',
        '2. The system packages your company employees, invoices, inventory, and records into a secure JSON file.',
        '3. If you ever need to restore, use the "Restore Backup" button and select your JSON backup file.',
        '4. Your company dataset is 100% isolated and never touches any other tenant partition.',
      ],
      targetTab: 'dashboard',
    },
  ];

  const filteredGuides = guides.filter(g =>
    g.titleSw.toLowerCase().includes(search.toLowerCase()) ||
    g.titleEn.toLowerCase().includes(search.toLowerCase()) ||
    g.descSw.toLowerCase().includes(search.toLowerCase())
  );

  const activeGuide = guides.find(g => g.id === selectedTopic) || guides[0];

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-wider text-emerald-100 border border-white/20">
              KaziDesk Knowledge Base
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            {lang === 'sw' ? 'Mwongozo Kamili wa KaziDesk' : 'KaziDesk Complete User Guide'}
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
            {lang === 'sw'
              ? 'Jifunze jinsi ya kutumia moduli zote za KaziDesk kuendesha biashara yako, kutoa ankara, kusimamia wafanyakazi, na kuhifadhi data salama.'
              : 'Learn how to utilize all KaziDesk modules to manage business operations, issue invoices, track staff, and secure company data.'}
          </p>

          {/* Quick Search */}
          <div className="pt-2">
            <div className="relative max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={lang === 'sw' ? 'Tafuta mada, mfano: ankara, likizo, stoo, backup...' : 'Search guide topics...'}
                className="w-full pl-10 pr-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-xs text-white placeholder-emerald-100/60 focus:bg-white/20 transition-all outline-none"
              />
            </div>
          </div>
        </div>

        {/* Subtle decorative glow */}
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-gradient-to-l from-white/10 to-transparent pointer-events-none" />
      </div>

      {/* Main Grid: Topic Selector + Topic Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Topic Tabs */}
        <div className="lg:col-span-4 space-y-2">
          {filteredGuides.map(item => {
            const Icon = item.icon;
            const isSelected = selectedTopic === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSelectedTopic(item.id)}
                className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
                  isSelected
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/50 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className={`p-2.5 rounded-xl shrink-0 ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`text-xs font-bold leading-snug truncate ${
                    isSelected ? 'text-emerald-950 dark:text-emerald-200' : 'text-slate-800 dark:text-slate-200'
                  }`}>
                    {lang === 'sw' ? item.titleSw : item.titleEn}
                  </h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                    {lang === 'sw' ? item.descSw : item.descEn}
                  </p>
                </div>
                <ChevronRight className={`w-4 h-4 mt-2 shrink-0 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
              </button>
            );
          })}
        </div>

        {/* Right Side: Step-by-Step Instructions */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <activeGuide.icon className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                  {lang === 'sw' ? 'MWONGOZO WA HATUA KWA HATUA' : 'STEP-BY-STEP WALKTHROUGH'}
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {lang === 'sw' ? activeGuide.titleSw : activeGuide.titleEn}
                </h3>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab(activeGuide.targetTab)}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <span>{lang === 'sw' ? 'Fungua Sehemu Hii' : 'Open Module'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              {lang === 'sw' ? 'Hatua za Utekelezaji:' : 'Execution Steps:'}
            </span>
            <div className="space-y-2.5">
              {(lang === 'sw' ? activeGuide.stepsSw : activeGuide.stepsEn).map((st, i) => (
                <div key={i} className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <p className="leading-relaxed font-medium">{st}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Platform Owner Direct Support Info */}
          <div className="p-5 bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <strong className="text-xs font-bold block">
                  {lang === 'sw' ? 'Unahitaji Msaada Zaidi wa Kiufundi?' : 'Need Technical Assistance?'}
                </strong>
                <span className="text-[11px] text-slate-400">
                  {settings?.ownerCompanyName || 'ZynetTech Tanzania Ltd'} (KaziDesk Support Team)
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              {(() => {
                const supportPhone = settings?.supportWhatsApp || settings?.ownerPhone || '+255775740386';
                const cleanWhatsApp = supportPhone.replace(/[^0-9]/g, '');
                const supportEmail = settings?.supportEmail || settings?.ownerEmail || 'support.zynettechtz@gmail.com';

                return (
                  <>
                    <a
                      href={`https://wa.me/${cleanWhatsApp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold flex items-center gap-1.5 text-emerald-400 border border-slate-700 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>WhatsApp: {supportPhone.split('/')[0].trim()}</span>
                    </a>
                    <a
                      href={`mailto:${supportEmail}`}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>{supportEmail}</span>
                    </a>
                  </>
                );
              })()}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
