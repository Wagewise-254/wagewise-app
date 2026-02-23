import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AllowanceTable } from "@/components/payroll/settings/BenefitsTable";
import { UserPlus, ArrowLeft } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function BenefitSettings() {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();

  return (
    <div className="space-y-4 px-8">
      <div className="relative ">
        <div className="flex gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 cursor-pointer"
                onClick={() => navigate(`/company/${companyId}/modules`)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Back to modules</p>
            </TooltipContent>
          </Tooltip>
          <div>
            <h2 className="text-lg font-medium text-slate-900">
              Benefit Settings
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Manage and assign employee benefits, allowances, and deductions
            </p>
          </div>
        </div>

        {/* Add this button */}
        <Button
          onClick={() => navigate(`/company/${companyId}/benefits/assign`)}
          className="absolute top-16 bg-[#1F3A8A] max-w-50 hover:bg-[#162a63] text-white rounded-sm shadow-none cursor-pointer h-10 px-4 text-sm font-medium transition-all hover:-translate-y-0.5 flex items-center gap-2"
        >
          <UserPlus className="h-4 w-4" />
          Assign Benefits
        </Button>
      </div>

      <AllowanceTable companyId={companyId as string} />
    </div>
  );
}
