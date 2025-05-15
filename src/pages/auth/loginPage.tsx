// src/pages/LoginPage.tsx - Improved (Fixes Loading and Error Handling)

import React, { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import axios from "axios"; // Import AxiosError for better type safety
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { Loader2 , Eye, EyeOff} from "lucide-react"; // Import spinner and eye icons

import { API_BASE_URL } from "@/config"; // Assuming "@/config" resolves to your config file

// Import the auth store - We'll still use this for updating global auth state
import useAuthStore from "@/store/authStore"; // Adjust the import path as necessary

// Define the shape of the successful login response from the backend
// Ensure this matches what your backend actually returns
type LoginSuccessResponse = {
  message: string;
  access_token?: string;
  refresh_token?: string;
  user?: {
    id: string;
    email: string;
    // Add other user properties if your backend returns them
  };
};

type LoginFormData = {
  Email: string;
  Password: string;
};

const LoginPage: React.FC = () => {
  // Use Zustand store actions for updating global auth state and errors
  // We will use a local state for form submission loading
  const { login, setError: setAuthError } = useAuthStore();

  // Local state for form submission loading
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Local state for form-specific error messages
  const [localError, setLocalError] = useState<string | null>(null);

  const navigate = useNavigate();

  // State to manage password visibility
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  const onSubmit: SubmitHandler<LoginFormData> = async (data) => {
    setIsSubmitting(true); // Start local form submission loading
    setLocalError(null); // Reset local error state
    setAuthError(null); // Reset global auth error state

    try {
      // Make the API call
      const response = await axios.post<LoginSuccessResponse>(`${API_BASE_URL}/users/login`, {
        email: data.Email, // Sending lowercase 'email'
        password: data.Password, // Sending lowercase 'password'
      });

      // --- Improved Success Handling ---
      // Check for HTTP status 200 and presence of access_token
      if (response.status === 200 && response.data.access_token && response.data.user) {
        console.log("Login successful:", response.data.user);
        console.log("Access Token:", response.data.access_token);
        console.log("Refresh Token:", response.data.refresh_token);

        // Call the Zustand login action to update the store state
        login(response.data.user, response.data.access_token, response.data.refresh_token || ""); // Pass refresh token, default to empty string

        toast.success("Login successful", { duration: 3000 });
        setLocalError(null); // Clear any local errors
        navigate("/dashboard"); // Redirect to dashboard AFTER state is updated

      } else {
        // Handle cases where the request was successful (e.g., 200 OK)
        // but the backend response structure was unexpected or incomplete
        const errorMessage = response.data?.message || "Login failed: Unexpected response from server.";
        setLocalError(errorMessage);
        setAuthError(errorMessage); // Also set global error
        toast.error(errorMessage, { duration: 3000 });
      }

    } catch (err: unknown) { // Use unknown for better type safety
      console.error("Login error:", err);

      // --- Improved Error Handling ---
      // Check if it's an Axios error with a response from the backend
      if (axios.isAxiosError(err) && err.response) { // Narrow down the type using a type guard
        // Use the error message provided by the backend if available
        const backendErrorMessage = err.response.data?.error || err.response.data?.message || "Login failed. Please check your credentials.";
        setLocalError(backendErrorMessage);
        setAuthError(backendErrorMessage); // Also set global error
        toast.error(backendErrorMessage, { duration: 3000 });
      } else {
        // Handle non-Axios errors or errors without a response
        const genericErrorMessage = "An unexpected error occurred. Please try again.";
        setLocalError(genericErrorMessage);
        setAuthError(genericErrorMessage); // Also set global error
        toast.error(genericErrorMessage, { duration: 3000 });
      }
      // --- End Improved Error Handling ---

    } finally {
      setIsSubmitting(false); // Stop local form submission loading in finally block
    }
  };

  // Function to toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Note: The global isLoading from the Zustand store (if used for initial check)
  // is not directly used here for the button, resolving the initial loading issue.

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
        {/* Display local error message */}
        {localError && <p className="text-red-500 text-sm mb-4">{localError}</p>}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="text"
              {...register("Email", { required: "Email is required" })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.Email && (
              <p className="text-red-500 text-sm mt-1">
                {errors.Email.message}
              </p>
            )}
          </div>
          {/* Password Input with Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <div className="relative mt-1">
              <input
                // Dynamically set input type based on state
                type={showPassword ? "text" : "password"}
                {...register("Password", { required: "Password is required" })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 pr-10" // Add padding-right for icon
              />
              {/* Eye Icon Button */}
              <button
                type="button" // Important: type="button" to prevent form submission
                onClick={togglePasswordVisibility}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.Password && <p className="text-red-500 text-sm mt-1">{errors.Password.message}</p>}
          </div>
          <button
            type="submit"
            disabled={isSubmitting} // Use local isSubmitting state
            className={`w-full flex items-center justify-center bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : "Login"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Not registered?{" "}
          <Link
            to="/signup"
            className="text-blue-500 hover:text-blue-600 focus:outline-none"
          >
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
