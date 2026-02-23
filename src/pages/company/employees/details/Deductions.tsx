import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { SectionDetailsHeader } from "@/components/company/employees/employeeutils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import { useEmployee } from "@/hooks/useEmployee";
import { supabase } from "@/lib/supabaseClient";

// Types for the database responses
interface DeductionType {
  name: string;
  code: string;
  is_pre_tax: boolean;
}

interface DeductionEmployee {
  id: string;
}

interface DeductionResponse {
  id: string;
  value: number;
  calculation_type: string;
  is_recurring: boolean;
  start_date: string;
  end_date: string | null;
  deduction_types: DeductionType;
  employees: DeductionEmployee;
}

interface StatutoryDeduction {
  name: string;
  type: string;
  value: string;
  frequency: string;
  assignedAs: string;
  isActive: boolean;
}

interface AssignedDeduction {
  id: string;
  name: string;
  type: string;
  value: number;
  calculation_type: string;
  frequency: string;
  assignedAs: string;
  deduction_types: DeductionType;
}

export default function EmployeeDeductions() {
  const { companyId, employeeId } = useParams<{
    companyId: string;
    employeeId: string;
  }>();
  const { employee, loading: employeeLoading } = useEmployee(companyId!, employeeId!);
  const [assignedDeductions, setAssignedDeductions] = useState<AssignedDeduction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch assigned deductions from the database
  useEffect(() => {
    const fetchAssignedDeductions = async () => {
      if (!companyId || !employeeId) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("deductions")
          .select(`
            id,
            value,
            calculation_type,
            is_recurring,
            start_date,
            end_date,
            deduction_types(name, code, is_pre_tax),
            employees!inner(id)
          `)
          .eq("company_id", companyId)
          .eq("employee_id", employeeId);

        if (error) throw error;

        // Transform the data to match our display format
        const transformedData = (data as unknown as DeductionResponse[]).map((deduction) => ({
          id: deduction.id,
          name: deduction.deduction_types.name,
          type: deduction.deduction_types.is_pre_tax ? "Pre-tax" : "Post-tax",
          value: deduction.value,
          calculation_type: deduction.calculation_type,
          frequency: deduction.is_recurring ? "Every payroll cycle" : "One-time",
          assignedAs: "Individual",
          deduction_types: deduction.deduction_types
        }));

        setAssignedDeductions(transformedData);
      } catch (err) {
        console.error("Error fetching deductions:", err);
        setError("Failed to load assigned deductions");
      } finally {
        setLoading(false);
      }
    };

    fetchAssignedDeductions();
  }, [companyId, employeeId]);

  // Statutory deductions based on employee settings
  const getStatutoryDeductions = (): StatutoryDeduction[] => {
    if (!employee) return [];

    const statutoryDeductions: StatutoryDeduction[] = [];

    if (employee.pays_paye) {
      statutoryDeductions.push({
        name: "PAYE",
        type: "Statutory",
        value: "Progressive",
        frequency: "Every payroll cycle",
        assignedAs: "Statutory",
        isActive: true
      });
    }

    if (employee.pays_nssf) {
      statutoryDeductions.push({
        name: "NSSF",
        type: "Statutory - New Rates (Tier I & II)",
        value: "Tiered",
        frequency: "Every payroll cycle",
        assignedAs: "Statutory",
        isActive: true
      });
    }

    if (employee.pays_shif) {
      statutoryDeductions.push({
        name: "SHIF",
        type: "Statutory",
        value: "2.75% of Gross",
        frequency: "Every payroll cycle",
        assignedAs: "Statutory",
        isActive: true
      });
    }

    if (employee.pays_housing_levy) {
      statutoryDeductions.push({
        name: "Housing Levy",
        type: "Statutory",
        value: "1.5% of Gross",
        frequency: "Every payroll cycle",
        assignedAs: "Statutory",
        isActive: true
      });
    }

    if (employee.pays_helb) {
      statutoryDeductions.push({
        name: "HELB",
        type: "Loan Repayment",
        value: "Variable",
        frequency: "Every payroll cycle",
        assignedAs: "Statutory",
        isActive: true
      });
    }

    return statutoryDeductions;
  };

  const statutoryDeductions = getStatutoryDeductions();
  const hasStatutoryDeductions = statutoryDeductions.length > 0;
  const hasAssignedDeductions = assignedDeductions.length > 0;
  const isLoading = employeeLoading || loading;

  if (error) {
    return (
      <div className="p-4 text-red-600 bg-red-50 rounded-md">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <SectionDetailsHeader 
          title="Deductions" 
          description="View all deductions for this employee. Manage deductions in the Payroll module." 
        />
        <Button 
          onClick={() => toast.info("Assigning deductions will be available soon. You can manage deductions in the Payroll module.")}
          className="flex bg-transparent items-center cursor-pointer gap-2 px-3 py-1.5 text-sm font-medium text-indigo-600 border border-indigo-600 rounded-md hover:bg-indigo-50 transition-all shadow-none"
        >
          <Plus className="h-4 w-4" />
          Assign Deduction
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Statutory Deductions Section */}
          {hasStatutoryDeductions && (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-slate-50 px-6 py-3 border-b border-slate-200">
                <h3 className="font-semibold text-slate-900">Statutory Deductions</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Based on employee's statutory settings
                </p>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 font-semibold text-slate-900">Name</th>
                    <th className="px-6 py-3 font-semibold text-slate-900">Assigned As</th>
                    <th className="px-6 py-3 font-semibold text-slate-900">Type</th>
                    <th className="px-6 py-3 font-semibold text-slate-900">Value</th>
                    <th className="px-6 py-3 font-semibold text-slate-900">Frequency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {statutoryDeductions.map((item) => (
                    <tr key={item.name} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-700">{item.name}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
                          {item.assignedAs}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">{item.type}</td>
                      <td className="px-6 py-4 text-slate-500">{item.value}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium bg-indigo-50 text-indigo-700">
                          {item.frequency}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Assigned Deductions Section */}
          {hasAssignedDeductions && (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-slate-50 px-6 py-3 border-b border-slate-200">
                <h3 className="font-semibold text-slate-900">Additional Deductions</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manually assigned deductions for this employee
                </p>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 font-semibold text-slate-900">Name</th>
                    <th className="px-6 py-3 font-semibold text-slate-900">Assigned As</th>
                    <th className="px-6 py-3 font-semibold text-slate-900">Type</th>
                    <th className="px-6 py-3 font-semibold text-slate-900">Value</th>
                    <th className="px-6 py-3 font-semibold text-slate-900">Frequency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {assignedDeductions.map((deduction) => (
                    <tr key={deduction.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-700">
                        {deduction.name}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700">
                          {deduction.assignedAs}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {deduction.calculation_type === "FIXED" ? "Fixed Amount" : "Percentage"}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {deduction.calculation_type === "FIXED" 
                          ? `KES ${deduction.value.toLocaleString()}`
                          : `${deduction.value}%`
                        }
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium ${
                          deduction.frequency === "Every payroll cycle" 
                            ? "bg-indigo-50 text-indigo-700" 
                            : "bg-amber-50 text-amber-700"
                        }`}>
                          {deduction.frequency}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* No Deductions State */}
          {!hasStatutoryDeductions && !hasAssignedDeductions && (
            <div className="text-center py-12 border border-slate-200 rounded-lg">
              <div className="text-slate-400 mb-3">
                <svg
                  className="mx-auto h-12 w-12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-slate-900">No deductions</h3>
              <p className="text-sm text-slate-500 mt-1">
                This employee has no deductions configured yet.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}