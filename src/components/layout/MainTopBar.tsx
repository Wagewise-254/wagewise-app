// src/components/layout/MainTopBar.tsx
import  { useState, useMemo, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuthStore, Company } from "@/stores/authStore";
import { toast } from "sonner";
import GlobalSearch from "@/components/search/GlobalSearch";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

import {
  Search,
  HelpCircle,
  LogOut,
  Settings as SettingsIcon,
  User,
  Mail,
  Building2,
  PlusCircle,
  Check,
  ChevronRight,
} from "lucide-react";
import NotificationBell from "@/components/notifications/NotificationBell";

interface MainTopBarProps {
  onSearch?: (query: string) => void;
}

export default function MainTopBar({ onSearch }: MainTopBarProps) {
  const { user, logout, companies: companyMemberships } = useAuthStore();
  const { activeWorkspace } = useAuthStore();
  const { companyId } = useParams();
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [companySearchTerm, setCompanySearchTerm] = useState("");
  const navigate = useNavigate();

  const companies = useMemo(() => {
    return companyMemberships.map((m) => m.companies);
  }, [companyMemberships]);

  // Filter companies for the switcher
  const filteredCompanies = useMemo(() => {
    if (!companySearchTerm) return companies;
    return companies.filter((company) =>
      company.business_name
        ?.toLowerCase()
        .includes(companySearchTerm.toLowerCase()),
    );
  }, [companies, companySearchTerm]);

  useEffect(() => {
    const foundCompany = companies.find((c) => c.id === companyId);
    setCurrentCompany(foundCompany || null);
  }, [companyId, companies]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") {
        e.preventDefault();
        setShowGlobalSearch(true);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const fullName = activeWorkspace?.full_names || "";
  const firstName = fullName.split(" ")[0] || "User";
  const userEmail = user?.email || "No email";

  const handleLogout = async () => {
    toast.info("Logging out");
    await logout();
    navigate("/login", { replace: true });
  };


  const switchCompany = (companyId: string) => {
    navigate(`/company/${companyId}/dashboard`);
    toast.success(
      `Switched to ${companies.find((c) => c.id === companyId)?.business_name}`,
    );
  };

  return (
    <TooltipProvider>
      <header className="bg-white border-b border-slate-200 z-40">
        <div className="flex items-center justify-between h-15 px-6">
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
                <div className="h-8 w-8 bg-linear-to-br from-[#7F5EFD] to-[#9B7DFF] rounded flex items-center justify-center">
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
          <div className="flex-1 max-w-md mx-4">
            <button
              onClick={() => setShowGlobalSearch(true)}
              className="relative w-full h-9 pl-9 pr-12 bg-slate-50 border border-slate-200 rounded-md text-left text-sm text-slate-400 hover:bg-slate-100 hover:border-slate-300 transition-all cursor-text flex items-center"
            >
              <Search className="absolute left-3 h-4 w-4 text-slate-400" />
              <span>Search employees, payroll runs, reports...</span>
              <kbd className="absolute right-3 hidden sm:inline-flex text-xs text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                ⌘K
              </kbd>
            </button>
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
                  <a
                    href="mailto:wagewise.dev@gmail.com"
                    className="flex items-center gap-2"
                  >
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

            {/* User Profile Dropdown with Company Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative cursor-pointer h-9 w-9 rounded-full p-0 hover:opacity-90 transition-all duration-200"
                >
                  <Avatar className="h-9 w-9 bg-[#7F5EFD] ring-2 ring-slate-200 hover:ring-[#7F5EFD]/30 transition-all">
                    <AvatarFallback className="bg-transparent text-white font-bold text-sm">
                      {firstName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-80" align="end" forceMount>
                {/* User Info */}
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

                {/* Current Company Section */}
                <div className="px-2 py-2">
                  <p className="text-xs font-semibold text-slate-400 px-2 mb-2">
                    CURRENT COMPANY
                  </p>
                  {currentCompany && (
                    <div className="flex items-center justify-between px-2 py-1.5 bg-[#7F5EFD]/5 rounded-lg border border-[#7F5EFD]/20">
                      <div className="flex items-center gap-2">
                        {currentCompany.logo_url ? (
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={currentCompany.logo_url} />
                            <AvatarFallback className="text-xs bg-[#7F5EFD] text-white">
                              {currentCompany.business_name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="h-6 w-6 bg-[#7F5EFD] rounded flex items-center justify-center">
                            <Building2 className="h-3 w-3 text-white" />
                          </div>
                        )}
                        <span className="text-sm font-medium text-slate-700">
                          {currentCompany.business_name}
                        </span>
                      </div>
                      <Badge
                        variant="secondary"
                        className="text-[10px] bg-[#7F5EFD]/10 text-[#7F5EFD] border-none"
                      >
                        Active
                      </Badge>
                    </div>
                  )}
                </div>

                <DropdownMenuSeparator />

                {/* Company Switcher */}
                <div className="px-2 py-2">
                  <div className="flex items-center justify-between px-2 mb-2">
                    <p className="text-xs font-semibold text-slate-400">
                      SWITCH COMPANY
                    </p>
                    <Link to="/dashboard">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs text-[#7F5EFD] hover:text-[#7F5EFD] hover:bg-[#7F5EFD]/10"
                      >
                        View all
                        <ChevronRight className="h-3 w-3 ml-1" />
                      </Button>
                    </Link>
                  </div>

                  {/* Search within companies */}
                  <div className="relative mb-2">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-slate-400" />
                    <Input
                      placeholder="Search companies..."
                      value={companySearchTerm}
                      onChange={(e) => setCompanySearchTerm(e.target.value)}
                      className="h-8 pl-7 text-sm bg-slate-50 border-slate-200 focus-visible:ring-1 focus-visible:ring-[#7F5EFD]"
                    />
                  </div>

                  <ScrollArea className="max-h-64">
                    <div className="space-y-1">
                      {filteredCompanies.length > 0 ? (
                        filteredCompanies.map((company) => {
                          const isActive = company.id === companyId;
                          return (
                            <DropdownMenuItem
                              key={company.id}
                              className={cn(
                                "cursor-pointer px-2 py-2 rounded-md",
                                isActive && "bg-[#7F5EFD]/5",
                              )}
                              onClick={() =>
                                !isActive && switchCompany(company.id)
                              }
                              disabled={isActive}
                            >
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2">
                                  {company.logo_url ? (
                                    <Avatar className="h-6 w-6">
                                      <AvatarImage src={company.logo_url} />
                                      <AvatarFallback className="text-xs bg-slate-200 text-slate-600">
                                        {company.business_name?.charAt(0)}
                                      </AvatarFallback>
                                    </Avatar>
                                  ) : (
                                    <div className="h-6 w-6 bg-linear-to-br from-slate-400 to-slate-500 rounded flex items-center justify-center">
                                      <Building2 className="h-3 w-3 text-white" />
                                    </div>
                                  )}
                                  <div className="flex flex-col">
                                    <span
                                      className={cn(
                                        "text-sm",
                                        isActive
                                          ? "font-medium text-[#7F5EFD]"
                                          : "text-slate-700",
                                      )}
                                    >
                                      {company.business_name}
                                    </span>
                                    {company.industry && (
                                      <span className="text-[10px] text-slate-400">
                                        {company.industry}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {isActive && (
                                  <Check className="h-4 w-4 text-[#7F5EFD]" />
                                )}
                              </div>
                            </DropdownMenuItem>
                          );
                        })
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-xs text-slate-400">
                            No companies found
                          </p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>

                  {/* Add Company Button */}
                  <Link to="/company-setup">
                    <Button
                      variant="outline"
                      className="w-full mt-3 h-8 text-sm border-dashed border-slate-300 text-slate-600 hover:border-[#7F5EFD] hover:text-[#7F5EFD] hover:bg-[#7F5EFD]/5"
                    >
                      <PlusCircle className="h-3.5 w-3.5 mr-2" />
                      Add New Company
                    </Button>
                  </Link>
                </div>

                <DropdownMenuSeparator />

                {/* Settings & Logout */}
                <DropdownMenuItem className="cursor-pointer" asChild>
                  <Link
                    to="/dashboard/account-settings"
                    className="w-full flex items-center gap-2"
                  >
                    <User className="h-4 w-4" />
                    <span>Account Settings</span>
                  </Link>
                </DropdownMenuItem>
                {companyId && (
                  <DropdownMenuItem className="cursor-pointer" asChild>
                    <Link
                      to={`/company/${companyId}/settings`}
                      className="w-full flex items-center gap-2"
                    >
                      <SettingsIcon className="h-4 w-4" />
                      <span>Company Settings</span>
                    </Link>
                  </DropdownMenuItem>
                )}
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
       <GlobalSearch 
        isOpen={showGlobalSearch}
        onClose={() => setShowGlobalSearch(false)}
        onSearch={onSearch}
      />
    </TooltipProvider>
  );
}

// Add this utility function at the top or in a separate utils file
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
