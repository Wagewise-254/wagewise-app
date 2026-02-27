// src/components/dashboard/TopBar.tsx
import React, { useState, useMemo, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuthStore, Company } from "@/stores/authStore";
import { toast } from "sonner";

// ShadCN UI Components
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Icons
import { 
  HelpCircle, 
  ArrowLeft,
  Home,
  Mail,
  ChevronDown
} from "lucide-react";

const CompanyTopBar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { companyId } = useParams();
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const navigate = useNavigate();
  const { companies: companyMemberships } = useAuthStore();

  const companies = useMemo(() => {
    return companyMemberships.map((m) => m.companies);
  }, [companyMemberships]);

  useEffect(() => {
    // Find the company with the matching ID
    const foundCompany = companies.find((c) => c.id === companyId);
    setCurrentCompany(foundCompany || null);
  }, [companyId, companies]);

  const fullName = useAuthStore.getState().activeWorkspace?.full_names || "";
  const firstName = fullName.split(" ")[0] || "User";
  const userEmail = user?.email || "No email";

  const handleLogout = async () => {
    toast.info("Logging out");
    await logout();
    navigate("/login", { replace: true });
  };

  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

  return (
    <TooltipProvider>
      <header className="bg-linear-to-r from-[#1F3A8A] to-[#2D4A9E] text-white shadow-lg z-50">
        <div className="flex items-center justify-between h-16 px-6">
          {/* Left Side: Back Button and Logo */}
          <div className="flex items-center space-x-3">
            {/* Back Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBackToDashboard}
                  className="text-white hover:bg-white/20 hover:text-white transition-all duration-200 h-9 w-9 rounded-full"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Back to Dashboard</p>
              </TooltipContent>
            </Tooltip>

            {/* Vertical Divider */}
            <div className="h-8 w-px bg-white/20" />

            {/* Logo with Tooltip */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Link 
                  to={`/company/${companyId}/modules`} 
                  className="flex items-center space-x-2 group"
                >
                  {currentCompany?.logo_url ? (
                    <img
                      src={currentCompany.logo_url}
                      alt={currentCompany.business_name}
                      className="h-8 w-auto rounded-sm transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-8 w-8 bg-white/10 rounded flex items-center justify-center">
                      <Home className="h-4 w-4 text-white/60" />
                    </div>
                  )}
                  <span className="text-sm font-medium text-white/80 group-hover:text-white transition-colors hidden sm:inline-block">
                    {currentCompany?.business_name || "Company"}
                  </span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Go to {currentCompany?.business_name || "Company"} Home</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Right Side: Actions and Profile */}
          <div className="flex items-center space-x-2">
            {/* Company Name (Mobile visible) */}
            <div className="sm:hidden mr-2">
              <span className="text-sm font-medium text-white/80 truncate max-w-30">
                {currentCompany?.business_name || "Company"}
              </span>
            </div>

            {/* Feedback dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="text-white hover:bg-white/20 hover:text-white font-medium text-sm transition-all duration-200 hidden sm:inline-flex"
                >
                  Feedback
                  <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Contact Us
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" asChild>
                  <a 
                    href="mailto:wagedesk@gmail.com" 
                    className="flex items-center gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    <span>wagedesk@gmail.com</span>
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Help dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20 hover:text-white transition-all duration-200 h-9 w-9 rounded-full"
                >
                  <HelpCircle className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Need Help?</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" asChild>
                  <a 
                    href="mailto:wagedesk@gmail.com"
                    className="flex items-center gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    <span>wagedesk@gmail.com</span>
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative cursor-pointer h-9 w-9 rounded-full p-0 hover:opacity-90 transition-all duration-200"
                >
                  <Avatar className="h-9 w-9 bg-white ring-2 ring-white/20 hover:ring-white/40 transition-all">
                    <AvatarFallback className="bg-white text-[#1F3A8A] font-bold text-sm">
                      {firstName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none text-gray-900">
                      {fullName || "User"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground mt-1">
                      {userEmail}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" asChild>
                  <Link 
                    to="/dashboard/account-settings"
                    className="w-full"
                  >
                    Account Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                  onClick={handleLogout}
                >
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
    </TooltipProvider>
  );
};

export default CompanyTopBar;