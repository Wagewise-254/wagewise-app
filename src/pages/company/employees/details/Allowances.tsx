import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Inbox, Plus, Loader2 } from "lucide-react";
import {
  SectionDetailsHeader,
} from "@/components/company/employees/employeeutils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";

// Types for the database responses
interface AllowanceType {
  name: string;
  code: string;
  is_cash: boolean;
  is_taxable: boolean;
  description: string | null;
}

interface AllowanceResponse {
  id: string;
  value: number;
  calculation_type: string;
  is_recurring: boolean;
  start_date: string;
  end_date: string | null;
  allowance_types: AllowanceType;
  employees: { id: string };
}

interface Allowance {
  id: string;
  name: string;
  type: string;
  value: number;
  calculation_type: string;
  frequency: string;
  assignedAs: string;
  is_cash: boolean;
  is_taxable: boolean;
  allowance_type_details: AllowanceType;
}

export default function EmployeeAllowances() {
  const { companyId, employeeId } = useParams<{
    companyId: string;
    employeeId: string;
  }>();
  const [allowances, setAllowances] = useState<Allowance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch allowances from the database
  useEffect(() => {
    const fetchAllowances = async () => {
      if (!companyId || !employeeId) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("allowances")
          .select(`
            id,
            value,
            calculation_type,
            is_recurring,
            start_date,
            end_date,
            allowance_types(name, code, is_cash, is_taxable, description),
            employees!inner(id)
          `)
          .eq("company_id", companyId)
          .eq("employee_id", employeeId);

        if (error) throw error;

        // Transform the data to match our display format
        const transformedData = (data as unknown as AllowanceResponse[]).map((allowance) => ({
          id: allowance.id,
          name: allowance.allowance_types.name,
          type: allowance.allowance_types.is_cash ? "Cash" : "Non-cash",
          value: allowance.value,
          calculation_type: allowance.calculation_type,
          frequency: allowance.is_recurring ? "Every payroll cycle" : "One-time",
          assignedAs: "Individual",
          is_cash: allowance.allowance_types.is_cash,
          is_taxable: allowance.allowance_types.is_taxable,
          allowance_type_details: allowance.allowance_types
        }));

        setAllowances(transformedData);
      } catch (err) {
        console.error("Error fetching allowances:", err);
        setError("Failed to load allowances");
      } finally {
        setLoading(false);
      }
    };

    fetchAllowances();
  }, [companyId, employeeId]);

  const hasAllowances = allowances.length > 0;

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
          title="Allowances" 
          description="View all allowances for this employee. Manage allowances in the Payroll module." 
        />
        <Button 
          onClick={() => toast.info("Assigning allowances will be available soon. You can manage allowances in the Payroll module.")}
          className="flex bg-transparent items-center cursor-pointer gap-2 px-3 py-1.5 text-sm font-medium text-indigo-600 border border-indigo-600 rounded-md hover:bg-indigo-50 transition-all shadow-none"
        >
          <Plus className="h-4 w-4" />
          Add Allowance
        </Button>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : hasAllowances ? (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-semibold text-slate-900">Name</th>
                <th className="px-6 py-3 font-semibold text-slate-900">Type</th>
                <th className="px-6 py-3 font-semibold text-slate-900">Value</th>
                <th className="px-6 py-3 font-semibold text-slate-900">Tax Status</th>
                <th className="px-6 py-3 font-semibold text-slate-900">Frequency</th>
                <th className="px-6 py-3 font-semibold text-slate-900">Classification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {allowances.map((allowance) => (
                <tr key={allowance.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-700">
                    <div>
                      {allowance.name}
                      {allowance.allowance_type_details.description && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          {allowance.allowance_type_details.description}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium ${
                      allowance.type === "Cash" 
                        ? "bg-emerald-50 text-emerald-700" 
                        : "bg-amber-50 text-amber-700"
                    }`}>
                      {allowance.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {allowance.calculation_type === "FIXED" 
                      ? `KES ${allowance.value.toLocaleString()}`
                      : `${allowance.value}%`
                    }
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium ${
                      allowance.is_taxable
                        ? "bg-rose-50 text-rose-700"
                        : "bg-slate-100 text-slate-700"
                    }`}>
                      {allowance.is_taxable ? "Taxable" : "Non-taxable"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium ${
                      allowance.frequency === "Every payroll cycle" 
                        ? "bg-indigo-50 text-indigo-700" 
                        : "bg-amber-50 text-amber-700"
                    }`}>
                      {allowance.frequency}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium bg-purple-50 text-purple-700">
                      {allowance.assignedAs}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Summary Section */}
          <div className="bg-slate-50 border-t border-slate-200 px-6 py-4">
            <div className="flex gap-6 text-sm">
              <div>
                <span className="text-slate-500">Total Cash Allowances: </span>
                <span className="font-medium text-slate-900">
                  KES {allowances
                    .filter(a => a.is_cash && a.calculation_type === "FIXED")
                    .reduce((sum, a) => sum + a.value, 0)
                    .toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Total Non-cash Benefits: </span>
                <span className="font-medium text-slate-900">
                  {allowances.filter(a => !a.is_cash).length} items
                </span>
              </div>
              <div>
                <span className="text-slate-500">Taxable: </span>
                <span className="font-medium text-slate-900">
                  {allowances.filter(a => a.is_taxable).length} allowances
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-100 rounded-xl">
          <div className="bg-slate-50 p-4 rounded-full mb-4">
            <Inbox className="w-8 h-8 text-slate-300" />
          </div>
          <h4 className="text-slate-900 font-medium">No allowances found</h4>
          <p className="text-slate-500 text-sm mb-6">This employee doesn't have any active allowances.</p>
          <Button 
            onClick={() => toast.info("Adding allowances will be available soon. You can manage allowances in the Payroll module.")}
            variant="ghost" 
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
          >
            + Add First Allowance
          </Button>
        </div>
      )}
    </div>
  );
}