// src/pages/dashboard/MainDashboard.tsx - Updated to control OnboardingDialog

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for navigation
import axios from 'axios';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react'; // Import Loader2 for loading indicator

import { API_BASE_URL } from '@/config'; // Assuming "@/config" resolves to your config file
import useAuthStore from '@/store/authStore'; // Import the auth store

// Import your Onboarding Dialog component
import OnboardingDialog from '@/components/onboarding/OnboardingDialog'; // Adjust path as needed
import SideNav from '@/components/dashboard/layout/sideNav'; // Adjust path as needed

// Define the expected structure of the company details response
interface CompanyDetailsResponse {
  message: string;
  companyDetails: { business_name?: string; address?: string; phone?: string;[key: string]: unknown } | null; // Replace 'any' with a more specific type
  onboardingComplete: boolean;
}

const MainDashboard: React.FC = () => {
  const { accessToken } = useAuthStore();
  const navigate = useNavigate();

  const [isLoadingCompany, setIsLoadingCompany] = useState(true);
  const [companyDetails, setCompanyDetails] = useState<CompanyDetailsResponse['companyDetails'] | null>(null);
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // State to control the visibility of the onboarding dialog
  const [isDialogVisible, setIsDialogVisible] = useState(false);


  // Fetch company details when the component mounts or accessToken changes
  useEffect(() => {
    const fetchCompanyDetails = async () => {
      if (!accessToken) {
        setIsLoadingCompany(false);
        // Initialize navigate
        navigate('/login'); // Redirect to login
        return;
      }

      setIsLoadingCompany(true);
      setFetchError(null); // Reset error state

      try {
        const response = await axios.get<CompanyDetailsResponse>(`${API_BASE_URL}/company`, {
          headers: {
            Authorization: `Bearer ${accessToken}`, // Include the access token in the headers
          },
        });

        console.log("Fetch Company Details Response:", response.data);

        // Update state based on the response
        setCompanyDetails(response.data.companyDetails);
        setOnboardingComplete(response.data.onboardingComplete);
        setIsLoadingCompany(false);

      } catch (err: unknown) {
        console.error("Error fetching company details:", err);
        setIsLoadingCompany(false);
        setCompanyDetails(null); // Clear previous data
        setOnboardingComplete(false); // Assume onboarding is not complete on error

        if (axios.isAxiosError(err) && err.response) {
          const backendErrorMessage = err.response.data?.error || "Failed to fetch company details.";
          //setFetchError(backendErrorMessage);
          toast.error(backendErrorMessage);

        } else {
          setFetchError("An unexpected error occurred while fetching company details.");
          toast.error("An unexpected error occurred while fetching company details.");
        }
      }
    };

    fetchCompanyDetails();
  }, [accessToken, navigate]); // Re-run effect if access token or navigate changes

  // Effect to control dialog visibility based on onboardingComplete status
  useEffect(() => {
    // Only show dialog if onboardingComplete is explicitly false
    if (onboardingComplete === false) {
      setIsDialogVisible(true);
    } else {
      setIsDialogVisible(false);
    }
  }, [onboardingComplete]); // Re-run effect when onboardingComplete status changes


  // Function to handle onboarding completion from the dialog
  const handleOnboardingComplete = () => {
    setOnboardingComplete(true); // Update state to show dashboard
    setIsDialogVisible(false); // Hide the dialog
    // Optionally refetch company details to get the saved data
     //fetchCompanyDetails(); // You might want to call the fetch function again
  };


  // --- Render Logic ---
  // Show a loading indicator while fetching initial company details
  if (isLoadingCompany || onboardingComplete === null) {
    return (
      <div className="flex  min-h-screen">
        <SideNav />
        <div className=" w-full flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="ml-2 text-gray-600">Loading company details...</p>
        </div>
      </div>
    );
  }

  // If there was a fetch error, display an error message
  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-red-500">
        <p className="text-lg mb-4">Error loading dashboard:</p>
        <p>{fetchError}</p>
        {/* Optionally add a retry button */}
      </div>
    );
  }

  // If onboarding is not complete, the dialog will be visible due to isDialogVisible state
  // If onboarding is complete, show the main dashboard content
  return (
    <div className="flex h-screen gap-4 ">
      {/* Render the sidebar navigation */}
      <SideNav />
      {/* Main dashboard content */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        {companyDetails?.business_name && (
          <p className="text-gray-700">Welcome, {companyDetails.business_name}!</p>
        )}
        <p className="text-gray-500">Overview of your payroll activities.</p>
      </div>


      {/* Render the OnboardingDialog, controlled by isDialogVisible */}
      {/* Pass the handleOnboardingComplete function to update state when done */}
      <OnboardingDialog
        isOpen={isDialogVisible}
        onClose={() => setIsDialogVisible(false)} // Allow closing, though usually forced for onboarding
        onOnboardingComplete={handleOnboardingComplete}
      // userId={user?.id} // userId is not strictly needed in the dialog anymore
      />
    </div>
  );
};

export default MainDashboard;
