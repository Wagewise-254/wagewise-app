// src/components/ui/form-field-wrapper.tsx

import React from "react";
import { Label } from "./label";

interface FormFieldWrapperProps {
  label: string;
  htmlFor?: string;
  error?: { message?: string };
  children: React.ReactNode;
  className?: string;
}

export const FormFieldWrapper: React.FC<FormFieldWrapperProps> = ({
  label,
  htmlFor,
  error,
  children,
  className = "",
}) => {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error?.message && (
        <p className="text-red-500 text-sm mt-1">{error.message}</p>
      )}
    </div>
  );
};
