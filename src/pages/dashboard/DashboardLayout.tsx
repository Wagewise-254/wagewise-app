// src/pages/dashboard/DashboardLayout.tsx
import TopBar from '@/components/dashboard/TopBar';
import { Outlet } from 'react-router-dom';
import OfflineBanner from '@/components/common/offlinebanner';

const DashboardLayout = () => {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
        <OfflineBanner/>
      <TopBar />
      <main className="flex-1 bg-gray-50 p-6 overflow-y-auto">
        <Outlet /> {/* Child routes will render here */}
      </main>
    </div>
  );
};

export default DashboardLayout;