// src/components/company/CompanyTopBar.tsx
import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useCompanyStore } from '@/stores/companyStore';

// ShadCN UI Components
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, HelpCircle } from 'lucide-react';

interface Company {
  id: string;
  business_name: string;
  // Add other properties of your Company object here
}

const CompanyTopBar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { companyId } = useParams();
  const { companies, fetchCompanies, loading } = useCompanyStore();
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);

  useEffect(() => {
    // Fetch companies if they are not already in the store
    if (companies.length === 0) {
      fetchCompanies();
    }
    // Find the company with the matching ID
    const foundCompany = companies.find((c) => c.id === companyId);
    setCurrentCompany(foundCompany || null);
  }, [companyId, companies, fetchCompanies]);
  
  const fullName = user?.user_metadata?.user_name || '';
  const firstName = fullName.split(' ')[0] || 'User';
  const userEmail = user?.email || 'No email';

  return (
    <header className="bg-[#7F5EFD] text-white shadow-md z-50">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Left Side: Back button and Company Name */}
        <div className="flex items-center space-x-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 hover:text-white">
              <ArrowLeft size={22} />
            </Button>
          </Link>
          <h2 className="text-xl font-semibold">
            {loading ? 'Loading...' : currentCompany?.business_name || 'Company Dashboard'}
          </h2>
        </div>

        {/* Right Side: Actions and Profile */}
        <div className="flex items-center space-x-2">
          <a href="mailto:wagewise.dev@gmail.com" target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 hover:text-white">
              <HelpCircle size={22} />
            </Button>
          </a>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative cursor-pointer h-9 w-9 rounded-full">
                <Avatar className="cursor-pointer h-9 w-9 bg-amber-400">
                  <AvatarFallback className="bg-amber-400 text-white font-bold">
                    {firstName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{fullName || "User"}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {userEmail}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className='cursor-pointer' asChild>
                <Link to="/account-settings">Account Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem className='cursor-pointer' onClick={logout}>
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default CompanyTopBar;