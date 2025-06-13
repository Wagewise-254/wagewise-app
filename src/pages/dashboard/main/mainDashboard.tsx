// src/pages/dashboard/MainDashboard.tsx - Updated for scrollability

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { API_BASE_URL } from '@/config';
import useAuthStore from '@/store/authStore';

import OnboardingDialog from '@/components/onboarding/OnboardingDialog';
import  SetRecoveryEmailDialog  from '@/components/auth/SetRecoveryEmailDialog';
import SideNav from '@/components/dashboard/layout/sideNav';
import DashboardContent from '@/components/dashboard/main/DashboardContent';

// Define the expected structure of the company details response
interface CompanyDetailsResponse {
  message: string;
  companyDetails: { business_name?: string; address?: string; phone?: string;[key: string]: unknown } | null;
  onboardingComplete: boolean;
}

interface RecoveryStatusResponse {
    hasRecoveryEmail: boolean;
}

const MainDashboard: React.FC = () => {
  const { accessToken,  setRecoveryStatus, hasRecoveryEmail  } = useAuthStore();
  const navigate = useNavigate();

  const [isLoadingCompany, setIsLoadingCompany] = useState(true);
  const [companyDetails, setCompanyDetails] = useState<CompanyDetailsResponse['companyDetails'] | null>(null);
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const [isRecoveryDialogVisible, setIsRecoveryDialogVisible] = useState(false);
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
        // Fetch company details and recovery status in parallel for efficiency
        const [companyRes, recoveryRes] = await Promise.all([
          axios.get<CompanyDetailsResponse>(`${API_BASE_URL}/company`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
          axios.get<RecoveryStatusResponse>(`${API_BASE_URL}/users/recovery-status`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          })
        ]);

        console.log("Fetch Company Details Response:", companyRes.data);

        setCompanyDetails(companyRes.data.companyDetails);
        setOnboardingComplete(companyRes.data.onboardingComplete);
         setRecoveryStatus(recoveryRes.data.hasRecoveryEmail); // Update the global authStore
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
  }, [accessToken, navigate, setRecoveryStatus]);

  console.log(companyDetails);

  // This effect reacts to changes in recovery status or onboarding status
  // to determine if the recovery dialog should be shown.
  useEffect(() => {
    // Show the dialog only after initial data is loaded, onboarding is done,
    // and we know for sure the user has not set a recovery email.
    if (onboardingComplete === true && hasRecoveryEmail === false) {
      setIsRecoveryDialogVisible(true);
    } else {
      setIsRecoveryDialogVisible(false);
    }
  }, [onboardingComplete, hasRecoveryEmail]);


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
      <div className="flex flex-col h-screen items-center justify-center text-center text-red-600 bg-gray-50">
        <p className="text-lg font-semibold mb-2">Could not load dashboard</p>
        <p>{fetchError}</p>
        <button onClick={() => navigate('/login')} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
            Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <SideNav />

      {/* RecoveryEmailDialog will only show after onboarding is complete and if needed. */}
      <SetRecoveryEmailDialog
          isOpen={isRecoveryDialogVisible}
          onClose={() => setIsRecoveryDialogVisible(false)}
      />

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
