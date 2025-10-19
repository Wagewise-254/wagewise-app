// src/pages/dashboard/DashboardLayout.tsx
import TopBar from '@/components/dashboard/TopBar';
import { Outlet } from 'react-router-dom';
import OfflineBanner from '@/components/common/OfflineBanner';

const DashboardLayout = () => {
  return (
    <div className="flex flex-col h-screen">
        <OfflineBanner/>
      <TopBar />
      <main className="flex-1 bg-gray-100 p-6 overflow-y-auto">
        <Outlet /> {/* Child routes will render here */}
      </main>
    </div>
  );
};

export default DashboardLayout;