import React, { useState, useMemo, useEffect } from 'react';
import {
  FileText,
  FileCheck,
  Plus,
  Search,
  Filter,
  Printer,
  Download,
  CreditCard,
  Building,
  Users,
  Package,
  Settings,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Eye,
  Trash2,
  Edit,
  DollarSign,
  Send,
  RefreshCw,
  Percent,
  Check,
  ChevronDown,
  X,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Layers,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Coins
} from 'lucide-react';

import {
  CurrentUser,
  Client,
  CatalogueItem,
  Quotation,
  Invoice,
  InvoicePayment,
  CompanyBillingProfile,
  QuotationStatus,
  InvoiceStatus,
  LineItem,
  ConsumableItem,
  InventoryTransaction
} from '../../types/office';

import { formatCurrency, formatDate, formatAmountInWords } from '../../utils/formatters';
import { exportToCSV } from '../../utils/storage';
import { translations } from '../../utils/translations';
import { INITIAL_BILLING_PROFILE } from '../../data/initialData';

interface QuotationsInvoicesViewProps {
  lang: 'sw' | 'en';
  currency: 'TZS' | 'USD';
  currentUser?: CurrentUser;
  currentUserRole?: string;
  currentUserName?: string;
  clients: Client[];
  catalogueItems: CatalogueItem[];
  quotations: Quotation[];
  invoices: Invoice[];
  profile?: CompanyBillingProfile;
  billingProfile?: CompanyBillingProfile;
  consumables?: ConsumableItem[];
  onSaveClients: (clients: Client[]) => void;
  onSaveCatalogueItems: (items: CatalogueItem[]) => void;
  onSaveQuotations: (quotes: Quotation[]) => void;
  onSaveInvoices: (invoices: Invoice[]) => void;
  onSaveProfile?: (profile: CompanyBillingProfile) => void;
  onSaveBillingProfile?: (profile: CompanyBillingProfile) => void;
  onDeductStock?: (itemId: string, quantity: number, invoiceRef: string) => void;
  onDeductInventoryStock?: (itemId: string, quantity: number, invoiceRef: string) => void;
}

export const QuotationsInvoicesView: React.FC<QuotationsInvoicesViewProps> = ({
  lang,
  currency,
  currentUser,
  currentUserRole = currentUser?.role || 'admin',
  currentUserName = currentUser?.name || 'Mtumiaji',
  clients,
  catalogueItems,
  quotations,
  invoices,
  profile,
  billingProfile: propBillingProfile,
  consumables = [],
  onSaveClients,
  onSaveCatalogueItems,
  onSaveQuotations,
  onSaveInvoices,
  onSaveProfile,
  onSaveBillingProfile = onSaveProfile || (() => {}),
  onDeductStock,
  onDeductInventoryStock = onDeductStock,
}) => {
  // Always ensure a complete, valid billing profile object
  const billingProfile: CompanyBillingProfile = useMemo(() => {
    return propBillingProfile || profile || INITIAL_BILLING_PROFILE;
  }, [propBillingProfile, profile]);

  const t = translations[lang];
  const b = t.billing;

  // Active Sub-tab
  const [activeTab, setActiveTab] = useState<'quotations' | 'invoices' | 'clients' | 'catalogue' | 'settings'>('invoices');

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');

  // Modals
  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);

  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const [isCatalogueModalOpen, setIsCatalogueModalOpen] = useState(false);
  const [editingCatalogueItem, setEditingCatalogueItem] = useState<CatalogueItem | null>(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<Invoice | null>(null);

  // Document Printable Viewer Modal
  const [previewDoc, setPreviewDoc] = useState<{ type: 'quotation' | 'invoice'; data: Quotation | Invoice } | null>(null);
  const [printDocLang, setPrintDocLang] = useState<'sw' | 'en'>(lang);

  // Settings State Form
  const [settingsForm, setSettingsForm] = useState<CompanyBillingProfile>(billingProfile);
  const [settingsSuccessMsg, setSettingsSuccessMsg] = useState<string | null>(null);

  // Sync settings form whenever billingProfile updates from Firestore or parent
  useEffect(() => {
    setSettingsForm(propBillingProfile || profile || INITIAL_BILLING_PROFILE);
  }, [propBillingProfile, profile]);

  // Check Role Authorization
  const isFinanceOrAdmin = currentUserRole === 'admin' || currentUserRole === 'finance';
  const isSalesOrHigher = currentUserRole === 'admin' || currentUserRole === 'finance' || currentUserRole === 'hr' || currentUserRole === 'employee';

  const todayStr = new Date().toISOString().split('T')[0];

  // Helper to dynamically calculate Overdue status on invoices
  const processedInvoices = useMemo(() => {
    return invoices.map(inv => {
      const isPastDue = inv.dueDate < todayStr;
      const isNotFullyPaid = inv.balanceDue > 0;
      let computedStatus: InvoiceStatus = inv.status;

      if (inv.paidAmount >= inv.grandTotal) {
        computedStatus = 'Paid';
      } else if (inv.paidAmount > 0 && isPastDue) {
        computedStatus = 'Overdue';
      } else if (isPastDue && isNotFullyPaid && inv.status !== 'Draft') {
        computedStatus = 'Overdue';
      } else if (inv.paidAmount > 0 && inv.paidAmount < inv.grandTotal) {
        computedStatus = 'Partially Paid';
      }

      return {
        ...inv,
        status: computedStatus,
      };
    });
  }, [invoices, todayStr]);

  // Overall Financial Metric Summaries
  const metrics = useMemo(() => {
    const totalQuotesCount = quotations.length;
    const totalQuotesValue = quotations.reduce((sum, q) => sum + q.grandTotal, 0);

    const totalInvoicesCount = processedInvoices.length;
    const totalInvoicedValue = processedInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
    const totalPaidValue = processedInvoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
    const totalBalanceDue = processedInvoices.reduce((sum, inv) => sum + (inv.balanceDue || 0), 0);

    const overdueInvoices = processedInvoices.filter(inv => inv.status === 'Overdue');
    const totalOverdueValue = overdueInvoices.reduce((sum, inv) => sum + inv.balanceDue, 0);

    return {
      totalQuotesCount,
      totalQuotesValue,
      totalInvoicesCount,
      totalInvoicedValue,
      totalPaidValue,
      totalBalanceDue,
      overdueCount: overdueInvoices.length,
      totalOverdueValue,
    };
  }, [quotations, processedInvoices]);

  // Filtered Quotations
  const filteredQuotations = useMemo(() => {
    return quotations.filter(q => {
      const matchesSearch = 
        q.quotationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (q.clientCompany && q.clientCompany.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || q.status.toLowerCase() === statusFilter.toLowerCase();
      const matchesClient = clientFilter === 'all' || q.clientId === clientFilter;

      return matchesSearch && matchesStatus && matchesClient;
    });
  }, [quotations, searchQuery, statusFilter, clientFilter]);

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    return processedInvoices.filter(inv => {
      const matchesSearch = 
        inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (inv.clientCompany && inv.clientCompany.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (inv.quotationNumber && inv.quotationNumber.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || inv.status.toLowerCase() === statusFilter.toLowerCase();
      const matchesClient = clientFilter === 'all' || inv.clientId === clientFilter;

      return matchesSearch && matchesStatus && matchesClient;
    });
  }, [processedInvoices, searchQuery, statusFilter, clientFilter]);

  // Filtered Clients
  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      return (
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.tinNumber.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [clients, searchQuery]);

  // Filtered Catalogue Items
  const filteredCatalogue = useMemo(() => {
    return catalogueItems.filter(item => {
      return (
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [catalogueItems, searchQuery]);

  // Convert Quotation to Invoice (One-Click)
  const handleConvertQuotationToInvoice = (quote: Quotation) => {
    const nextInvNumber = `${billingProfile.invoicePrefix || 'INV-2026-'}${String(invoices.length + 1).padStart(3, '0')}`;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14); // 14 days default
    const dueDateStr = dueDate.toISOString().split('T')[0];

    const newInvoice: Invoice = {
      id: `INV-${Date.now()}`,
      invoiceNumber: nextInvNumber,
      quotationId: quote.id,
      quotationNumber: quote.quotationNumber,
      clientId: quote.clientId,
      clientName: quote.clientName,
      clientCompany: quote.clientCompany,
      clientPhone: quote.clientPhone,
      clientEmail: quote.clientEmail,
      clientAddress: quote.clientAddress,
      clientTin: quote.clientTin,
      clientVrn: quote.clientVrn,
      date: todayStr,
      dueDate: dueDateStr,
      items: quote.items.map(item => ({ ...item })),
      subtotal: quote.subtotal,
      discountType: quote.discountType,
      discountValue: quote.discountValue,
      discountAmount: quote.discountAmount,
      vatEnabled: quote.vatEnabled,
      vatRate: quote.vatRate,
      vatAmount: quote.vatAmount,
      grandTotal: quote.grandTotal,
      currency: quote.currency,
      paidAmount: 0,
      balanceDue: quote.grandTotal,
      status: 'Sent',
      notes: quote.notes || 'Ankara hii imetengenezwa moja kwa moja kutoka kwenye Nukuu rasmi.',
      terms: billingProfile.defaultPaymentTerms,
      bankDetails: {
        bankName: billingProfile.bankName,
        accountName: billingProfile.accountName,
        accountNumber: billingProfile.accountNumber,
        branch: billingProfile.branch,
        swiftCode: billingProfile.swiftCode,
        mobileMoneyName: billingProfile.mobileMoneyName,
        mobileMoneyNumber: billingProfile.mobileMoneyNumber,
      },
      payments: [],
      stockDeducted: false,
      createdBy: currentUserName,
      createdAt: todayStr,
    };

    // Update Quotation to Accepted & linked
    const updatedQuotes = quotations.map(q => {
      if (q.id === quote.id) {
        return {
          ...q,
          status: 'Accepted' as QuotationStatus,
          convertedToInvoiceId: newInvoice.id,
        };
      }
      return q;
    });

    const updatedInvoices = [newInvoice, ...invoices];
    onSaveQuotations(updatedQuotes);
    onSaveInvoices(updatedInvoices);

    setActiveTab('invoices');
    setPreviewDoc({ type: 'invoice', data: newInvoice });
  };

  // Record Payment against an Invoice
  const handleRecordPayment = (paymentData: {
    amount: number;
    date: string;
    method: 'bank_transfer' | 'mobile_money' | 'cash' | 'cheque';
    referenceNumber: string;
    notes?: string;
  }) => {
    if (!selectedInvoiceForPayment) return;

    const newPayment: InvoicePayment = {
      id: `PAY-${Date.now()}`,
      invoiceId: selectedInvoiceForPayment.id,
      amount: paymentData.amount,
      date: paymentData.date,
      method: paymentData.method,
      referenceNumber: paymentData.referenceNumber,
      receivedBy: currentUserName,
      notes: paymentData.notes,
    };

    const newPaidAmount = selectedInvoiceForPayment.paidAmount + paymentData.amount;
    const newBalanceDue = Math.max(0, selectedInvoiceForPayment.grandTotal - newPaidAmount);

    let newStatus: InvoiceStatus = 'Partially Paid';
    if (newBalanceDue === 0) {
      newStatus = 'Paid';
    } else if (selectedInvoiceForPayment.dueDate < todayStr && newBalanceDue > 0) {
      newStatus = 'Overdue';
    }

    const updatedInvoice: Invoice = {
      ...selectedInvoiceForPayment,
      paidAmount: newPaidAmount,
      balanceDue: newBalanceDue,
      status: newStatus,
      payments: [...(selectedInvoiceForPayment.payments || []), newPayment],
    };

    const updatedInvoices = invoices.map(inv => (inv.id === updatedInvoice.id ? updatedInvoice : inv));
    onSaveInvoices(updatedInvoices);

    setIsPaymentModalOpen(false);
    setSelectedInvoiceForPayment(null);
  };

  // Delete Quotation
  const handleDeleteQuotation = (id: string) => {
    if (!confirm(lang === 'sw' ? 'Je, una uhakika unataka kufuta nukuu hii?' : 'Are you sure you want to delete this quotation?')) return;
    const updated = quotations.filter(q => q.id !== id);
    onSaveQuotations(updated);
  };

  // Delete Invoice
  const handleDeleteInvoice = (id: string) => {
    if (!confirm(lang === 'sw' ? 'Je, una uhakika unataka kufuta ankara hii?' : 'Are you sure you want to delete this invoice?')) return;
    const updated = invoices.filter(inv => inv.id !== id);
    onSaveInvoices(updated);
  };

  // Delete Client
  const handleDeleteClient = (id: string) => {
    if (!confirm(lang === 'sw' ? 'Je, una uhakika unataka kumfuta mteja huyu?' : 'Are you sure you want to delete this client?')) return;
    const updated = clients.filter(c => c.id !== id);
    onSaveClients(updated);
  };

  // Delete Catalogue Item
  const handleDeleteCatalogueItem = (id: string) => {
    if (!confirm(lang === 'sw' ? 'Je, una uhakika unataka kufuta bidhaa/huduma hii?' : 'Are you sure you want to delete this catalogue item?')) return;
    const updated = catalogueItems.filter(item => item.id !== id);
    onSaveCatalogueItems(updated);
  };

  // Export CSV for Quotations
  const handleExportQuotationsCSV = () => {
    const headers = ['Namba ya Nukuu', 'Mteja', 'Kampuni', 'Simu', 'Tarehe', 'Ukomo', 'Jumla Kuu (TZS)', 'Hali'];
    const rows = filteredQuotations.map(q => [
      q.quotationNumber,
      q.clientName,
      q.clientCompany || '-',
      q.clientPhone || '-',
      q.date,
      q.validUntil,
      q.grandTotal,
      q.status,
    ]);
    exportToCSV('kazidesk_nukuu_quotations', headers, rows);
  };

  // Export CSV for Invoices
  const handleExportInvoicesCSV = () => {
    const headers = ['Namba ya Ankara', 'Nukuu Iliyotokana', 'Mteja', 'Kampuni', 'Tarehe', 'Tarehe ya Ukomo', 'Jumla (TZS)', 'Zilizolipwa (TZS)', 'Baki (TZS)', 'Hali'];
    const rows = filteredInvoices.map(inv => [
      inv.invoiceNumber,
      inv.quotationNumber || '-',
      inv.clientName,
      inv.clientCompany || '-',
      inv.date,
      inv.dueDate,
      inv.grandTotal,
      inv.paidAmount,
      inv.balanceDue,
      inv.status,
    ]);
    exportToCSV('kazidesk_ankara_invoices', headers, rows);
  };

  // Save Settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveBillingProfile(settingsForm);
    setSettingsSuccessMsg(lang === 'sw' ? 'Wasifu wa Kampuni na maelezo ya ankara yamehifadhiwa kikamilifu!' : 'Company billing settings saved successfully!');
    setTimeout(() => setSettingsSuccessMsg(null), 4000);
  };

  // Handle Logo Upload in Settings
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = ev => {
        if (typeof ev.target?.result === 'string') {
          setSettingsForm(prev => ({ ...prev, logoUrl: ev.target!.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* View Header with Sub-tabs & Main Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
              <FileText className="w-4 h-4" />
            </div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">
              {b.title}
            </h1>
            <span className="text-xs bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full font-mono">
              TZS / TRA EFD Ready
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            {b.subtitle}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {isSalesOrHigher && (
            <button
              onClick={() => {
                setEditingQuotation(null);
                setIsQuotationModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{b.newQuotation}</span>
            </button>
          )}

          {isFinanceOrAdmin && (
            <button
              onClick={() => {
                setEditingInvoice(null);
                setIsInvoiceModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{b.newInvoice}</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Financial Metric Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
        
        {/* Total Quotes */}
        <div 
          onClick={() => setActiveTab('quotations')}
          className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs cursor-pointer hover:border-emerald-500 transition-all"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>{b.statTotalQuotes}</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 text-base font-bold font-mono text-slate-900 dark:text-white">
            {formatCurrency(metrics.totalQuotesValue, currency)}
          </div>
          <div className="mt-1 text-[11px] text-slate-400 flex items-center gap-1">
            <span className="font-bold text-slate-700 dark:text-slate-300">{metrics.totalQuotesCount}</span> Nukuu zilizotolewa
          </div>
        </div>

        {/* Total Invoiced */}
        <div 
          onClick={() => setActiveTab('invoices')}
          className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs cursor-pointer hover:border-emerald-500 transition-all"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>{b.statTotalInvoiced}</span>
            <FileCheck className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 text-base font-bold font-mono text-slate-900 dark:text-white">
            {formatCurrency(metrics.totalInvoicedValue, currency)}
          </div>
          <div className="mt-1 text-[11px] text-slate-400 flex items-center gap-1">
            <span className="font-bold text-slate-700 dark:text-slate-300">{metrics.totalInvoicesCount}</span> Ankara zilizotumwa
          </div>
        </div>

        {/* Payments Received */}
        <div 
          onClick={() => setActiveTab('invoices')}
          className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs cursor-pointer hover:border-emerald-500 transition-all"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>{b.statTotalPaid}</span>
            <CreditCard className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {formatCurrency(metrics.totalPaidValue, currency)}
          </div>
          <div className="mt-1 text-[11px] text-emerald-600 font-medium">
            ✓ Fedha zilizoingia benki/simu
          </div>
        </div>

        {/* Unpaid Balance */}
        <div 
          onClick={() => setActiveTab('invoices')}
          className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs cursor-pointer hover:border-amber-500 transition-all"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>{b.statUnpaidBalance}</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-base font-bold font-mono text-amber-600 dark:text-amber-400">
            {formatCurrency(metrics.totalBalanceDue, currency)}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Inasubiri kulipwa
          </div>
        </div>

        {/* Overdue Invoices Alert */}
        <div 
          onClick={() => {
            setActiveTab('invoices');
            setStatusFilter('Overdue');
          }}
          className={`p-4 rounded-xl border shadow-xs cursor-pointer transition-all ${
            metrics.overdueCount > 0
              ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60 ring-1 ring-rose-400/30'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className={metrics.overdueCount > 0 ? 'text-rose-700 dark:text-rose-300 font-bold' : ''}>
              {b.statOverdue}
            </span>
            <AlertTriangle className={`w-4 h-4 ${metrics.overdueCount > 0 ? 'text-rose-600 animate-pulse' : 'text-slate-400'}`} />
          </div>
          <div className={`mt-2 text-base font-bold font-mono ${metrics.overdueCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
            {formatCurrency(metrics.totalOverdueValue, currency)}
          </div>
          <div className={`mt-1 text-[11px] ${metrics.overdueCount > 0 ? 'text-rose-700 dark:text-rose-300 font-bold' : 'text-slate-400'}`}>
            {metrics.overdueCount > 0 ? `⚠️ ${metrics.overdueCount} ankara zimevuka tarehe` : 'Hakuna ankara iliyochelewa'}
          </div>
        </div>

      </div>

      {/* Navigation Sub-Tabs Bar */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => {
            setActiveTab('invoices');
            setStatusFilter('all');
          }}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'invoices'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>{b.tabInvoices}</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${activeTab === 'invoices' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800'}`}>
            {invoices.length}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('quotations');
            setStatusFilter('all');
          }}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'quotations'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>{b.tabQuotations}</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${activeTab === 'quotations' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800'}`}>
            {quotations.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('clients')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'clients'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{b.tabClients}</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${activeTab === 'clients' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800'}`}>
            {clients.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('catalogue')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'catalogue'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>{b.tabCatalogue}</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${activeTab === 'catalogue' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800'}`}>
            {catalogueItems.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'settings'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>{b.tabSettings}</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: INVOICES LIST (ANKARA ZA MALIPO)                   */}
      {/* ======================================================== */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex flex-1 items-center gap-2 w-full">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder={lang === 'sw' ? 'Tafuta ankara kwa namba, mteja au kampuni...' : 'Search invoices by number, client or company...'}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="text-xs p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
              >
                <option value="all">{lang === 'sw' ? 'Hali Zote' : 'All Statuses'}</option>
                <option value="Draft">Rasimu (Draft)</option>
                <option value="Sent">Zilizotumwa (Sent)</option>
                <option value="Partially Paid">Imelipwa Sehemu</option>
                <option value="Paid">Imelipwa Kamili (Paid)</option>
                <option value="Overdue">Zilizochelewa (Overdue)</option>
              </select>

              <select
                value={clientFilter}
                onChange={e => setClientFilter(e.target.value)}
                className="text-xs p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium hidden md:block"
              >
                <option value="all">{lang === 'sw' ? 'Wateja Wote' : 'All Clients'}</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.companyName || c.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={handleExportInvoicesCSV}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5"
                title="Pakua orodha ya ankara kwenye CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
            </div>
          </div>

          {/* Invoices Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-600 dark:text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Ankara #</th>
                    <th className="py-3 px-4">Mteja & Kampuni</th>
                    <th className="py-3 px-4">Tarehe / Ukomo</th>
                    <th className="py-3 px-4 text-right">Jumla Kuu</th>
                    <th className="py-3 px-4 text-right">Iliyolipwa</th>
                    <th className="py-3 px-4 text-right">Baki Inayodaiwa</th>
                    <th className="py-3 px-4 text-center">Hali</th>
                    <th className="py-3 px-4 text-right">Vitendo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredInvoices.map(inv => {
                    const isOverdue = inv.status === 'Overdue';
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                          <div className="flex items-center gap-1.5">
                            <span>{inv.invoiceNumber}</span>
                            {inv.quotationNumber && (
                              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.2 rounded" title={`Kutoka nukuu ${inv.quotationNumber}`}>
                                {inv.quotationNumber}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">{inv.clientName}</div>
                          <div className="text-[11px] text-slate-400">{inv.clientCompany || inv.clientPhone}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div>{inv.date}</div>
                          <div className={`text-[10px] font-semibold mt-0.5 ${isOverdue ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                            Ukomo: {inv.dueDate} {isOverdue && '(Imechelewa)'}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {formatCurrency(inv.grandTotal, currency)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                          {formatCurrency(inv.paidAmount, currency)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {inv.balanceDue > 0 ? (
                            <span className={isOverdue ? 'text-rose-600 font-bold' : 'text-amber-600'}>
                              {formatCurrency(inv.balanceDue, currency)}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-normal">TZS 0</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            inv.status === 'Paid' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' :
                            inv.status === 'Partially Paid' ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300' :
                            inv.status === 'Overdue' ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 animate-pulse' :
                            inv.status === 'Sent' ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300' :
                            'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Record Payment Button */}
                            {isFinanceOrAdmin && inv.balanceDue > 0 && (
                              <button
                                onClick={() => {
                                  setSelectedInvoiceForPayment(inv);
                                  setIsPaymentModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 transition-colors"
                                title="Weka Malipo ya Ankara Hii"
                              >
                                <DollarSign className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* View / Print Button */}
                            <button
                              onClick={() => setPreviewDoc({ type: 'invoice', data: inv })}
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors"
                              title="Tazama na Chapa Ankara (Print / PDF)"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit Button */}
                            {isFinanceOrAdmin && (
                              <button
                                onClick={() => {
                                  setEditingInvoice(inv);
                                  setIsInvoiceModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
                                title="Hariri Ankara"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Delete Button */}
                            {currentUserRole === 'admin' && (
                              <button
                                onClick={() => handleDeleteInvoice(inv.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600"
                                title="Futa Ankara"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredInvoices.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <FileCheck className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <div>Hakuna ankara inayolingana na utafutaji wako.</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: QUOTATIONS LIST (NUKUU ZA BEI)                     */}
      {/* ======================================================== */}
      {activeTab === 'quotations' && (
        <div className="space-y-4">
          
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex flex-1 items-center gap-2 w-full">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder={lang === 'sw' ? 'Tafuta nukuu kwa namba, mteja au kampuni...' : 'Search quotations by number or client...'}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="text-xs p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
              >
                <option value="all">{lang === 'sw' ? 'Hali Zote' : 'All Statuses'}</option>
                <option value="Draft">Rasimu (Draft)</option>
                <option value="Sent">Zilizotumwa (Sent)</option>
                <option value="Accepted">Zilizokubaliwa (Accepted)</option>
                <option value="Rejected">Zilizokataliwa (Rejected)</option>
                <option value="Expired">Zilizopitwa na Wakati</option>
              </select>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={handleExportQuotationsCSV}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5"
                title="Pakua orodha ya nukuu kwenye CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
            </div>
          </div>

          {/* Quotations Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-600 dark:text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Nukuu #</th>
                    <th className="py-3 px-4">Mteja & Kampuni</th>
                    <th className="py-3 px-4">Tarehe & Ukomo</th>
                    <th className="py-3 px-4">Vipengele</th>
                    <th className="py-3 px-4 text-right">Jumla Kuu</th>
                    <th className="py-3 px-4 text-center">Hali</th>
                    <th className="py-3 px-4 text-right">Vitendo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredQuotations.map(quote => (
                    <tr key={quote.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        {quote.quotationNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{quote.clientName}</div>
                        <div className="text-[11px] text-slate-400">{quote.clientCompany || quote.clientPhone}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div>{quote.date}</div>
                        <div className="text-[10px] text-slate-400">Halali hadi: {quote.validUntil}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                        {quote.items.length} {lang === 'sw' ? 'vitu' : 'items'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {formatCurrency(quote.grandTotal, currency)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          quote.status === 'Accepted' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' :
                          quote.status === 'Rejected' ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300' :
                          quote.status === 'Sent' ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300' :
                          quote.status === 'Expired' ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300' :
                          'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}>
                          {quote.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* One-Click Convert to Invoice Button */}
                          {!quote.convertedToInvoiceId && (
                            <button
                              onClick={() => handleConvertQuotationToInvoice(quote)}
                              className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 font-bold text-[10px] flex items-center gap-1 transition-colors border border-emerald-200 dark:border-emerald-800"
                              title="Badili nukuu hii kuwa Ankara (Invoice)"
                            >
                              <span>Ankara</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}

                          {quote.convertedToInvoiceId && (
                            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Imebadilishwa</span>
                            </span>
                          )}

                          {/* View / Print Button */}
                          <button
                            onClick={() => setPreviewDoc({ type: 'quotation', data: quote })}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors"
                            title="Tazama na Chapa Nukuu (Print / PDF)"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Button */}
                          <button
                            onClick={() => {
                              setEditingQuotation(quote);
                              setIsQuotationModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
                            title="Hariri Nukuu"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Button */}
                          {currentUserRole === 'admin' && (
                            <button
                              onClick={() => handleDeleteQuotation(quote.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600"
                              title="Futa Nukuu"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredQuotations.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <div>Hakuna nukuu inayolingana na utafutaji wako.</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: CLIENTS DIRECTORY (ORODHA YA WATEJA)              */}
      {/* ======================================================== */}
      {activeTab === 'clients' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder={lang === 'sw' ? 'Tafuta mteja kwa jina, kampuni, simu au TIN...' : 'Search clients by name, company or TIN...'}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <button
              onClick={() => {
                setEditingClient(null);
                setIsClientModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-xs flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{b.newClient}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClients.map(client => {
              const clientInvoices = invoices.filter(inv => inv.clientId === client.id);
              const clientTotalBilled = clientInvoices.reduce((sum, i) => sum + i.grandTotal, 0);
              const clientQuotes = quotations.filter(q => q.clientId === client.id);

              return (
                <div key={client.id} className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm">{client.name}</h3>
                      <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{client.companyName || 'Binafsi'}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingClient(client);
                          setIsClientModalOpen(true);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-white"
                        title="Hariri Taarifa za Mteja"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      {currentUserRole === 'admin' && (
                        <button
                          onClick={() => handleDeleteClient(client.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600"
                          title="Futa Mteja"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{client.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{client.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span className="line-clamp-1">{client.address}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="text-slate-400">TIN: <strong className="font-mono text-slate-700 dark:text-slate-300">{client.tinNumber || 'Hakuna'}</strong></span>
                      {client.vrnNumber && <span className="text-slate-400">VRN: <strong className="font-mono text-slate-700 dark:text-slate-300">{client.vrnNumber}</strong></span>}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Jumla Iliyoankariwa</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {formatCurrency(clientTotalBilled, currency)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Nukuu / Ankara</span>
                      <span className="font-mono font-bold text-emerald-600">
                        {clientQuotes.length} / {clientInvoices.length}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: ITEMS & SERVICES CATALOGUE                        */}
      {/* ======================================================== */}
      {activeTab === 'catalogue' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder={lang === 'sw' ? 'Tafuta bidhaa au huduma kwa jina au kodi...' : 'Search catalogue items by name or code...'}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <button
              onClick={() => {
                setEditingCatalogueItem(null);
                setIsCatalogueModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-xs flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{b.newItem}</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-600 dark:text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Kodi #</th>
                    <th className="py-3 px-4">Jina la Bidhaa / Huduma</th>
                    <th className="py-3 px-4">Aina</th>
                    <th className="py-3 px-4">Kipimo (Unit)</th>
                    <th className="py-3 px-4 text-right">Bei ya Kitengo (TZS)</th>
                    <th className="py-3 px-4 text-center">VAT 18%</th>
                    <th className="py-3 px-4 text-right">Vitendo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredCatalogue.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        {item.code}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{item.name}</div>
                        <div className="text-[11px] text-slate-400 line-clamp-1">{item.description}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          item.category === 'service' ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300' : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                        }`}>
                          {item.category === 'service' ? 'Huduma' : 'Bidhaa'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-600 dark:text-slate-300">
                        {item.unit}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {formatCurrency(item.unitPrice, currency)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {item.taxable ? (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
                            Inatozwa (18%)
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400">
                            Haitozwi
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingCatalogueItem(item);
                              setIsCatalogueModalOpen(true);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-white"
                            title="Hariri Bidhaa / Huduma"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          {currentUserRole === 'admin' && (
                            <button
                              onClick={() => handleDeleteCatalogueItem(item.id)}
                              className="p-1 rounded text-slate-400 hover:text-rose-600"
                              title="Futa Bidhaa / Huduma"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: COMPANY PROFILE & BILLING SETTINGS                */}
      {/* ======================================================== */}
      {activeTab === 'settings' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building className="w-5 h-5 text-emerald-600" />
                <span>Wasifu wa Kampuni, Benki na Mipangilio ya Ankara</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Taarifa hizi zinaonekana moja kwa moja kwenye nukuu na ankara zote zinazochapishwa na kutumwa kwa wateja.
              </p>
            </div>
            {settingsSuccessMsg && (
              <div className="text-xs font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-950 px-3 py-1.5 rounded-lg flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{settingsSuccessMsg}</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-5 text-xs">
            {/* Logo & Basic Identity */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                  Nembo ya Kampuni (Logo):
                </label>
                <div className="flex items-center gap-3">
                  <img
                    src={settingsForm?.logoUrl || billingProfile?.logoUrl || ''}
                    alt="Company Logo"
                    className="w-16 h-16 rounded-xl object-contain border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-1"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>';
                    }}
                  />
                  <div>
                    <label className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer block">
                      Pakia Nembo Mpya
                      <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                    </label>
                    <span className="text-[10px] text-slate-400 mt-1 block">PNG au JPG (Max 2MB)</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                  Jina Kamili la Kampuni: *
                </label>
                <input
                  type="text"
                  required
                  value={settingsForm.companyName}
                  onChange={e => setSettingsForm({ ...settingsForm, companyName: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                  Wito wa Kampuni (Tagline):
                </label>
                <input
                  type="text"
                  value={settingsForm.tagline || ''}
                  onChange={e => setSettingsForm({ ...settingsForm, tagline: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Tax & Registration Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                  TIN Number (TRA): *
                </label>
                <input
                  type="text"
                  required
                  value={settingsForm.tinNumber}
                  onChange={e => setSettingsForm({ ...settingsForm, tinNumber: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                  VRN (VAT Registration Number):
                </label>
                <input
                  type="text"
                  value={settingsForm.vrnNumber}
                  onChange={e => setSettingsForm({ ...settingsForm, vrnNumber: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                  Namba ya Usajili wa Biashara (BRELA):
                </label>
                <input
                  type="text"
                  value={settingsForm.registrationNumber}
                  onChange={e => setSettingsForm({ ...settingsForm, registrationNumber: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>

            {/* Location & Contacts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                  Anuani ya Ofisi / Makao Makuu: *
                </label>
                <input
                  type="text"
                  required
                  value={settingsForm.address}
                  onChange={e => setSettingsForm({ ...settingsForm, address: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                  Namba za Simu: *
                </label>
                <input
                  type="text"
                  required
                  value={settingsForm.phone}
                  onChange={e => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                  Barua Pepe ya Ankara (Billing Email): *
                </label>
                <input
                  type="email"
                  required
                  value={settingsForm.email}
                  onChange={e => setSettingsForm({ ...settingsForm, email: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Bank Payment Details */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>Taarifa za Malipo ya Benki (Bank Wire Details)</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-500 text-[10px] mb-1">Jina la Benki:</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.bankName}
                    onChange={e => setSettingsForm({ ...settingsForm, bankName: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 text-[10px] mb-1">Jina la Akaunti:</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.accountName}
                    onChange={e => setSettingsForm({ ...settingsForm, accountName: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 text-[10px] mb-1">Namba ya Akaunti:</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.accountNumber}
                    onChange={e => setSettingsForm({ ...settingsForm, accountNumber: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Mobile Money Details */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-emerald-600" />
                <span>Malipo ya Simu (Mobile Money / Lipa Namba)</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-500 text-[10px] mb-1">Mtandao (Provider):</label>
                  <input
                    type="text"
                    value={settingsForm.mobileMoneyProvider}
                    onChange={e => setSettingsForm({ ...settingsForm, mobileMoneyProvider: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 text-[10px] mb-1">Lipa Namba / Namba ya Simu:</label>
                  <input
                    type="text"
                    value={settingsForm.mobileMoneyNumber}
                    onChange={e => setSettingsForm({ ...settingsForm, mobileMoneyNumber: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 text-[10px] mb-1">Jina Linalosomeka:</label>
                  <input
                    type="text"
                    value={settingsForm.mobileMoneyName}
                    onChange={e => setSettingsForm({ ...settingsForm, mobileMoneyName: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Default Terms & Signatory */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                  Mamlaka ya Sahihi (Signatory Name & Title):
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Jina la Msaini"
                    value={settingsForm.signatoryName}
                    onChange={e => setSettingsForm({ ...settingsForm, signatoryName: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <input
                    type="text"
                    placeholder="Wadhifa (k.m. Mkurugenzi Mkuu)"
                    value={settingsForm.signatoryTitle}
                    onChange={e => setSettingsForm({ ...settingsForm, signatoryTitle: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                  Prefix za Namba (Numbering):
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">Prefix ya Nukuu:</span>
                    <input
                      type="text"
                      value={settingsForm.quotationPrefix}
                      onChange={e => setSettingsForm({ ...settingsForm, quotationPrefix: e.target.value })}
                      className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">Prefix ya Ankara:</span>
                    <input
                      type="text"
                      value={settingsForm.invoicePrefix}
                      onChange={e => setSettingsForm({ ...settingsForm, invoicePrefix: e.target.value })}
                      className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                Masharti ya Kawaida ya Malipo (Default Terms & Conditions):
              </label>
              <textarea
                rows={2}
                value={settingsForm.defaultPaymentTerms}
                onChange={e => setSettingsForm({ ...settingsForm, defaultPaymentTerms: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors"
              >
                Hifadhi Mipangilio Yote ya Ankara
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: CREATE / EDIT QUOTATION                         */}
      {/* ======================================================== */}
      {isQuotationModalOpen && (
        <QuotationModal
          lang={lang}
          currency={currency}
          isOpen={isQuotationModalOpen}
          initialData={editingQuotation}
          clients={clients}
          catalogueItems={catalogueItems}
          billingProfile={billingProfile}
          currentUserName={currentUserName}
          quotationsCount={quotations.length}
          onClose={() => {
            setIsQuotationModalOpen(false);
            setEditingQuotation(null);
          }}
          onSave={newQuote => {
            if (editingQuotation) {
              const updated = quotations.map(q => (q.id === newQuote.id ? newQuote : q));
              onSaveQuotations(updated);
            } else {
              onSaveQuotations([newQuote, ...quotations]);
            }
            setIsQuotationModalOpen(false);
            setEditingQuotation(null);
          }}
        />
      )}

      {/* ======================================================== */}
      {/* MODAL 2: CREATE / EDIT INVOICE                           */}
      {/* ======================================================== */}
      {isInvoiceModalOpen && (
        <InvoiceModal
          lang={lang}
          currency={currency}
          isOpen={isInvoiceModalOpen}
          initialData={editingInvoice}
          clients={clients}
          catalogueItems={catalogueItems}
          consumables={consumables}
          billingProfile={billingProfile}
          currentUserName={currentUserName}
          invoicesCount={invoices.length}
          onClose={() => {
            setIsInvoiceModalOpen(false);
            setEditingInvoice(null);
          }}
          onSave={(newInv, deductStock) => {
            if (editingInvoice) {
              const updated = invoices.map(inv => (inv.id === newInv.id ? newInv : inv));
              onSaveInvoices(updated);
            } else {
              onSaveInvoices([newInv, ...invoices]);
              // Deduct stock if toggled
              if (deductStock && onDeductInventoryStock) {
                newInv.items.forEach(item => {
                  if (item.itemId) {
                    const catItem = catalogueItems.find(c => c.id === item.itemId);
                    if (catItem?.linkedStockItemId) {
                      onDeductInventoryStock(catItem.linkedStockItemId, item.quantity, newInv.invoiceNumber);
                    }
                  }
                });
              }
            }
            setIsInvoiceModalOpen(false);
            setEditingInvoice(null);
          }}
        />
      )}

      {/* ======================================================== */}
      {/* MODAL 3: RECORD PAYMENT AGAINST INVOICE                  */}
      {/* ======================================================== */}
      {isPaymentModalOpen && selectedInvoiceForPayment && (
        <PaymentModal
          lang={lang}
          currency={currency}
          invoice={selectedInvoiceForPayment}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setSelectedInvoiceForPayment(null);
          }}
          onSave={handleRecordPayment}
        />
      )}

      {/* ======================================================== */}
      {/* MODAL 4: CREATE / EDIT CLIENT                            */}
      {/* ======================================================== */}
      {isClientModalOpen && (
        <ClientModal
          lang={lang}
          isOpen={isClientModalOpen}
          initialData={editingClient}
          onClose={() => {
            setIsClientModalOpen(false);
            setEditingClient(null);
          }}
          onSave={clientData => {
            if (editingClient) {
              const updated = clients.map(c => (c.id === clientData.id ? clientData : c));
              onSaveClients(updated);
            } else {
              onSaveClients([clientData, ...clients]);
            }
            setIsClientModalOpen(false);
            setEditingClient(null);
          }}
        />
      )}

      {/* ======================================================== */}
      {/* MODAL 5: CREATE / EDIT CATALOGUE ITEM                    */}
      {/* ======================================================== */}
      {isCatalogueModalOpen && (
        <CatalogueItemModal
          lang={lang}
          isOpen={isCatalogueModalOpen}
          initialData={editingCatalogueItem}
          consumables={consumables}
          onClose={() => {
            setIsCatalogueModalOpen(false);
            setEditingCatalogueItem(null);
          }}
          onSave={catItemData => {
            if (editingCatalogueItem) {
              const updated = catalogueItems.map(item => (item.id === catItemData.id ? catItemData : item));
              onSaveCatalogueItems(updated);
            } else {
              onSaveCatalogueItems([catItemData, ...catalogueItems]);
            }
            setIsCatalogueModalOpen(false);
            setEditingCatalogueItem(null);
          }}
        />
      )}

      {/* ======================================================== */}
      {/* MODAL 6: HIGH-FIDELITY PRINTABLE DOCUMENT PREVIEW        */}
      {/* ======================================================== */}
      {previewDoc && (
        <PrintableDocumentModal
          lang={printDocLang}
          currency={currency}
          documentType={previewDoc.type}
          data={previewDoc.data}
          profile={billingProfile}
          onClose={() => setPreviewDoc(null)}
          onToggleLang={() => setPrintDocLang(prev => (prev === 'sw' ? 'en' : 'sw'))}
        />
      )}

    </div>
  );
};

// =========================================================================
// SUB-COMPONENT: QUOTATION MODAL
// =========================================================================
interface QuotationModalProps {
  lang: 'sw' | 'en';
  currency: 'TZS' | 'USD';
  isOpen: boolean;
  initialData: Quotation | null;
  clients: Client[];
  catalogueItems: CatalogueItem[];
  billingProfile: CompanyBillingProfile;
  currentUserName: string;
  quotationsCount: number;
  onClose: () => void;
  onSave: (q: Quotation) => void;
}

const QuotationModal: React.FC<QuotationModalProps> = ({
  lang,
  currency,
  isOpen,
  initialData,
  clients,
  catalogueItems,
  billingProfile,
  currentUserName,
  quotationsCount,
  onClose,
  onSave,
}) => {
  const [selectedClientId, setSelectedClientId] = useState<string>(initialData?.clientId || (clients[0]?.id || ''));
  const [clientName, setClientName] = useState(initialData?.clientName || (clients[0]?.name || ''));
  const [clientCompany, setClientCompany] = useState(initialData?.clientCompany || (clients[0]?.companyName || ''));
  const [clientPhone, setClientPhone] = useState(initialData?.clientPhone || (clients[0]?.phone || ''));
  const [clientEmail, setClientEmail] = useState(initialData?.clientEmail || (clients[0]?.email || ''));
  const [clientAddress, setClientAddress] = useState(initialData?.clientAddress || (clients[0]?.address || ''));
  const [clientTin, setClientTin] = useState(initialData?.clientTin || (clients[0]?.tinNumber || ''));

  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [validityDays, setValidityDays] = useState(initialData?.validityDays || billingProfile.defaultQuotationValidityDays || 30);
  const [status, setStatus] = useState<QuotationStatus>(initialData?.status || 'Sent');

  const [items, setItems] = useState<LineItem[]>(initialData?.items || [
    {
      id: `LNI-${Date.now()}-1`,
      description: catalogueItems[0]?.name || 'Huduma ya KaziDesk',
      unit: catalogueItems[0]?.unit || 'Mradi',
      quantity: 1,
      unitPrice: catalogueItems[0]?.unitPrice || 500000,
      amount: catalogueItems[0]?.unitPrice || 500000,
      itemId: catalogueItems[0]?.id,
    }
  ]);

  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>(initialData?.discountType || 'fixed');
  const [discountValue, setDiscountValue] = useState<number>(initialData?.discountValue || 0);
  const [vatEnabled, setVatEnabled] = useState<boolean>(initialData ? initialData.vatEnabled : billingProfile.defaultVatEnabled);
  const [notes, setNotes] = useState(initialData?.notes || 'Bei zote zimejumuisha mafunzo ya awali.');
  const [terms, setTerms] = useState(initialData?.terms || billingProfile.defaultPaymentTerms);

  // Auto-fill when client changes
  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    const found = clients.find(c => c.id === clientId);
    if (found) {
      setClientName(found.name);
      setClientCompany(found.companyName);
      setClientPhone(found.phone);
      setClientEmail(found.email);
      setClientAddress(found.address);
      setClientTin(found.tinNumber);
    }
  };

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const discountAmount = discountType === 'percentage' 
    ? Math.round((subtotal * discountValue) / 100) 
    : discountValue;
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const vatAmount = vatEnabled ? Math.round(taxableAmount * 0.18) : 0;
  const grandTotal = taxableAmount + vatAmount;

  // Add Item Line
  const handleAddItem = () => {
    const newItem: LineItem = {
      id: `LNI-${Date.now()}-${items.length + 1}`,
      description: '',
      unit: 'Pcs',
      quantity: 1,
      unitPrice: 0,
      amount: 0,
    };
    setItems([...items, newItem]);
  };

  const handleCataloguePick = (index: number, catItemId: string) => {
    const cat = catalogueItems.find(c => c.id === catItemId);
    if (!cat) return;
    const nextItems = [...items];
    nextItems[index] = {
      ...nextItems[index],
      itemId: cat.id,
      description: cat.name,
      unit: cat.unit,
      unitPrice: cat.unitPrice,
      amount: cat.unitPrice * (nextItems[index].quantity || 1),
    };
    setItems(nextItems);
  };

  const handleUpdateItem = (index: number, field: keyof LineItem, val: any) => {
    const nextItems = [...items];
    const current = { ...nextItems[index], [field]: val };
    if (field === 'quantity' || field === 'unitPrice') {
      const q = field === 'quantity' ? Number(val) : current.quantity;
      const p = field === 'unitPrice' ? Number(val) : current.unitPrice;
      current.amount = (q || 0) * (p || 0);
    }
    nextItems[index] = current;
    setItems(nextItems);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validUntilDate = new Date(date);
    validUntilDate.setDate(validUntilDate.getDate() + Number(validityDays));
    const validUntilStr = validUntilDate.toISOString().split('T')[0];

    const quoteNumber = initialData?.quotationNumber || `${billingProfile.quotationPrefix || 'QT-2026-'}${String(quotationsCount + 1).padStart(3, '0')}`;

    const newQuotation: Quotation = {
      id: initialData?.id || `QUO-${Date.now()}`,
      quotationNumber: quoteNumber,
      clientId: selectedClientId,
      clientName,
      clientCompany,
      clientPhone,
      clientEmail,
      clientAddress,
      clientTin,
      date,
      validUntil: validUntilStr,
      validityDays: Number(validityDays),
      items,
      subtotal,
      discountType,
      discountValue: Number(discountValue),
      discountAmount,
      vatEnabled,
      vatRate: 18,
      vatAmount,
      grandTotal,
      currency: currency || 'TZS',
      status,
      notes,
      terms,
      createdBy: initialData?.createdBy || currentUserName,
      createdAt: initialData?.createdAt || date,
    };

    onSave(newQuotation);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            <span>{initialData ? 'Hariri Nukuu ya Bei' : 'Tengeneza Nukuu Mpya ya Bei (Quotation)'}</span>
          </h2>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Client Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                Chagua Mteja Aliyesajiliwa:
              </label>
              <select
                value={selectedClientId}
                onChange={e => handleClientSelect(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.companyName || 'Binafsi'})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                Jina la Kampuni ya Mteja:
              </label>
              <input
                type="text"
                value={clientCompany}
                onChange={e => setClientCompany(e.target.value)}
                placeholder="Serengeti Breweries Ltd"
                className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                Simu & Barua Pepe:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={clientPhone}
                  onChange={e => setClientPhone(e.target.value)}
                  placeholder="+255 7..."
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
                <input
                  type="email"
                  value={clientEmail}
                  onChange={e => setClientEmail(e.target.value)}
                  placeholder="info@client.tz"
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                TIN ya Mteja & Mahali:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={clientTin}
                  onChange={e => setClientTin(e.target.value)}
                  placeholder="104-982-110"
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
                <input
                  type="text"
                  value={clientAddress}
                  onChange={e => setClientAddress(e.target.value)}
                  placeholder="Dar es Salaam"
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Dates & Status */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                Tarehe ya Nukuu: *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                Siku za Ukomo (Validity): *
              </label>
              <select
                value={validityDays}
                onChange={e => setValidityDays(Number(e.target.value))}
                className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value={7}>Siku 7</option>
                <option value={14}>Siku 14</option>
                <option value={30}>Siku 30 (Mwezi 1)</option>
                <option value={60}>Siku 60 (Miezi 2)</option>
                <option value={90}>Siku 90 (Miezi 3)</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                Hali ya Nukuu: *
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as QuotationStatus)}
                className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
              >
                <option value="Draft">Rasimu (Draft)</option>
                <option value="Sent">Imetumwa (Sent)</option>
                <option value="Accepted">Imekubaliwa (Accepted)</option>
                <option value="Rejected">Imekataliwa (Rejected)</option>
              </select>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 dark:text-slate-200 uppercase text-[10px]">
                Orodha ya Huduma & Bidhaa Zilizomo (Line Items):
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ongeza Kipengele</span>
              </button>
            </div>

            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-[10px] uppercase font-bold text-slate-500">
                  <tr>
                    <th className="py-2 px-3">Maelezo / Chagua Kutoka Katalogi</th>
                    <th className="py-2 px-3 w-24">Kipimo</th>
                    <th className="py-2 px-3 w-20 text-center">Idadi</th>
                    <th className="py-2 px-3 w-32 text-right">Bei (TZS)</th>
                    <th className="py-2 px-3 w-32 text-right">Jumla (TZS)</th>
                    <th className="py-2 px-2 w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {items.map((item, idx) => (
                    <tr key={item.id}>
                      <td className="py-2 px-3">
                        <div className="space-y-1">
                          <select
                            onChange={e => handleCataloguePick(idx, e.target.value)}
                            className="w-full text-[11px] p-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                          >
                            <option value="">-- Chagua kutoka Katalogi ya Bei --</option>
                            {catalogueItems.map(cat => (
                              <option key={cat.id} value={cat.id}>{cat.name} ({formatCurrency(cat.unitPrice, currency)})</option>
                            ))}
                          </select>
                          <input
                            type="text"
                            required
                            placeholder="Maelezo kamili ya kazi au bidhaa..."
                            value={item.description}
                            onChange={e => handleUpdateItem(idx, 'description', e.target.value)}
                            className="w-full p-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                          />
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={item.unit}
                          onChange={e => handleUpdateItem(idx, 'unit', e.target.value)}
                          placeholder="Pcs"
                          className="w-full p-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          min="1"
                          required
                          value={item.quantity}
                          onChange={e => handleUpdateItem(idx, 'quantity', Number(e.target.value))}
                          className="w-full p-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-center font-mono text-xs"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          min="0"
                          required
                          value={item.unitPrice}
                          onChange={e => handleUpdateItem(idx, 'unitPrice', Number(e.target.value))}
                          className="w-full p-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-right font-mono text-xs"
                        />
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {formatCurrency(item.amount, currency)}
                      </td>
                      <td className="py-2 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          disabled={items.length <= 1}
                          className="text-slate-400 hover:text-rose-600 disabled:opacity-30"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals & Discounts & VAT Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Punguzo (Discount):</label>
                <div className="flex gap-2">
                  <select
                    value={discountType}
                    onChange={e => setDiscountType(e.target.value as any)}
                    className="p-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                  >
                    <option value="fixed">Kiasi Maalum (TZS)</option>
                    <option value="percentage">Asilimia (%)</option>
                  </select>
                  <input
                    type="number"
                    min="0"
                    value={discountValue}
                    onChange={e => setDiscountValue(Number(e.target.value))}
                    className="flex-1 p-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-right font-mono text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="quoteVatToggle"
                  checked={vatEnabled}
                  onChange={e => setVatEnabled(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <label htmlFor="quoteVatToggle" className="font-bold text-slate-800 dark:text-slate-200 text-xs cursor-pointer">
                  Weka Kodi ya VAT 18% (TRA Registered Tax)
                </label>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-right border-l pl-4 border-slate-200 dark:border-slate-700">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Jumla Ndogo (Subtotal):</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(subtotal, currency)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-amber-600">
                  <span>Punguzo (Discount):</span>
                  <span className="font-mono font-bold">- {formatCurrency(discountAmount, currency)}</span>
                </div>
              )}
              {vatEnabled && (
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>VAT (18%):</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">+ {formatCurrency(vatAmount, currency)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700">
                <span>Jumla Kuu (Grand Total):</span>
                <span className="font-mono text-emerald-600 text-base">{formatCurrency(grandTotal, currency)}</span>
              </div>
            </div>
          </div>

          {/* Notes & Terms */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Maelezo ya Ziada (Notes):</label>
              <textarea
                rows={2}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Masharti ya Malipo (Terms):</label>
              <textarea
                rows={2}
                value={terms}
                onChange={e => setTerms(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold"
            >
              Ghairi
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md"
            >
              {initialData ? 'Hifadhi Mabadiliko' : 'Hifadhi Nukuu ya Bei'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// =========================================================================
// SUB-COMPONENT: INVOICE MODAL
// =========================================================================
interface InvoiceModalProps {
  lang: 'sw' | 'en';
  currency: 'TZS' | 'USD';
  isOpen: boolean;
  initialData: Invoice | null;
  clients: Client[];
  catalogueItems: CatalogueItem[];
  consumables: ConsumableItem[];
  billingProfile: CompanyBillingProfile;
  currentUserName: string;
  invoicesCount: number;
  onClose: () => void;
  onSave: (inv: Invoice, deductStock: boolean) => void;
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({
  lang,
  currency,
  isOpen,
  initialData,
  clients,
  catalogueItems,
  consumables,
  billingProfile,
  currentUserName,
  invoicesCount,
  onClose,
  onSave,
}) => {
  const [selectedClientId, setSelectedClientId] = useState<string>(initialData?.clientId || (clients[0]?.id || ''));
  const [clientName, setClientName] = useState(initialData?.clientName || (clients[0]?.name || ''));
  const [clientCompany, setClientCompany] = useState(initialData?.clientCompany || (clients[0]?.companyName || ''));
  const [clientPhone, setClientPhone] = useState(initialData?.clientPhone || (clients[0]?.phone || ''));
  const [clientEmail, setClientEmail] = useState(initialData?.clientEmail || (clients[0]?.email || ''));
  const [clientAddress, setClientAddress] = useState(initialData?.clientAddress || (clients[0]?.address || ''));
  const [clientTin, setClientTin] = useState(initialData?.clientTin || (clients[0]?.tinNumber || ''));

  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  
  const defaultDueDate = new Date();
  defaultDueDate.setDate(defaultDueDate.getDate() + 14);
  const [dueDate, setDueDate] = useState(initialData?.dueDate || defaultDueDate.toISOString().split('T')[0]);
  const [status, setStatus] = useState<InvoiceStatus>(initialData?.status || 'Sent');

  const [items, setItems] = useState<LineItem[]>(initialData?.items || [
    {
      id: `LNI-${Date.now()}-1`,
      description: catalogueItems[0]?.name || 'Huduma ya KaziDesk',
      unit: catalogueItems[0]?.unit || 'Mradi',
      quantity: 1,
      unitPrice: catalogueItems[0]?.unitPrice || 500000,
      amount: catalogueItems[0]?.unitPrice || 500000,
      itemId: catalogueItems[0]?.id,
    }
  ]);

  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>(initialData?.discountType || 'fixed');
  const [discountValue, setDiscountValue] = useState<number>(initialData?.discountValue || 0);
  const [vatEnabled, setVatEnabled] = useState<boolean>(initialData ? initialData.vatEnabled : billingProfile.defaultVatEnabled);
  const [deductStock, setDeductStock] = useState<boolean>(false);
  const [notes, setNotes] = useState(initialData?.notes || 'Asante kwa kufanya biashara nasi.');
  const [terms, setTerms] = useState(initialData?.terms || billingProfile.defaultPaymentTerms);

  // Auto-fill when client changes
  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    const found = clients.find(c => c.id === clientId);
    if (found) {
      setClientName(found.name);
      setClientCompany(found.companyName);
      setClientPhone(found.phone);
      setClientEmail(found.email);
      setClientAddress(found.address);
      setClientTin(found.tinNumber);
    }
  };

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const discountAmount = discountType === 'percentage' 
    ? Math.round((subtotal * discountValue) / 100) 
    : discountValue;
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const vatAmount = vatEnabled ? Math.round(taxableAmount * 0.18) : 0;
  const grandTotal = taxableAmount + vatAmount;

  // Add Item Line
  const handleAddItem = () => {
    const newItem: LineItem = {
      id: `LNI-${Date.now()}-${items.length + 1}`,
      description: '',
      unit: 'Pcs',
      quantity: 1,
      unitPrice: 0,
      amount: 0,
    };
    setItems([...items, newItem]);
  };

  const handleCataloguePick = (index: number, catItemId: string) => {
    const cat = catalogueItems.find(c => c.id === catItemId);
    if (!cat) return;
    const nextItems = [...items];
    nextItems[index] = {
      ...nextItems[index],
      itemId: cat.id,
      description: cat.name,
      unit: cat.unit,
      unitPrice: cat.unitPrice,
      amount: cat.unitPrice * (nextItems[index].quantity || 1),
    };
    setItems(nextItems);
  };

  const handleUpdateItem = (index: number, field: keyof LineItem, val: any) => {
    const nextItems = [...items];
    const current = { ...nextItems[index], [field]: val };
    if (field === 'quantity' || field === 'unitPrice') {
      const q = field === 'quantity' ? Number(val) : current.quantity;
      const p = field === 'unitPrice' ? Number(val) : current.unitPrice;
      current.amount = (q || 0) * (p || 0);
    }
    nextItems[index] = current;
    setItems(nextItems);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const invNumber = initialData?.invoiceNumber || `${billingProfile.invoicePrefix || 'INV-2026-'}${String(invoicesCount + 1).padStart(3, '0')}`;
    const paidAmount = initialData?.paidAmount || 0;
    const balanceDue = Math.max(0, grandTotal - paidAmount);

    const newInvoice: Invoice = {
      id: initialData?.id || `INV-${Date.now()}`,
      invoiceNumber: invNumber,
      quotationId: initialData?.quotationId,
      quotationNumber: initialData?.quotationNumber,
      clientId: selectedClientId,
      clientName,
      clientCompany,
      clientPhone,
      clientEmail,
      clientAddress,
      clientTin,
      date,
      dueDate,
      items,
      subtotal,
      discountType,
      discountValue: Number(discountValue),
      discountAmount,
      vatEnabled,
      vatRate: 18,
      vatAmount,
      grandTotal,
      currency: currency || 'TZS',
      paidAmount,
      balanceDue,
      status: balanceDue === 0 ? 'Paid' : status,
      notes,
      terms,
      bankDetails: {
        bankName: billingProfile.bankName,
        accountName: billingProfile.accountName,
        accountNumber: billingProfile.accountNumber,
        branch: billingProfile.branch,
        swiftCode: billingProfile.swiftCode,
        mobileMoneyName: billingProfile.mobileMoneyName,
        mobileMoneyNumber: billingProfile.mobileMoneyNumber,
      },
      payments: initialData?.payments || [],
      stockDeducted: initialData?.stockDeducted || deductStock,
      createdBy: initialData?.createdBy || currentUserName,
      createdAt: initialData?.createdAt || date,
    };

    onSave(newInvoice, deductStock);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-emerald-600" />
            <span>{initialData ? 'Hariri Ankara ya Malipo' : 'Tengeneza Ankara Mpya ya Malipo (Tax Invoice)'}</span>
          </h2>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Client Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                Chagua Mteja:
              </label>
              <select
                value={selectedClientId}
                onChange={e => handleClientSelect(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.companyName || 'Binafsi'})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                Kampuni ya Mteja:
              </label>
              <input
                type="text"
                value={clientCompany}
                onChange={e => setClientCompany(e.target.value)}
                placeholder="Kilombero Logistics"
                className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                Simu & Barua Pepe:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={clientPhone}
                  onChange={e => setClientPhone(e.target.value)}
                  placeholder="+255..."
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
                <input
                  type="email"
                  value={clientEmail}
                  onChange={e => setClientEmail(e.target.value)}
                  placeholder="info@..."
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                TIN ya Mteja & Mahali:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={clientTin}
                  onChange={e => setClientTin(e.target.value)}
                  placeholder="TIN Namba"
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
                <input
                  type="text"
                  value={clientAddress}
                  onChange={e => setClientAddress(e.target.value)}
                  placeholder="Mtaa, Mkoa"
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Dates & Status */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                Tarehe ya Ankara: *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                Tarehe ya Mwisho wa Malipo (Due Date): *
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                Hali ya Ankara: *
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as InvoiceStatus)}
                className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
              >
                <option value="Draft">Rasimu (Draft)</option>
                <option value="Sent">Imetumwa (Sent)</option>
                <option value="Partially Paid">Imelipwa Sehemu</option>
                <option value="Paid">Imelipwa Kamili (Paid)</option>
                <option value="Overdue">Imechelewa (Overdue)</option>
              </select>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 dark:text-slate-200 uppercase text-[10px]">
                Vipengele vya Ankara (Line Items):
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ongeza Kipengele</span>
              </button>
            </div>

            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-[10px] uppercase font-bold text-slate-500">
                  <tr>
                    <th className="py-2 px-3">Maelezo / Chagua Kutoka Katalogi</th>
                    <th className="py-2 px-3 w-24">Kipimo</th>
                    <th className="py-2 px-3 w-20 text-center">Idadi</th>
                    <th className="py-2 px-3 w-32 text-right">Bei (TZS)</th>
                    <th className="py-2 px-3 w-32 text-right">Jumla (TZS)</th>
                    <th className="py-2 px-2 w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {items.map((item, idx) => (
                    <tr key={item.id}>
                      <td className="py-2 px-3">
                        <div className="space-y-1">
                          <select
                            onChange={e => handleCataloguePick(idx, e.target.value)}
                            className="w-full text-[11px] p-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                          >
                            <option value="">-- Chagua kutoka Katalogi ya Bei --</option>
                            {catalogueItems.map(cat => (
                              <option key={cat.id} value={cat.id}>{cat.name} ({formatCurrency(cat.unitPrice, currency)})</option>
                            ))}
                          </select>
                          <input
                            type="text"
                            required
                            placeholder="Maelezo kamili ya ankara..."
                            value={item.description}
                            onChange={e => handleUpdateItem(idx, 'description', e.target.value)}
                            className="w-full p-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                          />
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={item.unit}
                          onChange={e => handleUpdateItem(idx, 'unit', e.target.value)}
                          placeholder="Pcs"
                          className="w-full p-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          min="1"
                          required
                          value={item.quantity}
                          onChange={e => handleUpdateItem(idx, 'quantity', Number(e.target.value))}
                          className="w-full p-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-center font-mono text-xs"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          min="0"
                          required
                          value={item.unitPrice}
                          onChange={e => handleUpdateItem(idx, 'unitPrice', Number(e.target.value))}
                          className="w-full p-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-right font-mono text-xs"
                        />
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {formatCurrency(item.amount, currency)}
                      </td>
                      <td className="py-2 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          disabled={items.length <= 1}
                          className="text-slate-400 hover:text-rose-600 disabled:opacity-30"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Stock Deduction Toggle & Totals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Punguzo (Discount):</label>
                <div className="flex gap-2">
                  <select
                    value={discountType}
                    onChange={e => setDiscountType(e.target.value as any)}
                    className="p-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                  >
                    <option value="fixed">Kiasi Maalum (TZS)</option>
                    <option value="percentage">Asilimia (%)</option>
                  </select>
                  <input
                    type="number"
                    min="0"
                    value={discountValue}
                    onChange={e => setDiscountValue(Number(e.target.value))}
                    className="flex-1 p-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-right font-mono text-xs"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="invVatToggle"
                    checked={vatEnabled}
                    onChange={e => setVatEnabled(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <label htmlFor="invVatToggle" className="font-bold text-slate-800 dark:text-slate-200 text-xs cursor-pointer">
                    Toza Kodi ya VAT 18% (TRA Tax Compliant)
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="invStockToggle"
                    checked={deductStock}
                    onChange={e => setDeductStock(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <label htmlFor="invStockToggle" className="font-semibold text-slate-700 dark:text-slate-300 text-xs cursor-pointer">
                    Punguza idadi ya vifaa vilivyopo kwenye Stoo kiotomatiki
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-right border-l pl-4 border-slate-200 dark:border-slate-700">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Jumla Ndogo (Subtotal):</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(subtotal, currency)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-amber-600">
                  <span>Punguzo (Discount):</span>
                  <span className="font-mono font-bold">- {formatCurrency(discountAmount, currency)}</span>
                </div>
              )}
              {vatEnabled && (
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>VAT (18%):</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">+ {formatCurrency(vatAmount, currency)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700">
                <span>Jumla Kuu (Grand Total):</span>
                <span className="font-mono text-emerald-600 text-base">{formatCurrency(grandTotal, currency)}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold"
            >
              Ghairi
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md"
            >
              {initialData ? 'Hifadhi Mabadiliko' : 'Tengeneza Ankara Sasa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// =========================================================================
// SUB-COMPONENT: RECORD PAYMENT MODAL
// =========================================================================
interface PaymentModalProps {
  lang: 'sw' | 'en';
  currency: 'TZS' | 'USD';
  invoice: Invoice;
  onClose: () => void;
  onSave: (paymentData: {
    amount: number;
    date: string;
    method: 'bank_transfer' | 'mobile_money' | 'cash' | 'cheque';
    referenceNumber: string;
    notes?: string;
  }) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  lang,
  currency,
  invoice,
  onClose,
  onSave,
}) => {
  const [amount, setAmount] = useState<number>(invoice.balanceDue);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [method, setMethod] = useState<'bank_transfer' | 'mobile_money' | 'cash' | 'cheque'>('bank_transfer');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('Malipo ya ankara ya huduma');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      alert(lang === 'sw' ? 'Kiasi cha malipo kinapaswa kuwa zaidi ya sifuri.' : 'Payment amount must be greater than zero.');
      return;
    }
    if (amount > invoice.balanceDue) {
      alert(lang === 'sw' ? 'Kiasi hakiwezi kuzidi baki inayodaiwa.' : 'Payment amount cannot exceed the balance due.');
      return;
    }
    onSave({
      amount: Number(amount),
      date,
      method,
      referenceNumber: referenceNumber.trim() || `TXN-${Date.now().toString().slice(-6)}`,
      notes,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <span>Weka Kumbukumbu ya Malipo</span>
          </h2>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Invoice Summary Box */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2 text-xs border border-slate-200 dark:border-slate-700">
          <div className="flex justify-between">
            <span className="text-slate-500">Namba ya Ankara:</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">{invoice.invoiceNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Mteja:</span>
            <span className="font-bold text-slate-900 dark:text-white">{invoice.clientName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Jumla ya Ankara:</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(invoice.grandTotal, currency)}</span>
          </div>
          <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
            <span className="text-amber-600 font-bold">Baki Inayodaiwa:</span>
            <span className="font-mono font-bold text-amber-600">{formatCurrency(invoice.balanceDue, currency)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
              Kiasi Kilicholipwa (TZS): *
            </label>
            <input
              type="number"
              required
              min="1"
              max={invoice.balanceDue}
              value={amount}
              onChange={e => setAmount(Number(e.target.value))}
              className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                Tarehe ya Malipo: *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                Njia ya Malipo: *
              </label>
              <select
                value={method}
                onChange={e => setMethod(e.target.value as any)}
                className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
              >
                <option value="bank_transfer">Uhamisho wa Benki (CRDB/NMB)</option>
                <option value="mobile_money">Lipa Namba / M-Pesa</option>
                <option value="cash">Pesa Taslimu (Cash)</option>
                <option value="cheque">Hundi ya Benki (Cheque)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
              Kumbukumbu ya Malipo / Namba ya Muamala:
            </label>
            <input
              type="text"
              required
              placeholder="k.m. CRDB-TXN-9988 au MPESA-QK890"
              value={referenceNumber}
              onChange={e => setReferenceNumber(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
              Maelezo ya Ziada (Notes):
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold"
            >
              Ghairi
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md"
            >
              Hifadhi Malipo Sasa
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// =========================================================================
// SUB-COMPONENT: CLIENT MODAL
// =========================================================================
interface ClientModalProps {
  lang: 'sw' | 'en';
  isOpen: boolean;
  initialData: Client | null;
  onClose: () => void;
  onSave: (client: Client) => void;
}

const ClientModal: React.FC<ClientModalProps> = ({
  lang,
  isOpen,
  initialData,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(initialData?.name || '');
  const [companyName, setCompanyName] = useState(initialData?.companyName || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [address, setAddress] = useState(initialData?.address || '');
  const [tinNumber, setTinNumber] = useState(initialData?.tinNumber || '');
  const [vrnNumber, setVrnNumber] = useState(initialData?.vrnNumber || '');
  const [notes, setNotes] = useState(initialData?.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newClient: Client = {
      id: initialData?.id || `CLI-${Date.now()}`,
      name: name.trim(),
      companyName: companyName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      tinNumber: tinNumber.trim(),
      vrnNumber: vrnNumber.trim() || undefined,
      notes: notes.trim(),
      createdAt: initialData?.createdAt || new Date().toISOString().split('T')[0],
    };
    onSave(newClient);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            <span>{initialData ? 'Hariri Taarifa za Mteja' : 'Sajili Mteja Mpya'}</span>
          </h2>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                Jina la Mtu wa Kuwasiliana: *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Mhandisi Rashid Bakari"
                className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                Jina la Kampuni: *
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                placeholder="Serengeti Agro Solutions Ltd"
                className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                Namba ya Simu: *
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+255 754 112 233"
                className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                Barua Pepe: *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="info@company.co.tz"
                className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
              Anuani ya Mteja: *
            </label>
            <input
              type="text"
              required
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Plot 45, Njiro, Arusha"
              className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                TIN Number (TRA):
              </label>
              <input
                type="text"
                value={tinNumber}
                onChange={e => setTinNumber(e.target.value)}
                placeholder="104-582-901"
                className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                VRN (VAT Registration):
              </label>
              <input
                type="text"
                value={vrnNumber}
                onChange={e => setVrnNumber(e.target.value)}
                placeholder="40-019842-A"
                className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
              Maelezo Kuhusu Mteja (Notes):
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold"
            >
              Ghairi
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md"
            >
              Hifadhi Mteja
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// =========================================================================
// SUB-COMPONENT: CATALOGUE ITEM MODAL
// =========================================================================
interface CatalogueItemModalProps {
  lang: 'sw' | 'en';
  isOpen: boolean;
  initialData: CatalogueItem | null;
  consumables: ConsumableItem[];
  onClose: () => void;
  onSave: (item: CatalogueItem) => void;
}

const CatalogueItemModal: React.FC<CatalogueItemModalProps> = ({
  lang,
  isOpen,
  initialData,
  consumables,
  onClose,
  onSave,
}) => {
  const [code, setCode] = useState(initialData?.code || `ITM-0${Math.floor(Math.random() * 90 + 10)}`);
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [unit, setUnit] = useState(initialData?.unit || 'Vipande (Pcs)');
  const [unitPrice, setUnitPrice] = useState<number>(initialData?.unitPrice || 50000);
  const [category, setCategory] = useState<'product' | 'service'>(initialData?.category || 'service');
  const [taxable, setTaxable] = useState<boolean>(initialData ? initialData.taxable : true);
  const [linkedStockItemId, setLinkedStockItemId] = useState<string>(initialData?.linkedStockItemId || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newItem: CatalogueItem = {
      id: initialData?.id || `CAT-${Date.now()}`,
      code: code.trim(),
      name: name.trim(),
      description: description.trim(),
      unit: unit.trim(),
      unitPrice: Number(unitPrice),
      category,
      taxable,
      linkedStockItemId: linkedStockItemId || undefined,
    };
    onSave(newItem);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-600" />
            <span>{initialData ? 'Hariri Bidhaa / Huduma' : 'Ongeza Bidhaa au Huduma kwenye Katalogi'}</span>
          </h2>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                Kodi ya Bidhaa / Huduma: *
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={e => setCode(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                Aina (Category): *
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as any)}
                className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
              >
                <option value="service">Huduma (Service)</option>
                <option value="product">Bidhaa ya Kushikika (Product)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
              Jina la Bidhaa / Huduma: *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="k.m. Leseni ya KaziDesk Cloud"
              className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
              Maelezo ya Kina:
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Maelezo yatakayoonekana kwenye ankara..."
              className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                Kipimo (Unit): *
              </label>
              <input
                type="text"
                required
                value={unit}
                onChange={e => setUnit(e.target.value)}
                placeholder="Pcs, Mwezi, Saa, Seti"
                className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                Bei ya Kitengo (TZS): *
              </label>
              <input
                type="number"
                min="0"
                required
                value={unitPrice}
                onChange={e => setUnitPrice(Number(e.target.value))}
                className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-right"
              />
            </div>
          </div>

          {category === 'product' && (
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                Husisha na Kifaa cha Stoo (Kwa Upunguzaji wa Stock):
              </label>
              <select
                value={linkedStockItemId}
                onChange={e => setLinkedStockItemId(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="">-- Hakuna Uhusiano na Stoo --</option>
                {consumables.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.quantityInStock} {c.unit} zilizopo)</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="catTaxable"
              checked={taxable}
              onChange={e => setTaxable(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
            />
            <label htmlFor="catTaxable" className="font-bold text-slate-800 dark:text-slate-200 text-xs cursor-pointer">
              Toza Kodi ya VAT 18% kwenye bidhaa/huduma hii
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold"
            >
              Ghairi
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md"
            >
              Hifadhi Bidhaa
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// =========================================================================
// SUB-COMPONENT: HIGH-FIDELITY PRINTABLE DOCUMENT PREVIEW MODAL
// =========================================================================
interface PrintableDocumentModalProps {
  lang: 'sw' | 'en';
  currency: 'TZS' | 'USD';
  documentType: 'quotation' | 'invoice';
  data: Quotation | Invoice;
  profile?: CompanyBillingProfile;
  onClose: () => void;
  onToggleLang: () => void;
}

const PrintableDocumentModal: React.FC<PrintableDocumentModalProps> = ({
  lang,
  currency,
  documentType,
  data,
  profile: propProfile,
  onClose,
  onToggleLang,
}) => {
  const safeProfile = propProfile || INITIAL_BILLING_PROFILE;
  const isInvoice = documentType === 'invoice';
  const invoiceData = isInvoice ? (data as Invoice) : null;
  const quoteData = !isInvoice ? (data as Quotation) : null;

  const docNumber = isInvoice ? invoiceData!.invoiceNumber : quoteData!.quotationNumber;
  const docDate = data.date;
  const validityOrDueDate = isInvoice ? invoiceData!.dueDate : quoteData!.validUntil;

  const docTitleSw = isInvoice ? 'ANKARA RASMI YA KODI' : 'NUKUU YA BEI YA KIOFISI';
  const docTitleEn = isInvoice ? 'TAX INVOICE' : 'PROFORMA QUOTATION';

  const amountInWords = formatAmountInWords(data.grandTotal, lang, currency);
  const todayStr = new Date().toISOString().split('T')[0];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white text-slate-900 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-6 border border-slate-300 max-h-[92vh] flex flex-col">
        
        {/* Modal Top Control Bar (Hidden during actual print) */}
        <div className="no-print flex items-center justify-between p-4 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-3">
            <Printer className="w-5 h-5 text-emerald-400" />
            <div>
              <span className="font-bold text-sm block">Onyesho la Kuchapisha / Printable Layout</span>
              <span className="text-[11px] text-slate-400">{docNumber} · {data.clientName}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleLang}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold border border-slate-700 transition-colors"
            >
              {lang === 'sw' ? 'Badili: Kiingereza (EN)' : 'Switch: Kiswahili (SW)'}
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Chapa Sasa (Print / PDF)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE A4 PAGE CONTAINER */}
        <div className="p-8 sm:p-12 overflow-y-auto bg-white text-slate-900 print:p-0 print:m-0 print:overflow-visible">
          
          {/* Header Zone: Company Details & Document Title */}
          <div className="flex flex-row justify-between items-start border-b-2 border-slate-900 pb-6 mb-6">
            <div className="flex items-start gap-4">
              <img
                src={safeProfile.logoUrl || ''}
                alt="Logo"
                className="w-20 h-20 rounded-lg object-contain border border-slate-200 p-1"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
              <div className="space-y-1">
                <h1 className="text-xl font-black text-slate-900 tracking-tight leading-tight">
                  {safeProfile.companyName}
                </h1>
                {safeProfile.tagline && (
                  <p className="text-xs font-medium text-emerald-700">
                    {safeProfile.tagline}
                  </p>
                )}
                <div className="text-[11px] text-slate-600 leading-relaxed">
                  <div>{safeProfile.address}, {safeProfile.city}, {safeProfile.country}</div>
                  <div>Simu: {safeProfile.phone} · Barua Pepe: {safeProfile.email}</div>
                  <div className="font-mono font-semibold pt-0.5">
                    TIN: <strong>{safeProfile.tinNumber}</strong> · VRN: <strong>{safeProfile.vrnNumber}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="inline-block bg-slate-900 text-white font-black text-base px-3 py-1 rounded tracking-wider uppercase mb-2">
                {lang === 'sw' ? docTitleSw : docTitleEn}
              </div>
              <div className="text-xs space-y-1">
                <div>
                  <span className="text-slate-500 font-semibold">{lang === 'sw' ? 'Namba:' : 'Number:'} </span>
                  <span className="font-mono font-black text-slate-900 text-sm">{docNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500">{lang === 'sw' ? 'Tarehe:' : 'Date:'} </span>
                  <span className="font-medium text-slate-900">{formatDate(docDate, lang)}</span>
                </div>
                <div>
                  <span className="text-slate-500">
                    {isInvoice ? (lang === 'sw' ? 'Mwisho wa Malipo:' : 'Due Date:') : (lang === 'sw' ? 'Ukomo wa Nukuu:' : 'Valid Until:')} 
                  </span>
                  <span className="font-bold text-slate-900"> {formatDate(validityOrDueDate, lang)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bill To Customer Information Box */}
          <div className="grid grid-cols-2 gap-6 p-4 rounded-xl bg-slate-50 border border-slate-200 mb-6 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                {lang === 'sw' ? 'MTEJA (BILL TO):' : 'INVOICE TO:'}
              </span>
              <div className="font-bold text-slate-900 text-sm">{data.clientName}</div>
              {data.clientCompany && <div className="font-semibold text-slate-800">{data.clientCompany}</div>}
              {data.clientAddress && <div className="text-slate-600 mt-0.5">{data.clientAddress}</div>}
              {data.clientPhone && <div className="text-slate-600">Simu: {data.clientPhone}</div>}
              {data.clientEmail && <div className="text-slate-600">Barua Pepe: {data.clientEmail}</div>}
            </div>

            <div className="text-right space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                {lang === 'sw' ? 'MAWASILIANO YA KODI:' : 'TAX IDENTIFICATION:'}
              </span>
              <div className="font-mono">
                <span className="text-slate-500">TIN ya Mteja: </span>
                <strong className="text-slate-900">{data.clientTin || 'N/A'}</strong>
              </div>
              {data.clientVrn && (
                <div className="font-mono">
                  <span className="text-slate-500">VRN ya Mteja: </span>
                  <strong className="text-slate-900">{data.clientVrn}</strong>
                </div>
              )}
              {isInvoice && invoiceData?.quotationNumber && (
                <div className="text-[11px] text-slate-500 pt-1">
                  Rejea ya Nukuu: <span className="font-mono font-bold text-slate-800">{invoiceData.quotationNumber}</span>
                </div>
              )}
            </div>
          </div>

          {/* Line Items Table */}
          <div className="mb-6 border border-slate-300 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center">#</th>
                  <th className="py-2.5 px-4">{lang === 'sw' ? 'Maelezo ya Huduma / Bidhaa' : 'Item Description'}</th>
                  <th className="py-2.5 px-3 w-20 text-center">{lang === 'sw' ? 'Kipimo' : 'Unit'}</th>
                  <th className="py-2.5 px-3 w-16 text-center">{lang === 'sw' ? 'Idadi' : 'Qty'}</th>
                  <th className="py-2.5 px-4 w-32 text-right">{lang === 'sw' ? 'Bei (TZS)' : 'Rate (TZS)'}</th>
                  <th className="py-2.5 px-4 w-36 text-right">{lang === 'sw' ? 'Jumla (TZS)' : 'Amount (TZS)'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {data.items.map((item, idx) => (
                  <tr key={item.id} className={idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                    <td className="py-3 px-3 text-center font-mono text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{item.description}</td>
                    <td className="py-3 px-3 text-center text-slate-600">{item.unit}</td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-900">{item.quantity}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-800">
                      {formatCurrency(item.unitPrice, currency)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(item.amount, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Totals & Amount in Words */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6">
            <div className="md:col-span-7 space-y-3">
              {/* Amount in Words */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">
                  {lang === 'sw' ? 'Kiasi Kamili kwa Maneno:' : 'Amount in Words:'}
                </span>
                <p className="font-bold text-slate-900 italic leading-snug">
                  {amountInWords}
                </p>
              </div>

              {/* Bank & Payment Instructions */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs space-y-1.5 text-slate-800">
                <div className="font-bold text-emerald-900 flex items-center gap-1.5 uppercase text-[10px]">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{lang === 'sw' ? 'Maelekezo ya Kufanya Malipo (Payment Instructions):' : 'Banking & Payment Details:'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-medium pt-1">
                  <div>
                    <span className="text-slate-500">Benki: </span>
                    <strong className="text-slate-900">{safeProfile.bankName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Akaunti: </span>
                    <strong className="font-mono text-slate-900">{safeProfile.accountNumber}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Jina la Akaunti: </span>
                    <strong className="text-slate-900">{safeProfile.accountName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Tawi / SWIFT: </span>
                    <strong className="text-slate-900">{safeProfile.branch}</strong>
                  </div>
                </div>
                {safeProfile.mobileMoneyNumber && (
                  <div className="pt-1 text-[11px] border-t border-emerald-200/60 font-semibold">
                    <span className="text-slate-600">Lipa Namba ya Simu: </span>
                    <strong className="font-mono text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-300">
                      {safeProfile.mobileMoneyNumber} ({safeProfile.mobileMoneyName})
                    </strong>
                  </div>
                )}
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="md:col-span-5 space-y-2 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>{lang === 'sw' ? 'Jumla Ndogo (Subtotal):' : 'Subtotal:'}</span>
                  <span className="font-mono font-bold text-slate-900">{formatCurrency(data.subtotal, currency)}</span>
                </div>

                {data.discountAmount > 0 && (
                  <div className="flex justify-between text-amber-600">
                    <span>{lang === 'sw' ? 'Punguzo (Discount):' : 'Discount:'}</span>
                    <span className="font-mono font-bold">- {formatCurrency(data.discountAmount, currency)}</span>
                  </div>
                )}

                {data.vatEnabled && (
                  <div className="flex justify-between text-slate-600">
                    <span>VAT (18%):</span>
                    <span className="font-mono font-bold text-slate-900">+ {formatCurrency(data.vatAmount, currency)}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-300">
                  <span>{lang === 'sw' ? 'Jumla Kuu (Total):' : 'Grand Total:'}</span>
                  <span className="font-mono text-base text-slate-900">{formatCurrency(data.grandTotal, currency)}</span>
                </div>

                {isInvoice && (
                  <>
                    <div className="flex justify-between text-emerald-700 font-bold pt-1">
                      <span>{lang === 'sw' ? 'Kiasi Kilicholipwa:' : 'Amount Paid:'}</span>
                      <span className="font-mono">{formatCurrency(invoiceData!.paidAmount, currency)}</span>
                    </div>

                    <div className="flex justify-between text-sm font-black pt-1 border-t border-slate-300">
                      <span className={invoiceData!.balanceDue > 0 ? 'text-rose-600' : 'text-slate-900'}>
                        {lang === 'sw' ? 'Baki Inayodaiwa:' : 'Balance Due:'}
                      </span>
                      <span className={`font-mono text-base ${invoiceData!.balanceDue > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                        {formatCurrency(invoiceData!.balanceDue, currency)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Terms & Notes */}
          <div className="text-[11px] text-slate-500 border-t border-slate-200 pt-3 mb-8">
            <span className="font-bold text-slate-700 block mb-0.5">{lang === 'sw' ? 'Masharti ya Malipo:' : 'Terms & Conditions:'}</span>
            <p>{data.terms || safeProfile.defaultPaymentTerms}</p>
          </div>

          {/* Official Signatory and Stamp Zone */}
          <div className="flex justify-between items-end border-t-2 border-slate-900 pt-6">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                {lang === 'sw' ? 'Mamlaka Iliyoidhinisha:' : 'Authorized Signatory:'}
              </span>
              <div className="font-bold text-slate-900 text-sm">{safeProfile.signatoryName}</div>
              <div className="text-xs text-slate-500">{safeProfile.signatoryTitle}</div>
              <div className="w-48 border-b border-dashed border-slate-400 mt-8 mb-1" />
              <span className="text-[10px] text-slate-400 italic">{lang === 'sw' ? 'Sahihi Rasmi' : 'Signature & Date'}</span>
            </div>

            {/* Official Stamp Box */}
            <div className="w-36 h-28 border-2 border-dashed border-emerald-600/70 rounded-xl flex flex-col items-center justify-center text-center p-2 text-emerald-700">
              <div className="w-8 h-8 rounded-full border border-emerald-600 flex items-center justify-center font-bold text-xs mb-1">
                ✓
              </div>
              <span className="text-[9px] font-black uppercase tracking-wider">KAZIDESK TANZANIA</span>
              <span className="text-[8px] font-mono">OFFICIAL SEAL</span>
              <span className="text-[8px] text-slate-400">{todayStr}</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
