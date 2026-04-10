// src/components/dashboard/TopBar.tsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Icons
import { HelpCircle } from "lucide-react";
import companyLogo from "@/assets/android-chrome-512x512.png";

const TopBar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { activeWorkspace } = useAuthStore();

  const fullName = activeWorkspace?.full_names ?? "";
  const firstName = fullName.split(" ")[0] || "User";
  const userEmail = user?.email || "No email";

  const handleLogout = async () => {
    toast.info("Logging out");
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="bg-[#7F5EFD] text-white shadow-md z-50">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Left Side: Logo */}
        <div className="flex items-center space-x-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link to="/dashboard">
                <img src={companyLogo} alt="Wagewise" className="h-8 w-auto" />
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>Home</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Right Side: Actions and Profile */}
        <div className="flex items-center space-x-2">
          {/* Feedback dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="text-white hover:bg-white/20 hover:text-white font-semibold text-sm"
              >
                Feedback
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Contact Us</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer" asChild>
                <a href="mailto:wagewise.dev@gmail.com">
                  📧 wagewise.dev@gmail.com
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
                className="text-white hover:bg-white/20 hover:text-white"
              >
                <HelpCircle size={22} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Need Help?</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer" asChild>
                <a href="mailto:wagewise.dev@gmail.com">
                  📧 wagewise.dev@gmail.com
                </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative cursor-pointer h-9 w-9 rounded-full"
              >
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
                  <p className="text-sm font-medium leading-none">
                    {fullName || "User"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {userEmail}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer" asChild>
                <Link to="/dashboard/account-settings">Account Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={handleLogout}
              >
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
