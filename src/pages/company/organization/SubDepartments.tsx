import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "@/config";
import { useAuthStore } from "@/stores/authStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { SubDepartmentsTable } from "@/components/dashboard/SubDepartmentsTable";

export default function SubDepartmentsPage() {
  const { companyId } = useParams<{ companyId: string }>();
   const token = useAuthStore.getState().session?.access_token;
  const [departments, setDepartments] = useState<
    { id: string; name: string }[]
  >([]);

   const fetchDepartments = useCallback(async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/company/${companyId}/departments`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setDepartments(res.data);
    } catch (err) {
      toast.error("Failed to load departments");
    } finally {
      // setLoading(false);
    }
  }, [companyId, token]);

   useEffect(() => {
    if (companyId) fetchDepartments();
  }, [companyId, fetchDepartments]);

  return (
    <Card className="bg-white border border-slate-200 rounded-xl">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Sub-departments & Units</CardTitle>
        <CardDescription>
          Define units or teams within departments.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <SubDepartmentsTable companyId={companyId!} departments={departments} />
      </CardContent>
    </Card>
  );
}