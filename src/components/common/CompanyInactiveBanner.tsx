import React from "react";
import { AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

//import { Link } from "react-router-dom";
import { Mail, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CompanyInactiveBannerProps {
  status?: string; // e.g. 'pending', 'suspended'
  message?: string;
}

const CompanyInactiveBanner: React.FC<CompanyInactiveBannerProps> = ({
  status = "pending",
  message,
}) => {
  const navigate = useNavigate();
  const formattedStatus =
    status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-5">
      <div className="bg-yellow-100 text-yellow-800 p-4 rounded-full">
        <AlertTriangle className="h-8 w-8" />
      </div>

      <h2 className="text-2xl font-bold text-gray-900">
        Company {formattedStatus}
      </h2>

      <p className="text-gray-600 max-w-md">
        {message ||
          `This company is currently marked as ${formattedStatus}. Some features are unavailable until it is reactivated.`}
      </p>

      <Button
        onClick={() => window.open("mailto:wagedesk@gmail.com")}
        size="lg"
        className="px-8 font-medium shadow-md transition-all hover:shadow-lg active:scale-95 bg-[#1F3A8A] cursor-pointer"
      >
        <Mail className="mr-2 h-4 w-4" />
        Contact Support
      </Button>

      <Button
        variant="ghost"
       className="text-muted-foreground hover:text-foreground p-0 h-auto cursor-pointer"
        onClick={() => navigate("/dashboard")}
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        Back to Dashboard
      </Button>
    </div>
  );
};

export default CompanyInactiveBanner;
