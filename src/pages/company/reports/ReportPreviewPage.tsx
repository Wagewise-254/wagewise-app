// src/pages/company/payroll/ReportPreviewPage.tsx

import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, FileSpreadsheet, FileCog } from "lucide-react";
import * as XLSX from "xlsx";
import { useEffect, useState } from "react";

const ReportPreviewPage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const url = params.get("file");
  const name = params.get("name");
  const type = params.get("type");

  const [csvText, setCsvText] = useState("");
  const [xlsxHtml, setXlsxHtml] = useState("");
  const [loading, setLoading] = useState(true);

  const getFileIcon = () => {
    switch (type) {
      case "pdf":
        return <FileText className="h-5 w-5" />;
      case "csv":
        return <FileCog className="h-5 w-5" />;
      case "xlsx":
        return <FileSpreadsheet className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getFileTypeLabel = () => {
    switch (type) {
      case "pdf":
        return "PDF Document";
      case "csv":
        return "CSV File";
      case "xlsx":
        return "Excel Spreadsheet";
      default:
        return "File";
    }
  };

  // Handle CSV preview
  useEffect(() => {
    if (type === "csv" && url) {
      setLoading(true);
      fetch(url)
        .then((res) => res.text())
        .then((txt) => {
          setCsvText(txt);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [url, type]);

  // Handle XLSX preview
  useEffect(() => {
    if (type === "xlsx" && url) {
      setLoading(true);
      fetch(url)
        .then((res) => res.arrayBuffer())
        .then((buffer) => {
          const wb = XLSX.read(buffer, { type: "array" });
          const sheet = wb.Sheets[wb.SheetNames[0]];
          const html = XLSX.utils.sheet_to_html(sheet);
          setXlsxHtml(html);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [url, type]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Card className="rounded-none border border-gray-200 shadow-none">
        <CardHeader className="pb-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="h-8 w-8 text-gray-500 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-50 border border-gray-200">
                {getFileIcon()}
              </div>
              <div>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  {name}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge 
                    variant="outline" 
                    className="border-gray-300 text-gray-700 bg-gray-50 rounded-none text-xs"
                  >
                    {getFileTypeLabel()}
                  </Badge>
                  <span className="text-xs text-gray-500">•</span>
                  <span className="text-xs text-gray-500">Preview Mode</span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="text-gray-500">Loading preview...</div>
            </div>
          )}

          {/* PDF Preview */}
          {type === "pdf" && url && !loading && (
            <iframe
              src={url}
              className="w-full h-[70vh] border border-gray-200"
              title="PDF Preview"
            />
          )}

          {/* CSV Preview */}
          {type === "csv" && !loading && (
            <div className="border border-gray-200 bg-gray-50">
              <div className="bg-gray-100 border-b border-gray-200 px-4 py-2">
                <span className="text-sm font-medium text-gray-700">CSV Content</span>
              </div>
              <pre className="p-4 overflow-auto h-[70vh] text-sm font-mono text-gray-700">
                {csvText || "No content to display"}
              </pre>
            </div>
          )}

          {/* XLSX Preview */}
          {type === "xlsx" && !loading && (
            <div className="border border-gray-200 bg-white">
              <div className="bg-gray-100 border-b border-gray-200 px-4 py-2">
                <span className="text-sm font-medium text-gray-700">Spreadsheet Preview</span>
              </div>
              <div
                className="p-4 overflow-auto h-[70vh] [&_table]:border [&_table]:border-gray-200 [&_th]:bg-gray-50 [&_th]:px-4 [&_th]:py-2 [&_th]:text-left [&_th]:text-sm [&_th]:font-medium [&_th]:text-gray-700 [&_td]:border [&_td]:border-gray-200 [&_td]:px-4 [&_td]:py-2 [&_td]:text-sm"
                dangerouslySetInnerHTML={{ __html: xlsxHtml || "Loading spreadsheet..." }}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportPreviewPage;