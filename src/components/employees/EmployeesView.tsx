import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Phone, 
  Mail, 
  Building, 
  Calendar, 
  CreditCard, 
  FileText, 
  ShieldCheck, 
  Search, 
  LayoutGrid, 
  List, 
  Package,
  Award,
  Fingerprint,
  KeyRound,
  CheckCircle2,
  X,
  ChevronRight,
  ChevronLeft,
  Briefcase,
  Lock,
  MapPin,
  Check,
  Sparkles,
  Upload,
  Camera,
  Image as ImageIcon,
  Star
} from 'lucide-react';
import { translations } from '../../utils/translations';
import { Employee, OfficeAsset, AttendanceRecord, Department, QuarterlyReview } from '../../types/office';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { QuarterlyReviewModal } from './QuarterlyReviewModal';

interface EmployeesViewProps {
  lang: 'sw' | 'en';
  currency: 'TZS' | 'USD';
  employees: Employee[];
  assets: OfficeAsset[];
  attendance: AttendanceRecord[];
  onAddEmployee: (emp: Omit<Employee, 'id'>) => void;
  onUpdateEmployee?: (emp: Employee) => void;
  isExternalAddModalOpen?: boolean;
  onCloseExternalAddModal?: () => void;
  currentUserName?: string;
  currentUserRole?: string;
}

export const EmployeesView: React.FC<EmployeesViewProps> = ({
  lang,
  currency,
  employees,
  assets,
  attendance,
  onAddEmployee,
  onUpdateEmployee,
  isExternalAddModalOpen,
  onCloseExternalAddModal,
  currentUserName = 'Msimamizi wa Utawala',
  currentUserRole = 'Meneja HR / Admin',
}) => {
  const t = translations[lang];
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');

  // Quarterly Review Modal
  const [reviewModalEmployee, setReviewModalEmployee] = useState<Employee | null>(null);

  // Selected Employee Dossier
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);

  // New Employee Modal & Form States
  const [isInternalAddModalOpen, setIsInternalAddModalOpen] = useState(false);
  const isAddModalOpen = isInternalAddModalOpen || !!isExternalAddModalOpen;

  const handleCloseAddModal = () => {
    setIsInternalAddModalOpen(false);
    onCloseExternalAddModal?.();
  };

  const handleSaveQuarterlyReview = (review: QuarterlyReview) => {
    if (!reviewModalEmployee) return;
    const existing = reviewModalEmployee.performanceReviews || [];
    const updatedReviews = [
      review,
      ...existing.filter(r => !(r.year === review.year && r.quarter === review.quarter)),
    ];
    const updatedEmployee: Employee = {
      ...reviewModalEmployee,
      performanceReviews: updatedReviews,
    };
    if (selectedEmp && selectedEmp.id === updatedEmployee.id) {
      setSelectedEmp(updatedEmployee);
    }
    onUpdateEmployee?.(updatedEmployee);
  };

  const [formStep, setFormStep] = useState<'personal' | 'job' | 'security' | 'payroll'>('personal');
  
  // Personal Details
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyRelationship, setEmergencyRelationship] = useState('Mwanandugu');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80');
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(null);
  const [photoUploadFileName, setPhotoUploadFileName] = useState<string | null>(null);

  const handlePassportPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setPhotoUploadError('Tafadhali chagua faili sahihi la picha (JPG, PNG au WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPhotoUploadError('Ukubwa wa faili la picha usizidi MB 5.');
      return;
    }

    setPhotoUploadError(null);
    setPhotoUploadFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setAvatarUrl(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Employment Details
  const [department, setDepartment] = useState<Department>('Utawala & Uongozi');
  const [roleTitle, setRoleTitle] = useState('');
  const [contractType, setContractType] = useState<'Kazi ya Kudumu' | 'Mkataba wa Miaka 2' | 'Mkataba wa Mwaka 1' | 'Majaribio (Probation)'>('Kazi ya Kudumu');
  const [shiftStart, setShiftStart] = useState('08:00');
  const [shiftEnd, setShiftEnd] = useState('17:00');

  // Security Credentials & Card Access (Addressing user request for Card, PIN, Fingerprint & Limitations)
  const defaultCardNumber = `KD-CRD-0${employees.length + 10}`;
  const [cardId, setCardId] = useState(defaultCardNumber);
  const [pin, setPin] = useState('2468');
  const [biometricFingerprintEnrolled, setBiometricFingerprintEnrolled] = useState(true);
  const [accessLevel, setAccessLevel] = useState<1 | 2 | 3 | 4>(1);
  const [allowedZones, setAllowedZones] = useState<string[]>([
    'Ofisi Kuu (HQ)',
    'Mapokezi (Front Desk)'
  ]);
  const [maxApprovalAmount, setMaxApprovalAmount] = useState('500000');

  // Salary & Banking
  const [basicSalary, setBasicSalary] = useState('2200000');
  const [housingAllowance, setHousingAllowance] = useState('300000');
  const [transportAllowance, setTransportAllowance] = useState('200000');
  const [commAllowance, setCommAllowance] = useState('100000');
  const [bankName, setBankName] = useState('CRDB Bank Plc');
  const [accountNumber, setAccountNumber] = useState('015099881122');
  const [nssfNumber, setNssfNumber] = useState('1098881234');
  const [tinNumber, setTinNumber] = useState('120-445-998');

  const allAvailableZones = [
    'Ofisi Kuu (HQ)',
    'Mapokezi (Front Desk)',
    'Server Room (IT)',
    'Idara ya Fedha & Kasiki',
    'Chumba cha Mikutano (Boardroom)',
    'Stoo Kuu ya Vifaa'
  ];

  const handleToggleZone = (zone: string) => {
    if (allowedZones.includes(zone)) {
      setAllowedZones(allowedZones.filter(z => z !== zone));
    } else {
      setAllowedZones([...allowedZones, zone]);
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          emp.employeeNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          emp.roleTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          emp.cardId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = deptFilter === 'all' || emp.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) return;

    const empNo = `KD-2026-0${employees.length + 10}`;
    const cleanCard = cardId.trim() || `KD-CRD-0${employees.length + 10}`;
    const cleanPin = pin.trim() || '2468';

    onAddEmployee({
      employeeNo: empNo,
      fullName,
      email,
      phone: phone || '+255 775 740 386',
      department,
      roleTitle: roleTitle || 'Afisa wa Ofisi',
      joinDate: new Date().toISOString().split('T')[0],
      contractType,
      basicSalary: basicSalary ? parseFloat(basicSalary) : 2200000,
      allowances: {
        housing: housingAllowance ? parseFloat(housingAllowance) : 300000,
        transport: transportAllowance ? parseFloat(transportAllowance) : 200000,
        communication: commAllowance ? parseFloat(commAllowance) : 100000,
        other: 0,
      },
      bankName: bankName || 'CRDB Bank Plc',
      accountNumber: accountNumber || '015099881122',
      nssfNumber: nssfNumber || '1098881234',
      tinNumber: tinNumber || '120-445-998',
      avatarUrl: avatarUrl || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80`,
      status: 'active',
      emergencyContact: {
        name: emergencyName || 'Familia',
        relationship: emergencyRelationship || 'Mwanandugu',
        phone: emergencyPhone || '+255 700 000 000',
      },
      pin: cleanPin,
      cardId: cleanCard,
      cardIssuedDate: new Date().toISOString().split('T')[0],
      cardExpiryDate: `${new Date().getFullYear() + 3}-12-31`,
      biometricFingerprintEnrolled,
      accessLevel,
      allowedZones: allowedZones.length > 0 ? allowedZones : ['Ofisi Kuu (HQ)', 'Mapokezi (Front Desk)'],
      allowedModules: accessLevel >= 3 
        ? ['dashboard', 'attendance', 'tasks', 'documents', 'payroll', 'assets', 'pettyCash', 'cards', 'permissions']
        : accessLevel === 2
          ? ['dashboard', 'attendance', 'tasks', 'documents', 'assets']
          : ['dashboard', 'attendance', 'tasks'],
      maxApprovalAmount: maxApprovalAmount ? parseFloat(maxApprovalAmount) : 500000,
      shiftHours: { start: shiftStart || '08:00', end: shiftEnd || '17:00' },
      accountStatus: 'active',
    });

    handleCloseAddModal();
    // Reset form
    setFullName('');
    setEmail('');
    setPhone('');
    setRoleTitle('');
    setBasicSalary('2200000');
    setPin('2468');
    setCardId(`KD-CRD-0${employees.length + 11}`);
    setFormStep('personal');
  };

  return (
    <div className="space-y-6">

      {/* Prominent Onboarding Quick Guidance Banner */}
      <div className="p-4 sm:p-5 rounded-xl border border-emerald-300 dark:border-emerald-700/80 bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-900 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm ring-4 ring-emerald-100 dark:ring-emerald-900/50">
            <UserPlus className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {lang === 'sw' ? 'Sajili Mfanyakazi Mpya & Mfumo wa Vitambulisho' : 'Staff Onboarding & Smart Badges'}
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                {lang === 'sw' ? 'Sehemu Kuu' : 'Entry Point'}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
              {lang === 'sw'
                ? 'Hapa ndipo unapoingiza mfanyakazi mpya kwenye mfumo wa ofisi. Unaweza kujaza taarifa zake za ajira, kutengeneza Smart Card (RFID) ya kuingilia mlangoni, kuweka PIN ya siri, kusajili alama ya kidole (fingerprint), na kuweka viwango vya ruhusa na mipaka ya kila akaunti.'
                : 'Complete staff enrollment portal. Register employee credentials, issue ISO-standard RFID Smart Cards, assign 4-digit security PINs, enroll biometric fingerprints, and configure access permissions.'}
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setCardId(`KD-CRD-0${employees.length + 10}`);
            setFormStep('personal');
            setIsInternalAddModalOpen(true);
          }}
          className="px-4 py-2.5 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs flex items-center justify-center gap-2 whitespace-nowrap shrink-0 ring-2 ring-emerald-500/20"
        >
          <UserPlus className="w-4 h-4" />
          <span>{lang === 'sw' ? '+ Sajili Mfanyakazi Mpya Sasa' : '+ Onboard New Employee Now'}</span>
        </button>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t.employees.title}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t.employees.subtitle}
          </p>
        </div>

        <button
          onClick={() => {
            setCardId(`KD-CRD-0${employees.length + 10}`);
            setFormStep('personal');
            setIsInternalAddModalOpen(true);
          }}
          className="px-3.5 py-2 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs flex items-center gap-1.5 self-start md:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>{t.employees.newEmployee}</span>
        </button>
      </div>

      {/* Filter and View Switcher */}
      <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tafuta mfanyakazi kwa jina, cheo au kitambulisho..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between">
          <select
            value={deptFilter}
            onChange={e => setDeptFilter(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            <option value="all">Idara Zote</option>
            <option value="Utawala & Uongozi">Utawala & Uongozi</option>
            <option value="Rasilimali Watu (HR)">Rasilimali Watu (HR)</option>
            <option value="Fedha & Uhasibu">Fedha & Uhasibu</option>
            <option value="Teknolojia (IT & Mifumo)">Teknolojia (IT & Mifumo)</option>
            <option value="Uendeshaji & Usafirishaji">Uendeshaji & Usafirishaji</option>
            <option value="Masoko & Mauzo">Masoko & Mauzo</option>
            <option value="Sheria & Mikataba">Sheria & Mikataba</option>
          </select>

          <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 bg-slate-100 dark:bg-slate-800">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-400'}`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-400'}`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid Mode */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredEmployees.map(emp => {
            const empAssets = assets.filter(a => a.assignedToId === emp.id);
            return (
              <div
                key={emp.id}
                onClick={() => setSelectedEmp(emp)}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs cursor-pointer transition-all space-y-4 group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <img 
                      src={emp.avatarUrl} 
                      alt={emp.fullName} 
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-800 group-hover:scale-105 transition-transform" 
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-tight group-hover:text-emerald-600 transition-colors">
                        {emp.fullName}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {emp.roleTitle}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Building className="w-3 h-3 text-slate-400" />
                    <span>{emp.department}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span className="font-mono">{emp.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3 h-3 text-slate-400" />
                    <span className="truncate">{emp.email}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {formatCurrency(emp.basicSalary, currency)}
                  </span>
                  {empAssets.length > 0 && (
                    <span className="text-[10px] font-medium text-slate-500 flex items-center gap-1">
                      <Package className="w-3 h-3" />
                      <span>{empAssets.length} Mali</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table Mode */
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase text-[11px]">
                  <th className="py-3 px-4">Mfanyakazi</th>
                  <th className="py-3 px-4">Idara</th>
                  <th className="py-3 px-4">Simu & Email</th>
                  <th className="py-3 px-4">Mkataba</th>
                  <th className="py-3 px-4 font-mono">Mshahara wa Msingi</th>
                  <th className="py-3 px-4">Hali</th>
                  <th className="py-3 px-4 text-right">Kitendo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {filteredEmployees.map(emp => (
                  <tr key={emp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 flex items-center gap-2.5">
                      <img 
                        src={emp.avatarUrl} 
                        alt={emp.fullName} 
                        className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200" 
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{emp.fullName}</div>
                        <div className="text-[11px] text-slate-400">{emp.employeeNo} · {emp.roleTitle}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{emp.department}</td>
                    <td className="py-3 px-4">
                      <div>{emp.phone}</div>
                      <div className="text-[11px] text-slate-400">{emp.email}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{emp.contractType}</td>
                    <td className="py-3 px-4 font-mono font-bold tabular-nums">
                      {formatCurrency(emp.basicSalary, currency)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        emp.status === 'active' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950' :
                        emp.status === 'on_leave' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {emp.status === 'active' ? 'Yupo Kazi' :
                         emp.status === 'on_leave' ? 'Likizo' : 'Majaribio'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedEmp(emp)}
                        className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
                      >
                        Taarifa Kamili
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Employee Dossier Modal */}
      {selectedEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* Header */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img 
                  src={selectedEmp.avatarUrl} 
                  alt={selectedEmp.fullName} 
                  className="w-16 h-16 rounded-full object-cover ring-2 ring-emerald-500" 
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h2 className="text-lg font-bold">{selectedEmp.fullName}</h2>
                  <p className="text-xs text-slate-300">{selectedEmp.roleTitle} · {selectedEmp.department}</p>
                  <p className="text-[11px] font-mono text-emerald-400 mt-1">Namba: {selectedEmp.employeeNo}</p>
                </div>
              </div>

              <button 
                onClick={() => setSelectedEmp(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            {/* Dossier Content */}
            <div className="p-6 space-y-6 overflow-y-auto text-xs text-slate-800 dark:text-slate-200">
              
              {/* Personal & Contract Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Simu ya Mfanyakazi:</span>
                  <span className="font-mono font-semibold">{selectedEmp.phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Barua Pepe:</span>
                  <span className="font-semibold truncate block">{selectedEmp.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Aina ya Mkataba:</span>
                  <span className="font-semibold">{selectedEmp.contractType}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Tarehe ya Kuanza Kazi:</span>
                  <span className="font-mono font-semibold">{formatDate(selectedEmp.joinDate, lang)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Mshahara wa Msingi:</span>
                  <span className="font-mono font-bold text-emerald-600">{formatCurrency(selectedEmp.basicSalary, currency)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Namba ya NSSF:</span>
                  <span className="font-mono font-semibold">{selectedEmp.nssfNumber}</span>
                </div>
              </div>

              {/* Bank & Tax Details */}
              <div className="space-y-2">
                <div className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                  Taarifa za Benki & Kodi (TRA):
                </div>
                <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Benki:</span>
                    <span className="font-semibold">{selectedEmp.bankName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Namba ya Akaunti:</span>
                    <span className="font-mono font-semibold">{selectedEmp.accountNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">TIN Number:</span>
                    <span className="font-mono font-semibold">{selectedEmp.tinNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Mawasiliano ya Dharura:</span>
                    <span className="font-semibold">{selectedEmp.emergencyContact.name} ({selectedEmp.emergencyContact.relationship}) - {selectedEmp.emergencyContact.phone}</span>
                  </div>
                </div>
              </div>

              {/* Office Assets Assigned */}
              <div className="space-y-2">
                <div className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                  Mali & Vifaa vya Ofisi Alivyokabidhiwa:
                </div>
                {assets.filter(a => a.assignedToId === selectedEmp.id).length === 0 ? (
                  <p className="text-slate-400 italic">Hajakabidhiwa kifaa chochote kwa sasa.</p>
                ) : (
                  <div className="space-y-2">
                    {assets.filter(a => a.assignedToId === selectedEmp.id).map(asset => (
                      <div key={asset.id} className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between">
                        <div>
                          <div className="font-bold">{asset.name}</div>
                          <div className="text-[11px] font-mono text-slate-400">Tag: {asset.assetTag} · SN: {asset.serialNumber}</div>
                        </div>
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                          {formatCurrency(asset.purchaseCost, currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quarterly Performance Reviews Section */}
              <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                      {lang === 'sw' ? 'Tathmini za Utendaji Kazi za Robo Mwaka:' : 'Quarterly Performance Reviews:'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReviewModalEmployee(selectedEmp)}
                    className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1 shadow-xs transition-colors"
                  >
                    <Star className="w-3.5 h-3.5 fill-white" />
                    <span>{lang === 'sw' ? '+ Tathmini ya Robo Mwaka' : '+ New Review'}</span>
                  </button>
                </div>

                {(!selectedEmp.performanceReviews || selectedEmp.performanceReviews.length === 0) ? (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {lang === 'sw'
                        ? 'Mfanyakazi huyu hajawahi kufanyiwa tathmini ya robo mwaka bado.'
                        : 'No quarterly performance reviews documented yet for this employee.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => setReviewModalEmployee(selectedEmp)}
                      className="mt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
                    >
                      <span>{lang === 'sw' ? 'Bofya hapa kuandika tathmini ya kwanza' : 'Click here to record first review'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedEmp.performanceReviews.map(rev => (
                      <div
                        key={rev.id}
                        className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5 text-xs"
                      >
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200/70 dark:border-slate-700/60">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white font-mono text-sm">
                              {rev.quarter} {rev.year}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                              {rev.ratingCategory}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-400">{lang === 'sw' ? 'Alama:' : 'Score:'}</span>
                            <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-base">
                              {rev.overallScore}/5.0
                            </span>
                          </div>
                        </div>

                        {/* 5 Pillar Mini Breakdown */}
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[10px] bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700">
                          <div>
                            <span className="text-slate-400 block">Kitaalamu:</span>
                            <span className="font-mono font-bold">{rev.technicalProficiency}/5</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Majukumu:</span>
                            <span className="font-mono font-bold">{rev.taskDelivery}/5</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Ushirikiano:</span>
                            <span className="font-mono font-bold">{rev.teamworkCommunication}/5</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Nidhamu:</span>
                            <span className="font-mono font-bold">{rev.punctualityReliability}/5</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Ubunifu:</span>
                            <span className="font-mono font-bold">{rev.leadershipInitiative}/5</span>
                          </div>
                        </div>

                        {/* Achievements & Goals */}
                        <div className="space-y-1 text-slate-700 dark:text-slate-300">
                          <div>
                            <strong className="text-slate-900 dark:text-white">Mafanikio: </strong>
                            <span>{rev.keyAchievements}</span>
                          </div>
                          {rev.areasForGrowth && (
                            <div>
                              <strong className="text-slate-900 dark:text-white">Maboresho: </strong>
                              <span>{rev.areasForGrowth}</span>
                            </div>
                          )}
                          {rev.nextQuarterGoals && (
                            <div>
                              <strong className="text-slate-900 dark:text-white">Malengo ya Mbeleni: </strong>
                              <span>{rev.nextQuarterGoals}</span>
                            </div>
                          )}
                        </div>

                        {/* Recommendation & Reviewer */}
                        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] gap-1 text-slate-500">
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-200">Pendekezo: </span>
                            <span className="text-emerald-700 dark:text-emerald-300 font-semibold">{rev.recommendedAction}</span>
                          </div>
                          <div className="font-mono text-[10px]">
                            {rev.reviewDate} · {rev.reviewerName}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Comprehensive Staff Onboarding Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {lang === 'sw' ? 'Sajili Mfanyakazi Mpya (Staff Onboarding)' : 'Onboard New Employee'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {lang === 'sw' 
                      ? 'Jaza taarifa, toa Kadi ya Smart Card (RFID), weka PIN, na sajili alama ya kidole.'
                      : 'Enroll personal details, issue RFID smart card, assign PIN, and setup permissions.'}
                  </p>
                </div>
              </div>
              
              <button
                type="button"
                onClick={handleCloseAddModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs Navigation */}
            <div className="flex items-center gap-1 p-2 border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-950/40 overflow-x-auto">
              <button
                type="button"
                onClick={() => setFormStep('personal')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-all ${
                  formStep === 'personal'
                    ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>1. Wasifu & Simu</span>
              </button>

              <button
                type="button"
                onClick={() => setFormStep('job')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-all ${
                  formStep === 'job'
                    ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>2. Ajira & Idara</span>
              </button>

              <button
                type="button"
                onClick={() => setFormStep('security')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-all ${
                  formStep === 'security'
                    ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>3. Kadi, PIN & Kidole</span>
              </button>

              <button
                type="button"
                onClick={() => setFormStep('payroll')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-all ${
                  formStep === 'payroll'
                    ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>4. Mshahara & Benki</span>
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleCreateEmployee} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              
              {/* TAB 1: Personal Details */}
              {formStep === 'personal' && (
                <div className="space-y-4">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] mb-1">
                      Jina Kamili la Mfanyakazi: *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Mfano: Mhandisi Neema Mwinyi au Juma Said"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] mb-1">
                        Barua Pepe Rasmi (Email): *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="neema.mwinyi@kazidesk.co.tz"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] mb-1">
                        Namba ya Simu:
                      </label>
                      <input
                        type="text"
                        placeholder="+255 754 123 456"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Passport Photo Upload Section */}
                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[10px]">
                        Picha ya Pasipoti (Passport Photo / Avatar): *
                      </label>
                      <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                        <Camera className="w-3 h-3" />
                        <span>Inawekwa kwenye Smart Card & Mfumo</span>
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      {/* Passport Preview Card */}
                      <div className="relative group shrink-0">
                        <div className="w-20 h-24 rounded-lg overflow-hidden border-2 border-emerald-500/50 shadow-sm bg-white dark:bg-slate-900 flex items-center justify-center">
                          <img 
                            src={avatarUrl} 
                            alt="Passport Preview" 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-emerald-600 text-white rounded-full p-1 shadow-xs" title="Picha imethibitishwa">
                          <Check className="w-3 h-3" />
                        </div>
                      </div>

                      {/* Upload Controls */}
                      <div className="flex-1 w-full space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors">
                            <Upload className="w-3.5 h-3.5" />
                            <span>Upload Pasipoti (Faili)</span>
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp,image/jpg"
                              onChange={handlePassportPhotoUpload}
                              className="hidden"
                            />
                          </label>

                          {photoUploadFileName && (
                            <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-1 rounded border border-emerald-200 dark:border-emerald-800 truncate max-w-[180px]">
                              {photoUploadFileName}
                            </span>
                          )}
                        </div>

                        {photoUploadError && (
                          <p className="text-[11px] text-red-500 font-medium">
                            {photoUploadError}
                          </p>
                        )}

                        <div className="pt-1 flex items-center gap-2">
                          <span className="text-[10px] text-slate-500">Au chagua kiolezo:</span>
                          <select
                            value={avatarUrl}
                            onChange={e => {
                              setAvatarUrl(e.target.value);
                              setPhotoUploadFileName(null);
                            }}
                            className="text-[11px] p-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                          >
                            <option value="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80">Pasipoti 1 - Afisa Mwandamizi</option>
                            <option value="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80">Pasipoti 2 - Mtaalamu wa Kazi</option>
                            <option value="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80">Pasipoti 3 - Meneja Idara</option>
                            <option value="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80">Pasipoti 4 - Mhandisi</option>
                            <option value="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=256&q=80">Pasipoti 5 - Mkurugenzi</option>
                          </select>
                        </div>

                        <p className="text-[10px] text-slate-400">
                          Format: JPG, PNG, WEBP (Max 5MB). Picha hii itatumika moja kwa moja kwenye Kadi ya RFID/Barcode na Kiosk ya Mahudhurio.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-3">
                    <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[10px] block">
                      Mawasiliano ya Dharura (Next of Kin):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[10px] text-slate-500 font-semibold mb-1">Jina Kamili:</label>
                        <input
                          type="text"
                          placeholder="Mfano: Grace Mwinyi"
                          value={emergencyName}
                          onChange={e => setEmergencyName(e.target.value)}
                          className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 font-semibold mb-1">Uhusiano:</label>
                        <select
                          value={emergencyRelationship}
                          onChange={e => setEmergencyRelationship(e.target.value)}
                          className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                        >
                          <option value="Mke / Mume">Mke / Mume</option>
                          <option value="Mzazi (Baba/Mama)">Mzazi (Baba/Mama)</option>
                          <option value="Kaka / Dada">Kaka / Dada</option>
                          <option value="Mwanandugu">Mwanandugu</option>
                          <option value="Rafiki wa Karibu">Rafiki wa Karibu</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 font-semibold mb-1">Simu ya Dharura:</label>
                        <input
                          type="text"
                          placeholder="+255 712 000 000"
                          value={emergencyPhone}
                          onChange={e => setEmergencyPhone(e.target.value)}
                          className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Job & Department */}
              {formStep === 'job' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] mb-1">
                        Idara ya Ofisi: *
                      </label>
                      <select
                        value={department}
                        onChange={e => setDepartment(e.target.value as Department)}
                        className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="Utawala & Uongozi">Utawala & Uongozi</option>
                        <option value="Rasilimali Watu (HR)">Rasilimali Watu (HR)</option>
                        <option value="Fedha & Uhasibu">Fedha & Uhasibu</option>
                        <option value="Teknolojia (IT & Mifumo)">Teknolojia (IT & Mifumo)</option>
                        <option value="Uendeshaji & Usafirishaji">Uendeshaji & Usafirishaji</option>
                        <option value="Masoko & Mauzo">Masoko & Mauzo</option>
                        <option value="Sheria & Mikataba">Sheria & Mikataba</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] mb-1">
                        Cheo / Wadhifa Rasmi: *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Mfano: Afisa Mwandamizi wa IT"
                        value={roleTitle}
                        onChange={e => setRoleTitle(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] mb-1">
                        Aina ya Mkataba:
                      </label>
                      <select
                        value={contractType}
                        onChange={e => setContractType(e.target.value as any)}
                        className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                      >
                        <option value="Kazi ya Kudumu">Kazi ya Kudumu (Permanent)</option>
                        <option value="Mkataba wa Miaka 2">Mkataba wa Miaka 2</option>
                        <option value="Mkataba wa Mwaka 1">Mkataba wa Mwaka 1</option>
                        <option value="Majaribio (Probation)">Majaribio (Probation - Miezi 6)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] mb-1">
                        Namba ya Mfanyakazi (Employee No):
                      </label>
                      <input
                        type="text"
                        disabled
                        value={`KD-2026-0${employees.length + 10}`}
                        className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-mono"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Inatolewa kiotomatiki na mfumo wa KaziDesk.</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                    <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[10px] block mb-2">
                      Saa za Zamu ya Kazi (Work Shift):
                    </span>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-slate-500 font-semibold mb-1">Kuingia (Start Time):</label>
                        <input
                          type="time"
                          value={shiftStart}
                          onChange={e => setShiftStart(e.target.value)}
                          className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 font-semibold mb-1">Kutoka (End Time):</label>
                        <input
                          type="time"
                          value={shiftEnd}
                          onChange={e => setShiftEnd(e.target.value)}
                          className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Smart Card, PIN & Biometric Fingerprint (Addressing User's Core Need) */}
              {formStep === 'security' && (
                <div className="space-y-4">
                  
                  {/* Card & Terminal Visual Badge */}
                  <div className="p-3.5 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50/60 dark:bg-emerald-950/30 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-mono font-bold text-xs shadow-xs">
                        NFC
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white text-xs">
                          {lang === 'sw' ? 'Kitambulisho cha Smart Card & Kituo cha Mapokezi' : 'RFID Smart Card & Biometric Terminal'}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {lang === 'sw' 
                            ? 'Kadi hii inatengenezwa sasa na inaweza kuchapishwa au kutumika kwenye Kiosk mara moja.' 
                            : 'Generated card can be tapped at the Reception Kiosk or printed on PVC CR80.'}
                        </div>
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold px-2 py-1 bg-white dark:bg-slate-800 rounded border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400">
                      {cardId || defaultCardNumber}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] mb-1">
                        Namba ya Kadi ya RFID / Smart Card: *
                      </label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          required
                          value={cardId}
                          onChange={e => setCardId(e.target.value)}
                          placeholder="KD-CRD-009"
                          className="flex-1 p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() => setCardId(`KD-CRD-0${Math.floor(100 + Math.random() * 900)}`)}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 border border-slate-200 dark:border-slate-700"
                          title="Tengeneza namba mpya ya kadi"
                        >
                          Auto
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">Inasomeka kwa contactless RFID/NFC & barcode scanner.</p>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] mb-1">
                        PIN ya Usalama (Namba 4 za Siri): *
                      </label>
                      <input
                        type="text"
                        maxLength={4}
                        required
                        value={pin}
                        onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="2468"
                        className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-bold tracking-widest text-center focus:ring-2 focus:ring-emerald-500"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Hutumika kwenye kibodi ya PIN ya Kiosk ya Mapokezi.</p>
                    </div>
                  </div>

                  {/* Biometric Fingerprint Enrollment Toggle */}
                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        biometricFingerprintEnrolled 
                          ? 'bg-emerald-600 text-white shadow-xs' 
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                      }`}>
                        <Fingerprint className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white text-xs">
                          {lang === 'sw' ? 'Sajili Alama ya Kidole (Biometric Enrollment)' : 'Biometric Fingerprint Enrollment'}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {biometricFingerprintEnrolled 
                            ? 'Alama ya kidole imethibitishwa na imewekwa tayari kwa skana ya reception.'
                            : 'Mfanyakazi atasajili alama ya kidole baadaye kwenye kituo cha HR.'}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setBiometricFingerprintEnrolled(!biometricFingerprintEnrolled)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                        biometricFingerprintEnrolled
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                      }`}
                    >
                      {biometricFingerprintEnrolled ? '✓ Imesajiliwa' : '+ Sajili Sasa'}
                    </button>
                  </div>

                  {/* Access Levels and Limitations */}
                  <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                        Ngazi ya Ulinzi & Mipaka (Access Level):
                      </label>
                      <span className="text-[11px] font-bold text-emerald-600">
                        Level {accessLevel} {accessLevel === 4 ? '(Mkurugenzi)' : accessLevel === 3 ? '(Meneja)' : accessLevel === 2 ? '(Msimamizi)' : '(Mfanyakazi)'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { level: 1, label: 'Level 1: Staff', desc: 'Ruhusa za msingi za ofisi' },
                        { level: 2, label: 'Level 2: Supervisor', desc: 'Usimamizi wa kazi za timu' },
                        { level: 3, label: 'Level 3: Manager', desc: 'Idhini za bajeti na fedha' },
                        { level: 4, label: 'Level 4: Executive', desc: 'Ruhusa kamili ya ofisi yote' },
                      ].map(item => (
                        <button
                          key={item.level}
                          type="button"
                          onClick={() => setAccessLevel(item.level as any)}
                          className={`p-2.5 rounded-lg text-left border transition-all ${
                            accessLevel === item.level
                              ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 ring-1 ring-emerald-500 text-emerald-900 dark:text-emerald-300'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                          }`}
                        >
                          <div className="font-bold text-[11px]">{item.label}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{item.desc}</div>
                        </button>
                      ))}
                    </div>

                    {/* Allowed Office Zones Checkboxes */}
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] mb-1.5">
                        Maeneo ya Ofisi Anayoruhusiwa Kuingia (Allowed Access Zones):
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {allAvailableZones.map(zone => {
                          const isAllowed = allowedZones.includes(zone);
                          return (
                            <button
                              key={zone}
                              type="button"
                              onClick={() => handleToggleZone(zone)}
                              className={`p-2 rounded-lg text-left text-[11px] border flex items-center justify-between gap-1 transition-all ${
                                isAllowed
                                  ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-300 font-semibold'
                                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:border-slate-300'
                              }`}
                            >
                              <span className="truncate">{zone}</span>
                              {isAllowed && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Approval Limit */}
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] mb-1">
                        Kikomo cha Idhini ya Fedha (Max Approval Limit {currency}):
                      </label>
                      <input
                        type="number"
                        value={maxApprovalAmount}
                        onChange={e => setMaxApprovalAmount(e.target.value)}
                        placeholder="500000"
                        className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono"
                      />
                    </div>

                  </div>

                </div>
              )}

              {/* TAB 4: Salary & Banking Details */}
              {formStep === 'payroll' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] mb-1">
                        Mshahara wa Msingi ({currency}): *
                      </label>
                      <input
                        type="number"
                        required
                        placeholder="2200000"
                        value={basicSalary}
                        onChange={e => setBasicSalary(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] mb-1">
                        Jina la Benki: *
                      </label>
                      <select
                        value={bankName}
                        onChange={e => setBankName(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                      >
                        <option value="CRDB Bank Plc">CRDB Bank Plc</option>
                        <option value="NMB Bank Plc">NMB Bank Plc</option>
                        <option value="National Bank of Commerce (NBC)">National Bank of Commerce (NBC)</option>
                        <option value="Stanbic Bank Tanzania">Stanbic Bank Tanzania</option>
                        <option value="Absa Bank Tanzania">Absa Bank Tanzania</option>
                        <option value="Standard Chartered">Standard Chartered</option>
                        <option value="KCB Bank Tanzania">KCB Bank Tanzania</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1">Posho ya Nyumba:</label>
                      <input
                        type="number"
                        value={housingAllowance}
                        onChange={e => setHousingAllowance(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1">Posho ya Usafiri:</label>
                      <input
                        type="number"
                        value={transportAllowance}
                        onChange={e => setTransportAllowance(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1">Posho ya Mawasiliano:</label>
                      <input
                        type="number"
                        value={commAllowance}
                        onChange={e => setCommAllowance(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] mb-1">
                        Namba ya Akaunti ya Benki:
                      </label>
                      <input
                        type="text"
                        value={accountNumber}
                        onChange={e => setAccountNumber(e.target.value)}
                        placeholder="015099881122"
                        className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] mb-1">
                        Namba ya NSSF:
                      </label>
                      <input
                        type="text"
                        value={nssfNumber}
                        onChange={e => setNssfNumber(e.target.value)}
                        placeholder="1098881234"
                        className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] mb-1">
                        Namba ya TIN (TRA):
                      </label>
                      <input
                        type="text"
                        value={tinNumber}
                        onChange={e => setTinNumber(e.target.value)}
                        placeholder="120-445-998"
                        className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Makato ya kisheria (NSSF 10%, PAYE, WCF 1%, NHIF) yatahesabiwa kiotomatiki kwenye daftari la kila mwezi la mishahara.</span>
                  </div>
                </div>
              )}

              {/* Modal Footer Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {formStep !== 'personal' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (formStep === 'payroll') setFormStep('security');
                        else if (formStep === 'security') setFormStep('job');
                        else if (formStep === 'job') setFormStep('personal');
                      }}
                      className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>{lang === 'sw' ? 'Iliyotangulia' : 'Previous'}</span>
                    </button>
                  )}

                  {formStep !== 'payroll' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (formStep === 'personal') setFormStep('job');
                        else if (formStep === 'job') setFormStep('security');
                        else if (formStep === 'security') setFormStep('payroll');
                      }}
                      className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 flex items-center gap-1"
                    >
                      <span>{lang === 'sw' ? 'Hatua Inayofuata' : 'Next Step'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={handleCloseAddModal}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  >
                    {lang === 'sw' ? 'Ghairi' : 'Cancel'}
                  </button>

                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{lang === 'sw' ? 'Kamilisha Usajili wa Mfanyakazi' : 'Save & Issue Employee Card'}</span>
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Quarterly Performance Feedback Modal */}
      {reviewModalEmployee && (
        <QuarterlyReviewModal
          isOpen={true}
          onClose={() => setReviewModalEmployee(null)}
          employee={reviewModalEmployee}
          reviewerName={currentUserName}
          reviewerRole={currentUserRole}
          onSaveReview={handleSaveQuarterlyReview}
          lang={lang}
        />
      )}

    </div>
  );
};
