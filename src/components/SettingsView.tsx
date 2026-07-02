import React, { useState } from "react";
import { 
  Settings as SettingsIcon, 
  User as UserIcon, 
  ShieldAlert, 
  UserPlus, 
  UserCheck, 
  UserMinus, 
  Mail, 
  FolderPlus, 
  Trash2, 
  Check, 
  AlertCircle, 
  ChevronRight,
  Plus,
  Search,
  SlidersHorizontal,
  RefreshCw,
  ChevronLeft
} from "lucide-react";
import { User, TaskCategory, AppSettings } from "../types";

interface SettingsViewProps {
  currentUser: User;
  users: User[];
  categories: TaskCategory[];
  settings: AppSettings;
  onUpdateUserRole: (id: string, role: any) => Promise<void>;
  onUpdateUserEnablement: (id: string, enabled: boolean) => Promise<void>;
  onAddWhitelist: (email: string) => Promise<void>;
  onRemoveWhitelist: (email: string) => Promise<void>;
  onAddCategory: (category: { name: string; description: string }) => Promise<void>;
  onCreateUser: (user: { name: string; email: string; role: any }) => Promise<void>;
  onDeleteUser: (id: string) => Promise<void>;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export default function SettingsView({
  currentUser,
  users,
  categories,
  settings,
  onUpdateUserRole,
  onUpdateUserEnablement,
  onAddWhitelist,
  onRemoveWhitelist,
  onAddCategory,
  onCreateUser,
  onDeleteUser,
  isDarkMode,
  onToggleTheme
}: SettingsViewProps) {
  // Navigation
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'users' | 'whitelist' | 'categories'>('profile');

  // Whitelist states
  const [whitelistEmail, setWhitelistEmail] = useState("");
  const [whitelistError, setWhitelistError] = useState("");
  const [whitelistSuccess, setWhitelistSuccess] = useState("");

  // Category states
  const [categoryName, setCategoryName] = useState("");
  const [categoryDesc, setCategoryDesc] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [categorySuccess, setCategorySuccess] = useState("");

  // Upgraded User Management states
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Add User Modal/Form state
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<string>("Team Member");
  const [addUserError, setAddUserError] = useState("");
  const [addUserSuccess, setAddUserSuccess] = useState("");

  // Reset Access state for animation
  const [resettingUserId, setResettingUserId] = useState<string | null>(null);

  // Whitelist submission
  const handleAddWhitelist = async (e: React.FormEvent) => {
    e.preventDefault();
    setWhitelistError("");
    setWhitelistSuccess("");
    
    const emailLower = whitelistEmail.trim().toLowerCase();
    if (!emailLower) return;

    if (!emailLower.endsWith("@amberstudent.com") && emailLower !== "chinmayee02052000@gmail.com") {
      setWhitelistError("Only AmberStudent domains (@amberstudent.com) are permitted.");
      return;
    }

    try {
      await onAddWhitelist(emailLower);
      setWhitelistSuccess(`Successfully whitelisted: ${emailLower}`);
      setWhitelistEmail("");
    } catch (err: any) {
      setWhitelistError(err?.message || "Failed to add email to whitelist.");
    }
  };

  // Category submission
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCategoryError("");
    setCategorySuccess("");

    if (!categoryName.trim()) {
      setCategoryError("Category Name is required.");
      return;
    }

    try {
      await onAddCategory({
        name: categoryName.trim(),
        description: categoryDesc.trim()
      });
      setCategorySuccess(`Category '${categoryName}' successfully registered!`);
      setCategoryName("");
      setCategoryDesc("");
    } catch (err: any) {
      setCategoryError(err?.message || "Failed to add category.");
    }
  };

  // Add User Submit Handler
  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddUserError("");
    setAddUserSuccess("");

    const name = newUserName.trim();
    const email = newUserEmail.trim().toLowerCase();

    if (!name || !email) {
      setAddUserError("All fields are required.");
      return;
    }

    if (!email.endsWith("@amberstudent.com") && email !== "chinmayee02052000@gmail.com") {
      setAddUserError("Only AmberStudent email domains are whitelisted.");
      return;
    }

    try {
      await onCreateUser({ name, email, role: newUserRole });
      setAddUserSuccess(`Successfully whitelisted and registered ${name}!`);
      setNewUserName("");
      setNewUserEmail("");
      setNewUserRole("Team Member");
      setTimeout(() => {
        setIsAddUserOpen(false);
        setAddUserSuccess("");
      }, 1500);
    } catch (err: any) {
      setAddUserError(err?.message || "Failed to add user.");
    }
  };

  // Reset User Access Handler (Simulated Security Refresh)
  const handleResetUserAccess = async (user: User) => {
    setResettingUserId(user.id);
    // Simulate API calling with timeout
    setTimeout(() => {
      setResettingUserId(null);
      alert(`Access key and session tokens have been successfully refreshed for ${user.name} (${user.email}). Standard whitelisting active.`);
    }, 1200);
  };

  // Remove Access Handler
  const handleRemoveUserAccess = async (user: User) => {
    const confirm = window.confirm(`CRITICAL: Are you sure you want to completely revoke access and remove ${user.name} from the active directory? This will remove them from the Whitelist as well.`);
    if (!confirm) return;

    try {
      await onDeleteUser(user.id);
    } catch (err: any) {
      alert(err?.message || "Failed to remove user access.");
    }
  };

  const isAdmin = currentUser.role === "Admin";

  // Filter & Search Users
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
                          u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = roleFilter === "All" || u.role === roleFilter;
    const matchesStatus = statusFilter === "All" || 
                          (statusFilter === "Enabled" && u.enabled) || 
                          (statusFilter === "Disabled" && !u.enabled);
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Pagination bounds
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getInitials = (name: string) => {
    return name ? name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() : "OP";
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Admin": return "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border-red-100";
      case "Manager": return "bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400 border-purple-100";
      case "Senior": return "bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border-blue-100";
      default: return "bg-gray-50 text-gray-700 dark:bg-neutral-800 dark:text-neutral-400 border-gray-100";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="settings-view-container">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-150 dark:border-neutral-800 pb-5">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            Control Settings <SettingsIcon className="w-5 h-5 text-[#FF6B00]" />
          </h2>
          <p className="text-sm text-gray-500 dark:text-neutral-400 font-medium">
            Manage your personal profile, workspace theme, and team administrative modules.
          </p>
        </div>
      </div>

      {/* Grid: Left tab picker, Right content panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Navigation Tabs Panel */}
        <div className="lg:col-span-1 space-y-1 bg-white dark:bg-[#1C1D21] p-4 border border-gray-150 dark:border-neutral-800 rounded-2xl shadow-3xs h-fit">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block px-3.5 mb-2">My Settings</span>
          <button
            onClick={() => setActiveSubTab('profile')}
            className={`w-full text-left px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-between ${
              activeSubTab === 'profile' 
                ? 'bg-[#FF6B00]/5 text-[#FF6B00] dark:bg-[#FF6B00]/10 font-bold' 
                : 'text-gray-600 dark:text-neutral-400 hover:bg-gray-50 dark:hover:bg-neutral-850/20'
            }`}
          >
            <div className="flex items-center space-x-2">
              <UserIcon className="w-4 h-4" />
              <span>Personal Profile</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 opacity-40" />
          </button>

          {isAdmin && (
            <>
              <div className="border-t border-gray-100 dark:border-neutral-800/60 my-2 pt-2" />
              <span className="text-[10px] font-bold text-[#FF6B00] uppercase tracking-wider block px-3.5 mb-2 font-mono">Control Center</span>
              
              {/* User management */}
              <button
                onClick={() => {
                  setActiveSubTab('users');
                  setCurrentPage(1);
                }}
                className={`w-full text-left px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-between ${
                  activeSubTab === 'users' 
                    ? 'bg-[#FF6B00]/5 text-[#FF6B00] dark:bg-[#FF6B00]/10 font-bold' 
                    : 'text-gray-600 dark:text-neutral-400 hover:bg-gray-50 dark:hover:bg-neutral-850/20'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <UserCheck className="w-4 h-4" />
                  <span>Team Role Manager</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-40" />
              </button>

              {/* Whitelist Directory */}
              <button
                onClick={() => setActiveSubTab('whitelist')}
                className={`w-full text-left px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-between ${
                  activeSubTab === 'whitelist' 
                    ? 'bg-[#FF6B00]/5 text-[#FF6B00] dark:bg-[#FF6B00]/10 font-bold' 
                    : 'text-gray-600 dark:text-neutral-400 hover:bg-gray-50 dark:hover:bg-neutral-850/20'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <span>Amber Whitelist Directory</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-40" />
              </button>

              {/* Task categories editor */}
              <button
                onClick={() => setActiveSubTab('categories')}
                className={`w-full text-left px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-between ${
                  activeSubTab === 'categories' 
                    ? 'bg-[#FF6B00]/5 text-[#FF6B00] dark:bg-[#FF6B00]/10 font-bold' 
                    : 'text-gray-600 dark:text-neutral-400 hover:bg-gray-50 dark:hover:bg-neutral-850/20'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <FolderPlus className="w-4 h-4" />
                  <span>Operational Task Types</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-40" />
              </button>
            </>
          )}
        </div>

        {/* Right Content Panel (Spans 3 Columns) */}
        <div className="lg:col-span-3 bg-white dark:bg-[#1C1D21] border border-gray-150 dark:border-neutral-800 rounded-2xl p-6 shadow-xs relative overflow-hidden">
          
          {/* PROFILE SUB-TAB */}
          {activeSubTab === 'profile' && (
            <div className="space-y-6" id="settings-profile-tab">
              <div>
                <h3 className="font-extrabold text-base text-gray-900 dark:text-white mb-1">Personal Account & Preferences</h3>
                <p className="text-xs text-gray-400 dark:text-neutral-500 font-medium">Review your role, set preferred interface parameters and toggles.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-neutral-800">
                <div className="p-4 bg-gray-50 dark:bg-neutral-900/10 rounded-xl space-y-1 border border-gray-100/50 dark:border-neutral-800">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block font-mono">Display Name</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white block">{currentUser.name}</span>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-neutral-900/10 rounded-xl space-y-1 border border-gray-100/50 dark:border-neutral-800">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block font-mono">Verified Email</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white block">{currentUser.email}</span>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-neutral-900/10 rounded-xl space-y-1 border border-gray-100/50 dark:border-neutral-800">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block font-mono">Workspace Role Permission</span>
                  <span className="text-sm font-bold text-[#FF6B00] block">{currentUser.role}</span>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-neutral-900/10 rounded-xl space-y-1 border border-gray-100/50 dark:border-neutral-800">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block font-mono">Account Health Status</span>
                  <span className="text-sm font-bold text-green-500 block">Verified Active</span>
                </div>
              </div>

              {/* Theme toggle preference */}
              <div className="pt-6 border-t border-gray-100 dark:border-neutral-800 flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-sm text-gray-900 dark:text-white">Dark Mode Theme</h4>
                  <p className="text-xs text-gray-400 dark:text-neutral-500 font-medium">Toggle dark visual mode instantly for low-light comfort.</p>
                </div>
                <button
                  onClick={onToggleTheme}
                  className={`w-12 h-6 rounded-full p-0.5 transition-colors cursor-pointer relative ${isDarkMode ? 'bg-[#FF6B00]' : 'bg-gray-200 dark:bg-neutral-800'}`}
                  id="settings-theme-toggle"
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform transform ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Accessibility */}
              <div className="pt-6 border-t border-gray-100 dark:border-neutral-800 flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-sm text-gray-900 dark:text-white">Accessibility SLA Guidelines</h4>
                  <p className="text-xs text-gray-400 dark:text-neutral-500 font-medium">WCAG AA compliance is globally enabled by default.</p>
                </div>
                <span className="text-[10px] bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400 px-2 py-0.5 rounded font-bold border border-green-150 font-mono">Enabled</span>
              </div>
            </div>
          )}

          {/* TEAM ROLE MANAGER (Upgraded Admin Panel) */}
          {activeSubTab === 'users' && isAdmin && (
            <div className="space-y-6" id="settings-users-tab">
              
              {/* Header with Add User toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-extrabold text-base text-gray-900 dark:text-white mb-0.5">Team Role Directory Manager</h3>
                  <p className="text-xs text-gray-400 dark:text-neutral-500 font-medium">Reassign operational roles, enable/disable accounts, or reset secure security hashes.</p>
                </div>
                <button
                  onClick={() => setIsAddUserOpen(!isAddUserOpen)}
                  className="inline-flex items-center space-x-1.5 bg-[#FF6B00] hover:bg-[#FF8A3D] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add User</span>
                </button>
              </div>

              {/* Add User Inline Modal Form Panel */}
              {isAddUserOpen && (
                <div className="p-5 bg-gray-50 dark:bg-neutral-900/25 border border-gray-150 dark:border-neutral-800 rounded-2xl space-y-4 animate-slide-down relative">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-neutral-850">
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center space-x-1.5">
                      <UserPlus className="w-4 h-4 text-[#FF6B00]" />
                      <span>Register New Operations Officer</span>
                    </h4>
                    <button 
                      onClick={() => {
                        setIsAddUserOpen(false);
                        setAddUserError("");
                        setAddUserSuccess("");
                      }}
                      className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-neutral-300 font-bold"
                    >
                      Cancel
                    </button>
                  </div>

                  {addUserError && (
                    <div className="p-3 bg-red-50 text-red-700 rounded-xl flex items-center space-x-2 text-xs border border-red-100">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span className="font-semibold">{addUserError}</span>
                    </div>
                  )}
                  {addUserSuccess && (
                    <div className="p-3 bg-green-50 text-green-700 rounded-xl flex items-center space-x-2 text-xs border border-green-100">
                      <Check className="w-4 h-4 shrink-0" />
                      <span className="font-semibold">{addUserSuccess}</span>
                    </div>
                  )}

                  <form onSubmit={handleAddUserSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block font-mono">Full Name</label>
                      <input
                        type="text"
                        required
                        placeholder="John Doe"
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                        className="w-full bg-white dark:bg-[#121316] border border-gray-200 dark:border-neutral-800 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#FF6B00] text-gray-900 dark:text-white font-medium"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block font-mono">Amber Email</label>
                      <input
                        type="email"
                        required
                        placeholder="john.doe@amberstudent.com"
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        className="w-full bg-white dark:bg-[#121316] border border-gray-200 dark:border-neutral-800 text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#FF6B00] text-gray-900 dark:text-white font-medium"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block font-mono">Operational Role</label>
                      <div className="flex space-x-2">
                        <select
                          value={newUserRole}
                          onChange={(e) => setNewUserRole(e.target.value)}
                          className="flex-1 bg-white dark:bg-[#121316] border border-gray-200 dark:border-neutral-800 text-xs px-3 py-2.5 rounded-xl focus:outline-none text-gray-900 dark:text-white font-bold cursor-pointer"
                        >
                          <option value="Team Member">Team Member</option>
                          <option value="Senior">Senior</option>
                          <option value="Manager">Manager</option>
                          <option value="Admin">Admin</option>
                        </select>
                        <button
                          type="submit"
                          className="bg-[#FF6B00] hover:bg-[#FF8A3D] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}

              {/* Search and Filters Segment */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 bg-gray-50/50 dark:bg-neutral-900/10 border border-gray-150 dark:border-neutral-800 rounded-2xl">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search employee directory by name or email..."
                    value={userSearch}
                    onChange={(e) => {
                      setUserSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full bg-white dark:bg-[#121316] border border-gray-200 dark:border-neutral-800 text-xs px-3.5 py-2.5 pl-9 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#FF6B00] text-gray-900 dark:text-white"
                  />
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3.5" />
                </div>

                {/* Filters Row */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center space-x-1">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Role:</span>
                  </div>
                  <select
                    value={roleFilter}
                    onChange={(e) => {
                      setRoleFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="bg-white dark:bg-[#121316] border border-gray-200 dark:border-neutral-800 rounded-lg px-2 py-1.5 text-xs text-gray-700 dark:text-neutral-300 font-semibold focus:outline-none cursor-pointer"
                  >
                    <option value="All">All Roles</option>
                    <option value="Admin">Admin</option>
                    <option value="Manager">Manager</option>
                    <option value="Senior">Senior</option>
                    <option value="Team Member">Team Member</option>
                  </select>

                  <div className="flex items-center space-x-1 pl-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Status:</span>
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="bg-white dark:bg-[#121316] border border-gray-200 dark:border-neutral-800 rounded-lg px-2 py-1.5 text-xs text-gray-700 dark:text-neutral-300 font-semibold focus:outline-none cursor-pointer"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Enabled">Active / Enabled</option>
                    <option value="Disabled">Disabled</option>
                  </select>
                </div>
              </div>

              {/* Table list */}
              <div className="overflow-x-auto border border-gray-150 dark:border-neutral-800 rounded-2xl shadow-3xs bg-white dark:bg-[#1C1D21]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-150 dark:border-neutral-800 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50 dark:bg-neutral-900/10">
                      <th className="px-5 py-3.5">Employee Name & Profile</th>
                      <th className="px-5 py-3.5">Amber Email</th>
                      <th className="px-5 py-3.5 text-center">Permitted Role</th>
                      <th className="px-5 py-3.5 text-center">Status</th>
                      <th className="px-5 py-3.5">Last Log</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-neutral-800 text-xs">
                    {paginatedUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-16 text-gray-400 font-medium">
                          No employees match the selected criteria.
                        </td>
                      </tr>
                    ) : (
                      paginatedUsers.map((u) => {
                        const isSelf = u.id === currentUser.id;
                        return (
                          <tr key={u.id} className="hover:bg-gray-50/40 dark:hover:bg-neutral-850/10 transition-colors">
                            {/* Avatar & Employee Name */}
                            <td className="px-5 py-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#FF6B00]/20 to-[#FF8A3D]/20 border border-[#FF6B00]/10 flex items-center justify-center shrink-0">
                                  <span className="text-[10px] font-extrabold text-[#FF6B00]">{getInitials(u.name)}</span>
                                </div>
                                <div className="space-y-0.5">
                                  <span className="text-gray-900 dark:text-white font-bold flex items-center gap-1">
                                    {u.name}
                                    {isSelf && <span className="text-[9px] bg-[#FF6B00]/5 text-[#FF6B00] px-1.5 py-0.5 rounded-sm font-mono uppercase">You</span>}
                                  </span>
                                  <span className="text-[10px] font-mono text-gray-400">UID: {u.id}</span>
                                </div>
                              </div>
                            </td>

                            {/* Amber Email */}
                            <td className="px-5 py-4 font-medium text-gray-600 dark:text-neutral-300">
                              {u.email}
                            </td>

                            {/* Permitted Role (Edit Role selector inline) */}
                            <td className="px-5 py-4 text-center">
                              <select
                                value={u.role}
                                disabled={isSelf}
                                onChange={(e) => onUpdateUserRole(u.id, e.target.value as any)}
                                className={`rounded border border-gray-200 dark:border-neutral-800 px-2 py-1 text-xs text-gray-800 dark:text-white font-bold focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${getRoleColor(u.role)}`}
                                id={`user-role-select-${u.id}`}
                              >
                                <option value="Team Member">Team Member</option>
                                <option value="Senior">Senior</option>
                                <option value="Manager">Manager</option>
                                <option value="Admin">Admin</option>
                              </select>
                            </td>

                            {/* Status Indicator */}
                            <td className="px-5 py-4 text-center">
                              <span className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                                u.enabled 
                                  ? "bg-green-50 text-green-700 border-green-200/40 dark:bg-green-950/20 dark:text-green-400" 
                                  : "bg-red-50 text-red-700 border-red-200/40 dark:bg-red-950/20 dark:text-red-400"
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${u.enabled ? 'bg-green-500' : 'bg-red-500'}`} />
                                <span>{u.enabled ? "Active" : "Disabled"}</span>
                              </span>
                            </td>

                            {/* Last Login/Active */}
                            <td className="px-5 py-4 font-mono text-gray-400 text-[10px]">
                              {u.lastActive ? new Date(u.lastActive).toLocaleString() : "Never active"}
                            </td>

                            {/* Real Actions row */}
                            <td className="px-5 py-4 text-right">
                              <div className="flex items-center justify-end space-x-1.5">
                                {/* Disable User Toggle Button */}
                                <button
                                  onClick={() => onUpdateUserEnablement(u.id, !u.enabled)}
                                  disabled={isSelf}
                                  className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                    u.enabled 
                                      ? "bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200/50 hover:border-amber-300 dark:bg-amber-950/10 dark:text-amber-400 dark:border-amber-900/40" 
                                      : "bg-green-50 text-green-700 hover:bg-green-100 border-green-200/50 hover:border-green-300 dark:bg-green-950/10 dark:text-green-400 dark:border-green-900/40"
                                  } disabled:opacity-30 disabled:cursor-not-allowed`}
                                  title={u.enabled ? "Disable user access" : "Re-enable user access"}
                                >
                                  {u.enabled ? <UserMinus className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                                </button>

                                {/* Reset Access Trigger */}
                                <button
                                  onClick={() => handleResetUserAccess(u)}
                                  className="p-1.5 rounded-lg border border-gray-200 dark:border-neutral-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-all cursor-pointer"
                                  title="Reset Access Keys & Token Sessions"
                                >
                                  <RefreshCw className={`w-3.5 h-3.5 ${resettingUserId === u.id ? 'animate-spin text-[#FF6B00]' : ''}`} />
                                </button>

                                {/* Revoke / Remove Access Button */}
                                <button
                                  onClick={() => handleRemoveUserAccess(u)}
                                  disabled={isSelf}
                                  className="p-1.5 rounded-lg border border-red-100 dark:border-red-950 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                  title="Remove All Access (Revoke credentials & remove whitelist)"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Section */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-gray-500 dark:text-neutral-400 font-medium">
                  Showing <strong className="font-semibold text-gray-800 dark:text-white">{Math.min(filteredUsers.length, (currentPage - 1) * itemsPerPage + 1)}</strong> to <strong className="font-semibold text-gray-800 dark:text-white">{Math.min(filteredUsers.length, currentPage * itemsPerPage)}</strong> of <strong className="font-semibold text-gray-800 dark:text-white">{filteredUsers.length}</strong> officers
                </span>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-gray-150 dark:border-neutral-800 bg-white dark:bg-[#121316] text-gray-600 dark:text-neutral-400 hover:bg-gray-50 dark:hover:bg-neutral-850/20 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-bold text-gray-600 dark:text-neutral-400 px-3">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-gray-150 dark:border-neutral-800 bg-white dark:bg-[#121316] text-gray-600 dark:text-neutral-400 hover:bg-gray-50 dark:hover:bg-neutral-850/20 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* AMBER WHITELIST DIRECTORY */}
          {activeSubTab === 'whitelist' && isAdmin && (
            <div className="space-y-6" id="settings-whitelist-tab">
              <div>
                <h3 className="font-extrabold text-base text-gray-900 dark:text-white mb-1">Amber Whitelist Directory</h3>
                <p className="text-xs text-gray-400 dark:text-neutral-500 font-medium">Only verified users within this whitelisted directory are allowed login access.</p>
              </div>

              {/* Add Whitelist Form */}
              <form onSubmit={handleAddWhitelist} className="p-4 bg-gray-50 dark:bg-neutral-900/10 rounded-2xl border border-gray-150 dark:border-neutral-800 space-y-4">
                <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">Whitelist New Colleague</h4>
                
                {whitelistError && (
                  <div className="p-3 bg-red-50 text-red-700 rounded-xl flex items-center space-x-2 text-xs border border-red-100">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{whitelistError}</span>
                  </div>
                )}
                {whitelistSuccess && (
                  <div className="p-3 bg-green-50 text-green-700 rounded-xl flex items-center space-x-2 text-xs border border-green-100">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>{whitelistSuccess}</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <input
                      type="email"
                      required
                      placeholder="colleague@amberstudent.com"
                      value={whitelistEmail}
                      onChange={(e) => setWhitelistEmail(e.target.value)}
                      className="w-full bg-white dark:bg-[#121316] border border-gray-200 dark:border-neutral-800 text-xs px-3.5 py-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#FF6B00] text-gray-900 dark:text-white font-medium"
                      id="whitelist-email-input"
                    />
                    <Mail className="w-4 h-4 text-gray-400 absolute right-3.5 top-3.5" />
                  </div>
                  <button
                    type="submit"
                    className="bg-[#FF6B00] hover:bg-[#FF8A3D] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all shrink-0 cursor-pointer"
                    id="whitelist-submit-btn"
                  >
                    Whitelist Email
                  </button>
                </div>
              </form>

              {/* Whitelist Directory table */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block font-mono">Whitelisted Entries ({settings.emailWhitelist.length})</span>
                <div className="max-h-56 overflow-y-auto border border-gray-150 dark:border-neutral-800 rounded-xl divide-y divide-gray-100 dark:divide-neutral-800">
                  {settings.emailWhitelist.map((email) => (
                    <div key={email} className="flex items-center justify-between p-3.5 bg-white dark:bg-[#1C1D21] hover:bg-gray-50/50 transition-colors">
                      <span className="text-xs font-bold text-gray-850 dark:text-neutral-350">{email}</span>
                      <button
                        onClick={() => onRemoveWhitelist(email)}
                        disabled={email === currentUser.email} // Cannot remove yourself
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 disabled:opacity-30 transition-colors cursor-pointer"
                        title="Remove Whitelist entry"
                        id={`whitelist-remove-${email}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* OPERATIONAL TASK TYPES */}
          {activeSubTab === 'categories' && isAdmin && (
            <div className="space-y-6" id="settings-categories-tab">
              <div>
                <h3 className="font-extrabold text-base text-gray-900 dark:text-white mb-1">Operational Task Types Category Creator</h3>
                <p className="text-xs text-gray-400 dark:text-neutral-500 font-medium">Add custom operational workflows that immediately auto-populate task creation dropdowns.</p>
              </div>

              {/* Add Category Form */}
              <form onSubmit={handleAddCategory} className="p-4 bg-gray-50 dark:bg-neutral-900/10 rounded-2xl border border-gray-150 dark:border-neutral-800 space-y-4">
                <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">Register New Category</h4>

                {categoryError && (
                  <div className="p-3 bg-red-50 text-red-700 rounded-xl flex items-center space-x-2 text-xs border border-red-100">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{categoryError}</span>
                  </div>
                )}
                {categorySuccess && (
                  <div className="p-3 bg-green-50 text-green-700 rounded-xl flex items-center space-x-2 text-xs border border-green-100">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>{categorySuccess}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block font-mono">Category Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Campaign Onboarding"
                      value={categoryName}
                      onChange={(e) => setCategoryName(e.target.value)}
                      className="w-full bg-white dark:bg-[#121316] border border-gray-200 dark:border-neutral-800 text-xs px-3.5 py-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#FF6B00] text-gray-900 dark:text-white font-medium"
                      id="cat-name-input"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block font-mono">Description</label>
                    <input
                      type="text"
                      placeholder="Operational summary of workflow"
                      value={categoryDesc}
                      onChange={(e) => setCategoryDesc(e.target.value)}
                      className="w-full bg-white dark:bg-[#121316] border border-gray-200 dark:border-neutral-800 text-xs px-3.5 py-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#FF6B00] text-gray-900 dark:text-white font-medium"
                      id="cat-desc-input"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="bg-[#FF6B00] hover:bg-[#FF8A3D] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
                  id="cat-submit-btn"
                >
                  Create Category
                </button>
              </form>

              {/* Categories list */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block font-mono">Active Creation Workflows ({categories.length})</span>
                <div className="max-h-56 overflow-y-auto border border-gray-150 dark:border-neutral-800 rounded-xl divide-y divide-gray-100 dark:divide-neutral-800">
                  {categories.map((cat) => (
                    <div key={cat.id} className="p-4 bg-white dark:bg-[#1C1D21] hover:bg-gray-50/50 transition-colors flex flex-col justify-between">
                      <span className="text-xs font-bold text-gray-900 dark:text-white block">{cat.name}</span>
                      <span className="text-[11px] text-gray-500 dark:text-neutral-400 block font-normal mt-0.5">{cat.description || "No description provided."}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
