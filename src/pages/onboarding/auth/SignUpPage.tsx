// src/pages/onboarding/auth/SignUpPage.tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';

const SignUpPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
   const [confirmPassword, setConfirmPassword] = useState('');
  const [userName, setUserName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const { signUp, loading } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !userName) {
        toast.error('All fields are required.');
        return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    try {
      await signUp(email, password, userName);
      toast.success('Sign up successful!.');
      navigate('/login'); // Redirect to login after successful sign up
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('An error occurred during sign up.');
      }
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Sign Up</CardTitle>
          <CardDescription>Enter your details to create an account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="userName">Username</Label>
              <Input id="userName" type="text" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="John Doe" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="m@example.com" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input id="password" 
              type={showPassword ? "text" : "password"} 
              value={password} onChange={(e) => setPassword(e.target.value)} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
              </div>              
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input 
              id="confirmPassword" 
              type={showConfirmPassword ? "text" : "password"} 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
              </div>
              
            </div>
            <Button type="submit" className="w-full cursor-pointer bg-[#7F5EFD] hover:bg-[#6b47d1]" disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 cursor-not-allowed h-4 w-4 animate-spin" />
              ) : (
                "Sign Up"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-sm justify-center">
            Already have an account? <Link to="/login" className="ml-1 font-semibold text-[#7F5EFD]  hover:underline">Login</Link>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SignUpPage;