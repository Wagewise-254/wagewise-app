// Step 4 - Salary & Pay Info

import { useFormContext, useWatch } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FormFieldWrapper } from "@/components/ui/form-field-wrapper";
import { AddEmployeeFormData } from "@/types/employees";

export default function AddEmployeeStep4() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<AddEmployeeFormData>();

  const paymentMethod = useWatch({ control, name: "payment_method" });

  return (
    <div className="space-y-4">
      <FormFieldWrapper
        label="Basic Salary"
        htmlFor="basic_salary"
        error={errors.basic_salary}
      >
        <Input
          id="basic_salary"
          type="number"
          step="0.01"
          {...register("basic_salary", { valueAsNumber: true })}
        />
      </FormFieldWrapper>

      <FormFieldWrapper
        label="Salary Effective Date"
        htmlFor="salary_effective_date"
        error={errors.salary_effective_date}
      >
        <Input
          id="salary_effective_date"
          type="date"
          {...register("salary_effective_date")}
        />
      </FormFieldWrapper>

      <FormFieldWrapper
        label="Payment Method"
        htmlFor="payment_method"
        error={errors.payment_method}
      >
        <Select
          value={paymentMethod || ""}
          onValueChange={(value) => {
            // @ts-expect-error: setValue is not typed directly on control, but is available at runtime
            control.setValue("payment_method", value, { shouldValidate: true });
          }}
        >
          <option value="">Select payment method</option>
          <option value="Bank">Bank</option>
          <option value="Mpesa">Mpesa</option>
          <option value="Cash">Cash</option>
        </Select>
      </FormFieldWrapper>

      {paymentMethod === "Bank" && (
        <>
          <FormFieldWrapper label="Bank Name" htmlFor="bank_name" error={errors.bank_name}>
            <Input id="bank_name" {...register("bank_name")} />
          </FormFieldWrapper>

          <FormFieldWrapper label="Bank Branch" htmlFor="bank_branch" error={errors.bank_branch}>
            <Input id="bank_branch" {...register("bank_branch")} />
          </FormFieldWrapper>

          <FormFieldWrapper label="Bank Code" htmlFor="bank_code" error={errors.bank_code}>
            <Input id="bank_code" {...register("bank_code")} />
          </FormFieldWrapper>

          <FormFieldWrapper
            label="Bank Account Number"
            htmlFor="bank_account_number"
            error={errors.bank_account_number}
          >
            <Input id="bank_account_number" {...register("bank_account_number")} />
          </FormFieldWrapper>
        </>
      )}

      {paymentMethod === "Mpesa" && (
        <FormFieldWrapper
          label="Mpesa Phone Number"
          htmlFor="mpesa_phone_number"
          error={errors.mpesa_phone_number}
        >
          <Input id="mpesa_phone_number" type="tel" {...register("mpesa_phone_number")} />
        </FormFieldWrapper>
      )}
    </div>
  );
}
