import React, { useState } from "react";
import { FileDown, Calendar, Table, CheckSquare, Sparkles, SlidersHorizontal, ArrowDownToLine, Printer } from "lucide-react";
import { Task, User } from "../types";

interface ReportsViewProps {
  tasks: Task[];
  users: User[];
}

export default function ReportsView({ tasks, users }: ReportsViewProps) {
  const [timePeriod, setTimePeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Get current date boundaries
  const todayStr = new Date().toISOString().split('T')[0];
  
  const getTasksByPeriod = () => {
    const now = new Date();
    return tasks.filter(t => {
      const taskDate = new Date(t.dueDate);
      const diffTime = Math.abs(now.getTime() - taskDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (timePeriod === 'daily' && diffDays > 1) return false;
      if (timePeriod === 'weekly' && diffDays > 7) return false;
      if (timePeriod === 'monthly' && diffDays > 30) return false;

      if (selectedCategory !== "All" && t.title !== selectedCategory) return false;

      return true;
    });
  };

  const reportTasks = getTasksByPeriod();

  // Export functions
  const convertToCSV = (data: any[]) => {
    const headers = ["Task ID", "Type / Category", "Priority", "Assignee", "Creator", "Status", "Due Date", "Comments"];
    const rows = data.map(t => [
      t.id,
      t.title,
      t.priority,
      users.find(u => u.id === t.assignTo)?.name || "N/A",
      users.find(u => u.id === t.assignedBy)?.name || "System",
      t.status,
      t.dueDate,
      `"${(t.comment || "").replace(/"/g, '""')}"`
    ]);

    return [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  };

  const triggerDownload = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const csvContent = convertToCSV(reportTasks);
    triggerDownload(csvContent, `amber_creation_report_${timePeriod}.csv`, "text/csv;charset=utf-8;");
  };

  const handleExportExcel = () => {
    // Generates an Excel-ready CSV file with custom header configurations
    const csvContent = "\ufeff" + convertToCSV(reportTasks); // Add byte-order-mark for Excel compatibility
    triggerDownload(csvContent, `amber_creation_report_${timePeriod}.xls`, "application/vnd.ms-excel;charset=utf-8;");
  };

  const handlePrintPDF = () => {
    // Prepares the screen for printable output
    window.print();
  };

  // Get distinct categories in seed/created data
  const distinctCategories = Array.from(new Set(tasks.map(t => t.title)));

  return (
    <div className="space-y-6" id="reports-view-container">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-150 dark:border-neutral-800 pb-5">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            Operations Reports <Printer className="w-5 h-5 text-[#FF6B00]" />
          </h2>
          <p className="text-sm text-gray-500 dark:text-neutral-400 font-medium">
            Compile operational summaries, log timelines, and export database files.
          </p>
        </div>
      </div>

      {/* Control filters dashboard */}
      <div className="bg-white dark:bg-[#1C1D21] p-5 rounded-2xl border border-gray-150 dark:border-neutral-800 shadow-3xs flex flex-col md:flex-row items-center justify-between gap-5">
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          
          {/* Period selector */}
          <div className="bg-gray-100 dark:bg-neutral-900 p-1.5 rounded-xl flex items-center space-x-1 border border-gray-150 dark:border-neutral-800/80 w-full sm:w-auto">
            {(['daily', 'weekly', 'monthly'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setTimePeriod(period)}
                className={`px-4 py-2 text-xs font-bold rounded-lg uppercase tracking-wide transition-all w-full sm:w-auto ${
                  timePeriod === period 
                    ? 'bg-white dark:bg-[#1C1D21] text-[#FF6B00] shadow-2xs' 
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {period}
              </button>
            ))}
          </div>

          {/* Category dropdown */}
          <div className="w-full sm:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-gray-50 dark:bg-[#121316] text-xs font-semibold text-gray-700 dark:text-neutral-300 rounded-xl border border-gray-200 dark:border-neutral-800 px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#FF6B00]"
              id="report-category-select"
            >
              <option value="All">All Categories</option>
              {distinctCategories.map((cat, idx) => (
                <option key={idx} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Exporters buttons group */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          
          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-2 bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 hover:border-amber-200 text-gray-700 dark:text-neutral-300 px-4 py-2.5 rounded-xl text-xs font-bold transition-all w-full sm:w-auto justify-center"
            id="report-export-csv"
          >
            <ArrowDownToLine className="w-4 h-4 text-gray-400" />
            <span>Export CSV</span>
          </button>

          {/* Export Excel */}
          <button
            onClick={handleExportExcel}
            className="flex items-center space-x-2 bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 hover:border-amber-200 text-gray-700 dark:text-neutral-300 px-4 py-2.5 rounded-xl text-xs font-bold transition-all w-full sm:w-auto justify-center"
            id="report-export-excel"
          >
            <Table className="w-4 h-4 text-green-500" />
            <span>Export Excel</span>
          </button>

          {/* Print PDF */}
          <button
            onClick={handlePrintPDF}
            className="flex items-center space-x-2 bg-[#FF6B00]/5 hover:bg-[#FF6B00]/10 border border-[#FF6B00]/15 text-[#FF6B00] px-5 py-2.5 rounded-xl text-xs font-bold transition-all w-full sm:w-auto justify-center"
            id="report-print-pdf"
          >
            <Printer className="w-4 h-4" />
            <span>Print PDF Report</span>
          </button>

        </div>
      </div>

      {/* Report Table preview */}
      <div className="bg-white dark:bg-[#1C1D21] border border-gray-150 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-5 border-b border-gray-100 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckSquare className="w-4 h-4 text-[#FF6B00]" />
            <h3 className="font-extrabold text-sm text-gray-900 dark:text-white uppercase tracking-wider">
              Compiled Report Logs ({reportTasks.length} tickets)
            </h3>
          </div>
          <span className="text-[10px] bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400 px-2.5 py-1 rounded-full font-bold">
            Audit Verified
          </span>
        </div>

        <div className="overflow-x-auto" id="printable-report-area">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-150 dark:border-neutral-800 text-[10px] font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-wider bg-gray-50/50 dark:bg-neutral-900/10">
                <th className="px-6 py-3">Task ID</th>
                <th className="px-6 py-3">Task Type (Category)</th>
                <th className="px-6 py-3">Assignee</th>
                <th className="px-6 py-3 text-center">Status</th>
                <th className="px-6 py-3 text-center">Priority</th>
                <th className="px-6 py-3 text-right">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-800 text-xs">
              {reportTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-gray-400 dark:text-neutral-500">
                    No logs recorded during this reporting interval.
                  </td>
                </tr>
              ) : (
                reportTasks.map((t, idx) => {
                  const assigneeUser = users.find(u => u.id === t.assignTo);
                  return (
                    <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-neutral-850/20 transition-colors">
                      <td className="px-6 py-4 font-mono text-gray-400 font-medium">{t.id}</td>
                      <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{t.title}</td>
                      <td className="px-6 py-4 font-semibold text-gray-600 dark:text-neutral-400">{assigneeUser?.name || "System"}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          t.status === 'Completed' ? 'bg-green-50 text-green-700 dark:bg-green-950/20' :
                          t.status === 'Working' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/20' :
                          t.status === 'Need Help' ? 'bg-red-50 text-red-700 dark:bg-red-950/20' :
                          'bg-orange-50 text-orange-700 dark:bg-orange-950/20'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-gray-700 dark:text-neutral-400 uppercase tracking-wide">{t.priority}</td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-900 dark:text-neutral-200">{t.dueDate}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
