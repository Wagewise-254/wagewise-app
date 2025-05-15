import React, { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { Loader2 } from "lucide-react"; // Import spinner icon

type SignUpFormData = {
  Username: string;
  Password: string;
  ConfirmPassword: string;
};

const SignUpPage: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false); // New loading state
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignUpFormData>();

  const onSubmit: SubmitHandler<SignUpFormData> = async (data) => {
    setLoading(true); // Start loading
    setError(null); // Reset error state

    try {
      if (data.Password !== data.ConfirmPassword) {
        setError("Passwords do not match.");
        setLoading(false); // Stop loading
        return;
      }

      const response = await axios.post("https://wagewise-backend.onrender.com/api/users", {
        Username: data.Username,
        Password: data.Password,
      });
      console.log("Sign-up successful:", response.data);
      setError(null);
      

      toast.success("Sign-up successful. Please login.");
      navigate("/login");
    } catch (err) {
      setError("Sign-up failed. Please try again.");
      toast.error("Sign-up failed. Please try again.");
    } finally {
      setLoading(false); // Stop loading
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">Sign Up</h2>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <input
              type="text"
              {...register("Username", { required: "Username is required" })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.Username && <p className="text-red-500 text-sm mt-1">{errors.Username.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              {...register("Password", { required: "Password is required" })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.Password && <p className="text-red-500 text-sm mt-1">{errors.Password.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
            <input
              type="password"
              {...register("ConfirmPassword", {
                required: "Confirm Password is required",
                validate: (value) => value === watch("Password") || "Passwords do not match",
              })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.ConfirmPassword && <p className="text-red-500 text-sm mt-1">{errors.ConfirmPassword.message}</p>}
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full flex items-center justify-center bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
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
