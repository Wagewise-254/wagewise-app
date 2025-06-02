import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, LogOut } from "lucide-react";
import { toast } from "sonner";
// Import Shadcn UI components
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
// Import AlertDialog components for confirmation
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Assuming you have a logo file

import logo from "/icons/android-chrome-512x512.png"; // Adjust path as needed


// Import your Zustand auth store
import useAuthStore from "@/store/authStore";


// Define navigation items with icons (optional, but good practice)
const navItems = [
  { name: "Dashboard", path: "/dashboard" /*, icon: HomeIcon */ },
  { name: "Employees", path: "/employee" /*, icon: UsersIcon */ },
  { name: "Payroll", path: "/payroll" /*, icon: DollarSignIcon */ },
  { name: "Reports", path: "/reports" /*, icon: BarChartIcon */ },
  { name: "Tax Settings", path: "/tax" /*, icon: FileTextIcon */ },
  { name: "Account", path: "/account" /*, icon: SettingsIcon */ },
];

const SideNav = () => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirm] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [appVersion, setAppVersion] = useState(''); // State to hold the app version

  const logout = useAuthStore((state) => state.logout);

  // Effect to handle window resizing and update isMobile state
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsSheetOpen(false);
      }
    };

    // Add and clean up the resize event listener
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Effect to get and set the app version
  useEffect(() => {
    // CORRECTED: Access the version using import.meta.env
    if (import.meta.env.VITE_APP_VERSION) {
      setAppVersion(import.meta.env.VITE_APP_VERSION);
    }
  }, []); // Run once on component mount

  const handleLinkClick = () => {
    if (isMobile) {
      setIsSheetOpen(false);
    }
  };

  const handleLogoutInitiate = () => {
    setIsLogoutConfirm(true);
    if (isMobile) {
      setIsSheetOpen(false);
    }
  };

  const handleLogoutConfirm = () => {
    logout();
    toast.success("Logged out successfully!");
    navigate("/login");
  };

  const renderDesktopSidebar = () => (
    <div className="hidden md:flex md:flex-col h-screen w-[230px] bg-[#7F5EFD] text-white p-5 shadow-lg">
      {/* Logo Section */}
      <div className="flex justify-center mb-6">
        <img src={logo} alt="WageWise" className="w-[100px] h-[100px] object-contain" />
      </div>
      <Separator className="bg-white/20 mb-6" />

      {/* Navigation Links */}
      <nav className="flex flex-col space-y-2 flex-grow">
        {navItems.map((item) => (
          <Button
            key={item.path}
            asChild
            variant="ghost"
            className={`justify-start text-white hover:bg-[#6A4BE8] hover:text-white ${
              location.pathname.startsWith(item.path)
                ? "bg-white text-[#7F5EFD] hover:bg-white hover:text-[#7F5EFD]"
                : ""
            }`}
            onClick={handleLinkClick}
          >
            <Link to={item.path}>
              {item.name}
            </Link>
          </Button>
        ))}
      </nav>

      {/* Logout Button and Version - Placed at the bottom */}
      <div className="mt-auto pt-6">
        <Separator className="bg-white/20 mb-6" />
        <Button
          variant="ghost"
          className="justify-start w-full text-white hover:bg-red-600 hover:text-white"
          onClick={handleLogoutInitiate}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
        {/* App Version Display */}
      </div>
    </div>
  );

  const renderMobileSheet = () => (
    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed top-4 left-4 z-50 bg-[#7F5EFD] text-white border-[#7F5EFD] hover:bg-[#6A4BE8] hover:text-white shadow-lg"
        >
          <Menu size={24} />
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-[250px] bg-[#7F5EFD] text-white p-5 flex flex-col">
        {/* Logo Section */}
        <div className="flex justify-center mb-6">
          <img src={logo} alt="WageWise Logo" className="w-[100px] h-[100px] object-contain" />
        </div>
        <Separator className="bg-white/20 mb-6" />

        {/* Navigation Links */}
        <nav className="flex flex-col space-y-2 flex-grow">
          {navItems.map((item) => (
            <Button
              key={item.path}
              asChild
              variant="ghost"
              className={`justify-start text-white hover:bg-[#6A4BE8] hover:text-white ${
                location.pathname.startsWith(item.path)
                  ? "bg-white text-[#7F5EFD] hover:bg-white hover:text-[#7F5EFD]"
                  : ""
              }`}
              onClick={handleLinkClick}
            >
              <Link to={item.path}>
                {item.name}
              </Link>
            </Button>
          ))}
        </nav>

        {/* Logout Button and Version - Placed at the bottom */}
        <div className="mt-auto pt-6">
          <Separator className="bg-white/20 mb-6" />
          
          <Button
            variant="ghost"
            className="justify-start w-full text-white hover:bg-red-600 hover:text-white"
            onClick={handleLogoutInitiate}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
          {/* App Version Display */}
          {appVersion && (
            <div className=" bg-amber-300 text-center text-white/70 text-sm mt-4">
              Version {appVersion} 
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <>
      {isMobile ? renderMobileSheet() : renderDesktopSidebar()}

      <AlertDialog open={isLogoutConfirmOpen} onOpenChange={setIsLogoutConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to log out?</AlertDialogTitle>
            <AlertDialogDescription>
              Logging out will end your current session. You will need to log in again to access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogoutConfirm}>
              Log Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default SideNav;
