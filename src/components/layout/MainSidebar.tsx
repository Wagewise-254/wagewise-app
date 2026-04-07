// src/components/layout/MainSidebar.tsx
import { useState, useEffect } from "react";
import { NavLink, useParams, useLocation } from "react-router-dom";
import clsx from "clsx";
import {
  LayoutDashboard,
  Users,
  FileText,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Layers,
  BarChart3,
  PlayCircle,
  Mail,
  Building2,
  UserCog,
  Shield,
  Calendar,
  FileBarChart,
  Receipt,
  Gift,
  MinusCircle,
  UserCheck,
  History,
  Eye,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  exact?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface MainSidebarProps {
  companyName?: string;
  companyLogo?: string;
}

export default function MainSidebar({ companyName, companyLogo }: MainSidebarProps) {
  const { companyId } = useParams();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  const navigationSections: NavSection[] = [
    {
      title: "MAIN",
      items: [
        {
          label: "Dashboard",
          href: `/company/${companyId}/modules`,
          icon: LayoutDashboard,
          exact: true,
        },
      ],
    },
    {
      title: "EMPLOYEES",
      items: [
        {
          label: "All Employees",
          href: `/company/${companyId}/employees`,
          icon: Users,
        },
        {
          label: "Non-Active",
          href: `/company/${companyId}/employees/non-active`,
          icon: UserCheck,
        },
        {
          label: "Terminated",
          href: `/company/${companyId}/employees/terminated`,
          icon: UserCog,
        },
        {
          label: "Add Employee",
          href: `/company/${companyId}/employees/add-employee`,
          icon: UserCog,
        },
      ],
    },
    {
      title: "PAYROLL",
      items: [
        {
          label: "Overview",
          href: `/company/${companyId}/payroll`,
          icon: BarChart3,
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
          icon: History,
        },
        {
          label: "Send Payslips",
          href: `/company/${companyId}/payroll/payslips`,
          icon: Mail,
        },
        {
          label: "Benefits",
          href: `/company/${companyId}/payroll/benefits`,
          icon: Gift,
        },
        {
          label: "Assign Benefits",
          href: `/company/${companyId}/benefits/assign`,
          icon: Briefcase,
        },
        {
          label: "Deductions",
          href: `/company/${companyId}/payroll/deductions`,
          icon: MinusCircle,
        },
        {
          label: "Assign Deductions",
          href: `/company/${companyId}/deductions/assign`,
          icon: Layers,
        },
        {
          label: "Reviewers",
          href: `/company/${companyId}/payroll/settings/reviewers`,
          icon: Shield,
        },
      ],
    },
    {
      title: "REPORTS",
      items: [
        {
          label: "Overview",
          href: `/company/${companyId}/reports`,
          icon: FileText,
          exact: true,
        },
        {
          label: "Annual Reports",
          href: `/company/${companyId}/reports/annual`,
          icon: Calendar,
        },
        {
          label: "P9A Reports",
          href: `/company/${companyId}/reports/p9a`,
          icon: FileBarChart,
        },
        {
          label: "Payroll Runs",
          href: `/company/${companyId}/reports/overview`,
          icon: Receipt,
        },
      ],
    },
    {
      title: "SETTINGS",
      items: [
        {
          label: "Company Overview",
          href: `/company/${companyId}/settings`,
          icon: Building2,
          exact: true,
        },
        {
          label: "Profiles",
          href: `/company/${companyId}/settings/profiles`,
          icon: Users,
        },
        {
          label: "Departments",
          href: `/company/${companyId}/settings/departments`,
          icon: Building2,
        },
        {
          label: "Job Titles",
          href: `/company/${companyId}/settings/Job-titles`,
          icon: Briefcase,
        },
        {
          label: "Audit Logs",
          href: `/company/${companyId}/settings/logs`,
          icon: Eye,
        },
      ],
    },
  ];

  const NavItemContent = ({ item, isActive }: { item: NavItem; isActive: boolean }) => (
    <div className="flex items-center w-full">
      <item.icon
        className={clsx(
          "h-5 w-5 shrink-0 transition-colors",
          isActive ? "text-[#1F3A8A]" : "text-slate-500 group-hover:text-slate-700"
        )}
      />
      {!isCollapsed && (
        <>
          <span className={clsx("ml-3 transition-opacity duration-200", isCollapsed ? "opacity-0" : "opacity-100")}>
            {item.label}
          </span>
          {item.badge && !isCollapsed && (
            <span className="ml-auto text-xs bg-[#1F3A8A]/10 text-[#1F3A8A] px-2 py-0.5 rounded-full">
              {item.badge}
            </span>
          )}
        </>
      )}
      {isCollapsed && item.badge && (
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
      )}
    </div>
  );

  return (
    <TooltipProvider>
      <aside
        className={clsx(
          "shrink-0 border-r border-slate-200 bg-white transition-all duration-300 ease-in-out flex flex-col",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Company Header */}
        <div className={clsx(
          "border-b border-slate-200 py-4 px-3 transition-all duration-300",
          isCollapsed ? "flex justify-center" : ""
        )}>
          {!isCollapsed ? (
            <div className="flex items-center space-x-2">
              {companyLogo ? (
                <img src={companyLogo} alt={companyName} className="h-8 w-8 rounded object-cover" />
              ) : (
                <div className="h-8 w-8 bg-gradient-to-br from-[#1F3A8A] to-[#2D4A9E] rounded flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-white" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {companyName || "Company"}
                </p>
                <p className="text-xs text-slate-500 truncate">Enterprise</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              {companyLogo ? (
                <img src={companyLogo} alt={companyName} className="h-8 w-8 rounded object-cover" />
              ) : (
                <div className="h-8 w-8 bg-gradient-to-br from-[#1F3A8A] to-[#2D4A9E] rounded flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="px-3 space-y-6">
            {navigationSections.map((section, idx) => (
              <div key={section.title} className="space-y-2">
                {/* Section Title */}
                {!isCollapsed &&  (

                  <div className="px-3">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        {idx === 0 ? "MAIN" : section.title}
                      {section.title}
                    </h3>
                  </div>
                )}
                {isCollapsed &&  <div className="h-px bg-slate-100 my-2" />}

                {/* Section Items */}
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = item.exact
                      ? location.pathname === item.href
                      : location.pathname.startsWith(item.href);

                    const linkElement = (
                      <NavLink
                        key={item.href}
                        to={item.href}
                        end={item.exact}
                        className={({ isActive: navIsActive }) =>
                          clsx(
                            "relative flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 group",
                            navIsActive || isActive
                              ? "bg-[#1F3A8A]/10 text-[#1F3A8A]"
                              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                            isCollapsed ? "justify-center" : ""
                          )
                        }
                      >
                        <NavItemContent item={item} isActive={isActive || location.pathname === item.href} />
                      </NavLink>
                    );

                    if (isCollapsed) {
                      return (
                        <Tooltip key={item.href} delayDuration={0}>
                          <TooltipTrigger asChild>
                            {linkElement}
                          </TooltipTrigger>
                          <TooltipContent side="right" className="ml-2">
                            <p>{item.label}</p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    }

                    return linkElement;
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Collapse Toggle Button */}
        <div className="border-t border-slate-200 p-3">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={clsx(
              "flex items-center w-full px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
              "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              isCollapsed ? "justify-center" : ""
            )}
          >
            {isCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <>
                <ChevronLeft className="h-5 w-5 mr-2" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </TooltipProvider>
  );
}