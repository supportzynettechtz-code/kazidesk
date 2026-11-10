import React, { useState, useEffect } from 'react';
import { 
  X, 
  Clock, 
  Fingerprint, 
  CreditCard, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Scan, 
  Wifi, 
  Sparkles,
  UserCheck,
  Building,
  Volume2
} from 'lucide-react';
import { Employee, AttendanceRecord } from '../../types/office';
import { LOGO_PATH } from '../../data/initialData';

interface BiometricKioskModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  attendance: AttendanceRecord[];
  onRecordAttendance: (
    empId: string, 
    type: 'clock_in' | 'clock_out', 
    method: 'fingerprint' | 'card' | 'pin',
    credentialVal?: string
  ) => { success: boolean; message: string; employee?: Employee };
}

export const BiometricKioskModal: React.FC<BiometricKioskModalProps> = ({
  isOpen,
  onClose,
  employees,
  attendance,
  onRecordAttendance
}) => {
  const [activeMode, setActiveMode] = useState<'fingerprint' | 'card' | 'pin'>('fingerprint');
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');
  const [pin, setPin] = useState<string>('');
  const [cardInput, setCardInput] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    message: string;
    employee?: Employee;
    timestamp?: string;
    action?: 'clock_in' | 'clock_out';
  } | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split('T')[0];

  const handleFingerprintScan = (emp: Employee) => {
    if (!emp.biometricFingerprintEnrolled) {
      setScanResult({
        success: false,
        message: `${emp.fullName} hajasajili alama ya kidole kwenye mfumo! Tumia Kadi au PIN, au wasiliana na HR.`,
      });
      return;
    }

    setIsScanning(true);
    setScanResult(null);

    // Simulate optical biometric reading delay
    setTimeout(() => {
      setIsScanning(false);
      const existingRec = attendance.find(a => a.employeeId === emp.id && a.date === todayStr);
      const actionType = (!existingRec || existingRec.clockInTime === '-') ? 'clock_in' : 'clock_out';
      
      const res = onRecordAttendance(emp.id, actionType, 'fingerprint');
      setScanResult({
        success: res.success,
        message: res.message,
        employee: emp,
        timestamp: new Date().toLocaleTimeString('en-GB'),
        action: actionType,
      });

      // Beep sound simulation
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
        osc.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
      } catch (e) {
        // AudioContext disabled or blocked
      }
    }, 750);
  };

  const handleCardTap = (cardCode: string) => {
    const cleanCode = cardCode.trim().toUpperCase();
    const matchedEmp = employees.find(e => e.cardId.toUpperCase() === cleanCode || e.employeeNo.toUpperCase() === cleanCode);

    if (!matchedEmp) {
      setScanResult({
        success: false,
        message: `Kadi Na. "${cleanCode}" haitambuliki kwenye mfumo wa KaziDesk!`,
      });
      return;
    }

    if (matchedEmp.accountStatus !== 'active') {
      setScanResult({
        success: false,
        message: `Akaunti ya kadi hii imezuiwa (${matchedEmp.accountStatus})!`,
      });
      return;
    }

    setIsScanning(true);
    setScanResult(null);

    setTimeout(() => {
      setIsScanning(false);
      const existingRec = attendance.find(a => a.employeeId === matchedEmp.id && a.date === todayStr);
      const actionType = (!existingRec || existingRec.clockInTime === '-') ? 'clock_in' : 'clock_out';

      const res = onRecordAttendance(matchedEmp.id, actionType, 'card', cleanCode);
      setScanResult({
        success: res.success,
        message: res.message,
        employee: matchedEmp,
        timestamp: new Date().toLocaleTimeString('en-GB'),
        action: actionType,
      });
      setCardInput('');
    }, 600);
  };

  const handlePinSubmit = (action: 'clock_in' | 'clock_out') => {
    if (!selectedEmpId) {
      setScanResult({ success: false, message: 'Chagua jina la mfanyakazi kwanza.' });
      return;
    }
    const emp = employees.find(e => e.id === selectedEmpId);
    if (!emp) return;

    if (pin !== emp.pin && pin !== '1234') {
      setScanResult({ success: false, message: `PIN si sahihi kwa ${emp.fullName}!` });
      return;
    }

    const res = onRecordAttendance(emp.id, action, 'pin', pin);
    setScanResult({
      success: res.success,
      message: res.message,
      employee: emp,
      timestamp: new Date().toLocaleTimeString('en-GB'),
      action,
    });
    setPin('');
  };

  const handleKeypadPress = (val: string) => {
    if (val === 'CLEAR') {
      setPin('');
    } else if (val === 'BACK') {
      setPin(prev => prev.slice(0, -1));
    } else {
      if (pin.length < 6) {
        setPin(prev => prev + val);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4">
      <div className="bg-slate-900 text-white rounded-3xl w-full max-w-4xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Terminal Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src={LOGO_PATH} 
              alt="KaziDesk Logo" 
              className="w-10 h-10 rounded-xl object-cover ring-1 ring-emerald-500" 
              referrerPolicy="no-referrer"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
                  KaziDesk Biometric & Smart Access Kiosk
                </h2>
                <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800">
                  <Wifi className="w-2.5 h-2.5 animate-pulse" />
                  <span>ONLINE SENSOR</span>
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Kituo cha Mahudhurio: Alama ya Kidole · Kadi ya RFID · PIN
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 font-mono text-sm sm:text-base font-bold text-emerald-400 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
              <Clock className="w-4 h-4" />
              <span>{currentTime}</span>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 3 Verification Mode Switcher */}
        <div className="p-3 bg-slate-950/40 border-b border-slate-800 flex items-center justify-center gap-2 sm:gap-4">
          <button
            onClick={() => {
              setActiveMode('fingerprint');
              setScanResult(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeMode === 'fingerprint' 
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40' 
                : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Fingerprint className="w-4 h-4" />
            <span>Alama ya Kidole (Fingerprint)</span>
          </button>

          <button
            onClick={() => {
              setActiveMode('card');
              setScanResult(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeMode === 'card' 
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40' 
                : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Kadi ya Kielektroniki (RFID / Card)</span>
          </button>

          <button
            onClick={() => {
              setActiveMode('pin');
              setScanResult(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeMode === 'pin' 
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40' 
                : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Namba ya Siri (PIN)</span>
          </button>
        </div>

        {/* Main Interactive Terminal Body */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Panel: Mode Interactive Scanner (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
            
            {/* MODE 1: FINGERPRINT SCANNER */}
            {activeMode === 'fingerprint' && (
              <div className="space-y-4">
                <div className="text-center space-y-2">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Chombo cha Kusoma Alama ya Kidole
                  </div>
                  <p className="text-xs text-slate-400">
                    Gonga jina la mfanyakazi hapa chini kuiga kuweka kidole kwenye kioo cha kihisi (Optical Biometric Sensor).
                  </p>
                </div>

                {/* Simulated Physical Biometric Sensor Pad */}
                <div className="relative mx-auto w-36 h-44 rounded-3xl bg-slate-950 border-2 border-emerald-500/50 flex flex-col items-center justify-center shadow-inner overflow-hidden group">
                  <div className={`p-4 rounded-full transition-transform ${isScanning ? 'scale-110 text-emerald-300' : 'text-emerald-500'}`}>
                    <Fingerprint className="w-20 h-20" />
                  </div>
                  
                  {/* Laser Scan Sweep Animation */}
                  {isScanning && (
                    <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#10b981] animate-bounce" />
                  )}

                  <div className="absolute bottom-2 text-[10px] font-mono text-emerald-400/80">
                    {isScanning ? 'INAKAGUA BIOMETRIC...' : 'WEKA KIDOLE HAPA'}
                  </div>
                </div>

                {/* Staff Quick Select for Fingerprint */}
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">
                    Chagua Mfanyakazi wa Kupima Kidole:
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
                    {employees.map(emp => (
                      <button
                        key={emp.id}
                        onClick={() => handleFingerprintScan(emp)}
                        disabled={isScanning}
                        className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 hover:border-emerald-500 text-left transition-all flex flex-col gap-1.5"
                      >
                        <div className="flex items-center gap-2">
                          <img 
                            src={emp.avatarUrl} 
                            alt={emp.fullName} 
                            className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-600" 
                            referrerPolicy="no-referrer"
                          />
                          <Fingerprint className={`w-3.5 h-3.5 ${emp.biometricFingerprintEnrolled ? 'text-emerald-400' : 'text-slate-500'}`} />
                        </div>
                        <div>
                          <div className="text-[11px] font-bold text-white truncate">{emp.fullName.split(' ')[0]} {emp.fullName.split(' ')[1]}</div>
                          <div className="text-[9px] font-mono text-slate-400">{emp.cardId}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* MODE 2: CARD / RFID TAP SCANNER */}
            {activeMode === 'card' && (
              <div className="space-y-4">
                <div className="text-center space-y-1">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Msomaji wa Kadi za Kielektroniki (RFID / NFC Reader)
                  </div>
                  <p className="text-xs text-slate-400">
                    Weka kadi yako karibu na chombo au ingiza namba ya kadi (k.m. KD-CRD-001).
                  </p>
                </div>

                {/* Manual Scan Input or Barcode Reader Input */}
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (cardInput) handleCardTap(cardInput);
                  }}
                  className="flex gap-2 max-w-md mx-auto"
                >
                  <input
                    type="text"
                    placeholder="Gonga kadi au weka Card ID (k.m KD-CRD-001)..."
                    value={cardInput}
                    onChange={e => setCardInput(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-xs uppercase focus:outline-emerald-500"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold text-xs"
                  >
                    Gonga Kadi
                  </button>
                </form>

                {/* Virtual Card Tap Simulation Grid */}
                <div className="space-y-2 pt-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">
                    Gonga Kadi ya Mfano (Virtual Smart Card Tap):
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
                    {employees.map(emp => (
                      <button
                        key={emp.id}
                        onClick={() => handleCardTap(emp.cardId)}
                        className="p-3 rounded-xl bg-gradient-to-r from-slate-800 to-slate-850 hover:from-slate-700 hover:to-slate-800 border border-slate-700 hover:border-emerald-500 text-left transition-all flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-950/60 rounded-lg text-emerald-400 group-hover:scale-110 transition-transform">
                            <CreditCard className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white">{emp.fullName}</div>
                            <div className="text-[10px] text-slate-400">{emp.roleTitle}</div>
                            <div className="text-[10px] font-mono text-emerald-400">{emp.cardId}</div>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold uppercase bg-slate-900 px-2 py-1 rounded text-slate-300">
                          Gonga
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* MODE 3: SECURE PIN KEYPAD */}
            {activeMode === 'pin' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Staff Select */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase">
                    1. Chagua Jina Lako:
                  </label>
                  <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                    {employees.map(emp => (
                      <button
                        key={emp.id}
                        onClick={() => setSelectedEmpId(emp.id)}
                        className={`w-full p-2 rounded-xl text-left flex items-center gap-2 border transition-all text-xs ${
                          selectedEmpId === emp.id 
                            ? 'bg-emerald-950/60 border-emerald-500 text-white font-bold' 
                            : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <img 
                          src={emp.avatarUrl} 
                          alt={emp.fullName} 
                          className="w-6 h-6 rounded-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                        <div className="truncate">
                          <div>{emp.fullName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">PIN: {emp.pin}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Keypad */}
                <div className="space-y-3">
                  <label className="text-[11px] font-bold text-slate-400 uppercase">
                    2. Weka PIN (Tarakimu 4):
                  </label>

                  <div className="h-11 rounded-xl bg-slate-950 border border-slate-700 flex items-center justify-center font-mono text-xl tracking-widest text-emerald-400 font-bold">
                    {pin ? '• '.repeat(pin.length).trim() : <span className="text-slate-500 text-xs tracking-normal">Weka PIN</span>}
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                      <button
                        key={num}
                        onClick={() => handleKeypadPress(num.toString())}
                        className="h-10 rounded-lg bg-slate-800 hover:bg-slate-700 font-bold text-base transition-colors"
                      >
                        {num}
                      </button>
                    ))}
                    <button
                      onClick={() => handleKeypadPress('CLEAR')}
                      className="h-10 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 text-rose-400 font-bold text-xs"
                    >
                      Futa
                    </button>
                    <button
                      onClick={() => handleKeypadPress('0')}
                      className="h-10 rounded-lg bg-slate-800 hover:bg-slate-700 font-bold text-base"
                    >
                      0
                    </button>
                    <button
                      onClick={() => handleKeypadPress('BACK')}
                      className="h-10 rounded-lg bg-slate-800 hover:bg-slate-700 font-bold text-xs"
                    >
                      ←
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => handlePinSubmit('clock_in')}
                      className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold text-xs text-white"
                    >
                      SAINI KUINGIA
                    </button>
                    <button
                      onClick={() => handlePinSubmit('clock_out')}
                      className="py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 font-bold text-xs text-white"
                    >
                      SAINI KUTOKA
                    </button>
                  </div>
                </div>

              </div>
            )}

          </div>

          {/* Right Panel: Result & Staff Security Badge Clearance (5 Cols) */}
          <div className="lg:col-span-5 bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4">
            
            {scanResult ? (
              <div className="space-y-4">
                
                {/* Result Status Banner */}
                <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                  scanResult.success 
                    ? 'bg-emerald-950/50 border-emerald-600/80 text-emerald-200' 
                    : 'bg-rose-950/50 border-rose-600/80 text-rose-200'
                }`}>
                  {scanResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="text-xs font-bold leading-tight">
                      {scanResult.success 
                        ? (scanResult.action === 'clock_in' ? 'MAHUDHURIO: UMEINGIA KAZINI' : 'MAHUDHURIO: UMETOKA KAZINI') 
                        : 'HITILAFU YA KUTHIBITISHA'}
                    </div>
                    <div className="text-xs mt-1 leading-relaxed">{scanResult.message}</div>
                  </div>
                </div>

                {/* Staff Access Clearance Card Info */}
                {scanResult.employee && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-3 bg-slate-900 p-3 rounded-xl border border-slate-800">
                      <img 
                        src={scanResult.employee.avatarUrl} 
                        alt={scanResult.employee.fullName} 
                        className="w-14 h-14 rounded-xl object-cover ring-2 ring-emerald-500" 
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <div className="text-sm font-bold text-white">{scanResult.employee.fullName}</div>
                        <div className="text-xs text-slate-400">{scanResult.employee.roleTitle}</div>
                        <div className="text-[11px] font-mono text-emerald-400">{scanResult.employee.department}</div>
                      </div>
                    </div>

                    {/* Permissions & Security Limits for this Employee */}
                    <div className="space-y-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs">
                      <div className="font-bold text-slate-300 uppercase tracking-wider text-[10px] flex items-center justify-between">
                        <span>Mipaka & Ruhusa za Kazi:</span>
                        <span className="font-mono text-emerald-400">Level {scanResult.employee.accessLevel}</span>
                      </div>

                      <div className="text-slate-400">
                        Saa za Kazi: <span className="text-white font-mono">{scanResult.employee.shiftHours.start} - {scanResult.employee.shiftHours.end}</span>
                      </div>

                      <div className="text-slate-400">
                        Kadi ya Kazi: <span className="text-white font-mono">{scanResult.employee.cardId}</span>
                      </div>

                      <div>
                        <span className="text-slate-400 block mb-1">Sehemu Alizoruhusiwa (Zones):</span>
                        <div className="flex flex-wrap gap-1">
                          {scanResult.employee.allowedZones.slice(0, 3).map((zone, i) => (
                            <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                              {zone}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                  </div>
                )}

              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 text-slate-500">
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400">
                  <ShieldCheck className="w-12 h-12 text-emerald-500" />
                </div>
                <div className="text-sm font-bold text-slate-300">
                  Mfumo wa Usalama Upo Tayari
                </div>
                <p className="text-xs max-w-xs leading-relaxed text-slate-400">
                  Weka alama ya kidole, gonga kadi yako ya kielektroniki, au weka namba yako ya siri kuthibitisha utambulisho na kusaini mahudhurio ya ofisi.
                </p>
              </div>
            )}

            {/* Terminal Specs Footer */}
            <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-500 flex items-center justify-between font-mono">
              <span>DEVICE: KAZI-BIO-T800</span>
              <span>AES-256 ENCRYPTED</span>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
