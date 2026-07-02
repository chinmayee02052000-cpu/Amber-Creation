import React from "react";
import { 
  LayoutDashboard, 
  CheckSquare, 
  Calendar, 
  FileText, 
  BarChart3, 
  Bell, 
  History, 
  ShieldCheck, 
  Settings, 
  LogOut, 
  Sparkles,
  Menu,
  X,
  MessageSquare
} from "lucide-react";
import { User } from "../types";

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  currentUser: User;
  onLogout: () => void;
  unreadNotificationsCount: number;
  unreadChatMessagesCount: number;
}

export default function Sidebar({
  currentView,
  onNavigate,
  currentUser,
  onLogout,
  unreadNotificationsCount,
  unreadChatMessagesCount
}: SidebarProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const navigationItems = [
    { name: "Dashboard", icon: LayoutDashboard, roles: ["Team Member", "Senior", "Manager", "Admin"] },
    { name: "My Tasks", icon: CheckSquare, roles: ["Team Member", "Senior", "Manager", "Admin"] },
    { name: "Calendar", icon: Calendar, roles: ["Team Member", "Senior", "Manager", "Admin"] },
    { name: "Team Chat", icon: MessageSquare, badge: unreadChatMessagesCount > 0 ? unreadChatMessagesCount : undefined, roles: ["Team Member", "Senior", "Manager", "Admin"] },
    { name: "Reports", icon: FileText, roles: ["Team Member", "Senior", "Manager", "Admin"] },
    { name: "Analytics", icon: BarChart3, roles: ["Manager", "Admin"] },
    { name: "Notifications", icon: Bell, badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined, roles: ["Team Member", "Senior", "Manager", "Admin"] },
    { name: "History", icon: History, roles: ["Team Member", "Senior", "Manager", "Admin"] },
    { name: "Admin", icon: ShieldCheck, roles: ["Admin"] },
    { name: "Settings", icon: Settings, roles: ["Team Member", "Senior", "Manager", "Admin"] }
  ];

  const filteredNavigation = navigationItems.filter(item => 
    item.roles.includes(currentUser.role)
  );

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "Admin": return "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border border-red-200/50";
      case "Manager": return "bg-amber-50 text-[#FF6B00] dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200/50";
      case "Senior": return "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-200/50";
      default: return "bg-gray-100 text-gray-700 dark:bg-neutral-800 dark:text-neutral-400 border border-gray-200/30";
    }
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-4 left-4 z-40 bg-white dark:bg-[#1C1D21] p-2 rounded-lg border border-gray-200 dark:border-neutral-800 shadow-md">
        <button onClick={() => setMobileOpen(!mobileOpen)} id="mobile-sidebar-toggle">
          {mobileOpen ? <X className="w-5 h-5 text-gray-800 dark:text-white" /> : <Menu className="w-5 h-5 text-gray-800 dark:text-white" />}
        </button>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-xs md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed md:sticky top-0 left-0 z-35 h-screen w-64 bg-white dark:bg-[#141518] border-r border-gray-150 dark:border-neutral-800 flex flex-col justify-between transition-transform duration-300 md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        id="sidebar-container"
      >
        {/* Brand Header */}
        <div className="p-6 border-b border-gray-100 dark:border-neutral-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF6B00] to-[#FF8A3D] flex items-center justify-center text-white shadow-md shadow-[#FF6B00]/20 shrink-0">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div className="overflow-hidden">
              <h1 className="font-bold text-base text-gray-900 dark:text-white tracking-tight truncate leading-tight">
                Amber Creation Hub
              </h1>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-[#FF6B00] leading-none">
                Operations Panel
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5 scrollbar-thin">
          {filteredNavigation.map((item) => {
            const isActive = currentView === item.name;
            const Icon = item.icon;

            return (
              <button
                key={item.name}
                onClick={() => {
                  onNavigate(item.name);
                  setMobileOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                  isActive 
                    ? "bg-[#FF6B00]/5 text-[#FF6B00] dark:bg-[#FF6B00]/10 font-semibold" 
                    : "text-gray-600 dark:text-neutral-400 hover:bg-gray-50 dark:hover:bg-neutral-800/30 hover:text-gray-900 dark:hover:text-white"
                }`}
                id={`sidebar-link-${item.name.toLowerCase().replace(" ", "-")}`}
              >
                {/* Active Accent Border Line */}
                {isActive && (
                  <span className="absolute left-0 top-1/4 bottom-1/4 w-1 rounded-r-md bg-[#FF6B00]" />
                )}

                <div className="flex items-center space-x-3">
                  <Icon className={`w-[18px] h-[18px] transition-transform duration-200 group-hover:scale-105 ${
                    isActive ? "text-[#FF6B00]" : "text-gray-400 dark:text-neutral-500 group-hover:text-gray-600 dark:group-hover:text-neutral-300"
                  }`} />
                  <span>{item.name}</span>
                </div>

                {item.badge !== undefined && (
                  <span className="bg-[#FF6B00] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-5 text-center shadow-xs">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Info & Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-neutral-800 bg-gray-50/50 dark:bg-neutral-900/10 shrink-0">
          <div className="flex items-center space-x-3 p-2 rounded-xl border border-gray-100/50 dark:border-neutral-800/50 bg-white dark:bg-[#1C1D21] mb-3">
            {/* Avatar with Status indicator */}
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-neutral-800 dark:to-neutral-700 flex items-center justify-center font-bold text-gray-700 dark:text-white shadow-xs">
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : "U"}
              </div>
              <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-[#1C1D21] ${
                currentUser.isOnline ? "bg-green-500" : "bg-gray-300"
              }`} />
            </div>

            {/* Meta */}
            <div className="overflow-hidden flex-1">
              <h4 className="text-xs font-semibold text-gray-900 dark:text-white truncate leading-snug">
                {currentUser.name}
              </h4>
              <p className="text-[10px] text-gray-500 dark:text-neutral-400 truncate mb-1">
                {currentUser.email}
              </p>
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${getRoleBadgeColor(currentUser.role)}`}>
                {currentUser.role}
              </span>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-800 text-sm font-medium text-gray-600 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:border-red-100 dark:hover:border-red-900/50 transition-all duration-200"
            id="sidebar-logout-btn"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
