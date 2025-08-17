// src/components/company/payroll/allowances/EditAllowanceDialog.tsx

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { API_BASE_URL } from "@/config";
import { useAuthStore } from "@/stores/authStore";
import { Allowance } from "./AllowanceAssignTable";
import { toast } from "sonner";

type Props = {
  allowance: Allowance;
  companyId: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
};

export default function EditAllowanceDialog({ allowance, companyId, isOpen, onClose, onUpdated }: Props) {
  const { session } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const [value, setValue] = useState(allowance.value.toString());
  const [calculationType, setCalculationType] = useState<"Fixed" | "Percentage">(allowance.calculation_type);
  const [startDate, setStartDate] = useState<Date | undefined>(new Date(allowance.start_date));
  const [endDate, setEndDate] = useState<Date | undefined>(allowance.end_date ? new Date(allowance.end_date) : undefined);

  const handleUpdate = async () => {
    if (!value || !startDate) {
        toast.error("Please fill in all required fields.");
        return;
    }
    setLoading(true);

    try {
      const payload = {
        value: parseFloat(value),
        calculation_type: calculationType,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate ? endDate.toISOString().split('T')[0] : null,
      };

      const response = await fetch(`${API_BASE_URL}/company/${companyId}/allowances/${allowance.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to update allowance");
      }

      toast.success("Allowance updated successfully.");

      onUpdated();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update allowance. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Allowance</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2 pb-4">
          <div className="space-y-2">
            <Label>Allowance Type</Label>
            <Input disabled value={allowance.allowance_types.name} />
          </div>
          <div className="space-y-2">
            <Label>Employee</Label>
            <Input disabled value={`${allowance.employees.first_name} ${allowance.employees.last_name}`} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="value">Value</Label>
              <Input
                id="value"
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Calculation Type</Label>
              <RadioGroup
                value={calculationType}
                onValueChange={(val: "Fixed" | "Percentage") => setCalculationType(val)}
                className="flex h-10 items-center space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Fixed" id="fixed" />
                  <Label htmlFor="fixed">Fixed</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Percentage" id="percentage" />
                  <Label htmlFor="percentage">Percentage</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>End Date (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="bg-[#7F5EFD] text-white hover:bg-[#6a4ad3]"
            onClick={handleUpdate}
            disabled={loading}
          >
            {loading ? "Updating..." : "Update Allowance"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}