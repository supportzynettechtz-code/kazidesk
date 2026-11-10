/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  FileText,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Download,
  Printer,
  Building2,
  User,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  MessageSquare,
  ChevronRight,
  Sparkles,
  ArrowRight,
  X,
  FileCheck,
  ShieldAlert
} from 'lucide-react';
import {
  KYCApplication,
  KYCDocumentItem,
  KYCStatus,
  DocumentReviewStatus,
  BusinessType
} from '../../types/kyc';
import {
  reviewKYCApplication,
  approveAndProvisionCompany
} from '../../services/kycService';
import { maskIdNumber, maskTinNumber } from '../../services/securityService';
import { DocumentPreviewModal } from '../common/DocumentPreviewModal';
import { exportToCSV } from '../../utils/storage';
import { formatDate } from '../../utils/formatters';

interface OwnerKYCReviewQueueProps {
  applications: KYCApplication[];
  onRefresh: () => void;
  reviewerEmail: string;
  lang: 'sw' | 'en';
}

export const OwnerKYCReviewQueue: React.FC<OwnerKYCReviewQueueProps> = ({
  applications,
  onRefresh,
  reviewerEmail,
  lang
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');

  // Review Modal State
  const [selectedApp, setSelectedApp] = useState<KYCApplication | null>(null);
  const [documentChecklist, setDocumentChecklist] = useState<Record<string, { status: DocumentReviewStatus; comment: string }>>({});
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [revealFullId, setRevealFullId] = useState(false);

  // Modals & Action loading
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<{ title: string; fileUrl: string; fileType?: string; fileName?: string } | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);

  // Counters
  const pendingCount = applications.filter(a => a.status === 'submitted').length;
  const underReviewCount = applications.filter(a => a.status === 'under_review').length;
  const moreInfoCount = applications.filter(a => a.status === 'more_info_required').length;
  const approvedCount = applications.filter(a => a.status === 'approved').length;
  const rejectedCount = applications.filter(a => a.status === 'rejected').length;

  // Filtered List
  const filteredApplications = applications.filter(app => {
    if (statusFilter !== 'all' && app.status !== statusFilter) return false;
    if (typeFilter !== 'all' && app.businessType !== typeFilter) return false;
    if (planFilter !== 'all' && app.preferredPlanId !== planFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = app.legalName?.toLowerCase().includes(q) || app.tradingName?.toLowerCase().includes(q);
      const matchEmail = app.applicantEmail?.toLowerCase().includes(q) || app.businessEmail?.toLowerCase().includes(q);
      const matchTin = (app.companyKyc?.tinNumber || app.soleProprietorKyc?.tinNumber || '').includes(q);
      const matchBrela = (app.companyKyc?.brelaRegistrationNumber || '').toLowerCase().includes(q);
      return matchName || matchEmail || matchTin || matchBrela;
    }

    return true;
  });

  // Open Review Drawer
  const handleOpenReview = (app: KYCApplication) => {
    setSelectedApp(app);
    setReviewerNotes(app.ownerReviewNotes || '');
    setRejectionReason(app.rejectionReason || '');
    setRevealFullId(false);

    // Initialize document checklist from existing statuses
    const initialChecklist: Record<string, { status: DocumentReviewStatus; comment: string }> = {};
    (app.documents || []).forEach(docItem => {
      initialChecklist[docItem.id] = {
        status: docItem.reviewStatus || 'pending',
        comment: docItem.reviewComment || ''
      };
    });
    setDocumentChecklist(initialChecklist);
    setActionErrorMsg(null);
    setActionSuccessMsg(null);
  };

  // Update single document checklist
  const handleDocCheck = (docId: string, status: DocumentReviewStatus) => {
    setDocumentChecklist(prev => ({
      ...prev,
      [docId]: {
        ...(prev[docId] || { comment: '' }),
        status
      }
    }));
  };

  const handleDocComment = (docId: string, comment: string) => {
    setDocumentChecklist(prev => ({
      ...prev,
      [docId]: {
        ...(prev[docId] || { status: 'pending' }),
        comment
      }
    }));
  };

  // Action: Approve & Provision Company
  const handleApprove = async () => {
    if (!selectedApp) return;
    setIsProcessing(true);
    setActionErrorMsg(null);

    try {
      // Review docs as verified
      await reviewKYCApplication(selectedApp.id, {
        status: 'approved',
        checklist: documentChecklist,
        ownerNotes: reviewerNotes || 'Yote yamehakikiwa na kuidhinishwa.',
        reviewerEmail
      });

      const { companyId } = await approveAndProvisionCompany(selectedApp, reviewerEmail);
      setActionSuccessMsg(
        lang === 'sw'
          ? `Maombi yameidhinishwa! Ofisi imeundwa: ${companyId} na jaribio la siku 14 limeanzishwa.`
          : `Application approved! Workspace created: ${companyId} with 14-day trial.`
      );
      setTimeout(() => {
        setSelectedApp(null);
        onRefresh();
      }, 1800);
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Hitilafu wakati wa kuidhinisha');
    } finally {
      setIsProcessing(false);
    }
  };

  // Action: Request More Info
  const handleRequestMoreInfo = async () => {
    if (!selectedApp) return;
    if (!reviewerNotes.trim()) {
      setActionErrorMsg(lang === 'sw' ? 'Tafadhali andika ujumbe wa maelekezo kwa mteja.' : 'Please provide review notes for the applicant.');
      return;
    }
    setIsProcessing(true);
    setActionErrorMsg(null);

    try {
      await reviewKYCApplication(selectedApp.id, {
        status: 'more_info_required',
        checklist: documentChecklist,
        moreInfoNotes: reviewerNotes,
        reviewerEmail
      });
      setActionSuccessMsg(
        lang === 'sw'
          ? 'Ombi la taarifa zaidi limetumwa kwa mteja!'
          : 'Request for additional information sent to applicant!'
      );
      setTimeout(() => {
        setSelectedApp(null);
        onRefresh();
      }, 1500);
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Hitilafu wakati wa kutuma ombi');
    } finally {
      setIsProcessing(false);
    }
  };

  // Action: Reject
  const handleReject = async () => {
    if (!selectedApp) return;
    if (!rejectionReason.trim()) {
      setActionErrorMsg(lang === 'sw' ? 'Sababu ya kukataa inahitajika kisheria.' : 'Rejection reason is mandatory.');
      return;
    }
    setIsProcessing(true);
    setActionErrorMsg(null);

    try {
      await reviewKYCApplication(selectedApp.id, {
        status: 'rejected',
        checklist: documentChecklist,
        rejectionReason,
        reviewerEmail
      });
      setActionSuccessMsg(lang === 'sw' ? 'Maombi yamekataliwa.' : 'Application rejected.');
      setTimeout(() => {
        setSelectedApp(null);
        onRefresh();
      }, 1500);
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Hitilafu wakati wa kukataa maombi');
    } finally {
      setIsProcessing(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Entity Name', 'Type', 'Applicant', 'Email', 'Phone', 'Status', 'TIN', 'BRELA', 'Plan', 'Region', 'Submitted Date', 'Duplicate Flag'];
    const rows = filteredApplications.map(app => [
      app.id,
      app.legalName,
      app.businessType,
      app.applicantName,
      app.applicantEmail,
      app.applicantPhone,
      app.status,
      app.companyKyc?.tinNumber || app.soleProprietorKyc?.tinNumber || '',
      app.companyKyc?.brelaRegistrationNumber || app.soleProprietorKyc?.brelaBusinessNameNumber || '',
      app.preferredPlanId,
      app.region,
      app.submittedAt?.split('T')[0] || app.createdAt.split('T')[0],
      app.isPotentialDuplicate ? 'YES' : 'NO'
    ]);
    exportToCSV(`kazidesk_kyc_registrations`, headers, rows);
  };

  return (
    <div className="space-y-6">
      
      {/* Metric Counters Top Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        
        <div
          onClick={() => setStatusFilter('submitted')}
          className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 cursor-pointer hover:border-blue-500/50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-300">
              {lang === 'sw' ? 'Yanayosubiri (Pending)' : 'Pending Review'}
            </span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono mt-2">{pendingCount}</div>
        </div>

        <div
          onClick={() => setStatusFilter('under_review')}
          className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 cursor-pointer hover:border-purple-500/50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-300">
              {lang === 'sw' ? 'Yanakaguliwa' : 'Under Review'}
            </span>
            <Eye className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono mt-2">{underReviewCount}</div>
        </div>

        <div
          onClick={() => setStatusFilter('more_info_required')}
          className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 cursor-pointer hover:border-amber-500/50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-300">
              {lang === 'sw' ? 'Taarifa Zaidi' : 'Action Required'}
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono mt-2">{moreInfoCount}</div>
        </div>

        <div
          onClick={() => setStatusFilter('approved')}
          className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 cursor-pointer hover:border-emerald-500/50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-300">
              {lang === 'sw' ? 'Yaliyoidhinishwa' : 'Approved'}
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono mt-2">{approvedCount}</div>
        </div>

        <div
          onClick={() => setStatusFilter('rejected')}
          className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 cursor-pointer hover:border-rose-500/50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-300">
              {lang === 'sw' ? 'Yalikataliwa' : 'Rejected'}
            </span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono mt-2">{rejectedCount}</div>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={lang === 'sw' ? 'Tafuta kwa jina, TIN, BRELA, barua pepe...' : 'Search by name, TIN, BRELA, email...'}
            className="w-full pl-9 pr-3 py-2 bg-slate-800 rounded-xl border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-800 rounded-xl border border-slate-700 text-white focus:outline-none"
          >
            <option value="all">{lang === 'sw' ? 'Hali Zote (All Statuses)' : 'All Statuses'}</option>
            <option value="submitted">{lang === 'sw' ? 'Yanayosubiri (Submitted)' : 'Submitted'}</option>
            <option value="under_review">{lang === 'sw' ? 'Yanakaguliwa (Under Review)' : 'Under Review'}</option>
            <option value="more_info_required">{lang === 'sw' ? 'Taarifa Zaidi (More Info)' : 'More Info Required'}</option>
            <option value="approved">{lang === 'sw' ? 'Yaliyoidhinishwa (Approved)' : 'Approved'}</option>
            <option value="rejected">{lang === 'sw' ? 'Yalikataliwa (Rejected)' : 'Rejected'}</option>
            <option value="draft">{lang === 'sw' ? 'Rasimu (Drafts)' : 'Drafts'}</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-slate-800 rounded-xl border border-slate-700 text-white focus:outline-none"
          >
            <option value="all">{lang === 'sw' ? 'Aina Zote za Shirika' : 'All Entity Types'}</option>
            <option value="registered_company">Registered Company</option>
            <option value="sole_proprietor">Sole Proprietor</option>
          </select>

          {/* Export Button */}
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 hover:text-white font-bold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>

          <button
            onClick={onRefresh}
            className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-400 hover:text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Applications Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-black border-b border-slate-800 tracking-wider">
              <tr>
                <th className="py-3 px-4">{lang === 'sw' ? 'Shirika / Mwombaji' : 'Organization / Applicant'}</th>
                <th className="py-3 px-4">{lang === 'sw' ? 'Aina' : 'Entity Type'}</th>
                <th className="py-3 px-4">{lang === 'sw' ? 'TIN & BRELA' : 'TIN & BRELA'}</th>
                <th className="py-3 px-4">{lang === 'sw' ? 'Mpango' : 'Plan'}</th>
                <th className="py-3 px-4">{lang === 'sw' ? 'Nyaraka' : 'Docs'}</th>
                <th className="py-3 px-4">{lang === 'sw' ? 'Hali (Status)' : 'Status'}</th>
                <th className="py-3 px-4">{lang === 'sw' ? 'Tarehe' : 'Date'}</th>
                <th className="py-3 px-4 text-right">{lang === 'sw' ? 'Kitendo' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <FileText className="w-10 h-10 mx-auto text-slate-600 mb-2 opacity-50" />
                    <span>{lang === 'sw' ? 'Hakuna maombi ya usajili yanayolingana na vigezo.' : 'No registration applications found matching filter.'}</span>
                  </td>
                </tr>
              ) : (
                filteredApplications.map(app => {
                  const rawTin = app.companyKyc?.tinNumber || app.soleProprietorKyc?.tinNumber;
                  const rawBrela = app.companyKyc?.brelaRegistrationNumber || app.soleProprietorKyc?.brelaBusinessNameNumber;
                  return (
                    <tr key={app.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span>{app.legalName}</span>
                          {app.isPotentialDuplicate && (
                            <span className="p-0.5 rounded bg-amber-500/20 text-amber-400" title="Possible duplicate detected">
                              <AlertTriangle className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 block truncate">
                          {app.applicantName} · {app.applicantEmail}
                        </span>
                      </td>

                      <td className="py-3 px-4 capitalize text-[11px]">
                        {app.businessType === 'registered_company' ? 'Company (Ltd)' : 'Sole Proprietor'}
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px]">
                        <div>TIN: <strong className="text-slate-200">{maskTinNumber(rawTin)}</strong></div>
                        {rawBrela && <div>BRELA: <span className="text-slate-400">{rawBrela}</span></div>}
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-emerald-400 font-bold uppercase text-[10px]">
                          {app.preferredPlanId}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-bold">
                        <span className="text-slate-200">{app.documents?.length || 0}</span>
                        <span className="text-slate-500 text-[10px]"> faili</span>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          app.status === 'approved'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : app.status === 'submitted'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : app.status === 'under_review'
                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                            : app.status === 'more_info_required'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : app.status === 'rejected'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-slate-700 text-slate-300'
                        }`}>
                          {app.status.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-400 text-[11px] font-mono">
                        {app.submittedAt?.split('T')[0] || app.createdAt.split('T')[0]}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleOpenReview(app)}
                          className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold transition-colors"
                        >
                          {lang === 'sw' ? 'Kagua (Review)' : 'Review'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Drawer / Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-white">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    <span>{selectedApp.legalName}</span>
                    <span className="text-[10px] font-mono font-normal text-slate-400">[{selectedApp.id}]</span>
                  </h3>
                  <span className="text-xs text-slate-400">
                    {lang === 'sw' ? 'Ukaguzi wa Kina wa Nyaraka & Idhini ya Usajili' : 'KYC Verification & Company Approval Gate'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRevealFullId(!revealFullId)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors ${
                    revealFullId
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                      : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  {revealFullId ? (lang === 'sw' ? 'Ficha Namba za Vitambulisho' : 'Mask IDs') : (lang === 'sw' ? 'Onyesha Namba Kamili za Vitambulisho' : 'Reveal Full IDs')}
                </button>
                <button
                  onClick={() => setSelectedApp(null)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Notification Bar inside Modal */}
            {actionErrorMsg && (
              <div className="p-3 bg-rose-500/15 border-b border-rose-500/30 text-xs text-rose-300 flex items-center gap-2 px-6">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{actionErrorMsg}</span>
              </div>
            )}

            {actionSuccessMsg && (
              <div className="p-3 bg-emerald-500/15 border-b border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2 px-6">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{actionSuccessMsg}</span>
              </div>
            )}

            {selectedApp.isPotentialDuplicate && selectedApp.duplicateReasons && (
              <div className="p-3 bg-amber-500/15 border-b border-amber-500/30 text-xs text-amber-300 px-6 space-y-1">
                <span className="font-bold block">
                  {lang === 'sw' ? 'Tahadhari ya Kufanana kwa Taarifa (Potential Duplicate Alert):' : 'Duplicate Alert:'}
                </span>
                <ul className="list-disc list-inside text-[11px] text-slate-200 pl-2">
                  {selectedApp.duplicateReasons.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            )}

            {/* Split Screen Content */}
            <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-800 p-6 gap-6">
              
              {/* Left Pane: Detailed Dossier (7 cols) */}
              <div className="lg:col-span-7 space-y-5 text-xs">
                
                {/* Organization & Location Overview */}
                <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/80 space-y-2">
                  <span className="font-bold text-emerald-400 uppercase text-[10px] tracking-wider block">
                    {lang === 'sw' ? '1. Utambulisho wa Taasisi & Anwani:' : '1. Organization & Location Details:'}
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-slate-300">
                    <div>Jina la Kisheria: <strong className="text-white block">{selectedApp.legalName}</strong></div>
                    <div>Jina la Biashara: <strong className="text-white block">{selectedApp.tradingName || '-'}</strong></div>
                    <div>Aina ya Taasisi: <strong className="text-white block capitalize">{selectedApp.businessType.replace('_', ' ')}</strong></div>
                    <div>Sekta: <strong className="text-white block">{selectedApp.businessSector}</strong></div>
                    <div>Mkoa & Wilaya: <strong className="text-white block">{selectedApp.region}, {selectedApp.district}</strong></div>
                    <div>Anwani ya Eneo: <strong className="text-white block">{selectedApp.physicalAddress}</strong></div>
                    <div>Simu ya Ofisi: <strong className="text-white block">{selectedApp.businessPhone}</strong></div>
                    <div>Barua Pepe: <strong className="text-white block">{selectedApp.businessEmail}</strong></div>
                  </div>
                </div>

                {/* Tax & Legal Identifiers */}
                <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/80 space-y-2">
                  <span className="font-bold text-teal-400 uppercase text-[10px] tracking-wider block">
                    {lang === 'sw' ? '2. Namba za Kodi & Usajili wa Biashara:' : '2. Tax & Legal Registrations:'}
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-slate-300">
                    <div>
                      TIN: <strong className="font-mono text-white block">
                        {revealFullId
                          ? (selectedApp.companyKyc?.tinNumber || selectedApp.soleProprietorKyc?.tinNumber || '-')
                          : maskTinNumber(selectedApp.companyKyc?.tinNumber || selectedApp.soleProprietorKyc?.tinNumber)}
                      </strong>
                    </div>
                    {selectedApp.companyKyc?.brelaRegistrationNumber && (
                      <div>
                        BRELA No: <strong className="font-mono text-white block">{selectedApp.companyKyc.brelaRegistrationNumber}</strong>
                      </div>
                    )}
                    {selectedApp.companyKyc?.vrnNumber && (
                      <div>
                        VRN (VAT): <strong className="font-mono text-white block">{selectedApp.companyKyc.vrnNumber}</strong>
                      </div>
                    )}
                    <div>
                      Leseni: <strong className="font-mono text-white block">
                        {selectedApp.companyKyc?.businessLicenceNumber || selectedApp.soleProprietorKyc?.businessLicenceNumber || '-'}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Directors / Owner Profile */}
                {selectedApp.businessType === 'registered_company' ? (
                  <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/80 space-y-3">
                    <span className="font-bold text-amber-400 uppercase text-[10px] tracking-wider block">
                      {lang === 'sw' ? '3. Wakurugenzi & Wamiliki wa Hisa (Directors):' : '3. Directors & Beneficial Owners:'}
                    </span>
                    <div className="space-y-2">
                      {(selectedApp.companyKyc?.directors || []).map((dir, idx) => (
                        <div key={dir.id || idx} className="p-2.5 bg-slate-900 rounded-xl border border-slate-700/70 flex items-center justify-between">
                          <div>
                            <strong className="text-white block">{dir.fullName}</strong>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {dir.idType.toUpperCase()}: {revealFullId ? dir.idNumber : maskIdNumber(dir.idNumber)}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-emerald-400 font-bold font-mono">
                              {dir.shareholdingPercentage}%
                            </span>
                            {dir.idDocumentUrl && (
                              <button
                                type="button"
                                onClick={() => setPreviewDoc({ title: `Kitambulisho cha ${dir.fullName}`, fileUrl: dir.idDocumentUrl! })}
                                className="text-[11px] text-emerald-400 hover:underline block mt-0.5"
                              >
                                {lang === 'sw' ? 'Angalia ID' : 'View ID'}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/80 space-y-2">
                    <span className="font-bold text-amber-400 uppercase text-[10px] tracking-wider block">
                      {lang === 'sw' ? '3. Utambulisho wa Mjasiriamali Binafsi:' : '3. Sole Proprietor Identity:'}
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-slate-300">
                      <div>Jina: <strong className="text-white block">{selectedApp.soleProprietorKyc?.fullName}</strong></div>
                      <div>Tarehe ya Kuzaliwa: <strong className="text-white block">{selectedApp.soleProprietorKyc?.dateOfBirth}</strong></div>
                      <div>
                        Kitambulisho ({selectedApp.soleProprietorKyc?.idType}):
                        <strong className="text-white block font-mono">
                          {revealFullId ? selectedApp.soleProprietorKyc?.idNumber : maskIdNumber(selectedApp.soleProprietorKyc?.idNumber)}
                        </strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* E-Signature & Terms Acceptance */}
                <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/80 space-y-2">
                  <span className="font-bold text-cyan-400 uppercase text-[10px] tracking-wider block">
                    {lang === 'sw' ? '4. Sahihi ya Kielektroniki & Tamko la Kisheria:' : '4. E-Signature & Declarations:'}
                  </span>
                  <div className="flex items-center justify-between text-slate-300">
                    <div>
                      Sahihi Rasmi: <strong className="text-emerald-400 font-serif italic text-sm block">{selectedApp.eSignatureName || selectedApp.applicantName}</strong>
                    </div>
                    <div>
                      Tarehe: <strong className="text-white font-mono block">{selectedApp.eSignatureDate || '-'}</strong>
                    </div>
                    <div>
                      Sheria za Huduma: <strong className="text-emerald-400 block">{selectedApp.termsVersionAccepted || 'v1.2'}</strong>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Pane: Document Review & Verification Checklist (5 cols) */}
              <div className="lg:col-span-5 space-y-5 text-xs">
                
                <div>
                  <h4 className="text-xs font-black uppercase text-slate-300 tracking-wider">
                    {lang === 'sw' ? 'Orodha ya Ukaguzi wa Nyaraka (Verification Checklist)' : 'Document Verification Checklist'}
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    {lang === 'sw' ? 'Kagua kila nyaraka na chagua hali yake' : 'Examine each document and set review status'}
                  </span>
                </div>

                <div className="space-y-3">
                  {(selectedApp.documents || []).length === 0 ? (
                    <div className="p-6 bg-slate-800/40 rounded-2xl text-center text-slate-400">
                      {lang === 'sw' ? 'Hakuna nyaraka zilizopakiwa' : 'No documents attached'}
                    </div>
                  ) : (
                    selectedApp.documents.map(docItem => {
                      const curCheck = documentChecklist[docItem.id] || { status: docItem.reviewStatus || 'pending', comment: '' };
                      return (
                        <div
                          key={docItem.id}
                          className="p-3.5 bg-slate-800/70 border border-slate-700/80 rounded-2xl space-y-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white truncate pr-2 text-[11px]" title={docItem.name}>
                              {docItem.name}
                            </span>
                            <button
                              type="button"
                              onClick={() => setPreviewDoc({ title: docItem.name, fileUrl: docItem.fileUrl, fileType: docItem.fileType })}
                              className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shrink-0"
                            >
                              <Eye className="w-3 h-3" />
                              <span>{lang === 'sw' ? 'Tazama' : 'View'}</span>
                            </button>
                          </div>

                          {/* Review status radio group */}
                          <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                            <button
                              type="button"
                              onClick={() => handleDocCheck(docItem.id, 'verified')}
                              className={`py-1 px-1 rounded-lg font-bold border transition-colors ${
                                curCheck.status === 'verified'
                                  ? 'bg-emerald-500/30 border-emerald-500 text-emerald-300'
                                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                              }`}
                            >
                              ✓ Verified
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDocCheck(docItem.id, 'not_clear')}
                              className={`py-1 px-1 rounded-lg font-bold border transition-colors ${
                                curCheck.status === 'not_clear'
                                  ? 'bg-amber-500/30 border-amber-500 text-amber-300'
                                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                              }`}
                            >
                              ⚠ Not Clear
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDocCheck(docItem.id, 'rejected')}
                              className={`py-1 px-1 rounded-lg font-bold border transition-colors ${
                                curCheck.status === 'rejected'
                                  ? 'bg-rose-500/30 border-rose-500 text-rose-300'
                                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                              }`}
                            >
                              ✕ Rejected
                            </button>
                          </div>

                          {/* Optional comment for this specific document */}
                          <input
                            type="text"
                            value={curCheck.comment}
                            onChange={e => handleDocComment(docItem.id, e.target.value)}
                            placeholder={lang === 'sw' ? 'Maoni maalum kwa faili hili...' : 'Note for this file...'}
                            className="w-full px-2.5 py-1.5 bg-slate-900 rounded-lg border border-slate-700 text-white text-[11px] placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Global Reviewer Notes */}
                <div className="space-y-1 pt-2">
                  <label className="block font-bold text-slate-300 text-[11px]">
                    {lang === 'sw' ? 'Maelekezo / Ujumbe wa Mkaguzi (kwa Mteja):' : 'Reviewer Directives / Instructions:'}
                  </label>
                  <textarea
                    value={reviewerNotes}
                    onChange={e => setReviewerNotes(e.target.value)}
                    rows={2}
                    placeholder={lang === 'sw' ? 'Maelekezo au sababu ya kuomba nyaraka zaidi...' : 'Instructions or request details...'}
                    className="w-full px-3 py-2 bg-slate-800 rounded-xl border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Rejection Reason (only needed if rejecting) */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-400 text-[11px]">
                    {lang === 'sw' ? 'Sababu ya Kukataa (Ikiwa unakataa maombi):' : 'Rejection Reason (If rejecting):'}
                  </label>
                  <input
                    type="text"
                    value={rejectionReason}
                    onChange={e => setRejectionReason(e.target.value)}
                    placeholder={lang === 'sw' ? 'Mf. Nyaraka za kodi si halali au namba ya TIN hailingani...' : 'e.g. Invalid tax certificate or mismatched TIN...'}
                    className="w-full px-3 py-2 bg-slate-800 rounded-xl border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

              </div>

            </div>

            {/* Bottom Actions Bar */}
            <div className="p-4 sm:p-6 border-t border-slate-800 bg-slate-950 flex items-center justify-between flex-wrap gap-3">
              
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors"
              >
                {lang === 'sw' ? 'Funga (Close)' : 'Close'}
              </button>

              <div className="flex items-center gap-2">
                
                {/* Reject Button */}
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={isProcessing}
                  className="px-4 py-2.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  <span>{lang === 'sw' ? 'Kataa Maombi' : 'Reject Application'}</span>
                </button>

                {/* Request More Information */}
                <button
                  type="button"
                  onClick={handleRequestMoreInfo}
                  disabled={isProcessing}
                  className="px-4 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>{lang === 'sw' ? 'Omba Taarifa Zaidi' : 'Request More Info'}</span>
                </button>

                {/* Approve & Provision */}
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={isProcessing}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isProcessing ? (lang === 'sw' ? 'Inatekeleza...' : 'Provisioning...') : (lang === 'sw' ? 'Idhinisha & Unda Ofisi' : 'Approve & Provision Workspace')}</span>
                </button>

              </div>

            </div>

          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewDoc && (
        <DocumentPreviewModal
          isOpen={true}
          onClose={() => setPreviewDoc(null)}
          title={previewDoc.title}
          fileUrl={previewDoc.fileUrl}
          fileType={previewDoc.fileType}
        />
      )}

    </div>
  );
};
