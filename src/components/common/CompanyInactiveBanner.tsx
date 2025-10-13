import React from "react";
import { AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface CompanyInactiveBannerProps {
  companyId: string;
  status?: string; // e.g. 'inactive', 'suspended'
  message?: string;
}

const CompanyInactiveBanner: React.FC<CompanyInactiveBannerProps> = ({
  companyId,
  status = "inactive",
  message,
}) => {
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
          `This company is currently marked as ${status}. Some features are unavailable until it is reactivated.`}
      </p>

      <Link to={`/company/${companyId}/settings`}>
        <Button className="bg-[#7F5EFD] hover:bg-[#6f52e0] text-white rounded-md cursor-pointer px-6 py-2">
          Go to Company Settings
        </Button>
      </Link>
    </div>
  );
};

export default CompanyInactiveBanner;
