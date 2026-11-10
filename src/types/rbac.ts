/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Module Action Types for Granular Permissions
export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'export' | 'approve';

export type SystemModuleKey = 
  | 'dashboard'
  | 'quotations'
  | 'attendance'
  | 'employees'
  | 'tasks'
  | 'sales'
  | 'announcements'
  | 'meetings'
  | 'payroll'
  | 'assets'
  | 'documents'
  | 'cards'
  | 'permissions'
  | 'pettyCash'
  | 'reports'
  | 'help';

// Keyed by SystemModuleKey: boolean flags for each action
export interface ModulePermissions {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  export: boolean;
  approve: boolean;
}

export type PermissionMatrix = Record<SystemModuleKey, ModulePermissions>;

export interface CustomRole {
  id: string; // e.g. 'role-admin', 'role-hr', 'role-accountant', 'role-sales', 'role-staff', or uuid for custom
  companyId: string;
  name: string; // e.g. "Admin", "HR Manager", "Senior Accountant"
  nameSw?: string;
  description: string;
  isSystem: boolean; // Cannot delete base system roles (Admin, HR, Accountant, Sales, Staff)
  permissions: PermissionMatrix;
  createdAt: string;
  updatedAt: string;
}

export interface PermissionAuditLog {
  id: string;
  companyId: string;
  actorId: string;
  actorName: string;
  actorEmail: string;
  action: 'CREATE_ROLE' | 'UPDATE_ROLE' | 'DELETE_ROLE' | 'ASSIGN_ROLE' | 'TOGGLE_ACCOUNT_STATUS' | 'PASSWORD_RESET';
  roleId?: string;
  roleName?: string;
  targetUserId?: string;
  targetUserName?: string;
  details: string;
  beforeSnapshot?: any;
  afterSnapshot?: any;
  timestamp: string;
}

export interface UserLoginHistory {
  id: string;
  companyId: string;
  userId: string;
  userEmail: string;
  userName: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  status: 'success' | 'failed';
}

// ---------------------------------------------------------------------------
// DEFAULT PERMISSIONS BUILDERS
// ---------------------------------------------------------------------------

export const ALL_SYSTEM_MODULES: { key: SystemModuleKey; labelSw: string; labelEn: string }[] = [
  { key: 'dashboard', labelSw: 'Dashibodi Kuu', labelEn: 'Main Dashboard' },
  { key: 'quotations', labelSw: 'Nukuu & Ankara (Invoices)', labelEn: 'Quotations & Invoices' },
  { key: 'attendance', labelSw: 'Mahudhurio & Likizo', labelEn: 'Attendance & Leave' },
  { key: 'employees', labelSw: 'Wafanyakazi (Staff Directory)', labelEn: 'Staff Directory' },
  { key: 'tasks', labelSw: 'Majukumu & Workflow', labelEn: 'Tasks & Workflow' },
  { key: 'sales', labelSw: 'Masoko & Mauzo CRM', labelEn: 'Sales & Marketing CRM' },
  { key: 'announcements', labelSw: 'Matangazo ya Kampuni', labelEn: 'Company Noticeboard' },
  { key: 'meetings', labelSw: 'Mikutano & Video Live', labelEn: 'Live Video Meetings' },
  { key: 'payroll', labelSw: 'Payroll & Mishahara', labelEn: 'Payroll & Compensation' },
  { key: 'assets', labelSw: 'Vifaa & Stoo (Inventory)', labelEn: 'Assets & Inventory' },
  { key: 'documents', labelSw: 'Nyaraka & Idhini (Documents)', labelEn: 'Documents & Approvals' },
  { key: 'cards', labelSw: 'Vitambulisho vya Kidijitali', labelEn: 'Smart ID Cards' },
  { key: 'permissions', labelSw: 'Ruhusa & Mipaka (Security)', labelEn: 'Access & Permissions' },
  { key: 'pettyCash', labelSw: 'Petty Cash & Vocha', labelEn: 'Petty Cash & Vouchers' },
  { key: 'reports', labelSw: 'Ripoti za Uongozi', labelEn: 'Management Reports' },
  { key: 'help', labelSw: 'Mwongozo & Msaada', labelEn: 'Help & Support' },
];

export function createFullPermissions(): PermissionMatrix {
  const matrix = {} as PermissionMatrix;
  for (const mod of ALL_SYSTEM_MODULES) {
    matrix[mod.key] = {
      view: true,
      create: true,
      edit: true,
      delete: true,
      export: true,
      approve: true,
    };
  }
  return matrix;
}

export function createReadOnlyPermissions(): PermissionMatrix {
  const matrix = {} as PermissionMatrix;
  for (const mod of ALL_SYSTEM_MODULES) {
    matrix[mod.key] = {
      view: true,
      create: false,
      edit: false,
      delete: false,
      export: false,
      approve: false,
    };
  }
  return matrix;
}

export function createDefaultRoles(companyId: string): CustomRole[] {
  const now = new Date().toISOString();

  // 1. ADMIN - All full permissions
  const adminMatrix = createFullPermissions();

  // 2. HR - Full on Attendance, Employees, Noticeboard, Payroll (view/export), Docs
  const hrMatrix = createReadOnlyPermissions();
  hrMatrix.attendance = { view: true, create: true, edit: true, delete: false, export: true, approve: true };
  hrMatrix.employees = { view: true, create: true, edit: true, delete: false, export: true, approve: true };
  hrMatrix.announcements = { view: true, create: true, edit: true, delete: false, export: false, approve: true };
  hrMatrix.payroll = { view: true, create: false, edit: false, delete: false, export: true, approve: false };
  hrMatrix.cards = { view: true, create: true, edit: true, delete: false, export: true, approve: false };
  hrMatrix.meetings = { view: true, create: true, edit: true, delete: false, export: false, approve: false };
  hrMatrix.reports = { view: true, create: false, edit: false, delete: false, export: true, approve: false };

  // 3. ACCOUNTANT - Full on Invoices, Petty Cash, Payroll, Reports
  const accountantMatrix = createReadOnlyPermissions();
  accountantMatrix.quotations = { view: true, create: true, edit: true, delete: false, export: true, approve: true };
  accountantMatrix.pettyCash = { view: true, create: true, edit: true, delete: false, export: true, approve: true };
  accountantMatrix.payroll = { view: true, create: true, edit: true, delete: false, export: true, approve: true };
  accountantMatrix.reports = { view: true, create: true, edit: false, delete: false, export: true, approve: false };
  accountantMatrix.assets = { view: true, create: true, edit: true, delete: false, export: true, approve: false };

  // 4. SALES - Quotations, Sales CRM, Meetings, Tasks
  const salesMatrix = createReadOnlyPermissions();
  salesMatrix.quotations = { view: true, create: true, edit: true, delete: false, export: true, approve: false };
  salesMatrix.sales = { view: true, create: true, edit: true, delete: false, export: true, approve: false };
  salesMatrix.tasks = { view: true, create: true, edit: true, delete: false, export: false, approve: false };
  salesMatrix.meetings = { view: true, create: true, edit: true, delete: false, export: false, approve: false };

  // 5. STAFF - Dashboard, own Attendance, Tasks, Noticeboard, Help
  const staffMatrix = createReadOnlyPermissions();
  staffMatrix.dashboard = { view: true, create: false, edit: false, delete: false, export: false, approve: false };
  staffMatrix.attendance = { view: true, create: true, edit: false, delete: false, export: false, approve: false };
  staffMatrix.tasks = { view: true, create: true, edit: true, delete: false, export: false, approve: false };
  staffMatrix.announcements = { view: true, create: false, edit: false, delete: false, export: false, approve: false };
  staffMatrix.meetings = { view: true, create: false, edit: false, delete: false, export: false, approve: false };
  staffMatrix.help = { view: true, create: true, edit: false, delete: false, export: false, approve: false };
  // Disable permissions, payroll, reports for normal staff
  staffMatrix.permissions = { view: false, create: false, edit: false, delete: false, export: false, approve: false };
  staffMatrix.payroll = { view: false, create: false, edit: false, delete: false, export: false, approve: false };
  staffMatrix.reports = { view: false, create: false, edit: false, delete: false, export: false, approve: false };

  return [
    {
      id: 'role-admin',
      companyId,
      name: 'Msimamizi Mkuu (Admin)',
      nameSw: 'Msimamizi Mkuu',
      description: 'Ana mamlaka kamili ya kuona, kuunda, kuhariri, na kufuta moduli zote za ofisi na kuweka ruhusa.',
      isSystem: true,
      permissions: adminMatrix,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'role-hr',
      companyId,
      name: 'Rasilimali Watu (HR Manager)',
      nameSw: 'Meneja wa HR',
      description: 'Usimamizi wa wafanyakazi, mahudhurio, likizo, vitambulisho vya kadi na nyaraka za watumishi.',
      isSystem: true,
      permissions: hrMatrix,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'role-accountant',
      companyId,
      name: 'Mhasibu (Accountant)',
      nameSw: 'Mhasibu wa Kampuni',
      description: 'Usimamizi wa ankara, nukuu, petty cash, orodha ya mishahara (payroll) na ripoti za fedha.',
      isSystem: true,
      permissions: accountantMatrix,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'role-sales',
      companyId,
      name: 'Afisa Masoko & Mauzo (Sales)',
      nameSw: 'Afisa Mauzo',
      description: 'Usimamizi wa wateja, fursa za mauzo (leads), nukuu na mikutano na wateja.',
      isSystem: true,
      permissions: salesMatrix,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'role-staff',
      companyId,
      name: 'Mfanyakazi wa Kawaida (Staff)',
      nameSw: 'Mfanyakazi',
      description: 'Kusaini mahudhurio, kufanya majukumu binafsi, kusoma matangazo na kuomba likizo/msaada.',
      isSystem: true,
      permissions: staffMatrix,
      createdAt: now,
      updatedAt: now,
    },
  ];
}
