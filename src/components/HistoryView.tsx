import React, { useState } from "react";
import { History, Search, ArrowRight, ShieldCheck, Filter, Trash2 } from "lucide-react";
import { AuditLog, User, TaskStatus } from "../types";

interface HistoryViewProps {
  auditLogs: AuditLog[];
  users: User[];
}

export default function HistoryView({ auditLogs, users }: HistoryViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState<'All' | 'Today' | 'Yesterday' | 'This Week'>('All');
  const [employeeFilter, setEmployeeFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  const todayStr = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const getDayDiff = (d1: Date, d2: Date) => {
    return Math.ceil(Math.abs(d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Filter logs
  const filteredLogs = auditLogs.filter(log => {
    // 1. Search filter
    const matchesSearch = log.details.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (log.taskTitle || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.userName.toLowerCase().includes(searchTerm.toLowerCase());

    // 2. Date Filter
    const logDateStr = log.timestamp.split('T')[0];
    let matchesDate = true;
    if (dateFilter === 'Today') {
      matchesDate = logDateStr === todayStr;
    } else if (dateFilter === 'Yesterday') {
      matchesDate = logDateStr === yesterdayStr;
    } else if (dateFilter === 'This Week') {
      matchesDate = getDayDiff(new Date(), new Date(log.timestamp)) <= 7;
    }

    // 3. Employee Filter
    const matchesEmployee = employeeFilter === "All" || log.userId === employeeFilter || log.changeByUserId === employeeFilter;

    // 4. Status Filter
    const matchesStatus = statusFilter === "All" || log.oldStatus === statusFilter || log.newStatus === statusFilter;

    return matchesSearch && matchesDate && matchesEmployee && matchesStatus;
  });

  const getActionBadgeClass = (actionType: string) => {
    switch (actionType) {
      case "Create": return "bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400";
      case "StatusUpdate": return "bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400";
      case "Delete": return "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400";
      case "CategoryUpdate": return "bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400";
      default: return "bg-gray-100 text-gray-700 dark:bg-neutral-800 dark:text-neutral-400";
    }
  };

  return (
    <div className="space-y-6" id="history-view-container">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-150 dark:border-neutral-800 pb-5">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            Operations History Log <History className="w-5 h-5 text-[#FF6B00]" />
          </h2>
          <p className="text-sm text-gray-500 dark:text-neutral-400 font-medium">
            Permanent, tamper-proof audit trail tracking all creation team assignments and status changes.
          </p>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="bg-white dark:bg-[#1C1D21] p-4 rounded-xl border border-gray-150 dark:border-neutral-800 shadow-3xs flex flex-wrap gap-4 items-center justify-between">
        
        {/* Search bar */}
        <div className="relative w-full md:max-w-xs">
          <input
            type="text"
            placeholder="Search details, employee name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 dark:bg-[#121316] text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-neutral-800 focus:outline-none focus:ring-1 focus:ring-[#FF6B00]"
            id="history-search-input"
          />
          <Search className="w-4 h-4 text-gray-400 dark:text-neutral-500 absolute left-3 top-3 pointer-events-none" />
        </div>

        {/* Filters Selectors */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          
          {/* Date filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="bg-gray-50 dark:bg-[#121316] text-xs font-semibold text-gray-700 dark:text-neutral-300 rounded-lg border border-gray-250 dark:border-neutral-800 px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#FF6B00]"
            id="history-date-filter"
          >
            <option value="All">All Time</option>
            <option value="Today">Today</option>
            <option value="Yesterday">Yesterday</option>
            <option value="This Week">This Week</option>
          </select>

          {/* Employee Filter */}
          <select
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
            className="bg-gray-50 dark:bg-[#121316] text-xs font-semibold text-gray-700 dark:text-neutral-300 rounded-lg border border-gray-250 dark:border-neutral-800 px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#FF6B00]"
            id="history-employee-filter"
          >
            <option value="All">All Employees</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-50 dark:bg-[#121316] text-xs font-semibold text-gray-700 dark:text-neutral-300 rounded-lg border border-gray-250 dark:border-neutral-800 px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#FF6B00]"
            id="history-status-filter"
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

      </div>

      {/* Audit Log Timeline */}
      <div className="bg-white dark:bg-[#1C1D21] border border-gray-150 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-5 border-b border-gray-100 dark:border-neutral-800 flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-green-500" />
          <h3 className="font-extrabold text-sm text-gray-900 dark:text-white uppercase tracking-wider">
            Verified Operational Ledger ({filteredLogs.length} Entries)
          </h3>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-neutral-800/80">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-20 text-gray-400 dark:text-neutral-500 font-medium italic">
              No historic log entries found matching the selection criteria.
            </div>
          ) : (
            filteredLogs.map((log) => {
              const operator = users.find(u => u.id === log.changeByUserId);

              return (
                <div key={log.id} className="p-4.5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50/40 dark:hover:bg-neutral-850/10 transition-colors" id={`history-log-${log.id}`}>
                  
                  {/* Left part: Meta details */}
                  <div className="flex items-start space-x-3.5">
                    <div className="w-9 h-9 rounded-full bg-gray-50 dark:bg-neutral-900/30 flex items-center justify-center text-gray-400 border border-gray-100 dark:border-neutral-800 shrink-0">
                      <History className="w-4 h-4" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center flex-wrap gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${getActionBadgeClass(log.actionType)}`}>
                          {log.actionType}
                        </span>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">
                          {log.details}
                        </span>
                      </div>

                      {/* Author / timestamp */}
                      <p className="text-[11px] text-gray-500 dark:text-neutral-400">
                        Performed by <span className="font-semibold text-gray-700 dark:text-neutral-300">{operator ? operator.name : log.changeByUserName}</span> ({operator ? operator.role : "System"}) • <span className="font-mono font-medium">{new Date(log.timestamp).toLocaleString()}</span>
                      </p>
                    </div>
                  </div>

                  {/* Right part: Status change visualizer if applicable */}
                  {log.oldStatus && log.newStatus && (
                    <div className="flex items-center space-x-2 bg-gray-50 dark:bg-neutral-900/10 px-3.5 py-1.5 rounded-lg border border-gray-100 dark:border-neutral-800/40 shrink-0">
                      <span className="text-[10px] font-bold text-gray-400 dark:text-neutral-500 uppercase font-mono">{log.oldStatus}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#FF6B00]" />
                      <span className="text-[10px] font-bold text-[#FF6B00] uppercase font-mono">{log.newStatus}</span>
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}
