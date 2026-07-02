export type UserRole = 'Team Member' | 'Senior' | 'Manager' | 'Admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  enabled: boolean;
  lastActive?: string;
  isOnline?: boolean;
}

export type TaskStatus = 'Not Started' | 'Working' | 'Need Help' | 'Waiting on KAM' | 'Pending' | 'Completed';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface Task {
  id: string;
  title: string; // Or task category name
  assignTo: string; // User ID
  assignedBy: string; // User ID
  priority: TaskPriority;
  freshdeskLink: string;
  comment: string;
  status: TaskStatus;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskCategory {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export interface PrivateNote {
  id: string;
  userId: string;
  content: string; // HTML or markdown/text
  checklist: ChecklistItem[];
  updatedAt: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'Task Assigned' | 'Task Overdue' | 'Need Help' | 'Waiting on KAM' | 'Deadline Today' | 'System';
  read: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  taskId?: string;
  taskTitle?: string;
  oldStatus?: TaskStatus;
  newStatus?: TaskStatus;
  changeByUserId: string;
  changeByUserName: string;
  actionType: 'Create' | 'StatusUpdate' | 'Edit' | 'Delete' | 'UserUpdate' | 'CategoryUpdate';
  details: string;
}

export interface AppSettings {
  emailWhitelist: string[];
  autoRefreshInterval: number; // in seconds, default 30
}

export interface DirectMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  read: boolean;
}

