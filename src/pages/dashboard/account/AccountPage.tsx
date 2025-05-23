// src/pages/dashboard/account/AccountPage.tsx - Updated with Active Tab Indicator

import React, { useState } from 'react';
import SideNav from '@/components/dashboard/layout/sideNav'; // Adjust path as needed
import { Button } from '@/components/ui/button';
// Assuming you have a utility for merging Tailwind classes, like 'clsx' or 'cn' from Shadcn setup
// If you don't have 'cn', you might need to install 'clsx' and 'tailwind-merge' and create src/lib/utils.ts
import { cn } from '@/lib/utils'; // Make sure this import path is correct for your project

// Import account section components
import ProfileSettings from '@/components/dashboard/account/ProfileSettings';
import CompanySettings from '@/components/dashboard/account/CompanySettings';
import SecuritySettings from '@/components/dashboard/account/SecuritySettings';
import DataManagement from '@/components/dashboard/account/DataManagement';

// Define the possible tabs for the mini-navigation
type AccountTab = 'profile' | 'company' | 'security' | 'data';

const AccountPage: React.FC = () => {
  const [currentAccountTab, setCurrentAccountTab] = useState<AccountTab>('profile');

  // Function to render content based on the active tab
  const renderTabContent = () => {
    switch (currentAccountTab) {
      case 'profile':
        return <ProfileSettings />;
      case 'company':
        return <CompanySettings />;
      case 'security':
        return <SecuritySettings />;
      case 'data':
        return <DataManagement />;
      default:
        return null;
    }
  };

  // Define Tailwind classes for active and inactive tabs
  const activeTabClasses = "border-b-2 border-[#7F5EFD] text-[#7F5EFD] font-semibold";
  const inactiveTabClasses = "text-gray-600 hover:text-gray-800"; // Default ghost button text color and hover

  return (
    <div className="flex h-screen bg-gray-100">
      <SideNav />
      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Account Settings</h1>

        {/* Mini-Navigation (Tabs) */}
        {/* Removed pb-2 from here, as buttons will handle their own padding and border */}
        <div className="flex space-x-4 border-b border-gray-200 mb-6">
          <Button
            variant="ghost" // Use ghost variant to allow full custom styling
            className={cn(
              "relative px-4 py-3 rounded-none transition-colors duration-200", // Base styles for all tab buttons
              currentAccountTab === 'profile' ? activeTabClasses : inactiveTabClasses
            )}
            onClick={() => setCurrentAccountTab('profile')}
          >
            My Profile
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "relative px-4 py-3 rounded-none transition-colors duration-200",
              currentAccountTab === 'company' ? activeTabClasses : inactiveTabClasses
            )}
            onClick={() => setCurrentAccountTab('company')}
          >
            Company Info
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "relative px-4 py-3 rounded-none transition-colors duration-200",
              currentAccountTab === 'security' ? activeTabClasses : inactiveTabClasses
            )}
            onClick={() => setCurrentAccountTab('security')}
          >
            Security
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "relative px-4 py-3 rounded-none transition-colors duration-200",
              currentAccountTab === 'data' ? activeTabClasses : inactiveTabClasses
            )}
            onClick={() => setCurrentAccountTab('data')}
          >
            Data Management
          </Button>
        </div>

        {/* Content Area based on selected tab */}
        <div className="flex-1 overflow-auto">
          {renderTabContent()}
        </div>

      </div>
    </div>
  );
};

export default AccountPage;
