import { Outlet, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import SettingsSidebar from "@/components/company/layout/SettingsSidebar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function SettingsLayout() {
  const { companyId } = useParams();
  const navigate = useNavigate();

  return (
    <section className="flex h-full bg-gray-50 overflow-hidden">
      {/* Sidebar (sticky, non-scrolling) */}
      <SettingsSidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 h-full  overflow-hidden">
        {/* Header */}
        <header className="shrink-0 px-6 pt-5 border-slate-200 ">
          <div className="flex items-center gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 cursor-pointer"
                  onClick={() => navigate(`/company/${companyId}/modules`)}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                  <p>Back</p>
                </TooltipContent>
            </Tooltip>
          </div>
        </header>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6">
          <Outlet />
        </div>
      </div>
    </section>
  );
}
