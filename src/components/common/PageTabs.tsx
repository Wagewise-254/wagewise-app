import { NavLink } from 'react-router-dom';
import clsx from 'clsx';

interface Tab {
  label: string;
  href: string;
  exact?: boolean;
}

export default function PageTabs({ tabs }: { tabs: Tab[] }) {
  return (
    <div className="relative border-b border-gray-200 mb-6">
      <nav className="flex gap-8">
        {tabs.map((tab) => (
          <NavLink
            key={tab.href}
            to={tab.href}
            end={tab.exact} // Use 'end' for exact matching in React Router v6
            className={({ isActive }) =>
              clsx(
                'relative pb-3 text-sm font-medium transition-colors duration-200',
                isActive ? 'text-[#1F3A8A]' : 'text-gray-400 hover:text-gray-700'
              )
            }
          >
            {({ isActive }) => (
              <>
                {tab.label}
                {/* Animated underline */}
                <span
                  className={clsx(
                    'absolute left-0 -bottom-px h-0.5 w-full bg-[#1F3A8A] transition-all duration-300 ease-out',
                    isActive ? 'scale-x-100' : 'scale-x-0'
                  )}
                  style={{ transformOrigin: 'left' }}
                />
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}