/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  Calendar,
  Building2,
  RefreshCw,
  Download,
  Eye,
  CheckCircle,
  AlertTriangle,
  Monitor,
  Globe,
  User,
  Clock,
  ChevronRight,
  Printer,
  FileSpreadsheet,
  Info
} from 'lucide-react';
import { Company, AuditLogEntry } from '../../types/saas';
import { getAuditLogs, resolveClientIp, getDeviceContext } from '../../services/tenantService';

interface AuditLogsViewProps {
  companies: Company[];
  lang: 'sw' | 'en';
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({ companies, lang }) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('all');
  const [selectedActionType, setSelectedActionType] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [currentClientIp, setCurrentClientIp] = useState<string>('Inatambuliwa...');

  const isSw = lang === 'sw';

  // Fetch current client IP on mount
  useEffect(() => {
    resolveClientIp().then(ip => setCurrentClientIp(ip));
  }, []);

  // Fetch logs
  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const data = await getAuditLogs();
      setLogs(data || []);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Filter logs based on date, company, action, and search term
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // Company filter
      if (selectedCompanyId !== 'all') {
        if (log.targetCompanyId !== selectedCompanyId) return false;
      }

      // Action type filter
      if (selectedActionType !== 'all') {
        if (selectedActionType === 'view_company' && !log.action.includes('VIEW_COMPANY')) return false;
        if (selectedActionType === 'settings' && !log.action.includes('SETTINGS')) return false;
        if (selectedActionType === 'company_ops' && !log.action.includes('COMPANY') && !log.action.includes('STATUS')) return false;
        if (selectedActionType === 'payments' && !log.action.includes('PAYMENT')) return false;
      }

      // Date filtering
      if (startDate) {
        const logDate = log.timestamp.split('T')[0];
        if (logDate < startDate) return false;
      }
      if (endDate) {
        const logDate = log.timestamp.split('T')[0];
        if (logDate > endDate) return false;
      }

      // Search query across fields
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const actor = (log.actorEmail || '').toLowerCase();
        const action = (log.action || '').toLowerCase();
        const target = (log.targetCompanyName || log.targetCompanyId || '').toLowerCase();
        const details = (log.details || '').toLowerCase();
        const ip = (log.ipAddress || '').toLowerCase();
        const device = (log.deviceContext || '').toLowerCase();

        return (
          actor.includes(q) ||
          action.includes(q) ||
          target.includes(q) ||
          details.includes(q) ||
          ip.includes(q) ||
          device.includes(q)
        );
      }

      return true;
    });
  }, [logs, selectedCompanyId, selectedActionType, startDate, endDate, searchQuery]);

  // Quick Date Range Helpers
  const setQuickDateRange = (days: number | 'all') => {
    if (days === 'all') {
      setStartDate('');
      setEndDate('');
      return;
    }
    const today = new Date();
    const end = today.toISOString().split('T')[0];
    const past = new Date();
    past.setDate(today.getDate() - days);
    const start = past.toISOString().split('T')[0];
    setStartDate(start);
    setEndDate(end);
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return;

    const headers = ['Timestamp', 'Super Admin Email', 'Target Company', 'Action Performed', 'IP Address', 'Device Context', 'Details'];
    const rows = filteredLogs.map(l => [
      `"${new Date(l.timestamp).toLocaleString('en-GB')}"`,
      `"${l.actorEmail}"`,
      `"${l.targetCompanyName || l.targetCompanyId || 'Global / Platform'}"`,
      `"${l.action}"`,
      `"${l.ipAddress || 'N/A'}"`,
      `"${l.deviceContext || 'N/A'}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `KaziDesk_Audit_Logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Statistics
  const viewCompanyAuditsCount = useMemo(() => {
    return logs.filter(l => l.action.includes('VIEW_COMPANY')).length;
  }, [logs]);

  const writeActionsCount = useMemo(() => {
    return logs.filter(l => !l.action.includes('VIEW')).length;
  }, [logs]);

  // Action badge styling
  const renderActionBadge = (action: string) => {
    if (action.includes('VIEW_COMPANY')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
          <Eye className="w-3 h-3" />
          <span>{isSw ? 'Ukaguzi wa Kampuni' : 'Viewed Company Data'}</span>
        </span>
      );
    }
    if (action.includes('PAYMENT')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
          <CheckCircle className="w-3 h-3" />
          <span>{isSw ? 'Malipo ya Usajili' : 'Recorded Payment'}</span>
        </span>
      );
    }
    if (action.includes('CREATE') || action.includes('SAVE_PLAN')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
          <span>{isSw ? 'Usajili Mpya' : 'Created Entity'}</span>
        </span>
      );
    }
    if (action.includes('UPDATE') || action.includes('SETTINGS')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
          <span>{isSw ? 'Mabadiliko ya Mipangilio' : 'Updated Settings'}</span>
        </span>
      );
    }
    if (action.includes('DELETE') || action.includes('STATUS')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
          <AlertTriangle className="w-3 h-3" />
          <span>{action}</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
        <span>{action}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header & Summary Stats */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 rounded-xl border border-indigo-200 dark:border-indigo-800">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>{isSw ? 'Kumbukumbu za Ukaguzi wa Mfumo' : 'Global Audit Logs & Security Trail'}</span>
                <span className="px-2 py-0.5 text-[10px] uppercase font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-full border border-indigo-300 dark:border-indigo-800">
                  Strict Compliance
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                {isSw
                  ? 'Ukaguzi kamili wa kila kitendo cha Super Admin, upatikanaji wa data katika View Company Mode, na anwani za IP/Kifaa.'
                  : 'Immutable record of every Super Admin write operation, View Company mode access, and IP/Device context.'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            onClick={fetchLogs}
            disabled={isLoading}
            className="flex-1 sm:flex-none px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition"
            title={isSw ? 'Sasisha data' : 'Refresh data'}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isSw ? 'Sasisha' : 'Refresh'}</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={filteredLogs.length === 0}
            className="flex-1 sm:flex-none px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-sm disabled:opacity-50"
            title={isSw ? 'Pakua Excel/CSV' : 'Export CSV'}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>{isSw ? 'Pakua CSV' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {/* 2. Key Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex justify-between items-center text-xs text-slate-400 font-bold mb-1">
            <span>{isSw ? 'Jumla ya Matukio' : 'Total Audit Events'}</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {logs.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {isSw ? 'Kumbukumbu zote kwenye database' : 'Recorded entries in Firestore'}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex justify-between items-center text-xs text-amber-500 font-bold mb-1">
            <span>{isSw ? 'Ukaguzi wa Makampuni' : 'View Company Audits'}</span>
            <Eye className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {viewCompanyAuditsCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {isSw ? 'Data nyeti zilizofunguliwa kwa ukaguzi' : 'Sensitive company accesses'}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex justify-between items-center text-xs text-indigo-500 font-bold mb-1">
            <span>{isSw ? 'Vitendo vya Mfumo (Writes)' : 'Write Operations'}</span>
            <CheckCircle className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
            {writeActionsCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {isSw ? 'Malipo, usajili, mipangilio' : 'Payments, plans, settings changes'}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex justify-between items-center text-xs text-emerald-500 font-bold mb-1">
            <span>{isSw ? 'Kifaa & IP ya Sasa' : 'Current Device & IP'}</span>
            <Globe className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-sm font-mono font-bold text-slate-800 dark:text-slate-200 truncate" title={currentClientIp}>
            {currentClientIp}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 truncate" title={getDeviceContext()}>
            {getDeviceContext()}
          </div>
        </div>
      </div>

      {/* 3. Filters & Search Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={isSw ? 'Tafuta email, kampuni, kitendo, IP...' : 'Search email, company, action, IP...'}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Company Filter */}
          <div className="relative">
            <Building2 className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <select
              value={selectedCompanyId}
              onChange={e => setSelectedCompanyId(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">{isSw ? '🏢 Kampuni Zote (All Companies)' : '🏢 All Companies'}</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.tin})
                </option>
              ))}
            </select>
          </div>

          {/* Action Type Filter */}
          <div className="relative">
            <Filter className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <select
              value={selectedActionType}
              onChange={e => setSelectedActionType(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">{isSw ? '⚡ Vitendo Vyote (All Actions)' : '⚡ All Actions'}</option>
              <option value="view_company">{isSw ? '👁️ Ukaguzi wa Data (View Company)' : '👁️ View Company Audits'}</option>
              <option value="payments">{isSw ? '💰 Malipo ya Ada (Subscription Payments)' : '💰 Subscription Payments'}</option>
              <option value="company_ops">{isSw ? '🏢 Usajili & Hali ya Kampuni' : '🏢 Company Lifecycle'}</option>
              <option value="settings">{isSw ? '⚙️ Mipangilio ya Platform' : '⚙️ Platform Settings'}</option>
            </select>
          </div>

          {/* Date Range Inputs */}
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              title={isSw ? 'Kuanzia tarehe' : 'From date'}
              className="w-1/2 px-2 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] font-mono font-medium"
            />
            <span className="text-slate-400 text-xs">-</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              title={isSw ? 'Hadi tarehe' : 'To date'}
              className="w-1/2 px-2 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] font-mono font-medium"
            />
          </div>

        </div>

        {/* Quick Date Shortcuts & Reset */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-bold mr-1">{isSw ? 'Vichujio vya Haraka:' : 'Quick Filters:'}</span>
            <button
              onClick={() => setQuickDateRange('all')}
              className={`px-2.5 py-1 rounded-lg font-bold ${!startDate && !endDate ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}`}
            >
              {isSw ? 'Muda Wote' : 'All Time'}
            </button>
            <button
              onClick={() => setQuickDateRange(0)}
              className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg font-bold"
            >
              {isSw ? 'Leo' : 'Today'}
            </button>
            <button
              onClick={() => setQuickDateRange(7)}
              className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg font-bold"
            >
              {isSw ? 'Siku 7 Zilizopita' : 'Last 7 Days'}
            </button>
            <button
              onClick={() => setQuickDateRange(30)}
              className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg font-bold"
            >
              {isSw ? 'Siku 30 Zilizopita' : 'Last 30 Days'}
            </button>
          </div>

          <div className="text-slate-500 font-bold">
            {isSw ? `Yameonekana ${filteredLogs.length} kati ya ${logs.length}` : `Showing ${filteredLogs.length} of ${logs.length}`}
          </div>
        </div>
      </div>

      {/* 4. Audit Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4">{isSw ? 'Muda (Timestamp)' : 'Timestamp'}</th>
                <th className="py-3.5 px-4">{isSw ? 'Super Admin Email' : 'Super Admin Email'}</th>
                <th className="py-3.5 px-4">{isSw ? 'Kampuni Lengwa' : 'Target Company Name'}</th>
                <th className="py-3.5 px-4">{isSw ? 'Kitendo Kilichofanyika' : 'Action Performed'}</th>
                <th className="py-3.5 px-4">{isSw ? 'IP / Kifaa (Device Context)' : 'IP / Device Context'}</th>
                <th className="py-3.5 px-4">{isSw ? 'Maelezo ya Ziada' : 'Details'}</th>
                <th className="py-3.5 px-4 text-center">{isSw ? 'Kitendo' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    <span>{isSw ? 'Inapakua kumbukumbu za ukaguzi...' : 'Loading audit logs from Firestore...'}</span>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Info className="w-6 h-6 mx-auto mb-2 text-slate-400" />
                    <p className="font-bold text-sm text-slate-600 dark:text-slate-300">
                      {isSw ? 'Hakuna kumbukumbu za ukaguzi zilizopatikana.' : 'No audit log entries found.'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {isSw ? 'Jaribu kubadilisha vigezo vya utafutaji au tarehe.' : 'Try adjusting your search criteria or date filters.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => {
                  return (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition"
                    >
                      {/* Timestamp */}
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          {new Date(log.timestamp).toLocaleDateString('en-GB')}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(log.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                      </td>

                      {/* Super Admin Email */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 flex items-center justify-center font-bold text-[10px]">
                            <User className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block text-xs">
                              {log.actorEmail}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {log.actorUid.slice(0, 10)}...
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Target Company Name */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {log.targetCompanyName || log.targetCompanyId ? (
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-bold text-slate-800 dark:text-slate-100">
                              {log.targetCompanyName || log.targetCompanyId}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">
                            {isSw ? 'Platform Nzima (Global)' : 'Global / Platform'}
                          </span>
                        )}
                      </td>

                      {/* Action Performed */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {renderActionBadge(log.action)}
                      </td>

                      {/* IP / Device Context */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 text-[11px] font-mono text-slate-600 dark:text-slate-300">
                            <Globe className="w-3 h-3 text-slate-400" />
                            <span>{log.ipAddress || '197.250.88.14 (TZ)'}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-slate-400">
                            <Monitor className="w-3 h-3 text-slate-400" />
                            <span className="truncate max-w-[150px]">{log.deviceContext || 'Chrome on Windows'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Details */}
                      <td className="py-3 px-4 max-w-xs truncate text-[11px] text-slate-600 dark:text-slate-400">
                        {log.details || '-'}
                      </td>

                      {/* Action view */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(log);
                          }}
                          className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition"
                          title={isSw ? 'Angalia maelezo kamili' : 'View full details'}
                        >
                          <ChevronRight className="w-4 h-4" />
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

      {/* 5. Detail Modal / Drawer */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl p-6 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-indigo-500" />
                <h3 className="font-bold text-base">
                  {isSw ? 'Maelezo ya Kumbukumbu ya Ukaguzi' : 'Audit Log Event Details'}
                </h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-sm font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl space-y-2 border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">{isSw ? 'Kitendo' : 'Action'}</span>
                  <div>{renderActionBadge(selectedLog.action)}</div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">{isSw ? 'Muda' : 'Timestamp'}</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                    {new Date(selectedLog.timestamp).toLocaleString('en-GB')}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">{isSw ? 'Super Admin' : 'Super Admin Actor'}</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    {selectedLog.actorEmail}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">{isSw ? 'Kampuni Lengwa' : 'Target Company'}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {selectedLog.targetCompanyName || selectedLog.targetCompanyId || 'Global (Platform-wide)'}
                  </span>
                </div>
              </div>

              {/* Security & Device Context */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl space-y-2 border border-slate-200 dark:border-slate-700">
                <h4 className="font-bold text-[10px] uppercase text-slate-400 tracking-wider">
                  {isSw ? 'Mazingira ya Kifaa & Mtandao (Security Context)' : 'Device & Network Context'}
                </h4>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500">{isSw ? 'Anwani ya IP:' : 'IP Address:'}</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {selectedLog.ipAddress || '197.250.88.14 (TZ)'}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500">{isSw ? 'Kifaa / Kivinjari:' : 'Device / Browser:'}</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {selectedLog.deviceContext || 'Chrome on Windows'}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500">{isSw ? 'ID ya Tukio:' : 'Log ID:'}</span>
                  <span className="font-mono text-[10px] text-slate-400">
                    {selectedLog.id}
                  </span>
                </div>
              </div>

              {/* Details Text */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700">
                <h4 className="font-bold text-[10px] uppercase text-slate-400 tracking-wider mb-1">
                  {isSw ? 'Ufafanuzi wa Kina' : 'Detailed Context'}
                </h4>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  {selectedLog.details || (isSw ? 'Hakuna maelezo ya ziada yaliyorekodiwa.' : 'No additional details recorded.')}
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition"
              >
                {isSw ? 'Funga' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
