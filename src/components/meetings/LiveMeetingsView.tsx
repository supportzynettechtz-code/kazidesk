/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Video,
  Plus,
  Calendar,
  Clock,
  Users,
  Link,
  Copy,
  Check,
  ExternalLink,
  MessageSquare,
  FileText,
  Search,
  Filter,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Play,
  Share2,
  ShieldAlert,
  Sparkles,
  Maximize2,
  Minimize2,
  ArrowRight,
  ListTodo
} from 'lucide-react';
import { ScheduledMeeting, MeetingStatus, MeetingActionItem, MeetingDecision } from '../../types/meetingsHelp';
import { Employee, OfficeTask } from '../../types/office';
import { formatDate } from '../../utils/formatters';
import { db } from '../../firebase/config';
import { collection, onSnapshot, query, orderBy, doc, setDoc, deleteDoc } from 'firebase/firestore';

interface LiveMeetingsViewProps {
  companyId: string;
  lang: 'sw' | 'en';
  currentUser: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  employees: Employee[];
  canManageMeetings: boolean;
  onAddTask?: (task: Omit<OfficeTask, 'id'>) => void;
  onNavigateTab?: (tab: string) => void;
}

export const LiveMeetingsView: React.FC<LiveMeetingsViewProps> = ({
  companyId,
  lang,
  currentUser,
  employees,
  canManageMeetings,
  onAddTask,
  onNavigateTab
}) => {
  const isSw = lang === 'sw';

  // State
  const [meetings, setMeetings] = useState<ScheduledMeeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | MeetingStatus>('all');
  const [activeTab, setActiveTab] = useState<'list' | 'calendar'>('list');

  // Modals & Active Meeting State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<ScheduledMeeting | null>(null);
  const [activeVideoMeeting, setActiveVideoMeeting] = useState<ScheduledMeeting | null>(null);
  const [activeMinutesMeeting, setActiveMinutesMeeting] = useState<ScheduledMeeting | null>(null);
  const [copiedLinkMeetingId, setCopiedLinkMeetingId] = useState<string | null>(null);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 3500);
  };

  // ---------------------------------------------------------------------------
  // REAL-TIME FIRESTORE LISTENER
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!companyId) return;
    setIsLoading(true);

    const meetingsRef = collection(db, 'companies', companyId, 'meetings');
    const q = query(meetingsRef, orderBy('date', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const list: ScheduledMeeting[] = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data(),
        } as ScheduledMeeting));
        setMeetings(list);
        setIsLoading(false);
      },
      error => {
        console.warn('Real-time meetings listener notice:', error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [companyId]);

  // ---------------------------------------------------------------------------
  // FILTERED MEETINGS
  // ---------------------------------------------------------------------------
  const filteredMeetings = useMemo(() => {
    return meetings.filter(m => {
      const matchesSearch =
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.agenda.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.organizerName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [meetings, searchQuery, statusFilter]);

  // ---------------------------------------------------------------------------
  // CREATE / EDIT MEETING
  // ---------------------------------------------------------------------------
  const handleSaveMeeting = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canManageMeetings) {
      alert(isSw ? 'Huna ruhusa ya kupanga au kuhariri mikutano.' : 'You do not have permission to schedule meetings.');
      return;
    }

    const fd = new FormData(e.currentTarget);
    const title = fd.get('title') as string;
    const agenda = fd.get('agenda') as string;
    const date = fd.get('date') as string;
    const startTime = fd.get('startTime') as string;
    const endTime = fd.get('endTime') as string;
    const locationType = fd.get('locationType') as 'online' | 'in_person' | 'hybrid';
    const locationDetails = (fd.get('locationDetails') as string) || '';
    const recurrence = (fd.get('recurrence') as any) || 'none';
    const selectedAttendees = fd.getAll('attendees') as string[];

    const meetingId = editingMeeting?.id || `MTG-${Date.now()}`;
    const cleanCompId = companyId.replace(/[^a-zA-Z0-9]/g, '');
    const cleanMtgId = meetingId.replace(/[^a-zA-Z0-9]/g, '');
    const videoRoomId = `KaziDesk-${cleanCompId}-${cleanMtgId}`;
    const videoJoinUrl = `https://meet.jit.si/${videoRoomId}`;

    const attendeesList = selectedAttendees.map(empId => {
      const emp = employees.find(e => e.id === empId);
      return {
        employeeId: empId,
        name: emp?.fullName || empId,
        roleTitle: emp?.roleTitle,
        department: emp?.department,
        email: emp?.email,
        hasAttended: false,
      };
    });

    const now = new Date().toISOString();
    const meetingData: ScheduledMeeting = {
      id: meetingId,
      companyId,
      title,
      agenda,
      date,
      startTime,
      endTime,
      locationType,
      locationDetails,
      videoRoomId,
      videoJoinUrl,
      recurrence,
      status: editingMeeting?.status || 'scheduled',
      organizerId: currentUser.id,
      organizerName: currentUser.name,
      organizerEmail: currentUser.email,
      attendees: attendeesList,
      minutesNotes: editingMeeting?.minutesNotes || '',
      decisions: editingMeeting?.decisions || [],
      actionItems: editingMeeting?.actionItems || [],
      createdAt: editingMeeting?.createdAt || now,
      updatedAt: now,
    };

    try {
      await setDoc(doc(db, 'companies', companyId, 'meetings', meetingId), meetingData, { merge: true });
      showNotification(isSw ? 'Mkutano umehifadhiwa kikamilifu!' : 'Meeting saved successfully!');
      setIsCreateModalOpen(false);
      setEditingMeeting(null);
    } catch (error) {
      console.error('Error saving meeting:', error);
      alert(isSw ? 'Hitilafu wakati wa kuhifadhi mkutano.' : 'Error saving meeting.');
    }
  };

  // ---------------------------------------------------------------------------
  // UPDATE STATUS
  // ---------------------------------------------------------------------------
  const handleUpdateStatus = async (meeting: ScheduledMeeting, newStatus: MeetingStatus) => {
    try {
      await setDoc(doc(db, 'companies', companyId, 'meetings', meeting.id), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      showNotification(isSw ? `Hali ya mkutano imesasishwa kuwa ${newStatus}.` : `Status updated to ${newStatus}.`);
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  // ---------------------------------------------------------------------------
  // DELETE MEETING
  // ---------------------------------------------------------------------------
  const handleDeleteMeeting = async (meeting: ScheduledMeeting) => {
    if (!canManageMeetings) return;
    if (confirm(isSw ? `Je, una uhakika unataka kufuta mkutano wa "${meeting.title}"?` : `Are you sure you want to delete meeting "${meeting.title}"?`)) {
      try {
        await deleteDoc(doc(db, 'companies', companyId, 'meetings', meeting.id));
        showNotification(isSw ? 'Mkutano umefutwa.' : 'Meeting deleted.');
      } catch (err) {
        console.error('Error deleting meeting:', err);
      }
    }
  };

  // ---------------------------------------------------------------------------
  // COPY INVITE LINK
  // ---------------------------------------------------------------------------
  const copyInvite = (meeting: ScheduledMeeting) => {
    const text = isSw
      ? `Mwaliko wa Mkutano wa KaziDesk:\n"${meeting.title}"\nTarehe: ${meeting.date} saa ${meeting.startTime} - ${meeting.endTime}\nKiungo cha Video: ${meeting.videoJoinUrl}`
      : `KaziDesk Meeting Invitation:\n"${meeting.title}"\nDate: ${meeting.date} at ${meeting.startTime} - ${meeting.endTime}\nJoin Video: ${meeting.videoJoinUrl}`;
    navigator.clipboard.writeText(text);
    setCopiedLinkMeetingId(meeting.id);
    setTimeout(() => setCopiedLinkMeetingId(null), 3000);
    showNotification(isSw ? 'Kiungo cha mkutano kimenakiliwa!' : 'Meeting link copied!');
  };

  // ---------------------------------------------------------------------------
  // SAVE MINUTES & ACTION ITEMS
  // ---------------------------------------------------------------------------
  const handleSaveMinutes = async (
    meetingId: string,
    minutesNotes: string,
    decisions: MeetingDecision[],
    actionItems: MeetingActionItem[]
  ) => {
    try {
      await setDoc(doc(db, 'companies', companyId, 'meetings', meetingId), {
        minutesNotes,
        decisions,
        actionItems,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      showNotification(isSw ? 'Kumbukumbu na maazimio yamehifadhiwa!' : 'Minutes and action items saved!');
      setActiveMinutesMeeting(null);
    } catch (err) {
      console.error('Error saving minutes:', err);
    }
  };

  // Action item to Task converter
  const handleConvertActionItemToTask = (actionItem: MeetingActionItem, meeting: ScheduledMeeting) => {
    if (!onAddTask) return;
    const now = new Date().toISOString();
    const taskPayload: Omit<OfficeTask, 'id'> = {
      title: `${actionItem.title} (${meeting.title})`,
      description: `Agizo kutoka kwa mkutano wa "${meeting.title}" wa tarehe ${meeting.date}.\nMtekelezaji: ${actionItem.assigneeName}.`,
      assignedToId: actionItem.assigneeId,
      assignedToName: actionItem.assigneeName,
      department: 'Utawala & Uongozi',
      priority: 'high',
      status: 'todo',
      startDate: now.split('T')[0],
      dueDate: actionItem.dueDate,
      createdAt: now,
      progressPercentage: 0,
      checklist: [
        { id: 'step-1', text: actionItem.title, completed: false }
      ],
      tags: ['Mkutano', 'Maazimio', meeting.title.substring(0, 15)],
    };
    onAddTask(taskPayload);
    showNotification(isSw ? 'Agizo limegeuzwa kuwa Jukumu rasmi kwenye Tasks!' : 'Action item converted to Task!');
  };

  return (
    <div className="space-y-6">

      {/* Notification Toast */}
      {notificationMsg && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-white/20 rounded-full text-[11px] font-black uppercase tracking-wider backdrop-blur-md">
              KaziDesk Live Video & Boardroom
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            {isSw ? 'Mikutano ya Video & Kumbukumbu' : 'Live Video Meetings & Minutes'}
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl leading-relaxed">
            {isSw
              ? 'Panga mikutano, unganisha washiriki kwa video bila malipo (Jitsi Meet), rekodi kumbukumbu (minutes), maazimio, na geuza maagizo kuwa kazi rasmi za ofisi.'
              : 'Schedule meetings, join video rooms instantly with Jitsi Meet, document decisions, and automatically turn action items into assigned tasks.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {canManageMeetings && (
            <button
              onClick={() => {
                setEditingMeeting(null);
                setIsCreateModalOpen(true);
              }}
              className="px-5 py-3 bg-white text-emerald-900 hover:bg-emerald-50 rounded-2xl font-black text-xs shadow-lg flex items-center gap-2 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>{isSw ? '+ Panga Mkutano Mpya' : '+ Schedule Meeting'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Top Controls: Search, Filter & Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={isSw ? 'Tafuta mada, ajenda au mwandaaji...' : 'Search title, agenda, organizer...'}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
          >
            <option value="all">{isSw ? 'Hali Zote' : 'All Statuses'}</option>
            <option value="scheduled">{isSw ? 'Imepangwa (Scheduled)' : 'Scheduled'}</option>
            <option value="ongoing">{isSw ? 'Inaendelea (Ongoing)' : 'Ongoing'}</option>
            <option value="completed">{isSw ? 'Imekamilika (Completed)' : 'Completed'}</option>
            <option value="cancelled">{isSw ? 'Imeghairiwa (Cancelled)' : 'Cancelled'}</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'list'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {isSw ? 'Orodha' : 'List'}
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'calendar'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {isSw ? 'Kalenda' : 'Calendar'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="p-16 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <span>{isSw ? 'Inapakia mikutano ya kampuni...' : 'Loading company meetings...'}</span>
        </div>
      ) : filteredMeetings.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
            <Video className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              {isSw ? 'Hakuna Mikutano Iliyopatikana' : 'No Meetings Found'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {isSw
                ? 'Haujapanga mkutano wowote bado. Bonyeza kitufe cha "+ Panga Mkutano Mpya" hapo juu ili kuunda mkutano wa kwanza wa video kwa ofisi yako.'
                : 'No meetings scheduled yet. Click "+ Schedule Meeting" above to start your first company video session.'}
            </p>
          </div>
          {canManageMeetings && (
            <button
              onClick={() => {
                setEditingMeeting(null);
                setIsCreateModalOpen(true);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isSw ? 'Panga Mkutano wa Kwanza' : 'Schedule First Meeting'}</span>
            </button>
          )}
        </div>
      ) : activeTab === 'list' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMeetings.map(meeting => {
            const isToday = meeting.date === new Date().toISOString().split('T')[0];
            const isHost = meeting.organizerId === currentUser.id;

            return (
              <div
                key={meeting.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-5"
              >
                <div className="space-y-3">
                  {/* Status & Date Tag */}
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      meeting.status === 'ongoing' ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 animate-pulse' :
                      meeting.status === 'scheduled' ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30' :
                      meeting.status === 'completed' ? 'bg-slate-500/20 text-slate-600 dark:text-slate-400' :
                      'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                    }`}>
                      {meeting.status === 'ongoing' ? (isSw ? '● Inaendelea Sasa' : '● Live Now') :
                       meeting.status === 'scheduled' ? (isSw ? 'Imepangwa' : 'Scheduled') :
                       meeting.status === 'completed' ? (isSw ? 'Imekamilika' : 'Completed') :
                       (isSw ? 'Imeghairiwa' : 'Cancelled')}
                    </span>

                    <span className={`text-[11px] font-mono font-bold ${isToday ? 'text-emerald-600 font-black' : 'text-slate-400'}`}>
                      {isToday ? (isSw ? 'LEO' : 'TODAY') : meeting.date}
                    </span>
                  </div>

                  {/* Title & Agenda */}
                  <div>
                    <h3 className="font-black text-base text-slate-900 dark:text-white line-clamp-1">
                      {meeting.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {meeting.agenda || (isSw ? 'Bila ajenda maalum.' : 'No agenda specified.')}
                    </p>
                  </div>

                  {/* Time & Location */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl space-y-1.5 text-xs">
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="font-mono font-semibold">{meeting.startTime} - {meeting.endTime}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500">
                      <Video className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span className="truncate">
                        {meeting.locationType === 'online' ? (isSw ? 'Video ya Mtandao (Jitsi Room)' : 'Online Video Room') :
                         meeting.locationType === 'in_person' ? (meeting.locationDetails || 'Ofisini') :
                         `Mseto / Hybrid: ${meeting.locationDetails || 'Ofisini & Online'}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500">
                      <Users className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>{meeting.attendees?.length || 0} {isSw ? 'Washiriki' : 'Attendees'}</span>
                    </div>
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    {/* Join Video Room Button */}
                    <button
                      onClick={() => setActiveVideoMeeting(meeting)}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{isSw ? 'Ingia Mkutano' : 'Join Room'}</span>
                    </button>

                    {/* Copy Link */}
                    <button
                      onClick={() => copyInvite(meeting)}
                      title={isSw ? 'Nakili kiungo cha kualika' : 'Copy invite link'}
                      className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-colors"
                    >
                      {copiedLinkMeetingId === meeting.id ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Share2 className="w-4 h-4" />
                      )}
                    </button>

                    {/* Minutes / Actions Modal Launcher */}
                    <button
                      onClick={() => setActiveMinutesMeeting(meeting)}
                      title={isSw ? 'Kumbukumbu & Maagizo (Minutes)' : 'Minutes & Action Items'}
                      className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-colors"
                    >
                      <FileText className="w-4 h-4 text-indigo-500" />
                    </button>
                  </div>

                  {/* Host Quick Status Controls */}
                  {canManageMeetings && (
                    <div className="flex items-center justify-between text-[11px] pt-1 text-slate-400">
                      <div className="flex items-center gap-1">
                        {meeting.status === 'scheduled' && (
                          <button
                            onClick={() => handleUpdateStatus(meeting, 'ongoing')}
                            className="text-emerald-600 hover:underline font-bold"
                          >
                            {isSw ? 'Anzisha' : 'Start'}
                          </button>
                        )}
                        {meeting.status === 'ongoing' && (
                          <button
                            onClick={() => handleUpdateStatus(meeting, 'completed')}
                            className="text-blue-600 hover:underline font-bold"
                          >
                            {isSw ? 'Kamilisha' : 'Complete'}
                          </button>
                        )}
                        {meeting.status !== 'cancelled' && meeting.status !== 'completed' && (
                          <button
                            onClick={() => handleUpdateStatus(meeting, 'cancelled')}
                            className="text-rose-500 hover:underline ml-2"
                          >
                            {isSw ? 'Ghairi' : 'Cancel'}
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingMeeting(meeting);
                            setIsCreateModalOpen(true);
                          }}
                          className="hover:text-slate-900 dark:hover:text-white"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteMeeting(meeting)}
                          className="hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        /* Calendar View */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <h4 className="font-bold text-sm text-slate-900 dark:text-white">
            {isSw ? 'Kalenda ya Mikutano ya Mwezi Huu' : 'Meetings Calendar'}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredMeetings.map(m => (
              <div key={m.id} className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/60 space-y-2">
                <span className="font-mono text-xs font-bold text-emerald-600 block">{m.date}</span>
                <h5 className="font-bold text-xs text-slate-900 dark:text-white truncate">{m.title}</h5>
                <span className="text-[11px] text-slate-400 block font-mono">{m.startTime} - {m.endTime}</span>
                <button
                  onClick={() => setActiveVideoMeeting(m)}
                  className="w-full py-1.5 bg-emerald-600 text-white rounded-lg text-[10px] font-bold"
                >
                  {isSw ? 'Ingia Video' : 'Join Video'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: EMBEDDED JITSI VIDEO ROOM */}
      {/* =================================================================== */}
      {activeVideoMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-2 sm:p-4">
          <div className="bg-slate-950 rounded-3xl w-full max-w-6xl h-[92vh] flex flex-col overflow-hidden border border-slate-800 shadow-2xl">
            {/* Top Bar */}
            <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center font-bold text-xs">
                  <Video className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-white truncate max-w-md">
                    {activeVideoMeeting.title}
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400">
                    Chumba cha Kampuni: {activeVideoMeeting.videoRoomId}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyInvite(activeVideoMeeting)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{isSw ? 'Alika Washiriki' : 'Invite'}</span>
                </button>
                <button
                  onClick={() => setActiveMinutesMeeting(activeVideoMeeting)}
                  className="px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{isSw ? 'Kumbukumbu' : 'Minutes'}</span>
                </button>
                <a
                  href={activeVideoMeeting.videoJoinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                  title={isSw ? 'Fungua kwenye dirisha jipya' : 'Open in new window'}
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setActiveVideoMeeting(null)}
                  className="p-2 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-xl transition-colors font-bold"
                >
                  {isSw ? 'Ondoka' : 'Leave'}
                </button>
              </div>
            </div>

            {/* Jitsi Meet iFrame */}
            <div className="flex-1 w-full h-full bg-slate-900 relative">
              <iframe
                src={`https://meet.jit.si/${activeVideoMeeting.videoRoomId}#userInfo.displayName="${encodeURIComponent(currentUser.name)}"&config.prejoinPageEnabled=false&config.startWithAudioMuted=false`}
                allow="camera; microphone; fullscreen; display-capture; autoplay"
                className="w-full h-full border-0"
                title={activeVideoMeeting.title}
              />
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: MINUTES & ACTION ITEMS */}
      {/* =================================================================== */}
      {activeMinutesMeeting && (
        <MinutesEditorModal
          meeting={activeMinutesMeeting}
          isSw={isSw}
          employees={employees}
          currentUser={currentUser}
          onClose={() => setActiveMinutesMeeting(null)}
          onSave={handleSaveMinutes}
          onConvertToTask={handleConvertActionItemToTask}
        />
      )}

      {/* =================================================================== */}
      {/* MODAL: CREATE / EDIT MEETING */}
      {/* =================================================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-xl shadow-2xl p-6 border border-slate-200 dark:border-slate-800 my-8">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-base text-slate-900 dark:text-white">
                  {editingMeeting
                    ? (isSw ? 'Hariri Mkutano' : 'Edit Meeting')
                    : (isSw ? 'Panga Mkutano Mpya wa Kampuni' : 'Schedule New Company Meeting')}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setEditingMeeting(null);
                }}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMeeting} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isSw ? 'Mada ya Mkutano (Meeting Title) *' : 'Meeting Title *'}
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  defaultValue={editingMeeting?.title || ''}
                  placeholder={isSw ? 'Mf. Kikao cha Mauzo cha Kila Wiki' : 'e.g. Weekly Sales Alignment'}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isSw ? 'Ajenda Kuu za Mkutano *' : 'Agenda & Key Objectives *'}
                </label>
                <textarea
                  name="agenda"
                  rows={3}
                  required
                  defaultValue={editingMeeting?.agenda || ''}
                  placeholder={isSw ? '1. Kagua takwimu za mwezi\n2. Mkakati wa mauzo Moshi\n3. Maamuzi ya bajeti' : '1. Monthly review\n2. Sales strategy'}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-medium leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isSw ? 'Tarehe *' : 'Date *'}
                  </label>
                  <input
                    type="date"
                    name="date"
                    required
                    defaultValue={editingMeeting?.date || new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isSw ? 'Kuanzia *' : 'Start Time *'}
                  </label>
                  <input
                    type="time"
                    name="startTime"
                    required
                    defaultValue={editingMeeting?.startTime || '10:00'}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isSw ? 'Hadi *' : 'End Time *'}
                  </label>
                  <input
                    type="time"
                    name="endTime"
                    required
                    defaultValue={editingMeeting?.endTime || '11:00'}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isSw ? 'Aina ya Mkutano' : 'Location Type'}
                  </label>
                  <select
                    name="locationType"
                    defaultValue={editingMeeting?.locationType || 'online'}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-medium"
                  >
                    <option value="online">{isSw ? 'Video ya Mtandao (Jitsi Meet)' : 'Online Video (Jitsi Meet)'}</option>
                    <option value="in_person">{isSw ? 'Uso kwa Uso (Ofisini)' : 'In-Person (Office)'}</option>
                    <option value="hybrid">{isSw ? 'Mseto (Hybrid)' : 'Hybrid'}</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isSw ? 'Marudio (Recurrence)' : 'Recurrence'}
                  </label>
                  <select
                    name="recurrence"
                    defaultValue={editingMeeting?.recurrence || 'none'}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-medium"
                  >
                    <option value="none">{isSw ? 'Mara Moja Tu' : 'None / One-Time'}</option>
                    <option value="daily">{isSw ? 'Kila Siku' : 'Daily'}</option>
                    <option value="weekly">{isSw ? 'Kila Wiki' : 'Weekly'}</option>
                    <option value="monthly">{isSw ? 'Kila Mwezi' : 'Monthly'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isSw ? 'Washiriki wa Mkutano (Chagua Wafanyakazi)' : 'Attendees (Select Staff)'}
                </label>
                <div className="max-h-36 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                  {employees.map(emp => (
                    <label key={emp.id} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 p-1.5 rounded-lg">
                      <input
                        type="checkbox"
                        name="attendees"
                        value={emp.id}
                        defaultChecked={editingMeeting?.attendees?.some(a => a.employeeId === emp.id)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="font-bold text-slate-900 dark:text-white">{emp.fullName}</span>
                      <span className="text-[10px] text-slate-400">({emp.roleTitle || emp.department})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setEditingMeeting(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold"
                >
                  {isSw ? 'Ghairi' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md"
                >
                  {editingMeeting ? (isSw ? 'Hifadhi Mabadiliko' : 'Save Changes') : (isSw ? 'Panga Mkutano' : 'Schedule Meeting')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

// ---------------------------------------------------------------------------
// SUB-COMPONENT: MINUTES & ACTION ITEMS EDITOR MODAL
// ---------------------------------------------------------------------------
interface MinutesEditorModalProps {
  meeting: ScheduledMeeting;
  isSw: boolean;
  employees: Employee[];
  currentUser: any;
  onClose: () => void;
  onSave: (meetingId: string, notes: string, decisions: MeetingDecision[], actionItems: MeetingActionItem[]) => void;
  onConvertToTask: (actionItem: MeetingActionItem, meeting: ScheduledMeeting) => void;
}

const MinutesEditorModal: React.FC<MinutesEditorModalProps> = ({
  meeting,
  isSw,
  employees,
  currentUser,
  onClose,
  onSave,
  onConvertToTask,
}) => {
  const [notes, setNotes] = useState(meeting.minutesNotes || '');
  const [decisions, setDecisions] = useState<MeetingDecision[]>(meeting.decisions || []);
  const [actionItems, setActionItems] = useState<MeetingActionItem[]>(meeting.actionItems || []);

  const [newDecisionText, setNewDecisionText] = useState('');
  const [newActionTitle, setNewActionTitle] = useState('');
  const [newActionAssignee, setNewActionAssignee] = useState(employees[0]?.id || '');
  const [newActionDueDate, setNewActionDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });

  const addDecision = () => {
    if (!newDecisionText.trim()) return;
    const newDec: MeetingDecision = {
      id: `DEC-${Date.now()}`,
      decision: newDecisionText.trim(),
      recordedBy: currentUser.name,
      timestamp: new Date().toISOString(),
    };
    setDecisions([...decisions, newDec]);
    setNewDecisionText('');
  };

  const addActionItem = () => {
    if (!newActionTitle.trim()) return;
    const emp = employees.find(e => e.id === newActionAssignee);
    const newAction: MeetingActionItem = {
      id: `ACT-${Date.now()}`,
      meetingId: meeting.id,
      title: newActionTitle.trim(),
      assigneeId: newActionAssignee,
      assigneeName: emp?.fullName || 'Staff Member',
      dueDate: newActionDueDate,
      isCompleted: false,
      createdAt: new Date().toISOString(),
    };
    setActionItems([...actionItems, newAction]);
    setNewActionTitle('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl shadow-2xl p-6 border border-slate-200 dark:border-slate-800 my-8 space-y-5">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-black text-base text-slate-900 dark:text-white">
              {isSw ? 'Kumbukumbu na Maamuzi ya Mkutano' : 'Meeting Minutes & Action Items'}
            </h3>
            <span className="text-xs text-emerald-600 font-bold">{meeting.title}</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">✕</button>
        </div>

        {/* Minutes Textarea */}
        <div className="space-y-1.5 text-xs">
          <label className="font-bold text-slate-700 dark:text-slate-300">
            {isSw ? 'Muhtasari wa Majadiliano (Detailed Minutes Notes)' : 'Discussion Summary'}
          </label>
          <textarea
            rows={4}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder={isSw ? 'Andika muhtasari wa kila ajenda iliyojadiliwa hapa...' : 'Document minutes and discussions here...'}
            className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-medium leading-relaxed"
          />
        </div>

        {/* Decisions Section */}
        <div className="space-y-2 text-xs">
          <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>{isSw ? 'Maamuzi Yaliyofikiwa (Decisions Made)' : 'Decisions Made'}</span>
          </span>
          <div className="flex gap-2">
            <input
              type="text"
              value={newDecisionText}
              onChange={e => setNewDecisionText(e.target.value)}
              placeholder={isSw ? 'Mf. Imekubaliwa kuanza kampeni ya masoko tarehe 15 Machi' : 'e.g. Approved marketing push'}
              className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
            />
            <button
              type="button"
              onClick={addDecision}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl"
            >
              + {isSw ? 'Ongeza' : 'Add'}
            </button>
          </div>
          <div className="space-y-1 max-h-28 overflow-y-auto">
            {decisions.map(d => (
              <div key={d.id} className="p-2 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-lg flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-800 dark:text-slate-200">• {d.decision}</span>
                <span className="text-slate-400 font-mono text-[9px]">{d.recordedBy}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Items Section */}
        <div className="space-y-2 text-xs">
          <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <ListTodo className="w-4 h-4 text-indigo-500" />
            <span>{isSw ? 'Maagizo ya Utekelezaji (Action Items)' : 'Action Items'}</span>
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              value={newActionTitle}
              onChange={e => setNewActionTitle(e.target.value)}
              placeholder={isSw ? 'Agizo la kazi...' : 'Action task...'}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 sm:col-span-1"
            />
            <select
              value={newActionAssignee}
              onChange={e => setNewActionAssignee(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-medium"
            >
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.fullName}</option>
              ))}
            </select>
            <div className="flex gap-1.5">
              <input
                type="date"
                value={newActionDueDate}
                onChange={e => setNewActionDueDate(e.target.value)}
                className="w-full px-2 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-[11px]"
              />
              <button
                type="button"
                onClick={addActionItem}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shrink-0"
              >
                +
              </button>
            </div>
          </div>

          <div className="space-y-1.5 max-h-36 overflow-y-auto pt-1">
            {actionItems.map(act => (
              <div key={act.id} className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <strong className="text-slate-900 dark:text-white block font-bold">{act.title}</strong>
                  <span className="text-[10px] text-slate-500">Mtekelezaji: {act.assigneeName} · Mwisho: {act.dueDate}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onConvertToTask(act, meeting)}
                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 rounded-lg text-[10px] font-bold shrink-0 self-start sm:self-auto flex items-center gap-1"
                >
                  <span>Geuza Kuwa Task</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2 text-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl"
          >
            {isSw ? 'Funga' : 'Close'}
          </button>
          <button
            type="button"
            onClick={() => onSave(meeting.id, notes, decisions, actionItems)}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md"
          >
            {isSw ? 'Hifadhi Kumbukumbu' : 'Save Minutes'}
          </button>
        </div>
      </div>
    </div>
  );
};
