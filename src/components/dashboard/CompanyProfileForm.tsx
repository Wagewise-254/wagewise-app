import {
  useState,
  useRef,
  useEffect,
  type Dispatch,
  type SetStateAction,
  type InputHTMLAttributes,
  type ChangeEvent,
} from "react";

import { API_BASE_URL } from "@/config";
import { Upload, X, ChevronsUpDown } from "lucide-react";
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
import { Button } from "../ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export interface Branch {
  name: string;
  branch_code: string;
  full_code: string;
}

export interface Bank {
  bank_code: string;
  name: string;
  branches: Branch[];
}

export interface CompanyFormData {
  [key: string]: string;
  // Business Info
  business_name: string;
  industry: string;
  kra_pin: string;
  company_email: string;
  company_phone: string;
  location: string;

  // Statutory
  nssf_employer: string;
  shif_employer: string;
  housing_levy_employer: string;
  helb_employer: string;

  // Bank Details
  bank_name: string;
  branch_name: string;
  account_name: string;
  account_number: string;
}

interface FormProps {
  data: CompanyFormData;
  setData: Dispatch<SetStateAction<CompanyFormData>>;
  setLogoFile: (file: File | null) => void;
  logoPreview: string | null;
  setLogoPreview: (preview: string | null) => void;
}

interface FloatingFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

// Reusable Floating Field with the "Border-Cut" style 
export function FloatingField({ label, ...props }: FloatingFieldProps) {
  return (
    <div className="group relative mt-2">
      <Input
        {...props}
        placeholder=" "
        className={`peer h-12 rounded-md border-slate-200 bg-transparent px-4 pt-2 text-sm transition-all focus:border-[#1F3A8A] focus:ring-0 ${props.className}`}
      />
      <Label
        className="absolute left-3 top-3 px-1 text-sm text-muted-foreground transition-all 
        bg-white dark:bg-background
        peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm 
        peer-focus:-top-2.5 peer-focus:left-2 peer-focus:text-xs peer-focus:font-semibold peer-focus:text-[#1F3A8A]
        peer-[:not(:placeholder-shown)]:-top-2.5 peer-[:not(:placeholder-shown)]:left-2 peer-[:not(:placeholder-shown)]:text-xs"
      >
        {label}
      </Label>
    </div>
  );
}

export function CompanyProfileForm({
  data,
  setData,
  setLogoFile,
  logoPreview,
  setLogoPreview,
}: FormProps) {
  //const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [openBank, setOpenBank] = useState(false);
  const [openBranch, setOpenBranch] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/banks`)
      .then((res) => res.json())
      .then((banksData) => {
        setBanks(banksData);

        // Restore selected bank if it exists in form data
        if (data.bank_name) {
          const savedBank = banksData.find(
            (bank: Bank) => bank.name === data.bank_name,
          );
          if (savedBank) {
            setSelectedBank(savedBank);

            // Restore selected branch if it exists in form data
            if (data.branch_name && savedBank.branches) {
              const savedBranch = savedBank.branches.find(
                (branch: Branch) => branch.name === data.branch_name,
              );
              if (savedBranch) {
                setSelectedBranch(savedBranch);
              }
            }
          }
        }
      })
      .catch((err) => console.error("Error fetching banks:", err));
  }, [data.bank_name, data.branch_name]); // Re-run when form data changes

  const handleChange = (field: keyof CompanyFormData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const previewUrl = URL.createObjectURL(file);
      setLogoPreview(previewUrl);
    }
  };

  const handleLogoRemove = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* 1. Basic Company Information */}
      <section className="space-y-6">
        <div className="flex items-center gap-4">
          <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400">
            Basic Profile
          </h4>
          <Separator className="flex-1" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-x-6 gap-y-8">
          <div className="md:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <FloatingField
              label="Business Name *"
              value={data.business_name || ""}
              onChange={(e) => handleChange("business_name", e.target.value)}
              required
            />
            <FloatingField
              label="Industry"
              value={data.industry || ""}
              onChange={(e) => handleChange("industry", e.target.value)}
            />
            <FloatingField
              label="Location"
              value={data.location || ""}
              onChange={(e) => handleChange("location", e.target.value)}
            />
            <FloatingField
              label="Company Email"
              value={data.company_email || ""}
              type="email"
              onChange={(e) => handleChange("company_email", e.target.value)}
            />
            <FloatingField
              label="Company Phone"
              value={data.company_phone || ""}
              onChange={(e) => handleChange("company_phone", e.target.value)}
            />
          </div>

          {/* Logo Upload Box - Modern & Sharp */}
          <div className="md:col-span-4 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-md p-4 relative hover:border-[#1F3A8A] transition-colors bg-slate-50/50">
            {logoPreview ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src={logoPreview}
                  alt="Logo"
                  className="max-h-32 object-contain"
                />
                <button
                  type="button" 
                  onClick={handleLogoRemove}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div
                className="text-center cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                <span className="text-xs font-semibold text-slate-500">
                  Upload Company Logo
                </span>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 2. Statutory & Compliance */}
      <section className="space-y-6">
        <div className="flex items-center gap-4">
          <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400">
            Compliance & Tax
          </h4>
          <Separator className="flex-1" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-8">
          <FloatingField
            label="KRA PIN *"
            value={data.kra_pin || ""}
            onChange={(e) => handleChange("kra_pin", e.target.value)}
            required
          />
          <FloatingField
            label="NSSF Employer No."
            value={data.nssf_employer || ""}
            onChange={(e) => handleChange("nssf_employer", e.target.value)}
          />
          <FloatingField
            label="SHIF Employer No."
            value={data.shif_employer || ""}
            onChange={(e) => handleChange("shif_employer", e.target.value)}
          />
          <FloatingField
            label="Housing Levy No."
            value={data.housing_levy_employer || ""}
            onChange={(e) =>
              handleChange("housing_levy_employer", e.target.value)
            }
          />
          <FloatingField
            label="HELB Employer No."
            value={data.helb_employer || ""}
            onChange={(e) => handleChange("helb_employer", e.target.value)}
          />
        </div>
      </section>

      {/* 3. Banking Details */}
      <section className="space-y-6">
        <div className="flex items-center gap-4">
          <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400">
            Banking Details
          </h4>
          <Separator className="flex-1" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-x-6 gap-y-8">
          {/* Bank Selection */}
          <div className="flex flex-col gap-2">
            <Popover open={openBank} onOpenChange={setOpenBank}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="h-12 justify-between rounded-md border-slate-200 font-normal"
                >
                  {selectedBank ? selectedBank.name : "Select Bank..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-75 p-0 rounded-md border-slate-200 shadow-none">
                <Command className="max-h-75">
                  <CommandInput placeholder="Search bank..." />
                  <CommandList>
                    <CommandEmpty>No bank found.</CommandEmpty>
                    <CommandGroup>
                      {banks.map((bank : Bank) => (
                        <CommandItem
                          key={bank.bank_code}
                          onSelect={() => {
                            handleChange("bank_name", bank.name);
                            setSelectedBank(bank);
                            setSelectedBranch(null); // Reset branch if bank changes
                            setOpenBank(false);
                          }}
                        >
                          {bank.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Branch Selection */}
          <div className="flex flex-col gap-2">
            <Popover open={openBranch} onOpenChange={setOpenBranch}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  disabled={!selectedBank}
                  className="h-12 justify-between rounded-md border-slate-200 font-normal"
                >
                  {selectedBranch ? selectedBranch.name : "Select Branch..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-75 p-0 rounded-md border-slate-200 shadow-none">
                <Command className="max-h-75">
                  <CommandInput placeholder="Search branch..." />
                  <CommandList>
                    <CommandEmpty>No branch found.</CommandEmpty>
                    <CommandGroup>
                      {selectedBank?.branches.map((branch: Branch) => (
                        <CommandItem
                          key={branch.full_code}
                          onSelect={() => {
                            setSelectedBranch(branch);
                            handleChange("branch_name", branch.name);
                            setOpenBranch(false);
                          }}
                        >
                          {branch.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <FloatingField
            label="Account Name"
            value={data.account_name || ""}
            onChange={(e) => handleChange("account_name", e.target.value)}
          />
          <FloatingField
            label="Account Number"
            value={data.account_number || ""}
            onChange={(e) => handleChange("account_number", e.target.value)}
          />
        </div>
      </section>
    </div>
  );
}
