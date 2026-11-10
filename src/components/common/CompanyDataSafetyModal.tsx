/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  DownloadCloud,
  UploadCloud,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  X,
  FileCheck,
  RefreshCw
} from 'lucide-react';
import { Company } from '../../types/saas';
import { exportTenantBackup, restoreTenantBackup, deleteCompanyAndAllData } from '../../services/companyDataService';

interface CompanyDataSafetyModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: Company;
  onDataRestored?: () => void;
  onCompanyDeleted?: () => void;
}

export const CompanyDataSafetyModal: React.FC<CompanyDataSafetyModalProps> = ({
  isOpen,
  onClose,
  company,
  onDataRestored,
  onCompanyDeleted,
}) => {
  const [activeTab, setActiveTab] = useState<'backup' | 'restore' | 'delete'>('backup');
  const [restoreStatus, setRestoreStatus] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsRestoring(true);
    setRestoreStatus(null);
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const res = await restoreTenantBackup(company.id, content);
        setRestoreStatus(res.message);
        if (res.success && onDataRestored) {
          onDataRestored();
        }
      } catch (err: any) {
        setRestoreStatus('Hitilafu ya kusoma faili la backup: ' + (err.message || ''));
      } finally {
        setIsRestoring(false);
      }
    };

    reader.readAsText(file);
  };

  const handleDeleteCompany = async () => {
    if (deleteConfirmInput.trim() !== company.name.trim()) return;
    setIsDeleting(true);
    try {
      await deleteCompanyAndAllData(company.id, company.name);
      if (onCompanyDeleted) {
        onCompanyDeleted();
      }
      onClose();
    } catch (e) {
      console.error('Delete error:', e);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100 flex flex-col my-6">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <DownloadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Usalama wa Data & Backup
              </h3>
              <span className="text-xs text-slate-500">
                {company.name} · Tenant ID: {company.id}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 pt-2 gap-2 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            onClick={() => setActiveTab('backup')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'backup'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <DownloadCloud className="w-3.5 h-3.5" />
            <span>Pakua Backup</span>
          </button>

          <button
            onClick={() => setActiveTab('restore')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'restore'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Rejesha Data (Restore)</span>
          </button>

          <button
            onClick={() => setActiveTab('delete')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'delete'
                ? 'border-rose-500 text-rose-600 dark:text-rose-400'
                : 'border-transparent text-slate-500 hover:text-rose-600'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Futa Akaunti & Data</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-4 text-xs">
          
          {/* TAB 1: EXPORT BACKUP */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <strong className="text-slate-900 dark:text-white block font-bold">
                    Nakala Kamili ya Data za Kampuni (100% Export)
                  </strong>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                    Unapobonyeza kitufe hapa chini, KaziDesk itakusanya orodha ya wafanyakazi, mahudhurio, kazi, ankara, stoo, na nyaraka zote za {company.name} na kuzipakua kwenye faili la kiusalama la JSON kwenye kifaa chako.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => exportTenantBackup(company.id, company.name)}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center gap-2 shadow-md transition-all active:scale-95"
                >
                  <DownloadCloud className="w-4 h-4" />
                  <span>Pakua Faili la Backup (JSON)</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: RESTORE BACKUP */}
          {activeTab === 'restore' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-2xl flex items-start gap-3">
                <UploadCloud className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <strong className="text-slate-900 dark:text-white block font-bold">
                    Rejesha Data Kutoka Kwenye Faili la Backup
                  </strong>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                    Chagua faili la JSON lililopakuliwa hapo awali. Mfumo utakagua utambulisho wa kampuni (companyId) kuhakikisha usalama wa data na kurejesha taarifa zako zote.
                  </p>
                </div>
              </div>

              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center space-y-2 hover:border-emerald-500 transition-colors">
                <UploadCloud className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="font-bold text-slate-700 dark:text-slate-300">
                  Pakia faili la JSON hapa
                </p>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  disabled={isRestoring}
                  className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-500 cursor-pointer"
                />
              </div>

              {isRestoring && (
                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-center flex items-center justify-center gap-2 text-slate-600 dark:text-slate-300">
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" />
                  <span>Inarejesha data kwenye Firestore...</span>
                </div>
              )}

              {restoreStatus && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 font-medium">
                  {restoreStatus}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DELETE COMPANY DATA */}
          {activeTab === 'delete' && (
            <div className="space-y-4">
              <div className="p-4 bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-2xl flex items-start gap-3 text-rose-900 dark:text-rose-200">
                <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0" />
                <div className="space-y-1">
                  <strong className="block font-black text-sm">
                    Tahadhari: Kufuta Akaunti na Data Zote za Kampuni
                  </strong>
                  <p className="text-[11px] text-rose-800 dark:text-rose-300 leading-relaxed">
                    Kitendo hiki hakiwezi kubatilishwa. Wafanyakazi wote, ankara, nukuu, stoo, mishahara, na kumbukumbu zote zitafutwa kabisa kutoka kwenye mfumo.
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <label className="block font-bold text-slate-700 dark:text-slate-300 text-xs">
                  Ili kuthibitisha, andika jina kamili la kampuni: <code className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-mono text-rose-600">{company.name}</code>
                </label>
                <input
                  type="text"
                  value={deleteConfirmInput}
                  onChange={e => setDeleteConfirmInput(e.target.value)}
                  placeholder="Andika jina la kampuni hapa kuthibitisha"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-rose-300 dark:border-rose-900 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleDeleteCompany}
                  disabled={deleteConfirmInput.trim() !== company.name.trim() || isDeleting}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white font-black rounded-xl flex items-center gap-2 shadow-md transition-all active:scale-95"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isDeleting ? 'Inafuta...' : 'Futa Kampuni na Data Zote Mara Moja'}</span>
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
