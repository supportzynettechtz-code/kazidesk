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
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import { KYCApplication, KYCDocumentItem, KYCStatus, DocumentReviewStatus } from '../types/kyc';
import { Company, UserAccount } from '../types/saas';
import { INITIAL_BILLING_PROFILE } from '../data/initialData';
import { logAuditAction } from './tenantService';

const KYC_COLLECTION = 'kycApplications';

/**
 * Creates or updates a customer's KYC draft application.
 */
export async function saveKYCDraft(
  applicationData: Partial<KYCApplication> & { userId: string }
): Promise<string> {
  const now = new Date().toISOString();
  const applicationId = applicationData.id || `kyc_${applicationData.userId}_${Date.now()}`;

  const existingDoc = await getDoc(doc(db, KYC_COLLECTION, applicationId)).catch(() => null);

  const fullData: KYCApplication = {
    id: applicationId,
    userId: applicationData.userId,
    applicantEmail: applicationData.applicantEmail || '',
    applicantName: applicationData.applicantName || '',
    applicantPhone: applicationData.applicantPhone || '',
    currentStep: applicationData.currentStep || 1,
    status: (existingDoc?.data()?.status as KYCStatus) || 'draft',
    businessType: applicationData.businessType || 'registered_company',
    legalName: applicationData.legalName || '',
    tradingName: applicationData.tradingName || '',
    businessSector: applicationData.businessSector || 'Huduma za Kibiashara (Business Services)',
    physicalAddress: applicationData.physicalAddress || '',
    region: applicationData.region || 'Dar es Salaam',
    district: applicationData.district || 'Ilala',
    postalAddress: applicationData.postalAddress || '',
    businessPhone: applicationData.businessPhone || '',
    businessEmail: applicationData.businessEmail || '',
    website: applicationData.website || '',
    numberOfStaff: applicationData.numberOfStaff || 1,
    dateStarted: applicationData.dateStarted || now.split('T')[0],
    preferredPlanId: applicationData.preferredPlanId || 'growth',
    billingContactPerson: applicationData.billingContactPerson || applicationData.applicantName || '',
    billingEmail: applicationData.billingEmail || applicationData.applicantEmail || '',
    preferredPaymentMethod: applicationData.preferredPaymentMethod || 'mpesa',
    invoicingCurrency: applicationData.invoicingCurrency || 'TZS',
    declarationAccepted: applicationData.declarationAccepted ?? false,
    eSignatureName: applicationData.eSignatureName || '',
    eSignatureDate: applicationData.eSignatureDate || now.split('T')[0],
    termsVersionAccepted: applicationData.termsVersionAccepted || 'v1.2 - 2026',
    termsAcceptedTimestamp: applicationData.termsAcceptedTimestamp || now,
    documents: applicationData.documents || existingDoc?.data()?.documents || [],
    companyKyc: applicationData.companyKyc || existingDoc?.data()?.companyKyc,
    soleProprietorKyc: applicationData.soleProprietorKyc || existingDoc?.data()?.soleProprietorKyc,
    isPotentialDuplicate: applicationData.isPotentialDuplicate || false,
    duplicateReasons: applicationData.duplicateReasons || [],
    createdAt: existingDoc?.data()?.createdAt || now,
    updatedAt: now,
  };

  try {
    await setDoc(doc(db, KYC_COLLECTION, applicationId), fullData, { merge: true });
    return applicationId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${KYC_COLLECTION}/${applicationId}`);
    throw error;
  }
}

/**
 * Retrieves the latest KYC application for a given authenticated user ID.
 */
export async function getKYCApplicationByUserId(userId: string): Promise<KYCApplication | null> {
  try {
    const q = query(
      collection(db, KYC_COLLECTION),
      where('userId', '==', userId)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;

    // Return the latest application
    const docs = snap.docs.map(d => d.data() as KYCApplication);
    docs.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
    return docs[0];
  } catch (error) {
    console.warn('KYC fetch notice:', error);
    return null;
  }
}

/**
 * Retrieves a KYC application by document ID.
 */
export async function getKYCApplicationById(applicationId: string): Promise<KYCApplication | null> {
  try {
    const snap = await getDoc(doc(db, KYC_COLLECTION, applicationId));
    if (!snap.exists()) return null;
    return snap.data() as KYCApplication;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${KYC_COLLECTION}/${applicationId}`);
    return null;
  }
}

/**
 * Retrieves all KYC applications for Platform Owner review.
 */
export async function getAllKYCApplications(): Promise<KYCApplication[]> {
  try {
    const snap = await getDocs(collection(db, KYC_COLLECTION));
    const items = snap.docs.map(d => d.data() as KYCApplication);
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return items;
  } catch (error) {
    console.warn('Load all KYC applications notice:', error);
    return [];
  }
}

/**
 * Checks for potential duplicate TIN, BRELA registration number, or email across existing companies and applications.
 */
export async function checkPotentialDuplicates(data: {
  tin?: string;
  brelaNumber?: string;
  email?: string;
  phone?: string;
  excludeAppId?: string;
}): Promise<{ isDuplicate: boolean; reasons: string[] }> {
  const reasons: string[] = [];

  try {
    const cleanTin = (data.tin || '').replace(/[\s-]/g, '').trim();
    const cleanBrela = (data.brelaNumber || '').replace(/[\s-]/g, '').trim().toUpperCase();
    const cleanEmail = (data.email || '').toLowerCase().trim();
    const cleanPhone = (data.phone || '').replace(/[\s\-+()]/g, '').trim();

    if (!cleanTin && !cleanBrela && !cleanEmail && !cleanPhone) {
      return { isDuplicate: false, reasons: [] };
    }

    // 1. Check existing companies
    const companiesSnap = await getDocs(collection(db, 'companies')).catch(() => null);
    if (companiesSnap) {
      companiesSnap.forEach(d => {
        const co = d.data() as Company;
        if (cleanTin && co.tin && co.tin.replace(/[\s-]/g, '').trim() === cleanTin) {
          reasons.push(`Namba ya TIN (${data.tin}) tayari ipo kwenye kampuni iliyosajiliwa: "${co.name}"`);
        }
        if (cleanEmail && co.email && co.email.toLowerCase().trim() === cleanEmail) {
          reasons.push(`Barua pepe (${data.email}) tayari inatumiwa na kampuni: "${co.name}"`);
        }
        if (cleanPhone && co.phone && co.phone.replace(/[\s\-+()]/g, '').trim() === cleanPhone) {
          reasons.push(`Namba ya simu (${data.phone}) tayari inatumiwa na kampuni: "${co.name}"`);
        }
      });
    }

    // 2. Check other submitted KYC applications
    const kycSnap = await getDocs(collection(db, KYC_COLLECTION)).catch(() => null);
    if (kycSnap) {
      kycSnap.forEach(d => {
        const kyc = d.data() as KYCApplication;
        if (kyc.id === data.excludeAppId) return;

        const kycTin = (kyc.companyKyc?.tinNumber || kyc.soleProprietorKyc?.tinNumber || '').replace(/[\s-]/g, '').trim();
        const kycBrela = (kyc.companyKyc?.brelaRegistrationNumber || kyc.soleProprietorKyc?.brelaBusinessNameNumber || '').replace(/[\s-]/g, '').trim().toUpperCase();
        const kycPhone = (kyc.applicantPhone || '').replace(/[\s\-+()]/g, '').trim();

        if (cleanTin && kycTin === cleanTin) {
          reasons.push(`TIN (${data.tin}) imetumika pia kwenye maombi mengine: "${kyc.legalName}" (${kyc.status})`);
        }
        if (cleanBrela && kycBrela && kycBrela === cleanBrela) {
          reasons.push(`Namba ya BRELA (${data.brelaNumber}) imetumika pia kwenye maombi: "${kyc.legalName}"`);
        }
        if (cleanEmail && kyc.applicantEmail && kyc.applicantEmail.toLowerCase().trim() === cleanEmail) {
          reasons.push(`Barua pepe hii (${data.email}) tayari ina maombi mengine ya usajili: "${kyc.legalName}"`);
        }
        if (cleanPhone && kycPhone && kycPhone === cleanPhone) {
          reasons.push(`Namba ya simu (${data.phone}) tayari ipo kwenye maombi mengine: "${kyc.legalName}"`);
        }
      });
    }
  } catch (err) {
    console.warn('Duplicate check warning:', err);
  }

  return {
    isDuplicate: reasons.length > 0,
    reasons
  };
}

/**
 * Uploads a document to Firebase Storage under companies/{applicationId}/kyc/.
 * Fallback to base64 Data-URL if Firebase Storage bucket is not yet provisioned in console.
 */
export async function uploadKYCDocument(
  applicationId: string,
  docType: string,
  file: File
): Promise<KYCDocumentItem> {
  const timestamp = Date.now();
  const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `companies/${applicationId}/kyc/${timestamp}_${docType}_${safeFileName}`;
  const docId = `doc_${timestamp}_${Math.random().toString(36).substring(2, 6)}`;

  let downloadUrl = '';

  try {
    const fileRef = ref(storage, storagePath);
    await uploadBytes(fileRef, file, {
      contentType: file.type || 'application/octet-stream',
      customMetadata: {
        applicationId,
        documentType: docType,
        uploadedAt: new Date().toISOString()
      }
    });
    downloadUrl = await getDownloadURL(fileRef);
  } catch (storageErr) {
    console.warn('Firebase Storage direct upload notice (using secure embedded file reader):', storageErr);
    // Reliable fallback for dev preview environments or before Storage bucket initialization
    downloadUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  const documentItem: KYCDocumentItem = {
    id: docId,
    documentType: docType,
    name: file.name,
    fileUrl: downloadUrl,
    storagePath,
    fileType: file.type,
    fileSize: file.size,
    uploadedAt: new Date().toISOString(),
    reviewStatus: 'pending'
  };

  return documentItem;
}

/**
 * Submits the completed KYC application for Platform Owner review.
 */
export async function submitKYCApplication(
  applicationId: string,
  payload: Partial<KYCApplication>
): Promise<void> {
  const now = new Date().toISOString();

  // Perform duplicate check before submission
  const dupCheck = await checkPotentialDuplicates({
    tin: payload.companyKyc?.tinNumber || payload.soleProprietorKyc?.tinNumber,
    brelaNumber: payload.companyKyc?.brelaRegistrationNumber,
    email: payload.applicantEmail,
    excludeAppId: applicationId
  });

  const updates: Partial<KYCApplication> = {
    ...payload,
    status: 'submitted',
    submittedAt: now,
    updatedAt: now,
    isPotentialDuplicate: dupCheck.isDuplicate,
    duplicateReasons: dupCheck.reasons
  };

  try {
    await updateDoc(doc(db, KYC_COLLECTION, applicationId), updates);

    // Record in-app notification / mail trigger
    try {
      await setDoc(doc(db, 'mail', `kyc_sub_${applicationId}`), {
        to: payload.applicantEmail,
        message: {
          subject: 'KaziDesk - Maombi Yako ya Usajili Yamepokelewa (KYC Submitted)',
          text: `Habari ${payload.applicantName},\n\nMaombi ya kusajili shirika lako "${payload.legalName}" yamepokelewa kikamilifu. Timu ya KaziDesk inakagua nyaraka zako na tutakujulisha mara tu yatakapoidhinishwa.\n\nAsante kwa kuchagua KaziDesk.`
        },
        createdAt: now
      });
    } catch {
      // In-app log fallback
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${KYC_COLLECTION}/${applicationId}`);
    throw error;
  }
}

/**
 * Platform Owner reviews an application: approves, rejects, or requests more information.
 */
export async function reviewKYCApplication(
  applicationId: string,
  params: {
    status: KYCStatus;
    checklist?: Record<string, { status: DocumentReviewStatus; comment: string }>;
    ownerNotes?: string;
    rejectionReason?: string;
    moreInfoNotes?: string;
    reviewerEmail: string;
  }
): Promise<void> {
  const now = new Date().toISOString();
  const currentApp = await getKYCApplicationById(applicationId);
  if (!currentApp) throw new Error('Maombi ya KYC hayakupatikana.');

  // Update document checklist statuses
  let updatedDocuments = [...(currentApp.documents || [])];
  if (params.checklist) {
    updatedDocuments = updatedDocuments.map(docItem => {
      const check = params.checklist![docItem.id] || params.checklist![docItem.documentType];
      if (check) {
        return {
          ...docItem,
          reviewStatus: check.status,
          reviewComment: check.comment
        };
      }
      return docItem;
    });
  }

  const updates: Partial<KYCApplication> = {
    status: params.status,
    documents: updatedDocuments,
    ownerReviewNotes: params.ownerNotes || currentApp.ownerReviewNotes,
    rejectionReason: params.rejectionReason || currentApp.rejectionReason,
    moreInfoRequestedNotes: params.moreInfoNotes || currentApp.moreInfoRequestedNotes,
    reviewedBy: params.reviewerEmail,
    reviewedAt: now,
    updatedAt: now
  };

  await updateDoc(doc(db, KYC_COLLECTION, applicationId), updates);

  // Log Audit Action
  await logAuditAction(
    `KYC_REVIEW_${params.status.toUpperCase()}`,
    params.reviewerEmail,
    currentApp.assignedCompanyId || 'pending_company',
    currentApp.legalName,
    `KYC Review Status changed to ${params.status}. Notes: ${params.ownerNotes || params.rejectionReason || params.moreInfoNotes || 'N/A'}`
  );
}

/**
 * Platform Owner approves an application:
 * 1. Provisions the new Company document in /companies/{companyId} with 14-day trial
 * 2. Provisions the Company Admin user in /users/{userId}
 * 3. Marks KYC application as 'approved'
 * 4. Seeds company with default billing profile
 */
export async function approveAndProvisionCompany(
  application: KYCApplication,
  reviewerEmail: string
): Promise<{ companyId: string }> {
  const now = new Date().toISOString();
  const companyId = `comp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  // Default 14-day trial per platform rules
  const trialDays = 14;
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + trialDays);

  const rawTin = application.companyKyc?.tinNumber || application.soleProprietorKyc?.tinNumber || '100-000-000';
  const rawVrn = application.companyKyc?.vrnNumber || '';

  const newCompany: Company = {
    id: companyId,
    name: application.legalName || application.tradingName || 'Kampuni Mpya',
    tin: rawTin,
    vrn: rawVrn,
    address: `${application.physicalAddress}, ${application.district}, ${application.region}, Tanzania`,
    contactPerson: application.applicantName,
    phone: application.applicantPhone || application.businessPhone,
    email: application.applicantEmail || application.businessEmail,
    planId: application.preferredPlanId || 'growth',
    status: 'trial',
    subscriptionStartDate: now.split('T')[0],
    subscriptionDueDate: dueDate.toISOString().split('T')[0],
    adminEmail: application.applicantEmail,
    adminUid: application.userId,
    isOnboarded: false,
    createdAt: now,
    updatedAt: now,
  };

  // 1. Create company in Firestore
  await setDoc(doc(db, 'companies', companyId), newCompany);

  // 2. Set up Company Admin account in Firestore /users/{userId}
  const userAccount: UserAccount = {
    uid: application.userId,
    email: application.applicantEmail,
    displayName: application.applicantName,
    companyId: companyId,
    role: 'admin',
    isCompanyAdmin: true,
    mustChangePassword: false,
    isOnboarded: false,
    status: 'active',
    createdAt: now,
  };
  await setDoc(doc(db, 'users', application.userId), userAccount, { merge: true });

  // 3. Seed initial billing profile under company
  await setDoc(doc(db, `companies/${companyId}/billingProfile`, 'default'), {
    ...INITIAL_BILLING_PROFILE,
    companyName: newCompany.name,
    tinNumber: rawTin,
    vrnNumber: rawVrn,
    phone: newCompany.phone,
    email: newCompany.email,
    address: newCompany.address,
    city: application.region || 'Dar es Salaam',
    country: 'Tanzania',
    signatoryName: application.applicantName,
    companyId
  }, { merge: true });

  // 4. Update KYC application
  await updateDoc(doc(db, KYC_COLLECTION, application.id), {
    status: 'approved',
    assignedCompanyId: companyId,
    reviewedBy: reviewerEmail,
    reviewedAt: now,
    updatedAt: now
  });

  // 5. Audit Log
  await logAuditAction(
    'KYC_APPLICATION_APPROVED',
    reviewerEmail,
    companyId,
    newCompany.name,
    `Approved KYC application ${application.id}. Created company workspace with ${trialDays}-day trial on plan ${newCompany.planId}.`
  );

  return { companyId };
}

/**
 * Submits a GDPR/Tanzania Data Protection Act account & KYC data deletion request.
 */
export async function requestAccountDataDeletion(
  userId: string,
  email: string,
  reason: string
): Promise<void> {
  const reqId = `del_req_${Date.now()}`;
  await setDoc(doc(db, 'deletionRequests', reqId), {
    id: reqId,
    userId,
    email,
    reason,
    status: 'pending_review',
    requestedAt: new Date().toISOString()
  });

  await logAuditAction(
    'DATA_DELETION_REQUESTED',
    email,
    'user_request',
    email,
    `Customer submitted account & personal data deletion request. Reason: ${reason}`
  );
}
