import React, { useEffect, useState, useRef } from "react";
import { Search, Compass, CheckSquare, PlusCircle, Settings as SettingsIcon, LogOut, Moon, Sun, ArrowRight } from "lucide-react";
import { Task } from "../types";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onNavigate: (view: string) => void;
  onOpenCreateTask: () => void;
  onToggleTheme: () => void;
  isDarkMode: boolean;
}

export default function CommandPalette({
  isOpen,
  onClose,
  tasks,
  onSelectTask,
  onNavigate,
  onOpenCreateTask,
  onToggleTheme,
  isDarkMode
}: CommandPaletteProps) {
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // parent handles toggle
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSearch("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Handle outside clicks
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Build items list
  const commands = [
    { id: "nav-dash", label: "Go to Dashboard", category: "Navigation", icon: Compass, action: () => onNavigate("Dashboard") },
    { id: "nav-tasks", label: "Go to My Tasks", category: "Navigation", icon: CheckSquare, action: () => onNavigate("My Tasks") },
    { id: "nav-cal", label: "Go to Calendar", category: "Navigation", icon: CheckSquare, action: () => onNavigate("Calendar") },
    { id: "nav-reports", label: "Go to Reports", category: "Navigation", icon: CheckSquare, action: () => onNavigate("Reports") },
    { id: "nav-analytics", label: "Go to Analytics", category: "Navigation", icon: CheckSquare, action: () => onNavigate("Analytics") },
    { id: "nav-settings", label: "Go to Settings", category: "Navigation", icon: SettingsIcon, action: () => onNavigate("Settings") },
    { id: "action-create", label: "Create New Task", category: "Actions", icon: PlusCircle, action: () => { onOpenCreateTask(); onClose(); } },
    { id: "action-theme", label: `Switch to ${isDarkMode ? "Light" : "Dark"} Mode`, category: "Actions", icon: isDarkMode ? Sun : Moon, action: () => { onToggleTheme(); onClose(); } }
  ];

  // Filtered lists
  const filteredCommands = commands.filter(c => 
    c.label.toLowerCase().includes(search.toLowerCase())
  );

  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.comment.toLowerCase().includes(search.toLowerCase()) ||
    t.freshdeskLink.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 5); // Limit results to top 5

  const allItems = [
    ...filteredCommands.map(c => ({ type: "command" as const, item: c })),
    ...filteredTasks.map(t => ({ type: "task" as const, item: t }))
  ];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % allItems.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + allItems.length) % allItems.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (allItems[selectedIndex]) {
        const selected = allItems[selectedIndex];
        if (selected.type === "command") {
          selected.item.action();
        } else {
          onSelectTask(selected.item);
        }
        onClose();
      }
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/50 backdrop-blur-xs p-4 animate-fade-in" id="cmd-palette-overlay">
      <div 
        ref={containerRef}
        className="w-full max-w-2xl bg-white dark:bg-[#1C1D21] rounded-xl border border-gray-200 dark:border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[480px]"
        id="cmd-palette-box"
      >
        {/* Search header */}
        <div className="flex items-center px-4 py-3.5 border-b border-gray-100 dark:border-neutral-800">
          <Search className="w-5 h-5 text-gray-400 dark:text-neutral-500 mr-3" />
          <input
            ref={inputRef}
            type="text"
            className="w-full bg-transparent border-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none text-base font-normal"
            placeholder="Type a command or search tasks..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            id="cmd-palette-input"
          />
          <span className="text-xs bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-neutral-400 px-2 py-1 rounded font-mono font-medium">ESC</span>
        </div>

        {/* Results */}
        <div className="overflow-y-auto flex-1 py-2">
          {allItems.length === 0 ? (
            <div className="text-center py-10 text-gray-500 dark:text-neutral-400 text-sm">
              No results found for "<span className="font-semibold">{search}</span>"
            </div>
          ) : (
            <>
              {/* Commands Section */}
              {filteredCommands.length > 0 && (
                <div>
                  <div className="px-4 py-1 text-xs font-semibold text-gray-400 dark:text-neutral-500 uppercase tracking-wider">
                    Navigation & Utilities
                  </div>
                  {allItems.map((entry, index) => {
                    if (entry.type !== "command") return null;
                    const cmd = entry.item;
                    const isSelected = index === selectedIndex;
                    const Icon = cmd.icon;

                    return (
                      <button
                        key={cmd.id}
                        className={`w-full text-left px-4 py-2.5 flex items-center justify-between text-sm transition-colors ${
                          isSelected 
                            ? "bg-[#FF6B00]/10 text-[#FF6B00] dark:bg-[#FF6B00]/20" 
                            : "text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-800/50"
                        }`}
                        onClick={() => {
                          cmd.action();
                          onClose();
                        }}
                        id={`cmd-item-${cmd.id}`}
                      >
                        <div className="flex items-center">
                          <Icon className={`w-4 h-4 mr-3 ${isSelected ? "text-[#FF6B00]" : "text-gray-400 dark:text-neutral-500"}`} />
                          <span>{cmd.label}</span>
                        </div>
                        {isSelected && <ArrowRight className="w-4 h-4 text-[#FF6B00]" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Tasks Section */}
              {filteredTasks.length > 0 && (
                <div className="mt-2 border-t border-gray-100 dark:border-neutral-800 pt-2">
                  <div className="px-4 py-1 text-xs font-semibold text-gray-400 dark:text-neutral-500 uppercase tracking-wider">
                    Matching Tasks
                  </div>
                  {allItems.map((entry, index) => {
                    if (entry.type !== "task") return null;
                    const t = entry.item;
                    const isSelected = index === selectedIndex;

                    return (
                      <button
                        key={t.id}
                        className={`w-full text-left px-4 py-2.5 flex items-center justify-between text-sm transition-colors ${
                          isSelected 
                            ? "bg-[#FF6B00]/10 text-[#FF6B00] dark:bg-[#FF6B00]/20" 
                            : "text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-800/50"
                        }`}
                        onClick={() => {
                          onSelectTask(t);
                          onClose();
                        }}
                        id={`cmd-item-${t.id}`}
                      >
                        <div className="flex items-center overflow-hidden mr-4">
                          <CheckSquare className={`w-4 h-4 mr-3 shrink-0 ${isSelected ? "text-[#FF6B00]" : "text-gray-400 dark:text-neutral-500"}`} />
                          <div className="truncate">
                            <span className="font-semibold">{t.title}</span>
                            <span className="mx-2 text-gray-300 dark:text-neutral-700">|</span>
                            <span className="text-gray-500 dark:text-neutral-400 truncate text-xs">{t.comment || "No description"}</span>
                          </div>
                        </div>
                        <div className="flex items-center shrink-0 space-x-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            t.priority === 'Urgent' ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400' :
                            t.priority === 'High' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' :
                            t.priority === 'Medium' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400' :
                            'bg-gray-50 text-gray-600 dark:bg-neutral-800 dark:text-neutral-400'
                          }`}>
                            {t.priority}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            t.status === 'Completed' ? 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400' :
                            t.status === 'Working' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400' :
                            t.status === 'Waiting on KAM' ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400' :
                            t.status === 'Need Help' ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400' :
                            'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400'
                          }`}>
                            {t.status}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="bg-gray-50 dark:bg-[#17181C] px-4 py-2.5 border-t border-gray-100 dark:border-neutral-800 flex items-center justify-between text-xs text-gray-500 dark:text-neutral-400 font-normal">
          <div className="flex items-center space-x-4">
            <span><kbd className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 px-1 py-0.5 rounded shadow-xs">↑↓</kbd> to navigate</span>
            <span><kbd className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 px-1 py-0.5 rounded shadow-xs">Enter</kbd> to select</span>
          </div>
          <div>
            <span>Press <kbd className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 px-1 py-0.5 rounded shadow-xs">⌘K</kbd> to exit</span>
          </div>
        </div>
      </div>
    </div>
  );
}
