import React, { useState } from 'react';
import { 
  Coins, 
  Plus, 
  ArrowDownRight, 
  ArrowUpRight, 
  Printer, 
  CheckCircle2, 
  Receipt, 
  Search,
  Wallet,
  Calendar,
  Building,
  Download
} from 'lucide-react';
import { translations } from '../../utils/translations';
import { PettyCashVoucher, CurrentUser } from '../../types/office';
import { formatCurrency, formatDate, amountInWordsSwahili } from '../../utils/formatters';
import { exportPettyCashToCSV } from '../../utils/csvExport';
import { LOGO_PATH } from '../../data/initialData';

interface PettyCashViewProps {
  lang: 'sw' | 'en';
  currency: 'TZS' | 'USD';
  currentUser: CurrentUser;
  vouchers: PettyCashVoucher[];
  onAddVoucher: (v: Omit<PettyCashVoucher, 'id'>) => void;
}

export const PettyCashView: React.FC<PettyCashViewProps> = ({
  lang,
  currency,
  currentUser,
  vouchers,
  onAddVoucher
}) => {
  const t = translations[lang];
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVoucher, setSelectedVoucher] = useState<PettyCashVoucher | null>(null);

  // New Voucher Modal
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [voucherType, setVoucherType] = useState<'disbursement' | 'replenishment'>('disbursement');
  const [category, setCategory] = useState<any>('office_supplies');
  const [amount, setAmount] = useState('');
  const [payee, setPayee] = useState('');
  const [description, setDescription] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');

  // Calculate current cash float balance
  const cashIn = vouchers.filter(v => v.type === 'replenishment').reduce((sum, v) => sum + v.amount, 0);
  const cashOut = vouchers.filter(v => v.type === 'disbursement').reduce((sum, v) => sum + v.amount, 0);
  const currentFloat = cashIn - cashOut;

  const filteredVouchers = vouchers.filter(v => 
    v.voucherNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.payeeOrVendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) return;

    const vNo = `PV/${new Date().getFullYear()}/${(100 + vouchers.length + 1)}`;
    onAddVoucher({
      voucherNo: vNo,
      date: new Date().toISOString().split('T')[0],
      type: voucherType,
      category,
      amount: parseFloat(amount),
      payeeOrVendor: payee || (voucherType === 'replenishment' ? 'Benki Kuu ya Ofisi' : 'Mfanyabiashara'),
      description,
      requestedBy: currentUser.name,
      approvedBy: 'Bw. Baraka Mhagama (CPA)',
      receiptNumber: receiptNumber || `EFD-${Math.floor(100000 + Math.random() * 900000)}`,
      status: 'settled',
    });

    setIsVoucherModalOpen(false);
    setAmount('');
    setPayee('');
    setDescription('');
    setReceiptNumber('');
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t.pettyCash.title}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t.pettyCash.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setVoucherType('replenishment');
              setIsVoucherModalOpen(true);
            }}
            className="px-3.5 py-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 transition-colors shadow-xs flex items-center gap-1.5"
          >
            <ArrowDownRight className="w-4 h-4 text-emerald-600" />
            <span>{t.pettyCash.replenishCash}</span>
          </button>

          <button
            onClick={() => exportPettyCashToCSV(filteredVouchers, 'KaziDesk-Petty-Cash', currency, lang)}
            className="px-3.5 py-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 transition-colors shadow-xs flex items-center gap-1.5"
            title="Hamisha vocha zote za petty cash kwenye faili la CSV"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>{lang === 'sw' ? 'Hamisha CSV' : 'Export CSV'}</span>
          </button>

          <button
            onClick={() => {
              setVoucherType('disbursement');
              setIsVoucherModalOpen(true);
            }}
            className="px-3.5 py-2 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>{t.pettyCash.newVoucher}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Float Balance */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>{t.pettyCash.currentBalance}</span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1.5 tabular-nums">
            {formatCurrency(currentFloat, currency)}
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Pesa zilizopo sandukuni la ofisi kwa sasa
          </div>
        </div>

        {/* Total Spent */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>{t.pettyCash.totalSpentThisMonth}</span>
            <ArrowUpRight className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-1.5 tabular-nums">
            {formatCurrency(cashOut, currency)}
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Matumizi yaliyofanyika mwezi huu
          </div>
        </div>

        {/* Replenished Total */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Jumla Iliyowekwa Mfukoni</span>
            <ArrowDownRight className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1.5 tabular-nums">
            {formatCurrency(cashIn, currency)}
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Pesa zilizotolewa benki kujaza float
          </div>
        </div>

      </div>

      {/* Vouchers Register Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Daftari la Vocha za Malipo (Petty Cash Ledger)
          </h3>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tafuta vocha kwa namba au maelezo..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase text-[11px]">
                <th className="py-3 px-4">Vocha Namba</th>
                <th className="py-3 px-4">Tarehe</th>
                <th className="py-3 px-4">Aina</th>
                <th className="py-3 px-4">Mpokeaji / Duka</th>
                <th className="py-3 px-4">Maelezo</th>
                <th className="py-3 px-4 text-right">Kiasi</th>
                <th className="py-3 px-4">Imeidhinishwa Na</th>
                <th className="py-3 px-4 text-right">Vocha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredVouchers.map(v => (
                <tr key={v.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                    {v.voucherNo}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500">{formatDate(v.date, lang)}</td>
                  <td className="py-3 px-4">
                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                      v.type === 'replenishment' 
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300' 
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                    }`}>
                      {v.type === 'replenishment' ? 'Kujaza Pesa (+)' : 'Matumizi (-)'}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                    {v.payeeOrVendor}
                  </td>
                  <td className="py-3 px-4 max-w-[240px] truncate" title={v.description}>
                    {v.description}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold tabular-nums">
                    <span className={v.type === 'replenishment' ? 'text-blue-600' : 'text-slate-900 dark:text-white'}>
                      {formatCurrency(v.amount, currency)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500">{v.approvedBy}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setSelectedVoucher(v)}
                      className="px-2 py-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950 rounded"
                    >
                      Vocha
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Payment Voucher Modal */}
      {selectedVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-white text-slate-900 rounded-2xl w-full max-w-xl border border-slate-200 shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">
            
            <div className="no-print p-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
              <span className="font-mono text-xs font-bold">{selectedVoucher.voucherNo}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 text-xs font-bold bg-slate-900 text-white rounded-lg hover:bg-slate-800 flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{t.pettyCash.printVoucher}</span>
                </button>
                <button
                  onClick={() => setSelectedVoucher(null)}
                  className="p-1.5 text-slate-500 hover:text-slate-900"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-8 space-y-6 overflow-y-auto bg-white text-slate-900">
              
              <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-extrabold uppercase">KAZIDESK ENTERPRISE LTD</h2>
                  <p className="text-[10px] text-slate-600">PETTY CASH PAYMENT VOUCHER</p>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm font-bold">{selectedVoucher.voucherNo}</div>
                  <div className="text-[10px] font-mono text-slate-500">Tarehe: {formatDate(selectedVoucher.date, lang)}</div>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex border-b border-slate-100 py-1.5">
                  <span className="w-36 font-bold text-slate-600">Mlipwaji (Payee):</span>
                  <span className="font-semibold">{selectedVoucher.payeeOrVendor}</span>
                </div>

                <div className="flex border-b border-slate-100 py-1.5">
                  <span className="w-36 font-bold text-slate-600">Madhumuni / Maelezo:</span>
                  <span>{selectedVoucher.description}</span>
                </div>

                <div className="flex border-b border-slate-100 py-1.5">
                  <span className="w-36 font-bold text-slate-600">Namba ya Risiti (EFD):</span>
                  <span className="font-mono font-semibold">{selectedVoucher.receiptNumber || 'EFD-HALALI'}</span>
                </div>

                <div className="flex border-b border-slate-100 py-1.5">
                  <span className="w-36 font-bold text-slate-600">Kiasi cha Fedha:</span>
                  <span className="font-mono text-base font-extrabold text-emerald-800">
                    {formatCurrency(selectedVoucher.amount, currency)}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg text-slate-700 italic border border-slate-200">
                  Kiasi kwa Maneno: <strong>{amountInWordsSwahili(selectedVoucher.amount)}</strong>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-8 text-center text-xs border-t border-slate-200">
                <div>
                  <div className="border-b border-slate-400 pb-1 mb-1 font-semibold">{selectedVoucher.requestedBy}</div>
                  <div className="text-[10px] text-slate-500">Aliyeomba</div>
                </div>
                <div>
                  <div className="border-b border-slate-400 pb-1 mb-1 font-semibold">{selectedVoucher.approvedBy}</div>
                  <div className="text-[10px] text-slate-500">Aliyeidhinisha (Mhasibu)</div>
                </div>
                <div>
                  <div className="border-b border-slate-400 pb-1 mb-1 font-semibold">................................</div>
                  <div className="text-[10px] text-slate-500">Saini ya Mpokeaji</div>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* New Voucher Modal */}
      {isVoucherModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-md border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden p-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              {voucherType === 'replenishment' ? 'Weka Pesa Mfukoni (Replenish Cash Float)' : 'Andika Vocha ya Malipo (New Voucher)'}
            </h3>

            <form onSubmit={handleCreateVoucher} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 uppercase mb-1">Kiasi cha Fedha ({currency}):</label>
                <input
                  type="number"
                  required
                  placeholder="Kiasi cha fedha"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 uppercase mb-1">Mlipwaji (Duka / Mfanyakazi):</label>
                <input
                  type="text"
                  required
                  placeholder="Mfano: Mama Ashura Catering au Duka la Vifaa"
                  value={payee}
                  onChange={e => setPayee(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 uppercase mb-1">Aina ya Matumizi:</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="refreshments">Chai, Kahawa & Vitafunwa (Refreshments)</option>
                  <option value="stationery">Stationery & Karatasi za Dharura</option>
                  <option value="emergency_repair">Ukarabati wa Dharura (Maji, Umeme, AC)</option>
                  <option value="transport">Nauli ya Kikazi / Dispatch</option>
                  <option value="cleaning_supplies">Vifaa vya Usafi</option>
                  <option value="office_supplies">Matumizi Mengine ya Ofisi</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-600 uppercase mb-1">Maelezo Kamili ya Matumizi:</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Eleza kwanini matumizi haya yamefanyika..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 uppercase mb-1">Namba ya Risiti ya EFD / TRA (Hiari):</label>
                <input
                  type="text"
                  placeholder="Mfano: EFD-889102"
                  value={receiptNumber}
                  onChange={e => setReceiptNumber(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsVoucherModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 dark:text-slate-300"
                >
                  Ghairi
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  Hifadhi Vocha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
