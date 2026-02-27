import { Outlet } from "react-router-dom";
import SettingsSidebar from "@/components/company/layout/SettingsSidebar";

export default function SettingsLayout() {

  return (
    <section className="flex h-full bg-gray-50 overflow-hidden">
      {/* Sidebar (sticky, non-scrolling) */}
      <SettingsSidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 h-full  overflow-hidden">
        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6">
          <Outlet />
        </div>
      </div>
    </section>
  );
}
