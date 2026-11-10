/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AttendanceRecord, PayrollRun, PettyCashVoucher } from '../types/office';

/**
 * Helper to escape CSV cell content properly
 */
const escapeCSV = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return '""';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
};

/**
 * Downloads a CSV string with UTF-8 BOM to guarantee proper accents in Excel & Sheets
 */
export const downloadCSV = (filename: string, csvContent: string): void => {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// ---------------------------------------------------------------------------
// 1. ATTENDANCE CSV EXPORT
// ---------------------------------------------------------------------------
export const exportAttendanceToCSV = (
  records: AttendanceRecord[],
  filenamePrefix: string = 'KaziDesk-Mahudhurio',
  lang: 'sw' | 'en' = 'sw'
): void => {
  const isSw = lang === 'sw';
  const headers = isSw
    ? [
        'Namba ya Mfanyakazi',
        'Jina Kamili',
        'Idara',
        'Tarehe',
        'Muda wa Kuingia',
        'Muda wa Kutoka',
        'Jumla ya Masaa',
        'Hali ya Mahudhurio',
        'Eneo la Kazi',
        'Njia ya Uhakiki',
        'Maelezo ya Ziada',
      ]
    : [
        'Employee ID',
        'Full Name',
        'Department',
        'Date',
        'Clock In Time',
        'Clock Out Time',
        'Total Hours',
        'Attendance Status',
        'Work Location',
        'Verification Method',
        'Notes',
      ];

  const rows = records.map(r => {
    let statusLabel: string = r.status;
    if (isSw) {
      if (r.status === 'present') statusLabel = 'Amehudhuria (Wakati)';
      else if (r.status === 'late') statusLabel = 'Amechelewa';
      else if (r.status === 'half_day') statusLabel = 'Nusu Siku';
      else if (r.status === 'absent') statusLabel = 'Hajahudhuria';
      else if (r.status === 'on_leave') statusLabel = 'Yuko Likizo';
    }

    return [
      escapeCSV(r.employeeNo || '-'),
      escapeCSV(r.employeeName || '-'),
      escapeCSV(r.department || '-'),
      escapeCSV(r.date || '-'),
      escapeCSV(r.clockInTime || '-'),
      escapeCSV(r.clockOutTime || '-'),
      escapeCSV(r.totalHours ? r.totalHours.toFixed(1) : '-'),
      escapeCSV(statusLabel),
      escapeCSV(r.workLocation || 'Ofisi Kuu'),
      escapeCSV(r.verificationMethod || 'Biometric/Web'),
      escapeCSV(r.notes || '-'),
    ].join(',');
  });

  const csvString = [headers.map(h => escapeCSV(h)).join(','), ...rows].join('\r\n');
  const dateStr = new Date().toISOString().split('T')[0];
  downloadCSV(`${filenamePrefix}-${dateStr}.csv`, csvString);
};

// ---------------------------------------------------------------------------
// 2. PAYROLL CSV EXPORT
// ---------------------------------------------------------------------------
export const exportPayrollToCSV = (
  payroll: PayrollRun,
  filenamePrefix: string = 'KaziDesk-Mishahara-Payroll',
  currency: string = 'TZS',
  lang: 'sw' | 'en' = 'sw'
): void => {
  const isSw = lang === 'sw';
  const headers = isSw
    ? [
        'Namba ya Mfanyakazi',
        'Jina Kamili',
        'Idara',
        'Wadhifa',
        'Kumbukumbu ya Payslip',
        `Mshahara wa Msingi (${currency})`,
        `Posho ya Nyumba (${currency})`,
        `Posho ya Usafiri (${currency})`,
        `Posho ya Mawasiliano (${currency})`,
        `Posho Nyingine (${currency})`,
        `Jumla ya Posho (${currency})`,
        `Mshahara Mkuu - Gross (${currency})`,
        `NSSF (10%) (${currency})`,
        `PAYE - Kodi (${currency})`,
        `NHIF (${currency})`,
        `Jumla ya Makato (${currency})`,
        `Mshahara Halisi - Net Pay (${currency})`,
        'Benki',
        'Namba ya Akaunti',
        'Hali ya Malipo',
      ]
    : [
        'Employee ID',
        'Full Name',
        'Department',
        'Role Title',
        'Payslip Reference',
        `Basic Salary (${currency})`,
        `Housing Allowance (${currency})`,
        `Transport Allowance (${currency})`,
        `Communication Allowance (${currency})`,
        `Other Allowances (${currency})`,
        `Total Allowances (${currency})`,
        `Gross Salary (${currency})`,
        `NSSF (10%) (${currency})`,
        `PAYE Tax (${currency})`,
        `NHIF (${currency})`,
        `Total Deductions (${currency})`,
        `Net Pay (${currency})`,
        'Bank Name',
        'Account Number',
        'Payment Status',
      ];

  const rows = (payroll.records || []).map(rec => {
    return [
      escapeCSV(rec.employeeNo || '-'),
      escapeCSV(rec.employeeName || '-'),
      escapeCSV(rec.department || '-'),
      escapeCSV(rec.roleTitle || '-'),
      escapeCSV(rec.payslipRef || '-'),
      escapeCSV(rec.basicSalary || 0),
      escapeCSV(rec.allowances?.housing || 0),
      escapeCSV(rec.allowances?.transport || 0),
      escapeCSV(rec.allowances?.communication || 0),
      escapeCSV(rec.allowances?.other || 0),
      escapeCSV(rec.totalAllowances || 0),
      escapeCSV(rec.grossSalary || 0),
      escapeCSV(rec.deductions?.nssf || 0),
      escapeCSV(rec.deductions?.paye || 0),
      escapeCSV(rec.deductions?.nhif || 0),
      escapeCSV(rec.totalDeductions || 0),
      escapeCSV(rec.netSalary || 0),
      escapeCSV(rec.bankName || '-'),
      escapeCSV(rec.accountNumber || '-'),
      escapeCSV(rec.paymentStatus === 'paid' ? (isSw ? 'Imelipwa' : 'Disbursed') : (isSw ? 'Inasubiri' : 'Unpaid')),
    ].join(',');
  });

  // Summary Row
  const totalRow = [
    escapeCSV(isSw ? 'JUMLA KUU' : 'TOTALS'),
    escapeCSV(`${payroll.records.length} Staff`),
    escapeCSV('-'),
    escapeCSV('-'),
    escapeCSV('-'),
    escapeCSV('-'),
    escapeCSV('-'),
    escapeCSV('-'),
    escapeCSV('-'),
    escapeCSV('-'),
    escapeCSV('-'),
    escapeCSV(payroll.totalGross || 0),
    escapeCSV('-'),
    escapeCSV('-'),
    escapeCSV('-'),
    escapeCSV(payroll.totalDeductions || 0),
    escapeCSV(payroll.totalNet || 0),
    escapeCSV('-'),
    escapeCSV('-'),
    escapeCSV('-'),
    escapeCSV('-'),
    escapeCSV('-'),
  ].join(',');

  const csvString = [headers.map(h => escapeCSV(h)).join(','), ...rows, totalRow].join('\r\n');
  const monthTag = (payroll.month || 'Mwezi').replace(/\s+/g, '-');
  downloadCSV(`${filenamePrefix}-${monthTag}.csv`, csvString);
};

// ---------------------------------------------------------------------------
// 3. PETTY CASH CSV EXPORT
// ---------------------------------------------------------------------------
export const exportPettyCashToCSV = (
  vouchers: PettyCashVoucher[],
  filenamePrefix: string = 'KaziDesk-Petty-Cash',
  currency: string = 'TZS',
  lang: 'sw' | 'en' = 'sw'
): void => {
  const isSw = lang === 'sw';
  const headers = isSw
    ? [
        'Namba ya Vocha (Voucher No)',
        'Tarehe',
        'Aina ya Muamala',
        'Kundi la Matumizi',
        `Kiasi (${currency})`,
        'Mpokeaji / Mtoa Huduma (Payee)',
        'Maelezo ya Matumizi',
        'Aliyeomba (Requested By)',
        'Aliyeidhinisha (Approved By)',
        'Namba ya Risiti',
        'Hali ya Vocha',
      ]
    : [
        'Voucher No',
        'Date',
        'Transaction Type',
        'Expense Category',
        `Amount (${currency})`,
        'Payee / Vendor',
        'Purpose / Description',
        'Requested By',
        'Approved By',
        'Receipt Number',
        'Status',
      ];

  const categoryNames: Record<string, string> = {
    stationery: isSw ? 'Vifaa vya Ofisi (Stationery)' : 'Stationery',
    refreshments: isSw ? 'Vinywaji & Ukarimu (Refreshments)' : 'Refreshments',
    transport: isSw ? 'Usafiri wa Dharura (Transport)' : 'Local Transport',
    emergency_repair: isSw ? 'Ukarabati wa Dharura (Repair)' : 'Emergency Repair',
    cleaning_supplies: isSw ? 'Vifaa vya Usafi (Cleaning)' : 'Cleaning Supplies',
    office_supplies: isSw ? 'Mahitaji Mengine (Supplies)' : 'Office Supplies',
  };

  const rows = vouchers.map(v => {
    const typeLabel = v.type === 'replenishment' ? (isSw ? 'Kuongeza Mfuko' : 'Replenishment') : (isSw ? 'Malipo / Matumizi' : 'Disbursement');
    const catLabel = categoryNames[v.category] || v.category;
    const statusLabel = v.status === 'settled' ? (isSw ? 'Imekamilika (Settled)' : 'Settled') : (isSw ? 'Inasubiri Risiti' : 'Pending Receipt');

    return [
      escapeCSV(v.voucherNo),
      escapeCSV(v.date),
      escapeCSV(typeLabel),
      escapeCSV(catLabel),
      escapeCSV(v.amount),
      escapeCSV(v.payeeOrVendor),
      escapeCSV(v.description),
      escapeCSV(v.requestedBy),
      escapeCSV(v.approvedBy),
      escapeCSV(v.receiptNumber || '-'),
      escapeCSV(statusLabel),
    ].join(',');
  });

  const totalSpent = vouchers.reduce((sum, v) => sum + (v.amount || 0), 0);
  const totalRow = [
    escapeCSV(isSw ? 'JUMLA YA MATUMIZI' : 'TOTAL EXPENDITURE'),
    escapeCSV('-'),
    escapeCSV('-'),
    escapeCSV('-'),
    escapeCSV(totalSpent),
    escapeCSV('-'),
    escapeCSV('-'),
    escapeCSV('-'),
    escapeCSV('-'),
    escapeCSV('-'),
    escapeCSV('-'),
  ].join(',');

  const csvString = [headers.map(h => escapeCSV(h)).join(','), ...rows, totalRow].join('\r\n');
  const dateStr = new Date().toISOString().split('T')[0];
  downloadCSV(`${filenamePrefix}-${dateStr}.csv`, csvString);
};

// ---------------------------------------------------------------------------
// 4. MANAGEMENT SUMMARY REPORT CSV EXPORT
// ---------------------------------------------------------------------------
export interface ManagementSummaryData {
  monthName: string;
  totalEmployees: number;
  // Tasks
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  taskCompletionRate: number;
  // Attendance
  totalAttendanceLogs: number;
  onTimeArrivals: number;
  lateArrivals: number;
  punctualityRate: number;
  totalWorkHours: number;
  // Petty Cash
  totalPettyCashDisbursed: number;
  settledVouchersCount: number;
  pendingReceiptsCount: number;
  topPettyCashCategory: string;
  // Financial Overview
  payrollGrossTotal: number;
  payrollNetTotal: number;
}

export const exportManagementSummaryToCSV = (
  data: ManagementSummaryData,
  currency: string = 'TZS',
  lang: 'sw' | 'en' = 'sw'
): void => {
  const isSw = lang === 'sw';
  const headers = isSw
    ? ['Kipengele cha Tathmini (Metric / KPI)', 'Kiwango / Thamani (Value)', 'Hali & Ufafanuzi (Status)']
    : ['Management KPI / Metric', 'Value', 'Status & Evaluation'];

  const rows = [
    [escapeCSV(isSw ? 'Kipindi cha Ripoti' : 'Reporting Period'), escapeCSV(data.monthName), escapeCSV('KaziDesk Monthly Cycle')],
    [escapeCSV(isSw ? 'Jumla ya Wafanyakazi' : 'Total Staff Count'), escapeCSV(data.totalEmployees), escapeCSV(isSw ? 'Wafanyakazi Waliosajiliwa' : 'Registered Staff')],
    [escapeCSV(isSw ? 'Jumla ya Majukumu (Tasks)' : 'Total Assigned Tasks'), escapeCSV(data.totalTasks), escapeCSV(isSw ? 'Kazi zilizotolewa' : 'Tasks tracked')],
    [escapeCSV(isSw ? 'Kazi Zilizokamilika' : 'Completed Tasks'), escapeCSV(data.completedTasks), escapeCSV(`${data.taskCompletionRate}% Completion Rate`)],
    [escapeCSV(isSw ? 'Kazi Zinazoendelea' : 'In-Progress Tasks'), escapeCSV(data.inProgressTasks), escapeCSV(isSw ? 'Utekelezaji Unaendelea' : 'Active workload')],
    [escapeCSV(isSw ? 'Kiwango cha Mahudhurio (Punctuality)' : 'Punctuality Rate'), escapeCSV(`${data.punctualityRate}%`), escapeCSV(data.punctualityRate >= 80 ? (isSw ? 'Bora Sana' : 'Excellent') : (isSw ? 'Inahitaji Uangalizi' : 'Needs Attention'))],
    [escapeCSV(isSw ? 'Waliofika kwa Wakati' : 'On-Time Clock-Ins'), escapeCSV(data.onTimeArrivals), escapeCSV(isSw ? 'Kabla au saa 08:00' : 'Before or at 08:00 AM')],
    [escapeCSV(isSw ? 'Waliofika wakiwa wamechelewa' : 'Late Clock-Ins'), escapeCSV(data.lateArrivals), escapeCSV(isSw ? 'Baada ya saa 08:15' : 'After 08:15 AM')],
    [escapeCSV(isSw ? 'Jumla ya Masaa ya Kazi' : 'Total Work Hours Rendered'), escapeCSV(`${data.totalWorkHours.toFixed(1)} hrs`), escapeCSV(isSw ? 'Masaa ya uzalishaji' : 'Logged productivity hours')],
    [escapeCSV(isSw ? `Matumizi ya Petty Cash (${currency})` : `Petty Cash Spent (${currency})`), escapeCSV(data.totalPettyCashDisbursed), escapeCSV(`Top: ${data.topPettyCashCategory}`)],
    [escapeCSV(isSw ? 'Vocha Zilizothibitishwa (Settled)' : 'Settled Vouchers'), escapeCSV(data.settledVouchersCount), escapeCSV(isSw ? 'Risiti zimewasilishwa' : 'Receipts verified')],
    [escapeCSV(isSw ? 'Vocha Zinazosubiri Risiti' : 'Pending Receipts'), escapeCSV(data.pendingReceiptsCount), escapeCSV(data.pendingReceiptsCount > 0 ? (isSw ? 'Zinafuatiliwa' : 'Follow-up needed') : (isSw ? 'Safi' : 'Reconciled'))],
    [escapeCSV(isSw ? `Jumla ya Payroll Gross (${currency})` : `Total Payroll Gross (${currency})`), escapeCSV(data.payrollGrossTotal), escapeCSV(isSw ? 'Mshahara jumla' : 'Gross obligation')],
    [escapeCSV(isSw ? `Jumla ya Payroll Net (${currency})` : `Total Payroll Net (${currency})`), escapeCSV(data.payrollNetTotal), escapeCSV(isSw ? 'Zilizotolewa kwa wafanyakazi' : 'Disbursed net salary')],
  ].map(r => r.join(','));

  const csvString = [headers.map(h => escapeCSV(h)).join(','), ...rows].join('\r\n');
  const filename = `KaziDesk-Management-Summary-${data.monthName.replace(/\s+/g, '-')}.csv`;
  downloadCSV(filename, csvString);
};
