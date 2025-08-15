// src/pages/onboarding/auth/LoginPage.tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login, loading } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      toast.success('Login successful! Welcome back.');
      navigate('/dashboard'); // Redirect to a new dashboard route
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('An error occurred during login.');
      }
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <Card className="w-full max-w-sm p-6">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>Enter your email and password to access your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="m@example.com" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input id="password" 
                type= {showPassword ? "text" : "password"} 
                value={password} 
                onChange={(e) => 
                setPassword(e.target.value)} 
                required/>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              
            </div>
            <Button type="submit" className="w-full cursor-pointer bg-[#7F5EFD] hover:bg-[#6b47d1]" disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 cursor-not-allowed h-4 w-4 animate-spin" />
              ) : (
                "Log in"
              )}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <Link to="/signup" className="underline font-medium text-[#7F5EFD]">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;