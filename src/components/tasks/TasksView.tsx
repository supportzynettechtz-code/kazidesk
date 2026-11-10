import React, { useState } from 'react';
import { 
  KanbanSquare, 
  ListFilter, 
  Plus, 
  Calendar, 
  CheckCircle2, 
  Circle, 
  Clock, 
  User, 
  AlertCircle, 
  ChevronRight, 
  ChevronLeft,
  FileText,
  Send,
  CheckSquare
} from 'lucide-react';
import { translations } from '../../utils/translations';
import { 
  OfficeTask, 
  TaskStatus, 
  TaskPriority, 
  Department, 
  Employee, 
  DailyWorkLog, 
  CurrentUser 
} from '../../types/office';
import { formatDate } from '../../utils/formatters';

interface TasksViewProps {
  lang: 'sw' | 'en';
  currentUser: CurrentUser;
  employees: Employee[];
  tasks: OfficeTask[];
  onAddTask: (task: Omit<OfficeTask, 'id' | 'createdAt'>) => void;
  onUpdateTaskStatus: (taskId: string, status: TaskStatus) => void;
  onToggleChecklistItem: (taskId: string, checkId: string) => void;
  onUpdateTaskProgress: (taskId: string, progress: number) => void;
  dailyLogs: DailyWorkLog[];
  onSubmitDailyLog: (log: Omit<DailyWorkLog, 'id' | 'submittedAt'>) => void;
}

export const TasksView: React.FC<TasksViewProps> = ({
  lang,
  currentUser,
  employees,
  tasks,
  onAddTask,
  onUpdateTaskStatus,
  onToggleChecklistItem,
  onUpdateTaskProgress,
  dailyLogs,
  onSubmitDailyLog
}) => {
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<'kanban' | 'list' | 'logs'>('kanban');
  const [selectedTask, setSelectedTask] = useState<OfficeTask | null>(null);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  
  // Filter states
  const [filterDept, setFilterDept] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  // New Task Form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState<Department>('Utawala & Uongozi');
  const [assignedToId, setAssignedToId] = useState(employees[0]?.id || '');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [checklistItemsStr, setChecklistItemsStr] = useState('');

  // Daily Work Log Form
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [logSummary, setLogSummary] = useState('');
  const [logCompleted, setLogCompleted] = useState('');
  const [logInProgress, setLogInProgress] = useState('');
  const [logBlockers, setLogBlockers] = useState('');
  const [logHours, setLogHours] = useState(8);

  const filteredTasks = tasks.filter(t => {
    const matchesDept = filterDept === 'all' || t.department === filterDept;
    const matchesPriority = filterPriority === 'all' || t.priority === filterPriority;
    return matchesDept && matchesPriority;
  });

  const columns: { id: TaskStatus; title: string; color: string }[] = [
    { id: 'todo', title: t.tasks.colTodo, color: 'border-slate-300 dark:border-slate-700' },
    { id: 'in_progress', title: t.tasks.colInProgress, color: 'border-blue-500' },
    { id: 'review', title: t.tasks.colReview, color: 'border-amber-500' },
    { id: 'completed', title: t.tasks.colCompleted, color: 'border-emerald-500' },
  ];

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !dueDate) return;

    const assignedEmp = employees.find(e => e.id === assignedToId);
    const checklist = checklistItemsStr
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean)
      .map((text, idx) => ({ id: `chk_${Date.now()}_${idx}`, text, completed: false }));

    onAddTask({
      title,
      description,
      department,
      assignedToId,
      assignedToName: assignedEmp?.fullName || 'Haijapangiwa',
      priority,
      status: 'todo',
      startDate: new Date().toISOString().split('T')[0],
      dueDate,
      progressPercentage: 0,
      checklist,
      tags: [department.split(' ')[0]],
    });

    setIsNewTaskModalOpen(false);
    setTitle('');
    setDescription('');
    setChecklistItemsStr('');
  };

  const handleCreateDailyLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logCompleted) return;

    onSubmitDailyLog({
      employeeId: currentUser.id,
      employeeName: currentUser.name,
      date: new Date().toISOString().split('T')[0],
      summary: logSummary || 'Ripoti ya Kazi ya Siku',
      tasksCompleted: logCompleted,
      inProgress: logInProgress,
      blockers: logBlockers,
      hoursSpent: Number(logHours),
    });

    setIsLogModalOpen(false);
    setLogSummary('');
    setLogCompleted('');
    setLogInProgress('');
    setLogBlockers('');
  };

  const getNextStatus = (curr: TaskStatus): TaskStatus | null => {
    if (curr === 'todo') return 'in_progress';
    if (curr === 'in_progress') return 'review';
    if (curr === 'review') return 'completed';
    return null;
  };

  const getPrevStatus = (curr: TaskStatus): TaskStatus | null => {
    if (curr === 'completed') return 'review';
    if (curr === 'review') return 'in_progress';
    if (curr === 'in_progress') return 'todo';
    return null;
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t.tasks.title}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t.tasks.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsLogModalOpen(true)}
            className="px-3.5 py-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-xs flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5 text-blue-600" />
            <span>{t.tasks.addDailyLog}</span>
          </button>

          <button
            onClick={() => setIsNewTaskModalOpen(true)}
            className="px-3.5 py-2 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>{t.tasks.newTask}</span>
          </button>
        </div>
      </div>

      {/* Tabs Row: Kanban vs List vs Daily Logs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab('kanban')}
            className={`pb-2 text-xs font-bold transition-colors relative flex items-center gap-1.5 ${
              activeTab === 'kanban' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <KanbanSquare className="w-4 h-4" />
            <span>{t.tasks.kanbanTab}</span>
            {activeTab === 'kanban' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 dark:bg-emerald-400" />}
          </button>

          <button
            onClick={() => setActiveTab('list')}
            className={`pb-2 text-xs font-bold transition-colors relative flex items-center gap-1.5 ${
              activeTab === 'list' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ListFilter className="w-4 h-4" />
            <span>{t.tasks.listTab}</span>
            {activeTab === 'list' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 dark:bg-emerald-400" />}
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`pb-2 text-xs font-bold transition-colors relative flex items-center gap-1.5 ${
              activeTab === 'logs' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{t.tasks.dailyLogsTab}</span>
            {activeTab === 'logs' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 dark:bg-emerald-400" />}
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <select
            value={filterDept}
            onChange={e => setFilterDept(e.target.value)}
            className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            <option value="all">Idara Zote</option>
            <option value="Utawala & Uongozi">Utawala</option>
            <option value="Rasilimali Watu (HR)">HR</option>
            <option value="Fedha & Uhasibu">Fedha</option>
            <option value="Teknolojia (IT & Mifumo)">IT & Mifumo</option>
            <option value="Sheria & Mikataba">Sheria</option>
            <option value="Uendeshaji & Usafirishaji">Uendeshaji</option>
            <option value="Masoko & Mauzo">Masoko</option>
          </select>

          <select
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value)}
            className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            <option value="all">Kipaumbele Chote</option>
            <option value="urgent">Dharura</option>
            <option value="high">Kipaumbele cha Juu</option>
            <option value="medium">Kawaida</option>
            <option value="low">Chini</option>
          </select>
        </div>
      </div>

      {/* View 1: Interactive Kanban Board */}
      {activeTab === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map(col => {
            const colTasks = filteredTasks.filter(t => t.status === col.id);
            return (
              <div 
                key={col.id} 
                className="bg-slate-100/60 dark:bg-slate-800/40 rounded-xl p-3 flex flex-col min-h-[480px] border border-slate-200/80 dark:border-slate-800"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-700/60">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {col.title}
                    </span>
                    <span className="text-[11px] font-mono px-1.5 py-0.2 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded font-semibold">
                      {colTasks.length}
                    </span>
                  </div>
                </div>

                {/* Cards List */}
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {colTasks.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-xs italic">
                      Hakuna kazi hapa.
                    </div>
                  ) : (
                    colTasks.map(task => {
                      const completedCount = task.checklist.filter(c => c.completed).length;
                      const totalCheck = task.checklist.length;
                      const prev = getPrevStatus(task.status);
                      const next = getNextStatus(task.status);

                      return (
                        <div
                          key={task.id}
                          className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-2.5"
                        >
                          {/* Priority & Dept */}
                          <div className="flex items-center justify-between text-[11px]">
                            <span className={`font-bold uppercase tracking-wider ${
                              task.priority === 'urgent' ? 'text-rose-600 dark:text-rose-400' :
                              task.priority === 'high' ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400'
                            }`}>
                              {task.priority === 'urgent' ? 'Dharura' : task.priority === 'high' ? 'Juu' : 'Kawaida'}
                            </span>
                            <span className="text-slate-400">{task.department.split(' ')[0]}</span>
                          </div>

                          {/* Task Title */}
                          <div 
                            onClick={() => setSelectedTask(task)}
                            className="text-xs font-bold text-slate-900 dark:text-white hover:text-emerald-600 cursor-pointer line-clamp-2"
                          >
                            {task.title}
                          </div>

                          {/* Progress bar */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                              <span>Maendeleo</span>
                              <span>{task.progressPercentage}%</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                              <div 
                                className="bg-emerald-600 h-full rounded-full transition-all"
                                style={{ width: `${task.progressPercentage}%` }}
                              />
                            </div>
                          </div>

                          {/* Footer: Assignee & Checklist */}
                          <div className="pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                            <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
                              {task.assignedToName}
                            </span>
                            {totalCheck > 0 && (
                              <span className="font-mono text-slate-400">
                                {completedCount}/{totalCheck}
                              </span>
                            )}
                          </div>

                          {/* Due Date & Status Advancers */}
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{formatDate(task.dueDate, lang)}</span>
                            </span>

                            <div className="flex items-center gap-1">
                              {prev && (
                                <button
                                  onClick={() => onUpdateTaskStatus(task.id, prev)}
                                  className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300"
                                  title="Rudi hatua iliyopita"
                                >
                                  <ChevronLeft className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {next && (
                                <button
                                  onClick={() => onUpdateTaskStatus(task.id, next)}
                                  className="p-1 rounded bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 font-bold"
                                  title="Sogeza hatua inayofuata"
                                >
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                        </div>
                      );
                    })
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* View 2: List Table */}
      {activeTab === 'list' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase text-[11px]">
                  <th className="py-3 px-4">Jukumu</th>
                  <th className="py-3 px-4">Idara</th>
                  <th className="py-3 px-4">Msimamizi</th>
                  <th className="py-3 px-4">Kipaumbele</th>
                  <th className="py-3 px-4">Hali</th>
                  <th className="py-3 px-4">Tarehe ya Ukomo</th>
                  <th className="py-3 px-4">Maendeleo</th>
                  <th className="py-3 px-4 text-right">Vitendo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {filteredTasks.map(task => (
                  <tr key={task.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4">
                      <div 
                        onClick={() => setSelectedTask(task)}
                        className="font-bold text-slate-900 dark:text-white cursor-pointer hover:text-emerald-600"
                      >
                        {task.title}
                      </div>
                      <div className="text-[11px] text-slate-400 line-clamp-1">{task.description}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{task.department}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">{task.assignedToName}</td>
                    <td className="py-3 px-4">
                      <span className={`text-[11px] font-bold uppercase ${
                        task.priority === 'urgent' ? 'text-rose-600' :
                        task.priority === 'high' ? 'text-amber-600' : 'text-blue-600'
                      }`}>
                        {task.priority === 'urgent' ? 'Dharura' : task.priority === 'high' ? 'Juu' : 'Kawaida'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold">
                      {task.status === 'todo' ? 'Kazi Mpya' :
                       task.status === 'in_progress' ? 'Inafanyika' :
                       task.status === 'review' ? 'Inapitiwa' : 'Imekamilika'}
                    </td>
                    <td className="py-3 px-4 font-mono">{formatDate(task.dueDate, lang)}</td>
                    <td className="py-3 px-4 font-mono font-bold">{task.progressPercentage}%</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedTask(task)}
                        className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                      >
                        Fungua
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View 3: Daily Work Logs */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Kumbukumbu za Ripoti za Kazi za Kila Siku (Daily Standups)
                </h3>
                <p className="text-xs text-slate-500">
                  Wafanyakazi wanawasilisha muhtasari wa kazi zilizokamilika, vikwazo, na mpango wa siku inayofuata.
                </p>
              </div>
              <button
                onClick={() => setIsLogModalOpen(true)}
                className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
              >
                + Wasilisha Ripoti Mpya
              </button>
            </div>

            <div className="space-y-3">
              {dailyLogs.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  Hakuna ripoti za kazi zilizowasilishwa bado. Bonyeza kitufe hapo juu kuandika ya kwanza.
                </div>
              ) : (
                dailyLogs.map(log => (
                  <div key={log.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">{log.employeeName}</span>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-500">{formatDate(log.date, lang)}</span>
                      </div>
                      <span className="font-mono text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
                        {log.hoursSpent} hrs
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                      <div className="space-y-1">
                        <div className="font-semibold text-slate-700 dark:text-slate-300">Yaliyokamilika Leo:</div>
                        <p className="text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                          {log.tasksCompleted}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <div className="font-semibold text-slate-700 dark:text-slate-300">Inaendelea / Changamoto:</div>
                        <p className="text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                          {log.inProgress || log.blockers || 'Hakuna kikwazo chochote.'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="text-xs font-mono font-bold text-emerald-600">{selectedTask.id}</span>
              <button 
                onClick={() => setSelectedTask(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{selectedTask.title}</h3>
              <p className="text-xs text-slate-500 mt-1">{selectedTask.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Msimamizi:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedTask.assignedToName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Ukomo:</span>
                <span className="font-bold font-mono text-slate-800 dark:text-slate-200">{formatDate(selectedTask.dueDate, lang)}</span>
              </div>
            </div>

            {/* Checklist */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                Orodha ya Hatua (Checklist):
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {selectedTask.checklist.map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onToggleChecklistItem(selectedTask.id, item.id);
                      setSelectedTask(prev => {
                        if (!prev) return null;
                        const updatedChecklist = prev.checklist.map(c => c.id === item.id ? { ...c, completed: !c.completed } : c);
                        const completed = updatedChecklist.filter(c => c.completed).length;
                        const pct = Math.round((completed / updatedChecklist.length) * 100);
                        return { ...prev, checklist: updatedChecklist, progressPercentage: pct };
                      });
                    }}
                    className="w-full text-left p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 flex items-center gap-2 text-xs"
                  >
                    {item.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <span className={item.completed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'}>
                      {item.text}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Status Adjuster */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="text-xs text-slate-500">
                Hali: <span className="font-bold text-slate-900 dark:text-white capitalize">{selectedTask.status}</span>
              </div>
              <button
                onClick={() => {
                  onUpdateTaskStatus(selectedTask.id, 'completed');
                  onUpdateTaskProgress(selectedTask.id, 100);
                  setSelectedTask(null);
                }}
                className="px-3 py-1.5 text-xs font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                Kamilisha Kazi (100%)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Task Modal */}
      {isNewTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden p-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Panga Jukumu Jipya la Ofisi</h3>
              <button onClick={() => setIsNewTaskModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Kichwa cha Kazi:</label>
                <input
                  type="text"
                  required
                  placeholder="Mfano: Kukamilisha Ukaguzi wa Hesabu za Robo ya Kwanza..."
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Maelezo Kamili:</label>
                <textarea
                  rows={2}
                  placeholder="Eleza malengo, deliverables na maelekezo ya kiutendaji..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Idara:</label>
                  <select
                    value={department}
                    onChange={e => setDepartment(e.target.value as Department)}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Utawala & Uongozi">Utawala & Uongozi</option>
                    <option value="Rasilimali Watu (HR)">Rasilimali Watu (HR)</option>
                    <option value="Fedha & Uhasibu">Fedha & Uhasibu</option>
                    <option value="Teknolojia (IT & Mifumo)">Teknolojia (IT & Mifumo)</option>
                    <option value="Uendeshaji & Usafirishaji">Uendeshaji & Usafirishaji</option>
                    <option value="Masoko & Mauzo">Masoko & Mauzo</option>
                    <option value="Sheria & Mikataba">Sheria & Mikataba</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Mtekelezaji (Assignee):</label>
                  <select
                    value={assignedToId}
                    onChange={e => setAssignedToId(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>{e.fullName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Kipaumbele:</label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as TaskPriority)}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="urgent">Dharura / Muhimu Sana</option>
                    <option value="high">Kipaumbele cha Juu</option>
                    <option value="medium">Kawaida</option>
                    <option value="low">Chini</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Tarehe ya Ukomo:</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                  Hatua Ndogo (Checklist - Weka moja kwa mstari):
                </label>
                <textarea
                  rows={2}
                  placeholder="Mfano:&#10;Kukusanya risiti&#10;Kuingiza namba kwenye Excel&#10;Kutuma ripoti"
                  value={checklistItemsStr}
                  onChange={e => setChecklistItemsStr(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-[11px]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewTaskModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 dark:text-slate-300"
                >
                  Ghairi
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  Hifadhi Kazi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Daily Work Log Modal */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden p-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Wasilisha Ripoti ya Kazi ya Leo</h3>
              <button onClick={() => setIsLogModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateDailyLog} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Mada / Muhtasari wa Leo:</label>
                <input
                  type="text"
                  placeholder="Mfano: Kukamilisha malipo na matengenezo ya mifumo"
                  value={logSummary}
                  onChange={e => setLogSummary(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Ulichokamilisha Leo (Done):</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Eleza vitu maalum ulivyovifanya leo..."
                  value={logCompleted}
                  onChange={e => setLogCompleted(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Kinachoendelea / Mpango wa Kesho:</label>
                <textarea
                  rows={2}
                  placeholder="Kazi inayoendelea au utakayoanza kesho asubuhi..."
                  value={logInProgress}
                  onChange={e => setLogInProgress(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Vikwazo au Changamoto (Kama vipo):</label>
                  <input
                    type="text"
                    placeholder="Mfano: Seva ilichelewa kujibu..."
                    value={logBlockers}
                    onChange={e => setLogBlockers(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Masaa Uliyofanya Kazi:</label>
                  <input
                    type="number"
                    min={1}
                    max={16}
                    value={logHours}
                    onChange={e => setLogHours(Number(e.target.value))}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 dark:text-slate-300"
                >
                  Ghairi
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  Wasilisha Ripoti
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
