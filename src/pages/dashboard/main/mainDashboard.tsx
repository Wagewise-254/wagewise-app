// src/pages/dashboard/MainDashboard.tsx - Updated for scrollability

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { API_BASE_URL } from '@/config';
import useAuthStore from '@/store/authStore';

import OnboardingDialog from '@/components/onboarding/OnboardingDialog';
import SideNav from '@/components/dashboard/layout/sideNav';
import DashboardContent from '@/components/dashboard/main/DashboardContent';

// Define the expected structure of the company details response
interface CompanyDetailsResponse {
  message: string;
  companyDetails: { business_name?: string; address?: string; phone?: string;[key: string]: unknown } | null;
  onboardingComplete: boolean;
}

const MainDashboard: React.FC = () => {
  const { accessToken } = useAuthStore();
  const navigate = useNavigate();

  const [isLoadingCompany, setIsLoadingCompany] = useState(true);
  const [companyDetails, setCompanyDetails] = useState<CompanyDetailsResponse['companyDetails'] | null>(null);
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [isDialogVisible, setIsDialogVisible] = useState(false);


  // Fetch company details when the component mounts or accessToken changes
  useEffect(() => {
    const fetchCompanyDetails = async () => {
      if (!accessToken) {
        setIsLoadingCompany(false);
        navigate('/login');
        return;
      }

      setIsLoadingCompany(true);
      setFetchError(null);

      try {
        const response = await axios.get<CompanyDetailsResponse>(`${API_BASE_URL}/company`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        console.log("Fetch Company Details Response:", response.data);

        setCompanyDetails(response.data.companyDetails);
        setOnboardingComplete(response.data.onboardingComplete);
        setIsLoadingCompany(false);

      } catch (err: unknown) {
        console.error("Error fetching company details:", err);
        setIsLoadingCompany(false);
        setCompanyDetails(null);
        setOnboardingComplete(false);

        if (axios.isAxiosError(err) && err.response) {
          const backendErrorMessage = err.response.data?.error || "Failed to fetch company details.";
          toast.error(backendErrorMessage);
        } else {
          setFetchError("An unexpected error occurred while fetching company details.");
          toast.error("An unexpected error occurred while fetching company details.");
        }
      }
    };

    fetchCompanyDetails();
  }, [accessToken, navigate]);

  console.log(companyDetails);

  // Effect to control dialog visibility based on onboardingComplete status
  useEffect(() => {
    if (onboardingComplete === false) {
      setIsDialogVisible(true);
    } else {
      setIsDialogVisible(false);
    }
  }, [onboardingComplete]);


  // Function to handle onboarding completion from the dialog
  const handleOnboardingComplete = () => {
    setOnboardingComplete(true);
    setIsDialogVisible(false);
    // You might want to re-fetch company details here to get the newly saved data
    // fetchCompanyDetails(); // If you uncomment this, ensure it's memoized or handled carefully
  };


  // --- Render Logic ---
  if (isLoadingCompany || onboardingComplete === null) {
    return (
      <div className="flex min-h-screen">
        <SideNav />
        <div className="w-full flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="ml-2 text-gray-600">Loading company details and onboarding status...</p>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-red-500">
        <p className="text-lg mb-4">Error loading dashboard:</p>
        <p>{fetchError}</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <SideNav />
      {/* Conditional rendering for OnboardingDialog or DashboardContent */}
      {onboardingComplete === false ? (
        <OnboardingDialog
          isOpen={isDialogVisible}
          onClose={() => setIsDialogVisible(false)}
          onOnboardingComplete={handleOnboardingComplete}
        />
      ) : (
        // Render the main dashboard content if onboarding is complete
        // Changed overflow-hidden to overflow-y-auto to enable vertical scrolling
        <div className="flex-1 flex flex-col p-6 overflow-y-auto">
          <DashboardContent />
        </div>
      )}
    </div>
  );
};

export default MainDashboard;
