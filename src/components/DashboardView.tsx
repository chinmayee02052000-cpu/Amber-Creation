import React, { useState, useEffect, useRef } from "react";
import { 
  CheckSquare, 
  Clock, 
  Hourglass, 
  AlertOctagon, 
  ArrowUpRight, 
  Link2, 
  ExternalLink, 
  Plus, 
  FileText, 
  Sparkles, 
  User as UserIcon,
  ChevronRight,
  BookmarkCheck,
  Zap,
  MoreVertical,
  Check,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  HelpCircle
} from "lucide-react";
import { Task, User, PrivateNote, AuditLog, ChecklistItem, TaskStatus, TaskPriority } from "../types";

interface DashboardViewProps {
  tasks: Task[];
  users: User[];
  currentUser: User;
  privateNote: PrivateNote;
  auditLogs: AuditLog[];
  onSaveNote: (note: { content: string; checklist: ChecklistItem[] }) => Promise<void>;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => Promise<void>;
  onUpdateTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  onOpenCreateTask: () => void;
  onNavigate: (view: string) => void;
}

export default function DashboardView({
  tasks,
  users,
  currentUser,
  privateNote,
  auditLogs,
  onSaveNote,
  onEditTask,
  onDeleteTask,
  onUpdateTaskStatus,
  onOpenCreateTask,
  onNavigate
}: DashboardViewProps) {
  // Search state inside Dashboard Today's Tasks
  const [taskSearch, setTaskSearch] = useState("");
  
  // Note local states (for instant UI feel, debounced / auto-saved)
  const [noteContent, setNoteContent] = useState(privateNote?.content || "");
  const [checklist, setChecklist] = useState<ChecklistItem[]>(privateNote?.checklist || []);
  const [newCheckItem, setNewCheckItem] = useState("");
  const autoSaveTimerRef = useRef<any>(null);

  useEffect(() => {
    setNoteContent(privateNote?.content || "");
    setChecklist(privateNote?.checklist || []);
  }, [privateNote]);

  // Auto-save logic (debounced)
  const triggerAutoSave = (newContent: string, newCheck: ChecklistItem[]) => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      onSaveNote({ content: newContent, checklist: newCheck });
    }, 1000); // 1s auto-save
  };

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNoteContent(val);
    triggerAutoSave(val, checklist);
  };

  const handleToggleChecklist = (id: string) => {
    const updated = checklist.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    setChecklist(updated);
    triggerAutoSave(noteContent, updated);
  };

  const handleAddChecklist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCheckItem.trim()) return;
    const newItem: ChecklistItem = {
      id: "chk-" + Math.random().toString(36).substring(2, 9),
      text: newCheckItem.trim(),
      completed: false
    };
    const updated = [...checklist, newItem];
    setChecklist(updated);
    setNewCheckItem("");
    triggerAutoSave(noteContent, updated);
  };

  const handleDeleteChecklistItem = (id: string) => {
    const updated = checklist.filter(item => item.id !== id);
    setChecklist(updated);
    triggerAutoSave(noteContent, updated);
  };

  // Task filtering
  const todayStr = new Date().toISOString().split('T')[0];
  const userTasks = currentUser.role === 'Admin' || currentUser.role === 'Manager' 
    ? tasks 
    : tasks.filter(t => t.assignTo === currentUser.id);

  // Stats calculation
  const totalAssigned = userTasks.length;
  const completedCount = userTasks.filter(t => t.status === "Completed").length;
  const pendingCount = userTasks.filter(t => t.status === "Pending").length;
  const kamCount = userTasks.filter(t => t.status === "Waiting on KAM").length;
  const overdueCount = userTasks.filter(t => {
    const isPast = t.dueDate < todayStr;
    return isPast && t.status !== "Completed";
  }).length;

  // Filter tasks based on Search
  const filteredTasks = userTasks.filter(t => {
    const term = taskSearch.toLowerCase();
    const assigneeName = users.find(u => u.id === t.assignTo)?.name || "";
    const creatorName = users.find(u => u.id === t.assignedBy)?.name || "";
    return (
      t.title.toLowerCase().includes(term) ||
      t.comment.toLowerCase().includes(term) ||
      t.priority.toLowerCase().includes(term) ||
      t.status.toLowerCase().includes(term) ||
      assigneeName.toLowerCase().includes(term) ||
      creatorName.toLowerCase().includes(term) ||
      t.freshdeskLink.toLowerCase().includes(term)
    );
  });

  // Sort: Urgent tasks pinned at top, then by priority (High -> Medium -> Low), then status
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const priorityWeight = { Urgent: 4, High: 3, Medium: 2, Low: 1 };
    
    // Urgent first
    if (a.priority === "Urgent" && b.priority !== "Urgent") return -1;
    if (a.priority !== "Urgent" && b.priority === "Urgent") return 1;

    // Remaining by weight
    return priorityWeight[b.priority] - priorityWeight[a.priority];
  });

  // Recent activity
  const recentLogs = auditLogs.slice(0, 5);

  // Status colors helper
  const getStatusStyle = (status: TaskStatus) => {
    switch (status) {
      case "Completed": return "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400 border border-green-200/40";
      case "Working": return "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-200/40";
      case "Waiting on KAM": return "bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400 border border-purple-200/40";
      case "Pending": return "bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400 border border-orange-200/40";
      case "Need Help": return "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border border-red-200/40";
      default: return "bg-gray-50 text-gray-700 dark:bg-neutral-800 dark:text-neutral-400 border border-gray-200/30";
    }
  };

  const getPriorityStyle = (priority: TaskPriority) => {
    switch (priority) {
      case "Urgent": return "bg-red-500 text-white font-bold animate-pulse px-2 py-0.5 rounded text-[10px]";
      case "High": return "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 px-2 py-0.5 rounded text-[10px] font-medium";
      case "Medium": return "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400 px-2 py-0.5 rounded text-[10px] font-medium";
      default: return "bg-gray-100 text-gray-700 dark:bg-neutral-800 dark:text-neutral-400 px-2 py-0.5 rounded text-[10px]";
    }
  };

  // Completion Rate calculation
  const completionRate = totalAssigned > 0 ? Math.round((completedCount / totalAssigned) * 100) : 0;

  return (
    <div className="space-y-6 max-w-full" id="dashboard-view-main">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-150 dark:border-neutral-800 pb-5">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            Workspace Desk <Sparkles className="w-5 h-5 text-[#FF6B00]" />
          </h2>
          <p className="text-sm text-gray-500 dark:text-neutral-400 font-medium">
            Operational schedule for the {currentUser.role} Creation Unit.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {(currentUser.role === 'Admin' || currentUser.role === 'Manager') && (
            <button
              onClick={onOpenCreateTask}
              className="flex items-center space-x-2 bg-[#FF6B00] text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-[#FF6B00]/15 hover:bg-[#FF8A3D] transition-all duration-200"
              id="dash-create-task-btn"
            >
              <Plus className="w-4 h-4" />
              <span>Create Task</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4" id="dashboard-summary-cards">
        
        {/* Total Assigned */}
        <div className="bg-white dark:bg-[#1C1D21] p-5 rounded-2xl border border-gray-150 dark:border-neutral-800 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-wider block mb-1">
              {currentUser.role === 'Admin' || currentUser.role === 'Manager' ? "Assigned Today" : "My Tasks"}
            </span>
            <span className="text-2xl font-extrabold text-gray-900 dark:text-white leading-none">
              {totalAssigned}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <CheckSquare className="w-5 h-5" />
          </div>
        </div>

        {/* Completed */}
        <div className="bg-white dark:bg-[#1C1D21] p-5 rounded-2xl border border-gray-150 dark:border-neutral-800 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-wider block mb-1">
              Completed
            </span>
            <span className="text-2xl font-extrabold text-green-600 dark:text-green-400 leading-none">
              {completedCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-950/30 flex items-center justify-center text-green-600 dark:text-green-400">
            <BookmarkCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Pending */}
        <div className="bg-white dark:bg-[#1C1D21] p-5 rounded-2xl border border-gray-150 dark:border-neutral-800 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-wider block mb-1">
              Pending
            </span>
            <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-500 leading-none">
              {pendingCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-600 dark:text-amber-500">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Waiting on KAM */}
        <div className="bg-white dark:bg-[#1C1D21] p-5 rounded-2xl border border-gray-150 dark:border-neutral-800 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-wider block mb-1">
              Waiting on KAM
            </span>
            <span className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 leading-none">
              {kamCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Hourglass className="w-5 h-5" />
          </div>
        </div>

        {/* Overdue */}
        <div className="bg-white dark:bg-[#1C1D21] p-5 rounded-2xl border border-gray-150 dark:border-neutral-800 col-span-2 lg:col-span-1 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-wider block mb-1">
              Overdue
            </span>
            <span className={`text-2xl font-extrabold leading-none ${overdueCount > 0 ? "text-red-500 animate-pulse" : "text-gray-950 dark:text-white"}`}>
              {overdueCount}
            </span>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${overdueCount > 0 ? "bg-red-50 text-red-500 animate-bounce" : "bg-gray-50 text-gray-400 dark:bg-neutral-800"}`}>
            <AlertOctagon className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Main Column Grid (Table on Left, Sidebar Widgets on Right) */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Left Side: Tasks Table List (Spans 3 Columns) */}
        <div className="xl:col-span-3 space-y-6">
          <div className="bg-white dark:bg-[#1C1D21] rounded-2xl border border-gray-150 dark:border-neutral-800 shadow-xs overflow-hidden flex flex-col">
            
            {/* Table Control Header */}
            <div className="p-5 border-b border-gray-100 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base text-gray-900 dark:text-white">
                  Today's Operational Board
                </h3>
                <span className="text-xs bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-neutral-400 px-2 py-0.5 rounded-full font-bold">
                  {sortedTasks.length} Live
                </span>
              </div>

              {/* In-desk Search */}
              <div className="relative max-w-xs w-full">
                <input
                  type="text"
                  placeholder="Quick search on table..."
                  value={taskSearch}
                  onChange={(e) => setTaskSearch(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#121316] text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 pl-8 pr-3.5 py-2 rounded-lg border border-gray-250 dark:border-neutral-800 focus:outline-none focus:ring-1 focus:ring-[#FF6B00] focus:bg-white transition-all"
                  id="dashboard-table-search"
                />
                <Search className="w-3.5 h-3.5 text-gray-400 dark:text-neutral-500 absolute left-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* Today's Tasks Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse" id="dashboard-tasks-table">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-neutral-800 text-[11px] font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-wider bg-gray-50/50 dark:bg-[#17181C]">
                    <th className="px-6 py-3">Priority</th>
                    <th className="px-6 py-3">Task Type</th>
                    <th className="px-6 py-3">{currentUser.role === 'Admin' || currentUser.role === 'Manager' ? "Assignee" : "Assigned By"}</th>
                    <th className="px-6 py-3 text-center">Freshdesk</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Due Date</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-neutral-800 text-sm">
                  {sortedTasks.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-16 text-gray-400 dark:text-neutral-500 font-medium">
                        No active tasks found matching the operational filter.
                      </td>
                    </tr>
                  ) : (
                    sortedTasks.map((t) => {
                      const isOverdue = t.dueDate < todayStr && t.status !== "Completed";
                      const assigneeUser = users.find(u => u.id === t.assignTo);
                      const creatorUser = users.find(u => u.id === t.assignedBy);

                      return (
                        <tr 
                          key={t.id} 
                          className={`hover:bg-gray-50/50 dark:hover:bg-neutral-800/10 transition-colors ${
                            t.priority === 'Urgent' ? 'bg-[#FF6B00]/2 dark:bg-[#FF6B00]/4' : ''
                          }`}
                          id={`task-row-${t.id}`}
                        >
                          {/* Priority */}
                          <td className="px-6 py-4.5 whitespace-nowrap">
                            <span className={getPriorityStyle(t.priority)}>
                              {t.priority}
                            </span>
                          </td>

                          {/* Task Type */}
                          <td className="px-6 py-4.5">
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {t.title}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-neutral-400 max-w-xs truncate font-normal">
                              {t.comment || "No detail"}
                            </div>
                          </td>

                          {/* Assigned By/To */}
                          <td className="px-6 py-4.5 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center font-bold text-xs text-gray-700 dark:text-white">
                                {(currentUser.role === 'Admin' || currentUser.role === 'Manager' ? assigneeUser : creatorUser)?.name?.charAt(0) || "U"}
                              </div>
                              <span className="text-xs font-semibold text-gray-800 dark:text-neutral-300">
                                {(currentUser.role === 'Admin' || currentUser.role === 'Manager' ? assigneeUser : creatorUser)?.name || "System"}
                              </span>
                            </div>
                          </td>

                          {/* Freshdesk */}
                          <td className="px-6 py-4.5 text-center whitespace-nowrap">
                            {t.freshdeskLink ? (
                              <a 
                                href={t.freshdeskLink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center space-x-1.5 text-[#FF6B00] hover:text-[#FF8A3D] font-bold text-xs bg-[#FF6B00]/5 dark:bg-[#FF6B00]/10 px-2.5 py-1.5 rounded-lg border border-[#FF6B00]/10"
                                title="Open Ticket on Freshdesk"
                                id={`freshdesk-btn-${t.id}`}
                              >
                                <Link2 className="w-3.5 h-3.5" />
                                <span>Ticket</span>
                              </a>
                            ) : (
                              <span className="text-xs text-gray-400 dark:text-neutral-600 font-normal">None</span>
                            )}
                          </td>

                          {/* Status Select / Badge */}
                          <td className="px-6 py-4.5 whitespace-nowrap">
                            <select
                              value={t.status}
                              onChange={(e) => onUpdateTaskStatus(t.id, e.target.value as TaskStatus)}
                              className={`text-xs font-bold rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer ${getStatusStyle(t.status)}`}
                              id={`task-status-select-${t.id}`}
                            >
                              <option value="Not Started">Not Started</option>
                              <option value="Working">Working</option>
                              <option value="Need Help">Need Help</option>
                              <option value="Waiting on KAM">Waiting on KAM</option>
                              <option value="Pending">Pending</option>
                              <option value="Completed">Completed</option>
                            </select>
                          </td>

                          {/* Due Date */}
                          <td className="px-6 py-4.5 whitespace-nowrap text-xs">
                            <span className={`font-semibold ${isOverdue ? "text-red-500 font-bold" : "text-gray-700 dark:text-neutral-400"}`}>
                              {new Date(t.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                            {isOverdue && (
                              <span className="ml-1 text-[9px] bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 px-1 py-0.5 rounded font-bold uppercase tracking-wider">Overdue</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end space-x-2">
                              {(currentUser.role === 'Admin' || currentUser.role === 'Manager') && (
                                <>
                                  <button
                                    onClick={() => onEditTask(t)}
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
                                    title="Edit Task"
                                    id={`edit-task-btn-${t.id}`}
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => onDeleteTask(t.id)}
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                                    title="Delete Task"
                                    id={`delete-task-btn-${t.id}`}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Widgets Row: Status Distribution & Completion rate */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Status Distribution */}
            <div className="bg-white dark:bg-[#1C1D21] p-5 rounded-2xl border border-gray-150 dark:border-neutral-800 shadow-xs flex flex-col">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-4">
                Operational Queue Distribution
              </h3>
              
              <div className="space-y-3.5 flex-1 flex flex-col justify-center">
                {/* Visual Bar chart distribution */}
                {[
                  { label: "Completed", count: userTasks.filter(t => t.status === "Completed").length, color: "bg-green-500" },
                  { label: "Working", count: userTasks.filter(t => t.status === "Working").length, color: "bg-blue-500" },
                  { label: "Waiting on KAM", count: userTasks.filter(t => t.status === "Waiting on KAM").length, color: "bg-purple-500" },
                  { label: "Pending / Need Help", count: userTasks.filter(t => t.status === "Pending" || t.status === "Need Help").length, color: "bg-orange-500" },
                  { label: "Not Started", count: userTasks.filter(t => t.status === "Not Started").length, color: "bg-gray-400" },
                ].map((item, idx) => {
                  const pct = totalAssigned > 0 ? (item.count / totalAssigned) * 100 : 0;
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-gray-700 dark:text-neutral-400">{item.label}</span>
                        <span className="text-gray-900 dark:text-white font-mono">{item.count} ({Math.round(pct)}%)</span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                        <div className={`h-full ${item.color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Activity Mini log & completion rate stats combined */}
            <div className="bg-white dark:bg-[#1C1D21] p-5 rounded-2xl border border-gray-150 dark:border-neutral-800 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-4 flex items-center justify-between">
                  <span>Completion Health</span>
                  <span className="text-xs text-gray-400 font-normal">Real-time KPI</span>
                </h3>

                <div className="flex items-center space-x-6 p-4 rounded-xl bg-gray-50 dark:bg-neutral-900/20 border border-gray-100 dark:border-neutral-800">
                  <div className="relative shrink-0 w-20 h-20 flex items-center justify-center bg-white dark:bg-[#1C1D21] rounded-full shadow-xs border border-gray-100 dark:border-neutral-800">
                    {/* SVG Circular Progress */}
                    <svg className="w-20 h-20 transform -rotate-90">
                      <circle cx="40" cy="40" r="32" className="stroke-gray-100 dark:stroke-neutral-800 fill-none" strokeWidth="6" />
                      <circle 
                        cx="40" 
                        cy="40" 
                        r="32" 
                        className="stroke-[#FF6B00] fill-none transition-all duration-1000" 
                        strokeWidth="6" 
                        strokeDasharray={2 * Math.PI * 32} 
                        strokeDashoffset={2 * Math.PI * 32 * (1 - completionRate / 100)} 
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute font-extrabold text-sm text-gray-900 dark:text-white">
                      {completionRate}%
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-gray-400">Creation Rate</h4>
                    <p className="text-sm font-semibold text-gray-800 dark:text-neutral-300">
                      You completed <span className="text-green-500 font-bold">{completedCount}</span> out of <span className="font-bold">{totalAssigned}</span> tasks.
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-neutral-500">
                      Aiming for &gt;90% resolution SLA today.
                    </p>
                  </div>
                </div>
              </div>

              {/* Mini activity summary */}
              <div className="mt-4 border-t border-gray-100 dark:border-neutral-800 pt-3">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-2">My Live Activity Log</span>
                {recentLogs.length === 0 ? (
                  <p className="text-xs text-gray-400">No activities logged yet.</p>
                ) : (
                  <div className="space-y-2 max-h-24 overflow-y-auto">
                    {recentLogs.map((log) => (
                      <div key={log.id} className="text-xs text-gray-600 dark:text-neutral-400 flex items-center justify-between">
                        <span className="truncate pr-2">• {log.details}</span>
                        <span className="text-[10px] text-gray-400 shrink-0 font-mono">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>

        </div>

        {/* Right Side: Quick Notes, Links & Deadlines Sidebar (Spans 1 Column) */}
        <div className="xl:col-span-1 space-y-6">
          
          {/* Private Notes Auto-Save Scratchpad */}
          <div className="bg-white dark:bg-[#1C1D21] p-5 rounded-2xl border border-gray-150 dark:border-neutral-800 shadow-xs flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <FileText className="w-4 h-4 text-[#FF6B00]" />
                <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                  Private Auto-Save Notes
                </h3>
              </div>
              <span className="text-[10px] bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400 px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider animate-pulse">
                Auto Saved
              </span>
            </div>

            {/* Note Text area */}
            <textarea
              value={noteContent}
              onChange={handleNoteChange}
              placeholder="Write private notes only visible to you. Automatically saved in background..."
              rows={5}
              className="w-full text-xs text-gray-800 dark:text-neutral-300 bg-gray-50 dark:bg-[#121316] border border-gray-200 dark:border-neutral-800 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-[#FF6B00]/40 focus:bg-white transition-all resize-none"
              id="private-notes-textarea"
            />

            {/* Checklist Section */}
            <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-neutral-800">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">My Daily Checklist</span>
              
              {/* Checklist list */}
              <div className="space-y-2 max-h-44 overflow-y-auto">
                {checklist.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No checklist tasks. Add one below!</p>
                ) : (
                  checklist.map((item) => (
                    <div key={item.id} className="flex items-center justify-between group">
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleToggleChecklist(item.id)}
                          className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                            item.completed 
                              ? "bg-green-500 border-green-500 text-white" 
                              : "border-gray-300 dark:border-neutral-700 hover:border-gray-400"
                          }`}
                        >
                          {item.completed && <Check className="w-3 h-3" />}
                        </button>
                        <span className={`text-xs ${item.completed ? "line-through text-gray-400 dark:text-neutral-500" : "text-gray-700 dark:text-neutral-300"}`}>
                          {item.text}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteChecklistItem(item.id)}
                        className="text-gray-400 hover:text-red-500 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Delete
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Add checklist item */}
              <form onSubmit={handleAddChecklist} className="flex items-center space-x-2 mt-2">
                <input
                  type="text"
                  placeholder="Add item..."
                  value={newCheckItem}
                  onChange={(e) => setNewCheckItem(e.target.value)}
                  className="w-full text-xs text-gray-800 dark:text-neutral-300 bg-gray-50 dark:bg-[#121316] border border-gray-250 dark:border-neutral-800 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#FF6B00]"
                  id="checklist-new-input"
                />
                <button
                  type="submit"
                  className="bg-gray-100 dark:bg-neutral-800 text-gray-800 dark:text-white p-1.5 rounded-lg border border-gray-200 dark:border-neutral-700 hover:bg-gray-200 transition-colors shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>

          </div>

          {/* Quick links widget */}
          <div className="bg-white dark:bg-[#1C1D21] p-5 rounded-2xl border border-gray-150 dark:border-neutral-800 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">
              Internal Resources
            </h3>
            
            <div className="space-y-2">
              {[
                { label: "Operations Slack Workspace", desc: "Connect with the team on Slack", url: "https://amberstudent.slack.com" },
                { label: "Creation Master Sheet", desc: "Spreadsheet database registry & schema", url: "https://docs.google.com/spreadsheets/d/1Z21-BycBi1aIEa4eMiIxZhuG1CkKaGTCgwqtoJNkTvc/edit?gid=983723162#gid=983723162" },
                { label: "Freshdesk Helpdesk", desc: "Operations & support tickets", url: "https://amberstudent.freshdesk.com" },
                { label: "Internal FAQ Portal", desc: "Creation guidelines & policies", url: "https://amberstudent.com/faq" },
                { label: "Property Live Directory", desc: "Check current active units", url: "https://amberstudent.com" }
              ].map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 rounded-xl border border-gray-100 dark:border-neutral-800 hover:border-amber-200 dark:hover:border-amber-950 hover:bg-amber-50/5 dark:hover:bg-[#FF6B00]/5 transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-900 dark:text-white">{link.label}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                  <p className="text-[10px] text-gray-500 dark:text-neutral-400 mt-0.5">{link.desc}</p>
                </a>
              ))}
            </div>
          </div>

          {/* Today's schedule / deadlines */}
          <div className="bg-white dark:bg-[#1C1D21] p-5 rounded-2xl border border-gray-150 dark:border-neutral-800 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">
              Deadline Milestones
            </h3>

            <div className="space-y-3">
              {userTasks.slice(0, 3).map((t) => (
                <div key={t.id} className="flex items-start space-x-3 text-xs border-b border-gray-50 dark:border-neutral-800/40 pb-2 last:border-none last:pb-0">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    t.status === 'Completed' ? 'bg-green-500' :
                    t.priority === 'Urgent' ? 'bg-red-500' : 'bg-amber-500'
                  }`} />
                  <div className="overflow-hidden">
                    <h4 className="font-semibold text-gray-800 dark:text-neutral-300 truncate">{t.title}</h4>
                    <span className="text-[10px] text-gray-500 dark:text-neutral-500">Due: {t.dueDate}</span>
                  </div>
                </div>
              ))}
              {userTasks.length === 0 && (
                <p className="text-xs text-gray-400 italic">No milestones listed today.</p>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
