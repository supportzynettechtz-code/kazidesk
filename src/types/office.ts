export type UserRole = 'admin' | 'hr' | 'finance' | 'employee';

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  title: string;
  department: string;
  avatarUrl: string;
}

export type Department = 
  | 'Utawala & Uongozi' 
  | 'Rasilimali Watu (HR)' 
  | 'Fedha & Uhasibu' 
  | 'Teknolojia (IT & Mifumo)' 
  | 'Uendeshaji & Usafirishaji' 
  | 'Masoko & Mauzo' 
  | 'Sheria & Mikataba';

export interface Employee {
  id: string;
  employeeNo: string;
  fullName: string;
  email: string;
  phone: string;
  department: Department;
  roleTitle: string;
  joinDate: string;
  contractType: 'Kazi ya Kudumu' | 'Mkataba wa Miaka 2' | 'Mkataba wa Mwaka 1' | 'Majaribio (Probation)';
  basicSalary: number; // in TZS or current currency
  allowances: {
    housing: number;
    transport: number;
    communication: number;
    other: number;
  };
  bankName: string;
  accountNumber: string;
  nssfNumber: string;
  tinNumber: string;
  avatarUrl: string;
  status: 'active' | 'on_leave' | 'probation' | 'terminated';
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  // Security Credentials & Card Details
  pin: string; // 4-digit PIN for Kiosk and verification
  cardId: string; // NFC / RFID / Barcode Card ID e.g. "KD-CARD-001"
  cardIssuedDate: string;
  cardExpiryDate: string;
  biometricFingerprintEnrolled: boolean;
  biometricTemplateId?: string;
  // Account Limitations & Permissions
  accessLevel: 1 | 2 | 3 | 4; // 1: Staff, 2: Supervisor, 3: Manager, 4: Executive Director
  allowedZones: string[]; // e.g. ['Ofisi Kuu', 'Chumba cha Seva', 'Ofisi ya Fedha']
  allowedModules: string[]; // ['attendance', 'tasks', 'documents', 'payroll', 'assets', 'pettyCash']
  maxApprovalAmount?: number;
  shiftHours: { start: string; end: string };
  accountStatus: 'active' | 'suspended' | 'revoked';
  systemRole?: string;
  // Quarterly Performance Evaluations
  performanceReviews?: QuarterlyReview[];
}

export interface QuarterlyReview {
  id: string;
  employeeId: string;
  employeeName: string;
  year: number;
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  reviewDate: string; // YYYY-MM-DD
  reviewerName: string;
  reviewerRole: string;
  // Performance Pillars (1 - 5 stars)
  technicalProficiency: number; // Umahiri wa Kazi
  taskDelivery: number; // Kasi na Ubora wa Majukumu
  teamworkCommunication: number; // Ushirikiano na Mawasiliano
  punctualityReliability: number; // Nidhamu na Mahudhurio
  leadershipInitiative: number; // Ubunifu na Uongozi
  overallScore: number; // Out of 5.0
  ratingCategory: 'Bora Sana (Outstanding)' | 'Nzuri (Good)' | 'Wastani (Satisfactory)' | 'Inahitaji Maboresho (Needs Improvement)' | 'Chini ya Kiwango (Unsatisfactory)';
  keyAchievements: string;
  areasForGrowth: string;
  nextQuarterGoals: string;
  recommendedAction: 'Kupandishwa Cheo (Promotion)' | 'Nyongeza ya Mshahara (Increment)' | 'Kudumisha Wadhifa (Retain)' | 'Mafunzo ya Ziada (Training)' | 'Mpango wa Maboresho (PIP)';
  reviewerNotes?: string;
  employeeComments?: string;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNo: string;
  department: Department;
  date: string; // YYYY-MM-DD
  clockInTime: string; // HH:mm:ss
  clockOutTime?: string; // HH:mm:ss
  totalHours?: number;
  status: 'present' | 'late' | 'half_day' | 'absent' | 'on_leave';
  workLocation: 'office' | 'remote' | 'field';
  verificationMethod?: 'fingerprint' | 'card' | 'pin' | 'web';
  notes?: string;
  ipAddress?: string;
}

export type LeaveType = 
  | 'annual' // Likizo ya Mwaka
  | 'sick' // Likizo ya Ugonjwa
  | 'maternity' // Likizo ya Uzazi (Mama)
  | 'paternity' // Likizo ya Uzazi (Baba)
  | 'compassionate' // Likizo ya Dharura / Msiba
  | 'study'; // Likizo ya Mafunzo

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  department: Department;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  daysCount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: string;
  approvedBy?: string;
  reviewComment?: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TaskChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface OfficeTask {
  id: string;
  title: string;
  description: string;
  department: Department;
  assignedToId: string;
  assignedToName: string;
  priority: TaskPriority;
  status: TaskStatus;
  startDate: string;
  dueDate: string;
  createdAt: string;
  progressPercentage: number;
  checklist: TaskChecklistItem[];
  tags: string[];
}

export interface DailyWorkLog {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  summary: string;
  tasksCompleted: string;
  inProgress: string;
  blockers?: string;
  hoursSpent: number;
  submittedAt: string;
}

export type DocumentCategory = 
  | 'incoming_letter' 
  | 'outgoing_letter' 
  | 'memo' 
  | 'meeting_minutes' 
  | 'contract' 
  | 'policy' 
  | 'financial_report';

export interface OfficeDocument {
  id: string;
  refNumber: string;
  title: string;
  category: DocumentCategory;
  department: Department;
  author: string;
  recipient?: string;
  date: string;
  confidentiality: 'normal' | 'confidential' | 'restricted';
  summary: string;
  content: string;
  tags: string[];
  fileSize?: string;
  status: 'active' | 'archived';
}

export type ApprovalType = 
  | 'procurement' // Ununuzi wa Vifaa
  | 'petty_cash' // Matumizi Madogo
  | 'memo' // Idhini ya Waraka
  | 'travel' // Safari ya Kazi
  | 'asset_allocation'; // Ugawaji wa Rasilimali

export interface ApprovalRequest {
  id: string;
  refNumber: string;
  title: string;
  type: ApprovalType;
  department: Department;
  requesterId: string;
  requesterName: string;
  amount?: number;
  urgency: 'normal' | 'urgent' | 'emergency';
  status: 'pending' | 'approved' | 'rejected';
  description: string;
  createdAt: string;
  reviewedBy?: string;
  reviewDate?: string;
  reviewRemarks?: string;
}

export interface PayrollDeductions {
  nssf: number; // 10%
  paye: number; // Income tax based on tier
  wcf: number; // Workers Compensation Fund 1%
  nhif: number; // Health Insurance
  heslb: number; // Higher Education Students' Loans Board (optional)
  salaryAdvance: number;
  otherDeductions: number;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeNo: string;
  employeeName: string;
  roleTitle: string;
  department: Department;
  bankName: string;
  accountNumber: string;
  basicSalary: number;
  allowances: {
    housing: number;
    transport: number;
    communication: number;
    other: number;
  };
  totalAllowances: number;
  overtimeHours: number;
  overtimePay: number;
  grossSalary: number;
  deductions: PayrollDeductions;
  totalDeductions: number;
  netSalary: number;
  paymentStatus: 'unpaid' | 'paid';
  payslipRef: string;
}

export interface PayrollRun {
  id: string;
  month: string; // e.g. "Machi 2026"
  periodCode: string; // 2026-03
  status: 'draft' | 'approved' | 'disbursed';
  createdAt: string;
  disbursedDate?: string;
  approvedBy?: string;
  totalEmployees: number;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  records: PayrollRecord[];
}

export type AssetCategory = 
  | 'it_hardware' 
  | 'office_furniture' 
  | 'vehicle' 
  | 'network_equipment' 
  | 'appliances';

export interface OfficeAsset {
  id: string;
  assetTag: string; // e.g. "KD-AST-0104"
  name: string;
  category: AssetCategory;
  model: string;
  serialNumber: string;
  purchaseDate: string;
  purchaseCost: number;
  condition: 'excellent' | 'good' | 'needs_repair' | 'damaged';
  status: 'assigned' | 'in_use' | 'in_store' | 'under_maintenance' | 'retired';
  assignedToId?: string;
  assignedToName?: string;
  location: string; // e.g. "Ghorofa ya 2 - Chumba 204"
  warrantyExpiry?: string;
  lastServiceDate?: string;
  notes?: string;
}

export interface ConsumableItem {
  id: string;
  itemCode: string;
  name: string;
  category: 'stationery' | 'cleaning' | 'pantry' | 'electronics';
  unit: string; // e.g. "Rimu (Reams)", "Pakiti (Packs)", "Chupa (Bottles)"
  quantityInStock: number;
  minThreshold: number;
  unitCost: number;
  lastRestocked: string;
  supplier: string;
}

export interface PettyCashVoucher {
  id: string;
  voucherNo: string;
  date: string;
  type: 'disbursement' | 'replenishment';
  category: 'stationery' | 'refreshments' | 'transport' | 'emergency_repair' | 'cleaning_supplies' | 'office_supplies';
  amount: number;
  payeeOrVendor: string;
  description: string;
  requestedBy: string;
  approvedBy: string;
  receiptNumber?: string;
  status: 'settled' | 'pending_receipt';
}

export interface OfficeSettings {
  companyName: string;
  registrationNumber: string;
  taxIdentificationNumber: string;
  address: string;
  email: string;
  phone: string;
  currency: 'TZS' | 'USD';
  nssfRate: number; // 0.10 (10%)
  wcfRate: number; // 0.01 (1%)
  standardWorkHours: number; // 8 hrs
  workStartTime: string; // "08:00"
  workEndTime: string; // "17:00"
  lateGracePeriodMinutes: number; // 15 mins
}

// --- Company Broadcast Announcements (Matangazo ya Super Admin) ---
// --- Company Broadcast Announcements (Matangazo ya Super Admin) ---
export interface CompanyAnnouncement {
  id: string;
  title: string;
  content: string;
  authorName: string;
  authorRole: string; // e.g. "Mkurugenzi Mtendaji (Super Admin)"
  priority: 'urgent' | 'important' | 'general' | 'Dharura' | 'Muhimu' | 'Kawaida';
  category?: string;
  targetAudience: 'all' | 'management' | 'Wote' | 'Idara Maalum' | 'Wasimamizi Tu' | Department;
  date?: string; // YYYY-MM-DD HH:mm
  createdAt?: string;
  expiresAt?: string;
  isPinned: boolean;
  readByEmployeeIds?: string[];
  acknowledgedBy?: string[]; // employee IDs
}

// --- Sales & Marketing Management ---
export interface SalesLead {
  id: string;
  clientName: string;
  companyName?: string;
  company?: string;
  phone: string;
  email: string;
  stage?: 'lead' | 'contacted' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  status?: 'New' | 'Contacted' | 'Proposal' | 'Negotiation' | 'Closed Won' | 'Closed Lost';
  dealValue?: number; // in TZS
  estimatedValue?: number; // in TZS
  assignedToId: string;
  assignedToName: string;
  lastContactDate?: string;
  createdDate?: string;
  closingDateEstimate?: string;
  nextFollowUpDate?: string;
  source?: string;
  notes: string;
  serviceCategory?: string;
}

export interface SalesKPI {
  id: string;
  employeeId: string;
  employeeName: string;
  month?: string; // e.g. "Machi 2026"
  period?: string; // e.g. "Machi 2026"
  targetRevenue: number;
  achievedRevenue: number;
  targetDeals?: number;
  targetDealsClosed?: number;
  closedDeals?: number;
  achievedDealsClosed?: number;
  targetCalls?: number;
  targetCallsOrMeetings?: number;
  completedCalls?: number;
  achievedCallsOrMeetings?: number;
  conversionRate?: number; // %
  commissionEarned?: number;
  status: 'on_track' | 'exceeded' | 'behind' | 'In Progress' | 'Achieved' | 'Missed';
  setBy?: string; // Sales Lead / HOD
  assignedBy?: string;
  lastUpdated?: string;
  notes?: string;
}

export interface SalesReport {
  id: string;
  title?: string;
  salesRepId?: string;
  salesRepName?: string;
  employeeId?: string;
  employeeName?: string;
  date?: string;
  submittedDate?: string;
  period: 'daily' | 'weekly' | 'monthly' | string;
  revenueGenerated: number;
  meetingsHeld?: number;
  callsOrMeetingsDone?: number;
  leadsAdded?: number;
  closedDeals?: number;
  dealsWonCount?: number;
  challenges?: string;
  challengesFaced?: string;
  keyAchievements?: string;
  planForNextPeriod?: string;
  nextWeekPlan?: string;
  status?: 'Submitted' | 'Reviewed';
  feedbackFromHOD?: string;
  hodFeedback?: string;
  reviewedBy?: string;
}

// --- Inventory & Stock Transactions ---
export interface InventoryTransaction {
  id: string;
  itemId: string;
  itemName: string;
  category?: string;
  type: 'stock_in' | 'stock_out' | 'adjustment' | 'return' | 'IN' | 'OUT';
  quantity: number;
  unit?: string;
  unitCost?: number;
  totalCost?: number;
  previousStock?: number;
  newStock?: number;
  referenceNo?: string; // e.g. "GRN-2026-001" au "REQ-2026-042"
  referenceNumber?: string;
  recipientOrSupplier?: string;
  supplier?: string;
  department?: Department | string;
  recipientEmployeeId?: string;
  recipientEmployeeName?: string;
  purpose?: string;
  issuedBy: string;
  date: string;
  notes: string;
}

// --- Virtual Meeting Room & Screen Share ---
export interface MeetingParticipant {
  id: string;
  name: string;
  role: string;
  department?: string;
  avatarUrl?: string;
  isAudioMuted?: boolean;
  isMuted?: boolean;
  isVideoOff?: boolean;
  isScreenSharing?: boolean;
  isSpeaking?: boolean;
  joinedAt?: string;
}

export interface MeetingChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
}

export interface MeetingAgendaItem {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface MeetingRoom {
  id: string;
  title: string;
  roomCode: string;
  hostName: string;
  hostId: string;
  startedAt: string;
  isScreenSharingActive: boolean;
  activeScreenShareUser?: string;
  participants: MeetingParticipant[];
  agenda: Array<MeetingAgendaItem | string>;
  messages?: MeetingChatMessage[];
  status: 'active' | 'scheduled' | 'ended';
}

// ==========================================
// BILLING: QUOTATIONS, INVOICES & CLIENTS
// ==========================================

export interface Client {
  id: string;
  name: string;
  companyName: string;
  phone: string;
  email: string;
  address: string;
  tinNumber: string;
  vrnNumber?: string;
  notes?: string;
  createdAt: string;
}

export interface CatalogueItem {
  id: string;
  code: string;
  name: string;
  description: string;
  unit: string; // e.g. "Saa (Hours)", "Vipande (Pcs)", "Mwezi (Month)", "Mradi (Project)", "Seti"
  unitPrice: number; // in TZS
  category: 'product' | 'service';
  taxable: boolean;
  linkedStockItemId?: string; // Linked ConsumableItem id for auto stock deduction
}

export interface LineItem {
  id: string;
  itemId?: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export type QuotationStatus = 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Expired';
export type InvoiceStatus = 'Draft' | 'Sent' | 'Partially Paid' | 'Paid' | 'Overdue';

export interface Quotation {
  id: string;
  quotationNumber: string; // e.g. "QT-2026-001"
  clientId: string;
  clientName: string;
  clientCompany?: string;
  clientPhone?: string;
  clientEmail?: string;
  clientAddress?: string;
  clientTin?: string;
  clientVrn?: string;
  date: string;
  validUntil: string;
  validityDays: number; // e.g. 14, 30, 60
  items: LineItem[];
  subtotal: number;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  discountAmount: number;
  vatEnabled: boolean;
  vatRate: number; // default 18
  vatAmount: number;
  grandTotal: number;
  currency: 'TZS' | 'USD';
  status: QuotationStatus;
  notes: string;
  terms: string; // Payment terms, warranty, delivery
  salesLeadId?: string; // Connected sales lead
  convertedToInvoiceId?: string; // If converted to invoice
  createdBy: string;
  createdAt: string;
}

export interface InvoicePayment {
  id: string;
  invoiceId: string;
  amount: number;
  date: string;
  method: 'bank_transfer' | 'mobile_money' | 'cash' | 'cheque';
  referenceNumber: string; // e.g. "CRDB-FT-88392" or "MPESA-QK890"
  receivedBy: string;
  notes?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g. "INV-2026-001"
  quotationId?: string;
  quotationNumber?: string;
  clientId: string;
  clientName: string;
  clientCompany?: string;
  clientPhone?: string;
  clientEmail?: string;
  clientAddress?: string;
  clientTin?: string;
  clientVrn?: string;
  date: string;
  dueDate: string;
  items: LineItem[];
  subtotal: number;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  discountAmount: number;
  vatEnabled: boolean;
  vatRate: number;
  vatAmount: number;
  grandTotal: number;
  currency: 'TZS' | 'USD';
  paidAmount: number;
  balanceDue: number;
  status: InvoiceStatus;
  notes: string;
  terms: string;
  bankDetails: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    branch?: string;
    swiftCode?: string;
    mobileMoneyName?: string;
    mobileMoneyNumber?: string;
  };
  payments: InvoicePayment[];
  stockDeducted?: boolean;
  createdBy: string;
  createdAt: string;
}

export interface CompanyBillingProfile {
  companyName: string;
  tradingName?: string;
  tagline?: string;
  logoUrl: string;
  tinNumber: string;
  vrnNumber: string;
  registrationNumber: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch: string;
  swiftCode: string;
  mobileMoneyProvider: string; // e.g. "M-Pesa / Vodacom Lipa Namba"
  mobileMoneyNumber: string; // e.g. "5544332"
  mobileMoneyName: string;
  defaultVatRate: number; // 18
  defaultVatEnabled: boolean;
  defaultPaymentTerms: string;
  defaultQuotationValidityDays: number;
  quotationPrefix: string; // "QT-"
  invoicePrefix: string; // "INV-"
  signatoryName: string;
  signatoryTitle: string;
  signatorySignatureUrl?: string;
  stampUrl?: string;
}

