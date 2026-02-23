// src/pages/dashboard/RootDashboard.tsx
import { useState, useMemo } from 'react';
import {
  Clock,
  Ban,
  Building2,
  PlusCircle,
  Mail,
  Plus,
  SearchX,
  Search,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import EmptyState from "@/components/common/emptyState";
import { CompanyCard } from '@/components/dashboard/CompanyCard';
import OfflineBanner from '@/components/common/offlinebanner';
import { Input } from "@/components/ui/input";

const RootDashboard = () => {
 const { activeWorkspace, isWorkspacePending, isWorkspaceSuspended, loading } =
    useAuthStore();
  const { companies: companyMemberships } = useAuthStore();

   const companies = useMemo(() => {
    return companyMemberships.map((m) => m.companies);
  }, [companyMemberships]);

  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const filteredCompanies = useMemo(() => {
    return companies.filter(
      (company) =>
        company.business_name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        company.industry?.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [companies, searchTerm]);

   if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center mb-6">
          <div className="h-10 w-64 bg-gray-200 animate-pulse rounded-xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card
              key={i}
              className="h-40 bg-white/40 backdrop-blur-md border-white/40 animate-pulse rounded-xl"
            >
              <div className="p-4 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-gray-200 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-6 bg-gray-200 rounded-full w-20 mt-6" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // No Workspace assigned at all
  if (!activeWorkspace) {
    return (
      <EmptyState
        icon={Building2}
        title="No Workspace Found"
        description="It looks like you aren't part of a workspace yet. Please contact your administrator to get started."
      />
    );
  }

  // Workspace is Pending Review
  if (isWorkspacePending()) {
    return (
      <EmptyState
        icon={Clock}
        variant="warning"
        title="Pending Approval"
        description="Your workspace is currently under review by our team. We'll send you an email as soon as you're ready to go!"
      />
    );
  }
  // 3. Workspace is Suspended
  if (isWorkspaceSuspended()) {
    return (
      <EmptyState
        icon={Ban}
        variant="danger"
        title="Workspace Suspended"
        description="Access to this workspace has been restricted. If you believe this is a mistake, please reach out to our support team."
        actionLabel="Contact Support"
        actionIcon={Mail}
        onAction={() => window.open("mailto:wagedesk@gmail.com")}
      />
    );
  }

  if (companies.length === 0) {
    return (
      <EmptyState
        icon={PlusCircle}
        title="Welcome to your Workspace"
        description="Now, let's create your first company to start managing your payroll."
        actionLabel="Set up company"
        onAction={() => navigate("/company-setup")}
      />
    );
  }

  //Show Grid if companies exis
  return (
    <div className="container mx-auto px-4 py-6">
      <OfflineBanner />

      <div className="relative w-full max-w-sm mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search for company"
          className=" pl-9 h-10 bg-white border-slate-300 shadow-none focus-visible:ring-1 focus-visible:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {/*add compny Card */}
        <Link to={"/company-setup"}>
          <Card className="group relative overflow-hidden h-40 bg-white/40 backdrop-blur-lg border-2 border-dashed border-gray-300 hover:border-purple-400 hover:bg-white/60 transition-all duration-300 rounded-xl flex items-center justify-center">
            <CardContent className="flex flex-col items-center p-0">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600 group-hover:scale-110 transition-transform">
                <Plus className="h-6 w-6" />
              </div>
              <span className="mt-3 font-semibold text-gray-600">
                Add Company
              </span>
            </CardContent>
          </Card>
        </Link>

        {/* List Companies */}
        {filteredCompanies.map((company) => (
          <CompanyCard key={company.id} company={company} />
        ))}

        {/* Glass Empty Search Result */}
        {filteredCompanies.length === 0 && searchTerm !== "" && (
          <div className="col-span-1 sm:col-span-2 md:col-span-2 lg:col-span-3 h-40 flex items-center px-8 bg-white/30 backdrop-blur-sm rounded-xl border border-white/50 border-dashed">
            <div className="flex items-center space-x-4 text-gray-500">
              <SearchX className="h-8 w-8" />
              <div>
                <p className="font-medium">
                  No matches found for "{searchTerm}"
                </p>
                <p className="text-sm opacity-70">
                  Try a different name or industry.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RootDashboard;
