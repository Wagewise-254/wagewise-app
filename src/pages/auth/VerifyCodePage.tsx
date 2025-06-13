import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Loader2, ArrowLeft } from 'lucide-react';
import { API_BASE_URL } from '@/config';

type VerifyFormData = {
    code: string;
};

const VerifyCodePage: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { emailForVerification, maskedEmail } = location.state || {};
    const { register, handleSubmit, formState: { errors } } = useForm<VerifyFormData>();

    React.useEffect(() => {
        if (!emailForVerification) {
            navigate('/forgot-password');
        }
    }, [navigate, emailForVerification]);
    
   const onSubmit: SubmitHandler<VerifyFormData> = async (data) => {
        setIsLoading(true);
        try {
            const response = await axios.post(`${API_BASE_URL}/users/verify-recovery-code`, {
                recoveryEmail: emailForVerification, // Use the specific email for verification
                code: data.code
            });
            toast.success("Code verified!");
            navigate('/reset-password', { state: { userId: response.data.userId } });
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.error || 'Verification failed.');
            } else {
                toast.error('Verification failed.');
            }
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                <div className="text-center">
                    <h2 className="text-2xl font-bold">Check your email</h2>
                    <p className="mt-2 text-sm text-gray-600">We've sent a 6-digit code to <strong className="font-semibold">{maskedEmail}</strong>. The code expires in 10 minutes.</p>
                </div>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                     <div>
                        <label htmlFor="code" className="block text-sm font-medium sr-only">Verification Code</label>
                        <input id="code" type="text" maxLength={6} {...register("code", { required: "Code is required", minLength: 6, maxLength: 6 })} className="mt-1 block w-full px-3 py-2 border rounded-md text-center text-2xl tracking-[0.5em]"/>
                        {errors.code && <p className="text-red-500 text-xs mt-1 text-center">{errors.code.message}</p>}
                    </div>
                    <button type="submit" disabled={isLoading} className="w-full flex justify-center py-2 px-4 rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
                        {isLoading ? <Loader2 className="animate-spin" /> : "Verify Code"}
                    </button>
                </form>
                 <div className="text-center">
                    <button onClick={() => navigate('/forgot-password')} className="text-sm font-medium text-indigo-600 hover:underline flex items-center justify-center w-full">
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Use a different email
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VerifyCodePage;
