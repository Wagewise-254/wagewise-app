// src/components/company/CompanySidebar.tsx
import React from 'react';
import { NavLink, useParams, useLocation } from 'react-router-dom';
import { LayoutDashboard, Settings, Users, FileText, Briefcase, ChevronDown, ChevronRight, Building } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

const navLinks = [
  { name: 'Overview', path: 'overview', icon: <LayoutDashboard size={20} /> },
  { name: 'Settings', path: 'settings', icon: <Settings size={20} /> },
];

const hrLinks = [
  { name: 'Employees', path: 'hr/employees', icon: <Users size={20} /> },
  { name: 'Departments', path: 'hr/departments', icon: <Building size={20} /> },
  //{ name: 'Leave', path: 'hr/leave', icon: <FileText size={20} /> },
];

const payrollLinks = [
  { name: 'Payroll Run', path: 'payroll/pay-runs', icon: <Briefcase size={20} /> },
    { name: 'Bank Details', path: 'payroll/bank-details', icon: <FileText size={20} /> },
    { name: 'Statutory', path: 'payroll/statutory-deductions', icon: <FileText size={20} /> },
  { name: 'Allowances', path: 'payroll/allowances', icon: <FileText size={20} /> },
  { name: 'Deductions', path: 'payroll/deductions', icon: <FileText size={20} /> },
];

const CompanySidebar: React.FC = () => {
  const { companyId } = useParams();
  const location = useLocation();

  const isLinkActive = (path: string) => location.pathname.startsWith(`/company/${companyId}/${path}`);

  return (
    <aside className="w-64 bg-white shadow-md flex flex-col pt-4">
      <nav className="flex-1 px-4 space-y-2">
        {navLinks.map((link) => (
          <NavLink
            key={link.name}
            to={`/company/${companyId}/${link.path}`}
            className={({ isActive }) =>
              `flex items-center space-x-3 p-3 rounded-lg font-medium transition-colors duration-200 
              ${isActive ? 'bg-[#7F5EFD] text-white' : 'text-gray-600 hover:bg-gray-100'}`
            }
          >
            {link.icon}
            <span>{link.name}</span>
          </NavLink>
        ))}

        {/* HR Collapsible Menu */}
        <Collapsible defaultOpen={isLinkActive('hr')}>
          <CollapsibleTrigger className={`w-full flex items-center justify-between space-x-3 p-3 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition-colors duration-200 ${isLinkActive('hr') ? 'bg-gray-100 text-gray-800' : ''}`}>
            <div className="flex items-center space-x-3">
              <Users size={20} />
              <span>HR</span>
            </div>
            {isLinkActive('hr') ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </CollapsibleTrigger>
          <CollapsibleContent className="ml-6 space-y-1">
            {hrLinks.map((link) => (
              <NavLink
                key={link.name}
                to={`/company/${companyId}/${link.path}`}
                className={({ isActive }) =>
                  `flex items-center space-x-3 p-2 rounded-lg font-medium text-sm transition-colors duration-200 
                  ${isActive ? 'bg-[#7F5EFD] text-white' : 'text-gray-600 hover:bg-gray-100'}`
                }
              >
                {link.icon}
                <span>{link.name}</span>
              </NavLink>
            ))}
          </CollapsibleContent>
        </Collapsible>

        {/* Payroll Collapsible Menu */}
        <Collapsible defaultOpen={isLinkActive('payroll')}>
          <CollapsibleTrigger className={`w-full flex items-center justify-between space-x-3 p-3 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition-colors duration-200 ${isLinkActive('payroll') ? 'bg-gray-100 text-gray-800' : ''}`}>
            <div className="flex items-center space-x-3">
              <Briefcase size={20} />
              <span>Payroll</span>
            </div>
            {isLinkActive('payroll') ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </CollapsibleTrigger>
          <CollapsibleContent className="ml-6 space-y-1">
            {payrollLinks.map((link) => (
              <NavLink
                key={link.name}
                to={`/company/${companyId}/${link.path}`}
                className={({ isActive }) =>
                  `flex items-center space-x-3 p-2 rounded-lg font-medium text-sm transition-colors duration-200 
                  ${isActive ? 'bg-[#7F5EFD] text-white' : 'text-gray-600 hover:bg-gray-100'}`
                }
              >
                {link.icon}
                <span>{link.name}</span>
              </NavLink>
            ))}
          </CollapsibleContent>
        </Collapsible>
      </nav>
    </aside>
  );
};

export default CompanySidebar;