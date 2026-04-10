import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useParams } from "react-router-dom";
import { DepartmentsTable } from "@/components/dashboard/DepartmentsTable";

export default function DepartmentsPage() {
  const { companyId } = useParams<{ companyId: string }>();

  return (
    <Card className="bg-white border border-slate-200 rounded-xl">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Departments</CardTitle>
        <CardDescription>
          Create and manage departments in your organization.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <DepartmentsTable companyId={companyId!} />
      </CardContent>
    </Card>
  );
}