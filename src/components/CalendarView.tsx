import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Check, HelpCircle, AlertOctagon } from "lucide-react";
import { Task, TaskStatus } from "../types";

interface CalendarViewProps {
  tasks: Task[];
}

export default function CalendarView({ tasks }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDay(null);
  };

  // Days calculations
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday, 1 is Monday...

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const paddingArray = Array.from({ length: firstDayOfMonth }, (_, i) => null);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const getTaskStatusColor = (status: TaskStatus, isOverdue: boolean) => {
    if (status === "Completed") return "bg-green-500 text-white";
    if (isOverdue) return "bg-red-500 text-white";
    if (status === "Waiting on KAM") return "bg-purple-500 text-white";
    if (status === "Working") return "bg-blue-500 text-white";
    if (status === "Need Help") return "bg-red-500 text-white";
    return "bg-amber-500 text-white"; // Pending / default
  };

  const getDayTasks = (day: number) => {
    const formattedDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return tasks.filter(t => t.dueDate === formattedDate);
  };

  // Detailed day popover / side panel view on click
  const activeDay = selectedDay || currentDate.getDate();
  const selectedDateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(activeDay).padStart(2, "0")}`;
  const selectedDayTasks = tasks.filter(t => t.dueDate === selectedDateStr);

  return (
    <div className="space-y-6" id="calendar-view-container">
      {/* Calendar Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-150 dark:border-neutral-800 pb-5">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            Operations Calendar <CalendarIcon className="w-5 h-5 text-[#FF6B00]" />
          </h2>
          <p className="text-sm text-gray-500 dark:text-neutral-400 font-medium">
            Monitor deadlines and due dates across the entire Creation team.
          </p>
        </div>

        {/* Date Month switcher */}
        <div className="flex items-center space-x-3 bg-white dark:bg-[#1C1D21] border border-gray-150 dark:border-neutral-800 px-4 py-2 rounded-xl shadow-3xs shrink-0">
          <button 
            onClick={handlePrevMonth} 
            className="p-1 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-800 text-gray-600 dark:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-extrabold text-gray-900 dark:text-white font-sans tracking-tight min-w-[120px] text-center">
            {monthNames[month]} {year}
          </span>
          <button 
            onClick={handleNextMonth} 
            className="p-1 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-800 text-gray-600 dark:text-white transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid container: Calendar on left (3/4), Day inspector on right (1/4) */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Left column: Grid */}
        <div className="xl:col-span-3 bg-white dark:bg-[#1C1D21] border border-gray-150 dark:border-neutral-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-wider pb-3 border-b border-gray-100 dark:border-neutral-800">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          <div className="grid grid-cols-7 gap-2.5 mt-4 flex-1 min-h-[480px]">
            {/* Pad leading offset empty cells */}
            {paddingArray.map((_, index) => (
              <div key={`pad-${index}`} className="bg-gray-50/30 dark:bg-neutral-900/10 border border-gray-100/30 dark:border-neutral-850 rounded-xl" />
            ))}

            {/* Render actual monthly day numbers */}
            {daysArray.map((day) => {
              const dayTasks = getDayTasks(day);
              const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;
              const isSelected = selectedDay === day;

              return (
                <div
                  key={`day-${day}`}
                  onClick={() => setSelectedDay(day)}
                  className={`border rounded-xl p-2.5 cursor-pointer flex flex-col justify-between min-h-[75px] transition-all relative group ${
                    isSelected ? "border-[#FF6B00] ring-1 ring-[#FF6B00]/30 bg-[#FF6B00]/2" : "border-gray-150 dark:border-neutral-800 hover:border-[#FF6B00]/40 hover:bg-gray-50/50 dark:hover:bg-neutral-850/20"
                  } ${isToday ? "bg-[#FF6B00]/5 dark:bg-[#FF6B00]/10 border-[#FF6B00]/50" : ""}`}
                >
                  {/* Number head */}
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${
                      isToday ? "text-[#FF6B00] font-extrabold" : "text-gray-900 dark:text-neutral-200"
                    }`}>
                      {day}
                    </span>
                    {dayTasks.length > 0 && (
                      <span className="text-[10px] font-bold bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-400 px-1.5 py-0.5 rounded-full">
                        {dayTasks.length}
                      </span>
                    )}
                  </div>

                  {/* Tiny tasks strip dots/lines */}
                  <div className="space-y-1 mt-2">
                    {dayTasks.slice(0, 2).map((t) => {
                      const isOverdue = t.dueDate < new Date().toISOString().split('T')[0] && t.status !== "Completed";
                      return (
                        <div 
                          key={t.id} 
                          className={`text-[9px] font-bold py-0.5 px-1.5 rounded truncate max-w-full ${getTaskStatusColor(t.status, isOverdue)}`}
                        >
                          {t.title}
                        </div>
                      );
                    })}
                    {dayTasks.length > 2 && (
                      <div className="text-[8px] font-bold text-gray-400 text-center">
                        +{dayTasks.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column: Inspecting Selected Day timeline */}
        <div className="xl:col-span-1 bg-white dark:bg-[#1C1D21] border border-gray-150 dark:border-neutral-800 rounded-2xl p-5 shadow-xs flex flex-col space-y-4">
          <div className="pb-3 border-b border-gray-100 dark:border-neutral-800">
            <h3 className="font-extrabold text-sm text-gray-900 dark:text-white uppercase tracking-wider">
              Selected Day Timelines
            </h3>
            <span className="text-xs text-gray-500 dark:text-neutral-400 font-semibold font-mono">
              {new Date(year, month, activeDay).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>

          <div className="space-y-3.5 flex-1 overflow-y-auto max-h-[480px] scrollbar-thin">
            {selectedDayTasks.length === 0 ? (
              <div className="py-20 text-center flex flex-col items-center justify-center space-y-2">
                <CalendarIcon className="w-8 h-8 text-gray-300 dark:text-neutral-700" />
                <span className="text-xs text-gray-400 dark:text-neutral-500 italic">No tasks due this day</span>
              </div>
            ) : (
              selectedDayTasks.map((t) => {
                const isOverdue = t.dueDate < new Date().toISOString().split('T')[0] && t.status !== "Completed";
                return (
                  <div 
                    key={t.id} 
                    className="p-3.5 rounded-xl border border-gray-100 dark:border-neutral-800 bg-gray-50/50 dark:bg-neutral-900/10 space-y-2.5 hover:border-[#FF6B00]/40 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        t.priority === 'Urgent' ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400' :
                        t.priority === 'High' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' :
                        'bg-gray-100 text-gray-700 dark:bg-neutral-800 dark:text-neutral-400'
                      }`}>
                        {t.priority}
                      </span>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        t.status === 'Completed' ? 'bg-green-50 text-green-700 dark:bg-green-950/40' :
                        isOverdue ? 'bg-red-50 text-red-700 dark:bg-red-950/40' :
                        'bg-orange-50 text-orange-700 dark:bg-orange-950/40'
                      }`}>
                        {isOverdue ? "Overdue" : t.status}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-xs text-gray-900 dark:text-white leading-snug">{t.title}</h4>
                      {t.comment && <p className="text-[11px] text-gray-500 dark:text-neutral-400 mt-1 line-clamp-3">{t.comment}</p>}
                    </div>

                    {t.freshdeskLink && (
                      <a 
                        href={t.freshdeskLink} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="inline-flex items-center space-x-1 text-[10px] font-bold text-[#FF6B00] hover:underline"
                      >
                        <span>Open Freshdesk Ticket</span>
                        <ChevronRight className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
