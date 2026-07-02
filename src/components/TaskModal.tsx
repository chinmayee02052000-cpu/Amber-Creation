import React, { useState, useEffect } from "react";
import { X, Calendar, Link2, AlertTriangle, CheckCircle, Info, ExternalLink } from "lucide-react";
import { Task, User, TaskPriority, TaskStatus, TaskCategory } from "../types";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task; // If provided, we are editing, otherwise creating
  users: User[];
  categories: TaskCategory[];
  onSave: (taskData: Partial<Task>) => Promise<void>;
  currentUser: User;
}

export default function TaskModal({
  isOpen,
  onClose,
  task,
  users,
  categories,
  onSave,
  currentUser
}: TaskModalProps) {
  const [title, setTitle] = useState("");
  const [assignTo, setAssignTo] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("Medium");
  const [freshdeskLink, setFreshdeskLink] = useState("");
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<TaskStatus>("Not Started");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize fields if editing
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setAssignTo(task.assignTo);
      setPriority(task.priority);
      setFreshdeskLink(task.freshdeskLink);
      setComment(task.comment);
      setStatus(task.status);
      setDueDate(task.dueDate ? task.dueDate.split("T")[0] : "");
    } else {
      // Clear fields if creating
      setTitle(categories[0]?.name || "");
      setAssignTo(users.find(u => u.role === "Team Member")?.id || users[0]?.id || "");
      setPriority("Medium");
      setFreshdeskLink("");
      setComment("");
      setStatus("Not Started");
      const today = new Date();
      setDueDate(today.toISOString().split("T")[0]);
    }
    setError("");
  }, [task, isOpen, categories, users]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    if (!title) {
      setError("Please select or specify a Task Type.");
      setIsSubmitting(false);
      return;
    }
    if (!assignTo) {
      setError("Please assign this task to a team member.");
      setIsSubmitting(false);
      return;
    }
    if (!dueDate) {
      setError("Please select a due date.");
      setIsSubmitting(false);
      return;
    }

    try {
      await onSave({
        id: task?.id,
        title,
        assignTo,
        priority,
        freshdeskLink,
        comment,
        status,
        dueDate
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to save task. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditing = !!task;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4 animate-fade-in" id="task-modal-overlay">
      <div className="bg-white dark:bg-[#1C1D21] w-full max-w-lg rounded-2xl border border-gray-200 dark:border-neutral-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden" id="task-modal-container">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-150 dark:border-neutral-800 flex items-center justify-between bg-gray-50/50 dark:bg-neutral-900/10">
          <div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white leading-snug">
              {isEditing ? "Edit Operations Task" : "Assign Operational Task"}
            </h3>
            <p className="text-xs text-gray-500 dark:text-neutral-400">
              AmberStudent Creation Team workflow scheduler
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg text-gray-400 dark:text-neutral-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
            id="close-task-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl flex items-start space-x-2 text-xs text-red-700 dark:text-red-400">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Task Type / Category */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
              Task Category (Type)
            </label>
            <select
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-[#121316] text-gray-900 dark:text-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40 focus:border-[#FF6B00] transition-all font-medium"
              id="task-form-type"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Assign To */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
              Assign To
            </label>
            <select
              value={assignTo}
              onChange={(e) => setAssignTo(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-[#121316] text-gray-900 dark:text-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40 focus:border-[#FF6B00] transition-all font-medium"
              id="task-form-assignee"
            >
              <option value="" disabled>Select Team Member</option>
              {users.map((u) => (
                <option key={u.id} value={u.id} disabled={!u.enabled}>
                  {u.name} ({u.role}) {!u.enabled ? "[DISABLED]" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Priority & Due Date Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-[#121316] text-gray-900 dark:text-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40 focus:border-[#FF6B00] transition-all font-medium"
                id="task-form-priority"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                Due Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-[#121316] text-gray-900 dark:text-white pl-10 pr-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40 focus:border-[#FF6B00] transition-all font-medium"
                  id="task-form-duedate"
                />
                <Calendar className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Freshdesk Ticket Link */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-gray-700 dark:text-neutral-300 uppercase tracking-wider">
                Freshdesk Link
              </label>
              {freshdeskLink && freshdeskLink.startsWith("http") && (
                <a 
                  href={freshdeskLink} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-[10px] text-[#FF6B00] hover:underline flex items-center space-x-1"
                >
                  <span>Open Ticket</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>
            <div className="relative">
              <input
                type="url"
                value={freshdeskLink}
                onChange={(e) => setFreshdeskLink(e.target.value)}
                placeholder="https://amberstudent.freshdesk.com/helpdesk/tickets/..."
                className="w-full rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-[#121316] text-gray-900 dark:text-white pl-10 pr-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40 focus:border-[#FF6B00] transition-all"
                id="task-form-freshdesk"
              />
              <Link2 className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5 pointer-events-none" />
            </div>
          </div>

          {/* Status (Optional or Visible always when editing) */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
              Task Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="w-full rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-[#121316] text-gray-900 dark:text-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40 focus:border-[#FF6B00] transition-all font-medium"
              id="task-form-status"
            >
              <option value="Not Started">Not Started</option>
              <option value="Working">Working</option>
              <option value="Need Help">Need Help</option>
              <option value="Waiting on KAM">Waiting on KAM</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          {/* Additional Comment */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
              Additional Comments / Ticket Summary
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Provide clear operational context here..."
              rows={4}
              className="w-full rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-[#121316] text-gray-900 dark:text-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/40 focus:border-[#FF6B00] transition-all resize-none"
              id="task-form-comment"
            />
          </div>

          {/* Form Actions footer */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-800 text-sm font-semibold text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
              id="task-form-cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-[#FF6B00] text-white text-sm font-bold shadow-md shadow-[#FF6B00]/15 hover:bg-[#FF8A3D] disabled:bg-gray-300 dark:disabled:bg-neutral-800 transition-all duration-200"
              id="task-form-submit"
            >
              {isSubmitting ? "Processing..." : isEditing ? "Save Changes" : "Assign Task"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
