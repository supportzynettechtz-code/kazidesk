/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  getDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
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
import { SaaSPlan } from '../types/saas';

// ---------------------------------------------------------------------------
// DATA BUNDLE FOR A SINGLE TENANT
// ---------------------------------------------------------------------------
export interface TenantDataBundle {
  employees: Employee[];
  attendance: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
  tasks: OfficeTask[];
  documents: OfficeDocument[];
  approvals: ApprovalRequest[];
  payroll: PayrollRun | null;
  assets: OfficeAsset[];
  consumables: ConsumableItem[];
  inventoryTransactions: InventoryTransaction[];
  pettyCash: PettyCashVoucher[];
  announcements: CompanyAnnouncement[];
  salesLeads: SalesLead[];
  salesKPIs: SalesKPI[];
  salesReports: SalesReport[];
  meetingRoom: MeetingRoom | null;
  clients: Client[];
  catalogueItems: CatalogueItem[];
  quotations: Quotation[];
  invoices: Invoice[];
  billingProfile: CompanyBillingProfile | null;
}

// ---------------------------------------------------------------------------
// FETCH ALL TENANT DATA
// ---------------------------------------------------------------------------
export async function fetchTenantDataBundle(companyId: string): Promise<TenantDataBundle> {
  const getSubcollectionDocs = async <T>(sub: string): Promise<T[]> => {
    try {
      const snap = await getDocs(collection(db, 'companies', companyId, sub));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as unknown as T));
    } catch (e) {
      console.warn(`Could not load subcollection ${sub} for company ${companyId}:`, e);
      return [];
    }
  };

  const [
    employees,
    attendance,
    leaveRequests,
    tasks,
    documents,
    approvals,
    assets,
    consumables,
    inventoryTransactions,
    pettyCash,
    announcements,
    salesLeads,
    salesKPIs,
    salesReports,
    clients,
    catalogueItems,
    quotations,
    invoices,
  ] = await Promise.all([
    getSubcollectionDocs<Employee>('staff'),
    getSubcollectionDocs<AttendanceRecord>('attendance'),
    getSubcollectionDocs<LeaveRequest>('leaveRequests'),
    getSubcollectionDocs<OfficeTask>('tasks'),
    getSubcollectionDocs<OfficeDocument>('documents'),
    getSubcollectionDocs<ApprovalRequest>('approvals'),
    getSubcollectionDocs<OfficeAsset>('assets'),
    getSubcollectionDocs<ConsumableItem>('inventory'),
    getSubcollectionDocs<InventoryTransaction>('inventoryTransactions'),
    getSubcollectionDocs<PettyCashVoucher>('pettyCash'),
    getSubcollectionDocs<CompanyAnnouncement>('announcements'),
    getSubcollectionDocs<SalesLead>('salesLeads'),
    getSubcollectionDocs<SalesKPI>('salesKPIs'),
    getSubcollectionDocs<SalesReport>('salesReports'),
    getSubcollectionDocs<Client>('clients'),
    getSubcollectionDocs<CatalogueItem>('catalogue'),
    getSubcollectionDocs<Quotation>('quotations'),
    getSubcollectionDocs<Invoice>('invoices'),
  ]);

  // Meeting Room
  let meetingRoom: MeetingRoom | null = null;
  try {
    const roomSnap = await getDoc(doc(db, 'companies', companyId, 'meetingRooms', 'main-room'));
    if (roomSnap.exists()) {
      meetingRoom = { id: roomSnap.id, ...roomSnap.data() } as MeetingRoom;
    }
  } catch (e) {
    console.warn('Meeting room notice:', e);
  }

  // Billing Profile
  let billingProfile: CompanyBillingProfile | null = null;
  try {
    const profileSnap = await getDoc(doc(db, 'companies', companyId, 'settings', 'profile'));
    if (profileSnap.exists()) {
      billingProfile = profileSnap.data() as CompanyBillingProfile;
    }
  } catch (e) {
    console.warn('Billing profile notice:', e);
  }

  // Payroll
  let payroll: PayrollRun | null = null;
  try {
    const payrollList = await getSubcollectionDocs<PayrollRun>('payroll');
    if (payrollList.length > 0) {
      payroll = payrollList[0];
    }
  } catch (e) {
    console.warn('Payroll notice:', e);
  }

  return {
    employees,
    attendance,
    leaveRequests,
    tasks,
    documents,
    approvals,
    payroll,
    assets,
    consumables,
    inventoryTransactions,
    pettyCash,
    announcements,
    salesLeads,
    salesKPIs,
    salesReports,
    meetingRoom,
    clients,
    catalogueItems,
    quotations,
    invoices,
    billingProfile,
  };
}

// ---------------------------------------------------------------------------
// PLAN QUOTA CHECKERS
// ---------------------------------------------------------------------------
export async function assertStaffQuota(companyId: string, plan: SaaSPlan, currentCount: number): Promise<void> {
  if (currentCount >= plan.maxStaff) {
    throw new Error(
      `Umefikia kikomo cha mpango wako (${plan.name}) cha wafanyakazi ${plan.maxStaff}. Tafadhali boresha mpango wako ili kuongeza wafanyakazi zaidi.`
    );
  }
}

export async function assertInvoiceQuota(companyId: string, plan: SaaSPlan, invoicesThisMonthCount: number): Promise<void> {
  if (invoicesThisMonthCount >= plan.maxInvoicesPerMonth) {
    throw new Error(
      `Umefikia kikomo cha mpango wako (${plan.name}) cha ankara ${plan.maxInvoicesPerMonth} kwa mwezi huu. Boresha mpango wako kupata ankara bila kikomo.`
    );
  }
}

// ---------------------------------------------------------------------------
// GENERIC SUBCOLLECTION WRITERS (Always tags with companyId)
// ---------------------------------------------------------------------------
export async function saveTenantDocument<T extends { id: string }>(
  companyId: string,
  subcollection: string,
  data: T
): Promise<void> {
  const docPath = `companies/${companyId}/${subcollection}/${data.id}`;
  try {
    await setDoc(doc(db, 'companies', companyId, subcollection, data.id), {
      ...data,
      companyId,
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export async function deleteTenantDocument(
  companyId: string,
  subcollection: string,
  docId: string
): Promise<void> {
  const docPath = `companies/${companyId}/${subcollection}/${docId}`;
  try {
    await deleteDoc(doc(db, 'companies', companyId, subcollection, docId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

// ---------------------------------------------------------------------------
// COMPANY EXPORT / BACKUP (ONLY ITS OWN DATA)
// ---------------------------------------------------------------------------
export async function exportTenantBackup(companyId: string, companyName: string): Promise<void> {
  const bundle = await fetchTenantDataBundle(companyId);
  const payload = {
    version: '2.6-SaaS',
    companyId,
    companyName,
    exportedAt: new Date().toISOString(),
    data: bundle,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `KaziDesk_Backup_${companyName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// RESTORE TENANT BACKUP (STRICTLY INTO SAME COMPANY ID)
// ---------------------------------------------------------------------------
export async function restoreTenantBackup(
  companyId: string,
  backupContent: string
): Promise<{ success: boolean; count: number; message: string }> {
  try {
    const parsed = JSON.parse(backupContent);
    if (!parsed || !parsed.data) {
      return { success: false, count: 0, message: 'Faili halina muundo sahihi wa nakala ya KaziDesk (Invalid backup format).' };
    }

    // Security check: cannot restore another company's backup into this tenant
    if (parsed.companyId && parsed.companyId !== companyId && parsed.companyId !== 'demo-company-tz') {
      return {
        success: false,
        count: 0,
        message: `Kosa la Usalama: Nakala hii ni ya kampuni (${parsed.companyName || parsed.companyId}) na haiwezi kuwekwa kwenye akaunti hii.`
      };
    }

    const d = parsed.data;
    let writeCount = 0;

    const restoreList = async <T extends { id: string }>(sub: string, items?: T[]) => {
      if (!items || !Array.isArray(items)) return;
      for (const item of items) {
        if (item && item.id) {
          await saveTenantDocument(companyId, sub, item);
          writeCount++;
        }
      }
    };

    await Promise.all([
      restoreList('staff', d.employees),
      restoreList('attendance', d.attendance),
      restoreList('leaveRequests', d.leaveRequests),
      restoreList('tasks', d.tasks),
      restoreList('documents', d.documents),
      restoreList('approvals', d.approvals),
      restoreList('assets', d.assets),
      restoreList('inventory', d.consumables),
      restoreList('inventoryTransactions', d.inventoryTransactions),
      restoreList('pettyCash', d.pettyCash),
      restoreList('announcements', d.announcements),
      restoreList('salesLeads', d.salesLeads),
      restoreList('salesKPIs', d.salesKPIs),
      restoreList('salesReports', d.salesReports),
      restoreList('clients', d.clients),
      restoreList('catalogue', d.catalogueItems),
      restoreList('quotations', d.quotations),
      restoreList('invoices', d.invoices),
    ]);

    if (d.billingProfile) {
      await saveTenantDocument(companyId, 'settings', { ...d.billingProfile, id: 'profile' });
      writeCount++;
    }

    return {
      success: true,
      count: writeCount,
      message: `Data zimerejeshwa kikamilifu! Kumbukumbu ${writeCount} zimehifadhiwa.`
    };
  } catch (error: any) {
    console.error('Backup restore error:', error);
    return {
      success: false,
      count: 0,
      message: error.message || 'Hitilafu imetokea wakati wa kurejesha data.'
    };
  }
}

// ---------------------------------------------------------------------------
// DELETE COMPANY AND ALL DATA (RIGHT TO BE FORGOTTEN)
// ---------------------------------------------------------------------------
export async function deleteCompanyAndAllData(companyId: string, companyName: string): Promise<void> {
  const subcollections = [
    'staff', 'attendance', 'leaveRequests', 'tasks', 'documents', 'approvals',
    'assets', 'inventory', 'inventoryTransactions', 'pettyCash', 'announcements',
    'salesLeads', 'salesKPIs', 'salesReports', 'clients', 'catalogue', 'quotations',
    'invoices', 'settings', 'payroll', 'meetingRooms'
  ];

  try {
    for (const sub of subcollections) {
      const snap = await getDocs(collection(db, 'companies', companyId, sub));
      for (const d of snap.docs) {
        await deleteDoc(d.ref);
      }
    }

    // Delete company root document
    await deleteDoc(doc(db, 'companies', companyId));

    // Clear user mappings
    const userSnap = await getDocs(query(collection(db, 'users'), where('companyId', '==', companyId)));
    for (const u of userSnap.docs) {
      await deleteDoc(u.ref);
    }
  } catch (error) {
    console.warn('Delete company notice:', error);
  }
}
