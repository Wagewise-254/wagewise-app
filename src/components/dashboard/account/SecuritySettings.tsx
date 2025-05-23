// src/components/dashboard/account/SecuritySettings.tsx - Populated

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

// Password form data
interface PasswordFormData {
  newPassword: string;
  confirmPassword: string;
}

// Security question form data
interface SecurityQuestionFormData {
  question: string;
  answer: string;
}

const SecuritySettings: React.FC = () => {
  const { accessToken } = useAuthStore();

  // State for password change form
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);
  const [passwordFormError, setPasswordFormError] = useState<string | null>(null);
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPasswordForm,
  } = useForm<PasswordFormData>();

  // State for security question form
  const [isSecurityQuestionSubmitting, setIsSecurityQuestionSubmitting] = useState(false);
  const [securityQuestionFormError, setSecurityQuestionFormError] = useState<string | null>(null);
  const {
    register: registerSecurityQuestion,
    handleSubmit: handleSecurityQuestionSubmit,
    formState: { errors: securityQuestionErrors },
    reset: resetSecurityQuestionForm,
  } = useForm<SecurityQuestionFormData>();


  // --- Password Change Handler ---
  const onSubmitPassword: SubmitHandler<PasswordFormData> = async (data) => {
    setIsPasswordSubmitting(true);
    setPasswordFormError(null);

    if (data.newPassword !== data.confirmPassword) {
      setPasswordFormError("Passwords do not match.");
      toast.error("Passwords do not match.");
      setIsPasswordSubmitting(false);
      return;
    }

    if (!accessToken) {
      setPasswordFormError("Authentication token missing. Please log in again.");
      toast.error("Authentication required.");
      setIsPasswordSubmitting(false);
      return;
    }

    try {
      const response = await axios.put(`${API_BASE_URL}/users/password`, {
        newPassword: data.newPassword,
      }, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      toast.success(response.data.message || "Password updated successfully!");
      setPasswordFormError(null);
      resetPasswordForm(); // Clear the form

    } catch (err: unknown) {
      console.error("Error updating password:", err);
      if (axios.isAxiosError(err) && err.response && typeof err.response.data === 'object') {
        const backendError = err.response.data as { error?: string; message?: string };
        setPasswordFormError(backendError.error || backendError.message || 'Failed to update password.');
        toast.error(backendError.error || backendError.message || 'Failed to update password.');
      } else {
        setPasswordFormError('An unexpected error occurred while updating password.');
        toast.error('An unexpected error occurred while updating password.');
      }
    } finally {
      setIsPasswordSubmitting(false);
    }
  };

  // --- Security Question Handler ---
  const onSubmitSecurityQuestion: SubmitHandler<SecurityQuestionFormData> = async (data) => {
    setIsSecurityQuestionSubmitting(true);
    setSecurityQuestionFormError(null);

    if (!accessToken) {
      setSecurityQuestionFormError("Authentication token missing. Please log in again.");
      toast.error("Authentication required.");
      setIsSecurityQuestionSubmitting(false);
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/users/security-question`, {
        question: data.question,
        answer: data.answer,
      }, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      toast.success(response.data.message || "Security question set successfully!");
      setSecurityQuestionFormError(null);
      resetSecurityQuestionForm(); // Clear the form

    } catch (err: unknown) {
      console.error("Error setting security question:", err);
      if (axios.isAxiosError(err) && err.response && typeof err.response.data === 'object') {
        const backendError = err.response.data as { error?: string; message?: string };
        setSecurityQuestionFormError(backendError.error || backendError.message || 'Failed to set security question.');
        toast.error(backendError.error || backendError.message || 'Failed to set security question.');
      } else {
        setSecurityQuestionFormError('An unexpected error occurred while setting security question.');
        toast.error('An unexpected error occurred while setting security question.');
      }
    } finally {
      setIsSecurityQuestionSubmitting(false);
    }
  };

  return (
    <Card className="p-6">
      <CardHeader>
        <CardTitle>Security Settings</CardTitle>
        <p className="text-gray-600">Manage your password and other security preferences.</p>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Change Password Section */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Change Password</h3>
          {passwordFormError && <p className="text-red-500 text-sm mb-4">{passwordFormError}</p>}
          <form onSubmit={handlePasswordSubmit(onSubmitPassword)} className="space-y-4 max-w-lg">
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                {...registerPassword("newPassword", {
                  required: "New password is required",
                  minLength: { value: 8, message: "Password must be at least 8 characters" },
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/,
                    message: "Password must include uppercase, lowercase, number, and special character",
                  },
                })}
                className="mt-1"
              />
              {passwordErrors.newPassword && <p className="text-red-500 text-sm mt-1">{passwordErrors.newPassword.message}</p>}
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...registerPassword("confirmPassword", {
                  required: "Please confirm your new password",
                })}
                className="mt-1"
              />
              {passwordErrors.confirmPassword && <p className="text-red-500 text-sm mt-1">{passwordErrors.confirmPassword.message}</p>}
            </div>
            <Button type="submit" disabled={isPasswordSubmitting}>
              {isPasswordSubmitting ? <Loader2 className="animate-spin mr-2" size={20} /> : null}
              {isPasswordSubmitting ? 'Updating Password...' : 'Update Password'}
            </Button>
          </form>
        </div>

        {/* Security Question Section */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Security Question</h3>
          <p className="text-gray-600 text-sm mb-3">Set a security question that can be used to help recover your account if you forget your password. Choose a question only you can answer.</p>
          {securityQuestionFormError && <p className="text-red-500 text-sm mb-4">{securityQuestionFormError}</p>}
          <form onSubmit={handleSecurityQuestionSubmit(onSubmitSecurityQuestion)} className="space-y-4 max-w-lg">
            <div>
              <Label htmlFor="question">Choose a Question</Label>
              <Input
                id="question"
                {...registerSecurityQuestion("question", { required: "Security question is required" })}
                placeholder="e.g., What was your first pet's name?"
                className="mt-1"
              />
              {securityQuestionErrors.question && <p className="text-red-500 text-sm mt-1">{securityQuestionErrors.question.message}</p>}
            </div>
            <div>
              <Label htmlFor="answer">Your Answer</Label>
              <Input
                id="answer"
                type="text"
                {...registerSecurityQuestion("answer", { required: "Answer is required" })}
                className="mt-1"
              />
              {securityQuestionErrors.answer && <p className="text-red-500 text-sm mt-1">{securityQuestionErrors.answer.message}</p>}
            </div>
            <Button type="submit" disabled={isSecurityQuestionSubmitting}>
              {isSecurityQuestionSubmitting ? <Loader2 className="animate-spin mr-2" size={20} /> : null}
              {isSecurityQuestionSubmitting ? 'Saving Question...' : 'Set Security Question'}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
};

export default SecuritySettings;
