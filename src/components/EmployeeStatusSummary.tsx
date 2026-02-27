// components/company/employees/EmployeeStatusSummary.tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { API_BASE_URL } from "@/config";
import { useAuthStore } from "@/stores/authStore";
import { Card, CardContent } from "@/components/ui/card";
import { Users, UserCheck, UserX, Coffee } from "lucide-react";
import { Employee } from "@/types/employees";

interface EmployeeCounts {
  active: number;
  onLeave: number;
  terminated: number;
  suspended: number;
  total: number;
}

export default function EmployeeStatusSummary() {
  const { companyId } = useParams<{ companyId: string }>();
  const { session } = useAuthStore();
  const [counts, setCounts] = useState<EmployeeCounts>({
    active: 0,
    onLeave: 0,
    terminated: 0,
    suspended: 0,
    total: 0
  });

  useEffect(() => {
    const fetchCounts = async () => {
      if (!companyId || !session) return;

      try {
        const response = await fetch(
          `${API_BASE_URL}/company/${companyId}/employees`,
          {
            headers: { Authorization: `Bearer ${session?.access_token}` },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch employees');
        }

        const data: Employee[] = await response.json();
        
        const active = data.filter((e) => e.employee_status === "ACTIVE").length;
        const onLeave = data.filter((e) => e.employee_status === "On Leave").length;
        const terminated = data.filter((e) => e.employee_status === "Terminated").length;
        const suspended = data.filter((e) => e.employee_status === "Suspended").length;

        setCounts({
          active,
          onLeave,
          terminated,
          suspended,
          total: data.length
        });
      } catch (error) {
        console.error("Failed to fetch employee counts:", error);
      }
    };

    fetchCounts();
  }, [companyId, session]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
      <Card className="bg-blue-50 border-blue-100">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-blue-600 font-medium">Total Employees</p>
            <p className="text-2xl font-bold text-blue-700">{counts.total}</p>
          </div>
          <Users className="h-8 w-8 text-blue-500" />
        </CardContent>
      </Card>

      <Card className="bg-emerald-50 border-emerald-100">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-emerald-600 font-medium">Active</p>
            <p className="text-2xl font-bold text-emerald-700">{counts.active}</p>
          </div>
          <UserCheck className="h-8 w-8 text-emerald-500" />
        </CardContent>
      </Card>

      <Card className="bg-amber-50 border-amber-100">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-amber-600 font-medium">On Leave</p>
            <p className="text-2xl font-bold text-amber-700">{counts.onLeave}</p>
          </div>
          <Coffee className="h-8 w-8 text-amber-500" />
        </CardContent>
      </Card>

      <Card className="bg-orange-50 border-orange-100">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-orange-600 font-medium">Suspended</p>
            <p className="text-2xl font-bold text-orange-700">{counts.suspended}</p>
          </div>
          <UserX className="h-8 w-8 text-orange-500" />
        </CardContent>
      </Card>

      <Card className="bg-rose-50 border-rose-100">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-rose-600 font-medium">Terminated</p>
            <p className="text-2xl font-bold text-rose-700">{counts.terminated}</p>
          </div>
          <UserX className="h-8 w-8 text-rose-500" />
        </CardContent>
      </Card>
    </div>
  );
}