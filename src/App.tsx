import React, { useState, useEffect, useRef } from "react";
import { 
  Bell, 
  Search, 
  Sparkles, 
  Command, 
  Moon, 
  Sun, 
  ShieldAlert, 
  Mail, 
  User as UserIcon, 
  ArrowRight,
  RefreshCw,
  LogOut,
  HelpCircle,
  Clock,
  X
} from "lucide-react";
import { 
  User, 
  Task, 
  TaskCategory, 
  PrivateNote, 
  Notification, 
  AuditLog, 
  AppSettings, 
  TaskStatus,
  ChecklistItem,
  DirectMessage
} from "./types";

// Import Views
import Sidebar from "./components/Sidebar";
import DashboardView from "./components/DashboardView";
import MyTasksView from "./components/MyTasksView";
import CalendarView from "./components/CalendarView";
import AnalyticsView from "./components/AnalyticsView";
import ReportsView from "./components/ReportsView";
import HistoryView from "./components/HistoryView";
import NotificationsView from "./components/NotificationsView";
import SettingsView from "./components/SettingsView";
import HelpView from "./components/HelpView";
import ChatView from "./components/ChatView";

// Import Modals
import TaskModal from "./components/TaskModal";
import CommandPalette from "./components/CommandPalette";

export default function App() {
  // Session states
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("amber_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [loginEmail, setLoginEmail] = useState("");
  const [loginName, setLoginName] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // App core states loaded from database API
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [privateNote, setPrivateNote] = useState<PrivateNote | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [settings, setSettings] = useState<AppSettings>({ emailWhitelist: [], autoRefreshInterval: 30 });
  const [directMessages, setDirectMessages] = useState<DirectMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Layout states
  const [currentView, setCurrentView] = useState<string>("Dashboard");
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("amber_dark") === "true";
  });
  
  // Modals controllers
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [isCmdPaletteOpen, setIsCmdPaletteOpen] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);

  // Toast / live notifications alerts states
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const prevTasksCountRef = useRef<number>(0);

  // Fetch full application dataset
  const fetchAppData = async (silent = false) => {
    if (!currentUser) return;
    if (!silent) setIsLoading(true);
    
    try {
      const res = await fetch("/api/dashboard", {
        headers: {
          "Content-Type": "application/json",
          "x-user-email": currentUser.email
        }
      });
      if (res.ok) {
        const data = await res.json();
        
        // SLA checking for new assignments
        const oldActiveTasks = tasks.filter(t => t.assignTo === currentUser.id && t.status !== "Completed");
        const newActiveTasks = data.tasks.filter((t: Task) => t.assignTo === currentUser.id && t.status !== "Completed");
        
        if (oldActiveTasks.length < newActiveTasks.length && tasks.length > 0) {
          // Play notification sound
          triggerNotificationSound();
          const newlyAssigned = newActiveTasks.find((nt: Task) => !oldActiveTasks.some(ot => ot.id === nt.id));
          if (newlyAssigned) {
            triggerToast(`New Assignment: ${newlyAssigned.title}`);
          }
        }

        setTasks(data.tasks);
        setUsers(data.users);
        setCategories(data.categories);
        setNotifications(data.notifications);
        setPrivateNote(data.privateNote);
        setAuditLogs(data.auditLogs);
        setSettings(data.settings);

        // Fetch direct messages in parallel
        try {
          const chatRes = await fetch("/api/chat", {
            headers: {
              "Content-Type": "application/json",
              "x-user-email": currentUser.email
            }
          });
          if (chatRes.ok) {
            const chatData = await chatRes.json();
            const oldUnreadCount = directMessages.filter(m => m.receiverId === currentUser.id && !m.read).length;
            const newUnreadCount = chatData.filter((m: DirectMessage) => m.receiverId === currentUser.id && !m.read).length;
            if (newUnreadCount > oldUnreadCount && currentView !== "Team Chat") {
              triggerNotificationSound();
              triggerToast("New private message received!");
            }
            setDirectMessages(chatData);
          }
        } catch (chatErr) {
          console.error("Failed to fetch direct messages globally", chatErr);
        }
      } else {
        // If unauthorized/disabled, force logout
        if (res.status === 401 || res.status === 403) {
          handleLogout();
        }
      }
    } catch (e) {
      console.error("Failed to load application desk data", e);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsLoggingIn(true);

    if (!loginEmail.trim()) {
      setLoginError("Please provide your verified email.");
      setIsLoggingIn(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail.trim(), name: loginName.trim() })
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        localStorage.setItem("amber_user", JSON.stringify(data.user));
        // Redirect to main desk
        setCurrentView("Dashboard");
      } else {
        const errData = await res.json();
        setLoginError(errData.error || "Authentication rejected. Access denied.");
      }
    } catch (err) {
      setLoginError("Connection failed. Please contact your system administrator.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Logout handler
  const handleLogout = async () => {
    if (currentUser) {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-email": currentUser.email
          }
        });
      } catch (e) {
        console.error("Heartbeat logout logging out offline", e);
      }
    }
    setCurrentUser(null);
    localStorage.removeItem("amber_user");
    setTasks([]);
    setUsers([]);
    setNotifications([]);
  };

  // Heartbeat polling (keeps status online + pulls new tasks automatically every 30s)
  useEffect(() => {
    if (!currentUser) return;
    
    fetchAppData();

    const intervalId = setInterval(() => {
      fetchAppData(true);
      
      // Ping heartbeat to server to stay online
      fetch("/api/auth/heartbeat", {
        method: "POST",
        headers: { "x-user-email": currentUser.email }
      }).catch(e => console.log("offline heartbeat drop"));

    }, 30000); // 30 seconds auto-refresh

    return () => clearInterval(intervalId);
  }, [currentUser?.email]);

  // Handle Global Theme Mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("amber_dark", String(isDarkMode));
  }, [isDarkMode]);

  // Global hotkeys listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsCmdPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Play audio chime dynamically
  const triggerNotificationSound = () => {
    try {
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, context.currentTime); // D5
      osc.frequency.setValueAtTime(880.00, context.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.06, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(context.destination);
      osc.start();
      osc.stop(context.currentTime + 0.4);
    } catch (e) {
      console.log("Audio blocked");
    }
  };

  // Quick interactive toast notifications banner
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 5000); // clear after 5s
  };

  // 1. Task Operations
  const handleSaveTask = async (taskData: Partial<Task>) => {
    if (!currentUser) return;
    const isEditing = !!taskData.id;

    const url = isEditing ? `/api/tasks/${taskData.id}` : "/api/tasks";
    const method = isEditing ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "x-user-email": currentUser.email
      },
      body: JSON.stringify(taskData)
    });

    if (res.ok) {
      triggerToast(isEditing ? "Task modified successfully" : "Task created and assigned!");
      fetchAppData(true);
    } else {
      const data = await res.json();
      throw new Error(data.error || "Failed to process task operation.");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!currentUser) return;
    const confirmed = window.confirm("Are you sure you want to delete this operational task?");
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
        headers: { "x-user-email": currentUser.email }
      });
      if (res.ok) {
        triggerToast("Task deleted from ledger");
        fetchAppData(true);
      } else {
        const data = await res.json();
        alert(data.error || "Deletion rejected.");
      }
    } catch (e) {
      alert("Operation failed.");
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, status: TaskStatus) => {
    if (!currentUser) return;

    try {
      // Optimistic state updates for ultra-fast instant Linear-like UX feel
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));

      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": currentUser.email
        },
        body: JSON.stringify({ status })
      });

      if (res.ok) {
        // SLA Alerts logic for critical states
        if (["Need Help", "Waiting on KAM"].includes(status)) {
          triggerNotificationSound();
        }
        fetchAppData(true);
      } else {
        // Rollback state if server rejects
        fetchAppData();
        const data = await res.json();
        alert(data.error || "Status update failed.");
      }
    } catch (e) {
      fetchAppData();
      alert("Network synchronization failed.");
    }
  };

  // 2. Private Note Operation
  const handleSavePrivateNote = async (note: { content: string; checklist: ChecklistItem[] }) => {
    if (!currentUser) return;

    try {
      const res = await fetch("/api/notes", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": currentUser.email
        },
        body: JSON.stringify(note)
      });
      if (res.ok) {
        const data = await res.json();
        setPrivateNote(data);
      }
    } catch (e) {
      console.error("Fail to autosave private note", e);
    }
  };

  // 3. User operations (Admin only)
  const handleUpdateUserRole = async (userId: string, role: any) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": currentUser.email
        },
        body: JSON.stringify({ role })
      });
      if (res.ok) {
        triggerToast("Colleague permission updated");
        fetchAppData(true);
      }
    } catch (e) {
      alert("Reassignment rejected.");
    }
  };

  const handleUpdateUserEnablement = async (userId: string, enabled: boolean) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": currentUser.email
        },
        body: JSON.stringify({ enabled })
      });
      if (res.ok) {
        triggerToast(enabled ? "Account enabled successfully" : "Account disabled securely");
        fetchAppData(true);
      }
    } catch (e) {
      alert("Action failed.");
    }
  };

  // 4. Whitelist Operations (Admin only)
  const handleAddWhitelist = async (email: string) => {
    if (!currentUser) return;
    const res = await fetch("/api/whitelist", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-email": currentUser.email
      },
      body: JSON.stringify({ email })
    });
    if (res.ok) {
      fetchAppData(true);
    } else {
      const data = await res.json();
      throw new Error(data.error || "Rejected by security policy.");
    }
  };

  const handleRemoveWhitelist = async (email: string) => {
    if (!currentUser) return;
    const res = await fetch(`/api/whitelist/${email}`, {
      method: "DELETE",
      headers: { "x-user-email": currentUser.email }
    });
    if (res.ok) {
      triggerToast("Email removed from Whitelist directory");
      fetchAppData(true);
    } else {
      const data = await res.json();
      alert(data.error || "Rejected.");
    }
  };

  const handleCreateUser = async (userData: { name: string; email: string; role: any }) => {
    if (!currentUser) return;
    const res = await fetch("/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-email": currentUser.email
      },
      body: JSON.stringify(userData)
    });
    if (res.ok) {
      triggerToast(`Successfully registered ${userData.name}!`);
      fetchAppData(true);
    } else {
      const data = await res.json();
      throw new Error(data.error || "Failed to create user.");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!currentUser) return;
    const res = await fetch(`/api/users/${userId}`, {
      method: "DELETE",
      headers: { "x-user-email": currentUser.email }
    });
    if (res.ok) {
      triggerToast("User account access revoked.");
      fetchAppData(true);
    } else {
      const data = await res.json();
      alert(data.error || "Failed to delete user.");
    }
  };

  // 5. Category Operations (Admin only)
  const handleAddCategory = async (category: { name: string; description: string }) => {
    if (!currentUser) return;
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-email": currentUser.email
      },
      body: JSON.stringify(category)
    });
    if (res.ok) {
      fetchAppData(true);
    } else {
      const data = await res.json();
      throw new Error(data.error || "Addition failed.");
    }
  };

  // 6. Notification Read Toggles
  const handleMarkNotificationRead = async (id: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: "PUT",
        headers: { "x-user-email": currentUser.email }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      }
    } catch (e) {
      console.log("Offline mark read", e);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch("/api/notifications/read-all", {
        method: "POST",
        headers: { "x-user-email": currentUser.email }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      }
    } catch (e) {
      console.log("Offline clear all read");
    }
  };

  // Open Task editor modal
  const handleOpenEditTaskModal = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleOpenCreateTaskModal = () => {
    setEditingTask(undefined);
    setIsTaskModalOpen(true);
  };

  const handleCommandPaletteSelectTask = (task: Task) => {
    handleOpenEditTaskModal(task);
  };

  // Render main sub-views based on sidebars tabs selections
  const renderViewContent = () => {
    switch (currentView) {
      case "Dashboard":
        return (
          <DashboardView
            tasks={tasks}
            users={users}
            currentUser={currentUser!}
            privateNote={privateNote || { id: "note-dummy", userId: currentUser!.id, content: "", checklist: [], updatedAt: "" }}
            auditLogs={auditLogs}
            onSaveNote={handleSavePrivateNote}
            onEditTask={handleOpenEditTaskModal}
            onDeleteTask={handleDeleteTask}
            onUpdateTaskStatus={handleUpdateTaskStatus}
            onOpenCreateTask={handleOpenCreateTaskModal}
            onNavigate={setCurrentView}
          />
        );
      case "My Tasks":
        return (
          <MyTasksView
            tasks={tasks}
            users={users}
            currentUser={currentUser!}
            onEditTask={handleOpenEditTaskModal}
            onDeleteTask={handleDeleteTask}
            onUpdateTaskStatus={handleUpdateTaskStatus}
            onOpenCreateTask={handleOpenCreateTaskModal}
          />
        );
      case "Calendar":
        return <CalendarView tasks={tasks} />;
      case "Reports":
        return <ReportsView tasks={tasks} users={users} />;
      case "Analytics":
        return <AnalyticsView tasks={tasks} users={users} currentUser={currentUser!} />;
      case "Notifications":
        return (
          <NotificationsView
            notifications={notifications}
            onMarkRead={handleMarkNotificationRead}
            onMarkAllRead={handleMarkAllNotificationsRead}
          />
        );
      case "History":
        return <HistoryView auditLogs={auditLogs} users={users} />;
      case "Settings":
        return (
          <SettingsView
            currentUser={currentUser!}
            users={users}
            categories={categories}
            settings={settings}
            onUpdateUserRole={handleUpdateUserRole}
            onUpdateUserEnablement={handleUpdateUserEnablement}
            onAddWhitelist={handleAddWhitelist}
            onRemoveWhitelist={handleRemoveWhitelist}
            onAddCategory={handleAddCategory}
            onCreateUser={handleCreateUser}
            onDeleteUser={handleDeleteUser}
            isDarkMode={isDarkMode}
            onToggleTheme={() => setIsDarkMode(!isDarkMode)}
          />
        );
      case "Help":
        return <HelpView />;
      case "Team Chat":
        return <ChatView currentUser={currentUser!} users={users} />;
      default:
        return (
          <div className="p-10 text-center text-gray-500">
            Selected module currently in preparation.
          </div>
        );
    }
  };

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;
  const unreadChatMessagesCount = directMessages.filter(m => m.receiverId === currentUser?.id && !m.read).length;

  // VIEW 1: AUTHENTICATION LOGIN SCREEN (Strict Whitelist Check)
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#F8F9FC] dark:bg-[#121316] flex items-center justify-center p-4 transition-colors duration-300">
        <div className="w-full max-w-md bg-white dark:bg-[#1C1D21] rounded-3xl border border-gray-150 dark:border-neutral-800 shadow-2xl p-8 flex flex-col items-center relative overflow-hidden" id="auth-login-box">
          
          {/* Subtle branding graphics backgrounds */}
          <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-[#FF6B00]/5 dark:bg-[#FF6B00]/10 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-[#FF8A3D]/5 dark:bg-[#FF8A3D]/10 blur-2xl pointer-events-none" />

          {/* Logo badge */}
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF6B00] to-[#FF8A3D] flex items-center justify-center text-white shadow-lg shadow-[#FF6B00]/20 mb-6">
            <Sparkles className="w-7 h-7" />
          </div>

          <div className="text-center space-y-2 mb-8">
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-none font-sans">
              Amber Creation Hub
            </h2>
            <p className="text-xs font-semibold text-[#FF6B00] tracking-wider uppercase">
              Internal Operations Dashboard
            </p>
            <p className="text-xs text-gray-400 dark:text-neutral-500 max-w-xs mx-auto">
              Welcome back. Enter your verified email address to securely access the creation scheduler.
            </p>
          </div>

          {loginError && (
            <div className="w-full p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-2xl flex items-start space-x-2.5 text-xs text-red-700 dark:text-red-400 mb-6" id="login-error-alert">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="w-full space-y-4">
            
            {/* Display Name Input (optional helper for auto-registration) */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Full Name (Optional)
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={loginName}
                  onChange={(e) => setLoginName(e.target.value)}
                  className="w-full bg-gray-50/50 dark:bg-[#121316]/50 rounded-xl border border-gray-200 dark:border-neutral-800 text-sm px-4 py-3 pl-10 focus:outline-none focus:ring-1 focus:ring-[#FF6B00] focus:bg-white text-gray-950 dark:text-white transition-all font-medium"
                  id="login-name-input"
                />
                <UserIcon className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            {/* Email Address Input */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                AmberStudent Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="username@amberstudent.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full bg-gray-50/50 dark:bg-[#121316]/50 rounded-xl border border-gray-200 dark:border-neutral-800 text-sm px-4 py-3 pl-10 focus:outline-none focus:ring-1 focus:ring-[#FF6B00] focus:bg-white text-gray-950 dark:text-white transition-all font-semibold"
                  id="login-email-input"
                />
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-[#FF6B00] to-[#FF8A3D] hover:from-[#FF8A3D] hover:to-[#FF6B00] text-white py-3.5 rounded-xl font-bold text-sm shadow-md shadow-[#FF6B00]/15 hover:shadow-lg transition-all duration-200 disabled:opacity-50 mt-6"
              id="login-submit-btn"
            >
              <span>{isLoggingIn ? "Verifying Access Ledger..." : "Secure Login"}</span>
              {!isLoggingIn && <ArrowRight className="w-4 h-4" />}
            </button>

          </form>

          {/* Secure Whitelist notification warning */}
          <div className="mt-8 pt-4 border-t border-gray-100 dark:border-neutral-800/60 w-full text-center text-[10px] text-gray-400 dark:text-neutral-500 font-medium">
            <span>Only AmberStudent emails and whitelisted external addresses are permitted access. No public signups.</span>
          </div>

        </div>
      </div>
    );
  }

  // VIEW 2: FULLY-AUTHENTICATED MAIN WORKSPACE DASHBOARD (Glassmorphism layout)
  return (
    <div className="min-h-screen bg-[#F8F9FC] dark:bg-[#121316] flex transition-colors duration-300">
      
      {/* 1. Left Navigation Sidebar */}
      <Sidebar
        currentView={currentView}
        onNavigate={setCurrentView}
        currentUser={currentUser}
        onLogout={handleLogout}
        unreadNotificationsCount={unreadNotificationsCount}
        unreadChatMessagesCount={unreadChatMessagesCount}
      />

      {/* 2. Main Desk body container */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Navbar */}
        <header className="sticky top-0 z-20 glass-panel border-b border-gray-150 dark:border-neutral-800/80 h-16 flex items-center justify-between px-6 shrink-0" id="main-header">
          
          {/* Quick command palette shortcut trigger */}
          <button
            onClick={() => setIsCmdPaletteOpen(true)}
            className="flex items-center space-x-2 bg-gray-100/60 dark:bg-[#121316]/50 border border-gray-200 dark:border-neutral-800/60 hover:bg-white dark:hover:bg-[#1C1D21] text-xs text-gray-400 dark:text-neutral-500 px-3.5 py-1.5 rounded-lg transition-all shadow-3xs hover:border-[#FF6B00]/40"
            title="Open command palette (⌘K)"
            id="global-palette-trigger"
          >
            <Search className="w-3.5 h-3.5 shrink-0" />
            <span className="font-medium">Search commands...</span>
            <div className="flex items-center space-x-0.5 bg-white dark:bg-neutral-800 border px-1.5 py-0.5 rounded text-[9px] font-mono shrink-0 font-bold">
              <span>⌘</span>
              <span>K</span>
            </div>
          </button>

          {/* Right navbar indicators */}
          <div className="flex items-center space-x-4">
            
            {/* Auto Refresh status indicator */}
            <div className="hidden sm:flex items-center space-x-1.5 text-[10px] text-gray-400 dark:text-neutral-500 font-bold uppercase tracking-wider font-mono">
              <RefreshCw className="w-3 h-3 animate-spin text-[#FF6B00]" />
              <span>Auto Sync Live</span>
            </div>

            {/* Quick help button */}
            <button
              onClick={() => setCurrentView("Help")}
              className={`p-2 rounded-xl text-gray-400 dark:text-neutral-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-neutral-850/30 transition-all ${currentView === 'Help' ? 'text-[#FF6B00] bg-gray-50 dark:bg-neutral-800' : ''}`}
              title="Help & Guidelines"
              id="header-help-btn"
            >
              <HelpCircle className="w-5 h-5" />
            </button>

            {/* Quick Notification icon */}
            <button
              onClick={() => setCurrentView("Notifications")}
              className={`p-2 rounded-xl text-gray-400 dark:text-neutral-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-neutral-850/30 transition-all relative ${currentView === 'Notifications' ? 'text-[#FF6B00] bg-gray-50 dark:bg-neutral-800' : ''}`}
              title="Notifications Center"
              id="header-notifications-btn"
            >
              <Bell className="w-5 h-5" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#FF6B00] rounded-full border border-white dark:border-[#1C1D21] animate-pulse" />
              )}
            </button>

            {/* Quick History Drawer Trigger */}
            <button
              onClick={() => setIsHistoryDrawerOpen(true)}
              className="p-2 rounded-xl text-gray-400 dark:text-neutral-500 hover:text-[#FF6B00] dark:hover:text-[#FF6B00] hover:bg-gray-50 dark:hover:bg-neutral-850/30 transition-all flex items-center space-x-1 cursor-pointer"
              title="View Operation Audit Trail"
              id="header-history-drawer-btn"
            >
              <Clock className="w-4.5 h-4.5" />
              <span className="text-[11px] font-bold hidden md:inline">History</span>
            </button>

            <span className="h-4 w-px bg-gray-250 dark:bg-neutral-850" />

            {/* Light/Dark mode toggler */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-xl text-gray-400 dark:text-neutral-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-neutral-850/30 transition-all"
              title="Toggle theme visual preset"
              id="header-theme-toggle"
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            </button>

          </div>
        </header>

        {/* Unified Toast Alerts Popup Banner */}
        {toastMessage && (
          <div 
            className="fixed top-20 right-6 z-40 bg-neutral-900 dark:bg-[#1C1D21] border border-neutral-800 text-white dark:text-neutral-200 px-4.5 py-3 rounded-xl shadow-2xl flex items-center space-x-3 text-xs font-semibold animate-fade-in"
            id="global-toast-banner"
          >
            <Sparkles className="w-4 h-4 text-[#FF6B00] animate-spin" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* View Layout Container */}
        <main className="flex-1 overflow-y-auto p-6 scrollbar-thin" id="main-view-canvas">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-3.5">
              <RefreshCw className="w-7 h-7 animate-spin text-[#FF6B00]" />
              <span className="text-xs font-semibold text-gray-500 dark:text-neutral-400">Synchronizing creation logs...</span>
            </div>
          ) : (
            renderViewContent()
          )}
        </main>
      </div>

      {/* 3. Global Creation/Editing Task Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        task={editingTask}
        users={users}
        categories={categories}
        onSave={handleSaveTask}
        currentUser={currentUser}
      />

      {/* 4. Global Command Palette overlay (⌘K) */}
      <CommandPalette
        isOpen={isCmdPaletteOpen}
        onClose={() => setIsCmdPaletteOpen(false)}
        tasks={tasks}
        onSelectTask={handleCommandPaletteSelectTask}
        onNavigate={setCurrentView}
        onOpenCreateTask={handleOpenCreateTaskModal}
        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
        isDarkMode={isDarkMode}
      />

      {/* 5. Right-side Activity History Drawer */}
      {isHistoryDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden" id="history-drawer-overlay">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-neutral-950/40 backdrop-blur-xs transition-opacity" 
            onClick={() => setIsHistoryDrawerOpen(false)}
          />
          
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white dark:bg-[#1C1D21] border-l border-gray-150 dark:border-neutral-800 shadow-2xl flex flex-col">
              
              {/* Drawer Header */}
              <div className="px-6 py-5 border-b border-gray-100 dark:border-neutral-800 flex items-center justify-between">
                <div className="space-y-0.5">
                  <h3 className="font-extrabold text-base text-gray-900 dark:text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#FF6B00]" />
                    <span>Operation Audit History</span>
                  </h3>
                  <p className="text-[11px] text-gray-400 dark:text-neutral-500 font-medium">Real-time telemetry and task lifecycle trail.</p>
                </div>
                <button 
                  onClick={() => setIsHistoryDrawerOpen(false)}
                  className="p-1.5 rounded-lg border border-gray-100 dark:border-neutral-800 text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
                {auditLogs.length === 0 ? (
                  <div className="text-center py-20 text-gray-400 space-y-2">
                    <Clock className="w-8 h-8 mx-auto text-gray-350 dark:text-neutral-600" />
                    <p className="text-xs font-bold">No historical records found.</p>
                  </div>
                ) : (
                  <div className="relative border-l border-gray-150 dark:border-neutral-800 ml-4 space-y-8">
                    {auditLogs.slice(0, 50).map((log) => {
                      const initials = log.changeByUserName ? log.changeByUserName.split(" ").map(n => n[0]).join("").substring(0,2).toUpperCase() : "OP";
                      return (
                        <div key={log.id} className="relative pl-6" id={`history-drawer-item-${log.id}`}>
                          {/* Marker dot */}
                          <div className="absolute -left-[6px] top-1 w-3 h-3 rounded-full bg-white dark:bg-[#1C1D21] border-2 border-[#FF6B00]" />
                          
                          <div className="space-y-2">
                            {/* Meta & User info */}
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#FF6B00]/10 to-[#FF8A3D]/10 border border-[#FF6B00]/10 flex items-center justify-center shrink-0">
                                <span className="text-[9px] font-bold text-[#FF6B00]">{initials}</span>
                              </div>
                              <div>
                                <span className="text-xs font-bold text-gray-900 dark:text-white">{log.changeByUserName}</span>
                                <span className="text-[10px] text-gray-400 block font-mono">{new Date(log.timestamp).toLocaleString()}</span>
                              </div>
                            </div>

                            {/* Details text */}
                            <div className="bg-gray-50 dark:bg-neutral-900/40 border border-gray-100 dark:border-neutral-850 p-3 rounded-xl text-xs space-y-2 leading-relaxed">
                              <p className="text-gray-700 dark:text-neutral-350 font-medium">
                                {log.details}
                              </p>

                              {/* Task & status pill updates */}
                              {(log.oldStatus || log.newStatus) && (
                                <div className="flex items-center flex-wrap gap-1.5 text-[10px]">
                                  {log.oldStatus && (
                                    <span className="px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-500 border dark:bg-neutral-800 dark:text-neutral-400 font-bold uppercase font-mono">{log.oldStatus}</span>
                                  )}
                                  {log.oldStatus && <span className="text-gray-400">→</span>}
                                  {log.newStatus && (
                                    <span className="px-1.5 py-0.5 rounded-md bg-[#FF6B00]/5 text-[#FF6B00] border border-[#FF6B00]/15 font-bold uppercase font-mono">{log.newStatus}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              
              {/* Drawer Footer */}
              <div className="p-4 bg-gray-50 dark:bg-neutral-900/20 border-t border-gray-100 dark:border-neutral-800/80 text-center text-[10px] text-gray-400 font-mono">
                Showing last 50 creation events.
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
