// src/components/dashboard/account/ProfileSettings.tsx

import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import axios from 'axios';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { API_BASE_URL } from '@/config';
import useAuthStore from '@/store/authStore';

interface ProfileFormData {
  email: string;
}

const ProfileSettings: React.FC = () => {
  const { accessToken, user, login } = useAuthStore(); // Get user and login action from store

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset, // To reset form after successful submission
  } = useForm<ProfileFormData>({
    defaultValues: {
      email: user?.email || '', // Pre-fill with current user email
    },
  });

  const onSubmit: SubmitHandler<ProfileFormData> = async (data) => {
    setIsSubmitting(true);
    setFormError(null);

    if (!accessToken || !user) {
      setFormError("Authentication token or user data missing. Please log in again.");
      toast.error("Authentication required.");
      setIsSubmitting(false);
      return;
    }

    if (data.email === user.email) {
        setFormError("New email cannot be the same as current email.");
        toast.info("Email is already up to date.");
        setIsSubmitting(false);
        return;
    }

    try {
      const response = await axios.put(`${API_BASE_URL}/users/email`, {
        newEmail: data.email,
      }, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      toast.success(response.data.message || "Email updated successfully! Please check your new email for verification.");
      setFormError(null);

      // Update the user's email in the Zustand store immediately for UI consistency
      // Note: Supabase usually sends a verification email. The user's actual email
      // in auth.users will only change after they verify. For simplicity, we update
      // the UI's perceived email now. For stricter apps, you might wait for verification.
      if (user && response.data.newEmail) {
        const refreshToken = useAuthStore.getState().refreshToken ?? '';
        login({ ...user, email: response.data.newEmail }, accessToken, refreshToken);
      }

      reset({ email: response.data.newEmail || data.email }); // Reset form with the new email

    } catch (err: unknown) {
      console.error("Error updating email:", err);
      if (axios.isAxiosError(err) && err.response && typeof err.response.data === 'object') {
        const backendError = err.response.data as { error?: string; message?: string };
        setFormError(backendError.error || backendError.message || 'Failed to update email.');
        toast.error(backendError.error || backendError.message || 'Failed to update email.');
      } else {
        setFormError('An unexpected error occurred while updating email.');
        toast.error('An unexpected error occurred while updating email.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6">
      <CardHeader>
        <CardTitle>My Profile</CardTitle>
        <p className="text-gray-600">Manage your personal account settings.</p>
      </CardHeader>
      <CardContent>
        {formError && <p className="text-red-500 text-sm mb-4">{formError}</p>}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Invalid email format",
                },
              })}
              className="mt-1"
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin mr-2" size={20} /> : null}
            {isSubmitting ? 'Updating...' : 'Update Email'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProfileSettings;
