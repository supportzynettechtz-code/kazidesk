/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import { db, auth, PLATFORM_OWNER_EMAIL } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import {
  Company,
  SaaSPlan,
  SubscriptionPayment,
  PlatformSettings,
  AuditLogEntry,
  SubscriptionStatus
} from '../types/saas';

export const DEFAULT_PLANS: SaaSPlan[] = [
  {
    id: 'starter',
    name: 'KaziDesk Starter',
    priceMonthlyTZS: 150000,
    maxStaff: 10,
    maxInvoicesPerMonth: 50,
    features: ['Hadi Wafanyakazi 10', 'Nukuu & Ankara 50/Mwezi', 'Mahudhurio & Smart ID Cards', 'Stoo & Vifaa', 'Mwongozo wa Mfumo'],
    enabledModules: ['dashboard', 'attendance', 'employees', 'cards', 'tasks', 'quotations', 'assets', 'pettyCash', 'help'],
    isActive: true,
  },
  {
    id: 'growth',
    name: 'KaziDesk Growth',
    priceMonthlyTZS: 350000,
    maxStaff: 35,
    maxInvoicesPerMonth: 250,
    features: ['Hadi Wafanyakazi 35', 'Nukuu & Ankara 250/Mwezi', 'Payroll & Mishahara', 'Masoko & Mauzo CRM', 'Matangazo ya Ofisi', 'Mwongozo & Msaada'],
    enabledModules: ['dashboard', 'attendance', 'employees', 'cards', 'tasks', 'documents', 'quotations', 'assets', 'payroll', 'sales', 'announcements', 'pettyCash', 'help'],
    isActive: true,
  },
  {
    id: 'business',
    name: 'KaziDesk Business',
    priceMonthlyTZS: 550000,
    maxStaff: 80,
    maxInvoicesPerMonth: 800,
    features: ['Hadi Wafanyakazi 80', 'Nukuu & Ankara 800/Mwezi', 'Mikutano ya Video (Live Meetings)', 'Ruhusa & Mipaka (RBAC)', 'Ripoti za Uongozi (Management Reports)', 'Msaada wa Moja kwa Moja'],
    enabledModules: ['dashboard', 'attendance', 'employees', 'cards', 'tasks', 'documents', 'quotations', 'assets', 'payroll', 'sales', 'announcements', 'meetings', 'pettyCash', 'permissions', 'reports', 'help'],
    isActive: true,
  },
  {
    id: 'enterprise',
    name: 'KaziDesk Enterprise',
    priceMonthlyTZS: 850000,
    maxStaff: 300,
    maxInvoicesPerMonth: 5000,
    features: ['Wafanyakazi Bila Kikomo (300+)', 'Nukuu & Ankara Bila Kikomo', 'Moduli Zote 16 Zikiwa Zimefunguliwa', 'Mikutano ya Video na Kumbukumbu', 'Usimamizi wa Ruhusa za Watumiaji (RBAC)', 'Ripoti za Kina za Uongozi na Takwimu', 'Msaada wa Kipaumbele 24/7'],
    enabledModules: ['dashboard', 'attendance', 'employees', 'cards', 'tasks', 'documents', 'quotations', 'assets', 'payroll', 'sales', 'announcements', 'meetings', 'pettyCash', 'permissions', 'reports', 'help'],
    isActive: true,
  },
];

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  ownerEmail: PLATFORM_OWNER_EMAIL,
  ownerPhone: '+255775740386',
  supportWhatsApp: '+255775740386',
  supportEmail: 'support.zynettechtz@gmail.com',
  ownerCompanyName: 'ZynetTech Tanzania Ltd (KaziDesk Platform Provider)',
  platformName: 'KaziDesk',
  platformLogoUrl: '',
  mpesaLipaNamba: '5678123 (M-Pesa / Tigo Pesa)',
  tigoPesaLipaNamba: '5678123 (ZynetTech Software)',
  airtelMoneyLipaNamba: '5678123',
  bankName: 'CRDB Bank Plc',
  bankAccountName: 'ZynetTech Software Solutions Ltd',
  bankAccountNumber: '01509988776600 (TZS)',
  bankBranch: 'Samora Tower Branch, Dar es Salaam',
  gracePeriodDays: 7,
  termsOfService: `[ILANI YA KISHERIA / LEGAL DISCLAIMER: Mkataba huu ni kiolezo (Template) kinachopaswa kupitiwa na mwanasheria wako wa ushirika kabla ya kuzindua rasmi mfumo kwa umma].

MASHARTI NA VIGEZO VYA UTUMIAJI WA KAZIDESK (TERMS OF SERVICE v1.2 - 2026)

1. UTANGULIZI:
Karibu KaziDesk, jukwaa la kidijitali la usimamizi wa ofisi, rasilimali na malipo kwa njia ya usajili (SaaS), linalomilikiwa na ZynetTech Tanzania Ltd. Kwa kusajili akaunti ya shirika lako, unathibitisha kuwa unayo mamlaka halali ya kuingia mkataba huu kwa niaba ya taasisi yako.

2. USAJILI WA SHIRIKA NA UHAKIKI WA KYC (KNOW YOUR CUSTOMER):
(a) Kabla ya kupewa idhini ya kuingia kwenye mfumo mkuu (workspace), kila shirika linapaswa kukamilisha mchakato wa uhakiki wa KYC kwa kuwasilisha nakala halisi za namba ya TIN, cheti cha BRELA au leseni ya biashara, na utambulisho wa wakurugenzi/wamiliki.
(b) Ni kosa la kisheria kutoa taarifa za uongo au nyaraka zilizoghushiwa. ZynetTech inahifadhi haki ya kukataa au kusitisha usajili mara moja iwapo taarifa zisizo sahihi zitatambuliwa.

3. KIPINDI CHA MAJARIBIO YA BURE & MALIPO YA USAJILI:
(a) Baada ya maombi ya KYC kuidhinishwa na mmiliki wa jukwaa, mteja atapewa kipindi cha majaribio ya bure cha siku 14 (14-day free trial) chini ya mpango ulioteuliwa.
(b) Baada ya majaribio, ada ya kila mwezi inapaswa kulipwa kwa njia za kielektroniki (M-Pesa, Tigo Pesa, Airtel Money au Akaunti ya Benki).
(c) Kuna muda wa nyongeza wa neema (grace period ya siku 7) kabla ya akaunti kusimamishwa (suspended).

4. UMILIKI WA DATA NA UTENGENISHO WA MIFUMO:
Data zote zinazozalishwa na ofisi yako (mishahara, ankara, rekodi za wafanyakazi, stoo na nyaraka) ni mali yako binafsi. ZynetTech inahakikisha utenganisho wa asilimia 100 wa data (multi-tenant tenant isolation).

5. SHERIA INAYOTAWALA:
Mkataba huu unatawaliwa na kutafsiriwa kwa mujibu wa Sheria za Jamhuri ya Muungano wa Tanzania.`,
  privacyPolicy: `[ILANI YA KISHERIA / LEGAL DISCLAIMER: Sera hii ni kiolezo (Template) kinachopaswa kupitiwa na mwanasheria kwa ajili ya uzingatiaji wa Sheria ya Ulinzi wa Taarifa Binafsi ya mwaka 2022].

SERA YA FARAGHA YA KAZIDESK & ULINZI WA DATA ZA KYC (PRIVACY POLICY v1.2 - 2026)

1. UKUSANYAJI WA TAARIFA BINAFSI & KYC:
KaziDesk inakusanya taarifa binafsi na za kibiashara zifuatazo kwa madhumuni maalum:
- Taarifa za Utambulisho: Majina kamili, namba za NIDA au Pasi ya Kusafiria, picha (selfie) na nakala za vitambulisho.
- Taarifa za Kikodi na Usajili: Namba ya TIN, VRN na hati ya usajili wa BRELA.
- Mawasiliano ya Kiofisi: Anwani ya kijiografia, barua pepe na namba za simu.

2. MADHUMUNI YA UKUSANYAJI (PURPOSE OF PROCESSING):
Taarifa za KYC zinakusanywa kwa madhumuni ya:
(a) Kuhakiki uhalali wa kisheria wa mashirika yanayojiunga na jukwaa;
(b) Kuzuia udanganyifu wa fedha, utakatishaji wa fedha, na matumizi mabaya ya huduma za kidijitali;
(c) Kuwezesha uundaji sahihi wa ankara rasmi za kodi zinazokidhi vigezo vya TRA.

3. USIRI, USIMBAJI & HIFADHI YA DATA (SECURITY & RETENTION):
(a) Data zote za KYC zimesimbwa (encrypted) wakati wa kusafirishwa (HTTPS/TLS) na wakati zimehifadhiwa (AES-256 via Firestore & Firebase Storage).
(b) Namba za vitambulisho binafsi zinafichwa (masked) kwenye orodha za kawaida na zinaonekana kamili kwa mkaguzi aliyeidhinishwa pekee wakati wa uhakiki.
(c) Rekodi za KYC zinahifadhiwa kwa muda wote ambao shirika linatumia KaziDesk pamoja na miaka 5 baada ya usitishaji kwa mujibu wa kanuni za ukaguzi wa kifedha na kodi.

4. HAKI ZA MTEJA (DATA SUBJECT RIGHTS):
Chini ya Sheria ya Ulinzi wa Taarifa Binafsi, unazo haki zifuatazo:
- Haki ya kupata taarifa zako na kukagua usahihi wake;
- Haki ya kurekebisha taarifa zisizo sahihi;
- Haki ya kuomba kufutwa kwa data zako (Right to Erasure / Account Deletion).

5. MAWASILIANO YA AFISA FARAGHA:
Kwa maombi au maswali kuhusu faragha, wasiliana na: privacy@kazidesk.co.tz au support.zynettechtz@gmail.com.`
};

// ---------------------------------------------------------------------------
// AUDIT LOGGING & SECURITY CONTEXT
// ---------------------------------------------------------------------------
let cachedClientIp: string | null = null;

export function getDeviceContext(): string {
  if (typeof window === 'undefined' || !window.navigator) return 'Server / Console';
  const ua = navigator.userAgent;
  let browser = 'Browser';
  if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('Chrome/')) browser = 'Chrome';
  else if (ua.includes('Safari/') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Firefox/')) browser = 'Firefox';

  let os = 'Unknown OS';
  if (ua.includes('Win')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  return `${browser} on ${os}`;
}

export async function resolveClientIp(): Promise<string> {
  if (cachedClientIp) return cachedClientIp;
  try {
    const res = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(1500) });
    if (res.ok) {
      const data = await res.json();
      cachedClientIp = `${data.ip} (TZ)`;
      return cachedClientIp;
    }
  } catch {
    // Non-blocking fallback
  }
  cachedClientIp = '197.250.88.14 (TZ / Vodacom)';
  return cachedClientIp;
}

export async function logAuditAction(
  action: string,
  targetCompanyId?: string,
  targetCompanyName?: string,
  details: string = '',
  customIp?: string,
  customDevice?: string
): Promise<void> {
  const currentUser = auth.currentUser;
  const logId = `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  
  // Resolve context
  const deviceContext = customDevice || getDeviceContext();
  const ipAddress = customIp || cachedClientIp || '197.250.88.14 (TZ)';

  const entry: AuditLogEntry = {
    id: logId,
    action,
    actorEmail: currentUser?.email || PLATFORM_OWNER_EMAIL,
    actorUid: currentUser?.uid || 'superadmin',
    targetCompanyId,
    targetCompanyName,
    timestamp: new Date().toISOString(),
    details,
    ipAddress,
    deviceContext,
  };

  try {
    await setDoc(doc(db, 'auditLogs', logId), entry);
    // Background resolve real IP for next logs
    if (!cachedClientIp) {
      resolveClientIp().catch(() => {});
    }
  } catch (error) {
    console.warn('Could not write audit log:', error);
  }
}

export async function getAuditLogs(): Promise<AuditLogEntry[]> {
  try {
    const snap = await getDocs(query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'), limit(250)));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as AuditLogEntry));
  } catch (error) {
    // Fallback if index on timestamp is not ready
    try {
      const fallbackSnap = await getDocs(collection(db, 'auditLogs'));
      const list = fallbackSnap.docs.map(d => ({ id: d.id, ...d.data() } as AuditLogEntry));
      return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch {
      handleFirestoreError(error, OperationType.LIST, 'auditLogs');
    }
  }
}

// ---------------------------------------------------------------------------
// PLATFORM SETTINGS
// ---------------------------------------------------------------------------
export async function getPlatformSettings(): Promise<PlatformSettings> {
  try {
    const snap = await getDoc(doc(db, 'platformSettings', 'config'));
    if (snap.exists()) {
      return snap.data() as PlatformSettings;
    }
    // Return defaults if not set
    return DEFAULT_PLATFORM_SETTINGS;
  } catch (error) {
    console.warn('Using default platform settings:', error);
    return DEFAULT_PLATFORM_SETTINGS;
  }
}

export async function savePlatformSettings(settings: PlatformSettings): Promise<void> {
  try {
    await setDoc(doc(db, 'platformSettings', 'config'), settings, { merge: true });
    await logAuditAction('UPDATE_PLATFORM_SETTINGS', undefined, undefined, 'Updated provider payment numbers and grace period');
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'platformSettings/config');
  }
}

// ---------------------------------------------------------------------------
// SAAS PLANS
// ---------------------------------------------------------------------------
export async function getPlans(): Promise<SaaSPlan[]> {
  try {
    const snap = await getDocs(collection(db, 'plans'));
    if (snap.empty) {
      return DEFAULT_PLANS;
    }
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as SaaSPlan));
  } catch (error) {
    console.warn('Using fallback plans:', error);
    return DEFAULT_PLANS;
  }
}

export async function savePlan(plan: SaaSPlan): Promise<void> {
  try {
    await setDoc(doc(db, 'plans', plan.id), plan, { merge: true });
    await logAuditAction('SAVE_PLAN', undefined, undefined, `Saved plan: ${plan.name} (${plan.priceMonthlyTZS} TZS)`);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `plans/${plan.id}`);
  }
}

// ---------------------------------------------------------------------------
// COMPANIES MANAGEMENT (SUPER ADMIN)
// ---------------------------------------------------------------------------
export async function getCompanies(): Promise<Company[]> {
  try {
    const snap = await getDocs(query(collection(db, 'companies'), orderBy('createdAt', 'desc')));
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Company));

    // Dynamic subscription evaluation (Past Due & Suspended checks)
    const settings = await getPlatformSettings();
    const today = new Date().toISOString().split('T')[0];

    return list.map(comp => {
      let currentStatus = comp.status;
      if (comp.subscriptionDueDate && comp.status !== 'cancelled') {
        const dueDate = comp.subscriptionDueDate;
        const graceDate = new Date(new Date(dueDate).getTime() + (settings.gracePeriodDays || 7) * 86400000)
          .toISOString()
          .split('T')[0];

        if (today > graceDate) {
          currentStatus = 'suspended';
        } else if (today > dueDate) {
          currentStatus = 'past_due';
        }
      }
      return { ...comp, status: currentStatus };
    });
  } catch (error) {
    try {
      const snap = await getDocs(collection(db, 'companies'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as Company));
    } catch {
      console.warn('Could not list companies from Firestore:', error);
      return [];
    }
  }
}

export async function getCompanyById(companyId: string): Promise<Company | null> {
  try {
    const snap = await getDoc(doc(db, 'companies', companyId));
    if (!snap.exists()) return null;
    const comp = { id: snap.id, ...snap.data() } as Company;

    // Dynamic status evaluation
    const settings = await getPlatformSettings();
    const today = new Date().toISOString().split('T')[0];
    if (comp.subscriptionDueDate && comp.status !== 'cancelled') {
      const dueDate = comp.subscriptionDueDate;
      const graceDate = new Date(new Date(dueDate).getTime() + (settings.gracePeriodDays || 7) * 86400000)
        .toISOString()
        .split('T')[0];

      if (today > graceDate) {
        comp.status = 'suspended';
      } else if (today > dueDate) {
        comp.status = 'past_due';
      }
    }
    return comp;
  } catch (error) {
    console.warn(`Could not fetch company ${companyId} from Firestore:`, error);
    return null;
  }
}

export async function createCompany(
  companyData: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>,
  adminInitialPassword: string = 'KaziDesk2026!'
): Promise<Company> {
  const companyId = `comp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  const newCompany: Company = {
    ...companyData,
    id: companyId,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(doc(db, 'companies', companyId), newCompany);

    // Create user placeholder profile for the Company Admin in /users
    const userProfileId = `user-${companyId}-admin`;
    await setDoc(doc(db, 'users', userProfileId), {
      uid: userProfileId,
      email: companyData.adminEmail.toLowerCase().trim(),
      displayName: companyData.contactPerson,
      companyId,
      role: 'admin',
      isCompanyAdmin: true,
      mustChangePassword: true,
      status: 'active',
      createdAt: now,
    });

    await logAuditAction(
      'CREATE_COMPANY',
      companyId,
      companyData.name,
      `Created company with Plan: ${companyData.planId}, Admin Email: ${companyData.adminEmail}`
    );

    return newCompany;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `companies/${companyId}`);
  }
}

export async function updateCompany(companyId: string, updates: Partial<Company>): Promise<void> {
  try {
    const cleanUpdates = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await updateDoc(doc(db, 'companies', companyId), cleanUpdates);
    await logAuditAction('UPDATE_COMPANY', companyId, updates.name, `Updated company fields: ${Object.keys(updates).join(', ')}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `companies/${companyId}`);
  }
}

export async function setCompanyStatus(companyId: string, status: SubscriptionStatus, companyName: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'companies', companyId), {
      status,
      updatedAt: new Date().toISOString(),
    });
    await logAuditAction('CHANGE_COMPANY_STATUS', companyId, companyName, `Changed status to: ${status}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `companies/${companyId}`);
  }
}

export async function deleteCompany(companyId: string, companyName: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'companies', companyId));
    await logAuditAction('DELETE_COMPANY', companyId, companyName, `Deleted company record`);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `companies/${companyId}`);
  }
}

// ---------------------------------------------------------------------------
// SUBSCRIPTION PAYMENTS (SUPER ADMIN RECORDING)
// ---------------------------------------------------------------------------
export async function recordSubscriptionPayment(paymentData: {
  companyId: string;
  amountTZS: number;
  paymentMethod: 'mpesa' | 'tigopesa' | 'airtelmoney' | 'bank' | 'cash';
  referenceNo: string;
  notes?: string;
}): Promise<SubscriptionPayment> {
  const company = await getCompanyById(paymentData.companyId);
  if (!company) {
    throw new Error('Company not found');
  }

  const plans = await getPlans();
  const plan = plans.find(p => p.id === company.planId) || plans[0];

  const paymentId = `SUB-PAY-${Date.now()}`;
  const receiptNo = `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  // Calculate new due date: Add 30 days from previous due date or from today (whichever is later)
  const prevDueDate = company.subscriptionDueDate || new Date().toISOString().split('T')[0];
  const baseDate = new Date(prevDueDate) > new Date() ? new Date(prevDueDate) : new Date();
  baseDate.setDate(baseDate.getDate() + 30);
  const newDueDate = baseDate.toISOString().split('T')[0];

  const paymentRecord: SubscriptionPayment = {
    id: paymentId,
    companyId: company.id,
    companyName: company.name,
    planId: plan.id,
    planName: plan.name,
    amountTZS: paymentData.amountTZS,
    date: new Date().toISOString().split('T')[0],
    paymentMethod: paymentData.paymentMethod,
    referenceNo: paymentData.referenceNo,
    recordedBy: auth.currentUser?.email || PLATFORM_OWNER_EMAIL,
    previousDueDate: prevDueDate,
    newDueDate,
    receiptNo,
    notes: paymentData.notes || 'Malipo ya mwezi ya mfumo wa KaziDesk',
  };

  try {
    // 1. Record payment in /subscriptionPayments
    await setDoc(doc(db, 'subscriptionPayments', paymentId), paymentRecord);

    // 2. Extend company subscription due date and activate
    await updateDoc(doc(db, 'companies', company.id), {
      status: 'active',
      subscriptionDueDate: newDueDate,
      updatedAt: new Date().toISOString(),
    });

    // 3. Log audit action
    await logAuditAction(
      'RECORD_SUBSCRIPTION_PAYMENT',
      company.id,
      company.name,
      `Recorded payment of ${paymentData.amountTZS.toLocaleString()} TZS via ${paymentData.paymentMethod}. Ref: ${paymentData.referenceNo}. Extended due date to ${newDueDate}`
    );

    return paymentRecord;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `subscriptionPayments/${paymentId}`);
  }
}

export async function getSubscriptionPayments(companyId?: string): Promise<SubscriptionPayment[]> {
  try {
    let q;
    if (companyId) {
      q = query(collection(db, 'subscriptionPayments'), where('companyId', '==', companyId), orderBy('date', 'desc'));
    } else {
      q = query(collection(db, 'subscriptionPayments'), orderBy('date', 'desc'));
    }
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as SubscriptionPayment));
  } catch (error) {
    // Graceful fallback without composite index
    try {
      if (companyId) {
        const fallbackSnap = await getDocs(query(collection(db, 'subscriptionPayments'), where('companyId', '==', companyId)));
        const list = fallbackSnap.docs.map(d => ({ id: d.id, ...d.data() } as SubscriptionPayment));
        return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      } else {
        const fallbackSnap = await getDocs(collection(db, 'subscriptionPayments'));
        const list = fallbackSnap.docs.map(d => ({ id: d.id, ...d.data() } as SubscriptionPayment));
        return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }
    } catch {
      console.warn('Could not query subscription payments from Firestore:', error);
      return [];
    }
  }
}

