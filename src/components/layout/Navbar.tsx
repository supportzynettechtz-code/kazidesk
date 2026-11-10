import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Clock, 
  CalendarCheck, 
  KanbanSquare, 
  FileText, 
  Wallet, 
  Package, 
  Users, 
  Coins, 
  Sun, 
  Moon, 
  Globe, 
  ChevronDown,
  CreditCard,
  ShieldCheck,
  Fingerprint,
  CheckCircle2,
  LogIn,
  LogOut,
  UserPlus,
  TrendingUp,
  Megaphone,
  Video,
  FileCheck,
  Sparkles,
  Lock,
  HelpCircle,
  Database,
  Sliders,
  FileQuestion,
  BarChart3
} from 'lucide-react';
import { translations } from '../../utils/translations';
import { UserRole, CurrentUser, AttendanceRecord } from '../../types/office';
import { LOGO_PATH } from '../../data/initialData';
import { formatTime24 } from '../../utils/formatters';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  lang: 'sw' | 'en';
  setLang: (lang: 'sw' | 'en') => void;
  currency: 'TZS' | 'USD';
  setCurrency: (c: 'TZS' | 'USD') => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  currentUser: CurrentUser;
  setCurrentUser: (u: CurrentUser) => void;
  employees: Array<{ id: string; fullName: string; roleTitle: string; department: string; avatarUrl: string }>;
  attendance: AttendanceRecord[];
  onClockIn: () => void;
  onClockOut: () => void;
  onOpenKiosk: () => void;
  onNewEmployeeModal?: () => void;
  currentCompany?: { id: string; name: string; status: string; subscriptionDueDate?: string; logoUrl?: string; brandColor?: string } | null;
  isSuperAdmin?: boolean;
  isReadOnlyMode?: boolean;
  onExitReadOnlyMode?: () => void;
  onLogout?: () => void;
  onOpenTestSuite?: () => void;
  enabledModules?: string[];
  onOpenDataSafety?: () => void;
  onOpenSetupWizard?: () => void;
  onOpenTerms?: () => void;
  platformName?: string;
  platformLogoUrl?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  lang,
  setLang,
  currency,
  setCurrency,
  theme,
  toggleTheme,
  currentUser,
  setCurrentUser,
  employees,
  attendance,
  onClockIn,
  onClockOut,
  onOpenKiosk,
  onNewEmployeeModal,
  currentCompany,
  isSuperAdmin,
  isReadOnlyMode,
  onExitReadOnlyMode,
  onLogout,
  onOpenTestSuite,
  enabledModules,
  onOpenDataSafety,
  onOpenSetupWizard,
  onOpenTerms,
  platformName,
  platformLogoUrl,
}) => {
  const t = translations[lang];
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [timeNow, setTimeNow] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeNow(now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];
  const userTodayRecord = attendance.find(
    a => a.employeeId === currentUser.id && a.date === todayStr
  );
  const isClockedIn = !!userTodayRecord && userTodayRecord.clockInTime !== '-';
  const isClockedOut = !!userTodayRecord && !!userTodayRecord.clockOutTime;

  const navItems = [
    ...(isSuperAdmin ? [{ id: 'superadmin', label: lang === 'sw' ? 'Portal ya Msimamizi Mkuu' : 'Super Admin Portal', icon: ShieldCheck }] : []),
    { id: 'dashboard', label: t.nav.dashboard, icon: Building2 },
    { id: 'quotations', label: t.nav.quotations, icon: FileCheck },
    { id: 'attendance', label: t.nav.attendance, icon: CalendarCheck },
    { id: 'employees', label: t.nav.employees, icon: Users },
    { id: 'tasks', label: t.nav.tasks, icon: KanbanSquare },
    { id: 'sales', label: t.nav.sales, icon: TrendingUp },
    { id: 'announcements', label: t.nav.announcements, icon: Megaphone },
    { id: 'meetings', label: t.nav.meetings, icon: Video },
    { id: 'payroll', label: t.nav.payroll, icon: Wallet },
    { id: 'assets', label: lang === 'sw' ? 'Vifaa & Stoo' : 'Assets & Store', icon: Package },
    { id: 'documents', label: t.nav.documents, icon: FileText },
    { id: 'cards', label: t.nav.cards, icon: CreditCard },
    { id: 'permissions', label: t.nav.permissions, icon: ShieldCheck },
    { id: 'pettyCash', label: t.nav.pettyCash, icon: Coins },
    { id: 'reports', label: t.nav.reports, icon: BarChart3 },
    ...(!isSuperAdmin ? [{ id: 'subscription', label: lang === 'sw' ? 'Usajili (Subscription)' : 'Subscription & Plan', icon: Sparkles }] : []),
    { id: 'help', label: lang === 'sw' ? 'Mwongozo & Msaada' : 'Help & Guide', icon: HelpCircle },
  ];

  const handleRoleSwitch = (role: UserRole | 'sales') => {
    let targetEmp = employees.find(e => {
      if (role === 'admin') return e.id === 'EMP-001';
      if (role === 'hr') return e.id === 'EMP-002';
      if (role === 'finance') return e.id === 'EMP-003';
      if (role === 'sales') return e.department === 'Masoko & Mauzo' || e.id === 'EMP-005';
      return e.id === 'EMP-006';
    });

    if (targetEmp) {
      setCurrentUser({
        id: targetEmp.id,
        name: targetEmp.fullName,
        email: `${targetEmp.id.toLowerCase()}@kazidesk.co.tz`,
        role: role === 'sales' ? 'employee' : role,
        title: targetEmp.roleTitle,
        department: targetEmp.department,
        avatarUrl: targetEmp.avatarUrl,
      });
    }
    setRoleDropdownOpen(false);
  };

  return (
    <>
      {/* Read-Only Super Admin Audit Banner */}
      {isReadOnlyMode && (
        <div className="bg-amber-600 text-white px-4 py-2.5 text-xs flex flex-col sm:flex-row items-center justify-between gap-2 font-bold shadow-md">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>
              UKAGUZI WA USALAMA: Unatazama data za kampuni ya "{currentCompany?.name}" kama Msimamizi Mkuu (Read-Only Mode). Huruhusiwi kufanya mabadiliko au kufuta chochote.
            </span>
          </div>
          {onExitReadOnlyMode && (
            <button
              onClick={onExitReadOnlyMode}
              className="px-3 py-1 bg-slate-950 hover:bg-slate-900 text-white rounded-lg text-xs font-black shadow-sm shrink-0"
            >
              Toka Kwenye Ukaguzi (Exit)
            </button>
          )}
        </div>
      )}

      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
        {/* Top Bar Contract: Zone 1 (Brand) - Zone 2 (Nav Links) - Zone 3 (Action Controls) */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-6 h-16">
            
            {/* Zone 1: Single-element Brand Wordmark */}
            <div className="flex items-center gap-3 shrink-0">
              <button 
                onClick={() => setCurrentTab('dashboard')} 
                className="flex items-center gap-2.5 text-left focus:outline-none"
              >
                <img 
                  src={currentCompany?.logoUrl || platformLogoUrl || LOGO_PATH} 
                  alt={currentCompany?.name || platformName || 'Logo'} 
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = LOGO_PATH;
                  }}
                  className="w-9 h-9 rounded-lg object-cover ring-1 ring-slate-200 dark:ring-slate-700 shadow-xs" 
                  referrerPolicy="no-referrer"
                />
                <div className="flex flex-col">
                  <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap leading-tight truncate max-w-[180px]">
                    {currentCompany?.name || platformName || 'KaziDesk'}
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-medium text-emerald-600 dark:text-emerald-400 whitespace-nowrap leading-none flex items-center gap-1">
                    {isSuperAdmin ? 'Super Admin Portal' : (currentCompany?.status === 'trial' ? 'Majaribio (Trial)' : (platformName || 'KaziDesk'))}
                  </span>
                </div>
              </button>
            </div>

            {/* Zone 2: Concise Nav Links (Single line, text with subtle hover) */}
            <nav className="hidden xl:flex items-center gap-1 overflow-x-auto py-1">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                const isLocked = Boolean(
                  !isSuperAdmin &&
                  enabledModules &&
                  enabledModules.length > 0 &&
                  item.id !== 'dashboard' &&
                  item.id !== 'subscription' &&
                  item.id !== 'superadmin' &&
                  !enabledModules.includes(item.id)
                );
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentTab(item.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap shrink-0 ${
                      isActive 
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold' 
                        : isLocked
                        ? 'text-slate-400 dark:text-slate-500 hover:bg-slate-100/60 dark:hover:bg-slate-800/40'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : isLocked ? 'text-slate-400 opacity-60' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                    {isLocked && <Lock className="w-2.5 h-2.5 text-amber-500 ml-0.5" />}
                  </button>
                );
              })}
            </nav>

          {/* Zone 3: Quick Action & Profile Affordances */}
          <div className="flex items-center gap-2.5 shrink-0">
            
            {/* Quick Add Employee Launcher */}
            {onNewEmployeeModal && (
              <button
                onClick={onNewEmployeeModal}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:border-emerald-300 dark:hover:border-emerald-700 shadow-xs transition-colors whitespace-nowrap"
                title="Sajili mfanyakazi mpya kwenye mfumo"
              >
                <UserPlus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">{lang === 'sw' ? '+ Sajili Mfanyakazi' : '+ Onboard Staff'}</span>
              </button>
            )}

            {/* Biometric & Smart Card Kiosk Quick Launcher */}
            <button
              onClick={onOpenKiosk}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs transition-colors whitespace-nowrap"
              title="Fungua Kituo cha Mapokezi (Fingerprint, Card & PIN Kiosk)"
            >
              <Fingerprint className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Kiosk Terminal</span>
            </button>

            {/* Live Clock & Quick Attendance Action */}
            <div className="hidden sm:flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <Clock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span className="font-mono tabular-nums text-xs font-semibold text-slate-800 dark:text-slate-200">
                {timeNow}
              </span>
              <div className="w-px h-3.5 bg-slate-300 dark:bg-slate-600" />
              
              {!isClockedIn ? (
                <button
                  onClick={onClockIn}
                  className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded transition-colors whitespace-nowrap"
                  title="Saini kuingia kazini sasa"
                >
                  <LogIn className="w-3 h-3" />
                  <span>{t.topBar.clockIn}</span>
                </button>
              ) : !isClockedOut ? (
                <button
                  onClick={onClockOut}
                  className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold text-white bg-amber-600 hover:bg-amber-700 rounded transition-colors whitespace-nowrap"
                  title={`Umeingia ${formatTime24(userTodayRecord?.clockInTime)}. Bonyeza kusaini kutoka.`}
                >
                  <LogOut className="w-3 h-3" />
                  <span>{t.topBar.clockOut}</span>
                </button>
              ) : (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Kazi Imekamilika</span>
                </span>
              )}
            </div>

            {/* Currency Switcher */}
            <button
              onClick={() => setCurrency(currency === 'TZS' ? 'USD' : 'TZS')}
              className="px-2 py-1 text-xs font-mono font-bold rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              title="Badili Sarafu (TZS / USD)"
            >
              {currency}
            </button>

            {/* Language Switcher */}
            <button
              onClick={() => setLang(lang === 'sw' ? 'en' : 'sw')}
              className="flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              title="Badili Lugha / Switch Language"
            >
              <Globe className="w-3 h-3 text-slate-500" />
              <span>{lang === 'sw' ? 'EN' : 'SW'}</span>
            </button>

            {/* Dark / Light Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              title={theme === 'light' ? 'Tumia Dark Mode' : 'Tumia Light Mode'}
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
            </button>

            {/* Role Switcher Simulator */}
            <div className="relative">
              <button
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left"
              >
                <img 
                  src={currentUser.avatarUrl} 
                  alt={currentUser.name} 
                  className="w-6 h-6 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                  referrerPolicy="no-referrer"
                />
                <div className="hidden md:flex flex-col">
                  <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight truncate max-w-[110px]">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-none">
                    {currentUser.role === 'admin' ? t.topBar.roleAdmin : currentUser.role === 'hr' ? t.topBar.roleHR : currentUser.role === 'finance' ? t.topBar.roleFinance : t.topBar.roleEmployee}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {roleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1.5 z-50 text-xs">
                  <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-700 font-semibold text-slate-400 text-[10px] uppercase">
                    Badili Mtazamo wa Wadhifa
                  </div>
                  <button
                    onClick={() => handleRoleSwitch('admin')}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 ${currentUser.role === 'admin' ? 'font-bold text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-200'}`}
                  >
                    <span>Mkurugenzi (CEO / Admin)</span>
                    {currentUser.role === 'admin' && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => handleRoleSwitch('hr')}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 ${currentUser.role === 'hr' ? 'font-bold text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-200'}`}
                  >
                    <span>Meneja Rasilimali Watu (HR)</span>
                    {currentUser.role === 'hr' && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => handleRoleSwitch('finance')}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 ${currentUser.role === 'finance' ? 'font-bold text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-200'}`}
                  >
                    <span>Afisa Fedha & Uhasibu</span>
                    {currentUser.role === 'finance' && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => handleRoleSwitch('sales')}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 ${currentUser.department === 'Masoko & Mauzo' ? 'font-bold text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-200'}`}
                  >
                    <span>Afisa Mauzo (Sales Lead)</span>
                    {currentUser.department === 'Masoko & Mauzo' && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => handleRoleSwitch('employee')}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 ${currentUser.role === 'employee' && currentUser.department !== 'Masoko & Mauzo' ? 'font-bold text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-200'}`}
                  >
                    <span>Mfanyakazi wa Kawaida</span>
                    {currentUser.role === 'employee' && currentUser.department !== 'Masoko & Mauzo' && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </button>

                  {(onOpenSetupWizard || onOpenDataSafety || onOpenTerms) && (
                    <div className="pt-1.5 mt-1.5 border-t border-slate-100 dark:border-slate-700">
                      <div className="px-3 py-1 font-semibold text-slate-400 text-[10px] uppercase">
                        Zana za Kampuni
                      </div>
                      {onOpenSetupWizard && (
                        <button
                          onClick={() => {
                            setRoleDropdownOpen(false);
                            onOpenSetupWizard();
                          }}
                          className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                        >
                          <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Mwongozo wa Awali (Wizard)</span>
                        </button>
                      )}
                      {onOpenDataSafety && (
                        <button
                          onClick={() => {
                            setRoleDropdownOpen(false);
                            onOpenDataSafety();
                          }}
                          className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                        >
                          <Database className="w-3.5 h-3.5 text-blue-600" />
                          <span>Usalama & Backup ya Data</span>
                        </button>
                      )}
                      {onOpenTerms && (
                        <button
                          onClick={() => {
                            setRoleDropdownOpen(false);
                            onOpenTerms();
                          }}
                          className="w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                        >
                          <FileQuestion className="w-3.5 h-3.5 text-slate-500" />
                          <span>Vigezo & Faragha</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* SaaS Verification Test Suite Button */}
            {onOpenTestSuite && (
              <button
                onClick={onOpenTestSuite}
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 hover:bg-blue-500/25 transition-colors"
                title="Fanya Majaribio ya Kiufundi ya SaaS (Requirement 7 Verification)"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">SaaS Tests</span>
              </button>
            )}

            {/* Logout Button */}
            {onLogout && (
              <button
                onClick={onLogout}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-300 dark:hover:border-rose-800 transition-colors"
                title="Toka Kwenye Mfumo (Logout)"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}

          </div>

        </div>

        {/* Mobile & Tablet Nav Row */}
        <div className="flex xl:hidden items-center gap-1 overflow-x-auto py-2 border-t border-slate-100 dark:border-slate-800/60">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            const isLocked = Boolean(
              !isSuperAdmin &&
              enabledModules &&
              enabledModules.length > 0 &&
              item.id !== 'dashboard' &&
              item.id !== 'subscription' &&
              item.id !== 'superadmin' &&
              !enabledModules.includes(item.id)
            );
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                  isActive 
                    ? 'bg-emerald-600 text-white font-bold' 
                    : isLocked
                    ? 'text-slate-400 dark:text-slate-500 hover:bg-slate-100/60'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{item.label}</span>
                {isLocked && <Lock className="w-2.5 h-2.5 text-amber-500" />}
              </button>
            );
          })}
        </div>

      </div>
    </header>
    </>
  );
};
