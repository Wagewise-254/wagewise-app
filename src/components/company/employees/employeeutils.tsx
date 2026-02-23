import React, { useState } from "react";
import {
  ChevronRight,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { toast } from "sonner";

interface FloatingFieldProps {
  label: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: React.HTMLInputTypeAttribute;
  required?: boolean;
  error?: string;
}

export interface SearchableSelectOption {
  id?: string;
  name?: string;
  title?: string;
}

export interface FloatingSearchableSelectProps<
  T extends SearchableSelectOption | string,
> {
  label: string;
  value: string | null;
  options: T[];
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  error?: string;
}

type ToggleRowProps = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

// Add these to your employeeutils.tsx file

interface BorderFloatingFieldProps {
  label: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: React.HTMLInputTypeAttribute;
  required?: boolean;
  error?: string;
  disabled?: boolean;
}

export const BorderFloatingField: React.FC<BorderFloatingFieldProps> = ({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  error,
  disabled = false,
}) => {
  const hasValue = value !== "" && value !== null && value !== undefined;

  return (
    <div className="relative mb-6">
      <div
        className={cn(
          "relative border rounded-md transition-all bg-white",
          error
            ? "border-rose-500"
            : disabled
              ? "border-slate-200 bg-slate-50"
              : "border-slate-300 hover:border-slate-400 focus-within:border-blue-600",
        )}
      >
        <Input
          type={type}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder=""
          className={cn(
            "peer h-12 px-3 pt-4 pb-1 bg-transparent border-none shadow-none focus-visible:ring-0",
            disabled && "cursor-not-allowed opacity-70",
          )}
        />
        <Label
          className={cn(
            "absolute left-3 top-3 px-1 text-slate-500 transition-all cursor-text bg-transparent",
            "peer-focus:-top-2 peer-focus:text-xs peer-focus:text-blue-600 peer-focus:bg-white",
            hasValue && "-top-2 text-xs text-slate-600 bg-white",
            disabled && "opacity-70",
          )}
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </Label>
      </div>
      {error && <p className="text-xs text-rose-500 mt-1.5">{error}</p>}
    </div>
  );
};

interface BorderSelectOption {
  label: string;
  value: string;
}

interface BorderFloatingSelectProps {
  label: string;
  value: string;
  options: BorderSelectOption[];
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  error?: string;
}

export const BorderFloatingSelect: React.FC<BorderFloatingSelectProps> = ({
  label,
  value,
  options,
  onChange,
  required = false,
  disabled = false,
  error,
}) => {
  const hasValue = value !== "" && value !== null && value !== undefined;

  return (
    <div className="relative mb-6">
      <div
        className={cn(
          "relative border rounded-md transition-all bg-white",
          error
            ? "border-rose-500"
            : disabled
              ? "border-slate-200 bg-slate-50"
              : "border-slate-300 hover:border-slate-400 focus-within:border-blue-600",
        )}
      >
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={cn(
            "peer w-full h-12 px-3 pt-4 pb-1 text-slate-900 bg-transparent border-none rounded-md appearance-none focus:outline-none focus:ring-0",
            "cursor-pointer",
            !hasValue && "text-slate-400",
            disabled && "cursor-not-allowed opacity-70 text-slate-500",
          )}
          style={{
            WebkitAppearance: 'none',
            MozAppearance: 'none',
          }}
        >
          <option value="" disabled hidden></option>
          {options.map((option) => (
            <option key={option.value} value={option.value} className="text-slate-900">
              {option.label}
            </option>
          ))}
        </select>
        
        {/* Custom dropdown arrow */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg 
            className={cn("w-4 h-4", disabled ? "text-slate-400" : "text-slate-500")} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        <Label
          className={cn(
            "absolute left-3 top-3 px-1 text-slate-500 transition-all pointer-events-none bg-transparent",
            "peer-focus:-top-2 peer-focus:text-xs peer-focus:text-blue-600 peer-focus:bg-white",
            (hasValue || value) && "-top-2 text-xs text-slate-600 bg-white",
            disabled && "opacity-70",
          )}
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </Label>
      </div>
      {error && <p className="text-xs text-rose-500 mt-1.5">{error}</p>}
    </div>
  );
};

export const FloatingField: React.FC<FloatingFieldProps> = ({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  error,
}) => {
  return (
    <div className="relative mb-6">
      <div
        className={cn(
          "relative border-b-2 transition-colors",
          error
            ? "border-rose-500"
            : "border-slate-200 focus-within:border-blue-600",
        )}
      >
        <Input
          type={type}
          value={value}
          onChange={onChange}
          placeholder=" "
          className="peer h-10 px-0 bg-transparent border-none shadow-none focus-visible:ring-0"
        />
        <Label
          className={cn(
            "absolute left-0 top-2 text-slate-400 transition-all cursor-text",
            "peer-focus:-top-3 peer-focus:text-xs peer-focus:text-blue-600",
            value && "-top-3 text-xs text-slate-500",
          )}
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </Label>
      </div>
      {error && <p className="text-[10px] text-rose-500 mt-1">{error}</p>}
    </div>
  );
};

export function FloatingSearchableSelect<
  T extends { id?: string; name?: string; title?: string } | string,
>({
  label,
  value,
  options,
  onChange,
  required = false,
  disabled = false,
  error,
}: FloatingSearchableSelectProps<T>) {
  const [open, setOpen] = useState(false);

  const resolveLabel = (val: string | null): string => {
    if (!val) return "";

    const match = options.find((opt) =>
      typeof opt === "string" ? opt === val : opt.id === val,
    );

    if (!match) return "";

    return typeof match === "string"
      ? match
      : match.name || match.title || match.id || "";
  };

  const displayValue = resolveLabel(value);

  return (
    <div className="relative mb-6">
      <div
        className={cn(
          "relative border-b-2 transition-colors",
          error
            ? "border-rose-500"
            : open
              ? "border-blue-600"
              : "border-slate-200",
        )}
      >
        {/* Trigger */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              disabled={disabled}
              className="peer h-10 w-full px-0 justify-between rounded-none shadow-none hover:bg-transparent"
            >
              <span
                className={cn(
                  "truncate text-left",
                  displayValue ? "text-slate-900" : "text-transparent",
                )}
              >
                {displayValue || "—"}
              </span>
              <ChevronRight className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>

          <PopoverContent className="w-80 p-0 shadow-none border-slate-200">
            <Command>
              <CommandInput placeholder={`Search ${label.toLowerCase()}...`} />
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>

                <CommandGroup>
                  {options.map((option) => {
                    const optionValue =
                      typeof option === "string" ? option : option.id!;
                    const optionLabel =
                      typeof option === "string"
                        ? option
                        : option.name || option.title || option.id!;

                    return (
                      <CommandItem
                        key={optionValue}
                        value={optionValue}
                        onSelect={() => {
                          onChange(optionValue);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value === optionValue ? "opacity-100" : "opacity-0",
                          )}
                        />
                        {optionLabel}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Floating Label */}
        <Label
          className={cn(
            "absolute left-0 top-2 text-slate-400 transition-all cursor-pointer",
            (open || value) && "-top-3 text-xs text-slate-500",
            open && "text-blue-600",
          )}
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </Label>
      </div>

      {error && <p className="text-[10px] text-rose-500 mt-1">{error}</p>}
    </div>
  );
}

export const SectionHeader = ({ title }: { title: string }) => (
  <div className="flex items-center gap-4 mt-8 mb-6">
    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">
      {title}
    </h4>
    <Separator className="flex-1 bg-slate-100" />
  </div>
);

export const ToggleRow = ({ label, checked, onChange }: ToggleRowProps) => (
  <div className="flex items-center justify-between p-2 border border-slate-200 rounded-md">
    <span className="text-xs font-medium text-slate-600 uppercase">
      {label}
    </span>
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="h-4 w-4 accent-blue-600"
    />
  </div>
);

export function SectionDetailsHeader({ title, description, icon: Icon }: { title: string; description?: string; icon?: LucideIcon }) {
  return (
    <div className="border-b border-slate-100 pb-4 mb-6">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-5 h-5 text-indigo-600" />}
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      </div>
      {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
    </div>
  );
}

export function EditButton() {
  return (
    <button 
    onClick={() => toast.info("Editing is disabled for the demo")}
    className="flex items-center cursor-pointer gap-2 px-3 py-1.5 text-sm font-medium text-indigo-600 border border-indigo-600 rounded-md hover:bg-indigo-50 transition-all shadow-none">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
      Edit
    </button>
  );
}