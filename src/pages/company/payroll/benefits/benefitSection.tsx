import { useParams } from "react-router-dom";
import { AllowanceTable } from "@/components/payroll/settings/BenefitsTable";

export default function BenefitSettings() {
  const { companyId } = useParams<{ companyId: string }>();

  return (
    <div className="space-y-4 px-8">
      <div className="relative ">
        <div className="flex gap-2">
          <div>
            <h2 className="text-lg font-medium text-slate-900">
              Benefit Settings
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Manage and assign employee benefits, allowances, and deductions
            </p>
          </div>
        </div>
      </div>

      <AllowanceTable companyId={companyId as string} />
    </div>
  );
}
