import { useState, useEffect } from "react";
import { NavLink, useParams, useLocation } from "react-router-dom";
import clsx from "clsx";
import {
  LayoutDashboard,
  Users,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Briefcase,
  Building,
  Building2,
  ChartColumn,
  Trash2,
  Settings,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SubNavItem {
  label: string;
  href: string;
}

interface NavItem {
  label: string;
  href?: string;
  icon?: React.ElementType;
  children?: SubNavItem[];
}

interface MainSidebarProps {
  companyName?: string;
  companyLogo?: string;
}

export default function MainSidebar({
  companyName,
  companyLogo,
}: MainSidebarProps) {
  const { companyId } = useParams();
  const location = useLocation();

  // Persist sidebar collapsed state
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    return saved ? JSON.parse(saved) : false;
  });

  // Track open groups based on current route
  const [openGroups, setOpenGroups] = useState<string[]>(() => {
    const saved = localStorage.getItem("sidebar-open-groups");
    return saved ? JSON.parse(saved) : [];
  });

  // Persist open groups
  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    localStorage.setItem("sidebar-open-groups", JSON.stringify(openGroups));
  }, [openGroups]);

  // Auto-expand groups based on current route
  useEffect(() => {
    const groupsToOpen: string[] = [];

    if (location.pathname.includes("/payroll")) {
      groupsToOpen.push("payroll");
    }
    if (location.pathname.includes("/reports")) {
      groupsToOpen.push("reports");
    }

    if (groupsToOpen.length > 0) {
      setOpenGroups((prev) => {
        const newGroups = [...prev];
        groupsToOpen.forEach((group) => {
          if (!newGroups.includes(group)) {
            newGroups.push(group);
          }
        });
        return newGroups;
      });
    }
  }, [location.pathname]);

  const toggleGroup = (group: string) => {
    // If collapsed → expand sidebar first
    if (isCollapsed) {
      setIsCollapsed(false);
      setOpenGroups([group]);
      return;
    }

    setOpenGroups((prev) =>
      prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group],
    );
  };

  // Check if a route or any of its children is active
  const isActiveRoute = (item: NavItem): boolean => {
    // For items with href, check if current path matches OR starts with href + '/'
    // This handles cases like /settings/profiles matching /settings
    if (item.href) {
      // Exact match
      if (location.pathname === item.href) return true;
      // Parent match (e.g., /settings/profiles starts with /settings)
      if (location.pathname.startsWith(item.href + "/")) return true;
    }
    // For items with children, check if any child is active
    if (item.children) {
      return item.children.some((child) => {
        // Exact match
        if (location.pathname === child.href) return true;
        // Child has deeper nesting (e.g., /payroll/benefits/assign)
        if (location.pathname.startsWith(child.href + "/")) return true;
        return false;
      });
    }
    return false;
  };

  // Check if a specific sublink is active (exact match OR deep nesting)
 const isSubLinkActive = (href: string): boolean => {
  const current = location.pathname;

  // Exact match always wins
  if (current === href) return true;

  // Prevent "Overview" from matching everything
  const isOverview =
    href === `/company/${companyId}/payroll` ||
    href === `/company/${companyId}/reports`;

  if (isOverview) return false;

  // Allow deep matching for real sub-pages
  return current.startsWith(href + "/");
};

  // Check if a parent item should show as active (only for highlighting, not for expansion)
  // This prevents parent from showing active when on sibling routes
  const shouldHighlightParent = (item: NavItem): boolean => {
    if (item.href) {
      return isActiveRoute(item);
    }
    if (item.children) {
      // Only highlight parent if we're exactly on a child route, not on sibling routes
      return item.children.some((child) => {
        if (location.pathname === child.href) return true;
        return location.pathname.startsWith(child.href + "/");
      });
    }
    return false;
  };

  const navigation: NavItem[] = [
    {
      label: "Dashboard",
      href: `/company/${companyId}/dashboard`,
      icon: LayoutDashboard,
    },
    {
      label: "Employees",
      href: `/company/${companyId}/employees`,
      icon: Users,
    },
    {
      label: "Organization",
      href: `/company/${companyId}/organization`,
      icon: Building,
    },
    {
      label: "Payroll",
      icon: Briefcase,
      children: [
        { label: "Overview", href: `/company/${companyId}/payroll` },
        { label: "Run Payroll", href: `/company/${companyId}/payroll/run` },
        { label: "History", href: `/company/${companyId}/payroll/history` },
        { label: "Payslips", href: `/company/${companyId}/payroll/payslips` },
        { label: "Benefits", href: `/company/${companyId}/payroll/benefits` },
        {
          label: "Deductions",
          href: `/company/${companyId}/payroll/deductions`,
        },
      ],
    },
    {
      label: "Reports",
      icon: ChartColumn,
      children: [
        { label: "Overview", href: `/company/${companyId}/reports` },
        { label: "Annual", href: `/company/${companyId}/reports/annual` },
        { label: "P9A", href: `/company/${companyId}/reports/p9a` },
      ],
    },
    {
      label: "Settings",
      href: `/company/${companyId}/settings`,
      icon: Settings,
    },
  ];

  return (
    <TooltipProvider>
      <aside
        className={clsx(
          "flex flex-col border-r border-slate-200 bg-white transition-all duration-300 shadow-sm",
          isCollapsed ? "w-16" : "w-64",
        )}
      >
        {/* Header - Company Brand */}
        <div className="border-b border-slate-200 p-3 flex items-center justify-between min-h-15">
          {!isCollapsed && (
            <div className="flex items-center space-x-2 overflow-hidden">
              {companyLogo ? (
                <img
                  src={companyLogo}
                  alt={companyName}
                  className="h-8 w-8 rounded object-cover shrink-0"
                />
              ) : (
                <div className="h-8 w-8 bg-linear-to-br from-[#7F5EFD] to-[#9B7DFF] rounded flex items-center justify-center shrink-0 shadow-sm">
                  <Building2 className="h-4 w-4 text-white" />
                </div>
              )}
              <p className="text-sm font-semibold text-slate-700 truncate">
                {companyName || "Wagewise"}
              </p>
            </div>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={clsx(
              "p-1.5 rounded-md hover:bg-slate-100 transition-colors",
              !isCollapsed && "ml-auto",
            )}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4 text-slate-500" />
            ) : (
              <ChevronLeft className="h-4 w-4 text-slate-500" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {navigation.map((item) => {
            const groupKey = item.label.toLowerCase();
            const isGroupOpen = openGroups.includes(groupKey);
            const isActive = shouldHighlightParent(item);

            // Main navigation item content
            const NavContent = () => (
              <div
                className={clsx(
                  "flex items-center rounded-sm text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-[#7F5EFD] text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                  isCollapsed
                    ? "justify-center px-0 py-2.5"
                    : "px-3 py-2.5 cursor-pointer",
                  !isCollapsed && item.children && "justify-between",
                )}
                onClick={() => item.children && toggleGroup(groupKey)}
              >
                <div className="flex items-center">
                  {item.icon && (
                    <item.icon
                      className={clsx("h-5 w-5", isActive && "text-white")}
                    />
                  )}
                  {!isCollapsed && (
                    <span className={clsx(item.icon && "ml-3")}>
                      {item.label}
                    </span>
                  )}
                </div>
                {!isCollapsed && item.children && (
                  <>
                    {isGroupOpen ? (
                      <ChevronUp className="h-4 w-4 text-slate-300" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    )}
                  </>
                )}
              </div>
            );

            // Render main item with or without tooltip
            const MainNavItem = () => {
              if (item.href) {
                if (isCollapsed) {
                  return (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <NavLink to={item.href} className="block">
                          <NavContent />
                        </NavLink>
                      </TooltipTrigger>
                      <TooltipContent
                        side="right"
                        className="px-2 py-1 text-xs"
                      >
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  );
                }
                return (
                  <NavLink to={item.href} className="block">
                    <NavContent />
                  </NavLink>
                );
              }
              return <NavContent />;
            };

            return (
              <div key={item.label} className="space-y-1">
                <MainNavItem />

                {/* Sub-menu items - no icons here */}
                {!isCollapsed && item.children && isGroupOpen && (
                  <div className="ml-6 pl-2 border-l border-slate-200 space-y-1">
                    {item.children.map((sub) => {
                      const isSubActive = isSubLinkActive(sub.href);

                      return (
                        <NavLink
                          key={sub.href}
                          to={sub.href}
                          className={clsx(
                            "block px-3 py-2 rounded-sm text-sm transition-colors",
                            isSubActive
                              ? "bg-[#7F5EFD]/10 text-[#7F5EFD] font-medium"
                              : "text-slate-500 hover:text-slate-700 hover:bg-slate-50",
                          )}
                        >
                          {sub.label}
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer - Utility Actions */}
        <div className="border-t border-slate-200 p-3 mt-auto">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                disabled
                className={clsx(
                  "flex items-center w-full px-3 py-2 rounded-md text-sm text-slate-400 opacity-60 cursor-not-allowed",
                  isCollapsed ? "justify-center" : "",
                )}
              >
                <Trash2 className="h-5 w-5" />
                {!isCollapsed && <span className="ml-3">Restore Data</span>}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              Restore feature coming soon
            </TooltipContent>
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
}