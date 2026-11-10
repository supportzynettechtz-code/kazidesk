import React, { useState } from 'react';
import { 
  Wallet, 
  Coins, 
  Printer, 
  Download, 
  CheckCircle2, 
  FileCheck, 
  ArrowUpRight, 
  CreditCard, 
  Building2, 
  User, 
  QrCode,
  ShieldCheck,
  Calendar
} from 'lucide-react';
import { translations } from '../../utils/translations';
import { PayrollRun, PayrollRecord, Employee } from '../../types/office';
import { formatCurrency, formatDate, amountInWordsSwahili } from '../../utils/formatters';
import { exportToCSV } from '../../utils/storage';
import { exportPayrollToCSV } from '../../utils/csvExport';
import { LOGO_PATH } from '../../data/initialData';

interface PayrollViewProps {
  lang: 'sw' | 'en';
  currency: 'TZS' | 'USD';
  payroll: PayrollRun;
  employees: Employee[];
  onDisburseAll: () => void;
  onGenerateNewMonth: (monthName: string) => void;
}

export const PayrollView: React.FC<PayrollViewProps> = ({
  lang,
  currency,
  payroll,
  employees,
  onDisburseAll,
  onGenerateNewMonth
}) => {
  const t = translations[lang];
  const [selectedRecord, setSelectedRecord] = useState<PayrollRecord | null>(null);
  const [isNewMonthModalOpen, setIsNewMonthModalOpen] = useState(false);
  const [newMonthInput, setNewMonthInput] = useState('Desemba 2026');

  const handleExportBankSheet = () => {
    const headers = [
      'Namba ya Mfanyakazi',
      'Jina Kamili',
      'Jina la Benki',
      'Namba ya Akaunti',
      'Kiasi Halisi (Net Salary)',
      'Kumbukumbu ya Malipo',
      'Hali ya Malipo'
    ];
    const rows = payroll.records.map(r => [
      r.employeeNo,
      r.employeeName,
      r.bankName,
      r.accountNumber,
      r.netSalary,
      r.payslipRef,
      r.paymentStatus
    ]);
    exportToCSV(`Bank_Disbursement_Sheet_${payroll.periodCode}`, headers, rows);
  };

  const handleCreateMonthRun = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMonthInput) return;
    onGenerateNewMonth(newMonthInput);
    setIsNewMonthModalOpen(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Title & Actions Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t.payroll.title}
            </h1>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              {payroll.month}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t.payroll.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => exportPayrollToCSV(payroll, 'KaziDesk-Payroll', currency, lang)}
            className="px-3.5 py-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 transition-colors shadow-xs flex items-center gap-1.5"
            title="Hamisha orodha kamili ya mishahara, makato ya TRA na NSSF kwenye CSV"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>{lang === 'sw' ? 'Hamisha Payroll (CSV)' : 'Export Payroll (CSV)'}</span>
          </button>

          <button
            onClick={handleExportBankSheet}
            className="px-3.5 py-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 transition-colors shadow-xs flex items-center gap-1.5"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>{t.payroll.exportBankSheet}</span>
          </button>

          <button
            onClick={() => setIsNewMonthModalOpen(true)}
            className="px-3.5 py-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 transition-colors shadow-xs flex items-center gap-1.5"
          >
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>{t.payroll.generatePayroll}</span>
          </button>

          <button
            onClick={onDisburseAll}
            className="px-3.5 py-2 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{t.payroll.disburseAll}</span>
          </button>
        </div>
      </div>

      {/* 3 Executive Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Gross Payroll */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {t.payroll.statGrossTotal}
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1.5 tabular-nums">
            {formatCurrency(payroll.totalGross, currency)}
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Mshahara wa msingi + posho + muda wa ziada
          </div>
        </div>

        {/* Total Deductions */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {t.payroll.statTotalDeductions}
          </div>
          <div className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-1.5 tabular-nums">
            {formatCurrency(payroll.totalDeductions, currency)}
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            NSSF (10%), PAYE, WCF (1%), na Bima ya Afya
          </div>
        </div>

        {/* Net Disbursement */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {t.payroll.statNetTotal}
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1.5 tabular-nums">
            {formatCurrency(payroll.totalNet, currency)}
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
            <span>Wafanyakazi {payroll.totalEmployees}</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {payroll.status === 'approved' || payroll.status === 'disbursed' ? 'Imeidhinishwa' : 'Rasimu'}
            </span>
          </div>
        </div>

      </div>

      {/* Master Payroll Register Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Daftari Kamili la Mishahara ({payroll.month})
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {payroll.records.length} Wafanyakazi kwenye Orodha
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[11px]">
                <th className="py-3 px-4">Mfanyakazi</th>
                <th className="py-3 px-4">Idara</th>
                <th className="py-3 px-4 text-right">Mshahara wa Msingi</th>
                <th className="py-3 px-4 text-right">Posho</th>
                <th className="py-3 px-4 text-right">Ghafi (Gross)</th>
                <th className="py-3 px-4 text-right">NSSF (10%)</th>
                <th className="py-3 px-4 text-right">PAYE (Kodi)</th>
                <th className="py-3 px-4 text-right">WCF (1%)</th>
                <th className="py-3 px-4 text-right">Halisi (Net)</th>
                <th className="py-3 px-4 text-center">Hali</th>
                <th className="py-3 px-4 text-right">Payslip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {payroll.records.map(rec => {
                const emp = employees.find(e => e.id === rec.employeeId);
                return (
                  <tr key={rec.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 flex items-center gap-2">
                      <img 
                        src={emp?.avatarUrl} 
                        alt={rec.employeeName} 
                        className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700" 
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white leading-tight">
                          {rec.employeeName}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          {rec.employeeNo} · {rec.bankName}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{rec.department}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums">
                      {formatCurrency(rec.basicSalary, currency)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600 dark:text-slate-400">
                      {formatCurrency(rec.totalAllowances, currency)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold tabular-nums text-slate-900 dark:text-white">
                      {formatCurrency(rec.grossSalary, currency)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-500">
                      {formatCurrency(rec.deductions.nssf, currency)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-rose-600 dark:text-rose-400">
                      {formatCurrency(rec.deductions.paye, currency)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-500">
                      {formatCurrency(rec.deductions.wcf, currency)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(rec.netSalary, currency)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        rec.paymentStatus === 'paid' 
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' 
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      }`}>
                        {rec.paymentStatus === 'paid' ? 'Imelipwa' : 'Inasubiri'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedRecord(rec)}
                        className="px-2.5 py-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded transition-colors"
                      >
                        Payslip
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Printable Payslip Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-white text-slate-900 rounded-2xl w-full max-w-2xl border border-slate-200 shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">
            
            {/* Modal Controls (Hidden in Print) */}
            <div className="no-print p-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
              <div className="text-xs font-mono font-bold text-slate-700">
                Payslip Ref: {selectedRecord.payslipRef}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 text-xs font-bold bg-slate-900 text-white rounded-lg hover:bg-slate-800 flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{t.payroll.printPayslip}</span>
                </button>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="p-1.5 text-slate-500 hover:text-slate-900"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Official Payslip Printable Document */}
            <div className="p-8 space-y-6 overflow-y-auto bg-white text-slate-900">
              
              {/* Company Header */}
              <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img 
                    src={LOGO_PATH} 
                    alt="KaziDesk Logo" 
                    className="w-12 h-12 rounded-lg object-cover" 
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h2 className="text-lg font-extrabold uppercase tracking-tight text-slate-900">
                      KAZIDESK ENTERPRISE LTD
                    </h2>
                    <p className="text-[11px] text-slate-600">
                      Ghorofa ya 7, KaziDesk Tower, Mtaa wa Samora, Dar es Salaam
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      TIN: 112-948-203 · BRELA: TZ-BRELA-149822
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    HATI YA MALIPO YA MSHAHARA (PAYSLIP)
                  </div>
                  <div className="text-base font-extrabold text-slate-900 font-mono">
                    {payroll.month}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">
                    Na: {selectedRecord.payslipRef}
                  </div>
                </div>
              </div>

              {/* Employee Particulars Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="space-y-1">
                  <div><strong>Jina Kamili:</strong> {selectedRecord.employeeName}</div>
                  <div><strong>Namba ya Utumishi:</strong> <span className="font-mono">{selectedRecord.employeeNo}</span></div>
                  <div><strong>Idara:</strong> {selectedRecord.department}</div>
                  <div><strong>Wadhifa:</strong> {selectedRecord.roleTitle}</div>
                </div>
                <div className="space-y-1">
                  <div><strong>Benki:</strong> {selectedRecord.bankName}</div>
                  <div><strong>Namba ya Akaunti:</strong> <span className="font-mono">{selectedRecord.accountNumber}</span></div>
                  <div><strong>Tarehe ya Kutoa:</strong> {formatDate(new Date().toISOString().split('T')[0], lang)}</div>
                  <div><strong>Hali ya Malipo:</strong> <span className="font-bold text-emerald-700">IMELIPWA</span></div>
                </div>
              </div>

              {/* 2-Column Ledger: Mapato (Earnings) vs Makato (Deductions) */}
              <div className="grid grid-cols-2 gap-6 text-xs">
                
                {/* Earnings */}
                <div className="space-y-2 border border-slate-200 rounded-xl p-4">
                  <div className="font-bold text-slate-900 uppercase border-b border-slate-200 pb-1.5 flex justify-between">
                    <span>Vipengele vya Mapato</span>
                    <span>Kiasi ({currency})</span>
                  </div>
                  
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span>Mshahara wa Msingi</span>
                    <span className="font-mono tabular-nums font-semibold">{formatCurrency(selectedRecord.basicSalary, currency)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span>Posho ya Nyumba</span>
                    <span className="font-mono tabular-nums">{formatCurrency(selectedRecord.allowances.housing, currency)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span>Posho ya Usafiri</span>
                    <span className="font-mono tabular-nums">{formatCurrency(selectedRecord.allowances.transport, currency)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span>Mawasiliano & Mtandao</span>
                    <span className="font-mono tabular-nums">{formatCurrency(selectedRecord.allowances.communication, currency)}</span>
                  </div>
                  {selectedRecord.overtimePay > 0 && (
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>Saa za Ziada ({selectedRecord.overtimeHours} hrs)</span>
                      <span className="font-mono tabular-nums">{formatCurrency(selectedRecord.overtimePay, currency)}</span>
                    </div>
                  )}

                  <div className="pt-2 font-bold text-slate-900 flex justify-between border-t border-slate-200">
                    <span>JUMLA YA MAPATO (GROSS):</span>
                    <span className="font-mono tabular-nums">{formatCurrency(selectedRecord.grossSalary, currency)}</span>
                  </div>
                </div>

                {/* Deductions */}
                <div className="space-y-2 border border-slate-200 rounded-xl p-4">
                  <div className="font-bold text-slate-900 uppercase border-b border-slate-200 pb-1.5 flex justify-between">
                    <span>Makato ya Kisheria</span>
                    <span>Kiasi ({currency})</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span>NSSF Mfanyakazi (10%)</span>
                    <span className="font-mono tabular-nums">{formatCurrency(selectedRecord.deductions.nssf, currency)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span>PAYE (Kodi ya Mapato)</span>
                    <span className="font-mono tabular-nums">{formatCurrency(selectedRecord.deductions.paye, currency)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span>WCF Mfuko wa Fidia (1%)</span>
                    <span className="font-mono tabular-nums">{formatCurrency(selectedRecord.deductions.wcf, currency)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span>Bima ya Afya (NHIF)</span>
                    <span className="font-mono tabular-nums">{formatCurrency(selectedRecord.deductions.nhif, currency)}</span>
                  </div>
                  {selectedRecord.deductions.heslb > 0 && (
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>Bodi ya Mikopo (HESLB 15%)</span>
                      <span className="font-mono tabular-nums">{formatCurrency(selectedRecord.deductions.heslb, currency)}</span>
                    </div>
                  )}
                  {selectedRecord.deductions.salaryAdvance > 0 && (
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>Mkopo wa Awali (Advance)</span>
                      <span className="font-mono tabular-nums">{formatCurrency(selectedRecord.deductions.salaryAdvance, currency)}</span>
                    </div>
                  )}

                  <div className="pt-2 font-bold text-rose-700 flex justify-between border-t border-slate-200">
                    <span>JUMLA YA MAKATO:</span>
                    <span className="font-mono tabular-nums">{formatCurrency(selectedRecord.totalDeductions, currency)}</span>
                  </div>
                </div>

              </div>

              {/* Net Take Home Pay Highlight Box */}
              <div className="p-4 bg-emerald-50 border-2 border-emerald-600 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="text-xs uppercase font-extrabold text-emerald-800 tracking-wider">
                    MSHAHARA HALISI UNAOLIPWA (NET PAY):
                  </div>
                  <div className="text-xs italic text-slate-600 mt-1">
                    Kiasi kwa Maneno: <strong>{amountInWordsSwahili(selectedRecord.netSalary)}</strong>
                  </div>
                </div>
                <div className="text-2xl md:text-3xl font-extrabold font-mono text-emerald-800 tabular-nums">
                  {formatCurrency(selectedRecord.netSalary, currency)}
                </div>
              </div>

              {/* Verification & Signature */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold">Mhasibu Mkuu / HR:</p>
                  <p className="mt-6 font-semibold underline">Bw. Baraka Mhagama (CPA)</p>
                  <p className="text-[10px] text-slate-500">KaziDesk Finance Department</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 border border-slate-200 rounded-lg bg-slate-50 text-center">
                    <QrCode className="w-12 h-12 text-slate-800 mx-auto" />
                    <span className="text-[9px] font-mono text-slate-500">QR-VERIFY</span>
                  </div>
                  <div className="text-[10px] text-slate-500 max-w-[140px] leading-tight">
                    Hati hii imetolewa kielektroniki na ni halali bila mhuri wa wino.
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* New Month Payroll Modal */}
      {isNewMonthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-md border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden p-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Tengeneza Payroll ya Mwezi Mpya
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Mfumo utakokotoa upya mishahara, saa za ziada na makato ya kisheria kwa wafanyakazi wote kulingana na viwango vilivyopo.
            </p>

            <form onSubmit={handleCreateMonthRun} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Mwezi na Mwaka:
                </label>
                <input
                  type="text"
                  required
                  value={newMonthInput}
                  onChange={e => setNewMonthInput(e.target.value)}
                  placeholder="Mfano: Desemba 2026"
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewMonthModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 dark:text-slate-300"
                >
                  Ghairi
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  Kokotoa Payroll
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
