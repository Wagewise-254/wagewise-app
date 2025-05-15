// src/pages/LoginPage.tsx
import React, { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { Loader2 } from "lucide-react"; // Import spinner icon

type LoginFormData = {
  Username: string;
  Password: string;
};

const LoginPage: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false); // New state for loading

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  const onSubmit: SubmitHandler<LoginFormData> = async (data) => {
    setLoading(true); // Start loading
    setError(null); // Reset error
    try {
      const response = await axios.post("https://wagewise-backend.onrender.com/api/users/login", {
        Username: data.Username,
        Password: data.Password,
      });

      if (response.data.message === "Login successful") {
        console.log("Login successful:", response.data.user);
        toast.success("Login successful", {
          duration: 3000,
        });
        setError(null);
        navigate("/dashboard"); // Redirect to dashboard
      } else {
        setError("Invalid username or password.");
        toast.error("Invalid username or password", {
          duration: 3000, // 3 seconds
        });
      }
    } catch (err) {
      setError("Login failed. Please try again.");
      toast.error("Login failed. Please try again", {
        duration: 3000,
      });
      console.error("Login error:", err);
    } finally {
      setLoading(false); // Stop loading
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              type="text"
              {...register("Username", { required: "Username is required" })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.Username && (
              <p className="text-red-500 text-sm mt-1">
                {errors.Username.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              {...register("Password", { required: "Password is required" })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.Password && (
              <p className="text-red-500 text-sm mt-1">
                {errors.Password.message}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full flex items-center justify-center bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Login"}
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