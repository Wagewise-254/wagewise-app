import { toast } from "sonner";
import { CheckCircle, XCircle, Info } from "lucide-react";
import React from "react";

export type ToastType = "success" | "error" | "info";

const ACCENT_COLOR = "#7F5EFD"; // Purple accent
const BG_COLOR = "#ffffff"; // Light background

// ✨ Enhanced Toast Utility (supports icon-only)
export const showToast = (
  type: ToastType,
  title?: string,
  description?: string
) => {
  const baseStyle = {
    border: `1px solid ${ACCENT_COLOR}`,
    background: BG_COLOR,
    color: ACCENT_COLOR,
    padding: "14px 18px",
    borderRadius: "12px",
    fontSize: "15px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    minWidth: title || description ? "300px" : "auto",
    boxShadow:
      "0 4px 10px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.08)",
  };

  const renderContent = (icon: React.ReactNode) => {
    // If no title or description, show icon only
    if (!title && !description) {
      return <div className="flex items-center justify-center">{icon}</div>;
    }

    return (
      <div className="flex items-start gap-3">
        {icon}
        <div className="flex flex-col text-left">
          {title && <span className="font-semibold text-gray-900">{title}</span>}
          {description && (
            <span className="text-sm text-gray-600 mt-0.5">{description}</span>
          )}
        </div>
      </div>
    );
  };

  switch (type) {
    case "success":
      toast(renderContent(<CheckCircle size={20} color={ACCENT_COLOR} />), {
        style: baseStyle,
      });
      break;

    case "error":
      toast(renderContent(<XCircle size={20} color="#ef4444" />), {
        style: { ...baseStyle, border: "1px solid #ef4444" },
      });
      break;

    case "info":
    default:
      toast(renderContent(<Info size={20} color={ACCENT_COLOR} />), {
        style: baseStyle,
      });
      break;
  }
};
