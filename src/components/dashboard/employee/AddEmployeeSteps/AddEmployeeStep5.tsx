// src/components/dashboard/employee/AddEmployeeStep5.tsx

import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { AddEmployeeFormData } from "@/types/employees";

const AddEmployeeStep5 = () => {
  const {
    register,
    formState: { errors },
  } = useFormContext<AddEmployeeFormData>();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <h3 className="col-span-full text-lg font-semibold mt-2">Banking Details</h3>

      <div>
        <Label htmlFor="bank_name">Bank Name</Label>
        <Input id="bank_name" {...register("bank_name")} />
        {errors.bank_name && <p className="text-red-500 text-sm">{errors.bank_name.message}</p>}
      </div>

      <div>
        <Label htmlFor="bank_branch">Bank Branch</Label>
        <Input id="bank_branch" {...register("bank_branch")} />
        {errors.bank_branch && <p className="text-red-500 text-sm">{errors.bank_branch.message}</p>}
      </div>

      <div>
        <Label htmlFor="bank_code">Bank Code</Label>
        <Input id="bank_code" {...register("bank_code")} />
        {errors.bank_code && <p className="text-red-500 text-sm">{errors.bank_code.message}</p>}
      </div>

      <div>
        <Label htmlFor="bank_account_number">Bank Account Number</Label>
        <Input id="bank_account_number" {...register("bank_account_number")} />
        {errors.bank_account_number && (
          <p className="text-red-500 text-sm">{errors.bank_account_number.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="mpesa_phone_number">M-Pesa Phone Number</Label>
        <Input id="mpesa_phone_number" {...register("mpesa_phone_number")} />
        {errors.mpesa_phone_number && (
          <p className="text-red-500 text-sm">{errors.mpesa_phone_number.message}</p>
        )}
      </div>

      <h3 className="col-span-full text-lg font-semibold mt-4">Tax & Benefits</h3>

      <div className="flex items-center space-x-2">
        <Checkbox id="is_helb_paying" {...register("is_helb_paying")} />
        <Label htmlFor="is_helb_paying">Is HELB Paying?</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox id="paye_tax_exemption" {...register("paye_tax_exemption")} />
        <Label htmlFor="paye_tax_exemption">PAYE Tax Exemption?</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox id="disability_tax_exemption" {...register("disability_tax_exemption")} />
        <Label htmlFor="disability_tax_exemption">Disability Tax Exemption?</Label>
      </div>

      <h3 className="col-span-full text-lg font-semibold mt-4">Address</h3>

      <div className="md:col-span-2">
        <Label htmlFor="physical_address">Physical Address</Label>
        <Textarea id="physical_address" {...register("physical_address")} />
      </div>

      <div className="md:col-span-2">
        <Label htmlFor="postal_address">Postal Address</Label>
        <Textarea id="postal_address" {...register("postal_address")} />
      </div>

      <div>
        <Label htmlFor="county">County</Label>
        <Input id="county" {...register("county")} />
      </div>

      <div>
        <Label htmlFor="postal_code">Postal Code</Label>
        <Input id="postal_code" {...register("postal_code")} />
      </div>

      <h3 className="col-span-full text-lg font-semibold mt-4">Next of Kin</h3>

      <div>
        <Label htmlFor="next_of_kin_name">Name</Label>
        <Input id="next_of_kin_name" {...register("next_of_kin_name")} />
      </div>

      <div>
        <Label htmlFor="next_of_kin_relationship">Relationship</Label>
        <Input id="next_of_kin_relationship" {...register("next_of_kin_relationship")} />
      </div>

      <div>
        <Label htmlFor="next_of_kin_phone">Phone Number</Label>
        <Input id="next_of_kin_phone" {...register("next_of_kin_phone")} />
      </div>
    </div>
  );
};

export default AddEmployeeStep5;
