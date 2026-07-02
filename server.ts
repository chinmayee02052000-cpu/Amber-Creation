import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { 
  User, 
  UserRole,
  Task, 
  TaskCategory, 
  PrivateNote, 
  Notification, 
  AuditLog, 
  AppSettings,
  TaskStatus,
  TaskPriority,
  DirectMessage
} from "./src/types";

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "db.json");

app.use(express.json());

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substring(2, 11);

// Database interface
interface DatabaseSchema {
  users: User[];
  tasks: Task[];
  categories: TaskCategory[];
  notifications: Notification[];
  privateNotes: Record<string, PrivateNote>; // userId -> Note
  auditLogs: AuditLog[];
  whitelist: string[];
  settings: AppSettings;
  directMessages?: DirectMessage[];
}

// Initial/default database seed
const getInitialDb = (): DatabaseSchema => {
  const defaultWhitelist = [
    "chinmayee02052000@gmail.com",
    "himanshu.s@amberstudent.com",
    "admin@amberstudent.com",
    "manager@amberstudent.com",
    "senior@amberstudent.com",
    "team1@amberstudent.com",
    "team2@amberstudent.com"
  ];

  const defaultUsers: User[] = [
    { id: "u-admin", name: "Chinmayee Admin", email: "chinmayee02052000@gmail.com", role: "Admin", enabled: true, isOnline: true },
    { id: "u-himanshu", name: "Himanshu S", email: "himanshu.s@amberstudent.com", role: "Admin", enabled: true, isOnline: false },
    { id: "u-mgr", name: "Sarah Jenkins", email: "manager@amberstudent.com", role: "Manager", enabled: true, isOnline: true },
    { id: "u-snr", name: "Alex Rivers", email: "senior@amberstudent.com", role: "Senior", enabled: true, isOnline: false },
    { id: "u-tm1", name: "John Doe", email: "team1@amberstudent.com", role: "Team Member", enabled: true, isOnline: true },
    { id: "u-tm2", name: "Jane Smith", email: "team2@amberstudent.com", role: "Team Member", enabled: true, isOnline: false }
  ];

  const defaultCategories: TaskCategory[] = [
    { id: "cat-1", name: "Property Creation", description: "Listing new amber properties", createdAt: new Date().toISOString() },
    { id: "cat-2", name: "Policy Framing", description: "Formulating legal and booking policies", createdAt: new Date().toISOString() },
    { id: "cat-3", name: "Commission Updates", description: "Updating manager/owner commission values", createdAt: new Date().toISOString() },
    { id: "cat-4", name: "FAQ Updates", description: "Reviewing and adding property/local FAQs", createdAt: new Date().toISOString() },
    { id: "cat-5", name: "Freshdesk Updates", description: "Resolving Freshdesk tickets and operations", createdAt: new Date().toISOString() },
    { id: "cat-6", name: "Property Activation", description: "Activating live student properties", createdAt: new Date().toISOString() },
    { id: "cat-7", name: "Room Creation", description: "Adding room layouts, configurations and pricing", createdAt: new Date().toISOString() }
  ];

  const now = new Date();
  const formatOffsetDate = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const defaultTasks: Task[] = [
    {
      id: "t-1",
      title: "Commission Updates",
      assignTo: "u-tm1",
      assignedBy: "u-mgr",
      priority: "Urgent",
      freshdeskLink: "https://freshdesk.com/tickets/10423",
      comment: "Verify commission increases to 4.5% for Zen Apartments Dublin.",
      status: "Working",
      dueDate: formatOffsetDate(0), // today
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    },
    {
      id: "t-2",
      title: "Property Creation",
      assignTo: "u-tm1",
      assignedBy: "u-mgr",
      priority: "High",
      freshdeskLink: "https://freshdesk.com/tickets/10439",
      comment: "Create listings for Scape Kings Cross 2026 bookings.",
      status: "Pending",
      dueDate: formatOffsetDate(1), // tomorrow
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    },
    {
      id: "t-3",
      title: "Policy Framing",
      assignTo: "u-snr",
      assignedBy: "u-mgr",
      priority: "Medium",
      freshdeskLink: "https://freshdesk.com/tickets/10411",
      comment: "Draft custom booking cancellation policies for Glasgow Student Castle.",
      status: "Waiting on KAM",
      dueDate: formatOffsetDate(3),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    },
    {
      id: "t-4",
      title: "FAQ Updates",
      assignTo: "u-tm2",
      assignedBy: "u-admin",
      priority: "Low",
      freshdeskLink: "https://freshdesk.com/tickets/10399",
      comment: "Add check-in guidelines and key-collection FAQs for Dublin Highpoint.",
      status: "Completed",
      dueDate: formatOffsetDate(-1), // yesterday
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    },
    {
      id: "t-5",
      title: "Freshdesk Updates",
      assignTo: "u-tm1",
      assignedBy: "u-mgr",
      priority: "Urgent",
      freshdeskLink: "https://freshdesk.com/tickets/10450",
      comment: "Critical ticket #10450: resolve tenant room allocation mismatch on Freshdesk.",
      status: "Need Help",
      dueDate: formatOffsetDate(0),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    },
    {
      id: "t-6",
      title: "Property Activation",
      assignTo: "u-tm2",
      assignedBy: "u-mgr",
      priority: "Medium",
      freshdeskLink: "",
      comment: "Conduct final verification and toggle property status to ACTIVE.",
      status: "Not Started",
      dueDate: formatOffsetDate(2),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    }
  ];

  const defaultNotifications: Notification[] = [
    {
      id: "n-1",
      userId: "u-tm1",
      title: "New Task Assigned",
      message: "You have been assigned the 'Commission Updates' task by Sarah Jenkins.",
      type: "Task Assigned",
      read: false,
      createdAt: now.toISOString()
    },
    {
      id: "n-2",
      userId: "u-tm1",
      title: "Urgent Action Required",
      message: "Ticket #10450 needs assistance. Status changed to Need Help.",
      type: "Need Help",
      read: false,
      createdAt: now.toISOString()
    },
    {
      id: "n-3",
      userId: "u-snr",
      title: "Task Pending KAM Approval",
      message: "Your policy draft is waiting on KAM response.",
      type: "Waiting on KAM",
      read: false,
      createdAt: now.toISOString()
    }
  ];

  const defaultAuditLogs: AuditLog[] = [
    {
      id: "l-1",
      timestamp: now.toISOString(),
      userId: "u-mgr",
      userName: "Sarah Jenkins",
      taskId: "t-1",
      taskTitle: "Commission Updates",
      oldStatus: "Not Started",
      newStatus: "Working",
      changeByUserId: "u-tm1",
      changeByUserName: "John Doe",
      actionType: "StatusUpdate",
      details: "John Doe updated status of task 'Commission Updates' from Not Started to Working."
    },
    {
      id: "l-2",
      timestamp: now.toISOString(),
      userId: "u-admin",
      userName: "Chinmayee Admin",
      taskId: "t-4",
      taskTitle: "FAQ Updates",
      oldStatus: "Working",
      newStatus: "Completed",
      changeByUserId: "u-tm2",
      changeByUserName: "Jane Smith",
      actionType: "StatusUpdate",
      details: "Jane Smith completed the FAQ Updates task."
    }
  ];

  const defaultPrivateNotes: Record<string, PrivateNote> = {
    "u-admin": {
      id: "note-admin",
      userId: "u-admin",
      content: "<h1>My Admin Dashboard Notes</h1><p>Check the whitelist alignment with the latest HR sheet.</p>",
      checklist: [
        { id: "chk-1", text: "Validate team metrics", completed: false },
        { id: "chk-2", text: "Approve pending categories", completed: true }
      ],
      updatedAt: now.toISOString()
    },
    "u-tm1": {
      id: "note-tm1",
      userId: "u-tm1",
      content: "<h2>Personal checklist</h2><p>Remember to call KAM before updating cancellations.</p>",
      checklist: [
        { id: "chk-3", text: "Complete Zen Apartments update", completed: true },
        { id: "chk-4", text: "Resolve Freshdesk mismatch ticket", completed: false }
      ],
      updatedAt: now.toISOString()
    }
  };

  const defaultSettings: AppSettings = {
    emailWhitelist: defaultWhitelist,
    autoRefreshInterval: 30
  };

  return {
    users: defaultUsers,
    tasks: defaultTasks,
    categories: defaultCategories,
    notifications: defaultNotifications,
    privateNotes: defaultPrivateNotes,
    auditLogs: defaultAuditLogs,
    whitelist: defaultWhitelist,
    settings: defaultSettings,
    directMessages: []
  };
};

// Sync Read Database
const readDb = (): DatabaseSchema => {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initial = getInitialDb();
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
      return initial;
    }
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    const db = JSON.parse(raw);
    if (!db.directMessages) {
      db.directMessages = [];
    }
    return db;
  } catch (error) {
    console.error("Database reading failed, returning default", error);
    return getInitialDb();
  }
};

// Sync Write Database
const writeDb = (data: DatabaseSchema) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Database writing failed", error);
  }
};

// Middlewares to enforce Role-Based Access Control (RBAC)
const getRequester = (req: express.Request): User | null => {
  const emailHeader = req.headers["x-user-email"];
  if (!emailHeader) return null;
  const db = readDb();
  const user = db.users.find(u => u.email.toLowerCase() === String(emailHeader).toLowerCase());
  if (user && user.enabled) {
    return user;
  }
  return null;
};

// API ROUTES

// 1. Session / Auth
app.post("/api/auth/login", (req, res) => {
  const { email, name } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  const db = readDb();
  const lowerEmail = email.toLowerCase();
  const isWhitelisted = db.settings.emailWhitelist.some(e => e.toLowerCase() === lowerEmail);

  // Requirement: Only Amber emails are allowed
  const isAmberEmail = lowerEmail.endsWith("@amberstudent.com") || lowerEmail === "chinmayee02052000@gmail.com";

  if (!isWhitelisted && !isAmberEmail) {
    return res.status(403).json({ error: "Access Denied. Please contact your Administrator." });
  }

  // Find existing user or provision one
  let user = db.users.find(u => u.email.toLowerCase() === lowerEmail);
  if (!user) {
    // If they are whitelisted or have amberstudent email, provision them
    // Give Admin to chinmayee02052000@gmail.com, Manager to manager, etc.
    let role: UserRole = "Team Member";
    if (lowerEmail === "chinmayee02052000@gmail.com" || lowerEmail === "himanshu.s@amberstudent.com" || lowerEmail.startsWith("admin")) {
      role = "Admin";
    } else if (lowerEmail.startsWith("manager")) {
      role = "Manager";
    } else if (lowerEmail.startsWith("senior")) {
      role = "Senior";
    }

    user = {
      id: "u-" + generateId(),
      name: name || email.split("@")[0].replace(/[._]/g, " "),
      email: lowerEmail,
      role: role,
      enabled: true,
      lastActive: new Date().toISOString(),
      isOnline: true
    };
    db.users.push(user);
    
    // Add default private notes
    db.privateNotes[user.id] = {
      id: "note-" + generateId(),
      userId: user.id,
      content: "<h1>My Workspace Notes</h1><p>Type your private quick notes or checklist items here.</p>",
      checklist: [],
      updatedAt: new Date().toISOString()
    };

    // Log the user signup audit
    db.auditLogs.unshift({
      id: "l-" + generateId(),
      timestamp: new Date().toISOString(),
      userId: user.id,
      userName: user.name,
      actionType: "UserUpdate",
      changeByUserId: user.id,
      changeByUserName: user.name,
      details: `User ${user.name} (${user.email}) registered/logged in with role ${role}`
    });

    writeDb(db);
  } else {
    // Check if user is enabled
    if (!user.enabled) {
      return res.status(403).json({ error: "This user account has been disabled. Please contact your Administrator." });
    }
    // Update online status
    user.isOnline = true;
    user.lastActive = new Date().toISOString();
    
    // Ensure Himanshu is Admin if logged in
    if (lowerEmail === "himanshu.s@amberstudent.com") {
      user.role = "Admin";
    }
    
    writeDb(db);
  }

  res.json({ user });
});

// Sync online status or log out
app.post("/api/auth/heartbeat", (req, res) => {
  const user = getRequester(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const db = readDb();
  const dbUser = db.users.find(u => u.id === user.id);
  if (dbUser) {
    dbUser.isOnline = true;
    dbUser.lastActive = new Date().toISOString();
    writeDb(db);
  }
  res.json({ status: "alive" });
});

app.post("/api/auth/logout", (req, res) => {
  const user = getRequester(req);
  if (user) {
    const db = readDb();
    const dbUser = db.users.find(u => u.id === user.id);
    if (dbUser) {
      dbUser.isOnline = false;
      writeDb(db);
    }
  }
  res.json({ status: "logged_out" });
});

// 2. Fetch Dashboard / App Shell Data
app.get("/api/dashboard", (req, res) => {
  const user = getRequester(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const db = readDb();
  res.json({
    users: db.users,
    tasks: db.tasks,
    categories: db.categories,
    notifications: db.notifications.filter(n => n.userId === user.id),
    privateNote: db.privateNotes[user.id] || { id: "note-" + generateId(), userId: user.id, content: "", checklist: [], updatedAt: new Date().toISOString() },
    auditLogs: user.role === "Admin" || user.role === "Manager" ? db.auditLogs : db.auditLogs.filter(l => l.userId === user.id || l.changeByUserId === user.id),
    settings: db.settings
  });
});

// 3. Tasks Endpoints
app.post("/api/tasks", (req, res) => {
  const user = getRequester(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  // Permissions: Admin and Manager can create tasks
  if (user.role !== "Admin" && user.role !== "Manager") {
    return res.status(403).json({ error: "Forbidden: Only Managers and Admins can create tasks." });
  }

  const { title, assignTo, priority, freshdeskLink, comment, status, dueDate } = req.body;
  if (!title || !assignTo || !priority || !dueDate) {
    return res.status(400).json({ error: "Missing required fields for task creation" });
  }

  const db = readDb();
  const assignedUser = db.users.find(u => u.id === assignTo);
  if (!assignedUser) {
    return res.status(400).json({ error: "Assigned user not found" });
  }

  const newTask: Task = {
    id: "t-" + generateId(),
    title,
    assignTo,
    assignedBy: user.id,
    priority,
    freshdeskLink: freshdeskLink || "",
    comment: comment || "",
    status: status || "Not Started",
    dueDate,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.tasks.unshift(newTask);

  // Create notifications for the assignee
  db.notifications.unshift({
    id: "n-" + generateId(),
    userId: assignTo,
    title: "New Task Assigned",
    message: `You have been assigned '${title}' by ${user.name}.`,
    type: "Task Assigned",
    read: false,
    createdAt: new Date().toISOString()
  });

  // Log to audit log
  db.auditLogs.unshift({
    id: "l-" + generateId(),
    timestamp: new Date().toISOString(),
    userId: assignTo,
    userName: assignedUser.name,
    taskId: newTask.id,
    taskTitle: newTask.title,
    oldStatus: "Not Started",
    newStatus: newTask.status,
    changeByUserId: user.id,
    changeByUserName: user.name,
    actionType: "Create",
    details: `Task '${title}' created and assigned to ${assignedUser.name} by ${user.name}.`
  });

  writeDb(db);
  res.status(201).json(newTask);
});

// Update Task status or other fields
app.put("/api/tasks/:id", (req, res) => {
  const user = getRequester(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const db = readDb();
  const taskIndex = db.tasks.findIndex(t => t.id === req.params.id);
  if (taskIndex === -1) {
    return res.status(404).json({ error: "Task not found" });
  }

  const task = db.tasks[taskIndex];

  // RBAC checks
  // Team Member & Senior can ONLY view their own or update status of their own.
  if (user.role === "Team Member" || user.role === "Senior") {
    if (task.assignTo !== user.id) {
      return res.status(403).json({ error: "Forbidden: You can only update your own assigned tasks." });
    }
  }

  const { status, priority, freshdeskLink, comment, dueDate, assignTo, title } = req.body;
  const oldStatus = task.status;
  const oldAssigneeId = task.assignTo;

  // Perform updates
  let updateLogDetails = "";

  if (user.role === "Admin" || user.role === "Manager") {
    // Fully editable by Admin/Manager
    if (title) task.title = title;
    if (priority) task.priority = priority;
    if (freshdeskLink !== undefined) task.freshdeskLink = freshdeskLink;
    if (comment !== undefined) task.comment = comment;
    if (dueDate) task.dueDate = dueDate;
    
    if (assignTo && assignTo !== task.assignTo) {
      const newAssignee = db.users.find(u => u.id === assignTo);
      if (newAssignee) {
        task.assignTo = assignTo;
        // Trigger notification
        db.notifications.unshift({
          id: "n-" + generateId(),
          userId: assignTo,
          title: "Task Reassigned to You",
          message: `Task '${task.title}' has been reassigned to you by ${user.name}.`,
          type: "Task Assigned",
          read: false,
          createdAt: new Date().toISOString()
        });
        updateLogDetails += `Reassigned to ${newAssignee.name}. `;
      }
    }
  }

  // Status updates allowed by assignee or Admin/Manager
  if (status && status !== oldStatus) {
    task.status = status as TaskStatus;
    updateLogDetails += `Status changed from '${oldStatus}' to '${status}'. `;

    // Auto notify creator and managers/admins if urgent, waiting on KAM, or need help
    const statusNotifications = ["Need Help", "Waiting on KAM"];
    if (statusNotifications.includes(status)) {
      // Find managers and admins
      const managersAndAdmins = db.users.filter(u => u.role === "Manager" || u.role === "Admin");
      managersAndAdmins.forEach(m => {
        db.notifications.unshift({
          id: "n-" + generateId(),
          userId: m.id,
          title: `Task Alert: ${status}`,
          message: `${user.name} changed status of '${task.title}' to '${status}'`,
          type: status as any,
          read: false,
          createdAt: new Date().toISOString()
        });
      });
    }
  }

  task.updatedAt = new Date().toISOString();
  db.tasks[taskIndex] = task;

  const activeAssignee = db.users.find(u => u.id === task.assignTo);

  // Log audit
  db.auditLogs.unshift({
    id: "l-" + generateId(),
    timestamp: new Date().toISOString(),
    userId: task.assignTo,
    userName: activeAssignee ? activeAssignee.name : "Unknown",
    taskId: task.id,
    taskTitle: task.title,
    oldStatus: oldStatus,
    newStatus: task.status,
    changeByUserId: user.id,
    changeByUserName: user.name,
    actionType: "StatusUpdate",
    details: `${user.name} updated task '${task.title}'. ${updateLogDetails}`
  });

  writeDb(db);
  res.json(task);
});

// Delete Task (Managers and Admins only)
app.delete("/api/tasks/:id", (req, res) => {
  const user = getRequester(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  if (user.role !== "Admin" && user.role !== "Manager") {
    return res.status(403).json({ error: "Forbidden: Only Managers and Admins can delete tasks." });
  }

  const db = readDb();
  const taskIndex = db.tasks.findIndex(t => t.id === req.params.id);
  if (taskIndex === -1) {
    return res.status(404).json({ error: "Task not found" });
  }

  const deletedTask = db.tasks[taskIndex];
  db.tasks.splice(taskIndex, 1);

  // Log audit
  db.auditLogs.unshift({
    id: "l-" + generateId(),
    timestamp: new Date().toISOString(),
    userId: deletedTask.assignTo,
    userName: "N/A",
    taskId: deletedTask.id,
    taskTitle: deletedTask.title,
    actionType: "Delete",
    changeByUserId: user.id,
    changeByUserName: user.name,
    details: `Task '${deletedTask.title}' was deleted by ${user.name}.`
  });

  writeDb(db);
  res.json({ success: true, message: "Task deleted successfully" });
});

// 4. Categories Endpoints
app.post("/api/categories", (req, res) => {
  const user = getRequester(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  if (user.role !== "Admin") {
    return res.status(403).json({ error: "Forbidden: Only Admins can manage task categories." });
  }

  const { name, description } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Category name is required" });
  }

  const db = readDb();
  if (db.categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
    return res.status(400).json({ error: "Category already exists" });
  }

  const newCategory: TaskCategory = {
    id: "cat-" + generateId(),
    name,
    description: description || "",
    createdAt: new Date().toISOString()
  };

  db.categories.push(newCategory);

  db.auditLogs.unshift({
    id: "l-" + generateId(),
    timestamp: new Date().toISOString(),
    userId: user.id,
    userName: user.name,
    actionType: "CategoryUpdate",
    changeByUserId: user.id,
    changeByUserName: user.name,
    details: `Category '${name}' created by ${user.name}.`
  });

  writeDb(db);
  res.status(201).json(newCategory);
});

// 5. Users and Role management (Admin only)
app.put("/api/users/:id", (req, res) => {
  const user = getRequester(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  if (user.role !== "Admin") {
    return res.status(403).json({ error: "Forbidden: Only Admins can edit users and roles." });
  }

  const { role, enabled } = req.body;
  const db = readDb();
  const dbUser = db.users.find(u => u.id === req.params.id);
  if (!dbUser) {
    return res.status(404).json({ error: "User not found" });
  }

  const oldRole = dbUser.role;
  const oldEnabled = dbUser.enabled;

  if (role) dbUser.role = role;
  if (enabled !== undefined) dbUser.enabled = enabled;

  db.auditLogs.unshift({
    id: "l-" + generateId(),
    timestamp: new Date().toISOString(),
    userId: dbUser.id,
    userName: dbUser.name,
    actionType: "UserUpdate",
    changeByUserId: user.id,
    changeByUserName: user.name,
    details: `User ${dbUser.name} edited by Admin ${user.name}. Role updated from ${oldRole} to ${dbUser.role}. Account status changed from ${oldEnabled ? 'Enabled' : 'Disabled'} to ${dbUser.enabled ? 'Enabled' : 'Disabled'}.`
  });

  writeDb(db);
  res.json(dbUser);
});

// 6. Whitelist Management (Admin only)
app.post("/api/whitelist", (req, res) => {
  const user = getRequester(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  if (user.role !== "Admin") {
    return res.status(403).json({ error: "Forbidden: Only Admins can manage the email whitelist." });
  }

  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  const db = readDb();
  const lowerEmail = email.toLowerCase();
  if (db.settings.emailWhitelist.some(e => e.toLowerCase() === lowerEmail)) {
    return res.status(400).json({ error: "Email already whitelisted" });
  }

  db.settings.emailWhitelist.push(lowerEmail);

  db.auditLogs.unshift({
    id: "l-" + generateId(),
    timestamp: new Date().toISOString(),
    userId: user.id,
    userName: user.name,
    actionType: "UserUpdate",
    changeByUserId: user.id,
    changeByUserName: user.name,
    details: `Email '${lowerEmail}' added to whitelist by Admin ${user.name}.`
  });

  writeDb(db);
  res.status(201).json({ emailWhitelist: db.settings.emailWhitelist });
});

app.delete("/api/whitelist/:email", (req, res) => {
  const user = getRequester(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  if (user.role !== "Admin") {
    return res.status(403).json({ error: "Forbidden: Only Admins can manage the email whitelist." });
  }

  const emailToRemove = req.params.email.toLowerCase();
  const db = readDb();

  const originalLength = db.settings.emailWhitelist.length;
  db.settings.emailWhitelist = db.settings.emailWhitelist.filter(e => e.toLowerCase() !== emailToRemove);

  if (db.settings.emailWhitelist.length === originalLength) {
    return res.status(404).json({ error: "Email not found in whitelist" });
  }

  db.auditLogs.unshift({
    id: "l-" + generateId(),
    timestamp: new Date().toISOString(),
    userId: user.id,
    userName: user.name,
    actionType: "UserUpdate",
    changeByUserId: user.id,
    changeByUserName: user.name,
    details: `Email '${emailToRemove}' removed from whitelist by Admin ${user.name}.`
  });

  writeDb(db);
  res.json({ emailWhitelist: db.settings.emailWhitelist });
});

// 7. Notification Read Mark
app.put("/api/notifications/:id/read", (req, res) => {
  const user = getRequester(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const db = readDb();
  const n = db.notifications.find(notif => notif.id === req.params.id && notif.userId === user.id);
  if (n) {
    n.read = true;
    writeDb(db);
  }
  res.json({ success: true });
});

// Mark all notifications as read
app.post("/api/notifications/read-all", (req, res) => {
  const user = getRequester(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const db = readDb();
  db.notifications.forEach(n => {
    if (n.userId === user.id) {
      n.read = true;
    }
  });
  writeDb(db);
  res.json({ success: true });
});

// 8. Personal Notes API
app.get("/api/notes", (req, res) => {
  const user = getRequester(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const db = readDb();
  const note = db.privateNotes[user.id] || {
    id: "note-" + generateId(),
    userId: user.id,
    content: "",
    checklist: [],
    updatedAt: new Date().toISOString()
  };
  res.json(note);
});

app.put("/api/notes", (req, res) => {
  const user = getRequester(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const { content, checklist } = req.body;
  const db = readDb();

  db.privateNotes[user.id] = {
    id: db.privateNotes[user.id]?.id || "note-" + generateId(),
    userId: user.id,
    content: content !== undefined ? content : (db.privateNotes[user.id]?.content || ""),
    checklist: checklist !== undefined ? checklist : (db.privateNotes[user.id]?.checklist || []),
    updatedAt: new Date().toISOString()
  };

  writeDb(db);
  res.json(db.privateNotes[user.id]);
});

// 9. Chat / Direct Messages API
app.get("/api/chat", (req, res) => {
  const user = getRequester(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const db = readDb();
  const myMessages = (db.directMessages || []).filter(
    m => m.senderId === user.id || m.receiverId === user.id
  );
  res.json(myMessages);
});

app.post("/api/chat", (req, res) => {
  const user = getRequester(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const { receiverId, content } = req.body;
  if (!receiverId || !content) {
    return res.status(400).json({ error: "Receiver ID and content are required" });
  }

  const db = readDb();
  const receiverExists = db.users.some(u => u.id === receiverId);
  if (!receiverExists) {
    return res.status(404).json({ error: "Recipient user not found" });
  }

  const newMessage: DirectMessage = {
    id: "msg-" + generateId(),
    senderId: user.id,
    receiverId,
    content,
    timestamp: new Date().toISOString(),
    read: false
  };

  if (!db.directMessages) {
    db.directMessages = [];
  }
  db.directMessages.push(newMessage);
  writeDb(db);

  res.status(201).json(newMessage);
});

app.post("/api/chat/read", (req, res) => {
  const user = getRequester(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const { senderId } = req.body;
  if (!senderId) {
    return res.status(400).json({ error: "Sender ID is required" });
  }

  const db = readDb();
  let updatedCount = 0;
  if (db.directMessages) {
    db.directMessages.forEach(m => {
      if (m.senderId === senderId && m.receiverId === user.id && !m.read) {
        m.read = true;
        updatedCount++;
      }
    });
  }

  if (updatedCount > 0) {
    writeDb(db);
  }

  res.json({ success: true, updatedCount });
});

// 10. Manual User Registration & Access Removal (Admin only)
app.post("/api/users", (req, res) => {
  const user = getRequester(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  if (user.role !== "Admin") {
    return res.status(403).json({ error: "Forbidden: Only Admins can register users." });
  }

  const { name, email, role } = req.body;
  if (!name || !email || !role) {
    return res.status(400).json({ error: "Name, email, and role are required" });
  }

  const db = readDb();
  const lowerEmail = email.toLowerCase();
  
  if (db.users.some(u => u.email.toLowerCase() === lowerEmail)) {
    return res.status(400).json({ error: "User already exists" });
  }

  const newUser: User = {
    id: "u-" + generateId(),
    name,
    email: lowerEmail,
    role,
    enabled: true,
    lastActive: undefined,
    isOnline: false
  };

  db.users.push(newUser);

  // Auto-whitelist email if not present
  if (!db.settings.emailWhitelist.some(e => e.toLowerCase() === lowerEmail)) {
    db.settings.emailWhitelist.push(lowerEmail);
  }

  db.auditLogs.unshift({
    id: "l-" + generateId(),
    timestamp: new Date().toISOString(),
    userId: newUser.id,
    userName: newUser.name,
    actionType: "UserUpdate",
    changeByUserId: user.id,
    changeByUserName: user.name,
    details: `User ${newUser.name} (${newUser.email}) manually registered as ${role} by Admin ${user.name}.`
  });

  writeDb(db);
  res.status(201).json(newUser);
});

app.delete("/api/users/:id", (req, res) => {
  const user = getRequester(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  if (user.role !== "Admin") {
    return res.status(403).json({ error: "Forbidden: Only Admins can remove user access." });
  }

  const db = readDb();
  const index = db.users.findIndex(u => u.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "User not found" });
  }

  const userToRemove = db.users[index];
  if (userToRemove.id === user.id) {
    return res.status(400).json({ error: "You cannot remove your own access." });
  }

  db.users.splice(index, 1);
  // Also remove from whitelist
  db.settings.emailWhitelist = db.settings.emailWhitelist.filter(e => e.toLowerCase() !== userToRemove.email.toLowerCase());

  db.auditLogs.unshift({
    id: "l-" + generateId(),
    timestamp: new Date().toISOString(),
    userId: userToRemove.id,
    userName: userToRemove.name,
    actionType: "UserUpdate",
    changeByUserId: user.id,
    changeByUserName: user.name,
    details: `Removed access for user ${userToRemove.name} (${userToRemove.email}) by Admin ${user.name}.`
  });

  writeDb(db);
  res.json({ success: true, message: "Access removed successfully" });
});



// Serve static Vite compiled files in production
if (process.env.NODE_ENV !== "production") {
  createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  }).then((vite) => {
    app.use(vite.middlewares);
    
    // In dev mode, fall back to serve index.html for SPA router support
    app.get("*", (req, res, next) => {
      const indexHtml = path.join(process.cwd(), "index.html");
      res.sendFile(indexHtml);
    });

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Development Server running on http://localhost:${PORT}`);
    });
  });
} else {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Production Server running on http://localhost:${PORT}`);
  });
}
