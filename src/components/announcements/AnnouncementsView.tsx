import React, { useState } from 'react';
import { 
  Megaphone, 
  Plus, 
  Pin, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar, 
  User, 
  Users, 
  Tag, 
  Clock, 
  ShieldAlert,
  Search,
  Filter,
  Check
} from 'lucide-react';
import { CompanyAnnouncement, Employee } from '../../types/office';
import { formatDate } from '../../utils/formatters';

interface AnnouncementsViewProps {
  lang: 'sw' | 'en';
  announcements: CompanyAnnouncement[];
  currentUserId: string;
  onAddAnnouncement: (announcement: Omit<CompanyAnnouncement, 'id'>) => void;
  onAcknowledge: (announcementId: string, employeeId: string) => void;
  isSuperAdmin?: boolean;
}

export const AnnouncementsView: React.FC<AnnouncementsViewProps> = ({
  lang,
  announcements,
  currentUserId,
  onAddAnnouncement,
  onAcknowledge,
  isSuperAdmin = true,
}) => {
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newPriority, setNewPriority] = useState<'Dharura' | 'Muhimu' | 'Kawaida'>('Muhimu');
  const [newCategory, setNewCategory] = useState<'Utawala' | 'Sikukuu & Likizo' | 'Mikutano' | 'Mafunzo' | 'Mabadiliko ya Sera' | 'Usalama'>('Utawala');
  const [newTargetAudience, setNewTargetAudience] = useState<'Wote' | 'Idara Maalum' | 'Wasimamizi Tu'>('Wote');
  const [newIsPinned, setNewIsPinned] = useState(false);
  const [newExpiresAt, setNewExpiresAt] = useState(`${new Date().getFullYear()}-12-31`);

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    onAddAnnouncement({
      title: newTitle,
      content: newContent,
      authorName: 'Mkurugenzi Mtendaji (Super Admin)',
      authorRole: 'Uongozi Kuu wa Kampuni',
      priority: newPriority,
      category: newCategory,
      createdAt: new Date().toISOString(),
      expiresAt: newExpiresAt,
      isPinned: newIsPinned,
      targetAudience: newTargetAudience,
      readByEmployeeIds: [currentUserId],
    });

    setIsAddModalOpen(false);
    setNewTitle('');
    setNewContent('');
    setNewIsPinned(false);
  };

  const filteredAnnouncements = announcements.filter(item => {
    const matchesPriority = priorityFilter === 'all' || item.priority === priorityFilter;
    const matchesSearch = 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.category ? item.category.toLowerCase().includes(searchTerm.toLowerCase()) : false);
    return matchesPriority && matchesSearch;
  }).sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    const timeA = new Date(a.createdAt || a.date || Date.now()).getTime();
    const timeB = new Date(b.createdAt || b.date || Date.now()).getTime();
    return timeB - timeA;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-amber-500" />
            <span>Ubao wa Matangazo ya Kampuni (Noticeboard)</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Matangazo rasmi, miongozo na taarifa za dharura kutoka kwa Super Admin kwenda kwa wafanyakazi wote.
          </p>
        </div>

        {isSuperAdmin && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-2 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs flex items-center gap-1.5 self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Chapisha Tangazo Jipya (Super Admin)</span>
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tafuta tangazo kwa kichwa, maelezo au aina..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            <option value="all">Umuhimu Wote</option>
            <option value="Dharura">Dharura (Urgent)</option>
            <option value="Muhimu">Muhimu (Important)</option>
            <option value="Kawaida">Kawaida (General)</option>
          </select>
        </div>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {filteredAnnouncements.map(announcement => {
          const readList = announcement.readByEmployeeIds || announcement.acknowledgedBy || [];
          const isRead = readList.includes(currentUserId);
          const rawDate = announcement.createdAt || announcement.date || new Date().toISOString();
          const displayDate = rawDate.includes('T') ? rawDate.split('T')[0] : rawDate.split(' ')[0];

          return (
            <div
              key={announcement.id}
              className={`p-5 rounded-xl border transition-all ${
                announcement.isPinned 
                  ? 'border-amber-300 dark:border-amber-800/80 bg-amber-50/20 dark:bg-amber-950/20 shadow-xs' 
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {announcement.isPinned && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                        <Pin className="w-3 h-3" />
                        <span>Imepiniwa Juu</span>
                      </span>
                    )}

                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      announcement.priority === 'Dharura' || announcement.priority === 'urgent' ? 'bg-red-100 text-red-700 dark:bg-red-950 border border-red-200' :
                      announcement.priority === 'Muhimu' || announcement.priority === 'important' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 border border-amber-200' :
                      'bg-blue-100 text-blue-800 dark:bg-blue-950 border border-blue-200'
                    }`}>
                      {announcement.priority}
                    </span>

                    {announcement.category && (
                      <span className="text-[10px] font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                        {announcement.category}
                      </span>
                    )}

                    <span className="text-[10px] font-medium text-slate-500 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>{announcement.targetAudience}</span>
                    </span>
                  </div>

                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {announcement.title}
                  </h2>

                  <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                    {announcement.content}
                  </p>
                </div>

                {/* Meta & Acknowledge */}
                <div className="sm:text-right flex flex-col justify-between shrink-0 sm:min-w-[160px] pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                  <div className="text-[11px] text-slate-400 space-y-1">
                    <div className="font-semibold text-slate-600 dark:text-slate-300">
                      {announcement.authorName}
                    </div>
                    <div className="flex sm:justify-end items-center gap-1 text-[10px]">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(displayDate)}</span>
                    </div>
                  </div>

                  <div className="pt-3">
                    {isRead ? (
                      <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Umesoma Tangazo Hili</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => onAcknowledge(announcement.id, currentUserId)}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold hover:bg-emerald-600 transition-colors flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Thibitisha Kusoma</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Read Acknowledgment counter */}
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
                <span>Wafanyakazi {readList.length} wamethibitisha kusoma taarifa hii.</span>
                <span>Hadi: {announcement.expiresAt || 'Dumu'}</span>
              </div>
            </div>
          );
        })}

        {filteredAnnouncements.length === 0 && (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
            Hakuna matangazo yanayopatikana kwa sasa.
          </div>
        )}
      </div>

      {/* MODAL: POST NEW ANNOUNCEMENT */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-amber-500" />
              <span>Chapisha Tangazo Rasmi (Super Admin Broadcast)</span>
            </h2>

            <form onSubmit={handleCreateAnnouncement} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                  Kichwa cha Habari cha Tangazo: *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Mfano: Sikukuu ya Pasaka & Ratiba ya Kazi Ofisini"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                    Umuhimu (Priority): *
                  </label>
                  <select
                    value={newPriority}
                    onChange={e => setNewPriority(e.target.value as any)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Muhimu">Muhimu (Important)</option>
                    <option value="Dharura">Dharura (Urgent)</option>
                    <option value="Kawaida">Kawaida (General)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                    Aina ya Tangazo:
                  </label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value as any)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Utawala">Utawala</option>
                    <option value="Sikukuu & Likizo">Sikukuu & Likizo</option>
                    <option value="Mikutano">Mikutano</option>
                    <option value="Mafunzo">Mafunzo</option>
                    <option value="Mabadiliko ya Sera">Mabadiliko ya Sera</option>
                    <option value="Usalama">Usalama</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                    Walengwa:
                  </label>
                  <select
                    value={newTargetAudience}
                    onChange={e => setNewTargetAudience(e.target.value as any)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Wote">Wafanyakazi Wote</option>
                    <option value="Idara Maalum">Idara Maalum</option>
                    <option value="Wasimamizi Tu">Wasimamizi & Wakuu wa Idara</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                    Tarehe ya Kufikia Ukomo:
                  </label>
                  <input
                    type="date"
                    value={newExpiresAt}
                    onChange={e => setNewExpiresAt(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] mb-1">
                  Ujumbe Kamili wa Tangazo: *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Andika taarifa kamili itakayosomwa na wafanyakazi..."
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pinNotice"
                  checked={newIsPinned}
                  onChange={e => setNewIsPinned(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="pinNotice" className="font-bold text-slate-700 dark:text-slate-300 text-xs cursor-pointer">
                  Pini tangazo hili juu ya ubao wa matangazo (Pinned Announcement)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 font-bold"
                >
                  Ghairi
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700"
                >
                  Chapisha Tangazo Sasa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
