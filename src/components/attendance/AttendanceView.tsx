import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Filter, 
  Search, 
  Plus, 
  Briefcase, 
  MapPin, 
  Home, 
  UserCheck, 
  CalendarDays,
  FileCheck2,
  XCircle,
  HelpCircle
} from 'lucide-react';
import { translations } from '../../utils/translations';
import { 
  CurrentUser, 
  AttendanceRecord, 
  LeaveRequest, 
  Employee, 
  LeaveType, 
  Department 
} from '../../types/office';
import { formatDate, formatTime24 } from '../../utils/formatters';
import { exportToCSV } from '../../utils/storage';

interface AttendanceViewProps {
  lang: 'sw' | 'en';
  currentUser: CurrentUser;
  employees: Employee[];
  attendance: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
  onClockInSubmit: (location: 'office' | 'remote' | 'field', notes: string) => void;
  onClockOutSubmit: () => void;
  onApplyLeave: (req: Omit<LeaveRequest, 'id' | 'appliedAt' | 'status'>) => void;
  onReviewLeave: (requestId: string, status: 'approved' | 'rejected', comment?: string) => void;
  onOpenKiosk: () => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  lang,
  currentUser,
  employees,
  attendance,
  leaveRequests,
  onClockInSubmit,
  onClockOutSubmit,
  onApplyLeave,
  onReviewLeave,
  onOpenKiosk
}) => {
  const t = translations[lang];
  const [activeSubTab, setActiveSubTab] = useState<'register' | 'leave'>('register');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [workLocation, setWorkLocation] = useState<'office' | 'remote' | 'field'>('office');
  const [attendanceNotes, setAttendanceNotes] = useState<string>('');
  
  // Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Leave Modal State
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveEmployeeId, setLeaveEmployeeId] = useState(currentUser.id);
  const [leaveType, setLeaveType] = useState<LeaveType>('annual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];
  const userTodayRecord = attendance.find(
    a => a.employeeId === currentUser.id && a.date === todayStr
  );
  const isClockedIn = !!userTodayRecord && userTodayRecord.clockInTime !== '-';
  const isClockedOut = !!userTodayRecord && !!userTodayRecord.clockOutTime;

  // Filter attendance
  const filteredAttendance = attendance.filter(record => {
    const matchesSearch = record.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          record.employeeNo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDept === 'all' || record.department === selectedDept;
    const matchesDate = !selectedDate || record.date === selectedDate;
    return matchesSearch && matchesDept && matchesDate;
  });

  const handleExportCSV = () => {
    const headers = ['Tarehe', 'Namba ya Mfanyakazi', 'Jina Kamili', 'Idara', 'Kuingia', 'Kutoka', 'Masaa', 'Mahali', 'Hali', 'Maelezo'];
    const rows = filteredAttendance.map(a => [
      a.date,
      a.employeeNo,
      a.employeeName,
      a.department,
      a.clockInTime,
      a.clockOutTime || '-',
      a.totalHours || '-',
      a.workLocation,
      a.status,
      a.notes || ''
    ]);
    exportToCSV(`Mahudhurio_${selectedDate || 'Yote'}`, headers, rows);
  };

  const handleLeaveFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !leaveReason) return;

    const emp = employees.find(e => e.id === leaveEmployeeId);
    if (!emp) return;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const daysCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    onApplyLeave({
      employeeId: emp.id,
      employeeName: emp.fullName,
      department: emp.department,
      leaveType,
      startDate,
      endDate,
      daysCount,
      reason: leaveReason
    });

    setIsLeaveModalOpen(false);
    setLeaveReason('');
    setStartDate('');
    setEndDate('');
  };

  const departments: Department[] = [
    'Utawala & Uongozi',
    'Rasilimali Watu (HR)',
    'Fedha & Uhasibu',
    'Teknolojia (IT & Mifumo)',
    'Uendeshaji & Usafirishaji',
    'Masoko & Mauzo',
    'Sheria & Mikataba'
  ];

  return (
    <div className="space-y-6">
      
      {/* Title & Actions Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t.attendance.title}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t.attendance.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onOpenKiosk}
            className="px-3.5 py-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-xs flex items-center gap-1.5"
          >
            <UserCheck className="w-4 h-4 text-emerald-600" />
            <span>{t.attendance.enterKiosk}</span>
          </button>

          <button
            onClick={() => setIsLeaveModalOpen(true)}
            className="px-3.5 py-2 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>{t.attendance.requestLeave}</span>
          </button>
        </div>
      </div>

      {/* Clock-In / Clock-Out Interactive Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          {/* Digital Clock Display */}
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-600 dark:text-emerald-400">
              <Clock className="w-8 h-8" />
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-mono font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
                {currentTime}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                <span>{formatDate(todayStr, lang)}</span>
                <span>·</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{currentUser.name}</span>
                <span>({currentUser.title})</span>
              </div>
            </div>
          </div>

          {/* Location & Notes */}
          <div className="flex-1 max-w-xl grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                {t.attendance.workLocation}
              </label>
              <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <button
                  type="button"
                  onClick={() => setWorkLocation('office')}
                  className={`flex items-center justify-center gap-1 py-1 text-xs font-semibold rounded-md transition-colors ${
                    workLocation === 'office' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Briefcase className="w-3 h-3" />
                  <span>Ofisini</span>
                </button>
                <button
                  type="button"
                  onClick={() => setWorkLocation('remote')}
                  className={`flex items-center justify-center gap-1 py-1 text-xs font-semibold rounded-md transition-colors ${
                    workLocation === 'remote' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Home className="w-3 h-3" />
                  <span>Remote</span>
                </button>
                <button
                  type="button"
                  onClick={() => setWorkLocation('field')}
                  className={`flex items-center justify-center gap-1 py-1 text-xs font-semibold rounded-md transition-colors ${
                    workLocation === 'field' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <MapPin className="w-3 h-3" />
                  <span>Field</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                Maelezo ya Kazi ya Leo (Notes)
              </label>
              <input
                type="text"
                placeholder="Mfano: Kikao na mteja saa 4, ukaguzi..."
                value={attendanceNotes}
                onChange={e => setAttendanceNotes(e.target.value)}
                className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-emerald-500"
              />
            </div>
          </div>

          {/* Action Trigger */}
          <div className="shrink-0 flex items-center gap-2">
            {!isClockedIn ? (
              <button
                onClick={() => {
                  onClockInSubmit(workLocation, attendanceNotes);
                  setAttendanceNotes('');
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>SAINI KUINGIA (CLOCK IN)</span>
              </button>
            ) : !isClockedOut ? (
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <div className="text-xs text-slate-500 dark:text-slate-400 text-center sm:text-right">
                  <div>Umeingia: <span className="font-mono font-bold text-emerald-600">{userTodayRecord?.clockInTime}</span></div>
                  <div className="text-[10px] text-slate-400">{userTodayRecord?.workLocation}</div>
                </div>
                <button
                  onClick={onClockOutSubmit}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-xs transition-colors flex items-center justify-center gap-2"
                >
                  <Clock className="w-4 h-4" />
                  <span>SAINI KUTOKA (CLOCK OUT)</span>
                </button>
              </div>
            ) : (
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Mahudhurio ya leo yamekamilika ({userTodayRecord?.totalHours} hrs)</span>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Tabs: Attendance Register vs Leave Requests */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex items-center gap-4">
        <button
          onClick={() => setActiveSubTab('register')}
          className={`pb-3 text-xs font-bold transition-colors relative ${
            activeSubTab === 'register' 
              ? 'text-emerald-600 dark:text-emerald-400' 
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>{t.attendance.attendanceTab}</span>
          {activeSubTab === 'register' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 dark:bg-emerald-400 rounded-t-full" />
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('leave')}
          className={`pb-3 text-xs font-bold transition-colors relative flex items-center gap-1.5 ${
            activeSubTab === 'leave' 
              ? 'text-emerald-600 dark:text-emerald-400' 
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>{t.attendance.leaveTab}</span>
          {leaveRequests.filter(l => l.status === 'pending').length > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
              {leaveRequests.filter(l => l.status === 'pending').length}
            </span>
          )}
          {activeSubTab === 'leave' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 dark:bg-emerald-400 rounded-t-full" />
          )}
        </button>
      </div>

      {/* Tab Content 1: Register */}
      {activeSubTab === 'register' && (
        <div className="space-y-4">
          
          {/* Search & Filter Bar */}
          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
            
            <div className="flex flex-1 flex-wrap items-center gap-3 w-full">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={t.attendance.searchStaff}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-emerald-500"
                />
              </div>

              {/* Department Filter */}
              <select
                value={selectedDept}
                onChange={e => setSelectedDept(e.target.value)}
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-emerald-500"
              >
                <option value="all">Idara Zote (All Departments)</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>

              {/* Date Filter */}
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-emerald-500"
              />
            </div>

            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>{t.attendance.exportCsv}</span>
            </button>

          </div>

          {/* Attendance Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[11px]">
                    <th className="py-3 px-4">Mfanyakazi</th>
                    <th className="py-3 px-4">Idara</th>
                    <th className="py-3 px-4">Tarehe</th>
                    <th className="py-3 px-4">Kuingia</th>
                    <th className="py-3 px-4">Kutoka</th>
                    <th className="py-3 px-4">Masaa</th>
                    <th className="py-3 px-4">Mahali</th>
                    <th className="py-3 px-4">Hali</th>
                    <th className="py-3 px-4">Maelezo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {filteredAttendance.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                        Hakuna rekodi za mahudhurio zinazolingana na utafutaji wako.
                      </td>
                    </tr>
                  ) : (
                    filteredAttendance.map(record => {
                      const emp = employees.find(e => e.id === record.employeeId);
                      return (
                        <tr key={record.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 flex items-center gap-2.5">
                            <img 
                              src={emp?.avatarUrl} 
                              alt={record.employeeName} 
                              className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700" 
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white leading-tight">
                                {record.employeeName}
                              </div>
                              <div className="text-[10px] font-mono text-slate-400">
                                {record.employeeNo}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{record.department}</td>
                          <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400">{record.date}</td>
                          <td className="py-3 px-4 font-mono font-semibold tabular-nums text-slate-800 dark:text-slate-200">
                            {record.clockInTime}
                          </td>
                          <td className="py-3 px-4 font-mono font-semibold tabular-nums text-slate-800 dark:text-slate-200">
                            {record.clockOutTime || '-'}
                          </td>
                          <td className="py-3 px-4 font-mono tabular-nums">
                            {record.totalHours ? `${record.totalHours} hrs` : '-'}
                          </td>
                          <td className="py-3 px-4 capitalize">
                            <span className="text-xs text-slate-600 dark:text-slate-300">
                              {record.workLocation === 'office' ? 'Ofisini (HQ)' : record.workLocation === 'remote' ? 'Remote' : 'Field'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`text-[11px] font-semibold ${
                              record.status === 'present' ? 'text-emerald-600 dark:text-emerald-400' :
                              record.status === 'late' ? 'text-amber-600 dark:text-amber-400' :
                              record.status === 'on_leave' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'
                            }`}>
                              {record.status === 'present' ? t.attendance.present :
                               record.status === 'late' ? t.attendance.lateBadge :
                               record.status === 'on_leave' ? t.attendance.onLeaveBadge : t.attendance.absentBadge}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500 dark:text-slate-400 max-w-[180px] truncate" title={record.notes}>
                            {record.notes || '-'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Tab Content 2: Leave Management */}
      {activeSubTab === 'leave' && (
        <div className="space-y-6">
          
          {/* Leave Quota Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="text-xs font-semibold text-slate-500">Likizo ya Mwaka (Annual Leave)</div>
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">28 Siku</div>
              <div className="text-[11px] text-slate-400 mt-1">Haki ya kisheria kwa mwaka</div>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="text-xs font-semibold text-slate-500">Likizo ya Ugonjwa (Sick Leave)</div>
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">14 Siku</div>
              <div className="text-[11px] text-slate-400 mt-1">Inayolipwa na cheti cha daktari</div>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="text-xs font-semibold text-slate-500">Likizo ya Uzazi (Maternity)</div>
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">84 Siku</div>
              <div className="text-[11px] text-slate-400 mt-1">Kwa kina mama (Paternity: siku 3)</div>
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="text-xs font-semibold text-slate-500">Likizo ya Dharura (Compassionate)</div>
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">4 Siku</div>
              <div className="text-[11px] text-slate-400 mt-1">Msiba au dharura ya kifamilia</div>
            </div>
          </div>

          {/* Leave Requests Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Maombi Yote ya Likizo & Idhini
              </h3>
              <span className="text-xs text-slate-400">
                {leaveRequests.length} Maombi yaliyosajiliwa
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase text-[11px]">
                    <th className="py-3 px-4">Mfanyakazi</th>
                    <th className="py-3 px-4">Idara</th>
                    <th className="py-3 px-4">Aina ya Likizo</th>
                    <th className="py-3 px-4">Kipindi</th>
                    <th className="py-3 px-4">Siku</th>
                    <th className="py-3 px-4">Sababu</th>
                    <th className="py-3 px-4">Hali</th>
                    <th className="py-3 px-4 text-right">Vitendo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {leaveRequests.map(req => {
                    const emp = employees.find(e => e.id === req.employeeId);
                    return (
                      <tr key={req.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 flex items-center gap-2">
                          <img 
                            src={emp?.avatarUrl} 
                            alt={req.employeeName} 
                            className="w-7 h-7 rounded-full object-cover" 
                            referrerPolicy="no-referrer"
                          />
                          <span className="font-bold text-slate-900 dark:text-white">{req.employeeName}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-500">{req.department}</td>
                        <td className="py-3 px-4 font-medium capitalize">
                          {req.leaveType === 'annual' ? 'Likizo ya Mwaka' :
                           req.leaveType === 'sick' ? 'Likizo ya Ugonjwa' :
                           req.leaveType === 'maternity' ? 'Likizo ya Uzazi' :
                           req.leaveType === 'compassionate' ? 'Likizo ya Dharura' : 'Likizo ya Mafunzo'}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px]">
                          {formatDate(req.startDate, lang)} - {formatDate(req.endDate, lang)}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold tabular-nums">
                          {req.daysCount} siku
                        </td>
                        <td className="py-3 px-4 max-w-[200px] truncate" title={req.reason}>
                          {req.reason}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-[11px] font-bold ${
                            req.status === 'approved' ? 'text-emerald-600 dark:text-emerald-400' :
                            req.status === 'rejected' ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'
                          }`}>
                            {req.status === 'approved' ? 'Imeidhinishwa' :
                             req.status === 'rejected' ? 'Imekataliwa' : 'Inasubiri Idhini'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {req.status === 'pending' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => onReviewLeave(req.id, 'approved', 'Imeidhinishwa rasmi na Utawala.')}
                                className="px-2 py-1 text-[11px] font-bold bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors"
                              >
                                Idhinisha
                              </button>
                              <button
                                onClick={() => onReviewLeave(req.id, 'rejected', 'Haikukidhi vigezo au uhaba wa wafanyakazi.')}
                                className="px-2 py-1 text-[11px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded hover:bg-rose-100 dark:hover:bg-rose-900 transition-colors"
                              >
                                Kataa
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-medium">
                              {req.approvedBy ? `Na: ${req.approvedBy}` : 'Imefungwa'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Leave Application Modal */}
      {isLeaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Fomu ya Maombi ya Likizo
              </h3>
              <button 
                onClick={() => setIsLeaveModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleLeaveFormSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Mfanyakazi Anayeomba:
                </label>
                <select
                  value={leaveEmployeeId}
                  onChange={e => setLeaveEmployeeId(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.fullName} ({e.roleTitle} - {e.department})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Aina ya Likizo:
                </label>
                <select
                  value={leaveType}
                  onChange={e => setLeaveType(e.target.value as LeaveType)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="annual">Likizo ya Mwaka (Annual Leave)</option>
                  <option value="sick">Likizo ya Ugonjwa (Sick Leave)</option>
                  <option value="maternity">Likizo ya Uzazi - Mama (Maternity Leave)</option>
                  <option value="paternity">Likizo ya Uzazi - Baba (Paternity Leave)</option>
                  <option value="compassionate">Likizo ya Dharura / Msiba (Compassionate Leave)</option>
                  <option value="study">Likizo ya Masomo / Mitihani (Study Leave)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Tarehe ya Kuanza:
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Tarehe ya Kumaliza:
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Sababu / Maelezo ya Likizo:
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Eleza kwa ufupi madhumuni ya likizo hii..."
                  value={leaveReason}
                  onChange={e => setLeaveReason(e.target.value)}
                  className="w-full text-xs p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLeaveModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Ghairi
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs"
                >
                  Wasilisha Maombi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
