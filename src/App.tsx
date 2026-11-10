/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/layout/Navbar';
import { DashboardView } from './components/dashboard/DashboardView';
import { AttendanceView } from './components/attendance/AttendanceView';
import { BiometricKioskModal } from './components/attendance/BiometricKioskModal';
import { TasksView } from './components/tasks/TasksView';
import { DocumentsView } from './components/documents/DocumentsView';
import { PayrollView } from './components/payroll/PayrollView';
import { AssetsView } from './components/assets/AssetsView';
import { EmployeesView } from './components/employees/EmployeesView';
import { CardGeneratorView } from './components/cards/CardGeneratorView';
import { AccessControlView } from './components/security/AccessControlView';
import { PettyCashView } from './components/pettycash/PettyCashView';
import { SalesMarketingView } from './components/sales/SalesMarketingView';
import { AnnouncementsView } from './components/announcements/AnnouncementsView';
import { MeetingRoomView } from './components/meetings/MeetingRoomView';
import { QuotationsInvoicesView } from './components/billing/QuotationsInvoicesView';

// SaaS Multi-Tenant Components
import { LoginView } from './components/auth/LoginView';
import { SuperAdminPortal } from './components/superadmin/SuperAdminPortal';
import { CompanySubscriptionView } from './components/subscription/CompanySubscriptionView';
import { SuspendedCompanyBanner } from './components/subscription/SuspendedCompanyBanner';
import { ForcePasswordChangeModal } from './components/auth/ForcePasswordChangeModal';
import { SaaSTestSuiteModal } from './components/testing/SaaSTestSuiteModal';
import { TabErrorBoundary } from './components/common/TabErrorBoundary';
import { FirstLoginSetupWizard } from './components/onboarding/FirstLoginSetupWizard';
import { HelpGuideView } from './components/help/HelpGuideView';
import { CompanyDataSafetyModal } from './components/common/CompanyDataSafetyModal';
import { TermsPrivacyModal } from './components/common/TermsPrivacyModal';
import { ReportsView } from './components/reports/ReportsView';
import { LiveMeetingsView } from './components/meetings/LiveMeetingsView';
import { GranularAccessControlView } from './components/security/GranularAccessControlView';
import { ComprehensiveReportsView } from './components/reports/ComprehensiveReportsView';
import { ComprehensiveHelpGuideView } from './components/help/ComprehensiveHelpGuideView';
import { OwnerLoginView } from './components/auth/OwnerLoginView';
import { CustomerKYCWizard } from './components/kyc/CustomerKYCWizard';
import { CustomerKYCStatusView } from './components/kyc/CustomerKYCStatusView';
import { SessionTimeoutWatcher } from './components/common/SessionTimeoutWatcher';
import { KYCApplication } from './types/kyc';
import { getKYCApplicationByUserId } from './services/kycService';
import { useTranslation } from './context/TranslationContext';

import { 
  CurrentUser, 
  Employee, 
  AttendanceRecord, 
  LeaveRequest, 
  OfficeTask, 
  OfficeDocument, 
  ApprovalRequest, 
  PayrollRun, 
  OfficeAsset, 
  ConsumableItem, 
  PettyCashVoucher, 
  DailyWorkLog, 
  CompanyAnnouncement,
  SalesLead,
  SalesKPI,
  SalesReport,
  InventoryTransaction,
  MeetingRoom,
  MeetingParticipant,
  Client,
  CatalogueItem,
  Quotation,
  Invoice,
  CompanyBillingProfile
} from './types/office';

import { Company, SaaSPlan, PlatformSettings, UserAccount } from './types/saas';
import { auth, PLATFORM_OWNER_EMAIL, testConnection } from './firebase/config';
import {
  getCompanyById,
  getPlans,
  getPlatformSettings,
  DEFAULT_PLATFORM_SETTINGS,
  DEFAULT_PLANS,
  logAuditAction
} from './services/tenantService';
import {
  fetchTenantDataBundle,
  saveTenantDocument,
  deleteTenantDocument,
  assertStaffQuota,
  assertInvoiceQuota,
  exportTenantBackup
} from './services/companyDataService';
import { seedInitialTenantData } from './services/seedService';
import { logoutUser } from './services/authService';

import { generateMonthlyPayroll, INITIAL_MEETING_ROOM, INITIAL_BILLING_PROFILE } from './data/initialData';
import { translations } from './utils/translations';
import { 
  DownloadCloud, 
  Sparkles, 
  Megaphone, 
  ArrowRight, 
  ShieldCheck, 
  Lock, 
  LogOut, 
  Play, 
  RefreshCw,
  Phone,
  Mail,
  MessageCircle
} from 'lucide-react';

export default function App() {
  // Global SaaS States
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [currentUserAccount, setCurrentUserAccount] = useState<UserAccount>({
    uid: 'user-demo-admin',
    email: 'admin@democompany.co.tz',
    displayName: 'Juma Mwamburi (Director)',
    companyId: 'demo-company-tz',
    role: 'admin',
    isCompanyAdmin: true,
    status: 'active',
    createdAt: new Date().toISOString(),
  });
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [activePlan, setActivePlan] = useState<SaaSPlan>(DEFAULT_PLANS[1]);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>(DEFAULT_PLATFORM_SETTINGS);

  // Platform Owner vs Customer Route Detection
  const [currentRoute, setCurrentRoute] = useState<'customer' | 'owner'>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const hash = window.location.hash;
      const search = window.location.search;
      if (path.includes('/owner-login') || hash.includes('/owner-login') || search.includes('route=owner-login')) {
        return 'owner';
      }
    }
    return 'customer';
  });

  // KYC and Registration States
  const [isRegisterWizardOpen, setIsRegisterWizardOpen] = useState<boolean>(false);
  const [currentKYCApplication, setCurrentKYCApplication] = useState<KYCApplication | null>(null);

  // Listen to hash and popstate for route switching
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      const search = window.location.search;
      if (path.includes('/owner-login') || hash.includes('/owner-login') || search.includes('route=owner-login')) {
        setCurrentRoute('owner');
      } else {
        setCurrentRoute('customer');
      }
    };
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  // Check KYC status when user account changes
  useEffect(() => {
    const checkKYC = async () => {
      if (currentUserAccount?.uid && currentUserAccount.role !== 'superadmin') {
        const app = await getKYCApplicationByUserId(currentUserAccount.uid);
        setCurrentKYCApplication(app);
      } else {
        setCurrentKYCApplication(null);
      }
    };
    if (isAuthenticated) {
      checkKYC();
    }
  }, [currentUserAccount?.uid, isAuthenticated]);

  // Read-Only Super Admin Inspect Mode
  const [isReadOnlyMode, setIsReadOnlyMode] = useState<boolean>(false);
  const [readOnlyCompanyTarget, setReadOnlyCompanyTarget] = useState<Company | null>(null);

  // Active Tab
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const { lang, setLang } = useTranslation();
  const [currency, setCurrency] = useState<'TZS' | 'USD'>('TZS');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Multi-Tenant Collections (Loaded per company from Firestore)
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [tasks, setTasks] = useState<OfficeTask[]>([]);
  const [documents, setDocuments] = useState<OfficeDocument[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [payroll, setPayroll] = useState<PayrollRun>(generateMonthlyPayroll([]));
  const [assets, setAssets] = useState<OfficeAsset[]>([]);
  const [consumables, setConsumables] = useState<ConsumableItem[]>([]);
  const [inventoryTransactions, setInventoryTransactions] = useState<InventoryTransaction[]>([]);
  const [pettyCash, setPettyCash] = useState<PettyCashVoucher[]>([]);
  const [announcements, setAnnouncements] = useState<CompanyAnnouncement[]>([]);
  const [salesLeads, setSalesLeads] = useState<SalesLead[]>([]);
  const [salesKPIs, setSalesKPIs] = useState<SalesKPI[]>([]);
  const [salesReports, setSalesReports] = useState<SalesReport[]>([]);
  const [meetingRoom, setMeetingRoom] = useState<MeetingRoom>(INITIAL_MEETING_ROOM);
  const [clients, setClients] = useState<Client[]>([]);
  const [catalogueItems, setCatalogueItems] = useState<CatalogueItem[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [billingProfile, setBillingProfile] = useState<CompanyBillingProfile>(INITIAL_BILLING_PROFILE);
  const [dailyLogs, setDailyLogs] = useState<DailyWorkLog[]>([]);

  // UI Modals
  const [isKioskOpen, setIsKioskOpen] = useState(false);
  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);
  const [isTestSuiteOpen, setIsTestSuiteOpen] = useState(false);
  const [isLoadingCompanyData, setIsLoadingCompanyData] = useState(false);
  const [isSetupWizardOpen, setIsSetupWizardOpen] = useState(false);
  const [isDataSafetyOpen, setIsDataSafetyOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [termsModalTab, setTermsModalTab] = useState<'terms' | 'privacy'>('terms');

  // Sync theme
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Initial Seed & Database Connection Check on boot
  useEffect(() => {
    const initBoot = async () => {
      await testConnection();
      await seedInitialTenantData();
      const settings = await getPlatformSettings();
      setPlatformSettings(settings);

      // Load initial company
      loadCompanyData('demo-company-tz');
    };
    initBoot();
  }, []);

  // -------------------------------------------------------------------------
  // LOAD SPECIFIC TENANT DATA
  // -------------------------------------------------------------------------
  const loadCompanyData = async (companyId: string) => {
    setIsLoadingCompanyData(true);
    try {
      let comp = await getCompanyById(companyId);
      if (!comp && companyId === 'demo-company-tz') {
        comp = {
          id: 'demo-company-tz',
          name: 'Demo Company (KaziDesk TZ)',
          tin: '123-456-789',
          address: 'Posta Mpya, Mtaa wa Samora, Jengo la Golden Jubilee, Dar es Salaam',
          contactPerson: 'Juma Mwamburi',
          phone: '+255 754 123 456',
          email: 'admin@democompany.co.tz',
          planId: 'enterprise',
          status: 'active',
          subscriptionStartDate: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
          subscriptionDueDate: new Date(Date.now() + 25 * 86400000).toISOString().split('T')[0],
          adminEmail: 'admin@democompany.co.tz',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
      setCurrentCompany(comp);

      if (comp) {
        const plans = await getPlans();
        const p = plans.find(plan => plan.id === comp.planId) || DEFAULT_PLANS[0];
        setActivePlan(p);
        if (comp.isOnboarded === false && currentUserAccount.isCompanyAdmin) {
          setIsSetupWizardOpen(true);
        }
      }

      // Fetch all tenant data bundle from Firestore subcollections
      const bundle = await fetchTenantDataBundle(companyId);
      setEmployees(bundle.employees);
      setAttendance(bundle.attendance);
      setLeaveRequests(bundle.leaveRequests);
      setTasks(bundle.tasks);
      setDocuments(bundle.documents);
      setApprovals(bundle.approvals);
      if (bundle.payroll) setPayroll(bundle.payroll);
      setAssets(bundle.assets);
      setConsumables(bundle.consumables);
      setInventoryTransactions(bundle.inventoryTransactions);
      setPettyCash(bundle.pettyCash);
      setAnnouncements(bundle.announcements);
      setSalesLeads(bundle.salesLeads);
      setSalesKPIs(bundle.salesKPIs);
      setSalesReports(bundle.salesReports);
      if (bundle.meetingRoom) setMeetingRoom(bundle.meetingRoom);
      setClients(bundle.clients);
      setCatalogueItems(bundle.catalogueItems);
      setQuotations(bundle.quotations);
      setInvoices(bundle.invoices);
      if (bundle.billingProfile) setBillingProfile(bundle.billingProfile);

    } catch (e) {
      console.warn('Error loading tenant bundle:', e);
    } finally {
      setIsLoadingCompanyData(false);
    }
  };

  // -------------------------------------------------------------------------
  // ROLE & TENANT 1-CLICK TEST SWITCHER
  // -------------------------------------------------------------------------
  const handleTestSwitch = async (roleOrEmail: string) => {
    // 1. Clear all tenant cache and state immediately
    setEmployees([]);
    setAttendance([]);
    setTasks([]);
    setInvoices([]);
    setQuotations([]);
    setClients([]);
    setIsReadOnlyMode(false);
    setReadOnlyCompanyTarget(null);

    if (roleOrEmail === 'superadmin') {
      setCurrentUserAccount({
        uid: 'owner-superadmin',
        email: PLATFORM_OWNER_EMAIL,
        displayName: 'Platform Owner (Super Admin)',
        companyId: 'platform',
        role: 'superadmin',
        isCompanyAdmin: false,
        status: 'active',
        createdAt: new Date().toISOString(),
      });
      setCurrentCompany(null);
      setCurrentTab('superadmin');
      setIsAuthenticated(true);
      return;
    }

    if (roleOrEmail === 'demo_admin') {
      setCurrentUserAccount({
        uid: 'user-demo-admin',
        email: 'admin@democompany.co.tz',
        displayName: 'Juma Mwamburi (Demo Director)',
        companyId: 'demo-company-tz',
        role: 'admin',
        isCompanyAdmin: true,
        status: 'active',
        createdAt: new Date().toISOString(),
      });
      setCurrentTab('dashboard');
      setIsAuthenticated(true);
      await loadCompanyData('demo-company-tz');
      return;
    }

    if (roleOrEmail === 'company_a_admin') {
      setCurrentUserAccount({
        uid: 'user-kili-admin',
        email: 'admin@kililogistics.co.tz',
        displayName: 'Josephat Mushi (MD)',
        companyId: 'company-a-kili',
        role: 'admin',
        isCompanyAdmin: true,
        status: 'active',
        createdAt: new Date().toISOString(),
      });
      setCurrentTab('dashboard');
      setIsAuthenticated(true);
      await loadCompanyData('company-a-kili');
      return;
    }

    if (roleOrEmail === 'company_b_admin') {
      setCurrentUserAccount({
        uid: 'user-serengeti-admin',
        email: 'admin@serengetisafaris.co.tz',
        displayName: 'Amina Mollel (MD)',
        companyId: 'company-b-serengeti',
        role: 'admin',
        isCompanyAdmin: true,
        status: 'active',
        createdAt: new Date().toISOString(),
      });
      setCurrentTab('dashboard');
      setIsAuthenticated(true);
      await loadCompanyData('company-b-serengeti');
      return;
    }

    if (roleOrEmail === 'company_a_staff') {
      setCurrentUserAccount({
        uid: 'user-kili-staff-grace',
        email: 'grace.tarimo@kililogistics.co.tz',
        displayName: 'Grace Tarimo',
        companyId: 'company-a-kili',
        role: 'staff',
        isCompanyAdmin: false,
        status: 'active',
        createdAt: new Date().toISOString(),
      });
      setCurrentTab('dashboard');
      setIsAuthenticated(true);
      await loadCompanyData('company-a-kili');
      return;
    }

    if (roleOrEmail === 'company_suspended') {
      setCurrentUserAccount({
        uid: 'user-suspended-admin',
        email: 'admin@tangadistributors.co.tz',
        displayName: 'Salim Mkumbukwa',
        companyId: 'company-c-suspended',
        role: 'admin',
        isCompanyAdmin: true,
        status: 'active',
        createdAt: new Date().toISOString(),
      });
      setIsAuthenticated(true);
      await loadCompanyData('company-c-suspended');
      return;
    }
  };

  // -------------------------------------------------------------------------
  // READ-ONLY "VIEW COMPANY" (AUDITED BY SUPER ADMIN)
  // -------------------------------------------------------------------------
  const handleEnterReadOnlyView = async (targetCompany: Company) => {
    setIsReadOnlyMode(true);
    setReadOnlyCompanyTarget(targetCompany);
    await logAuditAction(
      'VIEW_COMPANY_DATA',
      targetCompany.id,
      targetCompany.name,
      `Super Admin accessed internal tenant records in read-only audit mode for: ${targetCompany.name} (TIN: ${targetCompany.tin})`
    );
    await loadCompanyData(targetCompany.id);
    setCurrentTab('dashboard');
  };

  const handleExitReadOnlyView = async () => {
    if (readOnlyCompanyTarget) {
      await logAuditAction(
        'EXITED_VIEW_COMPANY_MODE',
        readOnlyCompanyTarget.id,
        readOnlyCompanyTarget.name,
        `Super Admin completed inspection and exited view mode for: ${readOnlyCompanyTarget.name}`
      );
    }
    setIsReadOnlyMode(false);
    setReadOnlyCompanyTarget(null);
    setCurrentTab('superadmin');
  };

  // -------------------------------------------------------------------------
  // LOGOUT (CLEARS ALL SESSION STATE & CACHES)
  // -------------------------------------------------------------------------
  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (e) {
      console.warn('Logout notice:', e);
    }
    // Clean wipe
    setIsAuthenticated(false);
    setCurrentCompany(null);
    setIsReadOnlyMode(false);
    setReadOnlyCompanyTarget(null);
    setEmployees([]);
    setAttendance([]);
    setTasks([]);
    setInvoices([]);
    setQuotations([]);
    setClients([]);
  };

  // Guard for Read-Only Mode Writes
  const assertWriteAllowed = (): boolean => {
    if (isReadOnlyMode) {
      if (readOnlyCompanyTarget) {
        logAuditAction(
          'BLOCKED_WRITE_ATTEMPT_IN_AUDIT_MODE',
          readOnlyCompanyTarget.id,
          readOnlyCompanyTarget.name,
          `Super Admin attempted data write/modification while in read-only audit mode for ${readOnlyCompanyTarget.name}. Action was blocked.`
        );
      }
      alert('ONYO LA USALAMA: Upo kwenye Hali ya Ukaguzi (Read-Only Mode) kama Msimamizi Mkuu. Huruhusiwi kuhariri au kufuta data za kampuni hii.');
      return false;
    }
    return true;
  };

  // Current User Object passed to modules
  const activeCompanyId = currentCompany?.id || currentUserAccount.companyId;
  const currentAppUser: CurrentUser = {
    id: currentUserAccount.uid,
    name: currentUserAccount.displayName,
    email: currentUserAccount.email,
    role: (currentUserAccount.role === 'superadmin' ? 'admin' : currentUserAccount.role) as any,
    title: currentUserAccount.role === 'admin' ? 'Mkurugenzi (Director)' : 'Mfanyakazi',
    department: 'Utawala',
    avatarUrl: employees.find(e => e.id === currentUserAccount.uid)?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  };

  // -------------------------------------------------------------------------
  // SUBCOLLECTION WRITERS (Persisted to Firestore companies/{companyId}/...)
  // -------------------------------------------------------------------------
  const handleAddEmployee = async (newEmp: Omit<Employee, 'id'>) => {
    if (!assertWriteAllowed()) return;

    try {
      // Enforce plan quota (Max Staff)
      await assertStaffQuota(activeCompanyId, activePlan, employees.length);

      const empWithId: Employee = { ...newEmp, id: `EMP-${Date.now()}` };
      const updated = [empWithId, ...employees];
      setEmployees(updated);
      await saveTenantDocument(activeCompanyId, 'staff', empWithId);
      setIsAddEmployeeModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Hitilafu ya kuongeza mfanyakazi.');
    }
  };

  const handleUpdateEmployee = async (updatedEmp: Employee) => {
    if (!assertWriteAllowed()) return;
    const updated = employees.map(e => e.id === updatedEmp.id ? updatedEmp : e);
    setEmployees(updated);
    await saveTenantDocument(activeCompanyId, 'staff', updatedEmp);
  };

  const handleUpdateEmployeePermissions = async (empId: string, perms: any) => {
    if (!assertWriteAllowed()) return;
    const emp = employees.find(e => e.id === empId);
    if (!emp) return;
    const updated = employees.map(e => e.id === empId ? { ...e, permissions: perms } : e);
    setEmployees(updated);
    await saveTenantDocument(activeCompanyId, 'staff', { ...emp, permissions: perms });
  };

  const handleUpdateEmployeeCard = async (empId: string, cardId: string, expiryDate: string) => {
    if (!assertWriteAllowed()) return;
    const emp = employees.find(e => e.id === empId);
    if (!emp) return;
    const updated = { ...emp, cardId, cardExpiry: expiryDate };
    setEmployees(employees.map(e => e.id === empId ? updated : e));
    await saveTenantDocument(activeCompanyId, 'staff', updated);
  };

  const handleClockIn = async (loc: 'office' | 'remote' | 'field' = 'office') => {
    if (!assertWriteAllowed()) return;
    const todayStr = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const newRecord: AttendanceRecord = {
      id: `ATT-${Date.now()}`,
      employeeId: currentAppUser.id,
      employeeName: currentAppUser.name,
      employeeNo: employees.find(e => e.id === currentAppUser.id)?.employeeNo || 'KD-001',
      department: currentAppUser.department as any,
      date: todayStr,
      clockInTime: nowTime,
      status: 'present',
      workLocation: loc,
      verificationMethod: 'web',
      notes: 'Amesaini kwenye dashibodi',
    };

    const updated = [newRecord, ...attendance.filter(a => !(a.employeeId === currentAppUser.id && a.date === todayStr))];
    setAttendance(updated);
    await saveTenantDocument(activeCompanyId, 'attendance', newRecord);
  };

  const handleClockOut = async () => {
    if (!assertWriteAllowed()) return;
    const todayStr = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const existing = attendance.find(a => a.employeeId === currentAppUser.id && a.date === todayStr);
    if (!existing) return;

    const updatedRec: AttendanceRecord = {
      ...existing,
      clockOutTime: nowTime,
      totalHours: 8.5,
    };
    const updated = attendance.map(a => a.id === existing.id ? updatedRec : a);
    setAttendance(updated);
    await saveTenantDocument(activeCompanyId, 'attendance', updatedRec);
  };

  const handleRecordBiometricAttendance = (empId: string, type: 'clock_in' | 'clock_out', method: string, credentialVal?: string) => {
    if (!assertWriteAllowed()) return { success: false, message: 'Read-only mode' };
    const emp = employees.find(e => e.id === empId);
    if (!emp) return { success: false, message: 'Mfanyakazi hajapatikana.' };

    const todayStr = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (type === 'clock_in') {
      const newRec: AttendanceRecord = {
        id: `ATT-${Date.now()}`,
        employeeId: emp.id,
        employeeName: emp.fullName,
        employeeNo: emp.employeeNo,
        department: emp.department as any,
        date: todayStr,
        clockInTime: nowTime,
        status: 'present',
        workLocation: 'office',
        verificationMethod: method as any,
        notes: `Kuingia: ${method} (${credentialVal || emp.cardId})`,
      };
      setAttendance([newRec, ...attendance]);
      saveTenantDocument(activeCompanyId, 'attendance', newRec);
      return { success: true, message: `Karibu kazini ${emp.fullName}! Umeshasaini kuingia.` };
    } else {
      const existing = attendance.find(a => a.employeeId === emp.id && a.date === todayStr);
      if (existing) {
        const updated = { ...existing, clockOutTime: nowTime, totalHours: 8.5 };
        setAttendance(attendance.map(a => a.id === existing.id ? updated : a));
        saveTenantDocument(activeCompanyId, 'attendance', updated);
      }
      return { success: true, message: `Kwaheri ${emp.fullName}! Umeshasaini kutoka.` };
    }
  };

  const handleApplyLeave = async (req: Omit<LeaveRequest, 'id' | 'appliedAt' | 'status'>) => {
    if (!assertWriteAllowed()) return;
    const leave: LeaveRequest = {
      ...req,
      id: `LEV-${Date.now()}`,
      appliedAt: new Date().toISOString(),
      status: 'pending',
    };
    setLeaveRequests([leave, ...leaveRequests]);
    await saveTenantDocument(activeCompanyId, 'leaveRequests', leave);
  };

  const handleReviewLeave = async (leaveId: string, status: 'approved' | 'rejected') => {
    if (!assertWriteAllowed()) return;
    const target = leaveRequests.find(l => l.id === leaveId);
    if (!target) return;
    const updated = { ...target, status, approvedBy: currentAppUser.name };
    setLeaveRequests(leaveRequests.map(l => l.id === leaveId ? updated : l));
    await saveTenantDocument(activeCompanyId, 'leaveRequests', updated);
  };

  const handleAddTask = async (t: Omit<OfficeTask, 'id' | 'createdAt'>) => {
    if (!assertWriteAllowed()) return;
    const newTask: OfficeTask = {
      ...t,
      id: `TSK-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setTasks([newTask, ...tasks]);
    await saveTenantDocument(activeCompanyId, 'tasks', newTask);
  };

  const handleUpdateTaskStatus = async (taskId: string, status: any) => {
    if (!assertWriteAllowed()) return;
    const target = tasks.find(t => t.id === taskId);
    if (!target) return;
    const updated = { ...target, status };
    setTasks(tasks.map(t => t.id === taskId ? updated : t));
    await saveTenantDocument(activeCompanyId, 'tasks', updated);
  };

  const handleSaveQuotations = async (newQuotes: Quotation[]) => {
    if (!assertWriteAllowed()) return;
    setQuotations(newQuotes);
    for (const q of newQuotes) {
      await saveTenantDocument(activeCompanyId, 'quotations', q);
    }
  };

  const handleSaveInvoices = async (newInvoices: Invoice[]) => {
    if (!assertWriteAllowed()) return;
    // Check quota for new invoices
    if (newInvoices.length > invoices.length) {
      try {
        await assertInvoiceQuota(activeCompanyId, activePlan, invoices.length);
      } catch (e: any) {
        alert(e.message);
        return;
      }
    }
    setInvoices(newInvoices);
    for (const inv of newInvoices) {
      await saveTenantDocument(activeCompanyId, 'invoices', inv);
    }
  };

  const handleSaveClients = async (newClients: Client[]) => {
    if (!assertWriteAllowed()) return;
    setClients(newClients);
    for (const c of newClients) {
      await saveTenantDocument(activeCompanyId, 'clients', c);
    }
  };

  const handleSaveCatalogueItems = async (newItems: CatalogueItem[]) => {
    if (!assertWriteAllowed()) return;
    setCatalogueItems(newItems);
    for (const item of newItems) {
      await saveTenantDocument(activeCompanyId, 'catalogue', item);
    }
  };

  const handleSaveBillingProfile = async (newProf: CompanyBillingProfile) => {
    if (!assertWriteAllowed()) return;
    setBillingProfile(newProf);
    await saveTenantDocument(activeCompanyId, 'settings', { ...newProf, id: 'profile' });
  };

  const handleAddVoucher = async (v: Omit<PettyCashVoucher, 'id'>) => {
    if (!assertWriteAllowed()) return;
    const voucher: PettyCashVoucher = {
      ...v,
      id: `VOU-${Date.now()}`,
    };
    setPettyCash([voucher, ...pettyCash]);
    await saveTenantDocument(activeCompanyId, 'pettyCash', voucher);
  };

  // Deduct Inventory Stock on Invoice Creation
  const handleDeductInventoryStock = async (itemId: string, quantity: number, invoiceRef: string) => {
    if (!assertWriteAllowed()) return;
    const item = consumables.find(c => c.id === itemId);
    if (!item) return;

    const prevQty = item.quantityInStock;
    const newQty = Math.max(0, prevQty - quantity);
    const updatedItem = { ...item, quantityInStock: newQty };
    setConsumables(consumables.map(c => c.id === itemId ? updatedItem : c));
    await saveTenantDocument(activeCompanyId, 'inventory', updatedItem);

    const newTrx: InventoryTransaction = {
      id: `INV-TRX-${Date.now()}`,
      itemId,
      itemName: item.name,
      type: 'stock_out',
      quantity,
      previousStock: prevQty,
      newStock: newQty,
      referenceNo: invoiceRef,
      recipientOrSupplier: 'Mteja wa Ankara',
      department: 'Masoko & Mauzo',
      issuedBy: currentAppUser.name,
      date: new Date().toISOString().split('T')[0],
      notes: `Upunguzaji wa bidhaa kwa ankara ${invoiceRef}`,
    };
    setInventoryTransactions([newTrx, ...inventoryTransactions]);
    await saveTenantDocument(activeCompanyId, 'inventoryTransactions', newTrx);
  };

  // -------------------------------------------------------------------------
  // RENDER GATES
  // -------------------------------------------------------------------------

  // 1. Owner Login Entrance (/owner-login route)
  if (currentRoute === 'owner' && (!isAuthenticated || currentUserAccount.role !== 'superadmin')) {
    return (
      <OwnerLoginView
        onSuccessLogin={() => {
          handleTestSwitch('superadmin');
        }}
        onSwitchToCustomer={() => {
          setCurrentRoute('customer');
          if (typeof window !== 'undefined' && window.history?.pushState) {
            window.history.pushState({}, '', '/');
          }
        }}
      />
    );
  }

  // 2. Customer Registration & KYC Wizard
  if (isRegisterWizardOpen) {
    return (
      <CustomerKYCWizard
        plans={DEFAULT_PLANS}
        settings={platformSettings}
        lang={lang}
        onToggleLang={() => setLang(lang === 'sw' ? 'en' : 'sw')}
        onSubmitted={async (applicationId: string) => {
          setIsRegisterWizardOpen(false);
          if (currentUserAccount?.uid) {
            const app = await getKYCApplicationByUserId(currentUserAccount.uid);
            setCurrentKYCApplication(app);
          }
          setIsAuthenticated(true);
        }}
        onCancel={() => setIsRegisterWizardOpen(false)}
      />
    );
  }

  // 3. Customer Unauthenticated -> Show Customer Login Screen
  if (!isAuthenticated) {
    return (
      <LoginView
        onSuccessLogin={async (userEmail) => {
          setIsAuthenticated(true);
          if (userEmail === PLATFORM_OWNER_EMAIL) {
            handleTestSwitch('superadmin');
          } else {
            // Find user's company and load it
            if (currentUserAccount?.companyId && currentUserAccount.companyId !== 'pending_kyc') {
              await loadCompanyData(currentUserAccount.companyId);
            }
          }
        }}
        onOpenRegisterWizard={() => setIsRegisterWizardOpen(true)}
        settings={platformSettings}
      />
    );
  }

  // 4. KYC Status Gate: If user has a pending, submitted, draft, or rejected KYC application and not superadmin
  if (
    currentKYCApplication &&
    currentKYCApplication.status !== 'approved' &&
    currentUserAccount.role !== 'superadmin' &&
    !isReadOnlyMode
  ) {
    return (
      <CustomerKYCStatusView
        application={currentKYCApplication}
        lang={lang}
        onToggleLang={() => setLang(lang === 'sw' ? 'en' : 'sw')}
        onResumeDraft={() => setIsRegisterWizardOpen(true)}
        onRefreshStatus={async () => {
          if (currentUserAccount?.uid) {
            const app = await getKYCApplicationByUserId(currentUserAccount.uid);
            setCurrentKYCApplication(app);
          }
        }}
        onEnterWorkspace={() => {
          if (currentKYCApplication.assignedCompanyId) {
            loadCompanyData(currentKYCApplication.assignedCompanyId);
          }
        }}
        onLogout={handleLogout}
      />
    );
  }

  // 5. Suspended Company Screen Block
  if (currentCompany && currentCompany.status === 'suspended' && currentUserAccount.role !== 'superadmin' && !isReadOnlyMode) {
    return (
      <SuspendedCompanyBanner
        company={currentCompany}
        settings={platformSettings}
        onLogout={handleLogout}
      />
    );
  }

  // 6. Force Password Change Modal (First login)
  if (currentUserAccount.mustChangePassword) {
    return (
      <ForcePasswordChangeModal
        isOpen={true}
        onSuccess={() => {
          setCurrentUserAccount({ ...currentUserAccount, mustChangePassword: false });
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      
      {/* Session Inactivity Timeout Watcher */}
      <SessionTimeoutWatcher onLogout={handleLogout} />

      {/* Top Navbar with Multi-Tenant SaaS Indicators */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        lang={lang}
        setLang={setLang}
        currency={currency}
        setCurrency={setCurrency}
        theme={theme}
        toggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        currentUser={currentAppUser}
        setCurrentUser={() => {}}
        employees={employees}
        attendance={attendance}
        onClockIn={() => handleClockIn('office')}
        onClockOut={handleClockOut}
        onOpenKiosk={() => setIsKioskOpen(true)}
        onNewEmployeeModal={() => {
          setCurrentTab('employees');
          setIsAddEmployeeModalOpen(true);
        }}
        currentCompany={currentCompany}
        isSuperAdmin={currentUserAccount.role === 'superadmin'}
        isReadOnlyMode={isReadOnlyMode}
        onExitReadOnlyMode={handleExitReadOnlyView}
        onLogout={handleLogout}
        onOpenTestSuite={() => setIsTestSuiteOpen(true)}
        enabledModules={activePlan?.enabledModules || []}
        onOpenDataSafety={() => setIsDataSafetyOpen(true)}
        onOpenSetupWizard={() => setIsSetupWizardOpen(true)}
        onOpenTerms={() => {
          setTermsModalTab('terms');
          setIsTermsModalOpen(true);
        }}
        platformName={platformSettings.platformName}
        platformLogoUrl={platformSettings.platformLogoUrl}
      />

      {/* Main Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Module Gating Barrier: If module is not included in current company's plan */}
        {currentUserAccount.role !== 'superadmin' &&
         currentTab !== 'dashboard' &&
         currentTab !== 'subscription' &&
         currentTab !== 'superadmin' &&
         activePlan?.enabledModules &&
         activePlan.enabledModules.length > 0 &&
         !activePlan.enabledModules.includes(currentTab) ? (
          <div className="min-h-[420px] flex items-center justify-center p-6">
            <div className="max-w-xl w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 sm:p-8 text-center space-y-5">
              <div className="w-16 h-16 rounded-3xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
                <Lock className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full inline-block">
                  {lang === 'sw' ? 'KaziDesk Module Gating · Boresha Mpango' : 'KaziDesk Module Gating · Upgrade Plan'}
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  {lang === 'sw' ? 'Moduli Hii Haipatikani Kwenye Mpango Wako wa Sasa' : 'This Module is Not Included in Your Current Plan'}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                  {lang === 'sw' 
                    ? <>Mpango wako wa sasa (<strong className="text-slate-900 dark:text-white">{activePlan?.name || 'KaziDesk'}</strong>) haujumuishi sehemu hii. Boresha mpango wako wa usajili ili kuwezesha moduli hii na kufungua huduma zote za ofisi yako kidijitali.</>
                    : <>Your current tier (<strong className="text-slate-900 dark:text-white">{activePlan?.name || 'KaziDesk'}</strong>) does not include this module. Upgrade your subscription plan to unlock full office automation features.</>}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentTab('subscription')}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all active:scale-95"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{lang === 'sw' ? 'Angalia Mipango & Boresha Usajili' : 'View Plans & Upgrade Subscription'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentTab('dashboard')}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-all"
                >
                  {lang === 'sw' ? 'Rudi Dashibodi' : 'Back to Dashboard'}
                </button>
              </div>

              {/* Direct Support Contact for Plan Upgrades */}
              {(() => {
                const supportPhone = platformSettings?.supportWhatsApp || platformSettings?.ownerPhone || '+255775740386';
                const cleanWhatsApp = supportPhone.replace(/[^0-9]/g, '');
                const supportEmail = platformSettings?.supportEmail || platformSettings?.ownerEmail || 'support.zynettechtz@gmail.com';

                return (
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-center gap-2.5 text-xs text-slate-500">
                    <span className="font-medium">{lang === 'sw' ? 'Msaada wa Kuboresha:' : 'Upgrade Assistance:'}</span>
                    <a
                      href={`https://wa.me/${cleanWhatsApp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold rounded-xl border border-emerald-500/30 transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp: {supportPhone.split('/')[0].trim()}</span>
                    </a>
                    <a
                      href={`mailto:${supportEmail}?subject=${encodeURIComponent(lang === 'sw' ? `Ombi la Kuboresha Mpango - ${currentCompany?.name || 'Kampuni'}` : `Plan Upgrade Request - ${currentCompany?.name || 'Company'}`)}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>{supportEmail}</span>
                    </a>
                  </div>
                );
              })()}
            </div>
          </div>
        ) : (
          <>
            {/* SUPER ADMIN PORTAL (Visible to Super Admin) */}
            {currentTab === 'superadmin' && (
              <TabErrorBoundary tabName="Super Admin Portal" onNavigateHome={() => setCurrentTab('dashboard')}>
                <SuperAdminPortal
                  lang={lang}
                  currency={currency}
                  onEnterReadOnlyCompanyView={handleEnterReadOnlyView}
                />
              </TabErrorBoundary>
            )}

            {/* TENANT SUBSCRIPTION PAGE (Visible to Company Admin) */}
            {currentTab === 'subscription' && (
              <TabErrorBoundary tabName="Usajili (Subscription)" onNavigateHome={() => setCurrentTab('dashboard')}>
                <CompanySubscriptionView
                  company={currentCompany}
                  settings={platformSettings}
                  lang={lang}
                  currency={currency}
                  employees={employees}
                  invoices={invoices}
                  onNavigateTab={setCurrentTab}
                />
              </TabErrorBoundary>
            )}

            {/* DASHBOARD */}
            {currentTab === 'dashboard' && (
              <TabErrorBoundary tabName="Dashibodi (Dashboard)" onNavigateHome={() => setCurrentTab('dashboard')}>
                <DashboardView
                  lang={lang}
                  currency={currency}
                  currentUser={currentAppUser}
                  employees={employees}
                  attendance={attendance}
                  tasks={tasks}
                  approvals={approvals}
                  assets={assets}
                  consumables={consumables}
                  payroll={payroll}
                  pettyCash={pettyCash}
                  quotations={quotations}
                  invoices={invoices}
                  salesReports={salesReports}
                  onNavigate={setCurrentTab}
                  onOpenKiosk={() => setIsKioskOpen(true)}
                  onClockIn={() => handleClockIn('office')}
                  onNewTaskModal={() => setCurrentTab('tasks')}
                  onNewDocModal={() => setCurrentTab('documents')}
                  onNewApprovalModal={() => setCurrentTab('documents')}
                  onNewEmployeeModal={() => {
                    setCurrentTab('employees');
                    setIsAddEmployeeModalOpen(true);
                  }}
                />
              </TabErrorBoundary>
            )}

            {/* ATTENDANCE */}
            {currentTab === 'attendance' && (
              <TabErrorBoundary tabName="Mahudhurio & Likizo" onNavigateHome={() => setCurrentTab('dashboard')}>
                <AttendanceView
                  lang={lang}
                  currentUser={currentAppUser}
                  employees={employees}
                  attendance={attendance}
                  leaveRequests={leaveRequests}
                  onClockInSubmit={handleClockIn}
                  onClockOutSubmit={handleClockOut}
                  onApplyLeave={handleApplyLeave}
                  onReviewLeave={handleReviewLeave}
                  onOpenKiosk={() => setIsKioskOpen(true)}
                />
              </TabErrorBoundary>
            )}

            {/* EMPLOYEES */}
            {currentTab === 'employees' && (
              <TabErrorBoundary tabName="Wafanyakazi (Staff Directory)" onNavigateHome={() => setCurrentTab('dashboard')}>
                <EmployeesView
                  lang={lang}
                  currency={currency}
                  employees={employees}
                  assets={assets}
                  attendance={attendance}
                  onAddEmployee={handleAddEmployee}
                  onUpdateEmployee={handleUpdateEmployee}
                  isExternalAddModalOpen={isAddEmployeeModalOpen}
                  onCloseExternalAddModal={() => setIsAddEmployeeModalOpen(false)}
                  currentUserName={currentAppUser.name}
                  currentUserRole={currentAppUser.title}
                />
              </TabErrorBoundary>
            )}

            {/* TASKS */}
            {currentTab === 'tasks' && (
              <TabErrorBoundary tabName="Majukumu & Workflow" onNavigateHome={() => setCurrentTab('dashboard')}>
                <TasksView
                  lang={lang}
                  currentUser={currentAppUser}
                  employees={employees}
                  tasks={tasks}
                  onAddTask={handleAddTask}
                  onUpdateTaskStatus={handleUpdateTaskStatus}
                  onToggleChecklistItem={() => {}}
                  onUpdateTaskProgress={() => {}}
                  dailyLogs={dailyLogs}
                  onSubmitDailyLog={log => {
                    const newLog: DailyWorkLog = {
                      ...log,
                      id: `LOG-${Date.now()}`,
                      submittedAt: new Date().toISOString(),
                    };
                    setDailyLogs([newLog, ...dailyLogs]);
                    saveTenantDocument(activeCompanyId, 'dailyLogs', newLog);
                  }}
                />
              </TabErrorBoundary>
            )}

            {/* QUOTATIONS & INVOICES */}
            {currentTab === 'quotations' && (
              <TabErrorBoundary tabName="Nukuu & Ankara (Quotations & Invoices)" onNavigateHome={() => setCurrentTab('dashboard')}>
                <QuotationsInvoicesView
                  lang={lang}
                  currency={currency}
                  currentUser={currentAppUser}
                  clients={clients}
                  catalogueItems={catalogueItems}
                  quotations={quotations}
                  invoices={invoices}
                  profile={billingProfile || INITIAL_BILLING_PROFILE}
                  billingProfile={billingProfile || INITIAL_BILLING_PROFILE}
                  consumables={consumables}
                  onSaveClients={handleSaveClients}
                  onSaveCatalogueItems={handleSaveCatalogueItems}
                  onSaveQuotations={handleSaveQuotations}
                  onSaveInvoices={handleSaveInvoices}
                  onSaveProfile={handleSaveBillingProfile}
                  onDeductStock={handleDeductInventoryStock}
                />
              </TabErrorBoundary>
            )}

            {/* ASSETS & INVENTORY */}
            {currentTab === 'assets' && (
              <TabErrorBoundary tabName="Vifaa & Stoo (Inventory)" onNavigateHome={() => setCurrentTab('dashboard')}>
                <AssetsView
                  lang={lang}
                  currency={currency}
                  currentUser={currentAppUser}
                  employees={employees}
                  assets={assets}
                  consumables={consumables}
                  inventoryTransactions={inventoryTransactions}
                  onAddAsset={a => {
                    const newAsset: OfficeAsset = { ...a, id: `AST-${Date.now()}` };
                    setAssets([newAsset, ...assets]);
                    saveTenantDocument(activeCompanyId, 'assets', newAsset);
                  }}
                  onUpdateAssetStatus={() => {}}
                  onAdjustConsumable={() => {}}
                  onAddConsumable={c => {
                    const newConsumable: ConsumableItem = { ...c, id: `CNS-${Date.now()}` };
                    setConsumables([newConsumable, ...consumables]);
                    saveTenantDocument(activeCompanyId, 'inventory', newConsumable);
                  }}
                  onAddInventoryTransaction={t => {
                    const newTrx: InventoryTransaction = { ...t, id: `INV-TRX-${Date.now()}` };
                    setInventoryTransactions([newTrx, ...inventoryTransactions]);
                    saveTenantDocument(activeCompanyId, 'inventoryTransactions', newTrx);
                  }}
                />
              </TabErrorBoundary>
            )}

            {/* PAYROLL */}
            {currentTab === 'payroll' && (
              <TabErrorBoundary tabName="Payroll & Mishahara" onNavigateHome={() => setCurrentTab('dashboard')}>
                <PayrollView
                  lang={lang}
                  currency={currency}
                  payroll={payroll}
                  employees={employees}
                  onDisburseAll={() => {}}
                  onGenerateNewMonth={() => {}}
                />
              </TabErrorBoundary>
            )}

            {/* SALES & MARKETING */}
            {currentTab === 'sales' && (
              <TabErrorBoundary tabName="Masoko & Mauzo CRM" onNavigateHome={() => setCurrentTab('dashboard')}>
                <SalesMarketingView
                  lang={lang}
                  currency={currency}
                  leads={salesLeads}
                  kpis={salesKPIs}
                  reports={salesReports}
                  employees={employees}
                  onAddLead={l => {
                    const newLead: SalesLead = { ...l, id: `LEAD-${Date.now()}` };
                    setSalesLeads([newLead, ...salesLeads]);
                    saveTenantDocument(activeCompanyId, 'leads', newLead);
                  }}
                  onUpdateLeadStatus={() => {}}
                  onAddKPI={k => {
                    const newKPI: SalesKPI = { ...k, id: `KPI-${Date.now()}` };
                    setSalesKPIs([newKPI, ...salesKPIs]);
                    saveTenantDocument(activeCompanyId, 'kpis', newKPI);
                  }}
                  onAddReport={r => {
                    const newReport: SalesReport = { ...r, id: `REP-${Date.now()}` };
                    setSalesReports([newReport, ...salesReports]);
                    saveTenantDocument(activeCompanyId, 'reports', newReport);
                  }}
                  onReviewReport={() => {}}
                />
              </TabErrorBoundary>
            )}

            {/* ANNOUNCEMENTS */}
            {currentTab === 'announcements' && (
              <TabErrorBoundary tabName="Matangazo ya Kampuni" onNavigateHome={() => setCurrentTab('dashboard')}>
                <AnnouncementsView
                  lang={lang}
                  announcements={announcements}
                  currentUserId={currentAppUser.id}
                  onAddAnnouncement={a => {
                    const newAnn: CompanyAnnouncement = { ...a, id: `ANN-${Date.now()}` };
                    setAnnouncements([newAnn, ...announcements]);
                    saveTenantDocument(activeCompanyId, 'announcements', newAnn);
                  }}
                  onAcknowledge={() => {}}
                  isSuperAdmin={currentUserAccount.role === 'admin' || currentUserAccount.role === 'superadmin'}
                />
              </TabErrorBoundary>
            )}

            {/* LIVE MEETINGS (Mikutano & Video) */}
            {currentTab === 'meetings' && (
              <TabErrorBoundary tabName="Mikutano & Video Live" onNavigateHome={() => setCurrentTab('dashboard')}>
                <LiveMeetingsView
                  companyId={activeCompanyId}
                  lang={lang}
                  currentUser={{
                    id: currentAppUser.id,
                    name: currentAppUser.name,
                    email: currentAppUser.email,
                    role: currentAppUser.role,
                  }}
                  employees={employees}
                  canManageMeetings={currentUserAccount.isCompanyAdmin || currentAppUser.role === 'admin' || currentAppUser.role === 'hr'}
                  onAddTask={handleAddTask}
                  onNavigateTab={setCurrentTab}
                />
              </TabErrorBoundary>
            )}

            {/* DOCUMENTS */}
            {currentTab === 'documents' && (
              <TabErrorBoundary tabName="Nyaraka & Idhini (Documents & Approvals)" onNavigateHome={() => setCurrentTab('dashboard')}>
                <DocumentsView
                  lang={lang}
                  currency={currency}
                  currentUser={currentAppUser}
                  employees={employees}
                  documents={documents}
                  approvals={approvals}
                  onAddDocument={d => {
                    const newDoc: OfficeDocument = { ...d, id: `DOC-${Date.now()}` };
                    setDocuments([newDoc, ...documents]);
                    saveTenantDocument(activeCompanyId, 'documents', newDoc);
                  }}
                  onAddApproval={a => {
                    const newApp: ApprovalRequest = {
                      ...a,
                      id: `APR-${Date.now()}`,
                      status: 'pending',
                      createdAt: new Date().toISOString(),
                    };
                    setApprovals([newApp, ...approvals]);
                    saveTenantDocument(activeCompanyId, 'approvals', newApp);
                  }}
                  onReviewApproval={() => {}}
                />
              </TabErrorBoundary>
            )}

            {/* SMART CARDS */}
            {currentTab === 'cards' && (
              <TabErrorBoundary tabName="Vitambulisho vya Kidijitali (Smart ID Cards)" onNavigateHome={() => setCurrentTab('dashboard')}>
                <CardGeneratorView
                  lang={lang}
                  employees={employees}
                  onUpdateEmployeeCard={handleUpdateEmployeeCard}
                  onTestCardInKiosk={() => setIsKioskOpen(true)}
                />
              </TabErrorBoundary>
            )}

            {/* ACCESS CONTROL & PERMISSIONS (Ruhusa & Mipaka) */}
            {currentTab === 'permissions' && (
              <TabErrorBoundary tabName="Ruhusa & Mipaka (Access Control)" onNavigateHome={() => setCurrentTab('dashboard')}>
                <GranularAccessControlView
                  companyId={activeCompanyId}
                  lang={lang}
                  currentUser={{
                    id: currentAppUser.id,
                    name: currentAppUser.name,
                    email: currentAppUser.email,
                    role: currentAppUser.role,
                  }}
                  employees={employees}
                  onUpdateEmployeeRole={(empId, newRoleId, newRoleTitle) => {
                    setEmployees(employees.map(e => e.id === empId ? { ...e, systemRole: newRoleId as any, roleTitle: newRoleTitle } : e));
                  }}
                  onToggleAccountStatus={(empId, newStatus) => {
                    setEmployees(employees.map(e => e.id === empId ? { ...e, accountStatus: newStatus } : e));
                  }}
                />
              </TabErrorBoundary>
            )}

            {/* PETTY CASH */}
            {currentTab === 'pettyCash' && (
              <TabErrorBoundary tabName="Petty Cash" onNavigateHome={() => setCurrentTab('dashboard')}>
                <PettyCashView
                  lang={lang}
                  currency={currency}
                  currentUser={currentAppUser}
                  vouchers={pettyCash}
                  onAddVoucher={handleAddVoucher}
                />
              </TabErrorBoundary>
            )}

            {/* MANAGEMENT & EXECUTIVE REPORTS (Ripoti za Uongozi) */}
            {currentTab === 'reports' && (
              <TabErrorBoundary tabName="Ripoti za Uongozi" onNavigateHome={() => setCurrentTab('dashboard')}>
                <ComprehensiveReportsView
                  lang={lang}
                  currency={currency}
                  tasks={tasks}
                  attendance={attendance}
                  pettyCash={pettyCash}
                  employees={employees}
                  payroll={payroll}
                  invoices={invoices}
                  quotations={quotations}
                  leads={salesLeads}
                  consumables={consumables}
                  assets={assets}
                  meetings={[]}
                  canViewReports={true}
                />
              </TabErrorBoundary>
            )}

            {/* HELP & GUIDE (Mwongozo & Msaada) */}
            {currentTab === 'help' && (
              <TabErrorBoundary tabName="Mwongozo & Msaada wa KaziDesk" onNavigateHome={() => setCurrentTab('dashboard')}>
                <ComprehensiveHelpGuideView
                  companyId={activeCompanyId}
                  companyName={currentCompany?.name || 'KaziDesk Workspace'}
                  lang={lang}
                  currentUser={{
                    id: currentAppUser.id,
                    name: currentAppUser.name,
                    email: currentAppUser.email,
                    role: currentAppUser.role,
                  }}
                  settings={platformSettings}
                  onNavigateTab={setCurrentTab}
                />
              </TabErrorBoundary>
            )}
          </>
        )}

      </main>

      {/* Biometric Kiosk Modal */}
      <BiometricKioskModal
        isOpen={isKioskOpen}
        onClose={() => setIsKioskOpen(false)}
        employees={employees}
        attendance={attendance}
        onRecordAttendance={handleRecordBiometricAttendance}
      />

      {/* SaaS Multi-Tenant Verification & Security Suite Modal */}
      <SaaSTestSuiteModal
        isOpen={isTestSuiteOpen}
        onClose={() => setIsTestSuiteOpen(false)}
      />

      {/* First-Login Setup Wizard for Company Admin */}
      {currentCompany && (
        <FirstLoginSetupWizard
          isOpen={isSetupWizardOpen}
          onClose={() => setIsSetupWizardOpen(false)}
          company={currentCompany}
          billingProfile={billingProfile}
          lang={lang}
          onComplete={(updatedCompany, updatedProfile, firstStaff) => {
            setCurrentCompany(updatedCompany);
            setBillingProfile(updatedProfile);
            if (firstStaff) {
              setEmployees(prev => [firstStaff, ...prev.filter(e => e.id !== firstStaff.id)]);
            }
            setIsSetupWizardOpen(false);
          }}
        />
      )}

      {/* Per-Company Data Safety, Backup, Restore & Deletion Modal */}
      {currentCompany && (
        <CompanyDataSafetyModal
          isOpen={isDataSafetyOpen}
          onClose={() => setIsDataSafetyOpen(false)}
          company={currentCompany}
          onDataRestored={() => {
            loadCompanyData(activeCompanyId);
          }}
          onCompanyDeleted={() => {
            handleLogout();
          }}
        />
      )}

      {/* Platform Terms of Service & Privacy Policy Modal */}
      <TermsPrivacyModal
        isOpen={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
        settings={platformSettings}
        initialTab={termsModalTab}
      />

      {/* Clean Multi-Tenant Footer */}
      <footer className="no-print border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900 py-6 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-900 dark:text-white">{platformSettings.platformName || 'KaziDesk'}</span>
            <span>·</span>
            <span>{currentCompany?.name || 'SaaS Platform'}</span>
            <span>·</span>
            <span className="text-[11px] font-mono">Tenant ID: {activeCompanyId}</span>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => setIsDataSafetyOpen(true)}
              className="hover:text-emerald-600 transition-colors flex items-center gap-1 font-medium"
              title="Pakua backup au rejesha data za kampuni hii"
            >
              <DownloadCloud className="w-3.5 h-3.5" />
              <span>Usalama & Backup ya Data</span>
            </button>
            <button
              onClick={() => {
                setTermsModalTab('terms');
                setIsTermsModalOpen(true);
              }}
              className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              Vigezo & Faragha
            </button>
            <button
              onClick={() => setCurrentTab('help')}
              className="hover:text-emerald-600 transition-colors text-emerald-600 dark:text-emerald-400 font-semibold"
            >
              Mwongozo & Msaada
            </button>
            <button
              onClick={() => setIsTestSuiteOpen(true)}
              className="hover:text-blue-600 transition-colors flex items-center gap-1 font-medium text-blue-600 dark:text-blue-400"
              title="Fanya ukaguzi wa majaribio ya kiusalama ya SaaS"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>SaaS Security Tests</span>
            </button>
            <button
              onClick={handleLogout}
              className="hover:text-rose-600 transition-colors flex items-center gap-1 font-medium text-rose-500"
              title="Toka kwenye akaunti hii"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Toka (Logout)</span>
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}
