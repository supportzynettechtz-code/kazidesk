/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'suspended' | 'cancelled';

export interface Company {
  id: string;
  name: string;
  tin: string;
  vrn?: string;
  address: string;
  contactPerson: string;
  phone: string;
  email: string;
  logoUrl?: string;
  brandColor?: string;
  isOnboarded?: boolean;
  planId: string;
  status: SubscriptionStatus;
  subscriptionStartDate: string;
  subscriptionDueDate: string;
  adminEmail: string;
  adminUid?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaaSPlan {
  id: string;
  name: string;
  priceMonthlyTZS: number;
  maxStaff: number;
  maxInvoicesPerMonth: number;
  features: string[];
  enabledModules: string[]; // e.g. ['attendance', 'tasks', 'billing', 'payroll', 'inventory', 'sales', 'meetings']
  isActive: boolean;
}

export interface SubscriptionPayment {
  id: string;
  companyId: string;
  companyName: string;
  planId: string;
  planName: string;
  amountTZS: number;
  date: string;
  paymentMethod: 'mpesa' | 'tigopesa' | 'airtelmoney' | 'bank' | 'cash';
  referenceNo: string;
  recordedBy: string;
  previousDueDate: string;
  newDueDate: string;
  receiptNo: string;
  notes?: string;
}

export interface PlatformSettings {
  ownerEmail: string;
  ownerPhone: string;
  supportWhatsApp?: string;
  supportEmail?: string;
  ownerCompanyName: string;
  platformName?: string;
  platformLogoUrl?: string;
  mpesaLipaNamba: string;
  tigoPesaLipaNamba: string;
  airtelMoneyLipaNamba: string;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankBranch: string;
  gracePeriodDays: number;
  termsOfService?: string;
  privacyPolicy?: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  actorEmail: string;
  actorUid: string;
  targetCompanyId?: string;
  targetCompanyName?: string;
  timestamp: string;
  details: string;
  ipAddress?: string;
  deviceContext?: string;
}

export interface UserAccount {
  uid: string;
  email: string;
  displayName: string;
  companyId: string; // 'platform' for Super Admin
  role: 'superadmin' | 'admin' | 'hr' | 'accountant' | 'sales' | 'staff';
  isCompanyAdmin: boolean;
  mustChangePassword?: boolean;
  isOnboarded?: boolean;
  status: 'active' | 'disabled';
  kycStatus?: 'draft' | 'submitted' | 'under_review' | 'more_info_required' | 'approved' | 'rejected';
  kycApplicationId?: string;
  createdAt: string;
}
