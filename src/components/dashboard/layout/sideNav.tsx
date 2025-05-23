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
import logo from "../../../assets/reverse-logo.png"; // Adjust path as needed

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
  // State to control the open/closed state of the mobile sheet
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  // State to control the open/closed state of the logout confirmation dialog
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  // Get the current location to highlight the active link
  const location = useLocation();
  // Hook for programmatic navigation
  const navigate = useNavigate();
  // State to track if the current view is mobile size
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Access the logout action from your Zustand store
  const logout = useAuthStore((state) => state.logout);

  // Effect to handle window resizing and update isMobile state
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // If resizing to desktop, ensure the mobile sheet is closed
      if (!mobile) {
        setIsSheetOpen(false);
      }
    };

    // Add and clean up the resize event listener
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Function to close the sheet when a link is clicked (on mobile)
  const handleLinkClick = () => {
    if (isMobile) {
      setIsSheetOpen(false);
    }
  };

  // Function to initiate the logout process by opening the confirmation dialog
  const handleLogoutInitiate = () => {
    setIsLogoutConfirmOpen(true); // Open the confirmation dialog
    // Optionally close the mobile sheet immediately when logout is initiated
    if (isMobile) {
      setIsSheetOpen(false);
    }
  };

  // Function to perform the actual logout after confirmation
  const handleLogoutConfirm = () => {
    logout(); // Call the logout action from the Zustand store
    toast.success("Logged out successfully!"); // Show success message
    navigate("/login"); // Redirect the user to the login page after logging out
    // The dialog will close automatically when AlertDialogAction is clicked
  };


  // Render the desktop sidebar
  const renderDesktopSidebar = () => (
    <div className="hidden md:flex md:flex-col h-screen w-[230px] bg-[#7F5EFD] text-white p-5 shadow-lg">
      {/* Logo Section */}
      <div className="flex justify-center mb-6">
        <img src={logo} alt="WageWise Logo" className="w-[100px] h-[100px] object-contain" />
      </div>
      <Separator className="bg-white/20 mb-6" />

      {/* Navigation Links */}
      <nav className="flex flex-col space-y-2 flex-grow"> {/* Added flex-grow to push logout to bottom */}
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
              {/* {item.icon && <item.icon className="mr-2 h-4 w-4" />} */}
              {item.name}
            </Link>
          </Button>
        ))}
      </nav>

      {/* Logout Button - Placed at the bottom */}
      <div className="mt-auto pt-6"> {/* Use mt-auto to push to bottom */}
         <Separator className="bg-white/20 mb-6" /> {/* Separator above logout */}
        <Button
          variant="ghost"
          className="justify-start w-full text-white hover:bg-red-600 hover:text-white" // Styled differently for logout
          onClick={handleLogoutInitiate} // Call the initiate function
        >
          <LogOut className="mr-2 h-4 w-4" /> {/* Logout icon */}
          Logout
        </Button>
      </div>
    </div>
  );

  // Render the mobile sheet (drawer)
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
        <nav className="flex flex-col space-y-2 flex-grow"> {/* Added flex-grow */}
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
                 {/* {item.icon && <item.icon className="mr-2 h-4 w-4" />} */}
                {item.name}
              </Link>
            </Button>
          ))}
        </nav>

         {/* Logout Button - Placed at the bottom */}
         <div className="mt-auto pt-6"> {/* Use mt-auto to push to bottom */}
            <Separator className="bg-white/20 mb-6" /> {/* Separator above logout */}
            <Button
              variant="ghost"
              className="justify-start w-full text-white hover:bg-red-600 hover:text-white" // Styled differently for logout
              onClick={handleLogoutInitiate} // Call the initiate function
            >
              <LogOut className="mr-2 h-4 w-4" /> {/* Logout icon */}
              Logout
            </Button>
         </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <>
      {/* Render either the desktop sidebar or the mobile sheet based on screen size */}
      {isMobile ? renderMobileSheet() : renderDesktopSidebar()}

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={isLogoutConfirmOpen} onOpenChange={setIsLogoutConfirmOpen}>
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
