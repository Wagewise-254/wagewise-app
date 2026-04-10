// src/pages/NotFound.tsx
import { useNavigate } from "react-router-dom";
import { 
  FileQuestion, 
  Home, 
  ArrowLeft, 
  Search, 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full border-slate-200 shadow-none bg-white">
        <CardContent className="p-8 md:p-12">
          <div className="text-center space-y-8">
            {/* Large 404 Icon */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 bg-blue-50 rounded-full animate-pulse" />
              </div>
              <div className="relative flex justify-center">
                <FileQuestion className="h-24 w-24 text-[#1F3A8A] stroke-1" />
              </div>
            </div>

            {/* Error Message */}
            <div className="space-y-3">
              <h1 className="text-7xl font-bold text-slate-900">404</h1>
              <h2 className="text-2xl font-semibold text-slate-800">
                Page Not Found
              </h2>
              <p className="text-slate-500 max-w-md mx-auto">
                The page you're looking for doesn't exist or has been moved to another location.
              </p>
            </div>

            <Separator className="bg-slate-100" />

            {/* Navigation Options */}
            <div className="space-y-4">
              <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">
                Where would you like to go?
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button
                  onClick={() => navigate("/dashboard")}
                  className="bg-[#1F3A8A] hover:bg-[#162a63] text-white h-12"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Dashboard Home
                </Button>
                
                <Button
                  onClick={() => navigate(-1)}
                  variant="outline"
                  className="border-slate-200 hover:bg-slate-50 h-12"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Go Back
                </Button>
              </div>

            </div>

            {/* Search Help */}
            <div className="bg-slate-50 rounded-lg p-4 mt-6">
              <div className="flex items-center gap-3 text-left">
                <div className="p-2 bg-white rounded-full">
                  <Search className="h-4 w-4 text-slate-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700">
                    Can't find what you're looking for?
                  </p>
                  <p className="text-xs text-slate-500">
                    Please contact support for assistance
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}