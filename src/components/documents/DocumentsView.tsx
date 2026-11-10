import React, { useState } from 'react';
import { 
  FileText, 
  FileCheck2, 
  Sparkles, 
  Plus, 
  Printer, 
  Search, 
  Download, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ShieldAlert, 
  Send, 
  Copy,
  Building,
  User,
  ArrowRight
} from 'lucide-react';
import { translations } from '../../utils/translations';
import { 
  OfficeDocument, 
  ApprovalRequest, 
  DocumentCategory, 
  ApprovalType, 
  CurrentUser, 
  Department, 
  Employee 
} from '../../types/office';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { LOGO_PATH } from '../../data/initialData';

interface DocumentsViewProps {
  lang: 'sw' | 'en';
  currency: 'TZS' | 'USD';
  currentUser: CurrentUser;
  employees: Employee[];
  documents: OfficeDocument[];
  approvals: ApprovalRequest[];
  onAddDocument: (doc: Omit<OfficeDocument, 'id'>) => void;
  onAddApproval: (req: Omit<ApprovalRequest, 'id' | 'createdAt' | 'status'>) => void;
  onReviewApproval: (id: string, status: 'approved' | 'rejected', remarks?: string) => void;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({
  lang,
  currency,
  currentUser,
  employees,
  documents,
  approvals,
  onAddDocument,
  onAddApproval,
  onReviewApproval
}) => {
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<'docs' | 'approvals' | 'ai'>('docs');
  
  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchDoc, setSearchDoc] = useState<string>('');

  // Selected Doc for Reading / Printing
  const [selectedDoc, setSelectedDoc] = useState<OfficeDocument | null>(null);

  // New Document Modal
  const [isNewDocModalOpen, setIsNewDocModalOpen] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState<DocumentCategory>('memo');
  const [docDept, setDocDept] = useState<Department>('Utawala & Uongozi');
  const [docRecipient, setDocRecipient] = useState('');
  const [docSummary, setDocSummary] = useState('');
  const [docContent, setDocContent] = useState('');
  const [docConfidentiality, setDocConfidentiality] = useState<'normal' | 'confidential' | 'restricted'>('normal');

  // New Approval Request Modal
  const [isNewApprovalModalOpen, setIsNewApprovalModalOpen] = useState(false);
  const [approvalTitle, setApprovalTitle] = useState('');
  const [approvalType, setApprovalType] = useState<ApprovalType>('procurement');
  const [approvalAmount, setApprovalAmount] = useState<string>('');
  const [approvalUrgency, setApprovalUrgency] = useState<'normal' | 'urgent'>('normal');
  const [approvalDescription, setApprovalDescription] = useState('');

  // AI Office Writer State
  const [aiDocType, setAiDocType] = useState('Waraka wa Ndani (Internal Memo)');
  const [aiTopic, setAiTopic] = useState('');
  const [aiRecipient, setAiRecipient] = useState('Wafanyakazi Wote');
  const [aiKeyPoints, setAiKeyPoints] = useState('');
  const [aiLanguage, setAiLanguage] = useState<'sw' | 'en'>(lang);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiGeneratedResult, setAiGeneratedResult] = useState<{ refNumber: string; date: string; title: string; content: string } | null>(null);

  const filteredDocs = documents.filter(d => {
    const matchesCat = categoryFilter === 'all' || d.category === categoryFilter;
    const matchesSearch = d.title.toLowerCase().includes(searchDoc.toLowerCase()) ||
                          d.refNumber.toLowerCase().includes(searchDoc.toLowerCase()) ||
                          d.author.toLowerCase().includes(searchDoc.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleCreateDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle || !docContent) return;

    const refNumber = `KD/${docDept.substring(0, 3).toUpperCase()}/${Date.now().toString().slice(-4)}`;
    onAddDocument({
      refNumber,
      title: docTitle,
      category: docCategory,
      department: docDept,
      author: currentUser.name,
      recipient: docRecipient || 'Wafanyakazi Wote',
      date: new Date().toISOString().split('T')[0],
      confidentiality: docConfidentiality,
      summary: docSummary || docTitle,
      content: docContent,
      tags: [docCategory, docDept.split(' ')[0]],
      fileSize: '120 KB',
      status: 'active',
    });

    setIsNewDocModalOpen(false);
    setDocTitle('');
    setDocSummary('');
    setDocContent('');
  };

  const handleCreateApproval = (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvalTitle || !approvalDescription) return;

    const refNumber = `KD/REQ/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`;
    onAddApproval({
      refNumber,
      title: approvalTitle,
      type: approvalType,
      department: currentUser.department as Department,
      requesterId: currentUser.id,
      requesterName: currentUser.name,
      amount: approvalAmount ? parseFloat(approvalAmount) : undefined,
      urgency: approvalUrgency,
      description: approvalDescription,
    });

    setIsNewApprovalModalOpen(false);
    setApprovalTitle('');
    setApprovalAmount('');
    setApprovalDescription('');
  };

  const handleGenerateAiDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiTopic) return;

    setAiLoading(true);
    setAiGeneratedResult(null);

    try {
      const res = await fetch('/api/ai/draft-office-doc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docType: aiDocType,
          topic: aiTopic,
          recipient: aiRecipient,
          language: aiLanguage,
          keyPoints: aiKeyPoints,
          senderRole: currentUser.title,
        }),
      });

      const data = await res.json();
      if (data.success && data.document) {
        setAiGeneratedResult(data.document);
      } else {
        alert('Kuna hitilafu ilitokea. Tafadhali jaribu tena.');
      }
    } catch (err) {
      console.error(err);
      alert('Hitilafu ya mtandao au seva haijaanza.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveAiDocToVault = () => {
    if (!aiGeneratedResult) return;
    onAddDocument({
      refNumber: aiGeneratedResult.refNumber,
      title: aiGeneratedResult.title,
      category: 'memo',
      department: currentUser.department as Department,
      author: currentUser.name,
      recipient: aiRecipient,
      date: new Date().toISOString().split('T')[0],
      confidentiality: 'normal',
      summary: aiTopic,
      content: aiGeneratedResult.content,
      tags: ['AI-Drafted', 'Nyaraka Rasmi'],
      fileSize: '95 KB',
      status: 'active',
    });
    alert('Nyaraka imehifadhiwa vizuri kwenye Kumbukumbu za Ofisi!');
    setActiveTab('docs');
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t.documents.title}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t.documents.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setActiveTab('ai')}
            className="px-3.5 py-2 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" />
            <span>Mwandishi wa AI (Draft Doc)</span>
          </button>

          <button
            onClick={() => setIsNewApprovalModalOpen(true)}
            className="px-3.5 py-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 transition-colors shadow-xs flex items-center gap-1.5"
          >
            <FileCheck2 className="w-4 h-4 text-amber-600" />
            <span>{t.documents.newApproval}</span>
          </button>

          <button
            onClick={() => setIsNewDocModalOpen(true)}
            className="px-3.5 py-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 transition-colors shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>{t.documents.newDoc}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex items-center gap-4">
        <button
          onClick={() => setActiveTab('docs')}
          className={`pb-3 text-xs font-bold transition-colors relative flex items-center gap-1.5 ${
            activeTab === 'docs' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>{t.documents.docsTab}</span>
          {activeTab === 'docs' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 dark:bg-emerald-400" />}
        </button>

        <button
          onClick={() => setActiveTab('approvals')}
          className={`pb-3 text-xs font-bold transition-colors relative flex items-center gap-1.5 ${
            activeTab === 'approvals' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>{t.documents.approvalsTab}</span>
          {approvals.filter(a => a.status === 'pending').length > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
              {approvals.filter(a => a.status === 'pending').length}
            </span>
          )}
          {activeTab === 'approvals' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 dark:bg-emerald-400" />}
        </button>

        <button
          onClick={() => setActiveTab('ai')}
          className={`pb-3 text-xs font-bold transition-colors relative flex items-center gap-1.5 ${
            activeTab === 'ai' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4 text-emerald-500" />
          <span>{t.documents.aiWriterTab}</span>
          {activeTab === 'ai' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 dark:bg-emerald-400" />}
        </button>
      </div>

      {/* Tab 1: Documents Archive */}
      {activeTab === 'docs' && (
        <div className="space-y-4">
          
          {/* Search & Category Filter */}
          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <div className="relative flex-1 w-full sm:max-w-md">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tafuta nyaraka kwa kumbukumbu na., kichwa au idara..."
                value={searchDoc}
                onChange={e => setSearchDoc(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="all">Aina Zote za Nyaraka</option>
                <option value="memo">Waraka wa Ndani (Memo)</option>
                <option value="incoming_letter">Barua Iliyoingia</option>
                <option value="outgoing_letter">Barua Iliyotoka</option>
                <option value="contract">Mkataba</option>
                <option value="policy">Sera ya Ofisi</option>
                <option value="meeting_minutes">Kumbukumbu za Mkutano</option>
              </select>
            </div>
          </div>

          {/* Documents Grid / Table */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocs.map(doc => (
              <div
                key={doc.id}
                onClick={() => setSelectedDoc(doc)}
                className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs cursor-pointer transition-all space-y-3 group"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    {doc.refNumber}
                  </span>
                  <span className={`text-[10px] font-bold uppercase ${
                    doc.confidentiality === 'restricted' ? 'text-rose-600' :
                    doc.confidentiality === 'confidential' ? 'text-amber-600' : 'text-slate-400'
                  }`}>
                    {doc.confidentiality === 'restricted' ? 'Siri Kubwa' :
                     doc.confidentiality === 'confidential' ? 'Siri' : 'Kawaida'}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors line-clamp-2">
                    {doc.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                    {doc.summary}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-medium text-slate-600 dark:text-slate-300 truncate max-w-[140px]">{doc.author}</span>
                  <span className="font-mono">{formatDate(doc.date, lang)}</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* Tab 2: Approval Requests Pipeline */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Mchakato wa Idhini & Ununuzi (Approval Workflow)
                </h3>
                <p className="text-xs text-slate-500">
                  Maombi ya matumizi, ununuzi wa vifaa, na safari za kikazi yanayohitaji idhini ya Mkurugenzi au Meneja.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase text-[11px]">
                    <th className="py-3 px-4">Kumbukumbu Na.</th>
                    <th className="py-3 px-4">Mada ya Ombi</th>
                    <th className="py-3 px-4">Aina</th>
                    <th className="py-3 px-4">Mwombaji</th>
                    <th className="py-3 px-4">Kiasi (Gharama)</th>
                    <th className="py-3 px-4">Uharaka</th>
                    <th className="py-3 px-4">Hali</th>
                    <th className="py-3 px-4 text-right">Idhini</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {approvals.map(req => (
                    <tr key={req.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono font-bold text-slate-500">{req.refNumber}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{req.title}</div>
                        <div className="text-[11px] text-slate-400 line-clamp-1">{req.description}</div>
                      </td>
                      <td className="py-3 px-4 capitalize">
                        {req.type === 'procurement' ? 'Ununuzi wa Vifaa' :
                         req.type === 'travel' ? 'Safari ya Kazi' :
                         req.type === 'petty_cash' ? 'Petty Cash' : req.type}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                        {req.requesterName} ({req.department.split(' ')[0]})
                      </td>
                      <td className="py-3 px-4 font-mono font-bold tabular-nums">
                        {req.amount ? formatCurrency(req.amount, currency) : '-'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-bold uppercase ${
                          req.urgency === 'urgent' ? 'text-rose-600' : 'text-slate-500'
                        }`}>
                          {req.urgency === 'urgent' ? 'Haraka' : 'Kawaida'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[11px] font-bold ${
                          req.status === 'approved' ? 'text-emerald-600 dark:text-emerald-400' :
                          req.status === 'rejected' ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'
                        }`}>
                          {req.status === 'approved' ? 'Imeidhinishwa' :
                           req.status === 'rejected' ? 'Imekataliwa' : 'Inasubiri'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {req.status === 'pending' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => onReviewApproval(req.id, 'approved', 'Imeidhinishwa na Mkurugenzi Mtendaji.')}
                              className="px-2.5 py-1 text-[11px] font-bold bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors"
                            >
                              Idhinisha
                            </button>
                            <button
                              onClick={() => onReviewApproval(req.id, 'rejected', 'Gharama ziko juu au subiri mwezi ujao.')}
                              className="px-2.5 py-1 text-[11px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded hover:bg-rose-100"
                            >
                              Kataa
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">
                            {req.reviewedBy ? `Na: ${req.reviewedBy}` : 'Imefungwa'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: AI Office Secretary & Drafter */}
      {activeTab === 'ai' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left: Input Form */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Msaidizi Mahiri wa Kuandika Nyaraka Rasmi (AI Office Writer)
                </h3>
                <p className="text-xs text-slate-500">
                  Tengeneza barua rasmi, memo za ndani, sera na maelekezo ya kiofisi yenye muundo wa kisheria na weledi wa hali ya juu.
                </p>
              </div>
            </div>

            <form onSubmit={handleGenerateAiDoc} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Aina ya Nyaraka:
                </label>
                <select
                  value={aiDocType}
                  onChange={e => setAiDocType(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="Waraka wa Ndani (Internal Memo)">Waraka wa Ndani (Internal Memo)</option>
                  <option value="Barua Rasmi ya Kiofisi (Official Business Letter)">Barua Rasmi ya Kiofisi (Official Letter)</option>
                  <option value="Tangazo la Likizo ya Sikukuu (Holiday Announcement)">Tangazo la Likizo ya Sikukuu (Holiday Announcement)</option>
                  <option value="Barua ya Onyo la Nidhamu Kazini (Disciplinary Warning Letter)">Barua ya Onyo la Nidhamu Kazini (Warning Letter)</option>
                  <option value="Muhtasari wa Kikao cha Menejimenti (Meeting Minutes)">Muhtasari wa Kikao cha Menejimenti (Minutes)</option>
                  <option value="Mwongozo wa Sera ya Ofisi (Office Policy Directive)">Mwongozo wa Sera ya Ofisi (Policy Directive)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Mada Kuu / Lengo (Topic):
                </label>
                <input
                  type="text"
                  required
                  placeholder="Mfano: Kufungwa kwa ofisi kwa sikukuu ya Pasaka na ratiba ya huduma za dharura"
                  value={aiTopic}
                  onChange={e => setAiTopic(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Mpokeaji (Recipient):
                  </label>
                  <input
                    type="text"
                    value={aiRecipient}
                    onChange={e => setAiRecipient(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Lugha ya Nyaraka:
                  </label>
                  <select
                    value={aiLanguage}
                    onChange={e => setAiLanguage(e.target.value as 'sw' | 'en')}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="sw">Kiswahili Rasmi cha Kiofisi (Tanzania)</option>
                    <option value="en">Official Business English</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Hoja Kuu za Kujumuisha (Key Points):
                </label>
                <textarea
                  rows={3}
                  placeholder="Weka vipengele muhimu:&#10;- Ofisi itafungwa kuanzia Ijumaa hadi Jumatatu&#10;- Timu ya IT itakuwa standby kwa dharura&#10;- Shughuli za kawaida zitaanza Jumanne saa 2 asubuhi"
                  value={aiKeyPoints}
                  onChange={e => setAiKeyPoints(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                disabled={aiLoading}
                className="w-full py-2.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {aiLoading ? (
                  <span>Inatayarisha nyaraka rasmi...</span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Tengeneza Nyaraka Rasmi Kupitia AI</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right: Output Preview */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Karatasi ya Mfano (Official Letterhead Preview)
                </span>
                {aiGeneratedResult && (
                  <button
                    onClick={handleSaveAiDocToVault}
                    className="px-3 py-1 text-xs font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-1"
                  >
                    <span>Hifadhi kwenye Nyaraka za Ofisi</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {aiGeneratedResult ? (
                <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed max-h-[460px] overflow-y-auto">
                  {aiGeneratedResult.content}
                </div>
              ) : (
                <div className="text-center py-24 text-slate-400 text-xs italic">
                  Jaza maelezo upande wa kushoto na ubonyeze "Tengeneza Nyaraka Rasmi Kupitia AI" kuona rasimu ya kwanza hapa.
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* Official Document Letterhead Viewer / Printable Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-white text-slate-900 rounded-2xl w-full max-w-2xl border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* Modal Controls (No Print) */}
            <div className="no-print p-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
              <div className="text-xs font-mono font-bold text-slate-600">
                Kumbukumbu: {selectedDoc.refNumber}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 text-xs font-bold bg-slate-900 text-white rounded-lg hover:bg-slate-800 flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{t.common.print}</span>
                </button>
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="p-1.5 text-slate-500 hover:text-slate-900"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Document Body */}
            <div className="p-8 md:p-10 space-y-6 overflow-y-auto bg-white text-slate-900">
              
              {/* Official Corporate Header */}
              <div className="text-center border-b-2 border-slate-900 pb-5 space-y-1">
                <div className="flex items-center justify-center gap-3">
                  <img 
                    src={LOGO_PATH} 
                    alt="KaziDesk Logo" 
                    className="w-12 h-12 rounded-lg object-cover" 
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h2 className="text-xl font-extrabold tracking-tight text-slate-900 uppercase">
                      KAZIDESK ENTERPRISE LTD
                    </h2>
                    <p className="text-[11px] text-slate-600">
                      Ghorofa ya 7, KaziDesk Tower, Samora Avenue, Posta, Dar es Salaam
                    </p>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500">
                  Simu: +255 22 211 4450 · Barua Pepe: utawala@kazidesk.co.tz · TIN: 112-948-203
                </p>
              </div>

              {/* Reference & Metadata */}
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <div>KUMB. NA: <span className="font-mono">{selectedDoc.refNumber}</span></div>
                <div>TAREHE: <span className="font-mono">{formatDate(selectedDoc.date, lang)}</span></div>
              </div>

              <div className="text-xs space-y-1 text-slate-800">
                <div><strong>KWA:</strong> {selectedDoc.recipient || 'Wafanyakazi Wote'}</div>
                <div><strong>KUTOKA:</strong> {selectedDoc.author} ({selectedDoc.department})</div>
                <div className="pt-2 text-sm font-bold uppercase underline">
                  KUHUSU: {selectedDoc.title}
                </div>
              </div>

              {/* Main Content */}
              <div className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap font-sans">
                {selectedDoc.content}
              </div>

              {/* Official Stamp & Sign */}
              <div className="pt-8 flex items-center justify-between border-t border-slate-200 text-xs">
                <div>
                  <p className="font-bold">Wenu katika utumishi,</p>
                  <p className="mt-8 font-semibold text-slate-900 underline">{selectedDoc.author}</p>
                  <p className="text-[11px] text-slate-500">{selectedDoc.department}</p>
                </div>

                <div className="p-3 border-2 border-dashed border-emerald-600 rounded-xl text-center text-emerald-800">
                  <div className="text-[10px] uppercase font-bold tracking-widest">KAZIDESK ENTERPRISE</div>
                  <div className="text-[9px] font-mono">OFFICIAL REGISTRY</div>
                  <div className="text-[9px] text-emerald-600 font-bold">VERIFIED & FILED</div>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* New Document Modal */}
      {isNewDocModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden p-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Sajili Nyaraka Mpya ya Ofisi</h3>
              <button onClick={() => setIsNewDocModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateDocument} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Kichwa cha Nyaraka:</label>
                <input
                  type="text"
                  required
                  placeholder="Mfano: Sera ya Likizo na Mapumziko ya Wafanyakazi..."
                  value={docTitle}
                  onChange={e => setDocTitle(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Aina ya Nyaraka:</label>
                  <select
                    value={docCategory}
                    onChange={e => setDocCategory(e.target.value as DocumentCategory)}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="memo">Waraka wa Ndani (Memo)</option>
                    <option value="incoming_letter">Barua Iliyoingia</option>
                    <option value="outgoing_letter">Barua Iliyotoka</option>
                    <option value="contract">Mkataba</option>
                    <option value="policy">Sera ya Ofisi</option>
                    <option value="meeting_minutes">Kumbukumbu za Mkutano</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Usiri:</label>
                  <select
                    value={docConfidentiality}
                    onChange={e => setDocConfidentiality(e.target.value as any)}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="normal">Kawaida (Public Internal)</option>
                    <option value="confidential">Siri (Confidential)</option>
                    <option value="restricted">Siri Kubwa (Restricted)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Yaliyomo (Content):</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Andika maudhui kamili ya nyaraka hapa..."
                  value={docContent}
                  onChange={e => setDocContent(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewDocModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 dark:text-slate-300"
                >
                  Ghairi
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  Hifadhi Nyaraka
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Approval Request Modal */}
      {isNewApprovalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden p-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Omba Idhini / Ununuzi Mpya</h3>
              <button onClick={() => setIsNewApprovalModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateApproval} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Mada ya Ombi:</label>
                <input
                  type="text"
                  required
                  placeholder="Mfano: Ununuzi wa vifaa vya kusafishia na vitakasa mikono..."
                  value={approvalTitle}
                  onChange={e => setApprovalTitle(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Aina ya Ombi:</label>
                  <select
                    value={approvalType}
                    onChange={e => setApprovalType(e.target.value as ApprovalType)}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="procurement">Ununuzi wa Vifaa (Procurement)</option>
                    <option value="travel">Safari ya Kazi (Travel Requisition)</option>
                    <option value="petty_cash">Vocha ya Petty Cash</option>
                    <option value="memo">Idhini ya Waraka</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Kadirio la Gharama ({currency}):</label>
                  <input
                    type="number"
                    placeholder="Kiasi cha fedha"
                    value={approvalAmount}
                    onChange={e => setApprovalAmount(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Sababu & Maelezo ya Kina:</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Eleza kwanini matumizi haya yanahitajika kwa ofisi..."
                  value={approvalDescription}
                  onChange={e => setApprovalDescription(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewApprovalModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 dark:text-slate-300"
                >
                  Ghairi
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  Wasilisha Ombi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
