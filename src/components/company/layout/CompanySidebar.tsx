// src/components/company/CompanySidebar.tsx
import React, { useState } from "react";
import { NavLink, useParams, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Settings,
  Users,
  FileText,
  Briefcase,
  ChevronDown,
  ChevronRight,
  Building,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

/* ---------- Types ---------- */
type LinkItem = {
  name: string;
  path: string;
  icon: React.ReactNode;
};

type LinkSection = {
  type: "link";
  links: LinkItem[];
};

type CollapsibleSection = {
  type: "collapsible";
  name: string;
  icon: React.ReactNode;
  basePath: string;
  links: LinkItem[];
};

type SidebarSection = LinkSection | CollapsibleSection;

// Sidebar structure: order matters here
const sidebarSections: SidebarSection[]= [
  {
    type: "link",
    links: [
      { name: "Overview", path: "overview", icon: <LayoutDashboard size={20} /> },
    ],
  },
  {
    type: "collapsible",
    name: "HR",
    icon: <Users size={20} />,
    basePath: "hr",
    links: [
      { name: "Employees", path: "hr/employees", icon: <Users size={20} /> },
      { name: "Departments", path: "hr/departments", icon: <Building size={20} /> },
    ],
  },
  {
    type: "collapsible",
    name: "Payroll",
    icon: <Briefcase size={20} />,
    basePath: "payroll",
    links: [
      { name: "Payroll Run", path: "payroll/pay-runs", icon: <Briefcase size={20} /> },
      { name: "Statutory", path: "payroll/statutory-deductions", icon: <FileText size={20} /> },
      { name: "Allowances", path: "payroll/allowances", icon: <FileText size={20} /> },
      { name: "Deductions", path: "payroll/deductions", icon: <FileText size={20} /> },
    ],
  },
  {
    type: "link",
    links: [
      { name: "Settings", path: "settings", icon: <Settings size={20} /> },
    ],
  },
];

const CompanySidebar: React.FC = () => {
  const { companyId } = useParams();
  const location = useLocation();

  // State to track which section is open (for accordion behavior)
  const [openSection, setOpenSection] = useState<string | null>(() => {
    // auto-open based on current route
    const active = sidebarSections.find(
      (s) => s.type === "collapsible" && location.pathname.includes(s.basePath!)
    ) as CollapsibleSection | undefined;
    return active?.name || null;
  });

  const toggleSection = (sectionName: string) => {
    setOpenSection((prev) => (prev === sectionName ? null : sectionName));
  };

  const isLinkActive = (path: string) =>
    location.pathname.startsWith(`/company/${companyId}/${path}`);

  return (
    <aside className="w-64 bg-white shadow-md flex flex-col pt-4">
      <nav className="flex-1 px-4 space-y-2">
        {sidebarSections.map((section) =>
          section.type === "link" ? (
            section.links.map((link) => (
              <NavLink
                key={link.name}
                to={`/company/${companyId}/${link.path}`}
                className={({ isActive }) =>
                  `flex items-center space-x-3 p-3 rounded-lg font-medium transition-colors duration-200 
                  ${
                    isActive
                      ? "bg-[#7F5EFD] text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`
                }
              >
                {link.icon}
                <span>{link.name}</span>
              </NavLink>
            ))
          ) : (
            <Collapsible
              key={section.name}
              open={openSection === section.name}
              onOpenChange={() => toggleSection(section.name)}
            >
              <CollapsibleTrigger
                className={`w-full flex items-center justify-between space-x-3 p-3 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition-colors duration-200 ${
                  isLinkActive(section.basePath!) ? "bg-gray-100 text-gray-800" : ""
                }`}
              >
                <div className="flex items-center space-x-3">
                  {section.icon}
                  <span>{section.name}</span>
                </div>
                {openSection === section.name ? (
                  <ChevronDown size={20} />
                ) : (
                  <ChevronRight size={20} />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="ml-6 space-y-1">
                {section.links.map((link) => (
                  <NavLink
                    key={link.name}
                    to={`/company/${companyId}/${link.path}`}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 p-2 rounded-lg font-medium text-sm transition-colors duration-200 
                      ${
                        isActive
                          ? "bg-[#7F5EFD] text-white"
                          : "text-gray-600 hover:bg-gray-100"
                      }`
                    }
                  >
                    {link.icon}
                    <span>{link.name}</span>
                  </NavLink>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )
        )}
      </nav>
    </aside>
  );
};

export default CompanySidebar;
