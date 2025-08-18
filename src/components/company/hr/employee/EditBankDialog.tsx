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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores/authStore";
import { Employee } from "@/components/company/payroll/DataTable";
import { API_BASE_URL } from "@/config"; // Assuming DataTable is in the same folder


// Type for the bank list fetched from the backend
export type Bank = {
  bank_code: string;
  bank_name: string;
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
const [paymentMethod, setPaymentMethod] = useState<"Cash" | "Bank" | "M-Pesa">(employee?.employee_bank_details?.payment_method || "Cash");
  const [bankCode, setBankCode] = useState(
    employee?.employee_bank_details?.bank_code || ""
  );
  const [accountNumber, setAccountNumber] = useState(
    employee?.employee_bank_details?.account_number || ""
  );
  const [phoneNumber, setPhoneNumber] = useState(
    employee?.employee_bank_details?.phone_number || ""
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // When the employee prop changes (i.e., when the dialog is opened),
  // populate the form fields with the employee's current data.
  useEffect(() => {
    if (employee) {
      setPaymentMethod(employee.employee_bank_details?.payment_method || "Cash");
      setBankCode(employee.employee_bank_details?.bank_code || "");
      setAccountNumber(employee.employee_bank_details?.account_number || "");
      setPhoneNumber(employee.employee_bank_details?.phone_number || "");
    }
  }, [employee]);

  const handleSave = async () => {
    if (!employee || !session) {
      setError("Employee data or session is missing.");
      return;
    }

    setIsLoading(true);
    setError(null);

    const selectedBank = banks.find(b => b.bank_code === bankCode);

    const payload = {
      payment_method: paymentMethod,
      // Only include bank details if the payment method is 'Bank'
      bank_name: paymentMethod === "Bank" ? selectedBank?.bank_name : null,
      bank_code: paymentMethod === "Bank" ? bankCode : null,
      account_number: paymentMethod === "Bank" ? accountNumber : null,
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
        }
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
          <DialogTitle>Edit Payment Details for {`${employee.first_name} ${employee.last_name}`}</DialogTitle>
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
             onValueChange={(value) => setPaymentMethod(value as "Cash" | "Bank" | "M-Pesa")}
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
                <Select value={bankCode} onValueChange={setBankCode}>
                  <SelectTrigger id="bank" className="col-span-3">
                    <SelectValue placeholder="Select Bank" />
                  </SelectTrigger>
                  <SelectContent>
                    {banks.map((bank) => (
                      <SelectItem key={bank.bank_code} value={bank.bank_code}>
                        {bank.bank_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
          <Button variant="outline" className="cursor-pointer" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button className="bg-[#7F5EFD] cursor-pointer" onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
