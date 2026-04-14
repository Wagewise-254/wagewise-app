import { useParams } from "react-router-dom";
import { OtherDeductionsTable } from "@/components/payroll/settings/DeductionsTable";
export default function DeductionSettings() {
  const { companyId } = useParams<{ companyId: string }>();

  return (
    <div className="space-y-4 p-4">
      <div className="relative">
        <div className="flex gap-2">
          <div>
            <h2 className="text-lg font-medium text-slate-900">
              Deduction settings
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Manage and assign employee deductions
            </p>
          </div>
        </div>
      </div>
      <div>
        <OtherDeductionsTable companyId={companyId as string} />
      </div>
    </div>
  );
}
