//import React from "react";
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

//import settings section components
import OverviewSettingsSection from '@/components/company/settings/OverviewSettingsSection';
import StatutorySettingSection from '@/components/company/settings/StatutorySettingSection';

type SettingTab = 'overview' | 'statutory';

export default function CompanySettings() {
  const [currentSettingTab, setCurrentSettingTab] = useState<SettingTab>('overview');
  
  const renderTabContent = () => {
    switch (currentSettingTab) {
      case 'overview':
        return <OverviewSettingsSection/>;
      case 'statutory':
        return <StatutorySettingSection/>;
      default:
        return null;
    }
  };

    // Define Tailwind classes for active and inactive tabs
  const activeTabClasses = "border-b-2 border-[#7F5EFD] text-[#7F5EFD] font-semibold";
  const inactiveTabClasses = "text-gray-600 hover:text-gray-800 ";

  return (
    <div className="flex h-auto bg-gray-100">
      <div className="flex-1 flex flex-col p-6 bg-white rounded-md overflow-hidden">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Company Settings</h1>

        {/* Mini-Navigation (Tabs) */}
        {/* Adjusted border-b and removed pb-2 */}
        <div className="flex space-x-4 border-b border-gray-200 mb-6">
          <Button
            variant="ghost" // Use ghost variant for full custom styling control
            className={cn(
              "relative px-4 py-3 rounded-none transition-colors duration-200 cursor-pointer", // Base styles
              currentSettingTab === 'overview' ? activeTabClasses : inactiveTabClasses
            )}
            onClick={() => setCurrentSettingTab('overview')}
          >
            Overview
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "relative px-4 py-3 rounded-none transition-colors duration-200 cursor-pointer",
              currentSettingTab === 'statutory' ? activeTabClasses : inactiveTabClasses
            )}
            onClick={() => setCurrentSettingTab('statutory')}
          >
            Statutory
          </Button>
        </div>

        {/* Content Area based on selected tab */}
        <div className="flex-1 overflow-auto">
          {renderTabContent()}
        </div>

      </div>
    </div>
  );
}
