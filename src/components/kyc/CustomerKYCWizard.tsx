/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  User,
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Save,
  ShieldCheck,
  Eye,
  EyeOff,
  Trash2,
  Plus,
  Lock,
  Globe,
  CreditCard,
  Briefcase,
  Layers,
  Sparkles,
  Info,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Clock,
  HelpCircle,
  FileCheck,
  Check,
  Send,
  MessageSquare,
  AlertTriangle,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import {
  BusinessType,
  KYCApplication,
  KYCDocumentItem,
  DirectorKYC,
  AuthorizedRepresentativeKYC,
  RegisteredCompanyKYC,
  SoleProprietorKYC
} from '../../types/kyc';
import { SaaSPlan, PlatformSettings } from '../../types/saas';
import {
  saveKYCDraft,
  submitKYCApplication,
  uploadKYCDocument,
  checkPotentialDuplicates
} from '../../services/kycService';
import { registerApplicantUser, resendVerificationEmail } from '../../services/authService';
import {
  evaluatePasswordStrength,
  maskIdNumber,
  normalizeTanzaniaPhone,
  isFreeEmailProvider
} from '../../services/securityService';
import { auth } from '../../firebase/config';
import { mapFirebaseAuthError, logAdminDiagnostic, FriendlyErrorMessage } from '../../firebase/errors';
import { DocumentPreviewModal } from '../common/DocumentPreviewModal';
import { TermsPrivacyModal } from '../common/TermsPrivacyModal';
import { translations } from '../../utils/translations';
import { formatCurrency } from '../../utils/formatters';

const TANZANIA_REGIONS = [
  'Dar es Salaam',
  'Arusha',
  'Dodoma',
  'Mwanza',
  'Kilimanjaro',
  'Mbeya',
  'Morogoro',
  'Tanga',
  'Zanzibar (Mjini Magharibi)',
  'Zanzibar (Kaskazini Unguja)',
  'Zanzibar (Kusini Unguja)',
  'Pemba Kaskazini',
  'Pemba Kusini',
  'Iringa',
  'Kagera',
  'Kigoma',
  'Mara',
  'Manyara',
  'Geita',
  'Simiyu',
  'Singida',
  'Tabora',
  'Ruvuma',
  'Mtwara',
  'Lindi',
  'Rukwa',
  'Katavi',
  'Njombe',
  'Songwe'
];

interface CustomerKYCWizardProps {
  initialApplication?: KYCApplication | null;
  currentUserId?: string;
  applicantEmail?: string;
  plans: SaaSPlan[];
  settings?: PlatformSettings | null;
  lang: 'sw' | 'en';
  onToggleLang: () => void;
  onSubmitted: (applicationId: string) => void;
  onCancel: () => void;
}

export const CustomerKYCWizard: React.FC<CustomerKYCWizardProps> = ({
  initialApplication,
  currentUserId,
  applicantEmail = '',
  plans,
  settings,
  lang,
  onToggleLang,
  onSubmitted,
  onCancel
}) => {
  const supportEmail = settings?.supportEmail || settings?.ownerEmail || 'support.zynettechtz@gmail.com';
  const supportPhone = settings?.supportWhatsApp || settings?.ownerPhone || '+255775740386';
  const cleanWhatsAppNumber = supportPhone.replace(/[^0-9]/g, '');

  const [currentStep, setCurrentStep] = useState<number>(initialApplication?.currentStep || 1);
  const [userId, setUserId] = useState<string>(currentUserId || initialApplication?.userId || '');
  const [appId, setAppId] = useState<string>(initialApplication?.id || '');

  // Step 1: Account (used if user not already authenticated)
  const [applicantName, setApplicantName] = useState(initialApplication?.applicantName || '');
  const [email, setEmail] = useState(applicantEmail || initialApplication?.applicantEmail || '');
  const [phone, setPhone] = useState(initialApplication?.applicantPhone || '+255 ');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(Boolean(initialApplication?.termsAcceptedTimestamp));
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [termsTab, setTermsTab] = useState<'terms' | 'privacy'>('terms');

  // Step 2: Business Type
  const [businessType, setBusinessType] = useState<BusinessType>(initialApplication?.businessType || 'registered_company');

  // Step 3: Business Details
  const [legalName, setLegalName] = useState(initialApplication?.legalName || '');
  const [tradingName, setTradingName] = useState(initialApplication?.tradingName || '');
  const [businessSector, setBusinessSector] = useState(initialApplication?.businessSector || 'Teknolojia & TEHAMA');
  const [physicalAddress, setPhysicalAddress] = useState(initialApplication?.physicalAddress || '');
  const [region, setRegion] = useState(initialApplication?.region || 'Dar es Salaam');
  const [district, setDistrict] = useState(initialApplication?.district || 'Ilala');
  const [postalAddress, setPostalAddress] = useState(initialApplication?.postalAddress || '');
  const [businessPhone, setBusinessPhone] = useState(initialApplication?.businessPhone || '+255 ');
  const [businessEmail, setBusinessEmail] = useState(initialApplication?.businessEmail || '');
  const [website, setWebsite] = useState(initialApplication?.website || '');
  const [numberOfStaff, setNumberOfStaff] = useState<number>(initialApplication?.numberOfStaff || 5);
  const [dateStarted, setDateStarted] = useState(initialApplication?.dateStarted || new Date().toISOString().split('T')[0]);

  // Step 4: Registered Company KYC State
  const [brelaNumber, setBrelaNumber] = useState(initialApplication?.companyKyc?.brelaRegistrationNumber || '');
  const [tinNumber, setTinNumber] = useState(initialApplication?.companyKyc?.tinNumber || initialApplication?.soleProprietorKyc?.tinNumber || '');
  const [vrnNumber, setVrnNumber] = useState(initialApplication?.companyKyc?.vrnNumber || '');
  const [licenceNumber, setLicenceNumber] = useState(initialApplication?.companyKyc?.businessLicenceNumber || initialApplication?.soleProprietorKyc?.businessLicenceNumber || '');
  const [licenceIssueDate, setLicenceIssueDate] = useState(initialApplication?.companyKyc?.businessLicenceIssueDate || '');
  const [licenceExpiryDate, setLicenceExpiryDate] = useState(initialApplication?.companyKyc?.businessLicenceExpiryDate || '');

  // Directors list
  const [directors, setDirectors] = useState<DirectorKYC[]>(initialApplication?.companyKyc?.directors || [
    {
      id: 'dir_1',
      fullName: '',
      idType: 'nida',
      idNumber: '',
      shareholdingPercentage: 100,
      isRepresentative: true
    }
  ]);

  // Authorized representative
  const [representative, setRepresentative] = useState<AuthorizedRepresentativeKYC>(initialApplication?.companyKyc?.representative || {
    fullName: '',
    role: 'Mkurugenzi Mkuu (CEO)',
    phone: '+255 ',
    email: '',
    idType: 'nida',
    idNumber: ''
  });

  // Step 5: Sole Proprietor KYC State
  const [soleOwnerName, setSoleOwnerName] = useState(initialApplication?.soleProprietorKyc?.fullName || '');
  const [soleDob, setSoleDob] = useState(initialApplication?.soleProprietorKyc?.dateOfBirth || '1990-01-01');
  const [soleIdType, setSoleIdType] = useState<SoleProprietorKYC['idType']>(initialApplication?.soleProprietorKyc?.idType || 'nida');
  const [soleIdNumber, setSoleIdNumber] = useState(initialApplication?.soleProprietorKyc?.idNumber || '');
  const [soleBrelaNameNumber, setSoleBrelaNameNumber] = useState(initialApplication?.soleProprietorKyc?.brelaBusinessNameNumber || '');

  // Uploaded Documents Array
  const [documents, setDocuments] = useState<KYCDocumentItem[]>(initialApplication?.documents || []);

  // Step 6: Preferred Plan & Billing
  const [preferredPlanId, setPreferredPlanId] = useState(initialApplication?.preferredPlanId || 'growth');
  const [billingContactPerson, setBillingContactPerson] = useState(initialApplication?.billingContactPerson || '');
  const [billingEmail, setBillingEmail] = useState(initialApplication?.billingEmail || '');
  const [preferredPaymentMethod, setPreferredPaymentMethod] = useState<'mpesa' | 'tigopesa' | 'airtelmoney' | 'bank'>(
    initialApplication?.preferredPaymentMethod || 'mpesa'
  );
  const [invoicingCurrency, setInvoicingCurrency] = useState<'TZS' | 'USD'>(initialApplication?.invoicingCurrency || 'TZS');

  // Step 7: Review & Submission
  const [declarationAccepted, setDeclarationAccepted] = useState(initialApplication?.declarationAccepted || false);
  const [eSignatureName, setESignatureName] = useState(initialApplication?.eSignatureName || '');
  const [eSignatureDate, setESignatureDate] = useState(initialApplication?.eSignatureDate || new Date().toISOString().split('T')[0]);

  // UI state
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingDocType, setUploadingDocType] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Duplicate Check Result
  const [duplicateWarning, setDuplicateWarning] = useState<string[] | null>(null);

  // Document Preview Modal
  const [previewDoc, setPreviewDoc] = useState<{ title: string; fileUrl: string; fileType?: string; fileName?: string } | null>(null);

  // Password Visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validation & Error Handling
  const [inlineErrors, setInlineErrors] = useState<Record<string, string>>({});
  const [stepErrors, setStepErrors] = useState<string[]>([]);
  const [configErrorDiagnostic, setConfigErrorDiagnostic] = useState<FriendlyErrorMessage | null>(null);

  // Email Verification & Resend Cooldown
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const [showEmailVerifyBlockModal, setShowEmailVerifyBlockModal] = useState(false);

  // Final Confirmation View State
  const [isSubmittedConfirmation, setIsSubmittedConfirmation] = useState(false);

  // Field Focus Refs
  const applicantNameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);
  const termsRef = useRef<HTMLInputElement>(null);
  const legalNameRef = useRef<HTMLInputElement>(null);
  const physicalAddressRef = useRef<HTMLInputElement>(null);
  const eSignatureRef = useRef<HTMLInputElement>(null);
  const errorBoxRef = useRef<HTMLDivElement>(null);

  // Password strength
  const pwdStrength = evaluatePasswordStrength(password);

  // 60-second Cooldown Timer Effect
  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Synchronize initial data if loaded
  useEffect(() => {
    if (initialApplication) {
      setCurrentStep(initialApplication.currentStep || 1);
      setAppId(initialApplication.id);
      setUserId(initialApplication.userId);
    }
  }, [initialApplication]);

  // Build current application payload
  const buildCurrentPayload = (): Partial<KYCApplication> => {
    const companyKycData: RegisteredCompanyKYC = {
      brelaRegistrationNumber: brelaNumber,
      tinNumber,
      vrnNumber,
      businessLicenceNumber: licenceNumber,
      businessLicenceIssueDate: licenceIssueDate,
      businessLicenceExpiryDate: licenceExpiryDate,
      directors,
      representative
    };

    const soleKycData: SoleProprietorKYC = {
      fullName: soleOwnerName || applicantName,
      dateOfBirth: soleDob,
      idType: soleIdType,
      idNumber: soleIdNumber,
      tinNumber,
      businessLicenceNumber: licenceNumber,
      brelaBusinessNameNumber: soleBrelaNameNumber
    };

    return {
      id: appId,
      userId,
      applicantName,
      applicantEmail: email,
      applicantPhone: phone,
      currentStep,
      businessType,
      legalName,
      tradingName,
      businessSector,
      physicalAddress,
      region,
      district,
      postalAddress,
      businessPhone,
      businessEmail: businessEmail || email,
      website,
      numberOfStaff,
      dateStarted,
      companyKyc: businessType === 'registered_company' ? companyKycData : undefined,
      soleProprietorKyc: businessType === 'sole_proprietor' ? soleKycData : undefined,
      preferredPlanId,
      billingContactPerson: billingContactPerson || applicantName,
      billingEmail: billingEmail || email,
      preferredPaymentMethod,
      invoicingCurrency,
      declarationAccepted,
      eSignatureName,
      eSignatureDate,
      termsVersionAccepted: 'v1.2 - 2026',
      termsAcceptedTimestamp: termsAccepted ? (initialApplication?.termsAcceptedTimestamp || new Date().toISOString()) : '',
      documents
    };
  };

  // Resend Email Verification (with 60-second cooldown)
  const handleResendVerification = async () => {
    if (resendCooldown > 0 || isResendingEmail) return;
    setIsResendingEmail(true);
    setErrorMessage(null);
    try {
      await resendVerificationEmail();
      setResendCooldown(60);
      setEmailVerificationSent(true);
      setSuccessToast(
        lang === 'sw'
          ? 'Kiungo kipya cha uthibitisho kimetumwa kwenye barua pepe yako!'
          : 'A new verification link has been sent to your email!'
      );
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: any) {
      const mapped = mapFirebaseAuthError(err, email);
      setErrorMessage(lang === 'sw' ? mapped.sw : mapped.en);
    } finally {
      setIsResendingEmail(false);
    }
  };

  // Autosave / Save Draft
  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    setErrorMessage(null);
    setStepErrors([]);
    setInlineErrors({});
    try {
      let activeUserId = userId;
      // If Step 1, create Firebase Auth account if not yet signed in
      if (!activeUserId && email && password) {
        if (!termsAccepted) {
          throw new Error(lang === 'sw' ? 'Tafadhali kubaliana na Sheria na Masharti ili kuanza.' : 'Please accept the Terms of Service to proceed.');
        }
        const phoneNorm = normalizeTanzaniaPhone(phone);
        const cleanPhone = phoneNorm.isValid ? phoneNorm.normalized : phone;
        const createdUser = await registerApplicantUser(email, password, applicantName, cleanPhone);
        activeUserId = createdUser.uid;
        setUserId(activeUserId);
        setEmailVerificationSent(true);
        setResendCooldown(60);
      }

      if (!activeUserId) {
        throw new Error(lang === 'sw' ? 'Weka taarifa za akaunti (barua pepe na nenosiri) kwanza ili kuhifadhi rasimu.' : 'Please enter your account details (email and password) first to save draft.');
      }

      const payload = { ...buildCurrentPayload(), userId: activeUserId };
      const savedId = await saveKYCDraft(payload);
      setAppId(savedId);
      setSuccessToast(lang === 'sw' ? 'Rasimu imehifadhiwa salama!' : 'Draft saved successfully!');
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err: any) {
      const mapped = mapFirebaseAuthError(err, email);
      setErrorMessage(lang === 'sw' ? mapped.sw : mapped.en);
      setStepErrors([lang === 'sw' ? mapped.sw : mapped.en]);
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Handle Document Upload
  const handleFileUpload = async (docType: string, file: File, label: string) => {
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage(lang === 'sw' ? 'Faili linazidi kikomo cha MB 10.' : 'File exceeds 10MB limit.');
      return;
    }

    setUploadingDocType(docType);
    setErrorMessage(null);

    try {
      const activeAppId = appId || `draft_${Date.now()}`;
      const uploadedItem = await uploadKYCDocument(activeAppId, docType, file);
      uploadedItem.name = `${label} (${file.name})`;

      // Replace previous document of the same type or append
      const filtered = documents.filter(d => d.documentType !== docType);
      const nextDocs = [...filtered, uploadedItem];
      setDocuments(nextDocs);

      setSuccessToast(lang === 'sw' ? `Nyaraka ya "${label}" imepakiwa!` : `"${label}" uploaded successfully!`);
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || (lang === 'sw' ? 'Hitilafu wakati wa kupakia faili.' : 'Failed to upload document.'));
    } finally {
      setUploadingDocType(null);
    }
  };

  // Remove document
  const handleRemoveDoc = (docId: string) => {
    setDocuments(prev => prev.filter(d => d.id !== docId));
  };

  // Step Navigation
  const handleNext = async () => {
    setErrorMessage(null);
    setStepErrors([]);
    setInlineErrors({});
    setConfigErrorDiagnostic(null);

    // Validate Step 1
    if (currentStep === 1) {
      const newInline: Record<string, string> = {};
      const newErrors: string[] = [];

      // 1. Full name validation: at least 2 words
      const nameWords = applicantName.trim().split(/\s+/).filter(Boolean);
      if (!applicantName.trim()) {
        newInline.applicantName = lang === 'sw' ? 'Jina lako kamili linahitajika.' : 'Your full name is required.';
        newErrors.push(newInline.applicantName);
      } else if (nameWords.length < 2) {
        newInline.applicantName = lang === 'sw' ? 'Weka angalau majina mawili (jina la kwanza na la ukoo).' : 'Please enter at least two words (first and last name).';
        newErrors.push(newInline.applicantName);
      }

      // 2. Phone normalization and format check
      const phoneNorm = normalizeTanzaniaPhone(phone);
      if (!phone.trim() || phone.trim() === '+255') {
        newInline.phone = lang === 'sw' ? 'Namba ya simu ya mkononi inahitajika.' : 'Mobile phone number is required.';
        newErrors.push(newInline.phone);
      } else if (!phoneNorm.isValid) {
        newInline.phone = lang === 'sw' ? (phoneNorm.error || 'Namba ya simu si sahihi.') : 'Phone number must be a valid Tanzanian mobile number (+255).';
        newErrors.push(newInline.phone);
      } else {
        setPhone(phoneNorm.normalized);
      }

      // 3. Email validation
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        newInline.email = lang === 'sw' ? 'Weka barua pepe sahihi (mfano: jina@kampuni.co.tz).' : 'Please enter a valid work email address.';
        newErrors.push(newInline.email);
      }

      // 4. Password validation (if not already authenticated)
      if (!userId) {
        if (!password) {
          newInline.password = lang === 'sw' ? 'Nenosiri linahitajika.' : 'Password is required.';
          newErrors.push(newInline.password);
        } else if (!pwdStrength.isAcceptable) {
          newInline.password = lang === 'sw'
            ? 'Nenosiri linapaswa kuwa na angalau herufi 10 likiwa na herufi kubwa, ndogo, namba na alama maalum.'
            : 'Password must be at least 10 characters long with uppercase, lowercase, numbers, and symbols.';
          newErrors.push(newInline.password);
        }

        if (password && password !== confirmPassword) {
          newInline.confirmPassword = lang === 'sw' ? 'Nenosiri na uthibitisho havilingani.' : 'Passwords do not match.';
          newErrors.push(newInline.confirmPassword);
        }

        if (!termsAccepted) {
          newInline.terms = lang === 'sw' ? 'Ni lazima ukubaliane na Sheria na Masharti ya Huduma.' : 'You must accept the Terms of Service and Privacy Policy.';
          newErrors.push(newInline.terms);
        }
      }

      setInlineErrors(newInline);
      setStepErrors(newErrors);

      // Focus first invalid element
      if (newErrors.length > 0) {
        if (newInline.applicantName) applicantNameRef.current?.focus();
        else if (newInline.phone) phoneRef.current?.focus();
        else if (newInline.email) emailRef.current?.focus();
        else if (newInline.password) passwordRef.current?.focus();
        else if (newInline.confirmPassword) confirmPasswordRef.current?.focus();
        else if (newInline.terms) termsRef.current?.focus();
        errorBoxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      // Check duplicate accounts by email and phone
      const dupCheck = await checkPotentialDuplicates({
        email,
        phone: phoneNorm.isValid ? phoneNorm.normalized : phone,
        excludeAppId: appId
      });
      if (dupCheck.isDuplicate) {
        setDuplicateWarning(dupCheck.reasons);
      } else {
        setDuplicateWarning(null);
      }

      // Create Firebase Auth user
      if (!userId) {
        try {
          setIsSavingDraft(true);
          const normalizedPhone = phoneNorm.isValid ? phoneNorm.normalized : phone;
          const createdUser = await registerApplicantUser(email, password, applicantName, normalizedPhone);
          setUserId(createdUser.uid);
          setEmailVerificationSent(true);
          setResendCooldown(60);
          const newAppId = `kyc_${createdUser.uid}_${Date.now()}`;
          setAppId(newAppId);
        } catch (err: any) {
          const mapped = mapFirebaseAuthError(err, email);
          if (mapped.isConfigurationError) {
            setConfigErrorDiagnostic(mapped);
          }
          if (mapped.field && mapped.field !== 'general') {
            setInlineErrors(prev => ({ ...prev, [mapped.field as string]: lang === 'sw' ? mapped.sw : mapped.en }));
          }
          setStepErrors([lang === 'sw' ? mapped.sw : mapped.en]);
          setErrorMessage(lang === 'sw' ? mapped.sw : mapped.en);
          setIsSavingDraft(false);
          return;
        } finally {
          setIsSavingDraft(false);
        }
      }
    }

    // Validate Step 3
    if (currentStep === 3) {
      const newInline: Record<string, string> = {};
      const newErrors: string[] = [];

      if (!legalName.trim()) {
        newInline.legalName = lang === 'sw' ? 'Jina la kisheria la biashara linahitajika.' : 'Legal business name is required.';
        newErrors.push(newInline.legalName);
      }
      if (!physicalAddress.trim()) {
        newInline.physicalAddress = lang === 'sw' ? 'Anwani ya ofisi inahitajika.' : 'Physical office address is required.';
        newErrors.push(newInline.physicalAddress);
      }

      setInlineErrors(newInline);
      setStepErrors(newErrors);

      if (newErrors.length > 0) {
        if (newInline.legalName) legalNameRef.current?.focus();
        else if (newInline.physicalAddress) physicalAddressRef.current?.focus();
        errorBoxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }

    // Duplicate Check Warning at Step 4 or 5
    if (currentStep === 4 || currentStep === 5) {
      const dupCheck = await checkPotentialDuplicates({
        tin: tinNumber,
        brelaNumber,
        email,
        phone,
        excludeAppId: appId
      });
      if (dupCheck.isDuplicate) {
        setDuplicateWarning(dupCheck.reasons);
      } else {
        setDuplicateWarning(null);
      }
    }

    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);

    // Autosave progress if user exists
    if (userId) {
      const payload = { ...buildCurrentPayload(), currentStep: nextStep };
      saveKYCDraft(payload as any).catch(e => console.warn('Autosave notice:', e));
    }
  };

  const handlePrev = () => {
    setErrorMessage(null);
    setStepErrors([]);
    setInlineErrors({});
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  // Final Submission
  const handleSubmit = async () => {
    setErrorMessage(null);
    setStepErrors([]);
    setInlineErrors({});

    if (!declarationAccepted) {
      const err = lang === 'sw' ? 'Ni lazima ukubali tamko la ukweli wa taarifa.' : 'You must accept the declaration of accuracy.';
      setErrorMessage(err);
      setStepErrors([err]);
      return;
    }
    if (!eSignatureName.trim()) {
      const err = lang === 'sw' ? 'Weka jina lako kamili kama sahihi ya kielektroniki.' : 'Enter your full name as electronic signature.';
      setInlineErrors({ eSignatureName: err });
      setStepErrors([err]);
      eSignatureRef.current?.focus();
      return;
    }

    // Email Verification Check: Reload user to fetch latest verification flag
    if (auth.currentUser) {
      try {
        await auth.currentUser.reload();
      } catch {
        // reload silent
      }

      // Check if email is verified
      if (!auth.currentUser.emailVerified) {
        setShowEmailVerifyBlockModal(true);
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = buildCurrentPayload();
      await submitKYCApplication(appId, payload);
      setIsSubmittedConfirmation(true);
      onSubmitted(appId);
    } catch (err: any) {
      const mapped = mapFirebaseAuthError(err, email);
      setErrorMessage(lang === 'sw' ? mapped.sw : mapped.en);
      setStepErrors([lang === 'sw' ? mapped.sw : mapped.en]);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper for document status badge
  const getDocItem = (docType: string) => documents.find(d => d.documentType === docType);

  const stepLabelsSw = [
    'Akaunti',
    'Aina ya Biashara',
    'Taarifa za Ofisi',
    businessType === 'registered_company' ? 'KYC ya Kampuni' : 'KYC ya Mjasiriamali',
    'Mpango & Malipo',
    'Hakiki & Wasilisha'
  ];

  if (isSubmittedConfirmation) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans">
        {/* Top Navbar */}
        <div className="max-w-4xl w-full mx-auto flex items-center justify-between pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-slate-950 text-xl shadow-lg shadow-emerald-500/20">
              K
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                {legalName || applicantName}
              </h2>
              <span className="text-[11px] text-emerald-400 font-semibold block">
                {lang === 'sw' ? 'Maombi Yamewasilishwa Kikamilifu' : 'Application Submitted Successfully'}
              </span>
            </div>
          </div>
          <button
            onClick={onToggleLang}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-bold text-slate-300 flex items-center gap-1.5 transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span>{lang === 'sw' ? 'English (EN)' : 'Kiswahili (SW)'}</span>
          </button>
        </div>

        {/* Confirmation Container */}
        <div className="max-w-3xl w-full mx-auto my-8 flex-1 space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl text-center space-y-6">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-500/10 border-2 border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/10">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white tracking-tight">
                {lang === 'sw' ? 'Maombi ya Usajili & KYC Yamewasilishwa!' : 'KYC Application Submitted Successfully!'}
              </h2>
              <p className="text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
                {lang === 'sw'
                  ? 'Asante kwa kuwasilisha taarifa za kisheria na nyaraka za shirika lako. Timu ya ukaguzi wa kisheria ya KaziDesk imeanza mchakato wa uhakiki.'
                  : 'Thank you for submitting your organization verification documents. The KaziDesk compliance desk has received your file.'}
              </p>
            </div>

            {/* Reference Number Box */}
            <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 max-w-md mx-auto space-y-1">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block">
                {lang === 'sw' ? 'Namba ya Kumbukumbu ya Maombi (Application Reference):' : 'Application Reference Number:'}
              </span>
              <div className="font-mono text-lg font-black text-emerald-400 tracking-wide select-all">
                {appId}
              </div>
            </div>

            {/* Status Timeline */}
            <div className="p-6 bg-slate-950/60 rounded-2xl border border-slate-800 text-left space-y-4">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                {lang === 'sw' ? 'Mfuatano wa Hatua za Ukaguzi (Compliance Timeline):' : 'Verification Timeline:'}
              </h4>
              <div className="space-y-4">
                {/* 1. Submitted */}
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <div>
                    <span className="font-bold text-white text-xs block">
                      {lang === 'sw' ? '1. Maombi Yamewasilishwa (Submitted)' : '1. Application Submitted'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {lang === 'sw' ? 'Taarifa za akaunti, namba za TIN, BRELA na viambatisho vyote vimepokelewa salama.' : 'Credentials, business details, tax IDs, and documents received.'}
                    </span>
                  </div>
                </div>

                {/* 2. Under Review */}
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-400 text-blue-400 flex items-center justify-center shrink-0 mt-0.5 animate-pulse">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-blue-300 text-xs block">
                      {lang === 'sw' ? '2. Ukaguzi wa Nyaraka & Taarifa (Under Review) - INAENDELEA' : '2. Compliance & Document Review - IN PROGRESS'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {lang === 'sw' ? 'Uhakiki wa namba za kodi na uhalali wa nyaraka unafanywa ndani ya saa 2 hadi 24 za kazi.' : 'TIN verification and legal document checks take 2 to 24 business hours.'}
                    </span>
                  </div>
                </div>

                {/* 3. More Info Required */}
                <div className="flex items-start gap-3 opacity-60">
                  <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 text-slate-400 flex items-center justify-center shrink-0 mt-0.5">
                    <HelpCircle className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-300 text-xs block">
                      {lang === 'sw' ? '3. Ufafanuzi au Marekebisho (More Info Required - ikihitajika)' : '3. Clarification or Re-uploads (If needed)'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {lang === 'sw' ? 'Iwapo nakala haisomeki au inahitaji kubadilishwa, utajulishwa kupakia upya kipengele husika pekee.' : 'If any document is unclear, you will be prompted to re-upload only that specific item.'}
                    </span>
                  </div>
                </div>

                {/* 4. Approved */}
                <div className="flex items-start gap-3 opacity-60">
                  <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 text-slate-400 flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-300 text-xs block">
                      {lang === 'sw' ? '4. Uidhinishaji & Kuanza kwa Ofisi (Approved & Active Workspace)' : '4. Approval & Workspace Provisioning'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {lang === 'sw' ? 'Baada ya kuidhinishwa, ofisi yako itafunguliwa papo hapo na jaribio la bure la siku 14 litaanza.' : 'Once approved, your full tenant workspace activates with your 14-day free trial.'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* What Happens Next Guidance */}
            <div className="p-4 bg-slate-800/40 rounded-2xl border border-slate-700/60 text-xs text-slate-300 text-left space-y-2">
              <span className="font-bold text-emerald-400 block uppercase text-[10px]">
                {lang === 'sw' ? 'Nini Kinafuata Sasa?' : 'What Happens Next?'}
              </span>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-300 pl-1">
                <li>
                  {lang === 'sw'
                    ? `Barua pepe ya uthibitisho itatumwa kwa "${email}" pindi maombi yatakapoidhinishwa au yatakapohitaji marekebisho.`
                    : `Notification emails will be sent to "${email}" once review is complete.`}
                </li>
                <li>
                  {lang === 'sw'
                    ? 'Hutaweza kuingia kwenye ofisi (workspace) hadi ukaguzi ukamilike na maombi yaidhinishwe.'
                    : 'Access to the workspace is restricted until KYC verification is formally approved.'}
                </li>
                <li>
                  {lang === 'sw'
                    ? 'Unaweza kuingia kwenye akaunti yako muda wowote kufuatilia maendeleo ya ukaguzi huu.'
                    : 'You can sign in anytime to inspect the real-time compliance status.'}
                </li>
              </ul>
            </div>

            {/* Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => onSubmitted(appId)}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
              >
                <span>{lang === 'sw' ? 'Fuatilia Hali ya Maombi (Status Dashboard)' : 'Go to Application Status'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs transition-colors"
              >
                {lang === 'sw' ? 'Rudi Kwenye Ukurasa Mkuu (Back to Home)' : 'Return to Home'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans">
      
      {/* Top Bar */}
      <div className="max-w-5xl w-full mx-auto flex items-center justify-between pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-slate-950 text-xl shadow-lg shadow-emerald-500/20">
            K
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
              {lang === 'sw' ? 'Usajili wa Shirika & KYC Onboarding' : 'Organization Registration & KYC'}
            </h2>
            <span className="text-[11px] text-emerald-400 font-semibold block">
              KaziDesk Multi-Tenant Cloud Platform
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleLang}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-bold text-slate-300 flex items-center gap-1.5 transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span>{lang === 'sw' ? 'English (EN)' : 'Kiswahili (SW)'}</span>
          </button>
          <button
            onClick={onCancel}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-bold transition-colors"
          >
            {lang === 'sw' ? 'Ghairi (Rudi Kuingia)' : 'Cancel (Back to Login)'}
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-5xl w-full mx-auto my-6 flex-1 flex flex-col space-y-6">
        
        {/* Progress Bar & Steps Indicator */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl backdrop-blur-xl">
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="font-bold text-slate-300">
              {lang === 'sw' ? `Hatua ya ${currentStep} kati ya 7` : `Step ${currentStep} of 7`}
            </span>
            <span className="text-emerald-400 font-mono font-bold">
              {Math.round((currentStep / 7) * 100)}%
            </span>
          </div>

          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 7) * 100}%` }}
            />
          </div>

          <div className="grid grid-cols-7 gap-1 text-[10px] sm:text-xs pt-3 text-center font-semibold">
            {[1, 2, 3, 4, 5, 6, 7].map(s => (
              <span
                key={s}
                className={`truncate ${
                  s === currentStep
                    ? 'text-emerald-400 font-bold'
                    : s < currentStep
                    ? 'text-slate-400'
                    : 'text-slate-600'
                }`}
              >
                {s === 1
                  ? (lang === 'sw' ? '1. Akaunti' : '1. Account')
                  : s === 2
                  ? (lang === 'sw' ? '2. Aina' : '2. Type')
                  : s === 3
                  ? (lang === 'sw' ? '3. Ofisi' : '3. Details')
                  : s === 4
                  ? (lang === 'sw' ? '4. Kampuni' : '4. Company')
                  : s === 5
                  ? (lang === 'sw' ? '5. Mjasiriamali' : '5. Individual')
                  : s === 6
                  ? (lang === 'sw' ? '6. Mpango' : '6. Plan')
                  : (lang === 'sw' ? '7. Wasilisha' : '7. Submit')}
              </span>
            ))}
          </div>
        </div>

        {/* Top-of-Step Error Summary Box (focus moves to first invalid field) */}
        {stepErrors.length > 0 && (
          <div ref={errorBoxRef} className="p-4 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-xs text-rose-300 space-y-2 animate-in fade-in">
            <div className="flex items-center gap-2 font-bold text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{lang === 'sw' ? 'Tafadhali rekebisha makosa yafuatayo kabla ya kuendelea:' : 'Please correct the following errors before proceeding:'}</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-rose-200 pl-2">
              {stepErrors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Diagnostic Configuration Error Banner (For auth/operation-not-allowed) */}
        {configErrorDiagnostic && (
          <div className="p-4 bg-amber-500/15 border border-amber-500/40 rounded-2xl text-xs text-amber-200 space-y-2 animate-in fade-in">
            <div className="flex items-center gap-2 font-black text-amber-300 text-sm">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              <span>{lang === 'sw' ? 'Msaada wa Usajili wa Akaunti' : 'Registration Support Notice'}</span>
            </div>
            <p className="leading-relaxed">
              {lang === 'sw' ? configErrorDiagnostic.sw : configErrorDiagnostic.en}
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-3 text-[11px]">
              <a
                href={`https://wa.me/${cleanWhatsAppNumber}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>WhatsApp: {supportPhone.split('/')[0].trim()}</span>
              </a>
              <a
                href={`mailto:${supportEmail}`}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center gap-1.5 border border-slate-700 transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>{supportEmail}</span>
              </a>
            </div>
            <span className="text-[10px] text-amber-400/80 block pt-1 italic">
              {lang === 'sw'
                ? '* Kumbuka ya kiutawala (Diagnostic entry) imerekodiwa kwa mmiliki wa mfumo kwenye Owner Portal.'
                : '* A diagnostic audit log has been filed for the platform owner in the Owner Portal.'}
            </span>
          </div>
        )}

        {/* Free Email Provider Warning (Non-blocking) */}
        {isFreeEmailProvider(email) && (
          <div className="p-3.5 bg-blue-500/10 border border-blue-500/30 rounded-2xl text-xs text-blue-300 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed text-[11px]">
              <span className="font-bold text-blue-200 block mb-0.5">
                {lang === 'sw' ? 'Ushauri wa Barua Pepe ya Biashara' : 'Corporate Email Recommendation'}
              </span>
              {lang === 'sw'
                ? 'Unatumia barua pepe ya kawaida ya bure (mfano: Gmail/Yahoo). Kwa usajili wa mashirika na kampuni, barua pepe rasmi ya kikoa cha ofisi (mfano: jina@kampuni.co.tz) inapendekezwa zaidi.'
                : 'You are using a public consumer email provider. For organizations, an official corporate domain email (e.g. name@company.co.tz) is highly recommended.'}
            </div>
          </div>
        )}

        {/* Email Verification Status Prompt */}
        {emailVerificationSent && (
          <div className="p-4 bg-teal-500/15 border border-teal-500/40 rounded-2xl text-xs text-teal-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <Mail className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-teal-300 block">
                  {lang === 'sw' ? 'Kiungo cha Uthibitisho Kimetumwa (Email Sent)' : 'Verification Link Sent'}
                </span>
                <span className="text-[11px] text-slate-300">
                  {lang === 'sw'
                    ? `Tumetuma barua pepe ya uthibitisho kwa "${email}". Tafadhali fungua kiungo kabla ya kuwasilisha maombi ya mwisho.`
                    : `We sent a verification link to "${email}". Please verify before final application submission.`}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleResendVerification}
              disabled={resendCooldown > 0 || isResendingEmail}
              className="px-3 py-1.5 rounded-xl bg-teal-600/80 hover:bg-teal-500 text-white font-bold text-xs shrink-0 flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isResendingEmail ? 'animate-spin' : ''}`} />
              <span>
                {resendCooldown > 0
                  ? (lang === 'sw' ? `Tuma tena (${resendCooldown}s)` : `Resend (${resendCooldown}s)`)
                  : (lang === 'sw' ? 'Tuma Tena Barua Pepe' : 'Resend Verification')}
              </span>
            </button>
          </div>
        )}

        {/* General Error (if not shown in stepErrors) */}
        {errorMessage && stepErrors.length === 0 && !configErrorDiagnostic && (
          <div className="p-4 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-xs text-rose-300 flex items-start gap-3 animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed font-medium">{errorMessage}</span>
          </div>
        )}

        {successToast && (
          <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-xs text-emerald-300 flex items-start gap-3 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed font-bold">{successToast}</span>
          </div>
        )}

        {duplicateWarning && duplicateWarning.length > 0 && (
          <div className="p-4 bg-amber-500/15 border border-amber-500/30 rounded-2xl text-xs text-amber-300 space-y-1">
            <div className="flex items-center gap-2 font-bold text-amber-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{lang === 'sw' ? 'Tahadhari ya Taarifa Zinazofanana (Duplicate Flag)' : 'Duplicate Data Warning'}</span>
            </div>
            <ul className="list-disc list-inside text-[11px] text-slate-300 space-y-0.5 pl-2">
              {duplicateWarning.map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
            <span className="text-[10px] text-amber-400/90 block pt-1">
              {lang === 'sw'
                ? 'Unaweza kuendelea, lakini suala hili litaangaziwa kwa mmiliki wa mfumo wakati wa ukaguzi.'
                : 'You may proceed, but this flag will be highlighted to the platform owner during verification.'}
            </span>
          </div>
        )}

        {/* Step Cards Container */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl flex-1 flex flex-col justify-between">
          
          {/* ============================================================== */}
          {/* STEP 1: ACCOUNT & CREDENTIALS                                 */}
          {/* ============================================================== */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-black text-white">
                  {lang === 'sw' ? 'Hatua ya 1: Fungua Akaunti Yako ya Msimamizi' : 'Step 1: Administrator Account Credentials'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {lang === 'sw'
                    ? 'Akaunti hii itakuwa msimamizi mkuu wa ofisi yako kwenye KaziDesk (Company Admin).'
                    : 'This account will serve as the primary administrator for your organization on KaziDesk.'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    {lang === 'sw' ? 'Jina Lako Kamili (Full Name) *' : 'Your Full Name *'}
                  </label>
                  <input
                    ref={applicantNameRef}
                    type="text"
                    value={applicantName}
                    onChange={e => {
                      setApplicantName(e.target.value);
                      if (inlineErrors.applicantName) setInlineErrors(prev => ({ ...prev, applicantName: '' }));
                    }}
                    required
                    placeholder="Mf. Bi. Maria Mchome"
                    className={`w-full px-3 py-2.5 bg-slate-800 rounded-xl border ${
                      inlineErrors.applicantName ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-700'
                    } text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                  />
                  {inlineErrors.applicantName && (
                    <p className="text-[11px] text-rose-400 font-medium mt-1">{inlineErrors.applicantName}</p>
                  )}
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {lang === 'sw' ? 'Angalau majina mawili (jina la kwanza na la ukoo).' : 'At least two words (first and last name).'}
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    {lang === 'sw' ? 'Namba ya Simu ya Mkononi (Tanzania +255) *' : 'Mobile Phone Number (Tanzania +255) *'}
                  </label>
                  <input
                    ref={phoneRef}
                    type="tel"
                    value={phone}
                    onChange={e => {
                      setPhone(e.target.value);
                      if (inlineErrors.phone) setInlineErrors(prev => ({ ...prev, phone: '' }));
                    }}
                    required
                    placeholder="+255 775 740 386 au 0775740386"
                    className={`w-full px-3 py-2.5 bg-slate-800 rounded-xl border ${
                      inlineErrors.phone ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-700'
                    } text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                  />
                  {inlineErrors.phone && (
                    <p className="text-[11px] text-rose-400 font-medium mt-1">{inlineErrors.phone}</p>
                  )}
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {lang === 'sw' ? 'Inakubali 07XX... au 06XX... na kurekebishwa kiotomatiki kuwa +255.' : 'Accepts 07XX... or 06XX... and normalizes to +255.'}
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    {lang === 'sw' ? 'Barua Pepe Rasmi ya Ofisi (Work Email) *' : 'Official Work Email *'}
                  </label>
                  <input
                    ref={emailRef}
                    type="email"
                    value={email}
                    onChange={e => {
                      setEmail(e.target.value);
                      if (inlineErrors.email) setInlineErrors(prev => ({ ...prev, email: '' }));
                    }}
                    required
                    placeholder="maria@kampuni.co.tz"
                    disabled={Boolean(currentUserId)}
                    className={`w-full px-3 py-2.5 bg-slate-800 rounded-xl border ${
                      inlineErrors.email ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-700'
                    } text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60`}
                  />
                  {inlineErrors.email && (
                    <p className="text-[11px] text-rose-400 font-medium mt-1">{inlineErrors.email}</p>
                  )}
                </div>

                {!userId && (
                  <>
                    <div>
                      <label className="block font-bold text-slate-300 mb-1">
                        {lang === 'sw' ? 'Nenosiri Imara (Password - Angalau herufi 10) *' : 'Strong Password (Min 10 characters) *'}
                      </label>
                      <div className="relative">
                        <input
                          ref={passwordRef}
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={e => {
                            setPassword(e.target.value);
                            if (inlineErrors.password) setInlineErrors(prev => ({ ...prev, password: '' }));
                          }}
                          required
                          placeholder="••••••••••••"
                          className={`w-full px-3 py-2.5 pr-10 bg-slate-800 rounded-xl border ${
                            inlineErrors.password ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-700'
                          } text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                          tabIndex={-1}
                          title={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {inlineErrors.password && (
                        <p className="text-[11px] text-rose-400 font-medium mt-1">{inlineErrors.password}</p>
                      )}
                      
                      {/* Password Strength Indicator */}
                      {password && (
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-slate-400">
                              {lang === 'sw' ? 'Uimara wa Nenosiri:' : 'Password Strength:'}
                            </span>
                            <span className={`font-bold ${pwdStrength.score >= 3 ? 'text-emerald-400' : pwdStrength.score === 2 ? 'text-amber-400' : 'text-rose-400'}`}>
                              {lang === 'sw' ? pwdStrength.labelSw : pwdStrength.labelEn}
                            </span>
                          </div>
                          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                pwdStrength.score >= 3
                                  ? 'bg-emerald-500'
                                  : pwdStrength.score === 2
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${(pwdStrength.score / 4) * 100}%` }}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-400 pt-1">
                            <span className={pwdStrength.hasLength ? 'text-emerald-400' : 'text-slate-500'}>
                              {pwdStrength.hasLength ? '✓' : '○'} {lang === 'sw' ? 'Herufi 10 au zaidi' : '10+ characters'}
                            </span>
                            <span className={pwdStrength.hasUpper ? 'text-emerald-400' : 'text-slate-500'}>
                              {pwdStrength.hasUpper ? '✓' : '○'} {lang === 'sw' ? 'Herufi kubwa (A-Z)' : 'Uppercase letter'}
                            </span>
                            <span className={pwdStrength.hasLower ? 'text-emerald-400' : 'text-slate-500'}>
                              {pwdStrength.hasLower ? '✓' : '○'} {lang === 'sw' ? 'Herufi ndogo (a-z)' : 'Lowercase letter'}
                            </span>
                            <span className={pwdStrength.hasNumber && pwdStrength.hasSpecial ? 'text-emerald-400' : 'text-slate-500'}>
                              {pwdStrength.hasNumber && pwdStrength.hasSpecial ? '✓' : '○'} {lang === 'sw' ? 'Namba & Alama (@#$)' : 'Number & symbol'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block font-bold text-slate-300 mb-1">
                        {lang === 'sw' ? 'Thibitisha Nenosiri *' : 'Confirm Password *'}
                      </label>
                      <div className="relative">
                        <input
                          ref={confirmPasswordRef}
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={e => {
                            setConfirmPassword(e.target.value);
                            if (inlineErrors.confirmPassword) setInlineErrors(prev => ({ ...prev, confirmPassword: '' }));
                          }}
                          required
                          placeholder="••••••••••••"
                          className={`w-full px-3 py-2.5 pr-10 bg-slate-800 rounded-xl border ${
                            inlineErrors.confirmPassword ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-700'
                          } text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                          tabIndex={-1}
                          title={showConfirmPassword ? 'Hide password' : 'Show password'}
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {inlineErrors.confirmPassword && (
                        <p className="text-[11px] text-rose-400 font-medium mt-1">{inlineErrors.confirmPassword}</p>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Terms Acceptance */}
              <div className={`p-4 bg-slate-800/60 rounded-2xl border ${
                inlineErrors.terms ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-700/80'
              } flex items-start gap-3 text-xs text-slate-300`}>
                <input
                  ref={termsRef}
                  type="checkbox"
                  id="kyc-terms"
                  checked={termsAccepted}
                  onChange={e => {
                    setTermsAccepted(e.target.checked);
                    if (inlineErrors.terms) setInlineErrors(prev => ({ ...prev, terms: '' }));
                  }}
                  className="mt-1 w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
                <label htmlFor="kyc-terms" className="text-xs leading-relaxed cursor-pointer select-none">
                  {lang === 'sw'
                    ? 'Nimesoma, kuelewa na ninakubaliana na '
                    : 'I have read, understood and agree to the '}
                  <button
                    type="button"
                    onClick={() => {
                      setTermsTab('terms');
                      setIsTermsModalOpen(true);
                    }}
                    className="text-emerald-400 hover:text-emerald-300 font-bold underline"
                  >
                    {lang === 'sw' ? 'Sheria na Masharti ya Huduma (Terms of Service v1.2)' : 'Terms of Service (v1.2)'}
                  </button>
                  {lang === 'sw' ? ' pamoja na ' : ' and '}
                  <button
                    type="button"
                    onClick={() => {
                      setTermsTab('privacy');
                      setIsTermsModalOpen(true);
                    }}
                    className="text-emerald-400 hover:text-emerald-300 font-bold underline"
                  >
                    {lang === 'sw' ? 'Sera ya Faragha ya Data za KYC' : 'KYC Privacy Policy'}
                  </button>
                  .
                  {inlineErrors.terms && (
                    <span className="text-[11px] text-rose-400 font-medium block mt-1">{inlineErrors.terms}</span>
                  )}
                </label>
              </div>

              {/* Link back to login */}
              <div className="pt-2 text-center text-xs text-slate-400 border-t border-slate-800/60">
                {lang === 'sw' ? 'Tayari unayo akaunti iliyosajiliwa ya KaziDesk? ' : 'Already have a registered KaziDesk account? '}
                <button
                  type="button"
                  onClick={onCancel}
                  className="text-emerald-400 hover:text-emerald-300 font-bold underline transition-colors"
                >
                  {lang === 'sw' ? 'Ingia hapa (Sign In)' : 'Sign in here'}
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 2: BUSINESS TYPE SELECTION                               */}
          {/* ============================================================== */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-black text-white">
                  {lang === 'sw' ? 'Hatua ya 2: Chagua Aina ya Biashara au Shirika' : 'Step 2: Choose Organization Entity Type'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {lang === 'sw'
                    ? 'Hatua zifuatazo za ukaguzi wa kisheria na nyaraka zitajipanga kulingana na muundo uliochaguliwa.'
                    : 'Subsequent verification steps and required legal documents will adapt to your entity type.'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Registered Company Card */}
                <div
                  onClick={() => setBusinessType('registered_company')}
                  className={`p-6 rounded-3xl border-2 cursor-pointer transition-all ${
                    businessType === 'registered_company'
                      ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10'
                      : 'border-slate-800 bg-slate-800/40 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <Building2 className="w-6 h-6" />
                    </div>
                    {businessType === 'registered_company' && (
                      <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    )}
                  </div>
                  <h4 className="font-black text-white text-base">
                    {lang === 'sw' ? 'Kampuni Iliyosajiliwa (Registered Company)' : 'Registered Company'}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    {lang === 'sw'
                      ? 'Kampuni ya dhima yenye ukomo (Limited Company), Shirika Lisilo la Kiserikali (NGO), Taasisi, Ushirika au Ubia wenye usajili wa BRELA na TIN ya kampuni.'
                      : 'Limited Liability Company (Ltd), NGO, Institution, Cooperative, or Partnership with BRELA incorporation and company TIN.'}
                  </p>
                  <div className="mt-4 pt-3 border-t border-slate-700/60 text-[11px] text-slate-300 space-y-1">
                    <span className="font-semibold block text-emerald-400">
                      {lang === 'sw' ? 'Inahitaji:' : 'Requires:'}
                    </span>
                    <span>• Hati ya BRELA / Cheti cha Usajili</span>
                    <span className="block">• TIN ya Kampuni & Leseni ya Biashara</span>
                    <span className="block">• Orodha ya Wakurugenzi & Mwakilishi</span>
                  </div>
                </div>

                {/* Sole Proprietor Card */}
                <div
                  onClick={() => setBusinessType('sole_proprietor')}
                  className={`p-6 rounded-3xl border-2 cursor-pointer transition-all ${
                    businessType === 'sole_proprietor'
                      ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10'
                      : 'border-slate-800 bg-slate-800/40 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
                      <User className="w-6 h-6" />
                    </div>
                    {businessType === 'sole_proprietor' && (
                      <CheckCircle2 className="w-6 h-6 text-teal-400" />
                    )}
                  </div>
                  <h4 className="font-black text-white text-base">
                    {lang === 'sw' ? 'Mjasiriamali Binafsi (Sole Proprietor)' : 'Sole Proprietor / Individual'}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    {lang === 'sw'
                      ? 'Mfanyabiashara binafsi, mtoa huduma, fundi au duka linalomilikiwa na mtu mmoja chini ya usajili wa jina la biashara au leseni ya serikali ya mtaa.'
                      : 'Individual business owner, consultant, trade shop, or single owner operating under a business name or municipal licence.'}
                  </p>
                  <div className="mt-4 pt-3 border-t border-slate-700/60 text-[11px] text-slate-300 space-y-1">
                    <span className="font-semibold block text-teal-400">
                      {lang === 'sw' ? 'Inahitaji:' : 'Requires:'}
                    </span>
                    <span>• Kitambulisho cha NIDA au Pasi ya Kusafiria</span>
                    <span className="block">• TIN ya Mtu Binafsi / Leseni</span>
                    <span className="block">• Picha ya Mmiliki & Uthibitisho wa Anwani</span>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 3: BUSINESS DETAILS                                      */}
          {/* ============================================================== */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-black text-white">
                  {lang === 'sw' ? 'Hatua ya 3: Taarifa za Kiofisi & Mawasiliano' : 'Step 3: Office & Contact Information'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {lang === 'sw'
                    ? 'Weka maelezo halisi ya ofisi yatakayotumika kwenye ankara, nukuu za bei na mawasiliano ya kibiashara.'
                    : 'Provide the official office information that will appear on invoices, quotations, and official notices.'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    {lang === 'sw' ? 'Jina Kamili la Kisheria (Legal Entity Name) *' : 'Legal Business Name *'}
                  </label>
                  <input
                    ref={legalNameRef}
                    type="text"
                    value={legalName}
                    onChange={e => {
                      setLegalName(e.target.value);
                      if (inlineErrors.legalName) setInlineErrors(prev => ({ ...prev, legalName: '' }));
                    }}
                    required
                    placeholder="Mf. Serengeti Freight & Logistics Ltd"
                    className={`w-full px-3 py-2.5 bg-slate-800 rounded-xl border ${
                      inlineErrors.legalName ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-700'
                    } text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                  />
                  {inlineErrors.legalName && (
                    <p className="text-[11px] text-rose-400 font-medium mt-1">{inlineErrors.legalName}</p>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    {lang === 'sw' ? 'Jina la Kibiashara (Trading / Brand Name)' : 'Trading / Brand Name'}
                  </label>
                  <input
                    type="text"
                    value={tradingName}
                    onChange={e => setTradingName(e.target.value)}
                    placeholder="Mf. Serengeti Express"
                    className="w-full px-3 py-2.5 bg-slate-800 rounded-xl border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    {lang === 'sw' ? 'Sekta ya Biashara (Industry Sector) *' : 'Industry Sector *'}
                  </label>
                  <select
                    value={businessSector}
                    onChange={e => setBusinessSector(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-800 rounded-xl border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Teknolojia & TEHAMA">Teknolojia, Programu & TEHAMA</option>
                    <option value="Biashara ya Jumla & Rejareja">Biashara ya Jumla & Rejareja</option>
                    <option value="Usafirishaji & Lojistiki">Usafirishaji & Lojistiki (Logistics)</option>
                    <option value="Kilimo & Ufugaji">Kilimo, Uvuvi & Mifugo</option>
                    <option value="Ujenzi & Miundombinu">Ujenzi, Uhandisi & Miundombinu</option>
                    <option value="Afya & Dawa">Afya, Zahanati & Madawa</option>
                    <option value="Elimu & Mafunzo">Elimu, Shule & Vyuo</option>
                    <option value="Ukarimu & Utalii">Hoteli, Utalii & Migahawa</option>
                    <option value="Huduma za Kifedha & Bima">Huduma za Fedha, Ushauri & Bima</option>
                    <option value="Shirika Lisilo la Kiserikali">NGO / Asasi ya Kiraia / Dini</option>
                    <option value="Sekta Nyingine">Sekta Nyingineyo</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    {lang === 'sw' ? 'Mkoa (Tanzania Region) *' : 'Region (Tanzania) *'}
                  </label>
                  <select
                    value={region}
                    onChange={e => setRegion(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-800 rounded-xl border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {TANZANIA_REGIONS.map(reg => (
                      <option key={reg} value={reg}>{reg}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    {lang === 'sw' ? 'Wilaya / Eneo (District / Municipality) *' : 'District / Municipality *'}
                  </label>
                  <input
                    type="text"
                    value={district}
                    onChange={e => setDistrict(e.target.value)}
                    required
                    placeholder="Mf. Kinondoni au Ilala"
                    className="w-full px-3 py-2.5 bg-slate-800 rounded-xl border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    {lang === 'sw' ? 'Anwani ya Eneo la Ofisi (Physical Address) *' : 'Physical Address *'}
                  </label>
                  <input
                    ref={physicalAddressRef}
                    type="text"
                    value={physicalAddress}
                    onChange={e => {
                      setPhysicalAddress(e.target.value);
                      if (inlineErrors.physicalAddress) setInlineErrors(prev => ({ ...prev, physicalAddress: '' }));
                    }}
                    required
                    placeholder="Mf. Ghorofa ya 4, Jengo la Samora, Mtaa wa Samora"
                    className={`w-full px-3 py-2.5 bg-slate-800 rounded-xl border ${
                      inlineErrors.physicalAddress ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-700'
                    } text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                  />
                  {inlineErrors.physicalAddress && (
                    <p className="text-[11px] text-rose-400 font-medium mt-1">{inlineErrors.physicalAddress}</p>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    {lang === 'sw' ? 'Simu Kuu ya Ofisi *' : 'Main Office Phone *'}
                  </label>
                  <input
                    type="tel"
                    value={businessPhone}
                    onChange={e => setBusinessPhone(e.target.value)}
                    required
                    placeholder="+255 22 211 0000"
                    className="w-full px-3 py-2.5 bg-slate-800 rounded-xl border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    {lang === 'sw' ? 'Barua Pepe ya Biashara *' : 'Business Email *'}
                  </label>
                  <input
                    type="email"
                    value={businessEmail}
                    onChange={e => setBusinessEmail(e.target.value)}
                    required
                    placeholder="info@kampuni.co.tz"
                    className="w-full px-3 py-2.5 bg-slate-800 rounded-xl border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    {lang === 'sw' ? 'Idadi ya Wafanyakazi (Estimated Staff Count)' : 'Staff Count'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={numberOfStaff}
                    onChange={e => setNumberOfStaff(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2.5 bg-slate-800 rounded-xl border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    {lang === 'sw' ? 'Tovuti ya Biashara (Website - Hiari)' : 'Website (Optional)'}
                  </label>
                  <input
                    type="url"
                    value={website}
                    onChange={e => setWebsite(e.target.value)}
                    placeholder="https://www.kampuni.co.tz"
                    className="w-full px-3 py-2.5 bg-slate-800 rounded-xl border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 4: REGISTERED COMPANY KYC                                */}
          {/* ============================================================== */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-black text-white">
                  {lang === 'sw' ? 'Hatua ya 4: Nyaraka na Taarifa za Kampuni (Company KYC)' : 'Step 4: Corporate KYC Documents & Directors'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {lang === 'sw'
                    ? 'Weka namba za kodi, usajili wa BRELA, na pakia nakala za nyaraka rasmi (PDF, JPG au PNG).'
                    : 'Provide tax, BRELA registration, and upload legal verification documents (PDF, JPG, PNG).'}
                </p>
              </div>

              {/* Identification Numbers */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    {lang === 'sw' ? 'Namba ya Usajili wa BRELA *' : 'BRELA Registration No. *'}
                  </label>
                  <input
                    type="text"
                    value={brelaNumber}
                    onChange={e => setBrelaNumber(e.target.value)}
                    required
                    placeholder="TZ-BRELA-149822"
                    className="w-full px-3 py-2.5 bg-slate-800 rounded-xl border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    {lang === 'sw' ? 'Namba ya TIN ya Kampuni *' : 'Company TIN Number *'}
                  </label>
                  <input
                    type="text"
                    value={tinNumber}
                    onChange={e => setTinNumber(e.target.value)}
                    required
                    placeholder="112-948-203"
                    className="w-full px-3 py-2.5 bg-slate-800 rounded-xl border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    {lang === 'sw' ? 'Namba ya VRN (VAT - Ikiwa imesajiliwa)' : 'VRN (VAT Registration - Optional)'}
                  </label>
                  <input
                    type="text"
                    value={vrnNumber}
                    onChange={e => setVrnNumber(e.target.value)}
                    placeholder="40-029199-K"
                    className="w-full px-3 py-2.5 bg-slate-800 rounded-xl border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase font-mono"
                  />
                </div>
              </div>

              {/* Business Licence Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    {lang === 'sw' ? 'Namba ya Leseni ya Biashara *' : 'Business Licence Number *'}
                  </label>
                  <input
                    type="text"
                    value={licenceNumber}
                    onChange={e => setLicenceNumber(e.target.value)}
                    required
                    placeholder="BL-2026-0091"
                    className="w-full px-3 py-2.5 bg-slate-800 rounded-xl border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    {lang === 'sw' ? 'Tarehe ya Kutolewa Leseni' : 'Licence Issue Date'}
                  </label>
                  <input
                    type="date"
                    value={licenceIssueDate}
                    onChange={e => setLicenceIssueDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-800 rounded-xl border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    {lang === 'sw' ? 'Tarehe ya Kuisha Leseni' : 'Licence Expiry Date'}
                  </label>
                  <input
                    type="date"
                    value={licenceExpiryDate}
                    onChange={e => setLicenceExpiryDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-800 rounded-xl border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Required Uploads Zone */}
              <div className="space-y-3 pt-2">
                <span className="text-xs font-bold text-slate-200 block uppercase tracking-wider">
                  {lang === 'sw' ? 'Pakia Nyaraka Rasmi za Kampuni (Company Uploads):' : 'Official Document Uploads:'}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  
                  {/* BRELA Certificate Upload */}
                  <DocumentUploadCard
                    docType="brela_certificate"
                    label={lang === 'sw' ? 'Hati ya Usajili / BRELA Certificate *' : 'Certificate of Incorporation *'}
                    existingDoc={getDocItem('brela_certificate')}
                    isUploading={uploadingDocType === 'brela_certificate'}
                    onUpload={file => handleFileUpload('brela_certificate', file, 'Hati ya BRELA')}
                    onPreview={doc => setPreviewDoc({ title: doc.name, fileUrl: doc.fileUrl, fileType: doc.fileType })}
                    onRemove={handleRemoveDoc}
                    lang={lang}
                  />

                  {/* TIN Certificate Upload */}
                  <DocumentUploadCard
                    docType="tin_certificate"
                    label={lang === 'sw' ? 'Cheti cha Namba ya TIN *' : 'TIN Certificate *'}
                    existingDoc={getDocItem('tin_certificate')}
                    isUploading={uploadingDocType === 'tin_certificate'}
                    onUpload={file => handleFileUpload('tin_certificate', file, 'Cheti cha TIN')}
                    onPreview={doc => setPreviewDoc({ title: doc.name, fileUrl: doc.fileUrl, fileType: doc.fileType })}
                    onRemove={handleRemoveDoc}
                    lang={lang}
                  />

                  {/* Business Licence Upload */}
                  <DocumentUploadCard
                    docType="business_licence"
                    label={lang === 'sw' ? 'Leseni ya Biashara (Business Licence) *' : 'Business Licence *'}
                    existingDoc={getDocItem('business_licence')}
                    isUploading={uploadingDocType === 'business_licence'}
                    onUpload={file => handleFileUpload('business_licence', file, 'Leseni ya Biashara')}
                    onPreview={doc => setPreviewDoc({ title: doc.name, fileUrl: doc.fileUrl, fileType: doc.fileType })}
                    onRemove={handleRemoveDoc}
                    lang={lang}
                  />

                  {/* VRN Certificate Upload */}
                  <DocumentUploadCard
                    docType="vrn_certificate"
                    label={lang === 'sw' ? 'Cheti cha VAT / VRN (Hiari)' : 'VAT Certificate (Optional)'}
                    existingDoc={getDocItem('vrn_certificate')}
                    isUploading={uploadingDocType === 'vrn_certificate'}
                    onUpload={file => handleFileUpload('vrn_certificate', file, 'Cheti cha VRN')}
                    onPreview={doc => setPreviewDoc({ title: doc.name, fileUrl: doc.fileUrl, fileType: doc.fileType })}
                    onRemove={handleRemoveDoc}
                    lang={lang}
                  />

                  {/* Tax Clearance Upload */}
                  <DocumentUploadCard
                    docType="tax_clearance"
                    label={lang === 'sw' ? 'Cheti cha Uthibitisho wa Kodi / Tax Clearance (Hiari)' : 'Tax Clearance Certificate (Optional)'}
                    existingDoc={getDocItem('tax_clearance')}
                    isUploading={uploadingDocType === 'tax_clearance'}
                    onUpload={file => handleFileUpload('tax_clearance', file, 'Tax Clearance')}
                    onPreview={doc => setPreviewDoc({ title: doc.name, fileUrl: doc.fileUrl, fileType: doc.fileType })}
                    onRemove={handleRemoveDoc}
                    lang={lang}
                  />

                  {/* MEMARTS Upload */}
                  <DocumentUploadCard
                    docType="memarts"
                    label={lang === 'sw' ? 'Memorandum & Articles of Association (MEMARTS - Hiari)' : 'MEMARTS (Optional)'}
                    existingDoc={getDocItem('memarts')}
                    isUploading={uploadingDocType === 'memarts'}
                    onUpload={file => handleFileUpload('memarts', file, 'MEMARTS')}
                    onPreview={doc => setPreviewDoc({ title: doc.name, fileUrl: doc.fileUrl, fileType: doc.fileType })}
                    onRemove={handleRemoveDoc}
                    lang={lang}
                  />

                </div>
              </div>

              {/* Directors Section */}
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      {lang === 'sw' ? 'Orodha ya Wakurugenzi & Wamiliki wa Kampuni' : 'Directors & Beneficial Owners'}
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      {lang === 'sw' ? 'Weka taarifa za wakurugenzi na asilimia ya hisa' : 'List company directors and shareholding percentages'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDirectors(prev => [
                        ...prev,
                        {
                          id: `dir_${Date.now()}`,
                          fullName: '',
                          idType: 'nida',
                          idNumber: '',
                          shareholdingPercentage: 0,
                          isRepresentative: false
                        }
                      ]);
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-700"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{lang === 'sw' ? 'Ongeza Mkurugenzi' : 'Add Director'}</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {directors.map((dir, idx) => (
                    <div key={dir.id} className="p-4 bg-slate-800/60 border border-slate-700/80 rounded-2xl space-y-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-300">
                          {lang === 'sw' ? `Mkurugenzi #${idx + 1}` : `Director #${idx + 1}`}
                        </span>
                        {directors.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setDirectors(prev => prev.filter(d => d.id !== dir.id))}
                            className="text-rose-400 hover:text-rose-300 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                            {lang === 'sw' ? 'Jina Kamili *' : 'Full Name *'}
                          </label>
                          <input
                            type="text"
                            value={dir.fullName}
                            onChange={e => {
                              const val = e.target.value;
                              setDirectors(prev => prev.map(d => d.id === dir.id ? { ...d, fullName: val } : d));
                            }}
                            placeholder="Mf. James Makonda"
                            className="w-full px-3 py-2 bg-slate-900 rounded-xl border border-slate-700 text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                            {lang === 'sw' ? 'Aina ya Kitambulisho' : 'ID Type'}
                          </label>
                          <select
                            value={dir.idType}
                            onChange={e => {
                              const val = e.target.value as any;
                              setDirectors(prev => prev.map(d => d.id === dir.id ? { ...d, idType: val } : d));
                            }}
                            className="w-full px-3 py-2 bg-slate-900 rounded-xl border border-slate-700 text-white"
                          >
                            <option value="nida">NIDA (National ID)</option>
                            <option value="passport">Pasi ya Kusafiria (Passport)</option>
                            <option value="driving_licence">Leseni ya Udereva</option>
                            <option value="voter_id">Kadi ya Mpiga Kura</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                            {lang === 'sw' ? 'Namba ya Kitambulisho *' : 'ID Number *'}
                          </label>
                          <input
                            type="text"
                            value={dir.idNumber}
                            onChange={e => {
                              const val = e.target.value;
                              setDirectors(prev => prev.map(d => d.id === dir.id ? { ...d, idNumber: val } : d));
                            }}
                            placeholder="19900101-..."
                            className="w-full px-3 py-2 bg-slate-900 rounded-xl border border-slate-700 text-white font-mono"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-4 pt-1">
                        <div className="w-32">
                          <label className="block text-[10px] text-slate-400 mb-0.5">
                            {lang === 'sw' ? 'Hisa (%)' : 'Shareholding (%)'}
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={dir.shareholdingPercentage}
                            onChange={e => {
                              const val = parseFloat(e.target.value) || 0;
                              setDirectors(prev => prev.map(d => d.id === dir.id ? { ...d, shareholdingPercentage: val } : d));
                            }}
                            className="w-full px-3 py-1.5 bg-slate-900 rounded-xl border border-slate-700 text-white font-mono text-center"
                          />
                        </div>

                        {/* ID Upload Button for Director */}
                        <div className="flex-1">
                          <label className="block text-[10px] text-slate-400 mb-0.5">
                            {lang === 'sw' ? 'Nakala ya Kitambulisho' : 'ID Document Upload'}
                          </label>
                          <label className="px-3 py-1.5 bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-xl text-slate-300 hover:text-white flex items-center justify-center gap-2 cursor-pointer transition-colors">
                            <UploadCloud className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="truncate">
                              {dir.idDocumentName || (lang === 'sw' ? 'Pakia Kitambulisho cha Mkurugenzi' : 'Upload Director ID')}
                            </span>
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              className="hidden"
                              onChange={async (ev) => {
                                const f = ev.target.files?.[0];
                                if (!f) return;
                                try {
                                  const uploaded = await uploadKYCDocument(appId || 'draft', `director_id_${dir.id}`, f);
                                  setDirectors(prev => prev.map(d => d.id === dir.id ? { ...d, idDocumentUrl: uploaded.fileUrl, idDocumentName: f.name } : d));
                                  setSuccessToast(lang === 'sw' ? `Kitambulisho cha ${dir.fullName || 'Mkurugenzi'} kimepakiwa!` : 'Director ID uploaded!');
                                  setTimeout(() => setSuccessToast(null), 3000);
                                } catch (e: any) {
                                  setErrorMessage(e.message || 'Hitilafu wakati wa kupakia');
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 5: SOLE PROPRIETOR KYC                                   */}
          {/* ============================================================== */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-black text-white">
                  {lang === 'sw' ? 'Hatua ya 4/5: Utambulisho wa Mjasiriamali (Individual KYC)' : 'Step 4/5: Sole Proprietor Identity Verification'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {lang === 'sw'
                    ? 'Weka namba zako binafsi za utambulisho na pakia picha za kitambulisho mbele na nyuma pamoja na picha yako (Selfie).'
                    : 'Provide personal identity verification, front & back ID photos, and owner portrait (Selfie).'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    {lang === 'sw' ? 'Jina Kamili la Mmiliki *' : 'Owner Full Name *'}
                  </label>
                  <input
                    type="text"
                    value={soleOwnerName || applicantName}
                    onChange={e => setSoleOwnerName(e.target.value)}
                    required
                    placeholder="Mf. Bi. Amina Said Bakari"
                    className="w-full px-3 py-2.5 bg-slate-800 rounded-xl border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    {lang === 'sw' ? 'Tarehe ya Kuzaliwa (Date of Birth) *' : 'Date of Birth *'}
                  </label>
                  <input
                    type="date"
                    value={soleDob}
                    onChange={e => setSoleDob(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 bg-slate-800 rounded-xl border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    {lang === 'sw' ? 'Aina ya Kitambulisho Rasmi *' : 'National ID Document Type *'}
                  </label>
                  <select
                    value={soleIdType}
                    onChange={e => setSoleIdType(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-slate-800 rounded-xl border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="nida">NIDA (Kitambulisho cha Taifa)</option>
                    <option value="passport">Pasi ya Kusafiria (Tanzania Passport)</option>
                    <option value="driving_licence">Leseni ya Udereva</option>
                    <option value="voter_id">Kadi ya Mpiga Kura</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    {lang === 'sw' ? 'Namba ya Kitambulisho *' : 'ID Number *'}
                  </label>
                  <input
                    type="text"
                    value={soleIdNumber}
                    onChange={e => setSoleIdNumber(e.target.value)}
                    required
                    placeholder="19880512-11105-00001-22"
                    className="w-full px-3 py-2.5 bg-slate-800 rounded-xl border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    {lang === 'sw' ? 'Namba ya TIN ya Biashara/Binafsi *' : 'TIN Number *'}
                  </label>
                  <input
                    type="text"
                    value={tinNumber}
                    onChange={e => setTinNumber(e.target.value)}
                    required
                    placeholder="100-293-841"
                    className="w-full px-3 py-2.5 bg-slate-800 rounded-xl border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    {lang === 'sw' ? 'Namba ya Usajili wa Jina la Biashara (BRELA BN - Hiari)' : 'BRELA Business Name No. (Optional)'}
                  </label>
                  <input
                    type="text"
                    value={soleBrelaNameNumber}
                    onChange={e => setSoleBrelaNameNumber(e.target.value)}
                    placeholder="BN-294821"
                    className="w-full px-3 py-2.5 bg-slate-800 rounded-xl border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* Sole Proprietor Uploads Grid */}
              <div className="space-y-3 pt-2">
                <span className="text-xs font-bold text-slate-200 block uppercase tracking-wider">
                  {lang === 'sw' ? 'Pakia Picha na Nyaraka za Utambulisho:' : 'Identification Uploads:'}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                  
                  {/* ID Front */}
                  <DocumentUploadCard
                    docType="sole_id_front"
                    label={lang === 'sw' ? 'Kitambulisho Upande wa Mbele *' : 'ID Card Front Side *'}
                    existingDoc={getDocItem('sole_id_front')}
                    isUploading={uploadingDocType === 'sole_id_front'}
                    onUpload={file => handleFileUpload('sole_id_front', file, 'Kitambulisho Upande wa Mbele')}
                    onPreview={doc => setPreviewDoc({ title: doc.name, fileUrl: doc.fileUrl, fileType: doc.fileType })}
                    onRemove={handleRemoveDoc}
                    lang={lang}
                  />

                  {/* ID Back */}
                  <DocumentUploadCard
                    docType="sole_id_back"
                    label={lang === 'sw' ? 'Kitambulisho Upande wa Nyuma *' : 'ID Card Back Side *'}
                    existingDoc={getDocItem('sole_id_back')}
                    isUploading={uploadingDocType === 'sole_id_back'}
                    onUpload={file => handleFileUpload('sole_id_back', file, 'Kitambulisho Upande wa Nyuma')}
                    onPreview={doc => setPreviewDoc({ title: doc.name, fileUrl: doc.fileUrl, fileType: doc.fileType })}
                    onRemove={handleRemoveDoc}
                    lang={lang}
                  />

                  {/* Selfie / Photo */}
                  <DocumentUploadCard
                    docType="sole_selfie"
                    label={lang === 'sw' ? 'Picha ya Uso / Pasipoti (Selfie / Passport Photo) *' : 'Owner Portrait / Selfie *'}
                    existingDoc={getDocItem('sole_selfie')}
                    isUploading={uploadingDocType === 'sole_selfie'}
                    onUpload={file => handleFileUpload('sole_selfie', file, 'Picha ya Uso (Selfie)')}
                    onPreview={doc => setPreviewDoc({ title: doc.name, fileUrl: doc.fileUrl, fileType: doc.fileType })}
                    onRemove={handleRemoveDoc}
                    lang={lang}
                  />

                  {/* TIN Certificate */}
                  <DocumentUploadCard
                    docType="tin_certificate"
                    label={lang === 'sw' ? 'Cheti cha TIN *' : 'TIN Certificate *'}
                    existingDoc={getDocItem('tin_certificate')}
                    isUploading={uploadingDocType === 'tin_certificate'}
                    onUpload={file => handleFileUpload('tin_certificate', file, 'Cheti cha TIN')}
                    onPreview={doc => setPreviewDoc({ title: doc.name, fileUrl: doc.fileUrl, fileType: doc.fileType })}
                    onRemove={handleRemoveDoc}
                    lang={lang}
                  />

                  {/* Proof of Address */}
                  <DocumentUploadCard
                    docType="proof_of_address"
                    label={lang === 'sw' ? 'Uthibitisho wa Anwani (Bili ya LUKU, Barua ya Serikali ya Mtaa au Kodi) *' : 'Proof of Address (Utility/Local Gov Letter) *'}
                    existingDoc={getDocItem('proof_of_address')}
                    isUploading={uploadingDocType === 'proof_of_address'}
                    onUpload={file => handleFileUpload('proof_of_address', file, 'Uthibitisho wa Anwani')}
                    onPreview={doc => setPreviewDoc({ title: doc.name, fileUrl: doc.fileUrl, fileType: doc.fileType })}
                    onRemove={handleRemoveDoc}
                    lang={lang}
                  />

                  {/* Business Licence or Local Gov Letter */}
                  <DocumentUploadCard
                    docType="business_licence"
                    label={lang === 'sw' ? 'Leseni ya Biashara au Barua ya Eneo *' : 'Business Licence / Municipal Permit *'}
                    existingDoc={getDocItem('business_licence')}
                    isUploading={uploadingDocType === 'business_licence'}
                    onUpload={file => handleFileUpload('business_licence', file, 'Leseni ya Biashara')}
                    onPreview={doc => setPreviewDoc({ title: doc.name, fileUrl: doc.fileUrl, fileType: doc.fileType })}
                    onRemove={handleRemoveDoc}
                    lang={lang}
                  />

                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 6: SUBSCRIPTION PLAN & BILLING                           */}
          {/* ============================================================== */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-black text-white">
                  {lang === 'sw' ? 'Hatua ya 6: Chagua Mpango wa Usajili & Maelezo ya Malipo' : 'Step 6: Choose Subscription Plan & Billing Details'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {lang === 'sw'
                    ? 'Chagua mpango unaofaa ofisi yako. Utapata jaribio la bure la siku 14 (14-Day Free Trial) mara tu maombi yatakapoidhinishwa.'
                    : 'Select your preferred subscription plan. You will receive a 14-day free trial upon verification.'}
                </p>
              </div>

              {/* Plans Selection Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {plans.map(p => {
                  const isSelected = preferredPlanId === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setPreferredPlanId(p.id)}
                      className={`p-5 rounded-3xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10'
                          : 'border-slate-800 bg-slate-800/40 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-black uppercase text-emerald-400">
                            {p.name}
                          </span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                        </div>
                        <div className="text-xl font-black text-white font-mono">
                          {formatCurrency(p.priceMonthlyTZS, 'TZS')}
                        </div>
                        <span className="text-[10px] text-slate-400 block mb-3">
                          {lang === 'sw' ? 'kwa mwezi' : 'per month'}
                        </span>

                        <div className="border-t border-slate-700/60 pt-2 space-y-1 text-[11px] text-slate-300">
                          <div>• Hadi wafanyakazi <strong>{p.maxStaff}</strong></div>
                          <div>• Hadi ankara <strong>{p.maxInvoicesPerMonth}</strong>/mwezi</div>
                          <div>• Moduli <strong>{p.enabledModules?.length || 15}</strong> zimejumuishwa</div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-700/60">
                        <span className={`text-[10px] font-bold block text-center py-1.5 rounded-xl ${
                          isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {isSelected ? (lang === 'sw' ? 'Imechaguliwa ✓' : 'Selected ✓') : (lang === 'sw' ? 'Chagua Hii' : 'Select')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Billing Contact & Method */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-4 border-t border-slate-800">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    {lang === 'sw' ? 'Mtu wa Mawasiliano ya Bili *' : 'Billing Contact Person *'}
                  </label>
                  <input
                    type="text"
                    value={billingContactPerson || applicantName}
                    onChange={e => setBillingContactPerson(e.target.value)}
                    required
                    placeholder="Jina la Mhasibu au Msimamizi"
                    className="w-full px-3 py-2.5 bg-slate-800 rounded-xl border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    {lang === 'sw' ? 'Barua Pepe ya Ankara (Billing Email) *' : 'Billing Email *'}
                  </label>
                  <input
                    type="email"
                    value={billingEmail || email}
                    onChange={e => setBillingEmail(e.target.value)}
                    required
                    placeholder="finance@kampuni.co.tz"
                    className="w-full px-3 py-2.5 bg-slate-800 rounded-xl border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    {lang === 'sw' ? 'Njia ya Malipo Inayopendelewa *' : 'Preferred Payment Channel *'}
                  </label>
                  <select
                    value={preferredPaymentMethod}
                    onChange={e => setPreferredPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-slate-800 rounded-xl border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="mpesa">Vodacom M-Pesa (Lipa Namba)</option>
                    <option value="tigopesa">Tigo Pesa (Lipa Hapa)</option>
                    <option value="airtelmoney">Airtel Money</option>
                    <option value="bank">Akaunti ya Benki (CRDB Bank / NMB)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 7: REVIEW, E-SIGNATURE & SUBMISSION                      */}
          {/* ============================================================== */}
          {currentStep === 7 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-black text-white">
                  {lang === 'sw' ? 'Hatua ya 7: Hakiki Taarifa Zote & Saini ya Kielektroniki' : 'Step 7: Final Review & Electronic Declaration'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {lang === 'sw'
                    ? 'Kagua kwa makini taarifa zote zilizojazwa kabla ya kuwasilisha maombi rasmi kwa ajili ya uhakiki.'
                    : 'Carefully review all submitted details and attach your legal e-signature declaration.'}
                </p>
              </div>

              {/* Review Summary Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                
                {/* Entity Summary */}
                <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700/80 space-y-2">
                  <span className="font-bold text-emerald-400 uppercase text-[10px] tracking-wider block">
                    {lang === 'sw' ? 'Taarifa za Shirika:' : 'Organization Summary:'}
                  </span>
                  <div className="space-y-1 text-slate-300">
                    <div><strong>{legalName}</strong> {tradingName && `(${tradingName})`}</div>
                    <div>Aina: <strong className="text-white">{businessType === 'registered_company' ? 'Registered Company' : 'Sole Proprietor'}</strong></div>
                    <div>Sekta: {businessSector}</div>
                    <div>Anwani: {physicalAddress}, {district}, {region}</div>
                    <div>Simu: {businessPhone} · Email: {businessEmail || email}</div>
                  </div>
                </div>

                {/* Tax & Registration Summary */}
                <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700/80 space-y-2">
                  <span className="font-bold text-teal-400 uppercase text-[10px] tracking-wider block">
                    {lang === 'sw' ? 'Taarifa za Kodi & Usajili:' : 'Tax & Legal IDs:'}
                  </span>
                  <div className="space-y-1 text-slate-300">
                    <div>TIN: <strong className="font-mono text-white">{tinNumber || '-'}</strong></div>
                    {brelaNumber && <div>BRELA No: <strong className="font-mono text-white">{brelaNumber}</strong></div>}
                    {vrnNumber && <div>VRN (VAT): <strong className="font-mono text-white">{vrnNumber}</strong></div>}
                    <div>Leseni: <strong className="font-mono text-white">{licenceNumber || '-'}</strong></div>
                    <div>Mpango: <strong className="text-emerald-400 uppercase">{preferredPlanId}</strong></div>
                  </div>
                </div>

              </div>

              {/* Uploaded Documents List */}
              <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 text-xs">
                    {lang === 'sw' ? `Nyaraka Zilizopakiwa (${documents.length}):` : `Uploaded Attachments (${documents.length}):`}
                  </span>
                  {documents.length === 0 && (
                    <span className="text-[11px] text-amber-400">
                      {lang === 'sw' ? 'Hakuna nyaraka zilizopakiwa bado' : 'No documents uploaded yet'}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
                  {documents.map(doc => (
                    <div
                      key={doc.id}
                      className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="truncate text-slate-300 font-medium text-[11px]">{doc.name}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setPreviewDoc({ title: doc.name, fileUrl: doc.fileUrl, fileType: doc.fileType })}
                          className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                          title="Preview"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveDoc(doc.id)}
                          className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-400 hover:text-rose-300"
                          title="Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Legal Declaration & E-Signature */}
              <div className="p-5 bg-emerald-950/20 border border-emerald-500/30 rounded-3xl space-y-4 text-xs">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="accuracy-declaration"
                    checked={declarationAccepted}
                    onChange={e => setDeclarationAccepted(e.target.checked)}
                    className="mt-1 w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                  />
                  <label htmlFor="accuracy-declaration" className="text-xs leading-relaxed text-slate-200 cursor-pointer select-none">
                    <strong>{lang === 'sw' ? 'Tamko Rasmi la Ukweli (Declaration of Accuracy):' : 'Legal Declaration of Accuracy:'}</strong>{' '}
                    {lang === 'sw'
                      ? 'Nathibitisha na kutamka kisheria kuwa taarifa zote na nyaraka zilizowekwa katika maombi haya ni sahihi, halisi na hazijagushiwa kwa namna yoyote. Ninaelewa kuwa kutoa taarifa za uongo ni kosa la jinai chini ya sheria za Jamhuri ya Muungano wa Tanzania na litasababisha kusimamishwa mara moja kwa akaunti ya shirika langu.'
                      : 'I hereby declare and warrant that all information, tax records, and documents uploaded in this registration application are true, genuine, and unadulterated. I understand that submitting fraudulent or falsified documentation is a criminal offense under the laws of Tanzania and constitutes grounds for immediate suspension.'}
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-emerald-800/40">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">
                      {lang === 'sw' ? 'Sahihi ya Kielektroniki (Andika Jina Lako Kamili) *' : 'Electronic Signature (Type Full Legal Name) *'}
                    </label>
                    <input
                      ref={eSignatureRef}
                      type="text"
                      value={eSignatureName}
                      onChange={e => {
                        setESignatureName(e.target.value);
                        if (inlineErrors.eSignatureName) setInlineErrors(prev => ({ ...prev, eSignatureName: '' }));
                      }}
                      required
                      placeholder="Mf. Maria Mchome"
                      className={`w-full px-3 py-2.5 bg-slate-900 rounded-xl border ${
                        inlineErrors.eSignatureName ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-700'
                      } text-emerald-400 font-serif italic text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                    />
                    {inlineErrors.eSignatureName && (
                      <p className="text-[11px] text-rose-400 font-medium mt-1">{inlineErrors.eSignatureName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">
                      {lang === 'sw' ? 'Tarehe ya Kusaini *' : 'Date of Signing *'}
                    </label>
                    <input
                      type="date"
                      value={eSignatureDate}
                      onChange={e => setESignatureDate(e.target.value)}
                      required
                      className="w-full px-3 py-2.5 bg-slate-900 rounded-xl border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Bottom Action Control Bar */}
          <div className="pt-6 border-t border-slate-800 flex items-center justify-between flex-wrap gap-3 mt-6">
            
            <div className="flex items-center gap-2">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-2 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{lang === 'sw' ? 'Rudi Nyuma' : 'Previous'}</span>
                </button>
              )}

              {/* Save as Draft Button */}
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={isSavingDraft}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs flex items-center gap-2 border border-slate-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingDraft ? (lang === 'sw' ? 'Inahifadhi...' : 'Saving...') : (lang === 'sw' ? 'Hifadhi kama Rasimu' : 'Save as Draft')}</span>
              </button>
            </div>

            <div>
              {currentStep < 7 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
                >
                  <span>{lang === 'sw' ? 'Endelea na Hatua Inayofuata' : 'Next Step'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !declarationAccepted || !eSignatureName.trim()}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-xl shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isSubmitting ? (lang === 'sw' ? 'Inawasilisha Maombi...' : 'Submitting Application...') : (lang === 'sw' ? 'Wasilisha Maombi Rasmi (Submit)' : 'Submit KYC Application')}</span>
                </button>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* Document Preview Modal */}
      {previewDoc && (
        <DocumentPreviewModal
          isOpen={true}
          onClose={() => setPreviewDoc(null)}
          title={previewDoc.title}
          fileUrl={previewDoc.fileUrl}
          fileType={previewDoc.fileType}
        />
      )}

      {/* Terms & Privacy Modal */}
      <TermsPrivacyModal
        isOpen={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
        initialTab={termsTab}
      />

      {/* Email Verification Required Modal */}
      {showEmailVerifyBlockModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
              <Mail className="w-7 h-7" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-black text-white">
                {lang === 'sw' ? 'Uthibitisho wa Barua Pepe Unahitajika' : 'Email Verification Required'}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {lang === 'sw'
                  ? `Kabla ya kuwasilisha maombi rasmi ya KYC, ni lazima uthibitishe anwani yako ya barua pepe ("${email}"). Tafadhali fungua kiungo tulichokutumia kwenye kisanduku chako kabla ya kuwasilisha maombi ya mwisho.`
                  : `Before final submission of your KYC application, you must verify your email address ("${email}"). Please click the verification link sent to your inbox.`}
              </p>
            </div>

            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 text-[11px] text-slate-300 space-y-1">
              <span className="font-bold text-amber-400 block">
                {lang === 'sw' ? 'Haujaona barua pepe?' : 'Did not receive the email?'}
              </span>
              <p>
                {lang === 'sw'
                  ? 'Kagua kwenye folda ya "Spam" au "Junk". Unaweza pia kubonyeza kitufe cha kutuma tena hapa chini.'
                  : 'Check your spam or junk folder, or request a new link below.'}
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={async () => {
                  try {
                    await auth.currentUser?.reload();
                    if (auth.currentUser?.emailVerified) {
                      setShowEmailVerifyBlockModal(false);
                      handleSubmit();
                    } else {
                      setErrorMessage(
                        lang === 'sw'
                          ? 'Barua pepe bado haijathibitishwa. Tafadhali fungua kiungo kwenye barua pepe yako kwanza kisha ujaribu tena.'
                          : 'Email is not yet verified. Please click the link in your email first then try again.'
                      );
                    }
                  } catch (e: any) {
                    setErrorMessage(e.message || 'Hitilafu ya ukaguzi');
                  }
                }}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{lang === 'sw' ? 'Nimeshabonyeza Kiungo / Hakiki Tena' : "I've Verified, Continue"}</span>
              </button>

              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resendCooldown > 0 || isResendingEmail}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-2 border border-slate-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isResendingEmail ? 'animate-spin' : ''}`} />
                <span>
                  {resendCooldown > 0
                    ? (lang === 'sw' ? `Tuma tena kiungo (${resendCooldown}s)` : `Resend link (${resendCooldown}s)`)
                    : (lang === 'sw' ? 'Tuma Tena Kiungo cha Uthibitisho' : 'Resend Verification Link')}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setShowEmailVerifyBlockModal(false)}
                className="w-full py-2 text-center text-xs text-slate-400 hover:text-slate-300 font-semibold"
              >
                {lang === 'sw' ? 'Funga (Endelea kama Rasimu)' : 'Close (Keep as Draft)'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// =========================================================================
// SUB-COMPONENT: DOCUMENT UPLOAD CARD
// =========================================================================
interface DocumentUploadCardProps {
  docType: string;
  label: string;
  existingDoc?: KYCDocumentItem;
  isUploading: boolean;
  onUpload: (file: File) => void;
  onPreview: (doc: KYCDocumentItem) => void;
  onRemove: (docId: string) => void;
  lang: 'sw' | 'en';
}

const DocumentUploadCard: React.FC<DocumentUploadCardProps> = ({
  docType,
  label,
  existingDoc,
  isUploading,
  onUpload,
  onPreview,
  onRemove,
  lang
}) => {
  return (
    <div className="p-3.5 bg-slate-800/60 border border-slate-700/80 rounded-2xl flex flex-col justify-between space-y-2 text-xs">
      <div>
        <span className="font-bold text-slate-200 block truncate text-[11px] mb-1" title={label}>
          {label}
        </span>
        <span className="text-[10px] text-slate-400 block">PDF, JPG au PNG (Max 10MB)</span>
      </div>

      {existingDoc ? (
        <div className="p-2 bg-slate-900 rounded-xl border border-emerald-500/40 flex items-center justify-between">
          <div className="flex items-center gap-1.5 truncate pr-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate text-emerald-300 font-mono text-[10px]">
              {existingDoc.name}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => onPreview(existingDoc)}
              className="p-1 rounded-md bg-slate-800 text-slate-300 hover:text-white"
              title="Preview"
            >
              <Eye className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => onRemove(existingDoc.id)}
              className="p-1 rounded-md bg-slate-800 text-rose-400 hover:text-rose-300"
              title="Remove"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      ) : (
        <label className="py-2 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 hover:text-white flex items-center justify-center gap-2 cursor-pointer transition-colors">
          <UploadCloud className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[11px] font-bold">
            {isUploading ? (lang === 'sw' ? 'Inapakia...' : 'Uploading...') : (lang === 'sw' ? 'Chagua Faili' : 'Select File')}
          </span>
          <input
            type="file"
            accept="image/*,application/pdf"
            disabled={isUploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUpload(file);
            }}
            className="hidden"
          />
        </label>
      )}
    </div>
  );
};
