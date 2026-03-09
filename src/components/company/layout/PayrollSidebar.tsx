import { NavLink, useParams } from "react-router-dom";
import clsx from "clsx";
import {
  LayoutDashboard,
  PlayCircle,
  Mail,
  BarChart3,
  Briefcase,
  Layers,
  Settings,
} from "lucide-react";

export default function PayrollSidebar() {
  const { companyId } = useParams();

  const navigationSections = [
    {
      title: "MAIN",
      items: [
        {
          label: "Overview",
          href: `/company/${companyId}/payroll`,
          icon: LayoutDashboard,
          exact: true,
        },
        {
          label: "Run Payroll",
          href: `/company/${companyId}/payroll/run`,
          icon: PlayCircle,
          badge: "New",
        },
        {
          label: "Payroll History",
          href: `/company/${companyId}/payroll/history`,
          icon: BarChart3,
        },
        {
          label: "Send Payslips",
          href: `/company/${companyId}/payroll/payslips`,
          icon: Mail,
        },
      ],
    },
    {
      title: "COMPENSATION",
      items: [
        {
          label: "Benefits",
          href: `/company/${companyId}/payroll/benefits`,
          icon: Briefcase,
        },
        {
          label: "Deductions",
          href: `/company/${companyId}/payroll/deductions`,
          icon: Layers,
        },
      ],
    },
    {
      title: "SETTINGS",
      items: [
        {
          label: "Reviewers",
          href: `/company/${companyId}/payroll/settings/reviewers`,
          icon: Settings,
        },
      ],
    },
  ];

  return (
    <aside className="w-64 shrink-0 border-r border-slate-200 bg-white h-screen sticky top-0">
      <div className="h-full overflow-y-auto py-4">
        <nav className="px-3 space-y-1">
          {navigationSections.map((section, idx) => (
            <div key={section.title} className="space-y-1">
              {/* Section Title */}
              <div className="px-3 mb-2">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {section.title}
                </h3>
              </div>

              {/* Section Items */}
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    end={item.exact}
                    className={({ isActive }) =>
                      clsx(
                        "flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 group",
                        isActive
                          ? "bg-[#1F3A8A]/10 text-[#1F3A8A] translate-x-1"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                      )
                    }
                  >
                    <item.icon
                      className={clsx(
                        "mr-3 h-5 w-5 shrink-0 transition-colors",
                        "group-hover:text-slate-900",
                      )}
                    />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto text-xs bg-[#1F3A8A]/10 text-[#1F3A8A] px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                ))}
              </div>

              {/* Add divider between sections (except last) */}
              {idx < navigationSections.length - 1 && (
                <div className="my-4 border-t border-slate-100" />
              )}
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}
