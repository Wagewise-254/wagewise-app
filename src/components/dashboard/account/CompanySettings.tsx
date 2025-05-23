// src/components/dashboard/account/CompanySettings.tsx

import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import axios from 'axios';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import { API_BASE_URL } from '@/config';
import useAuthStore from '@/store/authStore';

// Define the form data structure based on your company_details table
interface CompanyFormData {
    business_name: string;
    business_type: string;
    industry: string;
    kra_pin: string;
    reg_number: string;
    company_email: string;
    company_phone: string;
    address: string;
    county: string;
    // sub_county: string; // Removed sub_county as per onboarding_dialog_functional_v3
    payroll_frequency: string;
    default_work_days: number;
    default_work_hours: number;
    nssf_scheme: string;
    shif_rate_option: string; // Using shif_rate_option
    // logo?: string; // Optional
}

const CompanySettings: React.FC = () => {
  const { accessToken } = useAuthStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset, // To set form values after fetching
    control, // For controlled components like Select
  } = useForm<CompanyFormData>();

  // --- Fetch Company Details on Mount ---
  useEffect(() => {
    const fetchCompanyDetails = async () => {
      if (!accessToken) {
        setFetchError("Authentication token missing.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setFetchError(null);

      try {
        const response = await axios.get(`${API_BASE_URL}/company`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (response.data.companyDetails) {
          // Set form values with fetched data
          reset(response.data.companyDetails);
        } else {
          // If no company details found, form will remain with default values
          toast.info("No company details found. Please fill in the form.");
        }
      } catch (err: unknown) {
        console.error("Error fetching company details for settings:", err);
        if (axios.isAxiosError(err) && err.response && typeof err.response.data === 'object') {
          const backendError = err.response.data as { error?: string; message?: string };
          setFetchError(backendError.error || backendError.message || 'Failed to fetch company details.');
        } else {
          setFetchError('An unexpected error occurred while fetching company details.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanyDetails();
  }, [accessToken, reset]); // Add reset to dependency array

  // --- Handle Form Submission (Update Company Details) ---
  const onSubmit: SubmitHandler<CompanyFormData> = async (data) => {
    setIsSubmitting(true);
    setSubmitError(null);

    if (!accessToken) {
      setSubmitError("Authentication token missing. Please log in again.");
      toast.error("Authentication required.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/company`, data, { // Reuse POST endpoint for update
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      toast.success(response.data.message || "Company details updated successfully!");
      setSubmitError(null);
      // Optionally re-fetch to ensure consistency, though reset should handle it
      // reset(response.data.companyDetails);

    } catch (err: unknown) {
      console.error("Error updating company details:", err);
      if (axios.isAxiosError(err) && err.response && typeof err.response.data === 'object') {
        const backendError = err.response.data as { error?: string; message?: string };
        setSubmitError(backendError.error || backendError.message || 'Failed to update company details.');
        toast.error(backendError.error || backendError.message || 'Failed to update company details.');
      } else {
        setSubmitError('An unexpected error occurred while updating company details.');
        toast.error('An unexpected error occurred while updating company details.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
        <p className="ml-2 text-gray-600">Loading company details...</p>
      </div>
    );
  }

  if (fetchError) {
    return <p className="text-red-500 text-center p-4">{fetchError}</p>;
  }

  return (
    <Card className="p-6">
      <CardHeader>
        <CardTitle>Company Information</CardTitle>
        <p className="text-gray-600">View and update your company's core details.</p>
      </CardHeader>
      <CardContent>
        {submitError && <p className="text-red-500 text-sm mb-4">{submitError}</p>}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Business Information */}
          <h3 className="text-lg font-semibold mt-6 mb-2">Business Information</h3>
          <div>
            <Label htmlFor="business_name">Business Name</Label>
            <Input id="business_name" {...register("business_name", { required: "Business Name is required" })} />
            {errors.business_name && <p className="text-red-500 text-sm mt-1">{errors.business_name.message}</p>}
          </div>
          <div>
            <Label htmlFor="business_type">Business Type</Label>
            <Controller
              name="business_type"
              control={control}
              rules={{ required: "Business Type is required" }}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select business type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sole_proprietor">Sole Proprietor</SelectItem>
                    <SelectItem value="partnership">Partnership</SelectItem>
                    <SelectItem value="limited_company">Limited Company</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.business_type && <p className="text-red-500 text-sm mt-1">{errors.business_type.message}</p>}
          </div>
          <div>
            <Label htmlFor="industry">Industry</Label>
            <Controller
              name="industry"
              control={control}
              rules={{ required: "Industry is required" }}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.industry && <p className="text-red-500 text-sm mt-1">{errors.industry.message}</p>}
          </div>
          <div>
            <Label htmlFor="kra_pin">KRA PIN</Label>
            <Input id="kra_pin" {...register("kra_pin", { required: "KRA PIN is required" })} />
            {errors.kra_pin && <p className="text-red-500 text-sm mt-1">{errors.kra_pin.message}</p>}
          </div>
          <div>
            <Label htmlFor="reg_number">Registration Number</Label>
            <Input id="reg_number" {...register("reg_number", { required: "Registration Number is required" })} />
            {errors.reg_number && <p className="text-red-500 text-sm mt-1">{errors.reg_number.message}</p>}
          </div>

          {/* Contact & Location */}
          <h3 className="text-lg font-semibold mt-6 mb-2">Contact & Location</h3>
          <div>
            <Label htmlFor="company_email">Company Email</Label>
            <Input id="company_email" type="email" {...register("company_email", { required: "Company Email is required", pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Invalid email format" } })} />
            {errors.company_email && <p className="text-red-500 text-sm mt-1">{errors.company_email.message}</p>}
          </div>
          <div>
            <Label htmlFor="company_phone">Company Phone</Label>
            <Input id="company_phone" type="tel" {...register("company_phone", { required: "Company Phone is required" })} />
            {errors.company_phone && <p className="text-red-500 text-sm mt-1">{errors.company_phone.message}</p>}
          </div>
          <div>
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" {...register("address", { required: "Address is required" })} />
            {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>}
          </div>
          <div>
            <Label htmlFor="county">County</Label>
            <Controller
              name="county"
              control={control}
              rules={{ required: "County is required" }}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select county" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kiambu">Kiambu</SelectItem>
                    <SelectItem value="nairobi">Nairobi</SelectItem>
                    <SelectItem value="mombasa">Mombasa</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.county && <p className="text-red-500 text-sm mt-1">{errors.county.message}</p>}
          </div>

          {/* Payroll Settings */}
          <h3 className="text-lg font-semibold mt-6 mb-2">Payroll Settings</h3>
          <div>
            <Label htmlFor="payroll_frequency">Payroll Frequency</Label>
            <Controller
              name="payroll_frequency"
              control={control}
              rules={{ required: "Payroll Frequency is required" }}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.payroll_frequency && <p className="text-red-500 text-sm mt-1">{errors.payroll_frequency.message}</p>}
          </div>
          <div>
            <Label htmlFor="default_work_days">Default Work Days per Week</Label>
            <Input
              id="default_work_days"
              type="number"
              {...register("default_work_days", {
                required: "Default Work Days is required",
                min: { value: 1, message: "Must be at least 1" },
                max: { value: 7, message: "Cannot exceed 7" },
                valueAsNumber: true,
              })}
            />
            {errors.default_work_days && <p className="text-red-500 text-sm mt-1">{errors.default_work_days.message}</p>}
          </div>
          <div>
            <Label htmlFor="default_work_hours">Default Work Hours per Day</Label>
            <Input
              id="default_work_hours"
              type="number"
              {...register("default_work_hours", {
                required: "Default Work Hours is required",
                min: { value: 1, message: "Must be at least 1" },
                max: { value: 24, message: "Cannot exceed 24" },
                valueAsNumber: true,
              })}
            />
            {errors.default_work_hours && <p className="text-red-500 text-sm mt-1">{errors.default_work_hours.message}</p>}
          </div>
          <div>
            <Label htmlFor="nssf_scheme">NSSF Scheme</Label>
            <Controller
              name="nssf_scheme"
              control={control}
              rules={{ required: "NSSF Scheme is required" }}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select NSSF scheme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="old">Old Scheme</SelectItem>
                    <SelectItem value="new">New Scheme</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.nssf_scheme && <p className="text-red-500 text-sm mt-1">{errors.nssf_scheme.message}</p>}
          </div>
          <div>
            <Label htmlFor="shif_rate_option">SHIF Rate Option</Label>
            <Controller
              name="shif_rate_option"
              control={control}
              rules={{ required: "SHIF Rate Option is required" }}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select SHIF option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tiered">Tiered Rate</SelectItem>
                    <SelectItem value="fixed">Fixed Rate</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.shif_rate_option && <p className="text-red-500 text-sm mt-1">{errors.shif_rate_option.message}</p>}
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? <Loader2 className="animate-spin mr-2" size={20} /> : null}
            {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CompanySettings;
