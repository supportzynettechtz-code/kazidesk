import {
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
  OfficeSettings,
  CurrentUser,
  CompanyAnnouncement,
  SalesLead,
  SalesKPI,
  SalesReport,
  InventoryTransaction,
  MeetingRoom,
  Client,
  CatalogueItem,
  Quotation,
  Invoice,
  CompanyBillingProfile
} from '../types/office';

import {
  INITIAL_SETTINGS,
  INITIAL_CURRENT_USER,
  INITIAL_EMPLOYEES,
  INITIAL_ATTENDANCE,
  INITIAL_LEAVE_REQUESTS,
  INITIAL_TASKS,
  INITIAL_DOCUMENTS,
  INITIAL_APPROVALS,
  INITIAL_PAYROLL,
  INITIAL_ASSETS,
  INITIAL_CONSUMABLES,
  INITIAL_PETTY_CASH,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_SALES_LEADS,
  INITIAL_SALES_KPIS,
  INITIAL_SALES_REPORTS,
  INITIAL_INVENTORY_TRANSACTIONS,
  INITIAL_MEETING_ROOM,
  INITIAL_BILLING_PROFILE,
  INITIAL_CLIENTS,
  INITIAL_CATALOGUE_ITEMS,
  INITIAL_QUOTATIONS,
  INITIAL_INVOICES
} from '../data/initialData';

const STORAGE_KEYS = {
  SETTINGS: 'kazidesk_settings_v1',
  CURRENT_USER: 'kazidesk_current_user_v1',
  EMPLOYEES: 'kazidesk_employees_v1',
  ATTENDANCE: 'kazidesk_attendance_v1',
  LEAVE: 'kazidesk_leave_v1',
  TASKS: 'kazidesk_tasks_v1',
  DOCUMENTS: 'kazidesk_docs_v1',
  APPROVALS: 'kazidesk_approvals_v1',
  PAYROLL: 'kazidesk_payroll_v1',
  ASSETS: 'kazidesk_assets_v1',
  CONSUMABLES: 'kazidesk_consumables_v1',
  PETTY_CASH: 'kazidesk_petty_cash_v1',
  ANNOUNCEMENTS: 'kazidesk_announcements_v1',
  SALES_LEADS: 'kazidesk_sales_leads_v1',
  SALES_KPIS: 'kazidesk_sales_kpis_v1',
  SALES_REPORTS: 'kazidesk_sales_reports_v1',
  INVENTORY_TRANSACTIONS: 'kazidesk_inv_trx_v1',
  MEETING_ROOM: 'kazidesk_meeting_room_v1',
  BILLING_PROFILE: 'kazidesk_billing_profile_v1',
  CLIENTS: 'kazidesk_clients_v1',
  CATALOGUE_ITEMS: 'kazidesk_catalogue_items_v1',
  QUOTATIONS: 'kazidesk_quotations_v1',
  INVOICES: 'kazidesk_invoices_v1',
  LANGUAGE: 'kazidesk_lang_v1',
  THEME: 'kazidesk_theme_v1',
};

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function safeSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Failed to save to localStorage key ${key}`, e);
  }
}

export const OfficeStore = {
  getSettings: (): OfficeSettings => safeGet(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS),
  saveSettings: (val: OfficeSettings) => safeSet(STORAGE_KEYS.SETTINGS, val),

  getCurrentUser: (): CurrentUser => safeGet(STORAGE_KEYS.CURRENT_USER, INITIAL_CURRENT_USER),
  saveCurrentUser: (val: CurrentUser) => safeSet(STORAGE_KEYS.CURRENT_USER, val),

  getEmployees: (): Employee[] => safeGet(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES),
  saveEmployees: (val: Employee[]) => safeSet(STORAGE_KEYS.EMPLOYEES, val),

  getAttendance: (): AttendanceRecord[] => safeGet(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE),
  saveAttendance: (val: AttendanceRecord[]) => safeSet(STORAGE_KEYS.ATTENDANCE, val),

  getLeaveRequests: (): LeaveRequest[] => safeGet(STORAGE_KEYS.LEAVE, INITIAL_LEAVE_REQUESTS),
  saveLeaveRequests: (val: LeaveRequest[]) => safeSet(STORAGE_KEYS.LEAVE, val),

  getTasks: (): OfficeTask[] => safeGet(STORAGE_KEYS.TASKS, INITIAL_TASKS),
  saveTasks: (val: OfficeTask[]) => safeSet(STORAGE_KEYS.TASKS, val),

  getDocuments: (): OfficeDocument[] => safeGet(STORAGE_KEYS.DOCUMENTS, INITIAL_DOCUMENTS),
  saveDocuments: (val: OfficeDocument[]) => safeSet(STORAGE_KEYS.DOCUMENTS, val),

  getApprovals: (): ApprovalRequest[] => safeGet(STORAGE_KEYS.APPROVALS, INITIAL_APPROVALS),
  saveApprovals: (val: ApprovalRequest[]) => safeSet(STORAGE_KEYS.APPROVALS, val),

  getPayroll: (): PayrollRun => safeGet(STORAGE_KEYS.PAYROLL, INITIAL_PAYROLL),
  savePayroll: (val: PayrollRun) => safeSet(STORAGE_KEYS.PAYROLL, val),

  getAssets: (): OfficeAsset[] => safeGet(STORAGE_KEYS.ASSETS, INITIAL_ASSETS),
  saveAssets: (val: OfficeAsset[]) => safeSet(STORAGE_KEYS.ASSETS, val),

  getConsumables: (): ConsumableItem[] => safeGet(STORAGE_KEYS.CONSUMABLES, INITIAL_CONSUMABLES),
  saveConsumables: (val: ConsumableItem[]) => safeSet(STORAGE_KEYS.CONSUMABLES, val),

  getPettyCash: (): PettyCashVoucher[] => safeGet(STORAGE_KEYS.PETTY_CASH, INITIAL_PETTY_CASH),
  savePettyCash: (val: PettyCashVoucher[]) => safeSet(STORAGE_KEYS.PETTY_CASH, val),

  getAnnouncements: (): CompanyAnnouncement[] => safeGet(STORAGE_KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS),
  saveAnnouncements: (val: CompanyAnnouncement[]) => safeSet(STORAGE_KEYS.ANNOUNCEMENTS, val),

  getSalesLeads: (): SalesLead[] => safeGet(STORAGE_KEYS.SALES_LEADS, INITIAL_SALES_LEADS),
  saveSalesLeads: (val: SalesLead[]) => safeSet(STORAGE_KEYS.SALES_LEADS, val),

  getSalesKPIs: (): SalesKPI[] => safeGet(STORAGE_KEYS.SALES_KPIS, INITIAL_SALES_KPIS),
  saveSalesKPIs: (val: SalesKPI[]) => safeSet(STORAGE_KEYS.SALES_KPIS, val),

  getSalesReports: (): SalesReport[] => safeGet(STORAGE_KEYS.SALES_REPORTS, INITIAL_SALES_REPORTS),
  saveSalesReports: (val: SalesReport[]) => safeSet(STORAGE_KEYS.SALES_REPORTS, val),

  getInventoryTransactions: (): InventoryTransaction[] => safeGet(STORAGE_KEYS.INVENTORY_TRANSACTIONS, INITIAL_INVENTORY_TRANSACTIONS),
  saveInventoryTransactions: (val: InventoryTransaction[]) => safeSet(STORAGE_KEYS.INVENTORY_TRANSACTIONS, val),

  getMeetingRoom: (): MeetingRoom => safeGet(STORAGE_KEYS.MEETING_ROOM, INITIAL_MEETING_ROOM),
  saveMeetingRoom: (val: MeetingRoom) => safeSet(STORAGE_KEYS.MEETING_ROOM, val),

  // Billing & Accounting
  getBillingProfile: (): CompanyBillingProfile => safeGet(STORAGE_KEYS.BILLING_PROFILE, INITIAL_BILLING_PROFILE),
  saveBillingProfile: (val: CompanyBillingProfile) => safeSet(STORAGE_KEYS.BILLING_PROFILE, val),

  getClients: (): Client[] => safeGet(STORAGE_KEYS.CLIENTS, INITIAL_CLIENTS),
  saveClients: (val: Client[]) => safeSet(STORAGE_KEYS.CLIENTS, val),

  getCatalogueItems: (): CatalogueItem[] => safeGet(STORAGE_KEYS.CATALOGUE_ITEMS, INITIAL_CATALOGUE_ITEMS),
  saveCatalogueItems: (val: CatalogueItem[]) => safeSet(STORAGE_KEYS.CATALOGUE_ITEMS, val),

  getQuotations: (): Quotation[] => safeGet(STORAGE_KEYS.QUOTATIONS, INITIAL_QUOTATIONS),
  saveQuotations: (val: Quotation[]) => safeSet(STORAGE_KEYS.QUOTATIONS, val),

  getInvoices: (): Invoice[] => safeGet(STORAGE_KEYS.INVOICES, INITIAL_INVOICES),
  saveInvoices: (val: Invoice[]) => safeSet(STORAGE_KEYS.INVOICES, val),

  getLanguage: (): 'sw' | 'en' => {
    return (localStorage.getItem(STORAGE_KEYS.LANGUAGE) as 'sw' | 'en') || 'sw';
  },
  saveLanguage: (lang: 'sw' | 'en') => {
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
  },

  getTheme: (): 'light' | 'dark' => {
    return (localStorage.getItem(STORAGE_KEYS.THEME) as 'light' | 'dark') || 'light';
  },
  saveTheme: (theme: 'light' | 'dark') => {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  },

  resetAllData: () => {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  },

  exportFullBackup: () => {
    const data = {
      version: '2.5',
      system: 'KaziDesk Office Management System',
      exportedAt: new Date().toISOString(),
      settings: OfficeStore.getSettings(),
      billingProfile: OfficeStore.getBillingProfile(),
      clients: OfficeStore.getClients(),
      catalogueItems: OfficeStore.getCatalogueItems(),
      quotations: OfficeStore.getQuotations(),
      invoices: OfficeStore.getInvoices(),
      employees: OfficeStore.getEmployees(),
      attendance: OfficeStore.getAttendance(),
      leaveRequests: OfficeStore.getLeaveRequests(),
      tasks: OfficeStore.getTasks(),
      documents: OfficeStore.getDocuments(),
      approvals: OfficeStore.getApprovals(),
      payroll: OfficeStore.getPayroll(),
      assets: OfficeStore.getAssets(),
      consumables: OfficeStore.getConsumables(),
      pettyCash: OfficeStore.getPettyCash(),
      announcements: OfficeStore.getAnnouncements(),
      salesLeads: OfficeStore.getSalesLeads(),
      salesKPIs: OfficeStore.getSalesKPIs(),
      salesReports: OfficeStore.getSalesReports(),
      inventoryTransactions: OfficeStore.getInventoryTransactions(),
      meetingRoom: OfficeStore.getMeetingRoom(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kazidesk_full_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  },

  importFullBackup: (jsonContent: string): { success: boolean; message: string } => {
    try {
      const data = JSON.parse(jsonContent);
      if (!data || typeof data !== 'object') {
        return { success: false, message: 'Faili la chelezo (backup) halina muundo sahihi wa JSON.' };
      }

      if (data.settings) safeSet(STORAGE_KEYS.SETTINGS, data.settings);
      if (data.billingProfile) safeSet(STORAGE_KEYS.BILLING_PROFILE, data.billingProfile);
      if (Array.isArray(data.clients)) safeSet(STORAGE_KEYS.CLIENTS, data.clients);
      if (Array.isArray(data.catalogueItems)) safeSet(STORAGE_KEYS.CATALOGUE_ITEMS, data.catalogueItems);
      if (Array.isArray(data.quotations)) safeSet(STORAGE_KEYS.QUOTATIONS, data.quotations);
      if (Array.isArray(data.invoices)) safeSet(STORAGE_KEYS.INVOICES, data.invoices);
      if (Array.isArray(data.employees)) safeSet(STORAGE_KEYS.EMPLOYEES, data.employees);
      if (Array.isArray(data.attendance)) safeSet(STORAGE_KEYS.ATTENDANCE, data.attendance);
      if (Array.isArray(data.leaveRequests)) safeSet(STORAGE_KEYS.LEAVE, data.leaveRequests);
      if (Array.isArray(data.tasks)) safeSet(STORAGE_KEYS.TASKS, data.tasks);
      if (Array.isArray(data.documents)) safeSet(STORAGE_KEYS.DOCUMENTS, data.documents);
      if (Array.isArray(data.approvals)) safeSet(STORAGE_KEYS.APPROVALS, data.approvals);
      if (data.payroll) safeSet(STORAGE_KEYS.PAYROLL, data.payroll);
      if (Array.isArray(data.assets)) safeSet(STORAGE_KEYS.ASSETS, data.assets);
      if (Array.isArray(data.consumables)) safeSet(STORAGE_KEYS.CONSUMABLES, data.consumables);
      if (Array.isArray(data.pettyCash)) safeSet(STORAGE_KEYS.PETTY_CASH, data.pettyCash);
      if (Array.isArray(data.announcements)) safeSet(STORAGE_KEYS.ANNOUNCEMENTS, data.announcements);
      if (Array.isArray(data.salesLeads)) safeSet(STORAGE_KEYS.SALES_LEADS, data.salesLeads);
      if (Array.isArray(data.salesKPIs)) safeSet(STORAGE_KEYS.SALES_KPIS, data.salesKPIs);
      if (Array.isArray(data.salesReports)) safeSet(STORAGE_KEYS.SALES_REPORTS, data.salesReports);
      if (Array.isArray(data.inventoryTransactions)) safeSet(STORAGE_KEYS.INVENTORY_TRANSACTIONS, data.inventoryTransactions);
      if (data.meetingRoom) safeSet(STORAGE_KEYS.MEETING_ROOM, data.meetingRoom);

      return { success: true, message: 'Data zote zimerudishwa kwa mafanikio kutoka kwenye chelezo!' };
    } catch (e: any) {
      return { success: false, message: `Hitilafu ya kurejesha chelezo: ${e.message || 'JSON isiyo sahihi'}` };
    }
  },
};

// Utility to export arbitrary data to CSV
export function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const escapeCsv = (val: string | number) => {
    const s = String(val ?? '').replace(/"/g, '""');
    return `"${s}"`;
  };

  const csvContent = [
    headers.map(escapeCsv).join(','),
    ...rows.map(row => row.map(escapeCsv).join(','))
  ].join('\r\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
