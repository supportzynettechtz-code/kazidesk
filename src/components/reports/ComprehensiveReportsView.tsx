/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Coins,
  Download,
  FileSpreadsheet,
  FileText,
  KanbanSquare,
  Layers,
  Printer,
  TrendingUp,
  AlertTriangle,
  Building,
  Users,
  Award,
  Wallet,
  ArrowUpRight,
  Sparkles,
  PieChart,
  ShieldCheck,
  Check,
  DollarSign,
  Package,
  Video,
  Target,
  ArrowDownRight,
  Percent,
  Calendar
} from 'lucide-react';
import {
  AttendanceRecord,
  Employee,
  OfficeTask,
  PayrollRun,
  PettyCashVoucher,
  Invoice,
  Quotation,
  SalesLead,
  ConsumableItem,
  OfficeAsset
} from '../../types/office';
import { ScheduledMeeting } from '../../types/meetingsHelp';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  exportAttendanceToCSV,
  exportPayrollToCSV,
  exportPettyCashToCSV,
  exportManagementSummaryToCSV,
  ManagementSummaryData
} from '../../utils/csvExport';

interface ComprehensiveReportsViewProps {
  lang: 'sw' | 'en';
  currency: 'TZS' | 'USD';
  tasks: OfficeTask[];
  attendance: AttendanceRecord[];
  pettyCash: PettyCashVoucher[];
  employees: Employee[];
  payroll: PayrollRun;
  invoices?: Invoice[];
  quotations?: Quotation[];
  leads?: SalesLead[];
  consumables?: ConsumableItem[];
  assets?: OfficeAsset[];
  meetings?: ScheduledMeeting[];
  canViewReports?: boolean;
}

export const ComprehensiveReportsView: React.FC<ComprehensiveReportsViewProps> = ({
  lang,
  currency,
  tasks,
  attendance,
  pettyCash,
  employees,
  payroll,
  invoices = [],
  quotations = [],
  leads = [],
  consumables = [],
  assets = [],
  meetings = [],
  canViewReports = true
}) => {
  const isSw = lang === 'sw';

  // Date Range Filter Preset: 'month' | 'last_month' | 'quarter' | 'year' | 'custom'
  const [dateFilterPreset, setDateFilterPreset] = useState<'month' | 'last_month' | 'quarter' | 'year' | 'custom'>('month');
  const [activeReportTab, setActiveReportTab] = useState<'overview' | 'financial' | 'hr' | 'sales' | 'operations'>('overview');
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Custom date bounds
  const [customStartDate, setCustomStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const showToast = (msg: string) => {
    setExportNotice(msg);
    setTimeout(() => setExportNotice(null), 3500);
  };

  // -------------------------------------------------------------------------
  // DATE RANGE RESOLUTION
  // -------------------------------------------------------------------------
  const { startDate, endDate, previousStartDate, previousEndDate, periodLabel } = useMemo(() => {
    const now = new Date();
    let start = new Date();
    let end = new Date();
    let prevStart = new Date();
    let prevEnd = new Date();
    let label = '';

    if (dateFilterPreset === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      prevEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      label = isSw ? `Mwezi Huu (${now.toLocaleDateString('sw-TZ', { month: 'long', year: 'numeric' })})` : `This Month (${now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})`;
    } else if (dateFilterPreset === 'last_month') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0);
      prevStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      prevEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0);
      label = isSw ? `Mwezi Uliopita` : `Last Month`;
    } else if (dateFilterPreset === 'quarter') {
      const q = Math.floor(now.getMonth() / 3);
      start = new Date(now.getFullYear(), q * 3, 1);
      end = new Date(now.getFullYear(), (q + 1) * 3, 0);
      prevStart = new Date(now.getFullYear(), (q - 1) * 3, 1);
      prevEnd = new Date(now.getFullYear(), q * 3, 0);
      label = isSw ? `Robo Mwaka (Q${q + 1} ${now.getFullYear()})` : `This Quarter (Q${q + 1} ${now.getFullYear()})`;
    } else if (dateFilterPreset === 'year') {
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31);
      prevStart = new Date(now.getFullYear() - 1, 0, 1);
      prevEnd = new Date(now.getFullYear() - 1, 11, 31);
      label = isSw ? `Mwaka Mzima (${now.getFullYear()})` : `Full Year (${now.getFullYear()})`;
    } else {
      start = new Date(customStartDate);
      end = new Date(customEndDate);
      prevStart = new Date(start.getTime() - (end.getTime() - start.getTime()));
      prevEnd = new Date(start.getTime() - 86400000);
      label = `${customStartDate} hadi ${customEndDate}`;
    }

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      previousStartDate: prevStart.toISOString().split('T')[0],
      previousEndDate: prevEnd.toISOString().split('T')[0],
      periodLabel: label,
    };
  }, [dateFilterPreset, customStartDate, customEndDate, isSw]);

  // Helper date checker
  const isInRange = (dStr?: string) => {
    if (!dStr) return false;
    const date = dStr.split('T')[0];
    return date >= startDate && date <= endDate;
  };
  const isInPrevRange = (dStr?: string) => {
    if (!dStr) return false;
    const date = dStr.split('T')[0];
    return date >= previousStartDate && date <= previousEndDate;
  };

  // -------------------------------------------------------------------------
  // 1. FINANCIAL METRICS
  // -------------------------------------------------------------------------
  const rangeInvoices = useMemo(() => invoices.filter(i => isInRange(i.date || i.createdAt)), [invoices, startDate, endDate]);
  const prevRangeInvoices = useMemo(() => invoices.filter(i => isInPrevRange(i.date || i.createdAt)), [invoices, previousStartDate, previousEndDate]);

  const totalInvoicedRevenue = rangeInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
  const totalPaidRevenue = rangeInvoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
  const totalOutstanding = rangeInvoices.reduce((sum, inv) => sum + (inv.balanceDue || 0), 0);
  const overdueInvoices = rangeInvoices.filter(inv => inv.status === 'Overdue' || (inv.dueDate && inv.dueDate < new Date().toISOString().split('T')[0] && inv.balanceDue > 0));
  const totalOverdueAmount = overdueInvoices.reduce((sum, inv) => sum + (inv.balanceDue || 0), 0);

  // Quotation conversion
  const rangeQuotations = useMemo(() => quotations.filter(q => isInRange(q.date || q.createdAt)), [quotations, startDate, endDate]);
  const convertedQuotationsCount = rangeQuotations.filter(q => q.status === 'Accepted' || (q as any).convertedToInvoiceId).length;
  const quoteConversionRate = rangeQuotations.length > 0 ? Math.round((convertedQuotationsCount / rangeQuotations.length) * 100) : 0;

  // Petty Cash & Payroll
  const rangePettyCash = useMemo(() => pettyCash.filter(p => isInRange(p.date)), [pettyCash, startDate, endDate]);
  const totalPettyCashSpent = rangePettyCash.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalPayrollCost = payroll.totalGross || 0;

  // Total financial outflow vs inflow
  const netOperatingMargin = totalPaidRevenue - (totalPayrollCost + totalPettyCashSpent);

  // -------------------------------------------------------------------------
  // 2. HR METRICS
  // -------------------------------------------------------------------------
  const totalHeadcount = employees.length;
  const rangeAttendance = useMemo(() => attendance.filter(a => isInRange(a.date)), [attendance, startDate, endDate]);
  const onTimeAttendance = rangeAttendance.filter(a => a.status === 'present');
  const lateAttendance = rangeAttendance.filter(a => a.status === 'late');
  const punctualityRate = rangeAttendance.length > 0 ? Math.round((onTimeAttendance.length / rangeAttendance.length) * 100) : 100;

  // Department distribution
  const departmentCounts = useMemo(() => {
    const map: Record<string, number> = {};
    employees.forEach(e => {
      const dept = e.department || 'Utawala';
      map[dept] = (map[dept] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [employees]);

  // -------------------------------------------------------------------------
  // 3. SALES METRICS
  // -------------------------------------------------------------------------
  const rangeLeads = useMemo(() => leads.filter(l => isInRange(l.createdDate || l.lastContactDate)), [leads, startDate, endDate]);
  const wonLeads = rangeLeads.filter(l => l.status === 'Closed Won');
  const lostLeads = rangeLeads.filter(l => l.status === 'Closed Lost');
  const salesPipelineValue = rangeLeads.reduce((sum, l) => sum + (l.dealValue || 0), 0);

  // Top clients by revenue
  const topClients = useMemo(() => {
    const map: Record<string, { name: string; total: number; count: number }> = {};
    rangeInvoices.forEach(inv => {
      const cId = inv.clientName || 'Mteja Asiyejulikana';
      if (!map[cId]) map[cId] = { name: cId, total: 0, count: 0 };
      map[cId].total += inv.grandTotal || 0;
      map[cId].count += 1;
    });
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 5);
  }, [rangeInvoices]);

  // -------------------------------------------------------------------------
  // 4. OPERATIONS METRICS
  // -------------------------------------------------------------------------
  const rangeTasks = useMemo(() => tasks.filter(t => isInRange(t.dueDate || t.createdAt)), [tasks, startDate, endDate]);
  const completedTasks = rangeTasks.filter(t => t.status === 'completed');
  const overdueTasks = rangeTasks.filter(t => t.status !== 'completed' && t.dueDate && t.dueDate < new Date().toISOString().split('T')[0]);
  const taskCompletionPercent = rangeTasks.length > 0 ? Math.round((completedTasks.length / rangeTasks.length) * 100) : 0;

  // Inventory value & low stock
  const inventoryTotalValue = consumables.reduce((sum, c) => sum + ((c.quantityInStock || 0) * (c.unitCost || 0)), 0);
  const lowStockItems = consumables.filter(c => (c.quantityInStock || 0) <= (c.minThreshold || 5));

  // Meetings held
  const rangeMeetings = useMemo(() => meetings.filter(m => isInRange(m.date)), [meetings, startDate, endDate]);
  const completedMeetings = rangeMeetings.filter(m => m.status === 'completed');

  // -------------------------------------------------------------------------
  // CSV EXPORTS
  // -------------------------------------------------------------------------
  const handleExportFullFinancialReport = () => {
    const headers = ['Nambari ya Ankara', 'Mteja', 'Tarehe', 'Tarehe ya Mwisho', 'Jumla (TZS)', 'Kiasi Kilicholipwa', 'Salio Linalodaiwa', 'Hali'];
    const rows = rangeInvoices.map(i => [
      i.invoiceNumber,
      `"${(i.clientName || '').replace(/"/g, '""')}"`,
      i.date,
      i.dueDate,
      i.grandTotal,
      i.paidAmount,
      i.balanceDue,
      i.status,
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `KaziDesk_Ripoti_Fedha_${startDate}_hadi_${endDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(isSw ? 'Ripoti kamili ya fedha imehifadhiwa kama CSV!' : 'Financial report exported!');
  };

  return (
    <div className="space-y-6">

      {/* Export Toast */}
      {exportNotice && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-emerald-900/40">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-[11px] font-black uppercase tracking-wider border border-emerald-500/30">
              Executive Intelligence · Ripoti za Uongozi
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            {isSw ? 'Takwimu & Ripoti za Kina za Usimamizi' : 'Management & Executive Analytics'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            {isSw
              ? 'Ripoti halisi za fedha, rasilimali watu (HR), mauzo, na uendeshaji (Operations). Chagua muda wa ripoti na pakua muhtasari rasmi wa CSV na Print.'
              : 'Live aggregated intelligence across financial performance, headcount & attendance, sales pipeline, and operational workflows with date filters.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>{isSw ? 'Chapa (Print)' : 'Print'}</span>
          </button>
          <button
            onClick={handleExportFullFinancialReport}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>{isSw ? 'Pakua CSV Kamili' : 'Export Full CSV'}</span>
          </button>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Preset Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {[
            { id: 'month', labelSw: 'Mwezi Huu', labelEn: 'This Month' },
            { id: 'last_month', labelSw: 'Mwezi Uliopita', labelEn: 'Last Month' },
            { id: 'quarter', labelSw: 'Robo Mwaka (Quarter)', labelEn: 'Quarter' },
            { id: 'year', labelSw: 'Mwaka Huu (Year)', labelEn: 'Year' },
            { id: 'custom', labelSw: 'Tarehe Maalum', labelEn: 'Custom' },
          ].map(preset => (
            <button
              key={preset.id}
              onClick={() => setDateFilterPreset(preset.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                dateFilterPreset === preset.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {isSw ? preset.labelSw : preset.labelEn}
            </button>
          ))}
        </div>

        {/* Custom Date Pickers (if custom selected) */}
        {dateFilterPreset === 'custom' && (
          <div className="flex items-center gap-2 text-xs">
            <input
              type="date"
              value={customStartDate}
              onChange={e => setCustomStartDate(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-mono"
            />
            <span className="text-slate-400">hadi</span>
            <input
              type="date"
              value={customEndDate}
              onChange={e => setCustomEndDate(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-mono"
            />
          </div>
        )}

        {/* Selected Period Badge */}
        <div className="text-right text-xs">
          <span className="text-slate-400 text-[10px] uppercase font-bold block">{isSw ? 'Kipindi Kinachochambuliwa:' : 'Active Filter:'}</span>
          <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{periodLabel}</strong>
        </div>
      </div>

      {/* Module Navigation Sub-Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        {[
          { id: 'overview', labelSw: 'Muhtasari Mkuu (Executive KPI)', labelEn: 'Executive Summary', icon: Layers },
          { id: 'financial', labelSw: 'Fedha & Ankara (Financials)', labelEn: 'Financial Reports', icon: Wallet },
          { id: 'hr', labelSw: 'Wafanyakazi & Mahudhurio (HR)', labelEn: 'HR & People', icon: Users },
          { id: 'sales', labelSw: 'Masoko & Wateja (Sales CRM)', labelEn: 'Sales & CRM', icon: TrendingUp },
          { id: 'operations', labelSw: 'Uendeshaji & Majukumu (Operations)', labelEn: 'Operations & Stock', icon: KanbanSquare },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeReportTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveReportTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{isSw ? tab.labelSw : tab.labelEn}</span>
            </button>
          );
        })}
      </div>

      {/* =================================================================== */}
      {/* 1. OVERVIEW TAB */}
      {/* =================================================================== */}
      {activeReportTab === 'overview' && (
        <div className="space-y-6">
          {/* Top 4 KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Mapato Yaliyopokelewa</span>
              <strong className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 block">
                {formatCurrency(totalPaidRevenue, currency)}
              </strong>
              <span className="text-[11px] text-slate-500">kutoka ankara {rangeInvoices.length}</span>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Madeni Yanayodaiwa (Outstanding)</span>
              <strong className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400 block">
                {formatCurrency(totalOutstanding, currency)}
              </strong>
              <span className="text-[11px] text-rose-500 font-bold">
                {formatCurrency(totalOverdueAmount, currency)} zimechelewa (overdue)
              </span>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Kasi ya Kufanikisha Majukumu</span>
              <strong className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400 block">
                {taskCompletionPercent}%
              </strong>
              <span className="text-[11px] text-slate-500">{completedTasks.length} ya kazi {rangeTasks.length} zimekamilika</span>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Uthabiti wa Mahudhurio</span>
              <strong className="text-2xl font-black font-mono text-blue-600 dark:text-blue-400 block">
                {punctualityRate}%
              </strong>
              <span className="text-[11px] text-slate-500">{onTimeAttendance.length} walifika mapema</span>
            </div>

          </div>

          {/* Operational Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Net Operating Position */}
            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-500" />
                <span>{isSw ? 'Mwenendo wa Fedha (Inflow vs Outflow)' : 'Cash Inflow vs Outflow'}</span>
              </h4>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-900">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Mapato Yaliyopokelewa (Inflow):</span>
                  <strong className="font-mono font-bold text-emerald-600">{formatCurrency(totalPaidRevenue, currency)}</strong>
                </div>

                <div className="flex justify-between items-center p-3 bg-rose-50/50 dark:bg-rose-950/20 rounded-2xl border border-rose-100 dark:border-rose-900">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Mishahara ya Wafanyakazi (Payroll):</span>
                  <strong className="font-mono font-bold text-rose-600">-{formatCurrency(totalPayrollCost, currency)}</strong>
                </div>

                <div className="flex justify-between items-center p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-2xl border border-amber-100 dark:border-amber-900">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Matumizi Madogo (Petty Cash):</span>
                  <strong className="font-mono font-bold text-amber-600">-{formatCurrency(totalPettyCashSpent, currency)}</strong>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-sm font-black">
                  <span className="text-slate-900 dark:text-white">Salio Halisi la Uendeshaji (Operating Margin):</span>
                  <span className={`font-mono ${netOperatingMargin >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {formatCurrency(netOperatingMargin, currency)}
                  </span>
                </div>
              </div>
            </div>

            {/* Sales & Conversion Rate */}
            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-500" />
                <span>{isSw ? 'Ufanisi wa Mauzo na Nukuu (Conversion)' : 'Sales & Quotation Performance'}</span>
              </h4>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl">
                  <span className="text-slate-600 dark:text-slate-400">Nukuu Zilizotolewa (Quotations):</span>
                  <strong className="font-mono font-bold">{rangeQuotations.length} nukuu</strong>
                </div>

                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl">
                  <span className="text-slate-600 dark:text-slate-400">Zilizobadilishwa Kuwa Ankara:</span>
                  <strong className="font-mono font-bold text-emerald-600">{convertedQuotationsCount} ({quoteConversionRate}%)</strong>
                </div>

                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl">
                  <span className="text-slate-600 dark:text-slate-400">Fursa za Mauzo Zilizoshinda (Won Deals):</span>
                  <strong className="font-mono font-bold text-indigo-600">{wonLeads.length} ya leads {rangeLeads.length}</strong>
                </div>

                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl">
                  <span className="text-slate-600 dark:text-slate-400">Mikutano ya Video Iliyofanyika:</span>
                  <strong className="font-mono font-bold text-slate-900 dark:text-white">{rangeMeetings.length} mikutano</strong>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 2. FINANCIAL TAB */}
      {/* =================================================================== */}
      {activeReportTab === 'financial' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <span className="text-slate-400 text-[10px] uppercase font-bold">Jumla ya Ankara (Invoiced)</span>
              <strong className="text-2xl font-black font-mono text-slate-900 dark:text-white block">
                {formatCurrency(totalInvoicedRevenue, currency)}
              </strong>
            </div>
            <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <span className="text-slate-400 text-[10px] uppercase font-bold">Iliyopokelewa (Received)</span>
              <strong className="text-2xl font-black font-mono text-emerald-600 block">
                {formatCurrency(totalPaidRevenue, currency)}
              </strong>
            </div>
            <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <span className="text-slate-400 text-[10px] uppercase font-bold">Inayodaiwa (Due)</span>
              <strong className="text-2xl font-black font-mono text-amber-600 block">
                {formatCurrency(totalOutstanding, currency)}
              </strong>
            </div>
          </div>

          {/* Invoices Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              {isSw ? 'Mchanganuo wa Ankara Katika Kipindi Hiki' : 'Invoices Breakdown'}
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="py-3 px-3">Ankara #</th>
                    <th className="py-3 px-3">Mteja</th>
                    <th className="py-3 px-3">Tarehe</th>
                    <th className="py-3 px-3">Mwisho wa Malipo</th>
                    <th className="py-3 px-3 text-right">Jumla (TZS)</th>
                    <th className="py-3 px-3 text-right">Imelipwa</th>
                    <th className="py-3 px-3 text-right">Inayodaiwa</th>
                    <th className="py-3 px-3">Hali</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {rangeInvoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-3 font-mono font-bold text-emerald-600">{inv.invoiceNumber}</td>
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">{inv.clientName}</td>
                      <td className="py-3 px-3 text-slate-500">{inv.date}</td>
                      <td className="py-3 px-3 text-slate-500">{inv.dueDate}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold">{formatCurrency(inv.grandTotal, currency)}</td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-600 font-bold">{formatCurrency(inv.paidAmount, currency)}</td>
                      <td className="py-3 px-3 text-right font-mono text-amber-600 font-bold">{formatCurrency(inv.balanceDue, currency)}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          inv.status === 'Paid' ? 'bg-emerald-500/20 text-emerald-600' :
                          inv.status === 'Partially Paid' ? 'bg-blue-500/20 text-blue-600' :
                          inv.status === 'Overdue' ? 'bg-rose-500/20 text-rose-600' : 'bg-slate-500/20 text-slate-600'
                        }`}>
                          {inv.status}
                        </span>
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
      {/* 3. HR TAB */}
      {/* =================================================================== */}
      {activeReportTab === 'hr' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <span className="text-slate-400 text-[10px] uppercase font-bold">Wafanyakazi Wote (Headcount)</span>
              <strong className="text-3xl font-black text-slate-900 dark:text-white block font-mono">{totalHeadcount}</strong>
            </div>
            <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <span className="text-slate-400 text-[10px] uppercase font-bold">Uthabiti wa Kufika Mapema</span>
              <strong className="text-3xl font-black text-emerald-600 block font-mono">{punctualityRate}%</strong>
            </div>
            <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <span className="text-slate-400 text-[10px] uppercase font-bold">Waliochelewa (Late Arrivals)</span>
              <strong className="text-3xl font-black text-amber-600 block font-mono">{lateAttendance.length}</strong>
            </div>
          </div>

          {/* Department Breakdown */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              {isSw ? 'Ugawaji wa Wafanyakazi kwa Idara (Department Headcount)' : 'Department Distribution'}
            </h4>
            <div className="space-y-2.5">
              {departmentCounts.map(([dept, count]) => {
                const percent = Math.round((count / totalHeadcount) * 100);
                return (
                  <div key={dept} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{dept}</span>
                      <span className="text-slate-400 font-mono">{count} staff ({percent}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 4. SALES TAB */}
      {/* =================================================================== */}
      {activeReportTab === 'sales' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <span className="text-slate-400 text-[10px] uppercase font-bold">Thamani ya Pipeline (Leads Value)</span>
              <strong className="text-2xl font-black font-mono text-indigo-600 block">
                {formatCurrency(salesPipelineValue, currency)}
              </strong>
            </div>
            <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <span className="text-slate-400 text-[10px] uppercase font-bold">Dili Zilizoshinda (Won Deals)</span>
              <strong className="text-2xl font-black font-mono text-emerald-600 block">
                {wonLeads.length}
              </strong>
            </div>
            <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <span className="text-slate-400 text-[10px] uppercase font-bold">Dili Zilizokosa (Lost Deals)</span>
              <strong className="text-2xl font-black font-mono text-rose-500 block">
                {lostLeads.length}
              </strong>
            </div>
          </div>

          {/* Top Clients Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              {isSw ? 'Wateja Wanaoongoza kwa Thamani ya Mauzo (Top Clients)' : 'Top Clients by Revenue'}
            </h4>
            <div className="space-y-2">
              {topClients.map((client, idx) => (
                <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-600 font-black flex items-center justify-center text-xs">
                      {idx + 1}
                    </span>
                    <div>
                      <strong className="font-bold text-slate-900 dark:text-white block">{client.name}</strong>
                      <span className="text-[10px] text-slate-400 font-mono">{client.count} ankara zimetolewa</span>
                    </div>
                  </div>
                  <strong className="font-mono text-sm font-black text-emerald-600">
                    {formatCurrency(client.total, currency)}
                  </strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 5. OPERATIONS TAB */}
      {/* =================================================================== */}
      {activeReportTab === 'operations' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <span className="text-slate-400 text-[10px] uppercase font-bold">Thamani ya Bidhaa Stoo</span>
              <strong className="text-2xl font-black font-mono text-slate-900 dark:text-white block">
                {formatCurrency(inventoryTotalValue, currency)}
              </strong>
            </div>
            <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <span className="text-slate-400 text-[10px] uppercase font-bold">Bidhaa Zenye Uhaba (Low Stock)</span>
              <strong className="text-2xl font-black font-mono text-amber-500 block">
                {lowStockItems.length}
              </strong>
            </div>
            <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <span className="text-slate-400 text-[10px] uppercase font-bold">Kazi Zilizochelewa (Overdue Tasks)</span>
              <strong className="text-2xl font-black font-mono text-rose-500 block">
                {overdueTasks.length}
              </strong>
            </div>
          </div>

          {/* Low Stock Alerts */}
          {lowStockItems.length > 0 && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs space-y-2">
              <span className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                <span>Tahadhari ya Uhaba wa Bidhaa Stoo:</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
                {lowStockItems.map(item => (
                  <div key={item.id} className="p-2 bg-white/70 dark:bg-slate-900/60 rounded-xl flex justify-between">
                    <span>{item.name}</span>
                    <strong className="text-rose-600 font-mono">{item.quantityInStock} zimebaki</strong>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
