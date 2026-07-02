import React, { useEffect, useState } from "react";
import { Bell, Check, BellOff, Volume2, VolumeX, Play, Smartphone } from "lucide-react";
import { Notification as AppNotification } from "../types";

interface NotificationsViewProps {
  notifications: AppNotification[];
  onMarkRead: (id: string) => Promise<void>;
  onMarkAllRead: () => Promise<void>;
}

export default function NotificationsView({
  notifications,
  onMarkRead,
  onMarkAllRead
}: NotificationsViewProps) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if ("Notification" in window) {
      setBrowserPermission(Notification.permission);
    }
  }, []);

  const requestBrowserNotificationPermission = async () => {
    if ("Notification" in window) {
      try {
        const permission = await Notification.requestPermission();
        setBrowserPermission(permission);
        if (permission === "granted") {
          new window.Notification("Amber Creation Hub", {
            body: "Desktop alerts successfully synchronized! You will receive push signals on critical status changes.",
            icon: "/favicon.ico"
          });
        }
      } catch (err) {
        console.error("Browser notification permission failed", err);
      }
    } else {
      alert("Browser push notifications are not natively supported in this sandbox or device.");
    }
  };

  const getNotificationIconColor = (type: string) => {
    switch (type) {
      case "Task Assigned": 
        return "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border-blue-100/50";
      case "Need Help": 
        return "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 border-red-100/50";
      case "Waiting on KAM": 
        return "bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 border-purple-100/50";
      case "Task Overdue": 
        return "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border-amber-100/50";
      default: 
        return "bg-gray-50 text-gray-500 dark:bg-neutral-800 dark:text-neutral-400 border-gray-100/50";
    }
  };

  const handleTestSound = () => {
    try {
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = context.createOscillator();
      const gain = context.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, context.currentTime); // D5 chime note
      osc.frequency.setValueAtTime(880.00, context.currentTime + 0.15); // A5 chime note
      
      gain.gain.setValueAtTime(0.08, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.4);
      
      osc.connect(gain);
      gain.connect(context.destination);
      osc.start();
      osc.stop(context.currentTime + 0.4);
    } catch (e) {
      console.log("AudioContext blocked or failed", e);
    }
  };

  // Group notifications helper
  const getGroupedNotifications = () => {
    const today: AppNotification[] = [];
    const yesterday: AppNotification[] = [];
    const earlier: AppNotification[] = [];

    const todayStr = new Date().toDateString();
    
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toDateString();

    notifications.forEach((n) => {
      const dateStr = new Date(n.createdAt).toDateString();
      if (dateStr === todayStr) {
        today.push(n);
      } else if (dateStr === yesterdayStr) {
        yesterday.push(n);
      } else {
        earlier.push(n);
      }
    });

    return { today, yesterday, earlier };
  };

  const { today, yesterday, earlier } = getGroupedNotifications();
  const unreadCount = notifications.filter(n => !n.read).length;

  // Render Row Inline
  const renderRow = (n: AppNotification) => (
    <div 
      key={n.id} 
      className={`p-5 flex items-start justify-between gap-4 transition-all duration-300 rounded-xl border border-gray-100 dark:border-neutral-850/60 relative ${
        !n.read 
          ? "bg-amber-50/20 dark:bg-[#FF6B00]/5 border-l-4 border-l-[#FF6B00] shadow-3xs" 
          : "bg-white dark:bg-[#1C1D21] opacity-80 hover:opacity-100"
      }`}
      id={`notification-row-${n.id}`}
    >
      <div className="flex items-start space-x-4">
        {/* Category Indicator Icon */}
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${getNotificationIconColor(n.type)}`}>
          <Bell className="w-4 h-4" />
        </div>

        <div className="space-y-1">
          <div className="flex items-center flex-wrap gap-2">
            <span className="font-bold text-sm text-gray-900 dark:text-white leading-tight">
              {n.title}
            </span>
            <span className="text-[9px] bg-gray-50 dark:bg-neutral-800 text-gray-500 dark:text-neutral-400 px-1.5 py-0.5 rounded font-extrabold uppercase tracking-wider font-mono border border-gray-100 dark:border-neutral-700">
              {n.type}
            </span>
            {!n.read && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B00]" />
            )}
          </div>

          <p className="text-xs text-gray-600 dark:text-neutral-400 leading-relaxed font-medium">
            {n.message}
          </p>

          <span className="text-[10px] text-gray-400 font-mono font-bold block pt-0.5">
            {new Date(n.createdAt).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Mark as read button if unread */}
      {!n.read && (
        <button
          onClick={() => onMarkRead(n.id)}
          className="p-1.5 rounded-lg border border-gray-150 dark:border-neutral-800 hover:bg-green-50 hover:border-green-100 hover:text-green-600 dark:hover:bg-green-950/20 text-gray-400 transition-all shrink-0 cursor-pointer"
          title="Mark as read"
          id={`notification-read-btn-${n.id}`}
        >
          <Check className="w-4 h-4" />
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-6" id="notifications-view-container">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-150 dark:border-neutral-800 pb-5">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            Workspace Notifications <Bell className="w-5 h-5 text-[#FF6B00]" />
          </h2>
          <p className="text-sm text-gray-500 dark:text-neutral-400 font-medium">
            Stay informed with real-time operational status updates and SLA signals.
          </p>
        </div>

        {/* Top actions */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Native push toggler */}
          <button
            onClick={requestBrowserNotificationPermission}
            className={`flex items-center space-x-1.5 text-xs font-bold px-3.5 py-2.5 border rounded-xl transition-all cursor-pointer ${
              browserPermission === "granted"
                ? "bg-green-50 text-green-700 border-green-200/50 dark:bg-green-950/15 dark:text-green-400"
                : "bg-white dark:bg-[#1C1D21] border-gray-200 dark:border-neutral-800 text-gray-600 dark:text-neutral-400 hover:bg-gray-50 dark:hover:bg-neutral-850/10"
            }`}
            title="Request native push alerts for Windows/Mac desktop"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>{browserPermission === "granted" ? "Desktop Alerts Connected" : "Connect Desktop Alerts"}</span>
          </button>

          {/* Sound enabler */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2.5 rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-[#1C1D21] text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white transition-all hover:bg-gray-50 dark:hover:bg-neutral-850/20 cursor-pointer"
            title={soundEnabled ? "Disable notification sounds" : "Enable notification sounds"}
            id="sound-toggle-btn"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-[#FF6B00]" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {soundEnabled && (
            <button
              onClick={handleTestSound}
              className="flex items-center space-x-1.5 text-xs font-bold text-gray-500 dark:text-neutral-400 px-3.5 py-2.5 bg-gray-50 dark:bg-neutral-900/10 border border-gray-200 dark:border-neutral-800 rounded-xl hover:bg-gray-100 dark:hover:bg-neutral-850/20 transition-colors cursor-pointer"
              title="Test notification sound chime"
            >
              <Play className="w-3 h-3 fill-current text-gray-400" />
              <span>Chime</span>
            </button>
          )}

          {unreadCount > 0 && (
            <button
              onClick={onMarkAllRead}
              className="flex items-center space-x-1.5 bg-[#FF6B00]/5 hover:bg-[#FF6B00]/10 border border-[#FF6B00]/15 text-[#FF6B00] text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer"
              id="mark-all-read-btn"
            >
              <Check className="w-4 h-4" />
              <span>Mark All Read</span>
            </button>
          )}
        </div>
      </div>

      {/* Main notifications grid */}
      <div className="space-y-6">
        
        {notifications.length === 0 ? (
          <div className="bg-white dark:bg-[#1C1D21] border border-gray-150 dark:border-neutral-800 rounded-2xl p-20 text-center flex flex-col items-center justify-center space-y-3 shadow-3xs">
            <div className="p-3 bg-gray-50 dark:bg-neutral-900/40 rounded-full border border-gray-100 dark:border-neutral-800 text-gray-300">
              <BellOff className="w-8 h-8 text-gray-400 dark:text-neutral-500" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-gray-900 dark:text-white">All Caught Up!</h4>
              <p className="text-xs text-gray-400 dark:text-neutral-500 max-w-xs mt-1">
                You do not have any operational alerts or SLA warnings currently.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* TODAY SECTION */}
            {today.length > 0 && (
              <div className="space-y-3 animate-fade-in">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-extrabold text-[#FF6B00] uppercase tracking-wider font-mono">Today</span>
                  <div className="h-px bg-gray-100 dark:bg-neutral-800/80 flex-1" />
                  <span className="text-[10px] text-gray-450 dark:text-neutral-500 font-bold">{today.length} alerts</span>
                </div>
                <div className="space-y-2">
                  {today.map((n) => renderRow(n))}
                </div>
              </div>
            )}

            {/* YESTERDAY SECTION */}
            {yesterday.length > 0 && (
              <div className="space-y-3 animate-fade-in">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider font-mono">Yesterday</span>
                  <div className="h-px bg-gray-100 dark:bg-neutral-800/80 flex-1" />
                  <span className="text-[10px] text-gray-450 dark:text-neutral-500 font-bold">{yesterday.length} alerts</span>
                </div>
                <div className="space-y-2">
                  {yesterday.map((n) => renderRow(n))}
                </div>
              </div>
            )}

            {/* EARLIER SECTION */}
            {earlier.length > 0 && (
              <div className="space-y-3 animate-fade-in">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider font-mono">Earlier</span>
                  <div className="h-px bg-gray-100 dark:bg-neutral-800/80 flex-1" />
                  <span className="text-[10px] text-gray-450 dark:text-neutral-500 font-bold">{earlier.length} alerts</span>
                </div>
                <div className="space-y-2">
                  {earlier.map((n) => renderRow(n))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>

    </div>
  );
}
