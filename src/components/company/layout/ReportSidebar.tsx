import { NavLink, useParams } from "react-router-dom";
import clsx from "clsx";
import {
  LayoutDashboard,
  Mail,
  BarChart3,

} from "lucide-react";

export default function ReportSidebar() {
  const { companyId } = useParams();

  const navItems = [
    {
      label: "Overview",
      href: `/company/${companyId}/reports/overview`,
      icon: LayoutDashboard,
      exact: true,
    },
    {
      label: "Annual Reports",
      href: `/company/${companyId}/reports/annual`,
      icon: BarChart3,
    },
    {
      label: "P9A",
      href: `/company/${companyId}/reports/p9a`,
      icon: Mail,
    }
  ];

  return (
    <aside className="w-64 shrink-0 border-r border-slate-200 bg-white py-4 h-full overflow-y-auto">
      <nav className="px-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.exact}
            className={({ isActive }) =>
              clsx(
                "flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 group",
                isActive
                  ? "bg-[#1F3A8A]/10 text-[#1F3A8A] translate-x-1"
                  : "text-slate-400 hover:bg-slate-50 hover:text-slate-900"
              )
            }
          >
            <item.icon
              className={clsx(
                "mr-3 h-5 w-5 shrink-0 transition-colors",
                "group-hover:text-slate-600"
              )}
            />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
