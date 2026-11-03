"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

// Tabs container component with simple state and clean indicator
export function Tabs({ tabs = [], defaultTab, onChange, className }) {
  const [activeTab, setActiveTab] = useState(defaultTab || (tabs[0] && tabs[0].id));

  function handleTabClick(tabId) {
    setActiveTab(tabId);
    if (onChange) onChange(tabId);
  }

  return (
    <div className={cn("w-full", className)}>
      {/* Tab navigation headers */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={cn(
                "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-all cursor-pointer rounded-t-lg",
                isActive
                  ? "border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400 font-semibold"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Active Tab Content */}
      <div className="mt-4">
        {tabs.find((tab) => tab.id === activeTab)?.content}
      </div>
    </div>
  );
}

export default Tabs;
