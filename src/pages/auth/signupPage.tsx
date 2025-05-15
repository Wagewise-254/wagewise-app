import React, { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff } from "lucide-react"; // Import spinner and eye icons
import { API_BASE_URL } from "@/config"; // Assuming "@/config" resolves to your config file

type SignUpFormData = {
  Email: string;
  Password: string;
  ConfirmPassword: string;
  //option: string; // Commented out as it's not used in the form or logic
};

const SignUpPage: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // State to manage password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignUpFormData>();

  const onSubmit: SubmitHandler<SignUpFormData> = async (data) => {
    setLoading(true);
    setError(null);

    try {
      if (data.Password !== data.ConfirmPassword) {
        setError("Passwords do not match.");
        setLoading(false);
        return;
      }

      // Use the API_BASE_URL from the config file
      const response = await axios.post(`${API_BASE_URL}/users/signup`, {
        email: data.Email, // Sending lowercase 'email'
        password: data.Password, // Sending lowercase 'password'
      });

      console.log("Sign-up successful:", response.data);
      setError(null);

      // Use email from form data in the toast message
      // Changed toast type to success for better visual feedback
      toast.success(`Welcome ${data.Email}! Sign-up successful. Please login.`);
      navigate("/login");

    } catch (err: unknown) { // Use unknown and narrow down the type
      console.error("Sign-up failed:", err);
      // Attempt to get a more specific error message from the backend response
      // Added check for err.response and err.response.data
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.error || err.message || "Sign-up failed. Please try again."
        : "Sign-up failed. Please try again.";

      // If backend provides specific details (like password policy violations)
      const errorDetails = axios.isAxiosError(err) ? err.response?.data?.details : undefined;
      const fullErrorMessage = errorDetails ? `${errorMessage} ${errorDetails}` : errorMessage;

      setError(fullErrorMessage);
      //toast.error(fullErrorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Function to toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Function to toggle confirm password visibility
  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">Sign Up</h2>
        {/* Display error message */}
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="text"
              {...register("Email", { required: "Email is required" })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.Email && <p className="text-red-500 text-sm mt-1">{errors.Email.message}</p>}
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

          {/* Confirm Password Input with Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
            <div className="relative mt-1">
              <input
                 // Dynamically set input type based on state
                type={showConfirmPassword ? "text" : "password"}
                {...register("ConfirmPassword", {
                  required: "Confirm Password is required",
                  validate: (value) => value === watch("Password") || "Passwords do not match",
                })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 pr-10" // Add padding-right for icon
              />
               {/* Eye Icon Button */}
              <button
                type="button" // Important: type="button" to prevent form submission
                onClick={toggleConfirmPasswordVisibility}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.ConfirmPassword && <p className="text-red-500 text-sm mt-1">{errors.ConfirmPassword.message}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full flex items-center justify-center bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-500 focus:ring-offset-2 ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Sign Up"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-500 hover:text-blue-600 focus:outline-none">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignUpPage;
