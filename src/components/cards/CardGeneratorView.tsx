import React, { useState } from 'react';
import { 
  CreditCard, 
  Printer, 
  QrCode, 
  ShieldCheck, 
  Sparkles, 
  Download, 
  RefreshCw, 
  Layers, 
  Wifi, 
  Cpu, 
  CheckCircle2, 
  Eye,
  Sliders,
  Building2,
  Phone
} from 'lucide-react';
import { translations } from '../../utils/translations';
import { Employee } from '../../types/office';
import { formatDate } from '../../utils/formatters';
import { LOGO_PATH } from '../../data/initialData';

interface CardGeneratorViewProps {
  lang: 'sw' | 'en';
  employees: Employee[];
  onUpdateEmployeeCard: (empId: string, cardId: string, expiryDate: string) => void;
  onTestCardInKiosk: (cardId: string) => void;
}

export const CardGeneratorView: React.FC<CardGeneratorViewProps> = ({
  lang,
  employees,
  onUpdateEmployeeCard,
  onTestCardInKiosk
}) => {
  const t = translations[lang];
  const [selectedEmpId, setSelectedEmpId] = useState<string>(employees[0]?.id || '');
  const [cardTheme, setCardTheme] = useState<'navy' | 'emerald' | 'indigo' | 'slate'>('navy');
  const [orientation, setOrientation] = useState<'vertical' | 'horizontal'>('vertical');
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [isBatchPrintModalOpen, setIsBatchPrintModalOpen] = useState<boolean>(false);

  const selectedEmp = employees.find(e => e.id === selectedEmpId) || employees[0];

  const themeStyles = {
    navy: {
      bg: 'bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950',
      accent: 'text-sky-400',
      border: 'border-slate-700',
      badgeBg: 'bg-sky-950 text-sky-300 border-sky-800',
    },
    emerald: {
      bg: 'bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900',
      accent: 'text-emerald-400',
      border: 'border-emerald-800',
      badgeBg: 'bg-emerald-950 text-emerald-300 border-emerald-800',
    },
    indigo: {
      bg: 'bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950',
      accent: 'text-indigo-400',
      border: 'border-indigo-800',
      badgeBg: 'bg-indigo-950 text-indigo-300 border-indigo-800',
    },
    slate: {
      bg: 'bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900',
      accent: 'text-amber-400',
      border: 'border-neutral-700',
      badgeBg: 'bg-neutral-800 text-amber-300 border-neutral-700',
    },
  }[cardTheme];

  const handleGenerateNewCardNumber = () => {
    if (!selectedEmp) return;
    const newCardId = `KD-CRD-${Math.floor(1000 + Math.random() * 9000)}`;
    const newExpiry = `${new Date().getFullYear() + 3}-12-31`;
    onUpdateEmployeeCard(selectedEmp.id, newCardId, newExpiry);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Kitengo cha Kutengeneza Vitambulisho (Staff ID & Smart Card Studio)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Sanifu na chapa kadi rasmi za kielektroniki (Smart PVC Access Cards) zenye RFID, barcode, picha na mipaka ya kazi.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsBatchPrintModalOpen(true)}
            className="px-3.5 py-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 transition-colors shadow-xs flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4 text-emerald-600" />
            <span>Chapa Vitambulisho Vyote (Batch Print)</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Chapa Kadi Hii (Single Print)</span>
          </button>
        </div>
      </div>

      {/* Studio Workspace Split: Left Controls vs Right Interactive Card Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: Studio Settings (5 Cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5">
          
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Mipangilio ya Kitambulisho
            </span>
            <span className="text-xs font-mono font-bold text-emerald-600">
              ISO/IEC 7810 PVC (CR80)
            </span>
          </div>

          {/* Employee Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
              Chagua Mfanyakazi:
            </label>
            <select
              value={selectedEmpId}
              onChange={e => setSelectedEmpId(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
            >
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.fullName} ({emp.roleTitle} - {emp.employeeNo})
                </option>
              ))}
            </select>
          </div>

          {/* Color Theme Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
              Rangi / Mandhari ya Kadi:
            </label>
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => setCardTheme('navy')}
                className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                  cardTheme === 'navy' 
                    ? 'border-sky-500 bg-slate-900 text-sky-400 ring-2 ring-sky-500/30' 
                    : 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                Executive
              </button>

              <button
                onClick={() => setCardTheme('emerald')}
                className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                  cardTheme === 'emerald' 
                    ? 'border-emerald-500 bg-emerald-950 text-emerald-400 ring-2 ring-emerald-500/30' 
                    : 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                Emerald
              </button>

              <button
                onClick={() => setCardTheme('indigo')}
                className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                  cardTheme === 'indigo' 
                    ? 'border-indigo-500 bg-indigo-950 text-indigo-400 ring-2 ring-indigo-500/30' 
                    : 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                Royal
              </button>

              <button
                onClick={() => setCardTheme('slate')}
                className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                  cardTheme === 'slate' 
                    ? 'border-amber-500 bg-neutral-900 text-amber-400 ring-2 ring-amber-500/30' 
                    : 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                Titanium
              </button>
            </div>
          </div>

          {/* Orientation Toggle */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
              Mwelekeo wa Kadi:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setOrientation('vertical')}
                className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                  orientation === 'vertical' 
                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300' 
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Wima (Vertical / Portrait)
              </button>
              <button
                onClick={() => setOrientation('horizontal')}
                className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                  orientation === 'horizontal' 
                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300' 
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Mlalo (Horizontal / Landscape)
              </button>
            </div>
          </div>

          {/* Card ID & Security Keys */}
          {selectedEmp && (
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 dark:text-slate-300">Namba ya Kadi (Card ID):</span>
                <span className="font-mono font-bold text-emerald-600">{selectedEmp.cardId}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 dark:text-slate-300">Namba ya PIN:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{selectedEmp.pin}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 dark:text-slate-300">Ngazi ya Usalama:</span>
                <span className="font-mono font-bold text-sky-600">Level {selectedEmp.accessLevel}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 dark:text-slate-300">Alama ya Kidole:</span>
                <span className={`font-semibold ${selectedEmp.biometricFingerprintEnrolled ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {selectedEmp.biometricFingerprintEnrolled ? 'Imesajiliwa' : 'Haijasajiliwa'}
                </span>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={handleGenerateNewCardNumber}
                  className="w-full py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 transition-colors flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Toa Namba Mpya ya Kadi (Reissue)</span>
                </button>

                <button
                  onClick={() => onTestCardInKiosk(selectedEmp.cardId)}
                  className="w-full py-2 px-3 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Jaribu Kadi Hii Kwenye Kiosk</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Right: Interactive 3D PVC Card Preview (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center space-y-4">
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsFlipped(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                !isFlipped ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              Mbele (Front Face)
            </button>
            <button
              onClick={() => setIsFlipped(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                isFlipped ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              Nyuma (Back Face)
            </button>
          </div>

          {/* The Physical Card Container */}
          {selectedEmp && (
            <div 
              className={`relative rounded-3xl ${themeStyles.bg} text-white shadow-2xl border ${themeStyles.border} overflow-hidden transition-all duration-300 ${
                orientation === 'vertical' 
                  ? 'w-[320px] h-[500px] p-6' 
                  : 'w-[480px] h-[300px] p-6'
              }`}
            >
              {/* Lanyard Hole Clip Simulator */}
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-12 h-2.5 rounded-full bg-slate-950/80 border border-slate-700/60 shadow-inner" />

              {/* CARD FRONT FACE */}
              {!isFlipped ? (
                <div className={`h-full flex flex-col justify-between ${orientation === 'vertical' ? 'pt-2' : ''}`}>
                  
                  {/* Top Header: Logo + Chip */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2.5">
                      <img 
                        src={LOGO_PATH} 
                        alt="Logo" 
                        className="w-8 h-8 rounded-lg object-cover ring-1 ring-white/20" 
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <div className="text-xs font-extrabold tracking-tight uppercase leading-none">
                          KAZIDESK
                        </div>
                        <div className="text-[9px] text-slate-300 font-mono tracking-widest mt-0.5">
                          OFFICE ID PASS
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div className="w-8 h-6 rounded bg-amber-400/80 border border-amber-300/80 flex items-center justify-center shadow-xs">
                        <Cpu className="w-4 h-4 text-amber-950" />
                      </div>
                      <Wifi className="w-3.5 h-3.5 text-sky-400 rotate-90" />
                    </div>
                  </div>

                  {/* Body Content */}
                  {orientation === 'vertical' ? (
                    <div className="text-center space-y-3 py-2">
                      <div className="relative inline-block mx-auto">
                        <img 
                          src={selectedEmp.avatarUrl} 
                          alt={selectedEmp.fullName} 
                          className="w-28 h-28 rounded-2xl object-cover ring-2 ring-white/30 shadow-lg mx-auto" 
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute -bottom-2 -right-1 px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-bold text-[9px] uppercase shadow-sm">
                          VERIFIED
                        </div>
                      </div>

                      <div>
                        <h2 className="text-base font-extrabold text-white tracking-tight">
                          {selectedEmp.fullName}
                        </h2>
                        <p className={`text-xs font-bold ${themeStyles.accent} mt-0.5`}>
                          {selectedEmp.roleTitle}
                        </p>
                        <p className="text-[11px] text-slate-300 mt-0.5">
                          {selectedEmp.department}
                        </p>
                      </div>

                      {/* Security Tier Capsule */}
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[10px] font-mono font-bold tracking-wider">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        <span>CLEARANCE: LEVEL {selectedEmp.accessLevel}</span>
                      </div>
                    </div>
                  ) : (
                    /* Horizontal Layout */
                    <div className="flex items-center gap-5 py-2">
                      <img 
                        src={selectedEmp.avatarUrl} 
                        alt={selectedEmp.fullName} 
                        className="w-28 h-28 rounded-2xl object-cover ring-2 ring-white/30 shadow-lg shrink-0" 
                        referrerPolicy="no-referrer"
                      />
                      <div className="space-y-1.5">
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/10 text-[9px] font-mono font-bold">
                          LEVEL {selectedEmp.accessLevel} ACCESS
                        </div>
                        <h2 className="text-base font-extrabold text-white leading-tight">
                          {selectedEmp.fullName}
                        </h2>
                        <p className={`text-xs font-bold ${themeStyles.accent}`}>
                          {selectedEmp.roleTitle}
                        </p>
                        <p className="text-[11px] text-slate-300">
                          {selectedEmp.department}
                        </p>
                        <p className="text-[10px] font-mono text-slate-400">
                          ID: {selectedEmp.employeeNo}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Card Bottom Bar */}
                  <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-slate-300">
                    <div>
                      <span className="text-slate-400 block text-[8px] uppercase">CARD ID</span>
                      <span className="font-bold text-white tracking-wider">{selectedEmp.cardId}</span>
                    </div>

                    <div className="text-center">
                      <span className="text-slate-400 block text-[8px] uppercase">STAFF NO</span>
                      <span className="font-bold text-white">{selectedEmp.employeeNo}</span>
                    </div>

                    <div className="text-right">
                      <span className="text-slate-400 block text-[8px] uppercase">EXPIRES</span>
                      <span className="font-bold text-white">{selectedEmp.cardExpiryDate}</span>
                    </div>
                  </div>

                </div>
              ) : (
                /* CARD BACK FACE */
                <div className="h-full flex flex-col justify-between pt-2">
                  
                  {/* Magnetic Stripe */}
                  <div className="-mx-6 -mt-2 h-10 bg-slate-950 border-y border-slate-800 shadow-inner" />

                  {/* Security Zones & Barcode */}
                  <div className="space-y-3 pt-2 text-[10px]">
                    
                    <div>
                      <span className="text-[9px] font-bold uppercase text-slate-400 block mb-1">
                        Sehemu Zilizoidhinishwa (Authorized Access Zones):
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {selectedEmp.allowedZones.map((zone, idx) => (
                          <span key={idx} className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[9px] border border-white/10">
                            {zone}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-black/40 border border-white/10 text-[9px] text-slate-300 space-y-1">
                      <p>
                        Kitambulisho hiki ni mali ya <strong>KaziDesk Enterprise Ltd</strong>. Ikiokotwa tafadhali irudishe katika Ghorofa ya 7, KaziDesk Tower, Samora Avenue, Dar es Salaam.
                      </p>
                      <p className="text-slate-400 font-mono">
                        Dharura: {selectedEmp.emergencyContact.phone} · Simu Kuu: +255 22 211 4450
                      </p>
                    </div>

                  </div>

                  {/* QR Code & Barcode Footnote */}
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                    <div className="p-1 bg-white rounded-lg">
                      <QrCode className="w-12 h-12 text-slate-950" />
                    </div>

                    <div className="text-right text-[9px] font-mono text-slate-400">
                      <div>SECURITY PASS AES-256</div>
                      <div className="font-bold text-white">{selectedEmp.cardId}</div>
                      <div className="underline text-slate-300 mt-1">Authorized Signatory</div>
                    </div>
                  </div>

                </div>
              )}

            </div>
          )}

          <p className="text-xs text-slate-400 italic">
            Bonyeza "Mbele" au "Nyuma" kukagua pande zote mbili kabla ya kuchapa.
          </p>

        </div>

      </div>

      {/* Printable Sheet Modal (Batch Print All Staff Cards Grid) */}
      {isBatchPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-white text-slate-900 rounded-2xl w-full max-w-5xl border border-slate-200 shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">
            
            <div className="no-print p-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Karatasi ya Vitambulisho Vyote vya Wafanyakazi (A4 PVC Layout)
                </h3>
                <p className="text-xs text-slate-500">
                  Vitambulisho 8 tayari kwa printa ya PVC kadi au kuchapa kwenye karatasi ngumu ya lamination.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 text-xs font-bold bg-slate-900 text-white rounded-lg hover:bg-slate-800 flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Chapa Ukurasa Huu (Print Now)</span>
                </button>
                <button
                  onClick={() => setIsBatchPrintModalOpen(false)}
                  className="p-1.5 text-slate-500 hover:text-slate-900"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Cards Grid (Standard A4 4x2 Grid with cutting guidelines) */}
            <div className="p-8 overflow-y-auto bg-slate-50">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {employees.map(emp => (
                  <div
                    key={emp.id}
                    className="w-full h-[400px] p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 text-white border-2 border-dashed border-slate-400 shadow-md flex flex-col justify-between text-center relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <div className="flex items-center gap-2 text-left">
                        <img 
                          src={LOGO_PATH} 
                          alt="Logo" 
                          className="w-6 h-6 rounded object-cover" 
                          referrerPolicy="no-referrer"
                        />
                        <span className="text-[10px] font-bold uppercase tracking-wider">KAZIDESK</span>
                      </div>
                      <span className="text-[9px] font-mono text-sky-400 font-bold">LVL {emp.accessLevel}</span>
                    </div>

                    <div className="space-y-2 py-1">
                      <img 
                        src={emp.avatarUrl} 
                        alt={emp.fullName} 
                        className="w-20 h-20 rounded-xl object-cover ring-2 ring-white/30 mx-auto" 
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <div className="text-xs font-bold text-white">{emp.fullName}</div>
                        <div className="text-[10px] text-sky-300 font-semibold">{emp.roleTitle}</div>
                        <div className="text-[9px] text-slate-400">{emp.department}</div>
                      </div>
                    </div>

                    <div className="border-t border-white/10 pt-2 flex items-center justify-between text-[9px] font-mono text-slate-300">
                      <div className="text-left">
                        <span className="text-slate-400 block text-[7px]">CARD NO</span>
                        <span className="font-bold text-white">{emp.cardId}</span>
                      </div>
                      <div className="p-0.5 bg-white rounded">
                        <QrCode className="w-7 h-7 text-slate-950" />
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 block text-[7px]">EXP</span>
                        <span className="font-bold text-white">{emp.cardExpiryDate}</span>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
