/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, PLATFORM_OWNER_EMAIL } from '../firebase/config';
import { Company, SaaSPlan } from '../types/saas';
import { DEFAULT_PLANS, DEFAULT_PLATFORM_SETTINGS } from './tenantService';
import {
  INITIAL_EMPLOYEES,
  INITIAL_ATTENDANCE,
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
  INITIAL_MEETING_ROOM,
  INITIAL_CLIENTS,
  INITIAL_CATALOGUE_ITEMS,
  INITIAL_QUOTATIONS,
  INITIAL_INVOICES,
  INITIAL_BILLING_PROFILE
} from '../data/initialData';
import { saveTenantDocument } from './companyDataService';

export async function seedInitialTenantData(): Promise<void> {
  try {
    // 1. Seed Platform Settings
    const settingsSnap = await getDoc(doc(db, 'platformSettings', 'config'));
    if (!settingsSnap.exists()) {
      await setDoc(doc(db, 'platformSettings', 'config'), DEFAULT_PLATFORM_SETTINGS);
    } else {
      const data = settingsSnap.data();
      if (!data?.supportWhatsApp || data.supportWhatsApp.includes('754 000') || !data?.supportEmail || data.ownerPhone?.includes('754 000')) {
        await setDoc(doc(db, 'platformSettings', 'config'), {
          supportWhatsApp: '+255775740386',
          ownerPhone: '+255775740386',
          supportEmail: 'support.zynettechtz@gmail.com',
        }, { merge: true });
      }
    }

    // 2. Seed Plans
    for (const plan of DEFAULT_PLANS) {
      const planSnap = await getDoc(doc(db, 'plans', plan.id));
      if (!planSnap.exists() || (planSnap.data()?.enabledModules?.length || 0) < plan.enabledModules.length) {
        await setDoc(doc(db, 'plans', plan.id), plan, { merge: true });
      }
    }

    // 3. Seed Super Admin Document
    const adminSnap = await getDoc(doc(db, 'admins', 'owner-superadmin'));
    if (!adminSnap.exists()) {
      await setDoc(doc(db, 'admins', 'owner-superadmin'), {
        email: PLATFORM_OWNER_EMAIL,
        isSuperAdmin: true,
        assignedAt: new Date().toISOString(),
      });
      await setDoc(doc(db, 'users', 'owner-superadmin'), {
        uid: 'owner-superadmin',
        email: PLATFORM_OWNER_EMAIL,
        displayName: 'Platform Owner (Super Admin)',
        companyId: 'platform',
        role: 'superadmin',
        isCompanyAdmin: false,
        status: 'active',
        createdAt: new Date().toISOString(),
      });
    }

    // 4. Seed "Demo Company"
    const demoCompanyId = 'demo-company-tz';
    const demoCompSnap = await getDoc(doc(db, 'companies', demoCompanyId));
    if (!demoCompSnap.exists() || demoCompSnap.data()?.planId !== 'enterprise') {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 25);

      const demoCompany: Company = {
        id: demoCompanyId,
        name: 'Demo Company (KaziDesk TZ)',
        tin: '123-456-789',
        vrn: '40-123456-X',
        address: 'Posta Mpya, Mtaa wa Samora, Jengo la Golden Jubilee, Dar es Salaam',
        contactPerson: 'Juma Mwamburi',
        phone: '+255 754 123 456',
        email: 'admin@democompany.co.tz',
        planId: 'enterprise',
        status: 'active',
        subscriptionStartDate: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
        subscriptionDueDate: dueDate.toISOString().split('T')[0],
        adminEmail: 'admin@democompany.co.tz',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'companies', demoCompanyId), demoCompany, { merge: true });

      // Seed Demo Company's user
      await setDoc(doc(db, 'users', 'user-demo-admin'), {
        uid: 'user-demo-admin',
        email: 'admin@democompany.co.tz',
        displayName: 'Juma Mwamburi',
        companyId: demoCompanyId,
        role: 'admin',
        isCompanyAdmin: true,
        status: 'active',
        createdAt: new Date().toISOString(),
      });

      // Seed all rich initial data into demo company subcollections
      for (const emp of INITIAL_EMPLOYEES) {
        await saveTenantDocument(demoCompanyId, 'staff', emp);
      }
      for (const att of INITIAL_ATTENDANCE) {
        await saveTenantDocument(demoCompanyId, 'attendance', att);
      }
      for (const task of INITIAL_TASKS) {
        await saveTenantDocument(demoCompanyId, 'tasks', task);
      }
      for (const docItem of INITIAL_DOCUMENTS) {
        await saveTenantDocument(demoCompanyId, 'documents', docItem);
      }
      for (const app of INITIAL_APPROVALS) {
        await saveTenantDocument(demoCompanyId, 'approvals', app);
      }
      await saveTenantDocument(demoCompanyId, 'payroll', INITIAL_PAYROLL);
      for (const asset of INITIAL_ASSETS) {
        await saveTenantDocument(demoCompanyId, 'assets', asset);
      }
      for (const item of INITIAL_CONSUMABLES) {
        await saveTenantDocument(demoCompanyId, 'inventory', item);
      }
      for (const pc of INITIAL_PETTY_CASH) {
        await saveTenantDocument(demoCompanyId, 'pettyCash', pc);
      }
      for (const ann of INITIAL_ANNOUNCEMENTS) {
        await saveTenantDocument(demoCompanyId, 'announcements', ann);
      }
      for (const lead of INITIAL_SALES_LEADS) {
        await saveTenantDocument(demoCompanyId, 'salesLeads', lead);
      }
      for (const kpi of INITIAL_SALES_KPIS) {
        await saveTenantDocument(demoCompanyId, 'salesKPIs', kpi);
      }
      for (const report of INITIAL_SALES_REPORTS) {
        await saveTenantDocument(demoCompanyId, 'salesReports', report);
      }
      for (const client of INITIAL_CLIENTS) {
        await saveTenantDocument(demoCompanyId, 'clients', client);
      }
      for (const cat of INITIAL_CATALOGUE_ITEMS) {
        await saveTenantDocument(demoCompanyId, 'catalogue', cat);
      }
      for (const q of INITIAL_QUOTATIONS) {
        await saveTenantDocument(demoCompanyId, 'quotations', q);
      }
      for (const inv of INITIAL_INVOICES) {
        await saveTenantDocument(demoCompanyId, 'invoices', inv);
      }
      await setDoc(doc(db, 'companies', demoCompanyId, 'settings', 'profile'), {
        ...INITIAL_BILLING_PROFILE,
        companyId: demoCompanyId,
      });
      await setDoc(doc(db, 'companies', demoCompanyId, 'meetingRooms', 'main-room'), {
        ...INITIAL_MEETING_ROOM,
        companyId: demoCompanyId,
      });
    }

    // 5. Seed Company A: "Kilimanjaro Logistics & Freight Ltd"
    const compAId = 'company-a-kili';
    const compASnap = await getDoc(doc(db, 'companies', compAId));
    if (!compASnap.exists()) {
      const dueDateA = new Date();
      dueDateA.setDate(dueDateA.getDate() + 18);

      const compA: Company = {
        id: compAId,
        name: 'Kilimanjaro Logistics Ltd',
        tin: '123-999-888',
        vrn: '40-001234-A',
        address: 'Moshi Commercial Complex, Barabara ya Kibo, Kilimanjaro',
        contactPerson: 'Josephat Mushi',
        phone: '+255 754 111 222',
        email: 'admin@kililogistics.co.tz',
        planId: 'starter',
        status: 'active',
        subscriptionStartDate: new Date(Date.now() - 15 * 86400000).toISOString().split('T')[0],
        subscriptionDueDate: dueDateA.toISOString().split('T')[0],
        adminEmail: 'admin@kililogistics.co.tz',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'companies', compAId), compA);

      await setDoc(doc(db, 'users', 'user-kili-admin'), {
        uid: 'user-kili-admin',
        email: 'admin@kililogistics.co.tz',
        displayName: 'Josephat Mushi (MD)',
        companyId: compAId,
        role: 'admin',
        isCompanyAdmin: true,
        status: 'active',
        createdAt: new Date().toISOString(),
      });

      // Company A staff
      await saveTenantDocument(compAId, 'staff', {
        id: 'EMP-KLI-01',
        companyId: compAId,
        employeeNo: 'KLF-001',
        fullName: 'Josephat Mushi',
        email: 'admin@kililogistics.co.tz',
        phone: '+255 754 111 222',
        roleTitle: 'Managing Director',
        department: 'Utawala',
        systemRole: 'admin',
        salaryTZS: 3500000,
        isActive: true,
        joinDate: '2023-01-15',
        accountStatus: 'active',
        cardId: 'CRD-KLI-001',
        pin: '1234',
      });
      await saveTenantDocument(compAId, 'staff', {
        id: 'EMP-KLI-02',
        companyId: compAId,
        employeeNo: 'KLF-002',
        fullName: 'Grace Tarimo',
        email: 'grace.tarimo@kililogistics.co.tz',
        phone: '+255 755 222 333',
        roleTitle: 'Operations & Logistics Lead',
        department: 'Uendeshaji',
        systemRole: 'staff',
        salaryTZS: 1800000,
        isActive: true,
        joinDate: '2023-06-01',
        accountStatus: 'active',
        cardId: 'CRD-KLI-002',
        pin: '2345',
      });
      await saveTenantDocument(compAId, 'staff', {
        id: 'EMP-KLI-03',
        companyId: compAId,
        employeeNo: 'KLF-003',
        fullName: 'Daudi Temba',
        email: 'daudi.temba@kililogistics.co.tz',
        phone: '+255 756 333 444',
        roleTitle: 'Fleet Chief Driver',
        department: 'Uendeshaji',
        systemRole: 'staff',
        salaryTZS: 1200000,
        isActive: true,
        joinDate: '2024-02-10',
        accountStatus: 'active',
        cardId: 'CRD-KLI-003',
        pin: '3456',
      });

      // Company A Client
      await saveTenantDocument(compAId, 'clients', {
        id: 'CLI-KLI-01',
        companyId: compAId,
        name: 'Twiga Cement PLC',
        company: 'Tanzania Portland Cement PLC',
        phone: '+255 22 263 0000',
        email: 'logistics@twigacement.com',
        address: 'Wazo Hill, Dar es Salaam',
        tin: '100-200-300',
        vrn: '40-001122-C',
        totalInvoiced: 18500000,
        totalPaid: 18500000,
        createdAt: '2026-01-10',
      });

      // Company A Invoice (Notice separate numbering KLF-INV-2026-001)
      await saveTenantDocument(compAId, 'invoices', {
        id: 'INV-KLI-01',
        companyId: compAId,
        invoiceNumber: 'KLF-INV-2026-001',
        clientId: 'CLI-KLI-01',
        clientName: 'Twiga Cement PLC',
        clientCompany: 'Tanzania Portland Cement PLC',
        date: '2026-02-15',
        dueDate: '2026-03-01',
        items: [
          {
            id: 'item-1',
            description: 'Usafirishaji wa Saruji Tani 30 (Dar es Salaam hadi Moshi)',
            quantity: 3,
            unit: 'Safsafu/Trip',
            unitPrice: 3500000,
            totalPrice: 10500000,
          },
        ],
        subtotal: 10500000,
        vatEnabled: true,
        vatRate: 18,
        vatAmount: 1890000,
        discountAmount: 0,
        grandTotal: 12390000,
        paidAmount: 12390000,
        balanceDue: 0,
        status: 'paid',
        createdBy: 'Josephat Mushi',
        createdAt: '2026-02-15',
        terms: 'Malipo yamefanyika kupitia benki ya CRDB',
      });

      // Company A Profile
      await setDoc(doc(db, 'companies', compAId, 'settings', 'profile'), {
        companyName: 'Kilimanjaro Logistics & Freight Ltd',
        tagline: 'Usafirishaji Salama na Wa Uhakika Kaskazini mwa Tanzania',
        tin: '123-999-888',
        vrn: '40-001234-A',
        address: 'Moshi Commercial Complex, Barabara ya Kibo, Kilimanjaro',
        phone: '+255 754 111 222',
        email: 'info@kililogistics.co.tz',
        bankName: 'CRDB Bank Plc',
        accountName: 'Kilimanjaro Logistics & Freight Ltd',
        accountNumber: '01501122334455 (TZS)',
        branch: 'Moshi Main Branch',
        mobileMoneyNumber: '778899 (M-Pesa)',
        mobileMoneyName: 'Kilimanjaro Logistics',
        defaultVatRate: 18,
        quotationPrefix: 'KLF-QT-2026-',
        invoicePrefix: 'KLF-INV-2026-',
        defaultValidityDays: 14,
        defaultPaymentTerms: 'Malipo ndani ya siku 14 baada ya mzigo kufika salama.',
        signatoryName: 'Josephat Mushi',
        signatoryTitle: 'Mkurugenzi Mkuu',
        companyId: compAId,
      });
    }

    // 6. Seed Company B: "Serengeti Safaris & Tours Ltd"
    const compBId = 'company-b-serengeti';
    const compBSnap = await getDoc(doc(db, 'companies', compBId));
    if (!compBSnap.exists()) {
      const dueDateB = new Date();
      dueDateB.setDate(dueDateB.getDate() + 22);

      const compB: Company = {
        id: compBId,
        name: 'Serengeti Safaris & Tours Ltd',
        tin: '987-654-321',
        vrn: '40-009876-S',
        address: 'Sokoine Road, Arusha City Centre, Arusha',
        contactPerson: 'Amina Mollel',
        phone: '+255 784 333 444',
        email: 'admin@serengetisafaris.co.tz',
        planId: 'growth',
        status: 'active',
        subscriptionStartDate: new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0],
        subscriptionDueDate: dueDateB.toISOString().split('T')[0],
        adminEmail: 'admin@serengetisafaris.co.tz',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'companies', compBId), compB);

      await setDoc(doc(db, 'users', 'user-serengeti-admin'), {
        uid: 'user-serengeti-admin',
        email: 'admin@serengetisafaris.co.tz',
        displayName: 'Amina Mollel (Managing Director)',
        companyId: compBId,
        role: 'admin',
        isCompanyAdmin: true,
        status: 'active',
        createdAt: new Date().toISOString(),
      });

      // Company B Staff
      await saveTenantDocument(compBId, 'staff', {
        id: 'EMP-SST-01',
        companyId: compBId,
        employeeNo: 'SST-001',
        fullName: 'Amina Mollel',
        email: 'admin@serengetisafaris.co.tz',
        phone: '+255 784 333 444',
        roleTitle: 'Managing Director',
        department: 'Utawala',
        systemRole: 'admin',
        salaryTZS: 4200000,
        isActive: true,
        joinDate: '2022-03-01',
        accountStatus: 'active',
        cardId: 'CRD-SST-001',
        pin: '1122',
      });
      await saveTenantDocument(compBId, 'staff', {
        id: 'EMP-SST-02',
        companyId: compBId,
        employeeNo: 'SST-002',
        fullName: 'Brian Lemomo',
        email: 'brian.lemomo@serengetisafaris.co.tz',
        phone: '+255 785 444 555',
        roleTitle: 'Chief Safari Guide & Naturalist',
        department: 'Huduma za Watalii',
        systemRole: 'staff',
        salaryTZS: 2200000,
        isActive: true,
        joinDate: '2023-01-10',
        accountStatus: 'active',
        cardId: 'CRD-SST-002',
        pin: '2233',
      });

      // Company B Client
      await saveTenantDocument(compBId, 'clients', {
        id: 'CLI-SST-01',
        companyId: compBId,
        name: 'Four Seasons Safari Lodge',
        company: 'Four Seasons Serengeti',
        phone: '+255 768 987 654',
        email: 'reservations@fourseasons-serengeti.com',
        address: 'Serengeti National Park, Mara',
        tin: '333-444-555',
        vrn: '40-007788-F',
        totalInvoiced: 28000000,
        totalPaid: 20000000,
        createdAt: '2026-01-20',
      });

      // Company B Invoice (Separate numbering SST-INV-2026-001)
      await saveTenantDocument(compBId, 'invoices', {
        id: 'INV-SST-01',
        companyId: compBId,
        invoiceNumber: 'SST-INV-2026-001',
        clientId: 'CLI-SST-01',
        clientName: 'Four Seasons Safari Lodge',
        clientCompany: 'Four Seasons Serengeti',
        date: '2026-02-18',
        dueDate: '2026-03-05',
        items: [
          {
            id: 'item-b1',
            description: 'Uhamisho wa Watalii VIP na Safari ya Ngorongoro Crater (Gari 2 LandCruiser 4x4)',
            quantity: 5,
            unit: 'Siku/Days',
            unitPrice: 1800000,
            totalPrice: 9000000,
          },
        ],
        subtotal: 9000000,
        vatEnabled: true,
        vatRate: 18,
        vatAmount: 1620000,
        discountAmount: 0,
        grandTotal: 10620000,
        paidAmount: 5000000,
        balanceDue: 5620000,
        status: 'partially_paid',
        createdBy: 'Amina Mollel',
        createdAt: '2026-02-18',
        terms: 'Malipo ya baki yafanyike kabla ya tarehe 05 Machi 2026',
      });

      // Company B Profile
      await setDoc(doc(db, 'companies', compBId, 'settings', 'profile'), {
        companyName: 'Serengeti Safaris & Tours Ltd',
        tagline: 'Gundua Maajabu ya Serengeti na Ngorongoro',
        tin: '987-654-321',
        vrn: '40-009876-S',
        address: 'Sokoine Road, Arusha City Centre, Arusha',
        phone: '+255 784 333 444',
        email: 'info@serengetisafaris.co.tz',
        bankName: 'NMB Bank Plc',
        accountName: 'Serengeti Safaris & Tours Ltd',
        accountNumber: '201100223344 (TZS)',
        branch: 'Arusha Clock Tower Branch',
        mobileMoneyNumber: '889900 (Tigo Pesa)',
        mobileMoneyName: 'Serengeti Safaris',
        defaultVatRate: 18,
        quotationPrefix: 'SST-QT-2026-',
        invoicePrefix: 'SST-INV-2026-',
        defaultValidityDays: 21,
        defaultPaymentTerms: 'Malipo ya awali 50%, baki siku 3 kabla ya kuanza safari.',
        signatoryName: 'Amina Mollel',
        signatoryTitle: 'Mkurugenzi Mtendaji',
        companyId: compBId,
      });
    }

    // 7. Seed Suspended Company for test verification (c)
    const compSuspId = 'company-c-suspended';
    const compSuspSnap = await getDoc(doc(db, 'companies', compSuspId));
    if (!compSuspSnap.exists()) {
      const pastDueDate = new Date(Date.now() - 40 * 86400000).toISOString().split('T')[0];
      const compSusp: Company = {
        id: compSuspId,
        name: 'Tanga Coastal Distributors Ltd (Akaunti Imezuiwa)',
        tin: '555-666-777',
        address: 'Customs Road, Tanga Port, Tanga',
        contactPerson: 'Salim Mkumbukwa',
        phone: '+255 713 000 999',
        email: 'admin@tangadistributors.co.tz',
        planId: 'starter',
        status: 'suspended',
        subscriptionStartDate: new Date(Date.now() - 100 * 86400000).toISOString().split('T')[0],
        subscriptionDueDate: pastDueDate,
        adminEmail: 'admin@tangadistributors.co.tz',
        createdAt: new Date(Date.now() - 100 * 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'companies', compSuspId), compSusp);

      await setDoc(doc(db, 'users', 'user-suspended-admin'), {
        uid: 'user-suspended-admin',
        email: 'admin@tangadistributors.co.tz',
        displayName: 'Salim Mkumbukwa',
        companyId: compSuspId,
        role: 'admin',
        isCompanyAdmin: true,
        status: 'active',
        createdAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.warn('Tenant seed notice (expected if running offline or rules locked):', error);
  }
}
