// src/components/company/payroll/reports/InternalReports.tsx
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  Receipt, 
  Calculator, 
  Eye, 
  Download, 
  Loader2,
} from "lucide-react";

type PayrollRun = {
  id: string;
  payroll_number: string;
  payroll_month: string;
  payroll_year: number;
};

type InternalReportsProps = {
  selectedRun: PayrollRun | null;
  downloading: string | null;
  onPreview: (report: { type: string, label: string }) => void;
  onDownload: (reportType: string) => void;
};

const INTERNAL_REPORTS = [
  { type: "payroll-summary", label: "Payroll Summary", icon: BarChart3, format: "Excel" },
  { type: "allowance-report", label: "Allowance Report", icon: Receipt, format: "Excel" },
  { type: "deduction-report", label: "Deduction Report", icon: Calculator, format: "Excel" },
];

export default function InternalReports({ 
  selectedRun, 
  downloading, 
  onPreview, 
  onDownload 
}: InternalReportsProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-gray-900">
            Internal Reports
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Detailed payroll analysis and internal management reports
          </p>
        </div>
        <Badge 
          variant="outline" 
          className="border-[#1F3A8A]/30 text-[#1F3A8A] bg-[#1F3A8A]/5 rounded-md px-3 py-1 font-medium"
        >
          {INTERNAL_REPORTS.length} Reports
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {INTERNAL_REPORTS.map((report) => {
          const Icon = report.icon;
          const isDownloading = downloading === report.type;
          
          return (
            <div
              key={report.type}
              className="group border rounded-sm shadow-none border-slate-300 bg-white hover:border-[#1F3A8A] transition-colors duration-200 p-5"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-gray-50 border border-gray-200">
                  <Icon className="h-5 w-5 text-gray-600 group-hover:text-[#1F3A8A]" />
                </div>
                <Badge variant="outline" className="text-xs bg-gray-50 border-gray-200">
                  {report.format}
                </Badge>
              </div>
              
              <h3 className="font-medium text-gray-900 mb-1">{report.label}</h3>
              <p className="text-xs text-gray-500 mb-4">
                {selectedRun?.payroll_number}
              </p>
              
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onPreview(report)}
                  disabled={!selectedRun || isDownloading}
                  className="flex-1 border-gray-300 hover:bg-gray-50 hover:border-gray-400 rounded-sm shadow-none cursor-pointer h-9"
                >
                  <Eye className="h-3.5 w-3.5 mr-2" />
                  Preview
                </Button>
                <Button
                  size="sm"
                  onClick={() => onDownload(report.type)}
                  disabled={!selectedRun || isDownloading}
                  className="flex-1 bg-[#1F3A8A] hover:bg-[#16306b] text-white rounded-sm shadow-none cursor-pointer h-9"
                >
                  {isDownloading ? (
                    <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5 mr-2" />
                  )}
                  Download
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {!selectedRun && (
        <div className="bg-gray-50 border border-gray-200 p-6 text-center">
          <p className="text-sm text-gray-500">
            Select a payroll run to enable internal reports
          </p>
        </div>
      )}
    </div>
  );
}