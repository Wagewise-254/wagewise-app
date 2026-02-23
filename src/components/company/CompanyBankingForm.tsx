import { useState, useEffect } from "react";
import { ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { FloatingField } from "./employees/employeeutils";
import { API_BASE_URL } from "@/config";
import { CompanySettings } from "@/hooks/companySettingsService";

interface Props {
  data: CompanySettings;
  onChange: (field: keyof CompanySettings, value: string) => void;
}

interface Bank {
  bank_code: string;
  name: string;
  branches: Branch[];
}

interface Branch {
  name: string;
  branch_code: string;
  full_code: string;
}

export function CompanyBankingForm({ data, onChange }: Props) {
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
        
        if (data.bank_name) {
          const savedBank = banksData.find(
            (bank: Bank) => bank.name === data.bank_name
          );
          if (savedBank) {
            setSelectedBank(savedBank);
            
            if (data.branch_name) {
              const savedBranch = savedBank.branches.find(
                (branch: Branch) => branch.name === data.branch_name
              );
              if (savedBranch) {
                setSelectedBranch(savedBranch);
              }
            }
          }
        }
      })
      .catch((err) => console.error("Error fetching banks:", err));
  }, [data.bank_name, data.branch_name]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
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
          <PopoverContent className="w-100 p-0 rounded-md border-slate-200">
            <Command>
              <CommandInput placeholder="Search bank..." />
              <CommandList>
                <CommandEmpty>No bank found.</CommandEmpty>
                <CommandGroup>
                  {banks.map((bank) => (
                    <CommandItem
                      key={bank.bank_code}
                      onSelect={() => {
                        onChange("bank_name", bank.name);
                        setSelectedBank(bank);
                        setSelectedBranch(null);
                        onChange("branch_name", "");
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
          <PopoverContent className="w-100 p-0 rounded-md border-slate-200">
            <Command>
              <CommandInput placeholder="Search branch..." />
              <CommandList>
                <CommandEmpty>No branch found.</CommandEmpty>
                <CommandGroup>
                  {selectedBank?.branches.map((branch) => (
                    <CommandItem
                      key={branch.full_code}
                      onSelect={() => {
                        setSelectedBranch(branch);
                        onChange("branch_name", branch.name);
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
        onChange={(e) => onChange("account_name", e.target.value)}
      />
      
      <FloatingField
        label="Account Number"
        value={data.account_number || ""}
        onChange={(e) => onChange("account_number", e.target.value)}
      />
    </div>
  );
}