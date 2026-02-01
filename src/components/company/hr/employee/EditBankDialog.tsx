import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores/authStore";
import { Employee } from "@/components/company/hr/employee/DataTable";
import { API_BASE_URL } from "@/config"; // Assuming DataTable is in the same folder

// Type for the bank list fetched from the backend
export type Bank = {
  bank_code: string;
  name: string;
  branches: {
    name: string;
    branch_code: string;
  }[];
};

interface EditBankDialogProps {
  employee: Employee | null; // Can be null when dialog is closed
  companyId: string;
  banks: Bank[];
  onClose: () => void;
  onUpdated: () => void;
}

export default function EditBankDialog({
  employee,
  companyId,
  banks,
  onClose,
  onUpdated,
}: EditBankDialogProps) {
  const { session } = useAuthStore();
  const [bankOpen, setBankOpen] = useState(false);
  const [branchOpen, setBranchOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<
    "Cash" | "Bank" | "M-Pesa"
  >(employee?.employee_bank_details?.payment_method || "Cash");
  const [bankCode, setBankCode] = useState(
    employee?.employee_bank_details?.bank_code || "",
  );
  const [accountNumber, setAccountNumber] = useState(
    employee?.employee_bank_details?.account_number || "",
  );
  const [phoneNumber, setPhoneNumber] = useState(
    employee?.employee_bank_details?.phone_number || "",
  );
  const [branchCode, setBranchCode] = useState(
    employee?.employee_bank_details?.branch_code || "",
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // When the employee prop changes (i.e., when the dialog is opened),
  // populate the form fields with the employee's current data.
  useEffect(() => {
    if (employee) {
      setPaymentMethod(
        employee.employee_bank_details?.payment_method || "Cash",
      );
      setBankCode(employee.employee_bank_details?.bank_code || "");
      setAccountNumber(employee.employee_bank_details?.account_number || "");
      setPhoneNumber(employee.employee_bank_details?.phone_number || "");
      setBranchCode(employee.employee_bank_details?.branch_code || "");
    }
  }, [employee]);

  console.log(banks);

  // Handle bank code change to reset branch code
  const handleBankCodeChange = (newBankCode: string) => {
    setBankCode(newBankCode);
    setBranchCode(""); // Reset branch code when bank changes
  };

  const handleSave = async () => {
    if (!employee || !session) {
      setError("Employee data or session is missing.");
      return;
    }

    setIsLoading(true);
    setError(null);

    const selectedBank = banks.find((b) => b.bank_code === bankCode);

    const payload = {
      payment_method: paymentMethod,
      // Only include bank details if the payment method is 'Bank'
      bank_name: paymentMethod === "Bank" ? selectedBank?.name : null,
      bank_code: paymentMethod === "Bank" ? bankCode : null,
      account_number: paymentMethod === "Bank" ? accountNumber : null,
      branch_code: paymentMethod === "Bank" ? branchCode : null,
      // Only include phone number if the payment method is 'M-Pesa'
      phone_number: paymentMethod === "M-Pesa" ? phoneNumber : null,
    };

    try {
      const response = await fetch(
        `${API_BASE_URL}/company/${companyId}/employees/${employee.id}/bank-details`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save details.");
      }

      onUpdated(); // Callback to refresh the data on the main page
      onClose(); // Close the dialog on success
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // The dialog is only rendered if an employee is selected
  if (!employee) {
    return null;
  }

  return (
    <Dialog open={!!employee} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          {/* Updated this line to use first_name and last_name */}
          <DialogTitle>
            Edit Payment Details for{" "}
            {`${employee.first_name} ${employee.last_name}`}
          </DialogTitle>
          <DialogDescription>
            Update the payment method and details for this employee.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="payment-method" className="text-right">
              Method
            </Label>
            <Select
              value={paymentMethod}
              onValueChange={(value) =>
                setPaymentMethod(value as "Cash" | "Bank" | "M-Pesa")
              }
            >
              <SelectTrigger id="payment-method" className="col-span-3">
                <SelectValue placeholder="Select Payment Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Bank">Bank</SelectItem>
                <SelectItem value="M-Pesa">M-Pesa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Conditional Fields for Bank */}
          {paymentMethod === "Bank" && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="bank" className="text-right">
                  Bank
                </Label>
                <Popover open={bankOpen} onOpenChange={setBankOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={bankOpen}
                      className="col-span-3 justify-between font-normal"
                    >
                      {bankCode
                        ? banks.find((bank) => bank.bank_code === bankCode)
                            ?.name
                        : "Search bank..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[300px] p-0"
                    align="start"
                    side="bottom"
                    sideOffset={5}
                  >
                    <Command className="max-h-[300px]">
                      <CommandInput placeholder="Search bank..." />
                      <CommandList className="max-h-[250px] overflow-y-auto">
                        <CommandEmpty>No bank found.</CommandEmpty>
                        <CommandGroup>
                          {banks.map((bank) => (
                            <CommandItem
                              key={bank.bank_code}
                              value={bank.name} // Search matches against name
                              onSelect={() => {
                                handleBankCodeChange(bank.bank_code);
                                setBankOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  bankCode === bank.bank_code
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                              {bank.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              {/* CONDITIONAL FIELD FOR BRANCH CODE */}
              {bankCode && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="branch" className="text-right">
                    Branch
                  </Label>
                  <Popover open={branchOpen} onOpenChange={setBranchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={branchOpen}
                        className="col-span-3 justify-between font-normal"
                      >
                        {branchCode
                          ? banks
                              .find((b) => b.bank_code === bankCode)
                              ?.branches.find(
                                (br) => br.branch_code === branchCode,
                              )?.name
                          : "Search branch..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[300px] p-0"
                      align="start"
                      side="bottom"
                      sideOffset={5}
                    >
                      <Command className="max-h-[300px]">
                        <CommandInput placeholder="Search branch code or name..." />
                        <CommandList className="max-h-[250px] overflow-y-auto">
                          <CommandEmpty>No branch found.</CommandEmpty>
                          <CommandGroup>
                            {banks
                              .find((b) => b.bank_code === bankCode)
                              ?.branches.map((branch) => (
                                <CommandItem
                                  key={branch.branch_code}
                                  value={`${branch.name} ${branch.branch_code}`}
                                  onSelect={() => {
                                    setBranchCode(branch.branch_code);
                                    setBranchOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      branchCode === branch.branch_code
                                        ? "opacity-100"
                                        : "opacity-0",
                                    )}
                                  />
                                  {branch.name} ({branch.branch_code})
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              )}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="account-number" className="text-right">
                  Account No.
                </Label>
                <Input
                  id="account-number"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="col-span-3"
                />
              </div>
            </>
          )}

          {/* Conditional Fields for M-Pesa */}
          {paymentMethod === "M-Pesa" && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone-number" className="text-right">
                M-Pesa No.
              </Label>
              <Input
                id="phone-number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="col-span-3"
                placeholder="e.g. 0712345678"
              />
            </div>
          )}
        </div>
        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
        <DialogFooter>
          <Button
            variant="outline"
            className="cursor-pointer"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            className="bg-[#7F5EFD] cursor-pointer"
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
