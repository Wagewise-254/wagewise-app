import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import axios from 'axios';
import { toast } from 'sonner';
import { Loader2, MailWarning } from 'lucide-react';
import useAuthStore from '@/store/authStore';
import { API_BASE_URL } from "@/config"; 

// Import reusable UI components
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SetRecoveryEmailDialogProps {
    isOpen: boolean;
    onClose: () => void;
}
type RecoveryFormData = {
    recoveryEmail: string;
};

const SetRecoveryEmailDialog: React.FC<SetRecoveryEmailDialogProps> = ({ isOpen, onClose }) => {
    const [isLoading, setIsLoading] = useState(false);
    const { user, accessToken, setRecoveryStatus } = useAuthStore();
    const { register, handleSubmit, reset, formState: { errors } } = useForm<RecoveryFormData>();

   useEffect(() => {
        if (isOpen && user?.email) {
            reset({ recoveryEmail: user.email });
        }
    }, [isOpen, user, reset]);

    const onSubmit: SubmitHandler<RecoveryFormData> = async (data) => {
        setIsLoading(true);
        if (!accessToken) {
            toast.error("Authentication session expired.");
            return setIsLoading(false);
        }
        try {
            await axios.post(`${API_BASE_URL}/users/set-recovery-email`, { recoveryEmail: data.recoveryEmail }, { headers: { Authorization: `Bearer ${accessToken}` } });
            toast.success("Recovery email set successfully!");
            setRecoveryStatus(true);
            onClose();
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.error || "Failed to set recovery email.");
            } else {
                toast.error("Failed to set recovery email.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                       <MailWarning className="h-6 w-6 text-amber-600" aria-hidden="true" />
                    </div>
                    <DialogTitle className="mt-3 text-center text-lg font-semibold leading-6">Secure Your Account</DialogTitle>
                    <DialogDescription className="mt-2 text-center text-sm text-gray-500">
                        Add a recovery email to ensure you can regain access if you forget your password.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
                    <div>
                        <Label htmlFor="recovery-email" className="sr-only">Recovery Email</Label>
                        <Input id="recovery-email" type="email" {...register("recoveryEmail", { required: "Recovery email is required.", pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Please enter a valid email." } })}/>
                        {errors.recoveryEmail && <p className="text-red-500 text-xs mt-1">{errors.recoveryEmail.message}</p>}
                    </div>
                    <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-2">
                        <DialogClose asChild><Button type="button" variant="outline">Skip for Now</Button></DialogClose>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Save Recovery Email"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default SetRecoveryEmailDialog;
