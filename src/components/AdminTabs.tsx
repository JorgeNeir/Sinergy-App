'use client';

import { useState } from 'react';

interface Props {
  children: React.ReactNode[];
  tabs: string[];
}

export default function AdminTabs({ children, tabs }: Props) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div>
      <div className="flex gap-2 mb-8 border-b border-gray-200">
        {tabs.map((tab, index) => (
          <button
            key={index}
            onClick={() => setActiveTab(index)}
            className={`px-6 py-3 text-sm font-semibold transition-all border-b-2 -mb-px ${
              activeTab === index
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      {children[activeTab]}
    </div>
  );
}