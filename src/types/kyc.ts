/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type BusinessType = 'registered_company' | 'sole_proprietor';

export type KYCStatus = 
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'more_info_required'
  | 'approved'
  | 'rejected';

export type DocumentReviewStatus = 'pending' | 'verified' | 'not_clear' | 'rejected';

export interface KYCDocumentItem {
  id: string;
  documentType: string;
  name: string;
  fileUrl: string;
  storagePath?: string;
  fileType: string; // e.g. 'application/pdf', 'image/jpeg'
  fileSize: number;
  uploadedAt: string;
  reviewStatus: DocumentReviewStatus;
  reviewComment?: string;
}

export interface DirectorKYC {
  id: string;
  fullName: string;
  idType: 'nida' | 'passport' | 'driving_licence' | 'voter_id';
  idNumber: string; // Will be masked in general views
  idDocumentUrl?: string;
  idDocumentName?: string;
  shareholdingPercentage: number;
  isRepresentative?: boolean;
}

export interface AuthorizedRepresentativeKYC {
  fullName: string;
  role: string;
  phone: string;
  email: string;
  idType: 'nida' | 'passport' | 'driving_licence' | 'voter_id';
  idNumber: string;
  idDocumentUrl?: string;
  idDocumentName?: string;
  letterOfAuthorizationUrl?: string;
  letterOfAuthorizationName?: string;
}

export interface SoleProprietorKYC {
  fullName: string;
  dateOfBirth: string;
  idType: 'nida' | 'passport' | 'driving_licence' | 'voter_id';
  idNumber: string;
  idFrontUrl?: string;
  idFrontName?: string;
  idBackUrl?: string;
  idBackName?: string;
  selfieUrl?: string;
  selfieName?: string;
  tinNumber: string;
  tinCertificateUrl?: string;
  tinCertificateName?: string;
  businessLicenceNumber?: string;
  businessLicenceUrl?: string;
  businessLicenceName?: string;
  proofOfAddressUrl?: string;
  proofOfAddressName?: string;
  brelaBusinessNameNumber?: string;
}

export interface RegisteredCompanyKYC {
  brelaRegistrationNumber: string;
  tinNumber: string;
  tinCertificateUrl?: string;
  tinCertificateName?: string;
  vrnNumber?: string;
  vrnCertificateUrl?: string;
  vrnCertificateName?: string;
  businessLicenceNumber: string;
  businessLicenceIssueDate?: string;
  businessLicenceExpiryDate?: string;
  businessLicenceUrl?: string;
  businessLicenceName?: string;
  taxClearanceUrl?: string;
  taxClearanceName?: string;
  memartsUrl?: string;
  memartsName?: string;
  directors: DirectorKYC[];
  representative?: AuthorizedRepresentativeKYC;
}

export interface KYCApplication {
  id: string;
  userId: string; // Firebase Auth UID
  applicantEmail: string;
  applicantName: string;
  applicantPhone: string;
  currentStep: number;
  status: KYCStatus;
  
  // Step 2: Business Type
  businessType: BusinessType;
  
  // Step 3: Business Details
  legalName: string;
  tradingName: string;
  businessSector: string;
  physicalAddress: string;
  region: string;
  district: string;
  postalAddress?: string;
  businessPhone: string;
  businessEmail: string;
  website?: string;
  numberOfStaff: number;
  dateStarted: string;
  
  // Step 4 or 5: Structured KYC
  companyKyc?: RegisteredCompanyKYC;
  soleProprietorKyc?: SoleProprietorKYC;
  
  // Step 6: Billing & Plan
  preferredPlanId: string;
  billingContactPerson: string;
  billingEmail: string;
  preferredPaymentMethod: 'mpesa' | 'tigopesa' | 'airtelmoney' | 'bank';
  invoicingCurrency: 'TZS' | 'USD';
  
  // Step 7: Review & Submission
  declarationAccepted: boolean;
  eSignatureName: string;
  eSignatureDate: string;
  termsVersionAccepted: string;
  termsAcceptedTimestamp: string;
  
  // All attached documents
  documents: KYCDocumentItem[];
  
  // Review outcomes
  assignedCompanyId?: string;
  ownerReviewNotes?: string;
  rejectionReason?: string;
  moreInfoRequestedNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  
  // Duplicate check flags
  isPotentialDuplicate?: boolean;
  duplicateReasons?: string[];
  
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
}

export interface SecuritySessionState {
  lastActiveTimestamp: number;
  failedLoginAttempts: number;
  lockedUntilTimestamp?: number;
  mfaVerified?: boolean;
}
