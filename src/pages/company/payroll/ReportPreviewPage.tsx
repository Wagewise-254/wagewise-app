import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";
import { useEffect, useState } from "react";

const ReportPreviewPage = () => {
  const [params] = useSearchParams();
  const url = params.get("file");
  const name = params.get("name");
  const type = params.get("type");

  const [csvText, setCsvText] = useState("");
  const [xlsxHtml, setXlsxHtml] = useState("");

  // Handle CSV preview
  useEffect(() => {
    if (type === "csv" && url) {
      fetch(url)
        .then((res) => res.text())
        .then((txt) => setCsvText(txt));
    }
  }, [url, type]);

  // Handle XLSX preview
  useEffect(() => {
    if (type === "xlsx" && url) {
      fetch(url)
        .then((res) => res.arrayBuffer())
        .then((buffer) => {
          const wb = XLSX.read(buffer, { type: "array" });
          const sheet = wb.Sheets[wb.SheetNames[0]];
          const html = XLSX.utils.sheet_to_html(sheet);
          setXlsxHtml(html);
        });
    }
  }, [url, type]);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Preview: {name}</h1>

      {/* PDF Preview */}
      {type === "pdf" && url && (
        <iframe
          src={url}
          className="w-full h-[80vh] border rounded"
          title="PDF Preview"
        />
      )}

      {/* CSV Preview */}
      {type === "csv" && (
        <pre className="bg-gray-50 p-4 border rounded overflow-auto h-[80vh] text-sm">
          {csvText || "Loading CSV..."}
        </pre>
      )}

      {/* XLSX Preview */}
      {type === "xlsx" && (
        <div
          className="bg-white p-4 border rounded overflow-auto h-[80vh] text-sm"
          dangerouslySetInnerHTML={{ __html: xlsxHtml || "Loading spreadsheet..." }}
        />
      )}

      <Button
        onClick={() => window.history.back()}
        className="bg-gray-700 hover:bg-gray-600"
      >
        Go Back
      </Button>
    </div>
  );
};

export default ReportPreviewPage;
