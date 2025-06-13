import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Loader2} from 'lucide-react';
import { API_BASE_URL } from '@/config';

type FormData = {
    newPassword: string;
    confirmPassword: string;
};

const ResetPasswordPage: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { userId } = location.state || {};
    const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>();

    React.useEffect(() => {
        if (!userId) {
            navigate('/login');
        }
    }, [userId, navigate]);

    if (!userId) {
        return null;
    }

    const onSubmit: SubmitHandler<FormData> = async (data) => {
        setIsLoading(true);
        try {
            await axios.post(`${API_BASE_URL}/users/reset-password`, { userId, newPassword: data.newPassword });
            toast.success("Password reset successfully! Please log in.");
            navigate('/login');
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.error || 'Failed to reset password.');
            } else {
                toast.error('Failed to reset password.');
            }
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-center">Create New Password</h2>
                <p className="text-center text-sm text-gray-600">Your new password must be different from previous passwords.</p>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                     <div>
                        <label htmlFor="newPassword">New Password</label>
                        <input id="newPassword" type="password" {...register("newPassword", { required: "Password is required", minLength: { value: 8, message: "Password must be at least 8 characters" } })} className="mt-1 block w-full px-3 py-2 border rounded-md"/>
                        {errors.newPassword && <p className="text-red-500 text-xs mt-1">{errors.newPassword.message}</p>}
                    </div>
                     <div>
                        <label htmlFor="confirmPassword">Confirm New Password</label>
                        <input id="confirmPassword" type="password" {...register("confirmPassword", { validate: value => value === watch('newPassword') || "Passwords do not match" })} className="mt-1 block w-full px-3 py-2 border rounded-md"/>
                        {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
                    </div>
                    <button type="submit" disabled={isLoading} className="w-full flex justify-center py-2 px-4 rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
                        {isLoading ? <Loader2 className="animate-spin" /> : "Reset Password"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPasswordPage;
