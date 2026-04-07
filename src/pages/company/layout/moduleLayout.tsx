import CompanyTopBar from '@/components/company/layout/CompanyTopBar';
import { Outlet } from 'react-router-dom';
import OfflineBanner from '@/components/common/offlinebanner';

const ModuleLayout = () => {
     return (
        <div className="flex flex-col h-screen overflow-hidden">
            <OfflineBanner/>
          <CompanyTopBar />
          <main className="flex-1 bg-gray-50 overflow-y-auto">
            <Outlet /> {/* Child routes will render here */}
          </main>
        </div>
      );
};

export default ModuleLayout;