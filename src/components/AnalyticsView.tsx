import React, { useState } from "react";
import { BarChart3, TrendingUp, Users, Clock, Flame, PieChart, ShieldAlert } from "lucide-react";
import { Task, User } from "../types";

interface AnalyticsViewProps {
  tasks: Task[];
  users: User[];
  currentUser: User;
}

export default function AnalyticsView({ tasks, users, currentUser }: AnalyticsViewProps) {
  // Guard access
  if (currentUser.role !== "Admin" && currentUser.role !== "Manager") {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-white dark:bg-[#1C1D21] rounded-2xl border border-gray-150 dark:border-neutral-800 space-y-4">
        <ShieldAlert className="w-12 h-12 text-red-500 animate-pulse" />
        <h3 className="font-extrabold text-base text-gray-900 dark:text-white">Access Forbidden</h3>
        <p className="text-xs text-gray-500 dark:text-neutral-400 text-center max-w-sm">
          Operational Analytics are restricted to Admin and Manager roles. Please contact your system administrator.
        </p>
      </div>
    );
  }

  // Real-time computations
  const totalTasks = tasks.length;
  const completed = tasks.filter(t => t.status === "Completed").length;
  const inProgress = tasks.filter(t => t.status === "Working").length;
  const blocked = tasks.filter(t => t.status === "Waiting on KAM" || t.status === "Need Help").length;
  
  const completionPct = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;

  // 1. Task Categories Breakdown
  const categoryCounts: Record<string, number> = {};
  tasks.forEach(t => {
    categoryCounts[t.title] = (categoryCounts[t.title] || 0) + 1;
  });

  // 2. Tasks per Employee
  const employeeTaskCounts: Record<string, { total: number; completed: number }> = {};
  users.forEach(u => {
    employeeTaskCounts[u.id] = { total: 0, completed: 0 };
  });
  tasks.forEach(t => {
    if (employeeTaskCounts[t.assignTo]) {
      employeeTaskCounts[t.assignTo].total += 1;
      if (t.status === "Completed") {
        employeeTaskCounts[t.assignTo].completed += 1;
      }
    }
  });

  // Sort employees by task volume
  const sortedEmployeeStats = Object.entries(employeeTaskCounts)
    .map(([id, stats]) => ({
      name: users.find(u => u.id === id)?.name || "Unknown",
      role: users.find(u => u.id === id)?.role || "Team Member",
      ...stats
    }))
    .sort((a, b) => b.total - a.total);

  // 3. Simulated Weekly Trend (SLA Completion Rate %)
  const weeklyTrends = [
    { day: "Mon", rate: 84 },
    { day: "Tue", rate: 89 },
    { day: "Wed", rate: 91 },
    { day: "Thu", rate: 86 },
    { day: "Fri", rate: 95 },
    { day: "Sat", rate: 90 },
    { day: "Sun", rate: 97 }
  ];

  return (
    <div className="space-y-6" id="analytics-view-container">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-150 dark:border-neutral-800 pb-5">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            Operational Analytics <BarChart3 className="w-5 h-5 text-[#FF6B00]" />
          </h2>
          <p className="text-sm text-gray-500 dark:text-neutral-400 font-medium font-sans">
            Real-time insights and bottleneck discovery for the Creation team.
          </p>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Active Team SLA", value: `${completionPct}%`, desc: "Resolution quota completed", icon: TrendingUp, color: "text-[#FF6B00]" },
          { label: "Pending Backlog", value: inProgress, desc: "Working/Active tickets", icon: Flame, color: "text-blue-500" },
          { label: "Blocked Operations", value: blocked, desc: "KAM / Need Help priority", icon: ShieldAlert, color: "text-purple-500" },
          { label: "Average SLA Time", value: "3.2 hrs", desc: "Creation-to-active latency", icon: Clock, color: "text-green-500" }
        ].map((card, idx) => (
          <div key={idx} className="bg-white dark:bg-[#1C1D21] p-5 rounded-2xl border border-gray-150 dark:border-neutral-800 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">{card.label}</span>
              <span className={`text-2xl font-extrabold leading-none ${card.color}`}>{card.value}</span>
              <p className="text-[10px] text-gray-500 dark:text-neutral-400 mt-1.5">{card.desc}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-neutral-800 flex items-center justify-center text-gray-400">
              <card.icon className="w-5 h-5" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid: Charts and workload */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Weekly SLA resolution Trend (Area Chart) */}
        <div className="xl:col-span-2 bg-white dark:bg-[#1C1D21] p-5 rounded-2xl border border-gray-150 dark:border-neutral-800 shadow-xs flex flex-col justify-between">
          <div className="pb-4 border-b border-gray-100 dark:border-neutral-800 flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-gray-900 dark:text-white uppercase tracking-wider flex items-center space-x-1.5">
              <span>Weekly SLA Completion Trend</span>
            </h3>
            <span className="text-xs bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
              On Schedule
            </span>
          </div>

          {/* SVG Custom Line/Area chart */}
          <div className="h-64 mt-6 flex items-end justify-between relative px-2">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[10px] text-gray-400">
              <div className="border-b border-gray-100 dark:border-neutral-800/40 w-full pt-1">100%</div>
              <div className="border-b border-gray-100 dark:border-neutral-800/40 w-full">75%</div>
              <div className="border-b border-gray-100 dark:border-neutral-800/40 w-full">50%</div>
              <div className="border-b border-gray-100 dark:border-neutral-800/40 w-full">25%</div>
              <div className="w-full">0%</div>
            </div>

            {/* SLA Columns SVG representation */}
            <div className="w-full h-full flex items-end justify-between relative pt-8 z-10">
              {weeklyTrends.map((trend, index) => {
                const heightPct = trend.rate;
                return (
                  <div key={index} className="flex flex-col items-center flex-1 group">
                    <div className="relative w-12 flex flex-col justify-end items-center" style={{ height: "180px" }}>
                      {/* Tooltip on hover */}
                      <span className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-neutral-900 text-white text-[10px] px-2 py-1 rounded transition-opacity pointer-events-none z-20 font-mono">
                        {trend.rate}% completed
                      </span>
                      {/* Column background bar */}
                      <div className="w-4 h-full bg-gray-50 dark:bg-neutral-800/40 rounded-full absolute bottom-0 z-0" />
                      {/* Real bar filler */}
                      <div 
                        className="w-4 bg-gradient-to-t from-[#FF6B00] to-[#FF8A3D] rounded-full z-10 transition-all duration-1000 shadow-md shadow-[#FF6B00]/10" 
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-gray-500 dark:text-neutral-400 mt-2 font-mono uppercase">
                      {trend.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Task Category breakdown */}
        <div className="bg-white dark:bg-[#1C1D21] p-5 rounded-2xl border border-gray-150 dark:border-neutral-800 shadow-xs flex flex-col justify-between">
          <div className="pb-4 border-b border-gray-100 dark:border-neutral-800 flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-gray-900 dark:text-white uppercase tracking-wider flex items-center space-x-1.5">
              <PieChart className="w-4 h-4 text-[#FF6B00]" />
              <span>Category Distribution</span>
            </h3>
          </div>

          <div className="space-y-4 mt-6 flex-1 flex flex-col justify-center">
            {Object.entries(categoryCounts).length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-20 italic">No tasks created yet</p>
            ) : (
              Object.entries(categoryCounts).map(([catName, count], idx) => {
                const pct = totalTasks > 0 ? (count / totalTasks) * 100 : 0;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-gray-700 dark:text-neutral-300">{catName}</span>
                      <span className="text-gray-900 dark:text-white font-mono">{count} tickets ({Math.round(pct)}%)</span>
                    </div>
                    <div className="h-2 bg-gray-50 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <div className="h-full bg-[#FF6B00] rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Workload analysis grid table */}
      <div className="bg-white dark:bg-[#1C1D21] rounded-2xl border border-gray-150 dark:border-neutral-800 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-[#FF6B00]" />
            <h3 className="font-extrabold text-sm text-gray-900 dark:text-white uppercase tracking-wider">
              Creation Team Workload Capacity
            </h3>
          </div>
          <span className="text-[10px] bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 px-2.5 py-1 rounded-full font-bold">
            Live Monitoring
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-150 dark:border-neutral-800 text-[10px] font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-wider bg-gray-50/50 dark:bg-neutral-900/10">
                <th className="px-6 py-3">Employee Name</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3 text-center">Active Queue Load</th>
                <th className="px-6 py-3 text-center">Completed Work</th>
                <th className="px-6 py-3 text-center">Completion Ratio</th>
                <th className="px-6 py-3 text-right">Operational Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-800 text-sm">
              {sortedEmployeeStats.map((item, idx) => {
                const ratioPct = item.total > 0 ? Math.round((item.completed / item.total) * 100) : 0;
                
                // Workload status
                let workloadText = "Balanced";
                let workloadColor = "bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400 border border-green-200/40";
                if (item.total - item.completed >= 3) {
                  workloadText = "High Capacity";
                  workloadColor = "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-200/40 animate-pulse";
                } else if (item.total - item.completed > 0) {
                  workloadText = "Active Queue";
                  workloadColor = "bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-200/40";
                }

                return (
                  <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-neutral-800/10 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-950 dark:text-white">{item.name}</td>
                    <td className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-neutral-400">{item.role}</td>
                    <td className="px-6 py-4 text-center font-bold text-gray-800 dark:text-neutral-300 font-mono">{item.total - item.completed} active</td>
                    <td className="px-6 py-4 text-center text-green-600 dark:text-green-400 font-bold font-mono">{item.completed} finished</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-16 h-2 bg-gray-50 dark:bg-neutral-800 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: `${ratioPct}%` }} />
                        </div>
                        <span className="text-xs font-bold text-gray-700 dark:text-neutral-400 font-mono">{ratioPct}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${workloadColor}`}>
                        {workloadText}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
