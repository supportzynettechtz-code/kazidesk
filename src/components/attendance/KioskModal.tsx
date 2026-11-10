import React, { useState, useEffect } from 'react';
import { X, Clock, CheckCircle2, AlertCircle, UserCheck } from 'lucide-react';
import { Employee, AttendanceRecord } from '../../types/office';

interface KioskModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  attendance: AttendanceRecord[];
  onRecordAttendance: (empId: string, type: 'clock_in' | 'clock_out', pin: string) => { success: boolean; message: string };
}

export const KioskModal: React.FC<KioskModalProps> = ({
  isOpen,
  onClose,
  employees,
  attendance,
  onRecordAttendance
}) => {
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');
  const [pin, setPin] = useState<string>('');
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
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
  const selectedEmp = employees.find(e => e.id === selectedEmpId);
  const selectedRecord = selectedEmpId ? attendance.find(a => a.employeeId === selectedEmpId && a.date === todayStr) : null;
  const isClockedIn = !!selectedRecord && selectedRecord.clockInTime !== '-';
  const isClockedOut = !!selectedRecord && !!selectedRecord.clockOutTime;

  const handleAction = (type: 'clock_in' | 'clock_out') => {
    if (!selectedEmpId) {
      setMessage({ text: 'Tafadhali chagua mfanyakazi kwanza.', isError: true });
      return;
    }
    if (!pin) {
      setMessage({ text: 'Weka PIN yako ya tarakimu 4 (PIN ya mfano: 1234).', isError: true });
      return;
    }

    const res = onRecordAttendance(selectedEmpId, type, pin);
    setMessage({ text: res.message, isError: !res.success });

    if (res.success) {
      setPin('');
      setTimeout(() => {
        setMessage(null);
      }, 3500);
    }
  };

  const handleKeypadPress = (val: string) => {
    if (val === 'CLEAR') {
      setPin('');
    } else if (val === 'BACK') {
      setPin(prev => prev.slice(0, -1));
    } else {
      if (pin.length < 4) {
        setPin(prev => prev + val);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Kiosk Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600 rounded-xl">
              <UserCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Kiosk ya Mapokezi (Front Desk Attendance)</h2>
              <p className="text-xs text-slate-400">Gonga jina lako na uweke PIN kusaini mahudhurio ya ofisi</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 font-mono text-sm font-bold text-emerald-400 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
              <Clock className="w-4 h-4" />
              <span>{currentTime}</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Kiosk Body */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto">
          
          {/* Column 1: Staff Selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              1. Chagua Mfanyakazi:
            </label>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {employees.map(emp => {
                const isSelected = emp.id === selectedEmpId;
                const rec = attendance.find(a => a.employeeId === emp.id && a.date === todayStr);
                const clockedIn = !!rec && rec.clockInTime !== '-';
                const clockedOut = !!rec && !!rec.clockOutTime;

                return (
                  <button
                    key={emp.id}
                    onClick={() => {
                      setSelectedEmpId(emp.id);
                      setMessage(null);
                    }}
                    className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                      isSelected 
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-white shadow-xs' 
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <img 
                        src={emp.avatarUrl} 
                        alt={emp.fullName} 
                        className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700" 
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                          {emp.fullName}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {emp.employeeNo} · {emp.department}
                        </div>
                      </div>
                    </div>

                    <span className={`text-[10px] font-semibold ${
                      clockedOut ? 'text-slate-400' : clockedIn ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                    }`}>
                      {clockedOut ? 'Ametoka' : clockedIn ? 'Yupo' : 'Hajaingia'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Column 2: PIN Keypad & Action */}
          <div className="space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                2. Weka PIN (Mfano: 1234):
              </label>
              
              <div className="h-12 border-2 border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center font-mono text-xl tracking-widest bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold">
                {pin ? '• '.repeat(pin.length).trim() : <span className="text-slate-400 text-xs tracking-normal">Gonga namba hapa chini</span>}
              </div>

              {/* Number Keypad */}
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                  <button
                    key={num}
                    onClick={() => handleKeypadPress(num.toString())}
                    className="h-11 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-base transition-colors"
                  >
                    {num}
                  </button>
                ))}
                <button
                  onClick={() => handleKeypadPress('CLEAR')}
                  className="h-11 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-semibold text-xs hover:bg-rose-100 transition-colors"
                >
                  Futa
                </button>
                <button
                  onClick={() => handleKeypadPress('0')}
                  className="h-11 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-base transition-colors"
                >
                  0
                </button>
                <button
                  onClick={() => handleKeypadPress('BACK')}
                  className="h-11 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors"
                >
                  ←
                </button>
              </div>
            </div>

            {/* Notification alert */}
            {message && (
              <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                message.isError 
                  ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800' 
                  : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              }`}>
                {message.isError ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
                <span>{message.text}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => handleAction('clock_in')}
                disabled={isClockedIn && !isClockedOut}
                className="py-3 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                SAINI KUINGIA
              </button>
              <button
                onClick={() => handleAction('clock_out')}
                disabled={!isClockedIn || isClockedOut}
                className="py-3 px-4 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                SAINI KUTOKA
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
