// src/components/layout/MainTopBar.tsx
import React, { useState, useMemo, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuthStore, Company } from "@/stores/authStore";
import { toast } from "sonner";

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
import { Input } from "@/components/ui/input";
import {
  TooltipProvider,
} from "@/components/ui/tooltip";

import {
  Search,
  HelpCircle,
  LogOut,
  Settings as SettingsIcon,
  User,
  Mail,
  Command,
} from "lucide-react";
import NotificationBell from "@/components/notifications/NotificationBell";

interface MainTopBarProps {
  onSearch?: (query: string) => void;
}

export default function MainTopBar({ onSearch }: MainTopBarProps) {
  const { user, logout } = useAuthStore();
  const { companyId } = useParams();
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const navigate = useNavigate();
  const { companies: companyMemberships } = useAuthStore();

  const companies = useMemo(() => {
    return companyMemberships.map((m) => m.companies);
  }, [companyMemberships]);

  useEffect(() => {
    const foundCompany = companies.find((c) => c.id === companyId);
    setCurrentCompany(foundCompany || null);
  }, [companyId, companies]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") {
        e.preventDefault();
        setShowSearch(true);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const fullName = useAuthStore.getState().activeWorkspace?.full_names || "";
  const firstName = fullName.split(" ")[0] || "User";
  const userEmail = user?.email || "No email";
  console.log(showSearch)

  const handleLogout = async () => {
    toast.info("Logging out");
    await logout();
    navigate("/login", { replace: true });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
    setShowSearch(false);
  };

  return (
    <TooltipProvider>
      <header className="bg-white border-b border-slate-200 shadow-sm z-40">
        <div className="flex items-center justify-between h-16 px-6">
          {/* Left Side - Company Info (visible when sidebar collapsed) */}
          <div className="flex items-center space-x-4 lg:hidden">
            <div className="flex items-center space-x-2">
              {currentCompany?.logo_url ? (
                <img
                  src={currentCompany.logo_url}
                  alt={currentCompany.business_name}
                  className="h-8 w-8 rounded object-cover"
                />
              ) : (
                <div className="h-8 w-8 bg-gradient-to-br from-[#1F3A8A] to-[#2D4A9E] rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {currentCompany?.business_name?.charAt(0) || "C"}
                  </span>
                </div>
              )}
              <span className="text-sm font-medium text-slate-700">
                {currentCompany?.business_name || "Company"}
              </span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl mx-4 lg:mx-auto">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search employees, payroll runs, reports... (Ctrl+K)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-12 bg-slate-50 border-slate-200 focus:bg-white focus:border-[#1F3A8A]/30 transition-all"
              />
              <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-xs font-mono text-slate-500 bg-slate-100 rounded border border-slate-200">
                <Command className="h-3 w-3" />
                K
              </kbd>
            </form>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-2">
            {/* Notification Bell */}
            <NotificationBell />

            {/* Help Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all duration-200 h-9 w-9 rounded-full"
                >
                  <HelpCircle className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Need Help?</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" asChild>
                  <a href="mailto:wagewise.dev@gmail.com" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>Email Support</span>
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <HelpCircle className="h-4 w-4" />
                  <span>Documentation</span>
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
                  <Avatar className="h-9 w-9 bg-gradient-to-br from-[#1F3A8A] to-[#2D4A9E] ring-2 ring-slate-200 hover:ring-[#1F3A8A]/30 transition-all">
                    <AvatarFallback className="bg-transparent text-white font-bold text-sm">
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
                    <p className="text-xs leading-none text-slate-500 mt-1">
                      {userEmail}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" asChild>
                  <Link to="/dashboard/account-settings" className="w-full flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>Account Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" asChild>
                  <Link to={`/company/${companyId}/settings/profiles`} className="w-full flex items-center gap-2">
                    <SettingsIcon className="h-4 w-4" />
                    <span>Company Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
    </TooltipProvider>
  );
}