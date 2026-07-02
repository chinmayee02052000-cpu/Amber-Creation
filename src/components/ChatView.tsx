import React, { useState, useEffect, useRef } from "react";
import { 
  MessageSquare, 
  Send, 
  Search, 
  User as UserIcon, 
  Clock, 
  CheckCheck, 
  Check, 
  UserCheck, 
  Hash, 
  Smile, 
  Sparkles,
  Zap
} from "lucide-react";
import { User, DirectMessage } from "../types";

interface ChatViewProps {
  currentUser: User;
  users: User[];
}

export default function ChatView({ currentUser, users }: ChatViewProps) {
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSending, setIsSending] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Filter out current user from team list
  const otherUsers = users.filter(u => u.id !== currentUser.id && u.enabled);

  // Filter other users based on search
  const filteredUsers = otherUsers.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Fetch messages from backend
  const fetchMessages = async (silent = false) => {
    try {
      const res = await fetch("/api/chat", {
        headers: {
          "Content-Type": "application/json",
          "x-user-email": currentUser.email
        }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error("Failed to fetch messages", err);
    }
  };

  // Mark selected user's messages to me as read
  const markAsRead = async (senderId: string) => {
    try {
      await fetch("/api/chat/read", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": currentUser.email
        },
        body: JSON.stringify({ senderId })
      });
    } catch (err) {
      console.error("Failed to mark messages as read", err);
    }
  };

  // Poll messages every 2.5 seconds
  useEffect(() => {
    fetchMessages();
    pollingRef.current = setInterval(() => {
      fetchMessages(true);
    }, 2500);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [currentUser.email]);

  // Mark as read when selected user changes or new messages arrive
  useEffect(() => {
    if (selectedUser) {
      markAsRead(selectedUser.id);
    }
  }, [selectedUser, messages.length]);

  // Scroll to bottom on new message or conversation swap
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedUser?.id, messages.length]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend !== undefined ? textToSend : inputText;
    if (!selectedUser || !text.trim() || isSending) return;

    setIsSending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": currentUser.email
        },
        body: JSON.stringify({
          receiverId: selectedUser.id,
          content: text.trim()
        })
      });

      if (res.ok) {
        const newMessage = await res.json();
        setMessages(prev => [...prev, newMessage]);
        if (textToSend === undefined) {
          setInputText("");
        }
      }
    } catch (err) {
      console.error("Failed to send message", err);
    } finally {
      setIsSending(false);
    }
  };

  // Quick reply shortcuts
  const quickReplies = [
    "Understood, starting now!",
    "Will update the status shortly.",
    "Can you share the Freshdesk link?",
    "Checking with KAM regarding this.",
    "Draft completed and ready."
  ];

  // Helper to format timestamps
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch (e) {
      return "";
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "Admin": return "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border border-red-200/50";
      case "Manager": return "bg-amber-50 text-[#FF6B00] dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200/50";
      case "Senior": return "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-200/50";
      default: return "bg-gray-100 text-gray-700 dark:bg-neutral-800 dark:text-neutral-400 border border-gray-200/30";
    }
  };

  // Get active messages with the selected user
  const activeConversation = selectedUser
    ? messages.filter(
        m =>
          (m.senderId === currentUser.id && m.receiverId === selectedUser.id) ||
          (m.senderId === selectedUser.id && m.receiverId === currentUser.id)
      ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    : [];

  // Count unread messages from each user
  const getUnreadCount = (userId: string) => {
    return messages.filter(m => m.senderId === userId && m.receiverId === currentUser.id && !m.read).length;
  };

  return (
    <div className="h-[calc(100vh-140px)] bg-white dark:bg-[#1C1D21] rounded-2xl border border-gray-150 dark:border-neutral-800 shadow-xs overflow-hidden flex" id="chat-view-container">
      
      {/* Colleague Sidebar List */}
      <div className="w-80 border-r border-gray-150 dark:border-neutral-800 flex flex-col bg-gray-50/30 dark:bg-neutral-900/10 shrink-0">
        
        {/* Sidebar Search */}
        <div className="p-4 border-b border-gray-150 dark:border-neutral-800 shrink-0">
          <h3 className="font-extrabold text-sm text-gray-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-[#FF6B00]" /> 
            Team Channels
          </h3>
          <div className="relative">
            <input
              type="text"
              placeholder="Search colleagues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-[#121316] text-xs rounded-xl border border-gray-250 dark:border-neutral-800 py-2.5 pl-9 pr-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-[#FF6B00] focus:border-[#FF6B00]"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          </div>
        </div>

        {/* Colleagues Scroll List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-thin">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-400 dark:text-neutral-500">
              No colleagues found
            </div>
          ) : (
            filteredUsers.map((user) => {
              const unread = getUnreadCount(user.id);
              const isSelected = selectedUser?.id === user.id;

              return (
                <button
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className={`w-full text-left p-3 rounded-xl flex items-center justify-between transition-all relative ${
                    isSelected
                      ? "bg-[#FF6B00]/5 text-[#FF6B00] dark:bg-[#FF6B00]/10 border-l-4 border-l-[#FF6B00]"
                      : "text-gray-700 dark:text-neutral-300 hover:bg-gray-100/50 dark:hover:bg-neutral-800/25"
                  }`}
                  id={`chat-user-row-${user.id}`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    {/* User Avatar with live online ring */}
                    <div className="relative shrink-0">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF6B00]/10 to-[#FF8A3D]/10 dark:from-[#FF6B00]/20 dark:to-[#FF8A3D]/20 text-[#FF6B00] dark:text-[#FF8A3D] flex items-center justify-center font-bold text-xs shadow-3xs border border-[#FF6B00]/25">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-[#1C1D21] ${
                        user.isOnline ? "bg-green-500" : "bg-gray-300"
                      }`} />
                    </div>

                    {/* Meta */}
                    <div className="min-w-0">
                      <div className="flex items-center space-x-1">
                        <span className={`font-semibold text-xs truncate ${isSelected ? "text-gray-900 dark:text-white" : "text-gray-900 dark:text-neutral-200"}`}>
                          {user.name}
                        </span>
                        {user.role === "Admin" && (
                          <span className="text-[8px] px-1 py-0.2 bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 rounded font-bold uppercase tracking-wide shrink-0">
                            ADM
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-500 dark:text-neutral-400 truncate leading-none mt-1">
                        {user.role} • {user.isOnline ? "Online" : "Offline"}
                      </p>
                    </div>
                  </div>

                  {/* Unread Message Badge */}
                  {unread > 0 && (
                    <span className="bg-[#FF6B00] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-5 text-center shrink-0 shadow-xs animate-bounce">
                      {unread}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Conversation Stream Panel */}
      <div className="flex-1 flex flex-col bg-white dark:bg-[#1C1D21]">
        {selectedUser ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-gray-150 dark:border-neutral-800 flex items-center justify-between shrink-0 bg-gray-50/10 dark:bg-neutral-900/5">
              <div className="flex items-center space-x-3.5">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-[#FF6B00] text-white flex items-center justify-center font-bold text-sm shadow-md shadow-[#FF6B00]/15">
                    {selectedUser.name.charAt(0).toUpperCase()}
                  </div>
                  <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-[#1C1D21] ${
                    selectedUser.isOnline ? "bg-green-500 animate-pulse" : "bg-gray-300"
                  }`} />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-2 leading-none">
                    {selectedUser.name}
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${getRoleBadgeColor(selectedUser.role)}`}>
                      {selectedUser.role}
                    </span>
                  </h4>
                  <p className="text-[10px] text-gray-400 dark:text-neutral-500 mt-1 font-medium flex items-center gap-1.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-neutral-700" />
                    {selectedUser.email}
                  </p>
                </div>
              </div>

              {/* SLA Banner indicator */}
              <div className="hidden md:flex items-center space-x-1 bg-amber-50 dark:bg-amber-950/10 border border-amber-200/30 text-[10px] px-3 py-1.5 rounded-xl font-bold text-[#FF6B00]">
                <Zap className="w-3.5 h-3.5" />
                <span>Internal Secured Tunnel</span>
              </div>
            </div>

            {/* Scrollable Message Box */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin bg-gray-50/20 dark:bg-neutral-900/5">
              {activeConversation.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-neutral-800 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-gray-400" />
                  </div>
                  <h5 className="font-bold text-xs text-gray-700 dark:text-neutral-300">No messages yet</h5>
                  <p className="text-[10px] text-gray-400 dark:text-neutral-500 max-w-xs">
                    Send a secure direct message to start coordinating task updates and property creation checklists.
                  </p>
                </div>
              ) : (
                activeConversation.map((msg) => {
                  const isMe = msg.senderId === currentUser.id;

                  return (
                    <div 
                      key={msg.id} 
                      className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`max-w-[70%] rounded-2xl p-3.5 text-xs shadow-3xs ${
                        isMe 
                          ? "bg-neutral-900 dark:bg-[#FF6B00]/10 border border-neutral-800 dark:border-[#FF6B00]/25 text-white dark:text-amber-50 rounded-br-none"
                          : "bg-white dark:bg-[#25262B] border border-gray-150 dark:border-neutral-800 text-gray-900 dark:text-neutral-100 rounded-bl-none"
                      }`}>
                        {/* Sender info if not me */}
                        {!isMe && (
                          <span className="block font-bold text-[10px] text-[#FF6B00] mb-1.5 uppercase tracking-wide">
                            {selectedUser.name.split(" ")[0]}
                          </span>
                        )}

                        <p className="leading-relaxed font-medium whitespace-pre-wrap">{msg.content}</p>

                        {/* Timestamp & Read Checklist */}
                        <div className="flex items-center justify-end space-x-1.5 mt-2 text-[9px] text-gray-400 dark:text-neutral-500">
                          <Clock className="w-3 h-3" />
                          <span>{formatTime(msg.timestamp)}</span>
                          {isMe && (
                            msg.read ? (
                              <CheckCheck className="w-3.5 h-3.5 text-green-500" title="Read" />
                            ) : (
                              <Check className="w-3.5 h-3.5 text-gray-400 dark:text-neutral-600" title="Sent" />
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Productivity Replies */}
            <div className="px-6 py-2 border-t border-gray-100 dark:border-neutral-800/80 shrink-0 flex items-center gap-1.5 overflow-x-auto scrollbar-none bg-gray-50/5 dark:bg-neutral-900/5">
              <span className="text-[9px] uppercase font-bold text-gray-400 dark:text-neutral-500 flex items-center gap-1 shrink-0">
                <Zap className="w-3 h-3 text-[#FF6B00]" /> Quick Reply:
              </span>
              {quickReplies.map((reply, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(reply)}
                  className="bg-white dark:bg-[#25262B] hover:bg-amber-50/20 dark:hover:bg-[#FF6B00]/10 border border-gray-200 dark:border-neutral-800 hover:border-[#FF6B00]/40 text-gray-600 dark:text-neutral-400 hover:text-[#FF6B00] text-[10px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap transition-all duration-150"
                >
                  {reply}
                </button>
              ))}
            </div>

            {/* Typing Form box */}
            <div className="p-4 border-t border-gray-150 dark:border-neutral-800 shrink-0 bg-gray-50/30 dark:bg-neutral-900/10">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center space-x-2"
              >
                <div className="relative flex-1">
                  <textarea
                    rows={1}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder={`Direct message ${selectedUser.name}...`}
                    className="w-full bg-white dark:bg-[#121316] text-xs rounded-xl border border-gray-250 dark:border-neutral-800 py-3.5 pl-4 pr-10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-[#FF6B00] focus:border-[#FF6B00] resize-none"
                  />
                  <button
                    type="button"
                    className="absolute right-3.5 top-3.5 text-gray-400 hover:text-amber-500 transition-colors"
                    title="Insert emoji template (productivity)"
                  >
                    <Smile className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isSending || !inputText.trim()}
                  className="bg-gradient-to-r from-[#FF6B00] to-[#FF8A3D] hover:from-[#FF8A3D] hover:to-[#FF6B00] text-white p-3.5 rounded-xl transition-all shadow-md shadow-[#FF6B00]/15 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
              <div className="flex items-center justify-between mt-1.5 text-[9px] text-gray-400 dark:text-neutral-500 px-1">
                <span>Press <strong>Enter</strong> to send, <strong>Shift+Enter</strong> for newline</span>
                <span>Secure private channel</span>
              </div>
            </div>
          </>
        ) : (
          /* Empty State Splash View */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-950/15 border border-amber-100 dark:border-amber-900/30 flex items-center justify-center text-[#FF6B00] shadow-md shadow-[#FF6B00]/5 animate-pulse">
              <MessageSquare className="w-7 h-7" />
            </div>
            
            <div className="space-y-1.5 max-w-sm">
              <h4 className="font-extrabold text-sm text-gray-900 dark:text-white">
                Amber Private Messaging
              </h4>
              <p className="text-xs text-gray-400 dark:text-neutral-500 leading-relaxed font-medium">
                Collaborate securely in real-time. Discuss operational property activations, SLA priority tickets, or general room pricing framing.
              </p>
            </div>

            <div className="p-4 bg-gray-50/50 dark:bg-neutral-900/20 border border-gray-150 dark:border-neutral-800 rounded-2xl max-w-sm text-left">
              <h5 className="font-bold text-[10px] text-[#FF6B00] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> SECURE TUNNEL PROTOCOLS
              </h5>
              <p className="text-[10px] text-gray-500 dark:text-neutral-400 leading-normal">
                All communications on Amber Creation Hub are private and isolated strictly between individual team members. Logs are encrypted in the local database.
              </p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
