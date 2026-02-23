import { Company, useAuthStore } from "@/stores/authStore";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface CompanyCardProps {
  company: Company;
}
const toProperCase = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const CompanyCard = ({ company }: CompanyCardProps) => {
  const state = useAuthStore.getState();
  const role = toProperCase(state.activeWorkspace?.role || "Viewer");
  const fallbackLetter = company.business_name
    ? company.business_name.charAt(0).toUpperCase()
    : "C";
  const status = company.status; // default for now
  const statusColor =
    status === "APPROVED"
      ? "bg-green-100 text-green-700"
      : "bg-yellow-100 text-yellow-700";

  return (
    <Link to={`/company/${company.id}/modules`}>
      <Card className="w-full h-40 p-5 flex flex-col justify-between bg-white/70 backdrop-blur-md border-white/40 hover:border-purple-400 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 rounded-xl shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
              <AvatarImage src={company.logo_url} alt={company.business_name} />
              <AvatarFallback className="bg-linear-to-br from-purple-500 to-indigo-600 text-white">
                {fallbackLetter}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-gray-800 line-clamp-1">
                {company.business_name}
              </span>
              <span className="text-xs font-medium text-purple-600 tracking-wider">
                {company.industry || "General"}
              </span>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            {status === "APPROVED" ?
              (<DropdownMenuContent align="end">
                <Link to={`/company/${company.id}/settings`}>
                  <DropdownMenuItem className="cursor-pointer">
                    View Settings
                  </DropdownMenuItem>
                </Link>
                <Link to={`/company/${company.id}/employees`}>
                  <DropdownMenuItem className="cursor-pointer">
                    Manage Employees
                  </DropdownMenuItem>
                </Link>
                <Link to={`/company/${company.id}/payroll/run`}>
                  <DropdownMenuItem className="cursor-pointer">
                    Run Payroll
                  </DropdownMenuItem>
                </Link>
                {role !== "Viewer" && (
                  <Link
                    to={`/company/${company.id}/reports/overview`}
                  >
                    <DropdownMenuItem className="cursor-pointer">
                      View Reports
                    </DropdownMenuItem>
                  </Link>
                )}
                 <Link to={`/company/${company.id}/payroll/setup`}>
                  <DropdownMenuItem className="cursor-pointer">
                    Payroll setup
                  </DropdownMenuItem>
                </Link>
              </DropdownMenuContent>) : (
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="cursor-pointer">
                    Not Authorized
                  </DropdownMenuItem>
                </DropdownMenuContent>
              )
            }
          </DropdownMenu>
        </div>

        {/* Status Tag */}
        <div className="flex items-center justify-between">
          <Badge
            className={`${statusColor} border-none shadow-none capitalize px-3 py-1 text-[10px] font-bold hover:bg-white`}
          >
            ● {toProperCase(status)}
          </Badge>
          <span className="text-[12px] text-gray-400 font-medium">
            Click to manage →
          </span>
        </div>
      </Card>
    </Link>
  );
};
