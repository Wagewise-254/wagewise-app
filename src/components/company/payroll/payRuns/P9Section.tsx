// src/pages/company/payroll/payRuns/P9Section.tsx

import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { API_BASE_URL } from "@/config";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Loader2, MoreHorizontal } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

// Define types for data
type Employee = {
  id: string;
  first_name: string;
  last_name: string;
  employee_number: string;
};

const P9Section = () => {
  const { session } = useAuthStore();
  const { companyId } = useParams<{ companyId: string }>();
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [openYear, setOpenYear] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch unique payroll years and employee list
  const fetchP9Data = useCallback(async () => {
    if (!companyId || !session) {
      toast.error("Invalid request parameters.");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Fetch employees for the company
      const employeesRes = await fetch(
        `${API_BASE_URL}/company/${companyId}/employees`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );
      const employeesData = await employeesRes.json();
      if (!employeesRes.ok)
        throw new Error(employeesData.error || "Failed to fetch employees.");
      setEmployees(employeesData);

      // Fetch unique years from completed payroll runs
      const yearsRes = await fetch(
        `${API_BASE_URL}/company/${companyId}/payroll/p9a/years`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );
      const yearsData = await yearsRes.json();
// ✅ Check if the request was successful and the data is an array
if (!yearsRes.ok || !yearsData.success || !Array.isArray(yearsData.data)) {
    throw new Error(yearsData.error || "Failed to fetch payroll years.");
}

// ✅ Use the data directly as it's already an array of unique years
const uniqueYears = yearsData.data.sort().reverse() as number[];
setYears(uniqueYears);

if (uniqueYears.length > 0) {
    setSelectedYear(uniqueYears[0]);
}
    } catch (error: unknown) {
      console.error("Error fetching P9 data:", error);
      if (error instanceof Error) {
        toast.error(error.message || "Failed to load P9 data.");
      } else {
        toast.error("Failed to load P9 data.");
      }
    } finally {
      setLoading(false);
    }
  }, [companyId, session]);

  useEffect(() => {
    fetchP9Data();
  }, [fetchP9Data]);

  // Handle single employee download
  const handleDownloadP9A = useCallback(
    async (employeeId: string, employeeName: string) => {
      if (!companyId || !selectedYear) {
        toast.error("Please select a year first.");
        return;
      }

      setDownloading(employeeId);
      try {
        const res = await fetch(
          `${API_BASE_URL}/companies/${companyId}/employees/${employeeId}/p9a/${selectedYear}`,
          {
            headers: {
              Authorization: `Bearer ${session?.access_token}`,
            },
          }
        );
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(
            errorData.error || `HTTP error! status: ${res.status}`
          );
        }

        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute(
          "download",
          `P9A_${employeeName.replace(/\s/g, "_")}_${selectedYear}.pdf`
        );
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        toast.success(`P9A for ${employeeName} downloaded successfully.`);
      } catch (error: unknown) {
        console.error("Error downloading P9A:", error);
        if (error instanceof Error) {
          toast.error(error.message || "Failed to download P9A.");
        } else {
          toast.error("Failed to download P9A.");
        }
      } finally {
        setDownloading(null);
      }
    },
    [companyId, selectedYear, session]
  );

  // Handle bulk download (Coming soon)
  const handleBulkDownload = () => {
    toast.info("Bulk download is coming soon!");
  };

  // Handle email send (Coming soon)
  const handleEmail = () => {
    toast.info("Email functionality is coming soon!");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>P9 Tax Deduction Cards</CardTitle>
        <CardDescription>
          Generate and download P9A tax deduction cards for your employees.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}
        {!loading && years.length > 0 && (
          <div className="flex flex-col items-start space-y-4">
            <div className="flex w-full items-center gap-4">
              <span className="font-medium text-sm">Select Year:</span>
              <Popover open={openYear} onOpenChange={setOpenYear}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openYear}
                    className="w-[200px] justify-between"
                  >
                    {selectedYear ? selectedYear : "Select a year..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <Command>
                    <CommandInput placeholder="Search year..." />
                    <CommandEmpty>No year found.</CommandEmpty>
                    <CommandGroup>
                      {years.map((year) => (
                        <CommandItem
                          key={year}
                          onSelect={() => {
                            setSelectedYear(year);
                            setOpenYear(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedYear === year
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {year}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button disabled={!selectedYear}>Generate P9A</Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl p-6">
                  <DialogHeader>
                    <DialogTitle>P9A for {selectedYear}</DialogTitle>
                    <DialogDescription>
                      Download or email the P9A for individual employees.
                    </DialogDescription>
                  </DialogHeader>
                  <Separator className="my-4" />
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <Button variant="outline" onClick={handleBulkDownload}>
                      <Loader2
                        className={cn(
                          "mr-2 h-4 w-4 animate-spin",
                          downloading ? "" : "hidden"
                        )}
                      />
                      Download All (Zip)
                    </Button>
                    <Button variant="outline" onClick={handleEmail}>
                      <Loader2
                        className={cn(
                          "mr-2 h-4 w-4 animate-spin",
                          downloading ? "" : "hidden"
                        )}
                      />
                      Email All
                    </Button>
                  </div>
                  <div className="max-h-[500px] overflow-auto mt-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee Name</TableHead>
                          <TableHead>Employee No.</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {employees.length > 0 ? (
                          employees.map((employee) => (
                            <TableRow key={employee.id}>
                              <TableCell className="font-medium">
                                {employee.first_name} {employee.last_name}
                              </TableCell>
                              <TableCell>{employee.employee_number}</TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      className="h-8 w-8 p-0"
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleDownloadP9A(
                                          employee.id,
                                          `${employee.first_name}_${employee.last_name}`
                                        )
                                      }
                                      disabled={downloading === employee.id}
                                    >
                                      {downloading === employee.id && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      )}
                                      Download P9A
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={handleEmail}>
                                      Email P9A
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center">
                              No employees found for this company.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        )}
        {!loading && years.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            No completed payroll runs found to generate P9A cards.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default P9Section;
