// src/components/layout/PageTabs.tsx
import { NavLink, useLocation } from 'react-router-dom';
import clsx from 'clsx';

export interface TabItem {
  label: string;
  href: string;
  icon?: React.ElementType;
}

interface PageTabsProps {
  tabs: TabItem[];
  basePath: string;
}

export default function PageTabs({ tabs, basePath }: PageTabsProps) {
  const location = useLocation();

  return (
    <div className="border-b border-slate-200 bg-white rounded-t-lg">
      <nav className="flex space-x-8 px-6" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.href || 
            (tab.href === basePath && location.pathname === basePath);
          
          return (
            <NavLink
              key={tab.href}
              to={tab.href}
              end
              className={clsx(
                "group inline-flex items-center gap-2 py-4 px-1 border-b-2 text-sm font-medium transition-all duration-200",
                isActive
                  ? "border-[#1F3A8A] text-[#1F3A8A]"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              )}
            >
              {tab.icon && <tab.icon className="h-4 w-4" />}
              {tab.label}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}