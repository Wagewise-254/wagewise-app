import { useParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { JobTitlesTable } from "@/components/dashboard/JobTitlesTable";

export default function JobTitlesSettings() {
  const { companyId } = useParams();

  return (
    <div className="h-full w-full">
      <Card className="bg-white dark:bg-background shadow-none flex flex-col h-full">
        <CardHeader className="pt-6 px-6 pb-4 shrink-0 border-b border-slate-100">
          <CardTitle className="text-xl font-bold">
            Job Titles
          </CardTitle>
          <CardDescription className="text-xs">
            Manage job roles, positions, and reporting structures
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 flex-1 overflow-y-auto min-h-0 mb-2">
          <JobTitlesTable companyId={companyId!} />
        </CardContent>
      </Card>
    </div>
  );
}