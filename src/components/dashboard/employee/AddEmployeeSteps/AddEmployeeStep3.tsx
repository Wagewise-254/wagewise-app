// src/components/dashboard/employee/AddEmployeeStep3.tsx

import React from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
 import { FormFieldWrapper } from "@/components/ui/form-field-wrapper";

import { AddEmployeeFormData } from "@/types/employees";
import { format } from "date-fns";
//import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

const AddEmployeeStep3: React.FC = () => {
  const {
    register,
    control,
    setValue,
    getValues,
    formState: { errors },
  } = useFormContext<AddEmployeeFormData>();

  const jobType = useWatch({ control, name: "job_type" });
  const employeeStatus = useWatch({ control, name: "employee_status" });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <h3 className="col-span-full text-lg font-semibold mt-4 mb-2">Employment Terms</h3>

      <FormFieldWrapper label="End of Probation Date" error={errors.end_of_probation_date}>
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                !getValues("end_of_probation_date") && "text-muted-foreground"
              )}
            >
              {getValues("end_of_probation_date")
                ? format(new Date(getValues("end_of_probation_date")!), "PPP")
                : "Select date"}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              selected={getValues("end_of_probation_date") as Date | undefined}
              onSelect={(date: Date | undefined) => setValue("end_of_probation_date", date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </FormFieldWrapper>

      {jobType === "contract" && (
        <>
          <FormFieldWrapper label="Contract Start Date" error={errors.contract_start_date}>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    !getValues("contract_start_date") && "text-muted-foreground"
                  )}
                >
                  {getValues("contract_start_date")
                    ? format(new Date(getValues("contract_start_date")!), "PPP")
                    : "Select date"}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  selected={getValues("contract_start_date") as Date | undefined}
                  onSelect={(date: Date | undefined) => setValue("contract_start_date", date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </FormFieldWrapper>

          <FormFieldWrapper label="Contract End Date" error={errors.contract_end_date}>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    !getValues("contract_end_date") && "text-muted-foreground"
                  )}
                >
                  {getValues("contract_end_date")
                    ? format(new Date(getValues("contract_end_date")!), "PPP")
                    : "Select date"}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  selected={getValues("contract_end_date") as Date | undefined}
                  onSelect={(date: Date | undefined) => setValue("contract_end_date", date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </FormFieldWrapper>
        </>
      )}

      {employeeStatus === "terminated" && (
        <>
          <FormFieldWrapper label="Termination Date" error={errors.termination_date}>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    !getValues("termination_date") && "text-muted-foreground"
                  )}
                >
                  {getValues("termination_date")
                    ? format(new Date(getValues("termination_date")!), "PPP")
                    : "Select date"}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  selected={getValues("termination_date") as Date | undefined}
                  onSelect={(date: Date | undefined) => setValue("termination_date", date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </FormFieldWrapper>

          <div>
            <Label htmlFor="termination_reason">Termination Reason</Label>
            <Input id="termination_reason" {...register("termination_reason")} />
            {errors.termination_reason && (
              <p className="text-red-500 text-sm mt-1">{errors.termination_reason.message}</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AddEmployeeStep3;
