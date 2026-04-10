import { FloatingField } from "./employees/employeeutils";
import { CompanySettings } from "@/hooks/companySettingsService";

interface Props {
  data: CompanySettings;
   onChange: (field: keyof CompanySettings, value: string) => void;
}

export function CompanyStatutoryForm({ data, onChange }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
      <FloatingField
        label="KRA PIN"
        value={data.kra_pin || ""}
        onChange={(e) => onChange("kra_pin", e.target.value)}
      />
      <FloatingField
        label="NSSF Employer No."
        value={data.nssf_employer || ""}
        onChange={(e) => onChange("nssf_employer", e.target.value)}
      />
      <FloatingField
        label="SHIF Employer No."
        value={data.shif_employer || ""}
        onChange={(e) => onChange("shif_employer", e.target.value)}
      />
      <FloatingField
        label="Housing Levy No."
        value={data.housing_levy_employer || ""}
        onChange={(e) => onChange("housing_levy_employer", e.target.value)}
      />
      <FloatingField
        label="HELB Employer No."
        value={data.helb_employer || ""}
        onChange={(e) => onChange("helb_employer", e.target.value)}
      />
    </div>
  );
}