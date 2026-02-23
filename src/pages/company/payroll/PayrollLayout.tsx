import { Outlet } from "react-router-dom";
import PayrollSidebar from "@/components/company/layout/PayrollSidebar";

export default function PayrollLayout() {

  return (
    <section className="flex h-full bg-slate-50 overflow-hidden">
      {/* Sidebar (sticky, non-scrolling) */}
      <PayrollSidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 h-full  overflow-hidden">

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4">
          <Outlet />
        </div>
      </div>
    </section>
  );
}
