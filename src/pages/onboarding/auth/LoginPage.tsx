// src/pages/onboarding/auth/LoginPage.tsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
/*
const toProperCase = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}; */

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      const state = useAuthStore.getState();
      if (state.workspaces.length > 0) {
        toast.success("Login successful");
      } else {
        toast.info("Logged in, but no workspace found.");
      }
      navigate("/dashboard");
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("An error occurred during login.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-slate-50">
      <Card className="w-full max-w-sm p-6 rounded-sm shadow-none border border-slate-300">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Enter your email and password to access your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-sm shadow-none border border-slate-200"
                placeholder="m@example.com"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  className="rounded-sm shadow-none border border-slate-200"
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            <div className="text-right text-sm mt-2">
            <Link
              to="/forgot-password"
              className="text-[#1F3A8A] hover:text-blue-600 hover:underline focus:outline-none"
            >
              Forgot Password?
            </Link>
          </div>
            <Button
              type="submit"
              className="w-full cursor-pointer bg-[#1F3A8A] hover:bg-[#1F3A7D] rounded-sm shadow-none"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 cursor-not-allowed h-4 w-4 animate-spin" />
              ) : (
                "Log in"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
