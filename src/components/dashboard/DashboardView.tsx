import React from 'react';
import { 
  Users, 
  CalendarCheck, 
  CheckSquare, 
  Clock, 
  Coins, 
  Package, 
  FileCheck, 
  AlertTriangle, 
  ArrowUpRight, 
  Plus, 
  Sparkles,
  Laptop,
  CheckCircle2,
  FileText,
  UserPlus,
  DollarSign,
  BarChart3
} from 'lucide-react';
import { translations } from '../../utils/translations';
import { 
  CurrentUser, 
  AttendanceRecord, 
  OfficeTask, 
  ApprovalRequest, 
  OfficeAsset, 
  ConsumableItem, 
  PayrollRun,
  Employee,
  PettyCashVoucher,
  Quotation,
  Invoice,
  SalesReport
} from '../../types/office';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { WORKSPACE_HEADER_PATH } from '../../data/initialData';
import { PerformanceMetricsSection } from './PerformanceMetricsSection';

interface DashboardViewProps {
  lang: 'sw' | 'en';
  currency: 'TZS' | 'USD';
  currentUser: CurrentUser;
  employees: Employee[];
  attendance: AttendanceRecord[];
  tasks: OfficeTask[];
  approvals: ApprovalRequest[];
  assets: OfficeAsset[];
  consumables: ConsumableItem[];
  payroll: PayrollRun;
  pettyCash?: PettyCashVoucher[];
  quotations?: Quotation[];
  invoices?: Invoice[];
  salesReports?: SalesReport[];
  onNavigate: (tab: string) => void;
  onOpenKiosk: () => void;
  onClockIn: () => void;
  onNewTaskModal: () => void;
  onNewDocModal: () => void;
  onNewApprovalModal: () => void;
  onNewEmployeeModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  lang,
  currency,
  currentUser,
  employees,
  attendance,
  tasks,
  approvals,
  assets,
  consumables,
  payroll,
  pettyCash = [],
  quotations = [],
  invoices = [],
  salesReports = [],
  onNavigate,
  onOpenKiosk,
  onClockIn,
  onNewTaskModal,
  onNewDocModal,
  onNewApprovalModal,
  onNewEmployeeModal
}) => {
  const t = translations[lang];
  const todayStr = new Date().toISOString().split('T')[0];

  // Attendance stats for today
  const todayAttendance = attendance.filter(a => a.date === todayStr);
  const presentCount = todayAttendance.filter(a => a.status === 'present').length;
  const lateCount = todayAttendance.filter(a => a.status === 'late').length;
  const onLeaveCount = todayAttendance.filter(a => a.status === 'on_leave').length;
  const totalEmployees = employees.length;
  const attendanceRate = Math.round(((presentCount + lateCount) / Math.max(totalEmployees, 1)) * 100);

  // Tasks stats
  const activeTasks = tasks.filter(t => t.status === 'in_progress' || t.status === 'todo');
  const urgentTasks = tasks.filter(t => t.priority === 'urgent');

  // Approvals stats
  const pendingApprovals = approvals.filter(a => a.status === 'pending');

  // Asset values
  const totalAssetValue = assets.reduce((sum, a) => sum + (a.purchaseCost || 0), 0);
  const assetsInRepair = assets.filter(a => a.condition === 'needs_repair' || a.status === 'under_maintenance');

  // Low stock consumables
  const lowStockItems = consumables.filter(c => c.quantityInStock <= c.minThreshold);

  // Petty Cash Balance
  const startingFloat = 500000;
  const pettyCashBalance = pettyCash.reduce((bal, v) => {
    return v.type === 'replenishment' ? bal + v.amount : bal - v.amount;
  }, startingFloat);

  // Quotations & Invoices real stats
  const totalQuotationsSent = quotations.filter(q => q.status === 'Sent' || q.status === 'Accepted').length;
  const totalQuotationsValue = quotations.reduce((sum, q) => sum + q.grandTotal, 0);

  const unpaidInvoices = invoices.filter(i => i.balanceDue > 0);
  const totalUnpaidAmount = unpaidInvoices.reduce((sum, i) => sum + i.balanceDue, 0);

  const overdueInvoices = invoices.filter(i => i.dueDate < todayStr && i.balanceDue > 0);
  const totalOverdueAmount = overdueInvoices.reduce((sum, i) => sum + i.balanceDue, 0);

  // Revenue This Month (Invoice Payments Received + Sales Reports)
  const currentMonthPrefix = todayStr.slice(0, 7); // e.g. "2026-11"
  const invoicePaymentsThisMonth = invoices.reduce((sum, inv) => {
    const monthPayments = (inv.payments || [])
      .filter(p => p.date.startsWith(currentMonthPrefix))
      .reduce((pSum, p) => pSum + p.amount, 0);
    return sum + monthPayments;
  }, 0);

  const totalRevenueThisMonth = invoicePaymentsThisMonth > 0 
    ? invoicePaymentsThisMonth 
    : invoices.reduce((s, inv) => s + (inv.paidAmount || 0), 0);

  // Time-based greeting
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 
    ? t.dashboard.greetingMorning 
    : currentHour < 17 
      ? t.dashboard.greetingAfternoon 
      : t.dashboard.greetingEvening;

  return (
    <div className="space-y-6">
      
      {/* Executive Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-xl bg-slate-900 border border-slate-800 text-white shadow-xs">
        <div className="absolute inset-0 z-0 opacity-25">
          <img 
            src={WORKSPACE_HEADER_PATH} 
            alt="Office Headquarters" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
        </div>

        <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-emerald-400 uppercase">
              <span>{t.appName}</span>
              <span aria-hidden="true">·</span>
              <span>Dar es Salaam HQ</span>
              <span aria-hidden="true">·</span>
              <span>{formatDate(todayStr, lang)}</span>
            </div>
            
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              {greeting}, {currentUser.name.split(' ')[0]}!
            </h1>
            
            <p className="text-sm text-slate-300 leading-relaxed">
              {lang === 'sw' 
                ? 'Ofisi inafanya kazi kwa ufanisi. Kuna wafanyakazi ' + (presentCount + lateCount) + ' kati ya ' + totalEmployees + ' walioingia kazini leo, na idhini ' + pendingApprovals.length + ' zinazosubiri mapitio yako.'
                : 'Office operations running smoothly. ' + (presentCount + lateCount) + ' of ' + totalEmployees + ' staff recorded attendance today, with ' + pendingApprovals.length + ' requests awaiting review.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Prominent Onboard Staff Button */}
            <button
              onClick={onNewEmployeeModal}
              className="px-4 py-2 text-xs font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-xs flex items-center gap-1.5 whitespace-nowrap ring-2 ring-emerald-400/30"
              title="Sajili mfanyakazi mpya kwenye mfumo"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{lang === 'sw' ? '+ Sajili Mfanyakazi Mpya' : '+ Onboard New Staff'}</span>
            </button>

            <button
              onClick={onOpenKiosk}
              className="px-4 py-2 text-xs font-bold bg-white text-slate-900 rounded-lg hover:bg-slate-100 transition-colors shadow-xs flex items-center gap-1.5 whitespace-nowrap"
            >
              <Users className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t.attendance.kioskMode}</span>
            </button>
            
            <button
              onClick={onNewDocModal}
              className="px-3.5 py-2 text-xs font-bold bg-slate-800 border border-slate-700 text-white rounded-lg hover:bg-slate-700 transition-colors shadow-xs flex items-center gap-1.5 whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t.documents.generateWithAi}</span>
            </button>

            <button
              onClick={() => onNavigate('reports')}
              className="px-3.5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors shadow-xs flex items-center gap-1.5 whitespace-nowrap"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>{lang === 'sw' ? 'Ripoti za Uongozi' : 'Management Reports'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5 Executive KPI Metric Strips - Clean Tabular Numbers, Anti-Slop Single-Elevation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* KPI 1: Attendance */}
        <div 
          onClick={() => onNavigate('attendance')}
          className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer transition-all shadow-xs group"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span className="font-medium">{t.dashboard.statPresent}</span>
            <CalendarCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {presentCount + lateCount} / {totalEmployees}
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {attendanceRate}%
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <span>{presentCount} {t.dashboard.onTime}</span>
            <span>·</span>
            <span>{lateCount} {t.dashboard.late}</span>
          </div>
        </div>

        {/* KPI 2: Active Tasks */}
        <div 
          onClick={() => onNavigate('tasks')}
          className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer transition-all shadow-xs group"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span className="font-medium">{t.dashboard.statTasks}</span>
            <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {activeTasks.length}
            </span>
            {urgentTasks.length > 0 && (
              <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                {urgentTasks.length} {lang === 'sw' ? 'za haraka' : 'urgent'}
              </span>
            )}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span>{tasks.filter(t => t.status === 'completed').length} {lang === 'sw' ? 'zimekamilika' : 'completed'}</span>
          </div>
        </div>

        {/* KPI 3: Approvals Pending */}
        <div 
          onClick={() => onNavigate('documents')}
          className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer transition-all shadow-xs group"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span className="font-medium">{t.dashboard.statPendingApprovals}</span>
            <FileCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {pendingApprovals.length}
            </span>
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              {lang === 'sw' ? 'Zinahitaji idhini' : 'Require action'}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span>{approvals.filter(a => a.status === 'approved').length} {lang === 'sw' ? 'zimeidhinishwa' : 'approved'}</span>
          </div>
        </div>

        {/* KPI 4: Assets Value */}
        <div 
          onClick={() => onNavigate('assets')}
          className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer transition-all shadow-xs group"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span className="font-medium">{t.dashboard.statAssets}</span>
            <Package className="w-4 h-4 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg md:text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white truncate">
              {formatCurrency(totalAssetValue, currency)}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>{assets.length} {lang === 'sw' ? 'vifaa jumla' : 'total items'}</span>
            {assetsInRepair.length > 0 && (
              <span className="text-amber-600 dark:text-amber-400 font-medium">{assetsInRepair.length} ukarabati</span>
            )}
          </div>
        </div>

        {/* KPI 5: Monthly Payroll */}
        <div 
          onClick={() => onNavigate('payroll')}
          className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer transition-all shadow-xs group"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span className="font-medium">{t.dashboard.statMonthlyPayroll}</span>
            <Coins className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg md:text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white truncate">
              {formatCurrency(payroll.totalNet, currency)}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>{payroll.totalEmployees} {lang === 'sw' ? 'wafanyakazi' : 'staff'}</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{lang === 'sw' ? 'Imelipwa' : 'Disbursed'}</span>
          </div>
        </div>

      </div>

      {/* Connected Financial & Commercial Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Revenue This Month */}
        <div
          onClick={() => onNavigate('quotations')}
          className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 cursor-pointer transition-all shadow-xs group"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="font-medium">{lang === 'sw' ? 'Mapato ya Mwezi Huu' : 'Revenue This Month'}</span>
            <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {formatCurrency(totalRevenueThisMonth, currency)}
          </div>
          <div className="mt-1 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Kutoka malipo ya ankara</span>
            <span className="text-emerald-600 font-semibold font-mono">✓ Imethibitishwa</span>
          </div>
        </div>

        {/* Metric 2: Total Quotations Sent */}
        <div
          onClick={() => onNavigate('quotations')}
          className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 cursor-pointer transition-all shadow-xs group"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="font-medium">{lang === 'sw' ? 'Nukuu Zilizotumwa' : 'Quotations Sent'}</span>
            <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">
              {totalQuotationsSent} Nukuu
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Thamani: <strong className="font-mono text-slate-700 dark:text-slate-300">{formatCurrency(totalQuotationsValue, currency)}</strong></span>
          </div>
        </div>

        {/* Metric 3: Invoices Unpaid */}
        <div
          onClick={() => onNavigate('quotations')}
          className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-500 cursor-pointer transition-all shadow-xs group"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="font-medium">{lang === 'sw' ? 'Ankara Zinazodaiwa' : 'Invoices Unpaid'}</span>
            <Clock className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">
            {formatCurrency(totalUnpaidAmount, currency)}
          </div>
          <div className="mt-1 text-[11px] text-slate-400 flex items-center justify-between">
            <span>{unpaidInvoices.length} ankara zinasubiri</span>
            {overdueInvoices.length > 0 && (
              <span className="text-rose-600 font-bold font-mono">
                {overdueInvoices.length} {lang === 'sw' ? 'zimechelewa' : 'overdue'}
              </span>
            )}
          </div>
        </div>

        {/* Metric 4: Petty Cash & Stock Alerts */}
        <div
          onClick={() => onNavigate('pettyCash')}
          className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 cursor-pointer transition-all shadow-xs group"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="font-medium">{lang === 'sw' ? 'Baki ya Petty Cash & Stoo' : 'Petty Cash & Stock'}</span>
            <Coins className="w-4 h-4 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
            {formatCurrency(pettyCashBalance, currency)}
          </div>
          <div className="mt-1 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Baki ya fedha ofisini</span>
            {lowStockItems.length > 0 ? (
              <span 
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate('assets');
                }} 
                className="text-amber-600 font-bold hover:underline"
              >
                ⚠️ {lowStockItems.length} vifaa vimepungua
              </span>
            ) : (
              <span className="text-emerald-600 font-medium">✓ Stoo ipo salama</span>
            )}
          </div>
        </div>

      </div>

      {/* Quick Actions Ribbon */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {t.dashboard.quickActions}
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
            {lang === 'sw' ? 'Mifumo ya Haraka' : 'Executive Shortcuts'}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5">
          <button
            onClick={onNewEmployeeModal}
            className="flex items-center justify-center gap-1.5 p-2.5 text-xs font-bold rounded-lg border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 transition-colors shadow-2xs"
            title="Sajili mfanyakazi mpya kwenye mfumo"
          >
            <UserPlus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{t.dashboard.quickNewEmployee}</span>
          </button>

          <button
            onClick={onClockIn}
            className="flex items-center justify-center gap-1.5 p-2.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-colors"
          >
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t.dashboard.quickClockIn}</span>
          </button>

          <button
            onClick={onNewTaskModal}
            className="flex items-center justify-center gap-1.5 p-2.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-colors"
          >
            <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
            <span>{t.dashboard.quickNewTask}</span>
          </button>

          <button
            onClick={onNewDocModal}
            className="flex items-center justify-center gap-1.5 p-2.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-600" />
            <span>{t.dashboard.quickNewDoc}</span>
          </button>

          <button
            onClick={onNewApprovalModal}
            className="flex items-center justify-center gap-1.5 p-2.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-colors"
          >
            <FileCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>{t.dashboard.quickApproval}</span>
          </button>

          <button
            onClick={() => onNavigate('assets')}
            className="flex items-center justify-center gap-1.5 p-2.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-colors"
          >
            <Package className="w-3.5 h-3.5 text-violet-600" />
            <span>{t.dashboard.quickNewAsset}</span>
          </button>

          <button
            onClick={() => onNavigate('payroll')}
            className="flex items-center justify-center gap-1.5 p-2.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-colors"
          >
            <Coins className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t.dashboard.quickRunPayroll}</span>
          </button>
        </div>
      </div>

      {/* Performance Metrics Section with D3 Visualizations */}
      <PerformanceMetricsSection
        lang={lang}
        attendance={attendance}
        tasks={tasks}
        employees={employees}
      />

      {/* Main 2-Column Split: Left (Attendance & Staff Active) vs Right (Approvals & Resource Health) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Attendance & Staff Status */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Today's Attendance Roster */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {t.dashboard.todayAttendanceSummary}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {formatDate(todayStr, lang)} · {presentCount + lateCount} / {totalEmployees} {lang === 'sw' ? 'Wameingia' : 'Recorded'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onNewEmployeeModal}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors"
                  title="Sajili mfanyakazi mpya"
                >
                  <UserPlus className="w-3 h-3" />
                  <span>{lang === 'sw' ? '+ Sajili' : '+ Add'}</span>
                </button>
                <button
                  onClick={() => onNavigate('attendance')}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1"
                >
                  <span>{t.dashboard.viewAll}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Attendance List */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase text-[11px]">
                    <th className="pb-2.5 pl-1">Mfanyakazi</th>
                    <th className="pb-2.5">Idara</th>
                    <th className="pb-2.5">Kuingia</th>
                    <th className="pb-2.5">Mahali</th>
                    <th className="pb-2.5 pr-1">Hali</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
                  {todayAttendance.slice(0, 5).map(record => {
                    const emp = employees.find(e => e.id === record.employeeId);
                    return (
                      <tr key={record.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 pl-1 flex items-center gap-2">
                          <img 
                            src={emp?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64'} 
                            alt={record.employeeName} 
                            className="w-6 h-6 rounded-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <span className="font-semibold text-slate-900 dark:text-white">{record.employeeName}</span>
                        </td>
                        <td className="py-2.5 text-slate-500 dark:text-slate-400">{record.department}</td>
                        <td className="py-2.5 font-mono tabular-nums">{record.clockInTime}</td>
                        <td className="py-2.5 text-slate-500 dark:text-slate-400 capitalize">
                          {record.workLocation === 'office' ? 'Ofisini' : record.workLocation === 'field' ? 'Shambani' : 'Remote'}
                        </td>
                        <td className="py-2.5 pr-1">
                          <span className={`text-[11px] font-semibold ${
                            record.status === 'present' ? 'text-emerald-600 dark:text-emerald-400' :
                            record.status === 'late' ? 'text-amber-600 dark:text-amber-400' :
                            record.status === 'on_leave' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'
                          }`}>
                            {record.status === 'present' ? 'Kwa Wakati' :
                             record.status === 'late' ? 'Amechelewa' :
                             record.status === 'on_leave' ? 'Likizo' : 'Hajaingia'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Active Tasks In Progress */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {lang === 'sw' ? 'Majukumu ya Kipaumbele cha Juu' : 'Priority Tasks & Progress'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {activeTasks.length} {lang === 'sw' ? 'kazi zinaendelea kutekelezwa' : 'tasks currently active'}
                </p>
              </div>
              <button
                onClick={() => onNavigate('tasks')}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1"
              >
                <span>{t.dashboard.viewAll}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {tasks.slice(0, 3).map(task => (
                <div 
                  key={task.id}
                  className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase ${
                        task.priority === 'urgent' ? 'text-rose-600 dark:text-rose-400' :
                        task.priority === 'high' ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400'
                      }`}>
                        {task.priority === 'urgent' ? 'Dharura' : task.priority === 'high' ? 'Kipaumbele Juu' : 'Kawaida'}
                      </span>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{task.department}</span>
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {task.title}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Msimamizi: <span className="font-semibold text-slate-700 dark:text-slate-300">{task.assignedToName}</span> · Ukomo: {formatDate(task.dueDate, lang)}
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 shrink-0">
                    <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                      {task.progressPercentage}%
                    </span>
                    <div className="w-24 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-600 h-full rounded-full transition-all" 
                        style={{ width: `${task.progressPercentage}%` }} 
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right 1 Col: Approvals & Office Health Warnings */}
        <div className="space-y-6">
          
          {/* Pending Approvals */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {t.dashboard.statPendingApprovals}
              </h3>
              <button
                onClick={() => onNavigate('documents')}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
              >
                {t.dashboard.viewAll}
              </button>
            </div>

            {pendingApprovals.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                Hakuna maombi yanayosubiri idhini kwa sasa.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingApprovals.map(req => (
                  <div key={req.id} className="p-3 rounded-lg border border-amber-200/60 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-[11px] font-semibold text-amber-800 dark:text-amber-400">{req.refNumber}</span>
                      <span className="text-[10px] font-bold uppercase text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 px-1.5 py-0.5 rounded">
                        {req.urgency === 'urgent' ? 'Haraka' : 'Kawaida'}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                      {req.title}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span>{req.requesterName}</span>
                      {req.amount && (
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {formatCurrency(req.amount, currency)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Consumables Low Stock Warning */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 text-xs font-bold">
                <AlertTriangle className="w-4 h-4" />
                <span>{t.dashboard.lowStockWarning}</span>
              </div>
              <button
                onClick={() => onNavigate('assets')}
                className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                Stoo
              </button>
            </div>

            {lowStockItems.length === 0 ? (
              <p className="text-xs text-slate-500">Vifaa vyote vya stoo vipo kwenye kiwango salama.</p>
            ) : (
              <div className="space-y-2.5">
                {lowStockItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 dark:border-slate-800 last:border-none">
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">{item.name}</div>
                      <div className="text-[11px] text-slate-400">Kiwango cha chini: {item.minThreshold} {item.unit}</div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                        {item.quantityInStock} {item.unit}
                      </span>
                      <div className="text-[10px] text-rose-500 font-semibold">Agiza Sasa</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Office Quick Contact & Info */}
          <div className="bg-slate-100 dark:bg-slate-800/60 rounded-xl p-4 text-xs space-y-2 text-slate-600 dark:text-slate-400">
            <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
              <span>Mawasiliano ya Utawala</span>
              <span className="text-[11px] font-normal text-emerald-600 dark:text-emerald-400">HQ Dar es Salaam</span>
            </div>
            <p>Samora Avenue, KaziDesk Tower, Floor 7</p>
            <p>Simu: +255 22 211 4450 · Email: utawala@kazidesk.co.tz</p>
          </div>

        </div>

      </div>

    </div>
  );
};
