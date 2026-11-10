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
  Check
} from 'lucide-react';
import {
  AttendanceRecord,
  Employee,
  OfficeTask,
  PayrollRun,
  PettyCashVoucher
} from '../../types/office';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  exportAttendanceToCSV,
  exportPayrollToCSV,
  exportPettyCashToCSV,
  exportManagementSummaryToCSV,
  ManagementSummaryData
} from '../../utils/csvExport';

interface ReportsViewProps {
  lang: 'sw' | 'en';
  currency: 'TZS' | 'USD';
  tasks: OfficeTask[];
  attendance: AttendanceRecord[];
  pettyCash: PettyCashVoucher[];
  employees: Employee[];
  payroll: PayrollRun;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  lang,
  currency,
  tasks,
  attendance,
  pettyCash,
  employees,
  payroll,
}) => {
  const isSw = lang === 'sw';

  // Month & Year Filter
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`; // YYYY-MM
  });

  const [activeReportTab, setActiveReportTab] = useState<'overview' | 'tasks' | 'attendance' | 'pettyCash' | 'executive'>('overview');
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setExportNotice(msg);
    setTimeout(() => setExportNotice(null), 3500);
  };

  // -------------------------------------------------------------------------
  // FILTERED AGGREGATIONS
  // -------------------------------------------------------------------------
  const filteredAttendance = useMemo(() => {
    return attendance.filter(a => a.date.startsWith(selectedMonth));
  }, [attendance, selectedMonth]);

  const filteredPettyCash = useMemo(() => {
    return pettyCash.filter(p => p.date.startsWith(selectedMonth));
  }, [pettyCash, selectedMonth]);

  const filteredTasks = useMemo(() => {
    // Tasks created or due in this month, or current active tasks
    return tasks.filter(t => (t.dueDate && t.dueDate.startsWith(selectedMonth)) || (t.createdAt && t.createdAt.startsWith(selectedMonth)));
  }, [tasks, selectedMonth]);

  // If no tasks match due date, fall back to all current tasks for broad visibility
  const evaluatedTasks = filteredTasks.length > 0 ? filteredTasks : tasks;

  // Task Stats
  const totalTasksCount = evaluatedTasks.length;
  const completedTasksCount = evaluatedTasks.filter(t => t.status === 'completed').length;
  const inProgressTasksCount = evaluatedTasks.filter(t => t.status === 'in_progress').length;
  const reviewTasksCount = evaluatedTasks.filter(t => t.status === 'review').length;
  const todoTasksCount = evaluatedTasks.filter(t => t.status === 'todo').length;
  const taskCompletionRate = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  // Attendance Stats
  const totalLogsCount = filteredAttendance.length;
  const onTimeCount = filteredAttendance.filter(a => a.status === 'present').length;
  const lateCount = filteredAttendance.filter(a => a.status === 'late').length;
  const halfDayCount = filteredAttendance.filter(a => a.status === 'half_day').length;
  const leaveCount = filteredAttendance.filter(a => a.status === 'on_leave').length;
  const punctualityRate = totalLogsCount > 0 ? Math.round((onTimeCount / totalLogsCount) * 100) : 0;
  const totalWorkHours = filteredAttendance.reduce((sum, a) => sum + (a.totalHours || 8), 0);

  // Petty Cash Stats
  const totalPettyCashSpent = filteredPettyCash.reduce((sum, v) => sum + (v.amount || 0), 0);
  const settledVouchers = filteredPettyCash.filter(v => v.status === 'settled');
  const pendingReceipts = filteredPettyCash.filter(v => v.status === 'pending_receipt');

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    filteredPettyCash.forEach(v => {
      map[v.category] = (map[v.category] || 0) + v.amount;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filteredPettyCash]);

  const topCategoryName = categoryBreakdown.length > 0 ? categoryBreakdown[0][0] : 'N/A';

  // Overall Productivity Score
  const overallOfficeHealthScore = useMemo(() => {
    const taskWeight = taskCompletionRate * 0.45;
    const punctualityWeight = punctualityRate * 0.45;
    const budgetFactor = pendingReceipts.length === 0 ? 10 : Math.max(0, 10 - pendingReceipts.length * 2);
    return Math.min(100, Math.round(taskWeight + punctualityWeight + budgetFactor));
  }, [taskCompletionRate, punctualityRate, pendingReceipts.length]);

  // Month Display Name
  const formattedMonthName = useMemo(() => {
    const [y, m] = selectedMonth.split('-');
    const date = new Date(Number(y), Number(m) - 1, 1);
    return date.toLocaleDateString(isSw ? 'sw-TZ' : 'en-US', { month: 'long', year: 'numeric' });
  }, [selectedMonth, isSw]);

  // Management Summary Data for CSV
  const summaryDataForExport: ManagementSummaryData = {
    monthName: formattedMonthName,
    totalEmployees: employees.length,
    totalTasks: totalTasksCount,
    completedTasks: completedTasksCount,
    inProgressTasks: inProgressTasksCount,
    taskCompletionRate,
    totalAttendanceLogs: totalLogsCount,
    onTimeArrivals: onTimeCount,
    lateArrivals: lateCount,
    punctualityRate,
    totalWorkHours,
    totalPettyCashDisbursed: totalPettyCashSpent,
    settledVouchersCount: settledVouchers.length,
    pendingReceiptsCount: pendingReceipts.length,
    topPettyCashCategory: topCategoryName,
    payrollGrossTotal: payroll.totalGross || 0,
    payrollNetTotal: payroll.totalNet || 0,
  };

  // CSV Export Handlers
  const handleExportAttendance = () => {
    exportAttendanceToCSV(filteredAttendance.length > 0 ? filteredAttendance : attendance, 'KaziDesk-Mahudhurio', lang);
    showToast(isSw ? 'Ripoti ya Mahudhurio imehamishwa kikamilifu kwenye CSV!' : 'Attendance report exported to CSV!');
  };

  const handleExportPayroll = () => {
    exportPayrollToCSV(payroll, 'KaziDesk-Payroll', currency, lang);
    showToast(isSw ? 'Ripoti ya Mishahara imehamishwa kikamilifu kwenye CSV!' : 'Payroll report exported to CSV!');
  };

  const handleExportPettyCash = () => {
    exportPettyCashToCSV(filteredPettyCash.length > 0 ? filteredPettyCash : pettyCash, 'KaziDesk-Petty-Cash', currency, lang);
    showToast(isSw ? 'Ripoti ya Petty Cash imehamishwa kikamilifu kwenye CSV!' : 'Petty cash report exported to CSV!');
  };

  const handleExportExecutiveSummary = () => {
    exportManagementSummaryToCSV(summaryDataForExport, currency, lang);
    showToast(isSw ? 'Muhtasari wa Uongozi umehamishwa kwenye CSV!' : 'Management summary exported to CSV!');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {exportNotice && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-xl font-bold text-xs flex items-center justify-between shadow-lg animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{exportNotice}</span>
          </div>
          <button onClick={() => setExportNotice(null)}>×</button>
        </div>
      )}

      {/* Header & Controls Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
            <BarChart3 className="w-4 h-4" />
            <span>{isSw ? 'Ripoti Jumuishi za Uongozi' : 'Management & Executive Analytics'}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {isSw ? 'Muhtasari wa Utendaji wa Kila Mwezi' : 'Monthly Performance & Operations Summary'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            {isSw
              ? `Uchambuzi wa takwimu za Kazi, Mahudhurio, Fedha za Petty Cash, na Mishahara kwa mwezi wa ${formattedMonthName}.`
              : `Aggregated management metrics for Tasks, Attendance, Petty Cash, and Payroll for ${formattedMonthName}.`}
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Month Selector */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-bold text-slate-500 px-2">{isSw ? 'Mwezi:' : 'Month:'}</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold font-mono text-slate-900 dark:text-white"
            />
          </div>

          {/* CSV Export Dropdown / Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleExportExecutiveSummary}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
              title="Pakua muhtasari mzima wa uongozi kwenye CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>{isSw ? 'Hamisha Muhtasari (CSV)' : 'Export Summary (CSV)'}</span>
            </button>

            <button
              onClick={() => window.print()}
              className="p-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors"
              title="Chapisha ripoti hii (Print/PDF)"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-1 text-xs font-bold">
        {[
          { id: 'overview', label: isSw ? 'Dashibodi ya Uongozi' : 'Executive Overview', icon: Layers },
          { id: 'tasks', label: isSw ? `Majukumu (${totalTasksCount})` : `Tasks & Workflow (${totalTasksCount})`, icon: KanbanSquare },
          { id: 'attendance', label: isSw ? `Mahudhurio (${totalLogsCount})` : `Attendance (${totalLogsCount})`, icon: CalendarCheck },
          { id: 'pettyCash', label: isSw ? `Petty Cash (${filteredPettyCash.length})` : `Petty Cash (${filteredPettyCash.length})`, icon: Coins },
          { id: 'executive', label: isSw ? 'Waraka wa Utawala (Memo)' : 'Executive Memo', icon: FileText },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeReportTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveReportTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl flex items-center gap-2 shrink-0 transition-all ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-xs font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* =================================================================== */}
      {/* 1. EXECUTIVE OVERVIEW DASHBOARD */}
      {/* =================================================================== */}
      {activeReportTab === 'overview' && (
        <div className="space-y-6">
          {/* 4 Core Pillars KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Overall Office Productivity Health */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {isSw ? 'Alama ya Utendaji wa Ofisi' : 'Office Health Score'}
                  </span>
                  <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
                    <Award className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black font-mono text-slate-900 dark:text-white">
                    {overallOfficeHealthScore}%
                  </span>
                  <span className="text-xs font-bold text-emerald-600">
                    {overallOfficeHealthScore >= 80 ? (isSw ? 'Ufanisi wa Juu' : 'High') : (isSw ? 'Wastani' : 'Moderate')}
                  </span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
                {isSw ? 'Uzito: Majukumu (45%), Mahudhurio (45%), Fedha (10%)' : 'Weighted: Tasks (45%), Attendance (45%), Budget (10%)'}
              </div>
            </div>

            {/* KPI 2: Task Completion Rate */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {isSw ? 'Kukamilisha Majukumu' : 'Task Completion Rate'}
                  </span>
                  <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600">
                    <KanbanSquare className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black font-mono text-slate-900 dark:text-white">
                    {taskCompletionRate}%
                  </span>
                  <span className="text-xs text-slate-500">
                    ({completedTasksCount}/{totalTasksCount})
                  </span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">{inProgressTasksCount} {isSw ? 'Yanaendelea' : 'in-progress'}</span>
                <span className="font-bold text-blue-600">{reviewTasksCount} {isSw ? 'Ukaguzi' : 'review'}</span>
              </div>
            </div>

            {/* KPI 3: Attendance Punctuality */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {isSw ? 'Uzingatiaji wa Muda' : 'Punctuality Rate'}
                  </span>
                  <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600">
                    <CalendarCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black font-mono text-slate-900 dark:text-white">
                    {punctualityRate}%
                  </span>
                  <span className="text-xs text-slate-500">
                    ({onTimeCount} {isSw ? 'Wakati' : 'On-time'})
                  </span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-amber-600 font-bold">{lateCount} {isSw ? 'Wamechelewa' : 'late'}</span>
                <span className="font-mono text-slate-500">{totalWorkHours.toFixed(0)} {isSw ? 'Masaa' : 'hrs'}</span>
              </div>
            </div>

            {/* KPI 4: Petty Cash Expenditure */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {isSw ? 'Matumizi ya Petty Cash' : 'Petty Cash Spent'}
                  </span>
                  <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600">
                    <Coins className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white">
                    {formatCurrency(totalPettyCashSpent, currency)}
                  </span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-emerald-600 font-bold">{settledVouchers.length} {isSw ? 'Zimethibitishwa' : 'settled'}</span>
                <span className="text-amber-600 font-bold">{pendingReceipts.length} {isSw ? 'Bila Risiti' : 'pending'}</span>
              </div>
            </div>
          </div>

          {/* Quick CSV Export Banner & External Bookkeeping Card */}
          <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-2xl p-5 sm:p-6 border border-emerald-900/60 shadow-lg flex flex-col md:flex-row items-center justify-between gap-5">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Uhamishaji wa Kumbukumbu (External Bookkeeping & Audits)</span>
              </div>
              <h3 className="text-lg font-bold text-white">
                {isSw ? 'Pakua Ripoti Kamili za CSV kwa Uhasibu na Ukaguzi' : 'Export Full CSV Reports for Bookkeeping & Auditing'}
              </h3>
              <p className="text-xs text-slate-300 max-w-xl">
                {isSw
                  ? 'Hamisha orodha safi ya Mahudhurio, Makato ya Mishahara (TRA & NSSF), na Vocha zote za Petty Cash kwa matumizi ya Microsoft Excel, Google Sheets, au programu za kihasibu kama Tally na QuickBooks.'
                  : 'Download complete datasets of Attendance, Payroll Deductions (TRA & NSSF), and Petty Cash Vouchers ready for Excel, Sheets, or accounting software.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={handleExportAttendance}
                className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Mahudhurio (CSV)</span>
              </button>
              <button
                onClick={handleExportPayroll}
                className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Mishahara (CSV)</span>
              </button>
              <button
                onClick={handleExportPettyCash}
                className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Petty Cash (CSV)</span>
              </button>
            </div>
          </div>

          {/* Departmental Performance Matrix & Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Department Task Distribution */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {isSw ? 'Mgawanyo wa Majukumu kwa Idara' : 'Task Distribution by Department'}
                  </h3>
                </div>
                <span className="text-xs font-mono font-bold text-slate-500">
                  {totalTasksCount} {isSw ? 'Jumla' : 'Total'}
                </span>
              </div>

              <div className="space-y-3">
                {['Utawala & Uongozi', 'Fedha & Uhasibu', 'Rasilimali Watu (HR)', 'Teknolojia (IT & Mifumo)', 'Masoko & Mauzo', 'Uendeshaji & Usafirishaji'].map(dept => {
                  const deptStaffIds = employees.filter(e => e.department === dept).map(e => e.id);
                  const deptTasks = evaluatedTasks.filter(t => deptStaffIds.includes(t.assignedToId));
                  const deptDone = deptTasks.filter(t => t.status === 'completed').length;
                  const pct = deptTasks.length > 0 ? Math.round((deptDone / deptTasks.length) * 100) : 0;

                  return (
                    <div key={dept} className="space-y-1 text-xs">
                      <div className="flex items-center justify-between font-semibold">
                        <span className="text-slate-800 dark:text-slate-200">{dept}</span>
                        <span className="text-slate-500 font-mono">
                          {deptDone}/{deptTasks.length} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Petty Cash Categories Breakdown */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-amber-600" />
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {isSw ? 'Mchanganuo wa Petty Cash kwa Makundi' : 'Petty Cash Spending by Category'}
                  </h3>
                </div>
                <span className="text-xs font-mono font-bold text-amber-600">
                  {formatCurrency(totalPettyCashSpent, currency)}
                </span>
              </div>

              {categoryBreakdown.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-6 text-center">
                  {isSw ? 'Hakuna vocha za matumizi zilizorekodiwa katika kipindi hiki.' : 'No petty cash vouchers recorded in this period.'}
                </p>
              ) : (
                <div className="space-y-3">
                  {categoryBreakdown.map(([cat, amount]) => {
                    const pct = totalPettyCashSpent > 0 ? Math.round((amount / totalPettyCashSpent) * 100) : 0;
                    return (
                      <div key={cat} className="space-y-1 text-xs">
                        <div className="flex items-center justify-between font-semibold">
                          <span className="text-slate-800 dark:text-slate-200 capitalize">
                            {cat.replace('_', ' ')}
                          </span>
                          <span className="text-slate-900 dark:text-white font-mono font-bold">
                            {formatCurrency(amount, currency)} ({pct}%)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 2. TASKS DRILLDOWN */}
      {/* =================================================================== */}
      {activeReportTab === 'tasks' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {isSw ? 'Utekelezaji wa Majukumu na Kazi' : 'Task Fulfillment & Deliverables'}
              </h3>
              <p className="text-xs text-slate-500">
                {isSw ? `Orodha ya kazi zote zilizopangwa kwa mwezi wa ${formattedMonthName}.` : `Full list of tasks scheduled for ${formattedMonthName}.`}
              </p>
            </div>
            <div className="text-xs font-mono font-bold px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-lg">
              {completedTasksCount}/{totalTasksCount} {isSw ? 'Zimekamilika' : 'Completed'} ({taskCompletionRate}%)
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase text-[11px]">
                  <th className="py-3 px-3">Jukumu (Task)</th>
                  <th className="py-3 px-3">Aliyepangiwa (Assignee)</th>
                  <th className="py-3 px-3">Kiwango cha Umuhimu</th>
                  <th className="py-3 px-3">Hali (Status)</th>
                  <th className="py-3 px-3">Tarehe ya Mwisho (Due)</th>
                  <th className="py-3 px-3 text-right">Maendeleo (Progress)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {evaluatedTasks.map(task => {
                  const assignee = employees.find(e => e.id === task.assignedToId);
                  return (
                    <tr key={task.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 dark:text-white">{task.title}</div>
                        <div className="text-[11px] text-slate-400 line-clamp-1">{task.description}</div>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                        {assignee ? assignee.fullName : task.assignedToName || task.assignedToId}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          task.priority === 'high' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' :
                          task.priority === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' :
                          'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          task.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' :
                          task.status === 'in_progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' :
                          task.status === 'review' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' :
                          'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {task.status === 'completed' ? 'Imekamilika' : task.status === 'in_progress' ? 'Inaendelea' : task.status === 'review' ? 'Ukaguzi' : 'Kufanya'}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500">{task.dueDate}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600">
                        {task.progressPercentage}%
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
      {/* 3. ATTENDANCE DRILLDOWN */}
      {/* =================================================================== */}
      {activeReportTab === 'attendance' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 gap-3">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {isSw ? 'Mwenendo wa Mahudhurio & Saa za Kazi' : 'Attendance Logs & Working Hours'}
              </h3>
              <p className="text-xs text-slate-500">
                {isSw ? `Kumbukumbu za kuingia na kutoka kwa mwezi wa ${formattedMonthName}.` : `Daily check-in and checkout logs for ${formattedMonthName}.`}
              </p>
            </div>
            <button
              onClick={handleExportAttendance}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors self-start sm:self-auto"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isSw ? 'Hamisha Mahudhurio (CSV)' : 'Export Attendance (CSV)'}</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase text-[11px]">
                  <th className="py-3 px-3">Mfanyakazi</th>
                  <th className="py-3 px-3">Idara</th>
                  <th className="py-3 px-3">Tarehe</th>
                  <th className="py-3 px-3 font-mono">Muda Kuingia</th>
                  <th className="py-3 px-3 font-mono">Muda Kutoka</th>
                  <th className="py-3 px-3 font-mono">Masaa</th>
                  <th className="py-3 px-3">Hali</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {(filteredAttendance.length > 0 ? filteredAttendance : attendance).map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                      {log.employeeName}
                    </td>
                    <td className="py-3 px-3 text-slate-500">{log.department}</td>
                    <td className="py-3 px-3 font-mono">{log.date}</td>
                    <td className="py-3 px-3 font-mono font-semibold text-emerald-600">{log.clockInTime}</td>
                    <td className="py-3 px-3 font-mono font-semibold text-slate-500">{log.clockOutTime || '-'}</td>
                    <td className="py-3 px-3 font-mono font-bold">{log.totalHours ? log.totalHours.toFixed(1) : '-'}</td>
                    <td className="py-3 px-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        log.status === 'present' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' :
                        log.status === 'late' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' :
                        'bg-slate-100 text-slate-600 dark:bg-slate-800'
                      }`}>
                        {log.status === 'present' ? 'Wakati' : log.status === 'late' ? 'Amechelewa' : log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 4. PETTY CASH DRILLDOWN */}
      {/* =================================================================== */}
      {activeReportTab === 'pettyCash' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 gap-3">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {isSw ? 'Kumbukumbu za Vocha za Petty Cash' : 'Petty Cash Vouchers & Reconciliation'}
              </h3>
              <p className="text-xs text-slate-500">
                {isSw ? `Vocha zilizoidhinishwa na kutolewa mwezi wa ${formattedMonthName}.` : `Disbursed petty cash transactions for ${formattedMonthName}.`}
              </p>
            </div>
            <button
              onClick={handleExportPettyCash}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors self-start sm:self-auto"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isSw ? 'Hamisha Petty Cash (CSV)' : 'Export Petty Cash (CSV)'}</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase text-[11px]">
                  <th className="py-3 px-3">Vocha</th>
                  <th className="py-3 px-3">Tarehe</th>
                  <th className="py-3 px-3">Kundi</th>
                  <th className="py-3 px-3">Kusudio / Maelezo</th>
                  <th className="py-3 px-3 font-mono">Kiasi</th>
                  <th className="py-3 px-3">Aliyeomba & Mpokeaji</th>
                  <th className="py-3 px-3">Hali</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {(filteredPettyCash.length > 0 ? filteredPettyCash : pettyCash).map(v => (
                  <tr key={v.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-mono font-bold text-emerald-600">{v.voucherNo}</td>
                    <td className="py-3 px-3 font-mono text-slate-500">{v.date}</td>
                    <td className="py-3 px-3 capitalize font-semibold text-slate-800 dark:text-slate-200">
                      {v.category.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300 max-w-xs">{v.description}</td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                      {formatCurrency(v.amount, currency)}
                    </td>
                    <td className="py-3 px-3 text-[11px] text-slate-500">
                      <div>{v.requestedBy}</div>
                      <div className="font-semibold text-slate-700 dark:text-slate-300">Lipa kwa: {v.payeeOrVendor}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        v.status === 'settled'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      }`}>
                        {v.status === 'settled' ? 'Imethibitishwa' : 'Inasubiri Risiti'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 5. EXECUTIVE MANAGEMENT MEMORANDUM */}
      {/* =================================================================== */}
      {activeReportTab === 'executive' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-md space-y-6 max-w-4xl mx-auto">
          {/* Official Letterhead */}
          <div className="border-b-2 border-slate-900 dark:border-white pb-4 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 block">
                KAZIDESK MANAGEMENT REPORTING SYSTEM
              </span>
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                {isSw ? 'WARAKA WA TATHMINI YA UTENDAJI NA FEDHA ZA OFISI' : 'EXECUTIVE MANAGEMENT OPERATIONS MEMO'}
              </h2>
              <span className="text-xs font-mono text-slate-500">
                KUMB. NA: KD/MGT/{selectedMonth.replace('-', '/')}/001
              </span>
            </div>
            <div className="text-right text-xs space-y-0.5">
              <div className="font-bold text-slate-900 dark:text-white">{isSw ? 'Mwezi wa Tathmini:' : 'Reporting Period:'}</div>
              <div className="font-mono text-emerald-600 font-bold">{formattedMonthName}</div>
              <div className="text-slate-400 text-[11px]">{new Date().toLocaleDateString(isSw ? 'sw-TZ' : 'en-US')}</div>
            </div>
          </div>

          {/* Memo Addressing */}
          <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">{isSw ? 'KWA:' : 'TO:'}</span>
              <span className="font-bold text-slate-900 dark:text-white">Bodi ya Wakurugenzi & Uongozi Mkuu</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">{isSw ? 'KUTOKA:' : 'FROM:'}</span>
              <span className="font-bold text-slate-900 dark:text-white">Ofisi ya Utawala na Rasilimali Watu</span>
            </div>
            <div className="col-span-2 pt-2 border-t border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 block text-[10px] uppercase">{isSw ? 'KUHUSU:' : 'SUBJECT:'}</span>
              <span className="font-bold text-slate-900 dark:text-white uppercase">
                TAARIFA YA UTENDAJI WA MAJUKUMU, MAHUDHURIO YA WAFANYAKAZI NA MATUMIZI YA PETTY CASH
              </span>
            </div>
          </div>

          {/* Executive Takeaways */}
          <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1">
              1. Muhtasari Mkuu wa Utendaji (Executive Highlights)
            </h4>
            <p>
              Katika kipindi cha mwezi wa <strong>{formattedMonthName}</strong>, ofisi imefikia alama ya jumla ya utendaji ya{' '}
              <strong className="text-emerald-600">{overallOfficeHealthScore}%</strong>. Jumla ya majukumu{' '}
              <strong>{totalTasksCount}</strong> yalisajiliwa, ambapo majukumu <strong>{completedTasksCount}</strong> yamekamilika kwa ufanisi (
              <strong>{taskCompletionRate}%</strong> ya lengo).
            </p>

            <h4 className="font-bold text-sm text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1 pt-2">
              2. Nidhamu ya Kazi na Mahudhurio
            </h4>
            <p>
              Mfumo umerekodi jumla ya matukio <strong>{totalLogsCount}</strong> ya mahudhurio ya kidijitali. Kiwango cha kufika kwa wakati
              (Punctuality Rate) kimefikia <strong>{punctualityRate}%</strong>, kukiwa na matukio <strong>{lateCount}</strong> ya wafanyakazi
              kuchelewa. Jumla ya masaa <strong>{totalWorkHours.toFixed(1)}</strong> ya kazi yamelindwa na kurekodiwa rasmi.
            </p>

            <h4 className="font-bold text-sm text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1 pt-2">
              3. Matumizi ya Fedha za Ndani (Petty Cash Reconciliation)
            </h4>
            <p>
              Jumla ya <strong>{formatCurrency(totalPettyCashSpent, currency)}</strong> ilitolewa kupitia vocha{' '}
              <strong>{filteredPettyCash.length}</strong> za Petty Cash. Kundi lililoongoza kwa matumizi ni{' '}
              <strong className="capitalize">{topCategoryName.replace('_', ' ')}</strong>. Vocha{' '}
              <strong>{settledVouchers.length}</strong> zimeshakaguliwa na kuambatanishwa risiti, huku vocha{' '}
              <strong>{pendingReceipts.length}</strong> zikiwa katika hatua za mwisho za ukaguzi.
            </p>

            <h4 className="font-bold text-sm text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1 pt-2">
              4. Mapendekezo ya Kiutawala (Recommendations)
            </h4>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Kuendeleza motisha kwa idara zinazofikia zaidi ya 80% ya ukamilishaji wa kazi kwa wakati.</li>
              <li>Kutoa ukumbusho wa kiutawala kwa wafanyakazi wenye rekodi zaidi ya mbili za kuchelewa bila sababu maalum.</li>
              <li>Kuhakikisha risiti zote za petty cash zinakabidhiwa ndani ya saa 48 baada ya kutoa fedha.</li>
            </ul>
          </div>

          {/* Signoff Blocks */}
          <div className="pt-8 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-8 text-xs">
            <div>
              <div className="text-slate-400 text-[10px] uppercase">Imeandaliwa na:</div>
              <div className="mt-6 border-b border-slate-400 dark:border-slate-600 w-44" />
              <div className="font-bold text-slate-900 dark:text-white mt-1">Msimamizi wa Utawala & HR</div>
              <div className="text-slate-500">KaziDesk System Administrator</div>
            </div>
            <div className="text-right">
              <div className="text-slate-400 text-[10px] uppercase">Imeidhinishwa na:</div>
              <div className="mt-6 border-b border-slate-400 dark:border-slate-600 w-44 ml-auto" />
              <div className="font-bold text-slate-900 dark:text-white mt-1">Mkurugenzi Mtendaji (CEO)</div>
              <div className="text-slate-500">Executive Management</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
