import { useState } from 'react';
import clsx from 'clsx';

interface Tab {
  label: string;
  id: string;
}

interface PreparationTabsProps {
  onTabChange?: (tabId: string) => void;
  defaultActiveTab?: string;
}

export default function PreparationTabs({ 
  onTabChange, 
  defaultActiveTab = 'overview' 
}: PreparationTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultActiveTab);

  const tabs: Tab[] = [
    { label: 'Overview', id: 'overview' },
    { label: 'Earnings Breakdown', id: 'earnings' },
    { label: 'Deductions Breakdown', id: 'deductions' },
  ];

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    onTabChange?.(tabId);
  };

  return (
    <div className="relative border-b border-gray-200 mb-6">
      <nav className="flex gap-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={clsx(
              'relative pb-3 text-sm font-medium transition-colors duration-200 cursor-pointer',
              activeTab === tab.id ? 'text-[#1F3A8A]' : 'text-gray-400 hover:text-gray-700'
            )}
          >
            {tab.label}
            {/* Animated underline */}
            <span
              className={clsx(
                'absolute left-0 -bottom-px h-0.5 w-full bg-[#1F3A8A] transition-all duration-300 ease-out',
                activeTab === tab.id ? 'scale-x-100' : 'scale-x-0'
              )}
              style={{ transformOrigin: 'left' }}
            />
          </button>
        ))}
      </nav>
    </div>
  );
}