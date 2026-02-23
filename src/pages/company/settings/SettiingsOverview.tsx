import { useState, useEffect, type SetStateAction} from "react";
import { useParams } from "react-router-dom";
import {
  Building2,
  Users,
  Briefcase,
  Calendar,
  Save,
  AlertCircle,
} from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  getCompanySettingsSummary,
  getCompanySettings,
  updateCompanySettings,
  type CompanySettings,
  type CompanySettingsUpdate,
  type CompanySettingsSummary,
} from "@/hooks/companySettingsService";
import { CompanyProfileForm } from "@/components/dashboard/CompanyProfileForm";
import { CompanyStatutoryForm } from "@/components/company/CompanyStatutoryForm";
import { CompanyBankingForm } from "@/components/company/CompanyBankingForm";
import { CompanyDangerZone } from "@/components/company/CompanyDangerZone";
import { type CompanyFormData } from "@/components/dashboard/CompanyProfileForm";

export default function CompanySettingsOverviewPage() {
  const { companyId } = useParams();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [summary, setSummary] = useState<CompanySettingsSummary | null>(null);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [summaryData, settingsData] = await Promise.all([
          getCompanySettingsSummary(companyId as string),
          getCompanySettings(companyId as string),
        ]);
        setSummary(summaryData);
        setSettings(settingsData);
        setLogoPreview(settingsData.logo_url);
      } catch (error) {
        toast.error("Failed to load company settings");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (companyId) {
      loadData();
    }
  }, [companyId]);

  // Transform CompanySettings to CompanyFormData for CompanyProfileForm
  const getCompanyFormData = (
    settings: CompanySettings | null,
  ): CompanyFormData => {
    return {
      business_name: settings?.business_name || "",
      industry: settings?.industry || "",
      kra_pin: settings?.kra_pin || "",
      company_email: settings?.company_email || "",
      company_phone: settings?.company_phone || "",
      location: settings?.location || "",
      nssf_employer: settings?.nssf_employer || "",
      shif_employer: settings?.shif_employer || "",
      housing_levy_employer: settings?.housing_levy_employer || "",
      helb_employer: settings?.helb_employer || "",
      bank_name: settings?.bank_name || "",
      branch_name: settings?.branch_name || "",
      account_name: settings?.account_name || "",
      account_number: settings?.account_number || "",
    };
  };

  // Transform CompanyFormData back to CompanySettingsUpdate
  const transformFormDataToSettings = (
    formData: CompanyFormData,
  ): CompanySettingsUpdate => {
    return {
      business_name: formData.business_name,
      industry: formData.industry || null,
      kra_pin: formData.kra_pin || null,
      company_email: formData.company_email || null,
      company_phone: formData.company_phone || null,
      location: formData.location || null,
      nssf_employer: formData.nssf_employer || null,
      shif_employer: formData.shif_employer || null,
      housing_levy_employer: formData.housing_levy_employer || null,
      helb_employer: formData.helb_employer || null,
      bank_name: formData.bank_name || null,
      branch_name: formData.branch_name || null,
      account_name: formData.account_name || null,
      account_number: formData.account_number || null,
    };
  };

  const handleProfileFormChange = (
    updater: SetStateAction<CompanyFormData>,
  ) => {
    setSettings((prev) => {
      if (!prev) return prev;
      const currentFormData = getCompanyFormData(prev);
      const newFormData =
        typeof updater === "function" ? updater(currentFormData) : updater;
      const updatedSettings = {
        ...prev,
        ...transformFormDataToSettings(newFormData),
      };
      return updatedSettings;
    });
    setHasChanges(true);
  };

  const handleSettingsChange = (
    field: keyof CompanySettings,
    value: string,
  ) => {
    setSettings((prev) => (prev ? { ...prev, [field]: value || null } : null));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      const updated = await updateCompanySettings(
        companyId as string,
        settings,
        logoFile,
      );
      setSettings(updated);
      setLogoPreview(updated.logo_url);
      setLogoFile(null);
      setHasChanges(false);
      toast.success("Company settings updated successfully");
    } catch (error) {
      toast.error("Failed to update settings");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <SettingsSkeleton />;
  }

  if (!summary || !settings) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-slate-900">
          Company not found
        </h3>
        <p className="text-sm text-slate-500 mt-2">
          The company settings could not be loaded.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Minimal Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Company Settings
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your company profile, compliance, and banking information
          </p>
        </div>
        <div className="flex items-center gap-3">
          {hasChanges && (
            <Badge
              variant="outline"
              className="bg-amber-50 text-amber-700 border-amber-200 text-xs font-medium"
            >
              Unsaved changes
            </Badge>
          )}
          <Button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="bg-[#1F3A8A] hover:bg-[#162a63] text-white text-sm px-4 py-2 h-9"
          >
            {saving ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Saving...</span>
              </div>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      <Separator className="bg-slate-100" />

      {/* Company Header Card - Minimal */}
      <div className="flex items-start gap-6 p-6 bg-white border border-slate-300 rounded-lg">
        <Avatar className="h-16 w-16 rounded-lg border border-slate-100">
          <AvatarImage src={logoPreview || undefined} />
          <AvatarFallback className="rounded-lg bg-slate-50">
            <Building2 className="h-6 w-6 text-slate-400" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-xs text-slate-400 mb-1">Business Name</p>
            <p className="text-sm font-medium text-slate-900">
              {summary.business_name}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">KRA PIN</p>
            <p className="text-sm font-medium text-slate-900">
              {summary.kra_pin || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">Status</p>
            <Badge
              variant={summary.status === "ACTIVE" ? "default" : "secondary"}
              className={`${
                summary.status === "ACTIVE"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-slate-50 text-slate-600 border-slate-200"
              } font-medium`}
            >
              {summary.status}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">Member Since</p>
            <p className="text-sm font-medium text-slate-900">
              {new Date(summary.created_at).toLocaleDateString("en-KE", {
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats - Minimal Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-300 rounded-lg p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-md">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Total Employees</p>
              <p className="text-lg font-semibold text-slate-900">
                {summary.employees_count}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-300 rounded-lg p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-md">
              <Briefcase className="h-4 w-4 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Departments</p>
              <p className="text-lg font-semibold text-slate-900">
                {summary.departments_count}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-300 rounded-lg p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-md">
              <Calendar className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Last Updated</p>
              <p className="text-sm font-medium text-slate-900">
                {new Date(
                  settings.updated_at || settings.created_at,
                ).toLocaleDateString("en-KE", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Tabs - Minimal Design */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="border-b border-slate-300">
          <TabsList className="h-auto bg-transparent p-0 gap-6">
            {["Overview", "Compliance", "Banking", "Advanced"].map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab.toLowerCase()}
                className="px-1 py-3 data-[state=active]:text-slate-900 text-slate-500 text-sm font-normal shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-[#1F3A8A] data-[state=active]:bg-transparent transition-none"
              >
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="mt-6">
          <TabsContent value="overview" className="space-y-6">
            <div className="bg-white border border-slate-300 rounded-lg p-6">
              <div className="mb-6">
                <h3 className="text-base font-medium text-slate-900">
                  Company Profile
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Basic information about your company
                </p>
              </div>
              <CompanyProfileForm
                data={getCompanyFormData(settings)}
                setData={handleProfileFormChange}
                setLogoFile={setLogoFile}
                logoPreview={logoPreview}
                setLogoPreview={setLogoPreview}
              />
            </div>
          </TabsContent>

          <TabsContent value="compliance" className="space-y-6">
            <div className="bg-white border border-slate-300 rounded-lg p-6">
              <div className="mb-6">
                <h3 className="text-base font-medium text-slate-900">
                  Statutory & Compliance
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Tax and statutory registration details
                </p>
              </div>
              <CompanyStatutoryForm
                data={settings}
                onChange={handleSettingsChange}
              />
            </div>
          </TabsContent>

          <TabsContent value="banking" className="space-y-6">
            <div className="bg-white border border-slate-300 rounded-lg p-6">
              <div className="mb-6">
                <h3 className="text-base font-medium text-slate-900">
                  Banking Details
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Company bank account information for payroll
                </p>
              </div>
              <CompanyBankingForm
                data={settings}
                onChange={handleSettingsChange}
              />
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6">
            <CompanyDangerZone
              companyId={companyId as string}
              companyName={settings.business_name}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <Skeleton className="h-9 w-24" />
      </div>
      <Separator />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white border border-slate-100 rounded-lg p-5"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-md" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-12" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
