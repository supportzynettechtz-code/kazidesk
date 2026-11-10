import React, { useState } from 'react';
import { 
  TrendingUp, 
  Target, 
  FileText, 
  Users, 
  Plus, 
  DollarSign, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Search, 
  Filter, 
  Phone, 
  Mail, 
  Building2, 
  Award, 
  ChevronRight,
  Send,
  MessageSquare,
  BarChart3,
  Percent,
  Briefcase
} from 'lucide-react';
import { SalesLead, SalesKPI, SalesReport, Employee } from '../../types/office';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface SalesMarketingViewProps {
  lang: 'sw' | 'en';
  currency: 'TZS' | 'USD';
  leads: SalesLead[];
  kpis: SalesKPI[];
  reports: SalesReport[];
  employees: Employee[];
  onAddLead: (lead: Omit<SalesLead, 'id'>) => void;
  onUpdateLeadStatus: (leadId: string, status: SalesLead['status']) => void;
  onAddKPI: (kpi: Omit<SalesKPI, 'id'>) => void;
  onAddReport: (report: Omit<SalesReport, 'id'>) => void;
  onReviewReport: (reportId: string, feedback: string) => void;
}

export const SalesMarketingView: React.FC<SalesMarketingViewProps> = ({
  lang,
  currency,
  leads,
  kpis,
  reports,
  employees,
  onAddLead,
  onUpdateLeadStatus,
  onAddKPI,
  onAddReport,
  onReviewReport,
}) => {
  const [activeTab, setActiveTab] = useState<'leads' | 'kpis' | 'reports'>('leads');
  const [leadStatusFilter, setLeadStatusFilter] = useState<string>('all');
  const [searchLead, setSearchLead] = useState('');

  // Modals
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const [isAddKPIModalOpen, setIsAddKPIModalOpen] = useState(false);
  const [isAddReportModalOpen, setIsAddReportModalOpen] = useState(false);
  const [selectedReportForReview, setSelectedReportForReview] = useState<SalesReport | null>(null);
  const [reviewFeedback, setReviewFeedback] = useState('');

  // Filter Sales staff
  const salesEmployees = employees.filter(e => 
    e.department === 'Masoko & Mauzo' || 
    e.roleTitle.toLowerCase().includes('mauzo') || 
    e.roleTitle.toLowerCase().includes('sales') ||
    e.roleTitle.toLowerCase().includes('masoko') ||
    e.roleTitle.toLowerCase().includes('marketing')
  );

  // New Lead Form State
  const [newClientName, setNewClientName] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEstimatedValue, setNewEstimatedValue] = useState('');
  const [newAssignedToId, setNewAssignedToId] = useState(salesEmployees[0]?.id || employees[0]?.id || '');
  const [newSource, setNewSource] = useState<'Tovuti' | 'Mtandao wa Kijamii' | 'Rufaa ya Mteja' | 'Simu ya Moja kwa Moja' | 'Tukio la Kibiashara'>('Rufaa ya Mteja');
  const [newNotes, setNewNotes] = useState('');

  // New KPI Form State (Assigned by HOD)
  const [kpiEmployeeId, setKpiEmployeeId] = useState(salesEmployees[0]?.id || employees[0]?.id || '');
  const [kpiPeriod, setKpiPeriod] = useState(`Machi ${new Date().getFullYear()}`);
  const [kpiRevenueTarget, setKpiRevenueTarget] = useState('25000000');
  const [kpiDealsTarget, setKpiDealsTarget] = useState('5');
  const [kpiCallsTarget, setKpiCallsTarget] = useState('40');
  const [kpiNotes, setKpiNotes] = useState('');

  // New Sales Report Form State
  const [reportEmployeeId, setReportEmployeeId] = useState(salesEmployees[0]?.id || employees[0]?.id || '');
  const [reportPeriod, setReportPeriod] = useState('Wiki ya 1 - Machi 2026');
  const [reportRevenueGenerated, setReportRevenueGenerated] = useState('');
  const [reportDealsWon, setReportDealsWon] = useState('1');
  const [reportCallsMeetings, setReportCallsMeetings] = useState('12');
  const [reportKeyAchievements, setReportKeyAchievements] = useState('');
  const [reportChallenges, setReportChallenges] = useState('');
  const [reportNextWeekPlan, setReportNextWeekPlan] = useState('');

  // Computations
  const totalPipelineValue = leads.reduce((sum, l) => sum + (l.estimatedValue || l.dealValue || 0), 0);
  const wonLeads = leads.filter(l => l.status === 'Closed Won' || l.stage === 'closed_won');
  const totalWonRevenue = wonLeads.reduce((sum, l) => sum + (l.estimatedValue || l.dealValue || 0), 0);
  const conversionRate = leads.length > 0 ? Math.round((wonLeads.length / leads.length) * 100) : 0;

  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName || !newEstimatedValue) return;

    const assignedEmp = employees.find(e => e.id === newAssignedToId);

    onAddLead({
      clientName: newClientName,
      company: newCompany || 'Binafsi',
      email: newEmail || 'mteja@kazidesk.co.tz',
      phone: newPhone || '+255 700 000 000',
      estimatedValue: parseFloat(newEstimatedValue) || 0,
      status: 'New',
      assignedToId: newAssignedToId,
      assignedToName: assignedEmp ? assignedEmp.fullName : 'Mwakilishi wa Mauzo',
      source: newSource,
      createdDate: new Date().toISOString().split('T')[0],
      closingDateEstimate: `${new Date().getFullYear()}-12-31`,
      notes: newNotes,
    });

    setIsAddLeadModalOpen(false);
    setNewClientName('');
    setNewCompany('');
    setNewEstimatedValue('');
    setNewNotes('');
  };

  const handleCreateKPI = (e: React.FormEvent) => {
    e.preventDefault();
    const assignedEmp = employees.find(e => e.id === kpiEmployeeId);
    if (!assignedEmp) return;

    onAddKPI({
      employeeId: kpiEmployeeId,
      employeeName: assignedEmp.fullName,
      assignedBy: 'Mkuu wa Idara (Sales HOD)',
      period: kpiPeriod,
      targetRevenue: parseFloat(kpiRevenueTarget) || 0,
      achievedRevenue: 0,
      targetDealsClosed: parseInt(kpiDealsTarget, 10) || 0,
      achievedDealsClosed: 0,
      targetCallsOrMeetings: parseInt(kpiCallsTarget, 10) || 0,
      achievedCallsOrMeetings: 0,
      status: 'In Progress',
      notes: kpiNotes || 'Malengo rasmi ya mauzo yaliyowekwa na Idara.',
    });

    setIsAddKPIModalOpen(false);
    setKpiNotes('');
  };

  const handleCreateReport = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find(e => e.id === reportEmployeeId);
    if (!emp) return;

    onAddReport({
      employeeId: reportEmployeeId,
      employeeName: emp.fullName,
      period: reportPeriod,
      submittedDate: new Date().toISOString().split('T')[0],
      dealsWonCount: parseInt(reportDealsWon, 10) || 0,
      revenueGenerated: parseFloat(reportRevenueGenerated) || 0,
      callsOrMeetingsDone: parseInt(reportCallsMeetings, 10) || 0,
      keyAchievements: reportKeyAchievements,
      challengesFaced: reportChallenges,
      nextWeekPlan: reportNextWeekPlan,
      status: 'Submitted',
    });

    setIsAddReportModalOpen(false);
    setReportRevenueGenerated('');
    setReportKeyAchievements('');
    setReportChallenges('');
    setReportNextWeekPlan('');
  };

  const filteredLeads = leads.filter(lead => {
    const leadStatus = lead.status || (lead.stage === 'closed_won' ? 'Closed Won' : lead.stage === 'closed_lost' ? 'Closed Lost' : 'New');
    const leadCompany = lead.company || lead.companyName || '';
    const matchesFilter = leadStatusFilter === 'all' || leadStatus === leadStatusFilter;
    const matchesSearch = 
      lead.clientName.toLowerCase().includes(searchLead.toLowerCase()) ||
      leadCompany.toLowerCase().includes(searchLead.toLowerCase()) ||
      lead.assignedToName.toLowerCase().includes(searchLead.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-emerald-600" />
            <span>Masoko, Mauzo & Usimamizi wa KPI</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Mrejesho wa wateja watarajiwa (Leads), mikakati ya mauzo, na ugawaji wa KPI kwa maafisa wa idara.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {activeTab === 'leads' && (
            <button
              onClick={() => setIsAddLeadModalOpen(true)}
              className="px-3.5 py-2 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Ongeza Mteja Mtarajiwa (Lead)</span>
            </button>
          )}

          {activeTab === 'kpis' && (
            <button
              onClick={() => setIsAddKPIModalOpen(true)}
              className="px-3.5 py-2 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Target className="w-4 h-4" />
              <span>Gawa KPI Mpya (HOD)</span>
            </button>
          )}

          {activeTab === 'reports' && (
            <button
              onClick={() => setIsAddReportModalOpen(true)}
              className="px-3.5 py-2 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4" />
              <span>Wasilisha Ripoti ya Mauzo</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Metric Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Thamani ya Miradi (Pipeline)</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
            {formatCurrency(totalPipelineValue, currency)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Jumla ya maombi {leads.length}</div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Mauzo Yaliyofanikiwa</span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-600">
            {formatCurrency(totalWonRevenue, currency)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">{wonLeads.length} mikataba iliyosainiwa</div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Kiwango cha Ushindi</span>
            <Percent className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-bold font-mono text-blue-600">
            {conversionRate}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Conversion ya wateja</div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Wafanyakazi wa Mauzo</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
            {salesEmployees.length || employees.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Maafisa waliosajiliwa idarani</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex items-center gap-4">
        <button
          onClick={() => setActiveTab('leads')}
          className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'leads'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Wateja Watarajiwa & Pipeline ({leads.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('kpis')}
          className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'kpis'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>Malengo ya KPI (HOD & Staff) ({kpis.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'reports'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Ripoti za Mauzo & Maoni ({reports.length})</span>
        </button>
      </div>

      {/* TAB 1: LEADS & PIPELINE */}
      {activeTab === 'leads' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <div className="relative flex-1 w-full sm:max-w-md">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tafuta mteja, kampuni, au mwakilishi..."
                value={searchLead}
                onChange={e => setSearchLead(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={leadStatusFilter}
                onChange={e => setLeadStatusFilter(e.target.value)}
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="all">Hatua Zote</option>
                <option value="New">Mpya (New)</option>
                <option value="Contacted">Wamewasiliana (Contacted)</option>
                <option value="Proposal">Ofa Imetumwa (Proposal)</option>
                <option value="Negotiation">Majadiliano (Negotiation)</option>
                <option value="Closed Won">Tumefanikiwa (Closed Won)</option>
                <option value="Closed Lost">Haikufanikiwa (Closed Lost)</option>
              </select>
            </div>
          </div>

          {/* Leads Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase text-[11px]">
                    <th className="py-3 px-4">Mteja / Kampuni</th>
                    <th className="py-3 px-4">Chanzo</th>
                    <th className="py-3 px-4 font-mono">Thamani Inayotarajiwa</th>
                    <th className="py-3 px-4">Mwakilishi (Assigned)</th>
                    <th className="py-3 px-4">Hatua ya Mteja (Status)</th>
                    <th className="py-3 px-4 text-right">Badilisha Hatua</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {filteredLeads.map(lead => {
                    const statusStr = lead.status || (lead.stage === 'closed_won' ? 'Closed Won' : lead.stage === 'closed_lost' ? 'Closed Lost' : 'New');
                    const companyStr = lead.company || lead.companyName || 'Binafsi';
                    const valueNum = lead.estimatedValue || lead.dealValue || 0;
                    const dateStr = lead.createdDate || lead.lastContactDate || '2026-11-01';

                    return (
                      <tr key={lead.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">{lead.clientName}</div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <Building2 className="w-3 h-3" />
                            <span>{companyStr}</span>
                            <span>•</span>
                            <Phone className="w-3 h-3" />
                            <span>{lead.phone}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-400 font-medium">
                            {lead.source || 'Rufaa ya Mteja'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                          {formatCurrency(valueNum, currency)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-900 dark:text-white">{lead.assignedToName}</div>
                          <div className="text-[10px] text-slate-400">Tarehe: {dateStr}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                            statusStr === 'Closed Won' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' :
                            statusStr === 'Closed Lost' ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300' :
                            statusStr === 'Negotiation' ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300' :
                            statusStr === 'Proposal' ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300' :
                            'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                          }`}>
                            {statusStr}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <select
                            value={statusStr}
                            onChange={e => onUpdateLeadStatus(lead.id, e.target.value as SalesLead['status'])}
                            className="text-[11px] font-semibold p-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                          >
                            <option value="New">Mpya</option>
                            <option value="Contacted">Wamewasiliana</option>
                            <option value="Proposal">Ofa Imetumwa</option>
                            <option value="Negotiation">Majadiliano</option>
                            <option value="Closed Won">Ushindi (Won)</option>
                            <option value="Closed Lost">Imeshindikana</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredLeads.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Hakuna mteja mtarajiwa anayelingana na utafutaji wako.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: KPIS & HOD ASSIGNMENTS */}
      {activeTab === 'kpis' && (
        <div className="space-y-4">
          <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
            <div>
              <span className="font-bold">Mamlaka ya Idara ya Mauzo:</span> Mkuu wa Idara (HOD) anaweza kuweka na kugawa malengo maalum ya kila mwezi kwa kila afisa wa mauzo na kufuatilia utekelezaji wake.
            </div>
            <button
              onClick={() => setIsAddKPIModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs shrink-0 hover:bg-emerald-700"
            >
              Gawa KPI Mpya
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {kpis.map(kpi => {
              const achievedDeals = kpi.achievedDealsClosed ?? kpi.closedDeals ?? 0;
              const targetDeals = kpi.targetDealsClosed ?? kpi.targetDeals ?? 1;
              const achievedCalls = kpi.achievedCallsOrMeetings ?? kpi.completedCalls ?? 0;
              const targetCalls = kpi.targetCallsOrMeetings ?? kpi.targetCalls ?? 1;
              const periodText = kpi.period || kpi.month || 'Machi 2026';
              const assignedText = kpi.assignedBy || kpi.setBy || 'HOD';

              const revPercent = Math.min(100, Math.round((kpi.achievedRevenue / (kpi.targetRevenue || 1)) * 100));
              const dealsPercent = Math.min(100, Math.round((achievedDeals / targetDeals) * 100));

              return (
                <div key={kpi.id} className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm">{kpi.employeeName}</h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">{periodText} · Imewekwa na: {assignedText}</p>
                    </div>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      kpi.status === 'Achieved' || kpi.status === 'exceeded' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950' :
                      kpi.status === 'Missed' || kpi.status === 'behind' ? 'bg-red-100 text-red-700 dark:bg-red-950' :
                      'bg-blue-100 text-blue-700 dark:bg-blue-950'
                    }`}>
                      {kpi.status}
                    </span>
                  </div>

                  {/* Revenue Target Progress */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500">Lengo la Mapato:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {formatCurrency(kpi.achievedRevenue, currency)} / {formatCurrency(kpi.targetRevenue, currency)}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${revPercent}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-right font-mono text-emerald-600 font-bold">{revPercent}% Imekamilika</div>
                  </div>

                  {/* Deals Closed Progress */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500">Mikataba Iliyofungwa:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {achievedDeals} / {targetDeals} Deals
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${dealsPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Calls / Meetings */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Simu / Mikutano:</span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                      {achievedCalls} / {targetCalls}
                    </span>
                  </div>

                  {kpi.notes && (
                    <p className="text-[10px] text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-2 rounded">
                      {kpi.notes}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: SALES REPORTS & FEEDBACK */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reports.map(report => {
              const repName = report.employeeName || report.salesRepName || 'Afisa wa Mauzo';
              const repDate = report.submittedDate || report.date || '2026-11-01';
              const repDeals = report.dealsWonCount ?? report.closedDeals ?? 0;
              const repMeetings = report.callsOrMeetingsDone ?? report.meetingsHeld ?? 0;
              const repAchievements = report.keyAchievements || report.title || 'Mafanikio ya Mauzo';
              const repChallenges = report.challengesFaced || report.challenges || 'Hakuna changamoto kubwa.';
              const repNextPlan = report.nextWeekPlan || report.planForNextPeriod || 'Kuendelea na mawasiliano ya wateja.';
              const repFeedback = report.hodFeedback || report.feedbackFromHOD;

              return (
                <div key={report.id} className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm">{repName}</h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">Kipindi: {report.period} · Tarehe: {repDate}</p>
                    </div>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      report.status === 'Reviewed' || repFeedback ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950' : 'bg-amber-100 text-amber-700 dark:bg-amber-950'
                    }`}>
                      {report.status === 'Reviewed' || repFeedback ? 'Imehakikiwa na HOD' : 'Inasubiri Uhakiki'}
                    </span>
                  </div>

                  {/* Numbers */}
                  <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-center">
                    <div>
                      <div className="text-[10px] text-slate-400">Mauzo Yaliyopatikana</div>
                      <div className="text-xs font-mono font-bold text-emerald-600 mt-0.5">
                        {formatCurrency(report.revenueGenerated, currency)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Mikataba (Won)</div>
                      <div className="text-xs font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                        {repDeals}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Simu / Mikutano</div>
                      <div className="text-xs font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                        {repMeetings}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Mafanikio Makuu:</span>
                      <p className="text-slate-600 dark:text-slate-400 mt-0.5 text-[11px]">{repAchievements}</p>
                    </div>

                    <div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Changamoto Zilizojitokeza:</span>
                      <p className="text-slate-600 dark:text-slate-400 mt-0.5 text-[11px]">{repChallenges}</p>
                    </div>

                    <div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Mpango wa Wiki Ijayo:</span>
                      <p className="text-slate-600 dark:text-slate-400 mt-0.5 text-[11px]">{repNextPlan}</p>
                    </div>
                  </div>

                  {/* HOD Feedback Box */}
                  {repFeedback ? (
                    <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/40 rounded-lg border border-emerald-200 dark:border-emerald-800/50 text-[11px]">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300 mb-1">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Maoni ya Mkuu wa Idara (HOD):</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300">{repFeedback}</p>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedReportForReview(report);
                        setReviewFeedback('');
                      }}
                      className="w-full py-1.5 px-3 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-bold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      Weka Maoni & Uhakiki kama HOD
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL: ONGEZA LEAD MPYA */}
      {isAddLeadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <span>Sajili Mteja Mtarajiwa (New Sales Lead)</span>
            </h2>

            <form onSubmit={handleCreateLead} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                  Jina la Mteja / Mtu wa Kuwasiliana naye: *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Mfano: Mhandisi Rashid Bakari"
                  value={newClientName}
                  onChange={e => setNewClientName(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                    Kampuni / Taasisi:
                  </label>
                  <input
                    type="text"
                    placeholder="Mfano: Serengeti Logistics Ltd"
                    value={newCompany}
                    onChange={e => setNewCompany(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                    Thamani Inayotarajiwa (TZS): *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="15000000"
                    value={newEstimatedValue}
                    onChange={e => setNewEstimatedValue(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                    Namba ya Simu:
                  </label>
                  <input
                    type="text"
                    placeholder="+255 765 432 100"
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                    Barua Pepe (Email):
                  </label>
                  <input
                    type="email"
                    placeholder="rashid@serengeti.co.tz"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                    Mwakilishi Aliyegawiwa:
                  </label>
                  <select
                    value={newAssignedToId}
                    onChange={e => setNewAssignedToId(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.fullName} ({emp.department})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                    Chanzo cha Mteja:
                  </label>
                  <select
                    value={newSource}
                    onChange={e => setNewSource(e.target.value as any)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Rufaa ya Mteja">Rufaa ya Mteja</option>
                    <option value="Tovuti">Tovuti</option>
                    <option value="Mtandao wa Kijamii">Mtandao wa Kijamii</option>
                    <option value="Simu ya Moja kwa Moja">Simu ya Moja kwa Moja</option>
                    <option value="Tukio la Kibiashara">Tukio la Kibiashara</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                  Maelezo / Dokezo la Mahitaji:
                </label>
                <textarea
                  rows={2}
                  placeholder="Mteja anahitaji mfumo wa ofisi na kadi 50..."
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddLeadModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 font-bold"
                >
                  Ghairi
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700"
                >
                  Hifadhi Mteja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: GAWA KPI MPYA KAMA HOD */}
      {isAddKPIModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-600" />
              <span>Gawa Lengo la KPI kwa Mfanyakazi (HOD Assignment)</span>
            </h2>

            <form onSubmit={handleCreateKPI} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                  Afisa wa Mauzo: *
                </label>
                <select
                  value={kpiEmployeeId}
                  onChange={e => setKpiEmployeeId(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} ({emp.roleTitle})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                    Kipindi cha Malengo: *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Machi 2026 au Robo ya 1"
                    value={kpiPeriod}
                    onChange={e => setKpiPeriod(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                    Lengo la Mapato (TZS): *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="25000000"
                    value={kpiRevenueTarget}
                    onChange={e => setKpiRevenueTarget(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                    Lengo la Mikataba (Deals):
                  </label>
                  <input
                    type="number"
                    placeholder="5"
                    value={kpiDealsTarget}
                    onChange={e => setKpiDealsTarget(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                    Lengo la Mikutano / Simu:
                  </label>
                  <input
                    type="number"
                    placeholder="40"
                    value={kpiCallsTarget}
                    onChange={e => setKpiCallsTarget(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                  Maelekezo Maalum ya HOD:
                </label>
                <textarea
                  rows={2}
                  placeholder="Zingatia wateja wa sekta ya madini na taasisi za serikali..."
                  value={kpiNotes}
                  onChange={e => setKpiNotes(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddKPIModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 font-bold"
                >
                  Ghairi
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700"
                >
                  Gawa Lengo (Assign KPI)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: WASILISHA RIPOTI YA MAUZO */}
      {isAddReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              <span>Wasilisha Ripoti ya Kazi ya Mauzo</span>
            </h2>

            <form onSubmit={handleCreateReport} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                  Jina la Mfanyakazi: *
                </label>
                <select
                  value={reportEmployeeId}
                  onChange={e => setReportEmployeeId(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} ({emp.roleTitle})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                    Kipindi: *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Wiki ya 1 - Machi 2026"
                    value={reportPeriod}
                    onChange={e => setReportPeriod(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                    Mauzo Yaliyopatikana (TZS): *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="8000000"
                    value={reportRevenueGenerated}
                    onChange={e => setReportRevenueGenerated(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                    Mikataba Iliyofungwa:
                  </label>
                  <input
                    type="number"
                    value={reportDealsWon}
                    onChange={e => setReportDealsWon(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                    Simu na Mikutano Iliyofanyika:
                  </label>
                  <input
                    type="number"
                    value={reportCallsMeetings}
                    onChange={e => setReportCallsMeetings(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                  Mafanikio Makuu: *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Kufunga mkataba na mteja mpya..."
                  value={reportKeyAchievements}
                  onChange={e => setReportKeyAchievements(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                  Changamoto Zilizojitokeza:
                </label>
                <textarea
                  rows={2}
                  placeholder="Kuchelewa kwa majibu ya zabuni..."
                  value={reportChallenges}
                  onChange={e => setReportChallenges(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                  Mpango wa Wiki Ijayo:
                </label>
                <textarea
                  rows={2}
                  placeholder="Kukutana na wateja 6 na kutuma proposals 3..."
                  value={reportNextWeekPlan}
                  onChange={e => setReportNextWeekPlan(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddReportModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 font-bold"
                >
                  Ghairi
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700"
                >
                  Tuma Ripoti kwa HOD
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: HOD REVIEW / FEEDBACK */}
      {selectedReportForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-600" />
              <span>Maoni ya Mkuu wa Idara (HOD Feedback)</span>
            </h2>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-xs space-y-1">
              <div><span className="font-bold">Mfanyakazi:</span> {selectedReportForReview.employeeName}</div>
              <div><span className="font-bold">Kipindi:</span> {selectedReportForReview.period}</div>
              <div><span className="font-bold">Mafanikio:</span> {selectedReportForReview.keyAchievements}</div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                Weka Maoni & Mwongozo wako: *
              </label>
              <textarea
                rows={3}
                required
                placeholder="Mfano: Kazi nzuri kwenye mkataba wa wiki hii. Ongeza juhudi kwenye follow-up za wateja wa sekta ya umma..."
                value={reviewFeedback}
                onChange={e => setReviewFeedback(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedReportForReview(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 text-xs font-bold"
              >
                Ghairi
              </button>
              <button
                type="button"
                onClick={() => {
                  if (reviewFeedback.trim()) {
                    onReviewReport(selectedReportForReview.id, reviewFeedback);
                    setSelectedReportForReview(null);
                  }
                }}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
              >
                Hifadhi Maoni ya HOD
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
