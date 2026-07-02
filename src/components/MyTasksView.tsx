import React, { useState, useEffect } from "react";
import { 
  List, 
  LayoutGrid, 
  Search, 
  SlidersHorizontal, 
  Plus, 
  ArrowRight, 
  ExternalLink, 
  CheckCircle, 
  Clock, 
  Trash2, 
  Edit2, 
  AlertOctagon, 
  Keyboard, 
  FolderOpen,
  Link2
} from "lucide-react";
import { Task, User, TaskStatus, TaskPriority } from "../types";

interface MyTasksViewProps {
  tasks: Task[];
  users: User[];
  currentUser: User;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => Promise<void>;
  onUpdateTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  onOpenCreateTask: () => void;
}

export default function MyTasksView({
  tasks,
  users,
  currentUser,
  onEditTask,
  onDeleteTask,
  onUpdateTaskStatus,
  onOpenCreateTask
}: MyTasksViewProps) {
  const [layout, setLayout] = useState<'list' | 'board'>('list');
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [priorityFilter, setPriorityFilter] = useState<string>("All");
  const [activeHoverTaskId, setActiveHoverTaskId] = useState<string | null>(null);

  // Filter tasks
  const myTasks = currentUser.role === 'Admin' || currentUser.role === 'Manager'
    ? tasks
    : tasks.filter(t => t.assignTo === currentUser.id);

  const filteredTasks = myTasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.freshdeskLink.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "All" || t.status === statusFilter;
    const matchesPriority = priorityFilter === "All" || t.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Keyboards shortcuts listener for status update on hover
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!activeHoverTaskId) return;
      
      const keyToStatusMap: Record<string, TaskStatus> = {
        "1": "Not Started",
        "2": "Working",
        "3": "Need Help",
        "4": "Waiting on KAM",
        "5": "Pending",
        "6": "Completed"
      };

      if (keyToStatusMap[e.key]) {
        e.preventDefault();
        onUpdateTaskStatus(activeHoverTaskId, keyToStatusMap[e.key]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeHoverTaskId, onUpdateTaskStatus]);

  // Board columns
  const boardColumns: TaskStatus[] = ["Not Started", "Working", "Need Help", "Waiting on KAM", "Pending", "Completed"];

  const getPriorityBadge = (p: TaskPriority) => {
    switch (p) {
      case "Urgent": return "bg-red-500 text-white font-bold animate-pulse px-2 py-0.5 rounded text-[10px]";
      case "High": return "bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400 px-2 py-0.5 rounded text-[10px] font-semibold";
      case "Medium": return "bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400 px-2 py-0.5 rounded text-[10px] font-semibold";
      default: return "bg-gray-100 text-gray-700 dark:bg-neutral-800 dark:text-neutral-400 px-2 py-0.5 rounded text-[10px]";
    }
  };

  const getStatusColorClass = (s: TaskStatus) => {
    switch (s) {
      case "Completed": return "bg-green-500";
      case "Working": return "bg-blue-500";
      case "Waiting on KAM": return "bg-purple-500";
      case "Pending": return "bg-orange-500";
      case "Need Help": return "bg-red-500";
      default: return "bg-gray-400";
    }
  };

  return (
    <div className="space-y-6" id="mytasks-view-container">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-150 dark:border-neutral-800 pb-5">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            Operations Queue <FolderOpen className="w-5 h-5 text-[#FF6B00]" />
          </h2>
          <p className="text-sm text-gray-500 dark:text-neutral-400 font-medium">
            Manage, filter, and track active workflow tickets with hotkeys.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          {/* Layout switches */}
          <div className="bg-gray-100 dark:bg-neutral-900 p-1 rounded-xl flex items-center space-x-1 border border-gray-200/50 dark:border-neutral-800/80">
            <button
              onClick={() => setLayout('list')}
              className={`p-2 rounded-lg transition-all ${layout === 'list' ? 'bg-white dark:bg-[#1C1D21] text-[#FF6B00] shadow-xs' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
              title="Linear List View"
              id="layout-list-btn"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setLayout('board')}
              className={`p-2 rounded-lg transition-all ${layout === 'board' ? 'bg-white dark:bg-[#1C1D21] text-[#FF6B00] shadow-xs' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
              title="ClickUp Board View"
              id="layout-board-btn"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          {(currentUser.role === 'Admin' || currentUser.role === 'Manager') && (
            <button
              onClick={onOpenCreateTask}
              className="flex items-center space-x-2 bg-[#FF6B00] text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-[#FF6B00]/15 hover:bg-[#FF8A3D] transition-all duration-200"
              id="mytasks-create-btn"
            >
              <Plus className="w-4 h-4" />
              <span>Create Task</span>
            </button>
          )}
        </div>
      </div>

      {/* Keyboard shortcuts helper panel */}
      <div className="bg-amber-50/50 dark:bg-[#FF6B00]/5 border border-amber-200/40 dark:border-amber-950/40 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-amber-100/60 dark:bg-amber-950/30 text-[#FF6B00] rounded-lg shrink-0">
            <Keyboard className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-gray-900 dark:text-white uppercase tracking-wide">Interactive Hotkeys Panel</h4>
            <p className="text-xs text-gray-500 dark:text-neutral-400">
              Hover over any task card and press digits <kbd className="font-mono bg-white dark:bg-neutral-800 border px-1 rounded">1-6</kbd> on your keyboard to instantly change its status:
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-[10px] font-bold text-gray-600 dark:text-neutral-400 font-mono">
          <span className="bg-white dark:bg-neutral-800 border px-2 py-1 rounded shadow-2xs">1: Not Started</span>
          <span className="bg-white dark:bg-neutral-800 border px-2 py-1 rounded shadow-2xs">2: Working</span>
          <span className="bg-white dark:bg-neutral-800 border px-2 py-1 rounded shadow-2xs">3: Need Help</span>
          <span className="bg-white dark:bg-neutral-800 border px-2 py-1 rounded shadow-2xs">4: KAM</span>
          <span className="bg-white dark:bg-neutral-800 border px-2 py-1 rounded shadow-2xs">5: Pending</span>
          <span className="bg-white dark:bg-neutral-800 border px-2 py-1 rounded shadow-2xs">6: Completed</span>
        </div>
      </div>

      {/* Filters bar */}
      <div className="bg-white dark:bg-[#1C1D21] p-4 rounded-xl border border-gray-150 dark:border-neutral-800 shadow-3xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <input
            type="text"
            placeholder="Filter operations tasks by description, ticket #, links..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 dark:bg-[#121316] text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-neutral-800 focus:outline-none focus:ring-1 focus:ring-[#FF6B00]"
            id="mytasks-search-filter"
          />
          <Search className="w-4 h-4 text-gray-400 dark:text-neutral-500 absolute left-3 top-3 pointer-events-none" />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          {/* Status filter */}
          <div className="w-1/2 md:w-36">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-gray-50 dark:bg-[#121316] text-xs font-semibold text-gray-700 dark:text-neutral-300 rounded-lg border border-gray-200 dark:border-neutral-800 px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#FF6B00]"
              id="filter-status-select"
            >
              <option value="All">All Statuses</option>
              <option value="Not Started">Not Started</option>
              <option value="Working">Working</option>
              <option value="Need Help">Need Help</option>
              <option value="Waiting on KAM">Waiting on KAM</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          {/* Priority filter */}
          <div className="w-1/2 md:w-36">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full bg-gray-50 dark:bg-[#121316] text-xs font-semibold text-gray-700 dark:text-neutral-300 rounded-lg border border-gray-200 dark:border-neutral-800 px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#FF6B00]"
              id="filter-priority-select"
            >
              <option value="All">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Layout Output */}
      {layout === 'list' ? (
        /* Linear-Style List View */
        <div className="bg-white dark:bg-[#1C1D21] border border-gray-150 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-neutral-800 text-[10px] font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-wider bg-gray-50/50 dark:bg-[#17181C]">
                  <th className="px-6 py-3">Task ID</th>
                  <th className="px-6 py-3">Type / Details</th>
                  <th className="px-6 py-3">Priority</th>
                  <th className="px-6 py-3">Assignee</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Due Date</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-neutral-800 text-sm">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16 text-gray-400 dark:text-neutral-500">
                      No matching tasks found. Customize your active filters.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((t) => {
                    const assigneeUser = users.find(u => u.id === t.assignTo);
                    const isHovered = activeHoverTaskId === t.id;

                    return (
                      <tr
                        key={t.id}
                        onMouseEnter={() => setActiveHoverTaskId(t.id)}
                        onMouseLeave={() => setActiveHoverTaskId(null)}
                        className={`hover:bg-gray-50/50 dark:hover:bg-neutral-800/10 transition-all ${
                          isHovered ? "ring-1 ring-[#FF6B00]/45 bg-[#FF6B00]/2" : ""
                        }`}
                        id={`tasks-list-row-${t.id}`}
                      >
                        {/* Task ID */}
                        <td className="px-6 py-4.5 font-mono text-[11px] text-gray-400 dark:text-neutral-500 whitespace-nowrap">
                          {t.id}
                        </td>

                        {/* Type / details */}
                        <td className="px-6 py-4.5">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-gray-900 dark:text-white">{t.title}</span>
                            {t.freshdeskLink && (
                              <a 
                                href={t.freshdeskLink} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-gray-400 hover:text-[#FF6B00] transition-colors"
                                title="Open Freshdesk ticket"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                          {t.comment && (
                            <div className="text-xs text-gray-500 dark:text-neutral-400 max-w-sm truncate mt-0.5 font-normal">
                              {t.comment}
                            </div>
                          )}
                        </td>

                        {/* Priority */}
                        <td className="px-6 py-4.5 whitespace-nowrap">
                          {getPriorityBadge(t.priority)}
                        </td>

                        {/* Assignee */}
                        <td className="px-6 py-4.5 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 rounded-full bg-gray-150 dark:bg-neutral-800 flex items-center justify-center font-bold text-xs text-gray-700 dark:text-white">
                              {assigneeUser?.name?.charAt(0) || "U"}
                            </div>
                            <span className="text-xs font-semibold text-gray-800 dark:text-neutral-300">
                              {assigneeUser?.name || "System"}
                            </span>
                          </div>
                        </td>

                        {/* Status dropdown */}
                        <td className="px-6 py-4.5 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${getStatusColorClass(t.status)}`} />
                            <select
                              value={t.status}
                              onChange={(e) => onUpdateTaskStatus(t.id, e.target.value as TaskStatus)}
                              className="bg-transparent border-none text-xs font-bold text-gray-700 dark:text-neutral-300 focus:outline-none cursor-pointer p-0.5 rounded-md hover:bg-gray-100 dark:hover:bg-neutral-800"
                              id={`mytasks-list-status-${t.id}`}
                            >
                              <option value="Not Started">Not Started</option>
                              <option value="Working">Working</option>
                              <option value="Need Help">Need Help</option>
                              <option value="Waiting on KAM">Waiting on KAM</option>
                              <option value="Pending">Pending</option>
                              <option value="Completed">Completed</option>
                            </select>
                          </div>
                        </td>

                        {/* Due Date */}
                        <td className="px-6 py-4.5 text-xs text-gray-700 dark:text-neutral-300 font-semibold whitespace-nowrap">
                          {t.dueDate}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end space-x-2">
                            {(currentUser.role === 'Admin' || currentUser.role === 'Manager') && (
                              <>
                                <button
                                  onClick={() => onEditTask(t)}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
                                  id={`mytasks-list-edit-${t.id}`}
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => onDeleteTask(t.id)}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                                  id={`mytasks-list-delete-${t.id}`}
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
      ) : (
        /* ClickUp-Style Kanban Board View */
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4 items-start" id="mytasks-board">
          {boardColumns.map((colStatus) => {
            const columnTasks = filteredTasks.filter(t => t.status === colStatus);

            return (
              <div 
                key={colStatus} 
                className="bg-gray-100/50 dark:bg-[#121316]/50 rounded-2xl p-4 border border-gray-150 dark:border-neutral-800/60 min-h-[500px] flex flex-col space-y-3"
                id={`board-column-${colStatus.toLowerCase().replace(" ", "-")}`}
              >
                {/* Column header */}
                <div className="flex items-center justify-between pb-2 border-b border-gray-200/50 dark:border-neutral-800">
                  <div className="flex items-center space-x-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${getStatusColorClass(colStatus)}`} />
                    <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">{colStatus}</span>
                  </div>
                  <span className="text-xs bg-white dark:bg-neutral-800 text-gray-500 dark:text-neutral-400 font-bold px-2 py-0.5 rounded-full border border-gray-200/50 dark:border-neutral-700">
                    {columnTasks.length}
                  </span>
                </div>

                {/* Column task items */}
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[70vh]">
                  {columnTasks.length === 0 ? (
                    <div className="h-full border border-dashed border-gray-200 dark:border-neutral-800/80 rounded-xl flex items-center justify-center p-6">
                      <span className="text-[11px] text-gray-400 dark:text-neutral-600 font-medium italic text-center">Empty queue</span>
                    </div>
                  ) : (
                    columnTasks.map((t) => {
                      const assigneeUser = users.find(u => u.id === t.assignTo);
                      const isHovered = activeHoverTaskId === t.id;

                      return (
                        <div
                          key={t.id}
                          onMouseEnter={() => setActiveHoverTaskId(t.id)}
                          onMouseLeave={() => setActiveHoverTaskId(null)}
                          className={`bg-white dark:bg-[#1C1D21] p-4 rounded-xl border border-gray-150 dark:border-neutral-800/80 shadow-xs flex flex-col justify-between space-y-3 relative group transition-all hover:shadow-md hover:border-amber-200 dark:hover:border-neutral-700 cursor-pointer ${
                            isHovered ? "ring-1 ring-[#FF6B00] bg-[#FF6B00]/2" : ""
                          }`}
                          id={`board-card-${t.id}`}
                        >
                          {/* Priority badge & actions */}
                          <div className="flex items-center justify-between">
                            {getPriorityBadge(t.priority)}
                            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => onEditTask(t)} 
                                className="p-1 rounded text-gray-400 hover:text-gray-900 dark:hover:text-white"
                                title="Edit"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* Task title / detail */}
                          <div>
                            <h4 className="font-bold text-xs text-gray-900 dark:text-white leading-snug">{t.title}</h4>
                            {t.comment && <p className="text-[11px] text-gray-500 dark:text-neutral-400 mt-1 line-clamp-2">{t.comment}</p>}
                          </div>

                          {/* Bottom info row (Assignee, due date, link) */}
                          <div className="flex items-center justify-between pt-2 border-t border-gray-50 dark:border-neutral-800/60 text-[10px]">
                            <div className="flex items-center space-x-1.5">
                              <div className="w-5 h-5 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center font-bold text-gray-600 dark:text-white">
                                {assigneeUser?.name?.charAt(0) || "U"}
                              </div>
                              <span className="font-semibold text-gray-500 dark:text-neutral-400 truncate max-w-[50px]">{assigneeUser?.name || "Unassigned"}</span>
                            </div>

                            <div className="text-right">
                              <span className="text-gray-400 block">Due Date</span>
                              <span className="font-semibold text-gray-700 dark:text-neutral-300">{t.dueDate}</span>
                            </div>
                          </div>

                          {t.freshdeskLink && (
                            <a
                              href={t.freshdeskLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="absolute top-2 right-2 p-1 bg-gray-50 dark:bg-neutral-800 rounded border border-gray-200/50 dark:border-neutral-700 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Go to Freshdesk Ticket"
                            >
                              <Link2 className="w-3 h-3 text-[#FF6B00]" />
                            </a>
                          )}
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

    </div>
  );
}
