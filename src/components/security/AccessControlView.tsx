import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Unlock, 
  KeyRound, 
  Fingerprint, 
  CreditCard, 
  Clock, 
  Building, 
  Edit3, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  UserX, 
  Sliders, 
  Search,
  Check,
  ShieldAlert
} from 'lucide-react';
import { translations } from '../../utils/translations';
import { Employee, Department } from '../../types/office';
import { formatCurrency } from '../../utils/formatters';

interface AccessControlViewProps {
  lang: 'sw' | 'en';
  currency: 'TZS' | 'USD';
  employees: Employee[];
  onUpdateEmployeePermissions: (empId: string, updates: Partial<Employee>) => void;
}

const ALL_MODULES = [
  { id: 'dashboard', label: 'Muhtasari wa Ofisi (Dashboard)' },
  { id: 'attendance', label: 'Mahudhurio & Likizo (Attendance)' },
  { id: 'tasks', label: 'Kazi & Utaratibu (Tasks)' },
  { id: 'documents', label: 'Kumbukumbu & Nyaraka (Documents)' },
  { id: 'payroll', label: 'Mishahara & Malipo (Payroll - Restricted)' },
  { id: 'assets', label: 'Rasilimali & Vifaa (Assets)' },
  { id: 'employees', label: 'Daftari la Wafanyakazi (Employees)' },
  { id: 'pettyCash', label: 'Petty Cash & Matumizi' },
  { id: 'cards', label: 'Vitambulisho & Kadi (ID Studio)' },
  { id: 'permissions', label: 'Ruhusa & Mipaka (Admin Security)' },
];

const ALL_ZONES = [
  'Ofisi Kuu (HQ)',
  'Mapokezi (Front Desk)',
  'Chumba cha Mikutano (Boardroom)',
  'Chumba cha Seva (Server Room)',
  'Ofisi ya Fedha (Finance Vault)',
  'Stoo Kuu ya Vifaa',
  'Kituo cha Uchapaji (Printing Bay)',
  'Maegesho ya Ndani (Parking Bay)',
  'Jiko la Watumishi (Pantry)',
];

export const AccessControlView: React.FC<AccessControlViewProps> = ({
  lang,
  currency,
  employees,
  onUpdateEmployeePermissions
}) => {
  const t = translations[lang];
  const [searchTerm, setSearchTerm] = useState('');
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);

  // Edit State
  const [editAccessLevel, setEditAccessLevel] = useState<1 | 2 | 3 | 4>(1);
  const [editPin, setEditPin] = useState('');
  const [editAllowedZones, setEditAllowedZones] = useState<string[]>([]);
  const [editAllowedModules, setEditAllowedModules] = useState<string[]>([]);
  const [editMaxApproval, setEditMaxApproval] = useState<number>(0);
  const [editShiftStart, setEditShiftStart] = useState('08:00');
  const [editShiftEnd, setEditShiftEnd] = useState('17:00');
  const [editFingerprintEnrolled, setEditFingerprintEnrolled] = useState(true);
  const [editAccountStatus, setEditAccountStatus] = useState<'active' | 'suspended' | 'revoked'>('active');

  const openEditor = (emp: Employee) => {
    setEditingEmp(emp);
    setEditAccessLevel(emp.accessLevel || 1);
    setEditPin(emp.pin || '1234');
    setEditAllowedZones(emp.allowedZones || ['Ofisi Kuu (HQ)']);
    setEditAllowedModules(emp.allowedModules || ['dashboard', 'attendance', 'tasks']);
    setEditMaxApproval(emp.maxApprovalAmount || 500000);
    setEditShiftStart(emp.shiftHours?.start || '08:00');
    setEditShiftEnd(emp.shiftHours?.end || '17:00');
    setEditFingerprintEnrolled(emp.biometricFingerprintEnrolled);
    setEditAccountStatus(emp.accountStatus || 'active');
  };

  const handleSavePermissions = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmp) return;

    onUpdateEmployeePermissions(editingEmp.id, {
      accessLevel: editAccessLevel,
      pin: editPin,
      allowedZones: editAllowedZones,
      allowedModules: editAllowedModules,
      maxApprovalAmount: editMaxApproval,
      shiftHours: { start: editShiftStart, end: editShiftEnd },
      biometricFingerprintEnrolled: editFingerprintEnrolled,
      accountStatus: editAccountStatus,
    });

    setEditingEmp(null);
  };

  const toggleZone = (zone: string) => {
    setEditAllowedZones(prev => 
      prev.includes(zone) ? prev.filter(z => z !== zone) : [...prev, zone]
    );
  };

  const toggleModule = (modId: string) => {
    setEditAllowedModules(prev => 
      prev.includes(modId) ? prev.filter(m => m !== modId) : [...prev, modId]
    );
  };

  const filteredEmployees = employees.filter(emp =>
    emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employeeNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.cardId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Usimamizi wa Mipaka & Ruhusa za Kila Akaunti (Access Control & Limitations)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Weka mipaka ya kiutendaji ya kila mfanyakazi: ngazi ya usalama (Access Level), kadi ya kazi, PIN, alama ya kidole, masaa ya kazi, na maeneo ya ofisi anayoruhusiwa.
          </p>
        </div>
      </div>

      {/* Security Level Guide Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
            <span>LEVEL 1: GENERAL STAFF</span>
            <span className="font-mono text-slate-400">Kawaida</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Mahudhurio binafsi, kazi alizopewa, na maombi ya likizo pekee. Hawezi kuona fedha wala mishahara.
          </p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400">
            <span>LEVEL 2: SUPERVISOR</span>
            <span className="font-mono text-blue-500">Msimamizi</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Udhibiti wa vifaa vya kitengo, kupanga kazi za timu, na kufikia stoo au maegesho ya ofisi.
          </p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-400">
            <span>LEVEL 3: MANAGER</span>
            <span className="font-mono text-amber-500">Meneja</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Kuidhinisha maombi ya likizo, nyaraka za idara, ununuzi wa hadi TZS 10,000,000, na vault ya fedha.
          </p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <span>LEVEL 4: EXECUTIVE</span>
            <span className="font-mono text-emerald-500">Mkurugenzi</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Ruhusa kamili ya ofisi (Super Admin): mishahara, chumba cha seva, kuajiri, na kubadili mipangilio ya mfumo.
          </p>
        </div>

      </div>

      {/* Staff Accounts Matrix Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Matrix ya Wafanyakazi & Vigezo vya Upatikanaji (Access Credentials)
          </h3>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tafuta mfanyakazi au Card ID..."
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
                <th className="py-3 px-4">Mfanyakazi</th>
                <th className="py-3 px-4">Ngazi ya Usalama</th>
                <th className="py-3 px-4">Kadi ya Kazi</th>
                <th className="py-3 px-4">PIN ya Siri</th>
                <th className="py-3 px-4">Alama ya Kidole</th>
                <th className="py-3 px-4">Saa za Kazi</th>
                <th className="py-3 px-4">Hali ya Akaunti</th>
                <th className="py-3 px-4 text-right">Rekebisha Mipaka</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredEmployees.map(emp => (
                <tr key={emp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 flex items-center gap-2.5">
                    <img 
                      src={emp.avatarUrl} 
                      alt={emp.fullName} 
                      className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700" 
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{emp.fullName}</div>
                      <div className="text-[11px] text-slate-400">{emp.roleTitle} · {emp.department}</div>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${
                      emp.accessLevel === 4 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                      emp.accessLevel === 3 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                      emp.accessLevel === 2 ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}>
                      LEVEL {emp.accessLevel}
                    </span>
                  </td>

                  <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                    {emp.cardId}
                  </td>

                  <td className="py-3 px-4 font-mono">
                    <span className="tracking-widest font-bold">••••</span> ({emp.pin})
                  </td>

                  <td className="py-3 px-4">
                    {emp.biometricFingerprintEnrolled ? (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Imesajiliwa</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-amber-600">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Hajasajiliwa</span>
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                    {emp.shiftHours.start} - {emp.shiftHours.end}
                  </td>

                  <td className="py-3 px-4">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      emp.accountStatus === 'active' 
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' 
                        : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                    }`}>
                      {emp.accountStatus === 'active' ? 'Inatumika' : 'Imezuiwa'}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => openEditor(emp)}
                      className="px-2.5 py-1 text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-700 dark:text-slate-300 rounded-lg transition-colors inline-flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Mipaka</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Limitation & Permissions Editor Modal */}
      {editingEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Badili Mipaka na Ruhusa: {editingEmp.fullName}
                </h3>
                <p className="text-xs text-slate-500">
                  {editingEmp.roleTitle} · {editingEmp.department} · {editingEmp.employeeNo}
                </p>
              </div>
              <button 
                onClick={() => setEditingEmp(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePermissions} className="p-6 space-y-5 overflow-y-auto text-xs">
              
              {/* Access Level & Security Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Ngazi ya Usalama (Tier):
                  </label>
                  <select
                    value={editAccessLevel}
                    onChange={e => setEditAccessLevel(Number(e.target.value) as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  >
                    <option value={1}>Level 1: General Staff</option>
                    <option value={2}>Level 2: Supervisor</option>
                    <option value={3}>Level 3: Department Manager</option>
                    <option value={4}>Level 4: Executive Director</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Namba ya PIN (4 Tarakimu):
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={editPin}
                    onChange={e => setEditPin(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Hali ya Akaunti:
                  </label>
                  <select
                    value={editAccountStatus}
                    onChange={e => setEditAccountStatus(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  >
                    <option value="active">Hai (Active)</option>
                    <option value="suspended">Imesimamishwa (Suspended)</option>
                    <option value="revoked">Imezuiwa (Revoked)</option>
                  </select>
                </div>
              </div>

              {/* Shift Hours & Fingerprint Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Kuanza Saa za Kazi:
                  </label>
                  <input
                    type="time"
                    value={editShiftStart}
                    onChange={e => setEditShiftStart(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Kumaliza Saa za Kazi:
                  </label>
                  <input
                    type="time"
                    value={editShiftEnd}
                    onChange={e => setEditShiftEnd(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Alama ya Kidole:
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditFingerprintEnrolled(!editFingerprintEnrolled)}
                    className={`w-full p-2 rounded-lg font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                      editFingerprintEnrolled 
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300' 
                        : 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 text-amber-700 dark:text-amber-300'
                    }`}
                  >
                    <Fingerprint className="w-4 h-4" />
                    <span>{editFingerprintEnrolled ? 'Imesajiliwa (Active)' : 'Haijasajiliwa'}</span>
                  </button>
                </div>
              </div>

              {/* Physical Office Access Zones */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase">
                  Maeneo ya Ndani ya Ofisi Anayoruhusiwa Kuingia (Physical Zones):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ALL_ZONES.map(zone => {
                    const isChecked = editAllowedZones.includes(zone);
                    return (
                      <button
                        type="button"
                        key={zone}
                        onClick={() => toggleZone(zone)}
                        className={`p-2 rounded-xl text-left border flex items-center gap-2 transition-all ${
                          isChecked 
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-bold' 
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                          isChecked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300'
                        }`}>
                          {isChecked && <Check className="w-3 h-3" />}
                        </div>
                        <span className="truncate">{zone}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Software Modules Permitted */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase">
                  Moduli za Mfumo Anazoruhusiwa Kufikia (Software Module Access):
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_MODULES.map(mod => {
                    const isChecked = editAllowedModules.includes(mod.id);
                    return (
                      <button
                        type="button"
                        key={mod.id}
                        onClick={() => toggleModule(mod.id)}
                        className={`p-2 rounded-xl text-left border flex items-center gap-2 transition-all ${
                          isChecked 
                            ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-500 text-sky-900 dark:text-sky-200 font-bold' 
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                          isChecked ? 'bg-sky-600 border-sky-600 text-white' : 'border-slate-300'
                        }`}>
                          {isChecked && <Check className="w-3 h-3" />}
                        </div>
                        <span className="truncate">{mod.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingEmp(null)}
                  className="px-4 py-2 font-bold text-slate-600 dark:text-slate-300"
                >
                  Ghairi
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 shadow-xs"
                >
                  Hifadhi Mipaka ya Akaunti
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
