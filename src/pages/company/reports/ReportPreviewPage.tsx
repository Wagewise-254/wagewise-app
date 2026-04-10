// src/pages/company/payroll/ReportPreviewPage.tsx

import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  FileText, 
  FileSpreadsheet, 
  FileCog,
  Table,
  Download
} from "lucide-react";
import * as XLSX from "xlsx";
import { useEffect, useState } from "react";

const ReportPreviewPage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const url = params.get("file");
  const name = params.get("name");
  const type = params.get("type");

  const [csvData, setCsvData] = useState<{ headers: string[]; rows: string[][] }>({ headers: [], rows: [] });
  const [xlsxSheets, setXlsxSheets] = useState<{ name: string; html: string }[]>([]);
  const [activeSheet, setActiveSheet] = useState(0);
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

  // Handle CSV preview with table formatting
  useEffect(() => {
    if (type === "csv" && url) {
      setLoading(true);
      fetch(url)
        .then((res) => res.text())
        .then((txt) => {
          // Parse CSV to array
          const lines = txt.trim().split('\n');
          const headers = lines[0]?.split(',').map(h => h.replace(/["']/g, '').trim()) || [];
          const rows = lines.slice(1).map(line => {
            // Handle quoted values properly
            const values: string[] = [];
            let currentValue = '';
            let inQuotes = false;
            
            for (let i = 0; i < line.length; i++) {
              const char = line[i];
              if (char === '"') {
                inQuotes = !inQuotes;
              } else if (char === ',' && !inQuotes) {
                values.push(currentValue.replace(/["']/g, '').trim());
                currentValue = '';
              } else {
                currentValue += char;
              }
            }
            values.push(currentValue.replace(/["']/g, '').trim());
            return values;
          });
          
          setCsvData({ headers, rows });
          setLoading(false);
        })
        .catch(() => {
          setCsvData({ headers: [], rows: [] });
          setLoading(false);
        });
    }
  }, [url, type]);

  // Handle XLSX preview with multiple sheets
  useEffect(() => {
    if (type === "xlsx" && url) {
      setLoading(true);
      fetch(url)
        .then((res) => res.arrayBuffer())
        .then((buffer) => {
          const wb = XLSX.read(buffer, { type: "array" });
          const sheets = wb.SheetNames.map(sheetName => {
            const sheet = wb.Sheets[sheetName];
             // Convert to HTML without row numbers
          const html = XLSX.utils.sheet_to_html(sheet, { 
            header: "",  // Use string instead of number
            footer: "",
            editable: false
            });
            return { name: sheetName, html };
          });
          setXlsxSheets(sheets);
          setActiveSheet(0);
          setLoading(false);
        })
        .catch(() => {
          setXlsxSheets([]);
          setLoading(false);
        });
    }
  }, [url, type]);

  const handleDownload = async () => {
    if (!url) return;
    
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      // Extract filename from URL or use the name prop
      let filename = name || 'report';
      if (type === 'csv') filename += '.csv';
      else if (type === 'xlsx') filename += '.xlsx';
      else if (type === 'pdf') filename += '.pdf';
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Card className="rounded-none border border-gray-200 shadow-none">
        <CardHeader className="pb-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
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
            
            {/* Download Button */}
            <Button
              onClick={handleDownload}
              className="bg-[#1F3A8A] hover:bg-[#16306b] text-white rounded-sm"
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
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

          {/* CSV Preview with Table */}
          {type === "csv" && !loading && (
            <div className="border border-gray-200 bg-white">
              <div className="bg-gray-100 border-b border-gray-200 px-4 py-2">
                <span className="text-sm font-medium text-gray-700">CSV Content Preview</span>
                <span className="text-xs text-gray-500 ml-2">
                  ({csvData.rows.length} rows)
                </span>
              </div>
              <div className="overflow-auto h-[70vh]">
                {csvData.headers.length > 0 ? (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        {csvData.headers.map((header, idx) => (
                          <th
                            key={idx}
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {csvData.rows.map((row, rowIdx) => (
                        <tr key={rowIdx} className="hover:bg-gray-50">
                          {row.map((cell, cellIdx) => (
                            <td
                              key={cellIdx}
                              className="px-4 py-2 text-sm text-gray-900 border-r border-gray-100 last:border-r-0"
                            >
                              {cell || '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    No data to display
                  </div>
                )}
              </div>
            </div>
          )}

          {/* XLSX Preview with Sheet Tabs */}
          {type === "xlsx" && !loading && (
            <div className="border border-gray-200 bg-white">
              <div className="bg-gray-100 border-b border-gray-200 px-4 py-2">
                <span className="text-sm font-medium text-gray-700">Spreadsheet Preview</span>
                <span className="text-xs text-gray-500 ml-2">
                  ({xlsxSheets.length} sheets)
                </span>
              </div>
              
              {/* Sheet Tabs */}
              {xlsxSheets.length > 0 && (
                <div className="border-b border-gray-200 bg-gray-50 px-4">
                  <div className="flex gap-1 overflow-x-auto">
                    {xlsxSheets.map((sheet, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveSheet(idx)}
                        className={`
                          px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap
                          ${activeSheet === idx 
                            ? 'bg-white text-[#1F3A8A] border-t border-x border-gray-200 -mb-px' 
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                          }
                        `}
                      >
                        <div className="flex items-center gap-2">
                          <Table className="h-3.5 w-3.5" />
                          {sheet.name}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Sheet Content */}
              <div className="overflow-auto h-[70vh]">
                {xlsxSheets.length > 0 && (
                  <div
                    className="p-4 [&_table]:min-w-full [&_table]:border-collapse [&_table]:border [&_table]:border-gray-200 
                    [&_th]:bg-gray-50 [&_th]:px-4 [&_th]:py-2 [&_th]:text-left [&_th]:text-sm [&_th]:font-medium 
                    [&_th]:text-gray-700 [&_th]:border [&_th]:border-gray-200 [&_th]:sticky [&_th]:top-0
                    [&_td]:px-4 [&_td]:py-2 [&_td]:text-sm [&_td]:text-gray-900 [&_td]:border [&_td]:border-gray-200
                    [&_tr:hover]:bg-gray-50"
                    dangerouslySetInnerHTML={{ __html: xlsxSheets[activeSheet]?.html || "Loading spreadsheet..." }}
                  />
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportPreviewPage;