/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { translations, TranslationSchema } from '../utils/translations';
import { formatDate as baseFormatDate, formatCurrency as baseFormatCurrency } from '../utils/formatters';

export type SupportedLanguage = 'sw' | 'en';

export interface DynamicDataDictionary {
  [key: string]: {
    sw: string;
    en: string;
  };
}

export interface TranslationContextType {
  // Current language and switcher
  lang: SupportedLanguage;
  setLang: (lang: SupportedLanguage) => void;
  toggleLang: () => void;
  isSwahili: boolean;
  isEnglish: boolean;

  // Static translations dictionary for current language
  t: TranslationSchema;

  // Keypath-based translator function: tKey('nav.dashboard') or with fallback
  tKey: (path: string, fallback?: string) => string;

  // Dynamic entity/data translator: translates status, departments, priorities, roles, categories etc.
  translateDynamic: (term: string | null | undefined, fallback?: string) => string;

  // Localized date formatter
  formatDate: (dateString?: string) => string;

  // Localized currency formatter
  formatCurrency: (amount: number, currency?: 'TZS' | 'USD') => string;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'kazidesk_app_language_v1';

/**
 * Common dynamic terms found throughout KaziDesk records:
 * Roles, statuses, departments, priorities, document categories, contract types, leave types, etc.
 */
export const DYNAMIC_TERMS: DynamicDataDictionary = {
  // System Roles & Positions
  'admin': { sw: 'Mkurugenzi (Admin)', en: 'Director (Admin)' },
  'hr': { sw: 'Meneja HR', en: 'HR Manager' },
  'finance': { sw: 'Afisa Fedha', en: 'Finance Officer' },
  'staff': { sw: 'Mfanyakazi', en: 'Staff Member' },
  'employee': { sw: 'Mfanyakazi', en: 'Employee' },
  'superadmin': { sw: 'Msimamizi Mkuu', en: 'Super Admin' },
  'sales': { sw: 'Afisa Masoko', en: 'Sales Officer' },
  'auditor': { sw: 'Mkaguzi wa Ndani', en: 'Internal Auditor' },

  // Departments
  'Utawala': { sw: 'Utawala & Uongozi', en: 'Administration & Leadership' },
  'Rasilimali Watu': { sw: 'Rasilimali Watu (HR)', en: 'Human Resources (HR)' },
  'Fedha & Uhasibu': { sw: 'Fedha & Uhasibu', en: 'Finance & Accounting' },
  'TEHAMA & Teknolojia': { sw: 'TEHAMA & Teknolojia', en: 'ICT & Technology' },
  'Masoko & Mauzo': { sw: 'Masoko & Mauzo', en: 'Sales & Marketing' },
  'Uendeshaji & Vifaa': { sw: 'Uendeshaji & Vifaa', en: 'Operations & Logistics' },
  'Sheria & Mikataba': { sw: 'Sheria & Mikataba', en: 'Legal & Contracts' },
  'Huduma kwa Wateja': { sw: 'Huduma kwa Wateja', en: 'Customer Support' },

  // Task & Approval Statuses
  'todo': { sw: 'Kazi Mpya', en: 'To Do' },
  'in_progress': { sw: 'Inafanyika', en: 'In Progress' },
  'in-progress': { sw: 'Inafanyika', en: 'In Progress' },
  'review': { sw: 'Inapitiwa', en: 'Under Review' },
  'under_review': { sw: 'Inapitiwa', en: 'Under Review' },
  'completed': { sw: 'Imekamilika', en: 'Completed' },
  'done': { sw: 'Imekamilika', en: 'Done' },
  'pending': { sw: 'Inasubiri', en: 'Pending' },
  'approved': { sw: 'Imeidhinishwa', en: 'Approved' },
  'rejected': { sw: 'Imekataliwa', en: 'Rejected' },
  'cancelled': { sw: 'Imeghairiwa', en: 'Cancelled' },
  'more_info_required': { sw: 'Taarifa Zaidi Zahitajika', en: 'More Info Required' },
  'draft': { sw: 'Rasimu', en: 'Draft' },
  'submitted': { sw: 'Imewasilishwa', en: 'Submitted' },
  'active': { sw: 'Inafanya Kazi', en: 'Active' },
  'suspended': { sw: 'Imesimamishwa', en: 'Suspended' },
  'trial': { sw: 'Majaribio', en: 'Trial' },
  'expired': { sw: 'Muda Umeisha', en: 'Expired' },

  // Attendance Statuses & Locations
  'present': { sw: 'Yupo Kazini', en: 'Present' },
  'late': { sw: 'Amechelewa', en: 'Late' },
  'absent': { sw: 'Hajaingia', en: 'Absent' },
  'on_leave': { sw: 'Yupo Likizo', en: 'On Leave' },
  'half_day': { sw: 'Nusu Siku', en: 'Half Day' },
  'office': { sw: 'Ofisini (HQ)', en: 'Headquarters Office' },
  'remote': { sw: 'Nyumbani / Remote', en: 'Remote / Home' },
  'field': { sw: 'Shambani / Field', en: 'On-Site / Field' },

  // Priorities
  'urgent': { sw: 'Dharura / Muhimu Sana', en: 'Urgent' },
  'high': { sw: 'Kipaumbele cha Juu', en: 'High' },
  'medium': { sw: 'Kawaida', en: 'Medium' },
  'low': { sw: 'Chini', en: 'Low' },
  'Dharura': { sw: 'Dharura', en: 'Urgent' },
  'Muhimu': { sw: 'Muhimu', en: 'Important' },
  'Kawaida': { sw: 'Kawaida', en: 'Normal' },

  // Leave Types
  'annual': { sw: 'Likizo ya Mwaka', en: 'Annual Leave' },
  'sick': { sw: 'Likizo ya Ugonjwa', en: 'Sick Leave' },
  'maternity': { sw: 'Likizo ya Uzazi (Mama)', en: 'Maternity Leave' },
  'paternity': { sw: 'Likizo ya Uzazi (Baba)', en: 'Paternity Leave' },
  'compassionate': { sw: 'Likizo ya Msiba / Dharura', en: 'Compassionate Leave' },
  'leave_unpaid': { sw: 'Likizo Isiyo na Malipo', en: 'Unpaid Leave' },

  // Billing & Invoices
  'paid': { sw: 'Imelipwa', en: 'Paid' },
  'unpaid': { sw: 'Haijalipwa', en: 'Unpaid' },
  'partial': { sw: 'Imelipwa Kiasi', en: 'Partially Paid' },
  'overdue': { sw: 'Imechelewa', en: 'Overdue' },
  'converted': { sw: 'Imegeuzwa Ankara', en: 'Converted' },
  'bank': { sw: 'Akaunti ya Benki', en: 'Bank Transfer' },
  'mpesa': { sw: 'M-Pesa (Vodacom)', en: 'M-Pesa (Vodacom)' },
  'tigopesa': { sw: 'Tigo Pesa', en: 'Tigo Pesa' },
  'airtelmoney': { sw: 'Airtel Money', en: 'Airtel Money' },
  'cash': { sw: 'Pesa Taslimu', en: 'Cash' },

  // Document Categories
  'letter_in': { sw: 'Barua Iliyoingia', en: 'Incoming Letter' },
  'letter_out': { sw: 'Barua Iliyotoka', en: 'Outgoing Letter' },
  'memo': { sw: 'Waraka wa Ndani (Memo)', en: 'Internal Memo' },
  'minutes': { sw: 'Kumbukumbu za Mkutano', en: 'Meeting Minutes' },
  'contract': { sw: 'Mkataba', en: 'Contract' },
  'policy': { sw: 'Sera ya Ofisi', en: 'Company Policy' },
  'financial': { sw: 'Ripoti ya Fedha', en: 'Financial Report' },

  // Business Types
  'registered_company': { sw: 'Kampuni Iliyosajiliwa (Ltd, NGO, Shirika)', en: 'Registered Company (Ltd, NGO, Institution)' },
  'sole_proprietor': { sw: 'Mfanyabiashara Binafsi (Sole Proprietor)', en: 'Sole Proprietor / Individual' },

  // Asset Conditions
  'good': { sw: 'Nzuri Sana', en: 'Excellent / Good' },
  'fair': { sw: 'Inafaa', en: 'Fair' },
  'repair': { sw: 'Inahitaji Matengenezo', en: 'Needs Repair' },
  'damaged': { sw: 'Imeharibika', en: 'Damaged' },
};

interface TranslationProviderProps {
  children: ReactNode;
  initialLang?: SupportedLanguage;
  onLanguageChange?: (newLang: SupportedLanguage) => void;
}

export const TranslationProvider: React.FC<TranslationProviderProps> = ({
  children,
  initialLang,
  onLanguageChange,
}) => {
  const [lang, setLangState] = useState<SupportedLanguage>(() => {
    if (initialLang) return initialLang;
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY) as SupportedLanguage;
      if (stored === 'sw' || stored === 'en') return stored;
    }
    return 'sw'; // Default is Swahili as requested by user
  });

  // Keep state in sync with external initialLang prop if changed
  useEffect(() => {
    if (initialLang && initialLang !== lang) {
      setLangState(initialLang);
    }
  }, [initialLang]);

  // Persist language preference
  const setLang = useCallback((newLang: SupportedLanguage) => {
    setLangState(newLang);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, newLang);
      } catch (e) {
        console.warn('Could not persist language to localStorage', e);
      }
    }
    if (onLanguageChange) {
      onLanguageChange(newLang);
    }
  }, [onLanguageChange]);

  const toggleLang = useCallback(() => {
    setLang(lang === 'sw' ? 'en' : 'sw');
  }, [lang, setLang]);

  // Active translation dictionary
  const t = useMemo(() => {
    return translations[lang] || translations.sw;
  }, [lang]);

  // Helper to safely navigate nested key paths like "nav.dashboard" or "topBar.clockIn"
  const tKey = useCallback((path: string, fallback?: string): string => {
    if (!path) return fallback || '';
    const keys = path.split('.');
    let current: any = translations[lang] || translations.sw;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        // Fallback to swahili if missing in current lang
        let fallbackCurrent: any = translations.sw;
        for (const fKey of keys) {
          if (fallbackCurrent && typeof fallbackCurrent === 'object' && fKey in fallbackCurrent) {
            fallbackCurrent = fallbackCurrent[fKey];
          } else {
            fallbackCurrent = undefined;
            break;
          }
        }
        return typeof fallbackCurrent === 'string' ? fallbackCurrent : (fallback || path);
      }
    }

    return typeof current === 'string' ? current : (fallback || path);
  }, [lang]);

  // Translate dynamic business terms like roles, statuses, departments
  const translateDynamic = useCallback((term: string | null | undefined, fallback?: string): string => {
    if (!term) return fallback || '';
    const trimmed = String(term).trim();
    const lower = trimmed.toLowerCase();

    // Check direct dictionary
    if (DYNAMIC_TERMS[trimmed]) {
      return DYNAMIC_TERMS[trimmed][lang];
    }
    if (DYNAMIC_TERMS[lower]) {
      return DYNAMIC_TERMS[lower][lang];
    }

    // Try common status mappings
    if (lower === 'inprogress' || lower === 'in_progress') return lang === 'sw' ? 'Inafanyika' : 'In Progress';
    if (lower === 'todo' || lower === 'to_do') return lang === 'sw' ? 'Kazi Mpya' : 'To Do';
    if (lower === 'completed' || lower === 'complete') return lang === 'sw' ? 'Imekamilika' : 'Completed';
    if (lower === 'pending') return lang === 'sw' ? 'Inasubiri' : 'Pending';
    if (lower === 'approved') return lang === 'sw' ? 'Imeidhinishwa' : 'Approved';
    if (lower === 'rejected') return lang === 'sw' ? 'Imekataliwa' : 'Rejected';
    if (lower === 'active') return lang === 'sw' ? 'Inafanya Kazi' : 'Active';
    if (lower === 'suspended') return lang === 'sw' ? 'Imesimamishwa' : 'Suspended';
    if (lower === 'draft') return lang === 'sw' ? 'Rasimu' : 'Draft';
    if (lower === 'submitted') return lang === 'sw' ? 'Imewasilishwa' : 'Submitted';

    return fallback || trimmed;
  }, [lang]);

  // Context-aware date formatter
  const formatDate = useCallback((dateString?: string): string => {
    return baseFormatDate(dateString || '', lang);
  }, [lang]);

  // Context-aware currency formatter
  const formatCurrency = useCallback((amount: number, currency: 'TZS' | 'USD' = 'TZS'): string => {
    return baseFormatCurrency(amount, currency);
  }, []);

  const value: TranslationContextType = useMemo(() => ({
    lang,
    setLang,
    toggleLang,
    isSwahili: lang === 'sw',
    isEnglish: lang === 'en',
    t,
    tKey,
    translateDynamic,
    formatDate,
    formatCurrency,
  }), [lang, setLang, toggleLang, t, tKey, translateDynamic, formatDate, formatCurrency]);

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
};

/**
 * Primary custom hook for using translations anywhere in the application
 */
export const useTranslation = (): TranslationContextType => {
  const context = useContext(TranslationContext);
  if (!context) {
    // Graceful fallback if called outside TranslationProvider
    return {
      lang: 'sw',
      setLang: () => {},
      toggleLang: () => {},
      isSwahili: true,
      isEnglish: false,
      t: translations.sw,
      tKey: (path: string, fallback?: string) => fallback || path,
      translateDynamic: (term: string | null | undefined, fallback?: string) => fallback || String(term || ''),
      formatDate: (dateString?: string) => baseFormatDate(dateString || '', 'sw'),
      formatCurrency: (amount: number, currency: 'TZS' | 'USD' = 'TZS') => baseFormatCurrency(amount, currency),
    };
  }
  return context;
};
