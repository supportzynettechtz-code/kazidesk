/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Building2,
  CreditCard,
  Globe,
  UserPlus,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Check,
  X,
  FileCheck
} from 'lucide-react';
import { Company } from '../../types/saas';
import { CompanyBillingProfile, Employee } from '../../types/office';
import { saveTenantDocument } from '../../services/companyDataService';
import { updateCompany, logAuditAction } from '../../services/tenantService';

interface FirstLoginSetupWizardProps {
  isOpen: boolean;
  onClose: () => void;
  company: Company;
  billingProfile?: CompanyBillingProfile | null;
  onComplete: (updatedCompany: Company, updatedProfile: CompanyBillingProfile, firstStaff?: Employee) => void;
  lang: 'sw' | 'en';
}

export const FirstLoginSetupWizard: React.FC<FirstLoginSetupWizardProps> = ({
  isOpen,
  onClose,
  company,
  billingProfile,
  onComplete,
  lang,
}) => {
  const [step, setStep] = useState<number>(1);
  const [isSaving, setIsSaving] = useState(false);

  // Form State: Step 1 (Company Details)
  const [companyName, setCompanyName] = useState(company.name || '');
  const [tin, setTin] = useState(company.tin || '');
  const [vrn, setVrn] = useState(company.vrn || '');
  const [address, setAddress] = useState(company.address || '');
  const [phone, setPhone] = useState(company.phone || '');
  const [email, setEmail] = useState(company.email || '');
  const [logoUrl, setLogoUrl] = useState(company.logoUrl || '');

  // Form State: Step 2 (Bank & Tax Details)
  const [bankName, setBankName] = useState(billingProfile?.bankName || 'CRDB Bank Plc');
  const [accountName, setAccountName] = useState(billingProfile?.accountName || company.name || '');
  const [accountNumber, setAccountNumber] = useState(billingProfile?.accountNumber || '');
  const [branch, setBranch] = useState(billingProfile?.branch || 'Dar es Salaam');
  const [mobileMoneyName, setMobileMoneyName] = useState(billingProfile?.mobileMoneyName || 'Lipa Hapa (M-Pesa / Tigo)');
  const [mobileMoneyNumber, setMobileMoneyNumber] = useState(billingProfile?.mobileMoneyNumber || '');
  const [defaultVatEnabled, setDefaultVatEnabled] = useState(billingProfile?.defaultVatEnabled ?? true);
  const [quotationPrefix, setQuotationPrefix] = useState(billingProfile?.quotationPrefix || 'QT-');
  const [invoicePrefix, setInvoicePrefix] = useState(billingProfile?.invoicePrefix || 'INV-');

  // Form State: Step 3 (Preferences & Branding)
  const [brandColor, setBrandColor] = useState(company.brandColor || 'emerald');
  const [defaultCurrency, setDefaultCurrency] = useState<'TZS' | 'USD'>('TZS');
  const [defaultLang, setDefaultLang] = useState<'sw' | 'en'>(lang);

  // Form State: Step 4 (First Staff Member)
  const [staffName, setStaffName] = useState(company.contactPerson || '');
  const [staffRole, setStaffRole] = useState('Meneja Uendeshaji (Operations Manager)');
  const [staffDepartment, setStaffDepartment] = useState('Utawala & Uongozi');
  const [staffPhone, setStaffPhone] = useState(company.phone || '');
  const [staffEmail, setStaffEmail] = useState(company.adminEmail || '');
  const [staffSalary, setStaffSalary] = useState('1200000');

  if (!isOpen) return null;

  const handleFinishWizard = async () => {
    setIsSaving(true);
    try {
      const updatedCompany: Company = {
        ...company,
        name: companyName.trim() || company.name,
        tin: tin.trim(),
        vrn: vrn.trim(),
        address: address.trim(),
        phone: phone.trim(),
        email: email.trim(),
        logoUrl: logoUrl.trim() || company.logoUrl,
        brandColor,
        isOnboarded: true,
        updatedAt: new Date().toISOString(),
      };

      const updatedProfile: CompanyBillingProfile = {
        companyName: companyName.trim() || company.name,
        tradingName: companyName.trim() || company.name,
        tagline: 'KaziDesk Partner',
        logoUrl: logoUrl.trim() || company.logoUrl || '',
        tinNumber: tin.trim(),
        vrnNumber: vrn.trim(),
        registrationNumber: 'BRELA-TZ',
        address: address.trim(),
        city: 'Dar es Salaam',
        country: 'Tanzania',
        phone: phone.trim(),
        email: email.trim(),
        website: '',
        bankName: bankName.trim(),
        accountName: accountName.trim(),
        accountNumber: accountNumber.trim(),
        branch: branch.trim(),
        swiftCode: 'CORUTZTZ',
        mobileMoneyProvider: 'Vodacom M-Pesa / Tigo Pesa',
        mobileMoneyNumber: mobileMoneyNumber.trim(),
        mobileMoneyName: mobileMoneyName.trim(),
        defaultVatRate: 18,
        defaultVatEnabled,
        defaultPaymentTerms: 'Malipo yafanyike ndani ya siku 14 tangu tarehe ya ankara.',
        defaultQuotationValidityDays: 30,
        quotationPrefix,
        invoicePrefix,
        signatoryName: staffName.trim() || company.contactPerson || 'Mkurugenzi',
        signatoryTitle: staffRole.trim() || 'Mkurugenzi Mtendaji',
      };

      let firstStaff: Employee | undefined;
      if (staffName.trim()) {
        firstStaff = {
          id: `EMP-${Date.now()}`,
          employeeNo: 'EMP-001',
          fullName: staffName.trim(),
          roleTitle: staffRole.trim(),
          department: 'Utawala & Uongozi',
          phone: staffPhone.trim() || company.phone,
          email: staffEmail.trim() || company.adminEmail || 'admin@company.co.tz',
          joinDate: new Date().toISOString().split('T')[0],
          contractType: 'Kazi ya Kudumu',
          basicSalary: Number(staffSalary) || 1200000,
          allowances: {
            housing: 150000,
            transport: 100000,
            communication: 50000,
            other: 0,
          },
          bankName: bankName.trim() || 'CRDB Bank',
          accountNumber: accountNumber.trim() || '0150XXXXXXX',
          nssfNumber: 'NSSF-882910',
          tinNumber: tin.trim() || '123-456-789',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          status: 'active',
          emergencyContact: {
            name: 'Ndugu wa Karibu',
            relationship: 'Familia',
            phone: staffPhone.trim() || company.phone,
          },
          pin: '1234',
          cardId: 'KD-CARD-001',
          cardIssuedDate: new Date().toISOString().split('T')[0],
          cardExpiryDate: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
          biometricFingerprintEnrolled: true,
          biometricTemplateId: 'FP-001',
          accessLevel: 4,
          allowedZones: ['Ofisi Kuu', 'Chumba cha Seva', 'Ofisi ya Fedha'],
          allowedModules: ['dashboard', 'quotations', 'attendance', 'employees', 'tasks', 'payroll'],
          shiftHours: { start: '08:00', end: '17:00' },
          accountStatus: 'active',
        };
        await saveTenantDocument(company.id, 'staff', firstStaff);
      }

      await updateCompany(company.id, updatedCompany);
      await saveTenantDocument(company.id, 'settings', { ...updatedProfile, id: 'profile' });
      await logAuditAction('COMPLETE_ONBOARDING_WIZARD', company.id, companyName, 'Completed first-time setup wizard');

      onComplete(updatedCompany, updatedProfile, firstStaff);
      onClose();
    } catch (e) {
      console.error('Wizard error:', e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100 flex flex-col max-h-[90vh] my-6">
        
        {/* Top Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-emerald-600/10 via-teal-600/10 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-md shadow-emerald-600/20">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block">
                  MWONGOZO WA AWALI · KAZIDESK SETUP WIZARD
                </span>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  Karibu {companyName || 'Kwenye KaziDesk'}!
                </h2>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stepper Progress */}
          <div className="grid grid-cols-4 gap-2 pt-6">
            {[
              { num: 1, title: 'Kampuni', icon: Building2 },
              { num: 2, title: 'Benki & Kodi', icon: CreditCard },
              { num: 3, title: 'Lugha & Chapa', icon: Globe },
              { num: 4, title: 'Wafanyakazi', icon: UserPlus },
            ].map((s) => (
              <div
                key={s.num}
                onClick={() => setStep(s.num)}
                className={`cursor-pointer p-2 rounded-xl text-center border transition-all ${
                  step === s.num
                    ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-sm'
                    : step > s.num
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-center gap-1.5 text-xs">
                  {step > s.num ? <Check className="w-3.5 h-3.5" /> : <span>{s.num}.</span>}
                  <span className="hidden sm:inline">{s.title}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Step Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-4 text-xs">
          
          {/* STEP 1: Company Profile */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">Hatua ya 1: Taarifa za Msingi za Kampuni</h3>
                <p className="text-slate-500 text-[11px] mt-0.5">Taarifa hizi zitatumika kwenye vichwa vya ankara, nukuu, na ripoti zako.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Jina Kamili la Kampuni / Biashara *</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    placeholder="mf. Kilimanjaro Logistics & Freight Ltd"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nambari ya TIN (TRA) *</label>
                  <input
                    type="text"
                    value={tin}
                    onChange={e => setTin(e.target.value)}
                    placeholder="123-456-789"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nambari ya VRN (VAT)</label>
                  <input
                    type="text"
                    value={vrn}
                    onChange={e => setVrn(e.target.value)}
                    placeholder="40-001234-X"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Anuani ya Ofisi / Mahali Ilipo *</label>
                  <input
                    type="text"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Mtaa wa Samora, Jengo la Golden Jubilee, Ghorofa ya 5, Dar es Salaam"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Simu ya Ofisi *</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+255 775 740 386"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Barua Pepe ya Ofisi *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="info@kampuniyako.co.tz"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Kiunganishi cha Nembo (Logo URL)</label>
                  <input
                    type="url"
                    value={logoUrl}
                    onChange={e => setLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Bank & Billing */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">Hatua ya 2: Akaunti za Benki, Simu & Kodi</h3>
                <p className="text-slate-500 text-[11px] mt-0.5">Taarifa hizi zitaonekana chini ya ankara zako kwa wateja kulipia.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Jina la Benki</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={e => setBankName(e.target.value)}
                    placeholder="CRDB Bank Plc / NMB Bank"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tawi la Benki (Branch)</label>
                  <input
                    type="text"
                    value={branch}
                    onChange={e => setBranch(e.target.value)}
                    placeholder="Samora Tower Branch, Dar es Salaam"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Jina la Akaunti ya Benki</label>
                  <input
                    type="text"
                    value={accountName}
                    onChange={e => setAccountName(e.target.value)}
                    placeholder="Jina la Kampuni"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nambari ya Akaunti ya Benki</label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={e => setAccountNumber(e.target.value)}
                    placeholder="0150XXXXXXXX (TZS)"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Jina la Lipa Namba (Mobile Money)</label>
                  <input
                    type="text"
                    value={mobileMoneyName}
                    onChange={e => setMobileMoneyName(e.target.value)}
                    placeholder="M-Pesa / Tigo Pesa Lipa Namba"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Namba ya Malipo (Lipa Namba)</label>
                  <input
                    type="text"
                    value={mobileMoneyNumber}
                    onChange={e => setMobileMoneyNumber(e.target.value)}
                    placeholder="5678123 au 0775 740 386"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                  />
                </div>

                <div className="sm:col-span-2 p-3 bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between">
                  <div>
                    <strong className="text-slate-900 dark:text-white block">Ujumuishaji wa VAT (18%) Kiotomatiki</strong>
                    <span className="text-slate-500 text-[11px]">Washa kama bidhaa/huduma zako zote zinajumuisha VAT 18%.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={defaultVatEnabled}
                    onChange={e => setDefaultVatEnabled(e.target.checked)}
                    className="w-5 h-5 accent-emerald-600 rounded"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Language & Branding */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">Hatua ya 3: Lugha, Sarafu & Chapa (Branding)</h3>
                <p className="text-slate-500 text-[11px] mt-0.5">Weka muonekano unaoakisi biashara yako.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">Lugha ya Msingi ya Mfumo</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setDefaultLang('sw')}
                      className={`flex-1 py-2 rounded-lg font-bold text-xs border ${
                        defaultLang === 'sw' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      Kiswahili (Default)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDefaultLang('en')}
                      className={`flex-1 py-2 rounded-lg font-bold text-xs border ${
                        defaultLang === 'en' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      English
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">Sarafu ya Msingi ya Kiofisi</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setDefaultCurrency('TZS')}
                      className={`flex-1 py-2 rounded-lg font-bold text-xs border ${
                        defaultCurrency === 'TZS' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      Shilingi (TZS)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDefaultCurrency('USD')}
                      className={`flex-1 py-2 rounded-lg font-bold text-xs border ${
                        defaultCurrency === 'USD' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      Dola (USD)
                    </button>
                  </div>
                </div>

                <div className="sm:col-span-2 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">Rangi ya Chapa ya Kampuni (Brand Accent Color)</label>
                  <div className="flex flex-wrap gap-3 pt-1">
                    {[
                      { id: 'emerald', label: 'Emerald Green', bg: 'bg-emerald-600' },
                      { id: 'blue', label: 'Ocean Blue', bg: 'bg-blue-600' },
                      { id: 'indigo', label: 'Deep Indigo', bg: 'bg-indigo-600' },
                      { id: 'teal', label: 'Teal Modern', bg: 'bg-teal-600' },
                      { id: 'amber', label: 'Warm Amber', bg: 'bg-amber-600' },
                    ].map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setBrandColor(c.id)}
                        className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 text-xs font-bold transition-all ${
                          brandColor === c.id ? 'border-slate-900 dark:border-white shadow-sm ring-2 ring-emerald-500/30' : 'border-slate-200 dark:border-slate-700 opacity-80'
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded-full ${c.bg}`} />
                        <span>{c.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Add First Staff Member */}
          {step === 4 && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">Hatua ya 4: Sajili Mfanyakazi wa Kwanza</h3>
                <p className="text-slate-500 text-[11px] mt-0.5">Sajili mfanyakazi wa kwanza au msimamizi wa ofisi atakayekuwa na kitambulisho cha kidijitali.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Jina Kamili *</label>
                  <input
                    type="text"
                    value={staffName}
                    onChange={e => setStaffName(e.target.value)}
                    placeholder="mf. Juma Mwamburi"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Wadhifa (Job Title) *</label>
                  <input
                    type="text"
                    value={staffRole}
                    onChange={e => setStaffRole(e.target.value)}
                    placeholder="Meneja Uendeshaji"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Kitengo (Department) *</label>
                  <select
                    value={staffDepartment}
                    onChange={e => setStaffDepartment(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="Utawala">Utawala (Administration)</option>
                    <option value="Uhasibu na Fedha">Uhasibu na Fedha (Finance)</option>
                    <option value="Rasilimali Watu">Rasilimali Watu (HR)</option>
                    <option value="Masoko & Mauzo">Masoko & Mauzo (Sales)</option>
                    <option value="Teknolojia & TEHAMA">Teknolojia & TEHAMA (IT)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Simu ya Mfanyakazi</label>
                  <input
                    type="text"
                    value={staffPhone}
                    onChange={e => setStaffPhone(e.target.value)}
                    placeholder="+255 775 740 386"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Barua Pepe ya Mfanyakazi</label>
                  <input
                    type="email"
                    value={staffEmail}
                    onChange={e => setStaffEmail(e.target.value)}
                    placeholder="juma@kampuniyako.co.tz"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Mshahara wa Msingi (TZS / Mwezi)</label>
                  <input
                    type="number"
                    value={staffSalary}
                    onChange={e => setStaffSalary(e.target.value)}
                    placeholder="1200000"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                  />
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Navigation Buttons */}
        <div className="p-4 sm:p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Nyuma</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold text-xs"
            >
              Kamilisha Baadaye
            </button>
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center gap-2 shadow-md transition-all active:scale-95"
            >
              <span>Endelea</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinishWizard}
              disabled={isSaving}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all active:scale-95 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSaving ? 'Inahifadhi...' : 'Kamilisha & Anza Kutumia KaziDesk'}</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
