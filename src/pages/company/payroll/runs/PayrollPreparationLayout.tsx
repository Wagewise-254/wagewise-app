// pages/preparation/index.tsx
import { useState } from 'react';
import PreparationTabs from '@/components/payroll/runs/PreparationTabs';
import PayrollPreparationOverview from './PayrollPreparationOverview';
import PayrollPreparationEarnings from './PayrollPreparationEarnings';
import PayrollPreparationDeductions from './PayrollPreparationDeductions';

export default function PreparationLayout() {
  const [activeTab, setActiveTab] = useState('overview');

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <PayrollPreparationOverview />;
      case 'earnings':
        return <PayrollPreparationEarnings />;
      case 'deductions':
        return <PayrollPreparationDeductions />;
      default:
        return null;
    }
  };

  return (
    <div>
      <PreparationTabs 
        onTabChange={setActiveTab}
        defaultActiveTab="overview"
      />
      
      <div className="mt-4">
        {renderContent()}
      </div>
    </div>
  );
}