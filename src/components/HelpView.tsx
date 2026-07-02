import React from "react";
import { HelpCircle, Keyboard, MessageSquare, Info, Shield, BookOpen, ExternalLink } from "lucide-react";

export default function HelpView() {
  return (
    <div className="space-y-6" id="help-view-container">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-150 dark:border-neutral-800 pb-5">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            System Guide & Assistance <HelpCircle className="w-5 h-5 text-[#FF6B00]" />
          </h2>
          <p className="text-sm text-gray-500 dark:text-neutral-400 font-medium">
            Learn hotkeys, read creation SLA definitions, and find support resources.
          </p>
        </div>
      </div>

      {/* Grid container */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Keyboard Shortcuts Card */}
        <div className="bg-white dark:bg-[#1C1D21] p-5 rounded-2xl border border-gray-150 dark:border-neutral-800 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-gray-100 dark:border-neutral-800">
            <Keyboard className="w-5 h-5 text-[#FF6B00]" />
            <h3 className="font-extrabold text-sm text-gray-900 dark:text-white uppercase tracking-wider">Keyboard Shortcuts Reference</h3>
          </div>

          <div className="space-y-3">
            {[
              { keys: ["⌘ K", "Ctrl K"], desc: "Toggle floating command search palette" },
              { keys: ["ESC"], desc: "Exit modals, popups or search overlay" },
              { keys: ["1"], desc: "Set selected task status to 'Not Started' (on hover)" },
              { keys: ["2"], desc: "Set selected task status to 'Working' (on hover)" },
              { keys: ["3"], desc: "Set selected task status to 'Need Help' (on hover)" },
              { keys: ["4"], desc: "Set selected task status to 'Waiting on KAM' (on hover)" },
              { keys: ["5"], desc: "Set selected task status to 'Pending' (on hover)" },
              { keys: ["6"], desc: "Set selected task status to 'Completed' (on hover)" }
            ].map((shortcut, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-gray-50 dark:border-neutral-800/40 last:border-none pb-2 last:pb-0">
                <span className="text-gray-600 dark:text-neutral-400 font-medium">{shortcut.desc}</span>
                <div className="flex items-center space-x-1">
                  {shortcut.keys.map((k, kIdx) => (
                    <kbd key={kIdx} className="bg-gray-100 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 px-2 py-0.5 rounded font-mono font-bold text-[10px] text-gray-700 dark:text-neutral-300">
                      {k}
                    </kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SLA Guidelines Card */}
        <div className="bg-white dark:bg-[#1C1D21] p-5 rounded-2xl border border-gray-150 dark:border-neutral-800 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-gray-100 dark:border-neutral-800">
            <Shield className="w-5 h-5 text-[#FF6B00]" />
            <h3 className="font-extrabold text-sm text-gray-900 dark:text-white uppercase tracking-wider">Amber Operational SLA Limits</h3>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-3 bg-red-50/50 dark:bg-red-950/10 border border-red-200/40 dark:border-red-900/40 rounded-xl">
              <h4 className="font-bold text-red-700 dark:text-red-400">Urgent Tickets (Priority: Urgent)</h4>
              <p className="text-gray-600 dark:text-neutral-400 mt-1 leading-relaxed">
                Must be resolved within **4 hours** of assignment. Requires active updates and tagging if blocked by KAM approval.
              </p>
            </div>

            <div className="p-3 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/40 dark:border-amber-900/40 rounded-xl">
              <h4 className="font-bold text-amber-700 dark:text-amber-400">High / Medium Tickets</h4>
              <p className="text-gray-600 dark:text-neutral-400 mt-1 leading-relaxed">
                Standard property creation and room updates must be resolved within **24 - 48 hours**.
              </p>
            </div>

            <div className="p-3 bg-blue-50/50 dark:bg-blue-950/10 border border-blue-200/40 dark:border-blue-900/40 rounded-xl">
              <h4 className="font-bold text-blue-700 dark:text-blue-400">Status Alert Codes</h4>
              <p className="text-gray-600 dark:text-neutral-400 mt-1 leading-relaxed font-semibold">
                Changing a task status to **Need Help** or **Waiting on KAM** automatically fires visual system-wide alerts to Managers and Admins.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Support */}
        <div className="bg-white dark:bg-[#1C1D21] p-5 rounded-2xl border border-gray-150 dark:border-neutral-800 shadow-xs space-y-4 md:col-span-2">
          <div className="flex items-center space-x-2 pb-2 border-b border-gray-100 dark:border-neutral-800">
            <BookOpen className="w-5 h-5 text-[#FF6B00]" />
            <h3 className="font-extrabold text-sm text-gray-900 dark:text-white uppercase tracking-wider">Amber Student Creation Resources</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: "Training Documentation", desc: "Step-by-step room creation and policy guidelines.", link: "https://amberstudent.com" },
              { title: "Freshdesk Integration API", desc: "Automate task triggers and ticket webhooks.", link: "https://amberstudent.freshdesk.com" },
              { title: "Operations Slack", desc: "Collaborate in real-time with fellow senior designers and managers.", link: "https://amberstudent.slack.com" },
              { title: "Creation Sheet", desc: "Access the master creation workflow spreadsheet tracker.", link: "https://docs.google.com/spreadsheets/d/1Z21-BycBi1aIEa4eMiIxZhuG1CkKaGTCgwqtoJNkTvc/edit?gid=983723162#gid=983723162" }
            ].map((res, idx) => (
              <a 
                key={idx} 
                href={res.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-4 rounded-xl border border-gray-100 dark:border-neutral-800 bg-gray-50/50 dark:bg-neutral-900/10 hover:border-amber-200 dark:hover:border-amber-950 hover:bg-amber-50/5 dark:hover:bg-[#FF6B00]/5 transition-all text-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-gray-900 dark:text-white">{res.title}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                  <p className="text-gray-500 dark:text-neutral-400 leading-relaxed">{res.desc}</p>
                </div>
              </a>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
