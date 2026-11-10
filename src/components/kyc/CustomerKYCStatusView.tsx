/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  UploadCloud,
  LogOut,
  Globe,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Eye,
  Trash2,
  Mail,
  Phone,
  HelpCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { KYCApplication, KYCDocumentItem, KYCStatus } from '../../types/kyc';
import {
  uploadKYCDocument,
  submitKYCApplication,
  requestAccountDataDeletion
} from '../../services/kycService';
import { mapFirebaseAuthError } from '../../firebase/errors';
import { DocumentPreviewModal } from '../common/DocumentPreviewModal';

interface CustomerKYCStatusViewProps {
  application: KYCApplication;
  lang: 'sw' | 'en';
  onToggleLang: () => void;
  onResumeDraft: () => void;
  onEnterWorkspace: () => void;
  onLogout: () => void;
  onRefreshStatus: () => void;
}

export const CustomerKYCStatusView: React.FC<CustomerKYCStatusViewProps> = ({
  application,
  lang,
  onToggleLang,
  onResumeDraft,
  onEnterWorkspace,
  onLogout,
  onRefreshStatus
}) => {
  const [isReSubmitting, setIsReSubmitting] = useState(false);
  const [reUploadNotes, setReUploadNotes] = useState('');
  const [documents, setDocuments] = useState<KYCDocumentItem[]>(application.documents || []);
  const [uploadingDocType, setUploadingDocType] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<{ title: string; fileUrl: string; fileType?: string; fileName?: string } | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Deletion Request Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const status: KYCStatus = application.status;

  const handleReUpload = async (docType: string, file: File, label: string) => {
    setUploadingDocType(docType);
    setErrorMessage(null);
    try {
      const uploadedItem = await uploadKYCDocument(application.id, docType, file);
      uploadedItem.name = `${label} (${file.name})`;
      uploadedItem.reviewStatus = 'pending';

      const filtered = documents.filter(d => d.documentType !== docType);
      const nextDocs = [...filtered, uploadedItem];
      setDocuments(nextDocs);

      setSuccessToast(lang === 'sw' ? `Nyaraka ya "${label}" imebadilishwa!` : `"${label}" updated!`);
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err: any) {
      const mapped = mapFirebaseAuthError(err, application.applicantEmail);
      setErrorMessage(lang === 'sw' ? mapped.sw : mapped.en);
    } finally {
      setUploadingDocType(null);
    }
  };

  const handleReSubmit = async () => {
    setIsReSubmitting(true);
    setErrorMessage(null);
    try {
      await submitKYCApplication(application.id, {
        documents,
        moreInfoRequestedNotes: reUploadNotes || application.moreInfoRequestedNotes
      });
      setSuccessToast(lang === 'sw' ? 'Nyaraka zilizorekebishwa zimewasilishwa kikamilifu!' : 'Revised documents submitted successfully!');
      setTimeout(() => {
        setSuccessToast(null);
        onRefreshStatus();
      }, 1500);
    } catch (err: any) {
      const mapped = mapFirebaseAuthError(err, application.applicantEmail);
      setErrorMessage(lang === 'sw' ? mapped.sw : mapped.en);
    } finally {
      setIsReSubmitting(false);
    }
  };

  const handleDataDeletion = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDeleting(true);
    try {
      await requestAccountDataDeletion(application.userId, application.applicantEmail, deleteReason);
      setSuccessToast(lang === 'sw' ? 'Ombi la kufuta data limewasilishwa kwa usalama.' : 'Data deletion request registered.');
      setIsDeleteModalOpen(false);
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err: any) {
      const mapped = mapFirebaseAuthError(err, application.applicantEmail);
      setErrorMessage(lang === 'sw' ? mapped.sw : mapped.en);
    } finally {
      setIsDeleting(false);
    }
  };

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
              {application.legalName || 'Shirika Lako'}
            </h2>
            <span className="text-[11px] text-emerald-400 font-semibold block">
              {lang === 'sw' ? 'Hali ya Maombi ya Usajili & KYC' : 'KYC Application Status & Compliance'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleLang}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-bold text-slate-300 flex items-center gap-1.5 transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span>{lang === 'sw' ? 'English' : 'Kiswahili'}</span>
          </button>
          <button
            onClick={onRefreshStatus}
            title="Refresh"
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={onLogout}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-rose-400 hover:text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-800"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{lang === 'sw' ? 'Ondoka (Logout)' : 'Logout'}</span>
          </button>
        </div>
      </div>

      {/* Main Status Container */}
      <div className="max-w-4xl w-full mx-auto my-8 flex-1 space-y-6">
        
        {/* Toast Notices */}
        {errorMessage && (
          <div className="p-4 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-xs text-rose-300 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successToast && (
          <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-xs text-emerald-300 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Status Card Hero */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
          
          {/* Status Banner */}
          {status === 'draft' && (
            <div className="p-5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-4">
              <Clock className="w-8 h-8 text-amber-400 shrink-0 mt-1" />
              <div className="space-y-1">
                <h3 className="text-base font-black text-amber-300">
                  {lang === 'sw' ? 'Maombi Yako Yapo Kwenye Hatua ya Rasimu (Draft)' : 'Application is currently in Draft'}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {lang === 'sw'
                    ? 'Bado haujakamilisha kujaza taarifa au kupakia nyaraka zote za usajili. Bonyeza kitufe hapa chini ili kuendelea kutoka ulipoishia.'
                    : 'You have not yet submitted your application. Click the button below to resume where you left off.'}
                </p>
                <div className="pt-2">
                  <button
                    onClick={onResumeDraft}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-md"
                  >
                    <span>{lang === 'sw' ? 'Endelea na Usajili (Resume Registration)' : 'Resume Registration'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {(status === 'submitted' || status === 'under_review') && (
            <div className="p-5 bg-blue-500/10 border border-blue-500/30 rounded-2xl flex items-start gap-4">
              <Clock className="w-8 h-8 text-blue-400 shrink-0 mt-1 animate-pulse" />
              <div className="space-y-1">
                <h3 className="text-base font-black text-blue-300">
                  {status === 'under_review'
                    ? (lang === 'sw' ? 'Nyaraka Zako Zinafanyiwa Ukaguzi (Under Active Review)' : 'Under Active Compliance Review')
                    : (lang === 'sw' ? 'Maombi Yamepokelewa & Yapo Kwenye Foleni (Submitted)' : 'Application Submitted & In Queue')}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {lang === 'sw'
                    ? 'Timu ya usalama na uhakiki wa kisheria ya KaziDesk inakagua nakala za TIN, BRELA na vitambulisho vyako. Ukaguzi huu huchukua wastani wa saa 2 hadi 24 za kazi.'
                    : 'The KaziDesk compliance desk is verifying your tax IDs, BRELA documents, and identification. Verification takes between 2 to 24 business hours.'}
                </p>
                <div className="text-[11px] text-blue-400/90 font-mono pt-1">
                  Kumbukumbu ya Maombi: <strong>{application.id}</strong>
                </div>
              </div>
            </div>
          )}

          {status === 'more_info_required' && (
            <div className="p-5 bg-amber-500/15 border border-amber-500/40 rounded-2xl space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-8 h-8 text-amber-400 shrink-0 mt-1" />
                <div className="space-y-1">
                  <h3 className="text-base font-black text-amber-300">
                    {lang === 'sw' ? 'Taarifa au Nyaraka Zaidi Zinahitajika (Action Required)' : 'More Information Required'}
                  </h3>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    {lang === 'sw'
                      ? 'Mkaguzi wa KaziDesk ameomba ufafanuzi au nakala mpya ya baadhi ya nyaraka zako. Tafadhali soma maelekezo hapa chini na pakia tena faili zilizotajwa pekee.'
                      : 'The reviewer has requested clarification or clearer copies of certain documents. Review the notes below and re-upload only the requested items.'}
                  </p>
                </div>
              </div>

              {application.ownerReviewNotes && (
                <div className="p-3 bg-slate-900 rounded-xl border border-amber-500/30 text-xs space-y-1">
                  <span className="font-bold text-amber-400 block uppercase text-[10px]">
                    {lang === 'sw' ? 'Ujumbe kutoka kwa Mkaguzi:' : 'Reviewer Directive:'}
                  </span>
                  <p className="text-slate-300 italic">{application.ownerReviewNotes}</p>
                </div>
              )}
            </div>
          )}

          {status === 'approved' && (
            <div className="p-5 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl flex items-start gap-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0 mt-1" />
              <div className="space-y-1">
                <h3 className="text-base font-black text-emerald-300">
                  {lang === 'sw' ? 'Hongera! Shirika Lako Limeidhinishwa Kikamilifu' : 'Congratulations! Your Organization is Approved'}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {lang === 'sw'
                    ? 'Nyaraka zako zote za kisheria na usajili zimehakikiwa. Ofisi yako ya KaziDesk imeundwa na jaribio lako la bure la siku 14 limeanza rasmi.'
                    : 'All submitted legal documents have been verified. Your KaziDesk workspace has been provisioned and your 14-day free trial is active.'}
                </p>
                <div className="pt-2">
                  <button
                    onClick={onEnterWorkspace}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
                  >
                    <span>{lang === 'sw' ? 'Ingia Kwenye Ofisi Yako ya KaziDesk Sasa' : 'Enter Your KaziDesk Workspace Now'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {status === 'rejected' && (
            <div className="p-5 bg-rose-500/15 border border-rose-500/30 rounded-2xl flex items-start gap-4">
              <XCircle className="w-8 h-8 text-rose-400 shrink-0 mt-1" />
              <div className="space-y-1">
                <h3 className="text-base font-black text-rose-300">
                  {lang === 'sw' ? 'Maombi Yamekataliwa (Application Rejected)' : 'Application Rejected'}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {lang === 'sw'
                    ? 'Maombi ya usajili hayakukidhi vigezo vya uhalali wa kisheria au nyaraka zilizowekwa hazikuthibitishwa.'
                    : 'The application did not satisfy compliance verification standards.'}
                </p>
                {application.rejectionReason && (
                  <div className="p-3 bg-slate-900 rounded-xl border border-rose-500/30 text-xs mt-2">
                    <span className="font-bold text-rose-400 block uppercase text-[10px]">
                      {lang === 'sw' ? 'Sababu ya Kukataliwa:' : 'Rejection Reason:'}
                    </span>
                    <p className="text-slate-300">{application.rejectionReason}</p>
                  </div>
                )}
                <p className="text-[11px] text-slate-400 pt-2">
                  {lang === 'sw'
                    ? 'Wasiliana na dawati la msaada: support@kazidesk.co.tz kwa maelezo zaidi.'
                    : 'Contact support desk at support@kazidesk.co.tz for inquiries.'}
                </p>
              </div>
            </div>
          )}

          {/* Re-Upload Form (Only when status is more_info_required) */}
          {status === 'more_info_required' && (
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <h4 className="text-sm font-bold text-white">
                {lang === 'sw' ? 'Nyaraka Zinazohitaji Marekebisho / Kupakiwa Tena:' : 'Documents Requiring Re-upload:'}
              </h4>

              <div className="space-y-3">
                {documents.map(doc => {
                  const needsAttention = doc.reviewStatus === 'not_clear' || doc.reviewStatus === 'rejected';
                  return (
                    <div
                      key={doc.id}
                      className={`p-4 rounded-2xl border ${
                        needsAttention
                          ? 'border-amber-500/60 bg-amber-500/10'
                          : 'border-slate-800 bg-slate-800/40'
                      } flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{doc.name}</span>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
                            doc.reviewStatus === 'verified'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : doc.reviewStatus === 'not_clear'
                              ? 'bg-amber-500/20 text-amber-400'
                              : doc.reviewStatus === 'rejected'
                              ? 'bg-rose-500/20 text-rose-400'
                              : 'bg-slate-700 text-slate-300'
                          }`}>
                            {doc.reviewStatus}
                          </span>
                        </div>
                        {doc.reviewComment && (
                          <p className="text-[11px] text-amber-300 font-medium">
                            {lang === 'sw' ? 'Maoni:' : 'Note:'} {doc.reviewComment}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setPreviewDoc({ title: doc.name, fileUrl: doc.fileUrl, fileType: doc.fileType })}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{lang === 'sw' ? 'Tazama' : 'View'}</span>
                        </button>

                        <label className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md">
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>
                            {uploadingDocType === doc.documentType
                              ? (lang === 'sw' ? 'Inapakia...' : 'Uploading...')
                              : (lang === 'sw' ? 'Pakia Upya' : 'Re-upload')}
                          </span>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            className="hidden"
                            onChange={e => {
                              const f = e.target.files?.[0];
                              if (f) handleReUpload(doc.documentType, f, doc.name);
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Clarification notes */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {lang === 'sw' ? 'Ufafanuzi wa Ziada kwa Mkaguzi (Hiari):' : 'Additional Clarification to Reviewer:'}
                </label>
                <textarea
                  value={reUploadNotes}
                  onChange={e => setReUploadNotes(e.target.value)}
                  rows={2}
                  placeholder={lang === 'sw' ? 'Mf. Nimepakia nakala mpya na wazi ya cheti cha TIN...' : 'e.g. Uploaded high-resolution scan of TIN certificate...'}
                  className="w-full px-3 py-2 bg-slate-800 rounded-xl border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleReSubmit}
                  disabled={isReSubmitting}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {isReSubmitting
                      ? (lang === 'sw' ? 'Inawasilisha Upya...' : 'Re-submitting...')
                      : (lang === 'sw' ? 'Wasilisha Nyaraka Zilizorekebishwa (Submit Revisions)' : 'Submit Revisions for Review')}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Application Details Readout */}
          <div className="border-t border-slate-800 pt-5 space-y-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              {lang === 'sw' ? 'Taarifa za Maombi Yako:' : 'Submitted Dossier Overview:'}
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block">{lang === 'sw' ? 'Aina ya Taasisi' : 'Entity Type'}</span>
                <span className="font-bold text-white capitalize">{application.businessType.replace('_', ' ')}</span>
              </div>

              <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block">{lang === 'sw' ? 'Mpango Uliochaguliwa' : 'Selected Plan'}</span>
                <span className="font-bold text-emerald-400 uppercase">{application.preferredPlanId}</span>
              </div>

              <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block">{lang === 'sw' ? 'Eneo la Ofisi' : 'Location'}</span>
                <span className="font-bold text-white truncate block">{application.region}, {application.district}</span>
              </div>

              <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block">{lang === 'sw' ? 'Tarehe ya Maombi' : 'Submitted Date'}</span>
                <span className="font-bold text-white font-mono">{application.submittedAt?.split('T')[0] || application.createdAt.split('T')[0]}</span>
              </div>
            </div>
          </div>

          {/* Privacy & Account Deletion Option */}
          <div className="border-t border-slate-800 pt-4 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{lang === 'sw' ? 'Data zako zinalindwa chini ya Sheria ya Ulinzi wa Taarifa Binafsi' : 'Protected under Personal Data Protection Act'}</span>
            </div>

            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="text-slate-400 hover:text-rose-400 underline text-[11px]"
            >
              {lang === 'sw' ? 'Omba Kufuta Data & Akaunti' : 'Request Account Deletion'}
            </button>
          </div>

        </div>

      </div>

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

      {/* Delete Request Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl text-white space-y-4">
            <h3 className="text-base font-black text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              <span>{lang === 'sw' ? 'Omba Kufuta Akaunti & Taarifa za KYC' : 'Request Personal Data Deletion'}</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {lang === 'sw'
                ? 'Kulingana na Sheria ya Ulinzi wa Taarifa Binafsi ya mwaka 2022, unayo haki ya kuomba kufutwa kabisa kwa taarifa na nyaraka zako za KYC. Tafadhali eleza sababu yako:'
                : 'Under Personal Data Protection legislation, you have the right to request deletion of your submitted KYC records. Please provide your reason:'}
            </p>

            <form onSubmit={handleDataDeletion} className="space-y-4 text-xs">
              <textarea
                value={deleteReason}
                onChange={e => setDeleteReason(e.target.value)}
                required
                rows={3}
                placeholder={lang === 'sw' ? 'Sababu ya kufuta akaunti...' : 'Reason for deletion request...'}
                className="w-full px-3 py-2 bg-slate-800 rounded-xl border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold"
                >
                  {lang === 'sw' ? 'Ghairi' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isDeleting}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold disabled:opacity-50"
                >
                  {isDeleting ? (lang === 'sw' ? 'Inawasilisha...' : 'Submitting...') : (lang === 'sw' ? 'Thibitisha Ombi' : 'Confirm Request')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
