import { Outlet } from "react-router-dom";
import ReportSidebar from "@/components/company/layout/ReportSidebar";

export default function ReportLayout() {

  return (
    <section className="flex h-full bg-gray-50 overflow-hidden">
      {/* Sidebar (sticky, non-scrolling) */}
      <ReportSidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 h-full  overflow-hidden">

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </section>
  );
}
