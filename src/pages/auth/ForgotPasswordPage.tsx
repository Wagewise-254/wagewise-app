import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useNavigate, Link} from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Loader2, ArrowLeft } from 'lucide-react';
 import { API_BASE_URL } from '@/config'; // Use your actual config

type FormData = {
    email: string;
};
const ForgotPasswordPage: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { register, handleSubmit, formState: { errors } } = useForm<FormData>();

    const onSubmit: SubmitHandler<FormData> = async (data) => {
        setIsLoading(true);
       try {
            const response = await axios.post(`${API_BASE_URL}/users/send-recovery-code`, { email: data.email });
           // --- UPDATED SUCCESS HANDLING ---
            // Only navigate if the backend confirms a user was found by providing a maskedEmail.
            if (response.data && response.data.maskedEmail) {
                toast.success("Recovery code sent!");
                navigate('/verify-code', {
                    state: {
                        emailForVerification: response.data.emailForVerification,
                        maskedEmail: response.data.maskedEmail
                    }
                });
            } else {
                // If maskedEmail is not present, it means no user was found.
                // Show a generic message but do not navigate.
                toast.info("If an account with that email exists, a recovery code has been sent.");
            }
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.error || 'An unexpected error occurred.');
            } else {
                toast.error('An unexpected error occurred.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                <div className="text-center">
                    <h2 className="text-2xl font-bold">Forgot Password</h2>
                    <p className="mt-2 text-sm text-gray-600">Enter your account's email address and we will send you a password reset code.</p>
                </div>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium">Email Address</label>
                        <input id="email" type="email" {...register("email", { required: "Email is required" })} className="mt-1 block w-full px-3 py-2 border rounded-md" />
                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                    </div>
                    <button type="submit" disabled={isLoading} className="w-full flex justify-center py-2 px-4 rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
                        {isLoading ? <Loader2 className="animate-spin" /> : "Send Recovery Code"}
                    </button>
                </form>
                <div className="text-center">
                    <Link to="/login" className="text-sm font-medium text-indigo-600 hover:underline flex items-center justify-center">
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;