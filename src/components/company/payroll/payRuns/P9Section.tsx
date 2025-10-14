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
import { Loader2, MoreHorizontal, Download, Mail } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationNext,
} from "@/components/ui/pagination";

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
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isBulkSending, setIsBulkSending] = useState(false);

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
      if (
        !yearsRes.ok ||
        !yearsData.success ||
        !Array.isArray(yearsData.data)
      ) {
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

  const handleEmailSingleP9A = async (employeeId: string, year: number) => {
    if (!companyId || !session) {
      toast.error("Authentication failed. Please log in again.");
      return;
    }

    const toastId = toast.loading("Sending P9A via email...");

    try {
      const response = await fetch(
        `${API_BASE_URL}/companies/${companyId}/employees/${employeeId}/p9a/${year}/email`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send P9A email.");
      }

      const data = await response.json();
      toast.success(data.message || "P9A email sent successfully.", {
        id: toastId,
      });
    } catch (error: unknown) {
      console.error("Error emailing P9A:", error);
      if (error instanceof Error) {
        toast.error(error.message || "Error sending P9A email.", {
          id: toastId,
        });
      } else {
        toast.error("Error sending P9A email.", { id: toastId });
      }
    }
  };

  const handleEmailBulkP9As = async () => {
    if (selectedEmployees.length === 0 || !selectedYear) {
      toast.error("No employees selected or year not specified.");
      return;
    }
    if (!companyId || !session) {
      toast.error("Authentication failed. Please log in again.");
      return;
    }

    setIsBulkSending(true);
    let successCount = 0;
    let failCount = 0;
    const totalSelected = selectedEmployees.length;

    const toastId = toast.loading(
      `Sending emails to ${totalSelected} employees...`
    );

    try {
      for (const employeeId of selectedEmployees) {
        try {
          const response = await fetch(
            `${API_BASE_URL}/companies/${companyId}/employees/${employeeId}/p9a/${selectedYear}/email`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${session.access_token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (response.ok) {
            successCount++;
          } else {
            failCount++;
            const errorData = await response.json();
            console.error(
              `Failed to send email for employee ${employeeId}:`,
              errorData.error
            );
          }
        } catch (error) {
          failCount++;
          console.error(
            `Error sending email for employee ${employeeId}:`,
            error
          );
        }
      }

      // Final toast message
      if (successCount > 0 && failCount === 0) {
        toast.success(
          `Successfully sent P9A emails to all ${successCount} selected employees.`,
          { id: toastId }
        );
      } else if (successCount > 0 && failCount > 0) {
        toast.warning(
          `Sent P9A emails to ${successCount} employees. Failed to send to ${failCount} employees.`,
          { id: toastId }
        );
      } else {
        toast.error("Failed to send any P9A emails.", { id: toastId });
      }
    } finally {
      setIsBulkSending(false);
      setSelectedEmployees([]); // Clear selection after the operation
    }
  };

  // Search and Pagination Logic
  const filteredEmployees = employees.filter(
    (employee) =>
      `${employee.first_name} ${employee.last_name}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      employee.employee_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = filteredEmployees.map((e) => e.id);
      setSelectedEmployees(allIds);
    } else {
      setSelectedEmployees([]);
    }
  };

  const handleSelectEmployee = (employeeId: string, checked: boolean) => {
    if (checked) {
      setSelectedEmployees((prev) => [...prev, employeeId]);
    } else {
      setSelectedEmployees((prev) => prev.filter((id) => id !== employeeId));
    }
  };

  const isAllSelected =
    selectedEmployees.length > 0 &&
    selectedEmployees.length === filteredEmployees.length;

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
          <div className="flex items-center justify-center h-32">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            <span>Loading years...</span>
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
                    className="w-[200px] justify-between "
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
                  <Button className="bg-[#7F5EFD] cursor-pointer " disabled={!selectedYear}>Generate P9A</Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl p-6">
                  <DialogHeader>
                    <DialogTitle>P9A for {selectedYear}</DialogTitle>
                    <DialogDescription>
                      Select employees to download or send their P9A forms.
                    </DialogDescription>
                  </DialogHeader>
                  <Separator className="my-4" />
                  <div className="flex justify-between items-center my-4">
                    <div className="flex gap-2 w-full">
                      <Input
                        placeholder="Search by name or employee number..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="max-w-sm"
                      />
                      {selectedEmployees.length > 0 && (
                        <Button
                          onClick={handleEmailBulkP9As}
                          className="bg-blue-500 hover:bg-blue-600"
                          disabled={isBulkSending}
                        >
                          {isBulkSending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>Send P9A Email ({selectedEmployees.length})</>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="flex-grow overflow-auto border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]">
                            <Checkbox
                              checked={isAllSelected}
                              onCheckedChange={(checked: boolean) => handleSelectAll(checked)}
                            />
                          </TableHead>
                          <TableHead>Employee</TableHead>
                          <TableHead>Employee Number</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                         {paginatedEmployees.length > 0 ? (
                          paginatedEmployees.map((employee) => (
                            <TableRow key={employee.id}>
                              <TableCell>
                                <Checkbox
                                  checked={selectedEmployees.includes(employee.id)}
                                  onCheckedChange={(checked: boolean) => handleSelectEmployee(employee.id, checked)}
                                />
                              </TableCell>
                              <TableCell className="font-medium">
                                {employee.first_name} {employee.last_name}
                              </TableCell>
                              <TableCell>
                                {employee.employee_number}
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                      <span className="sr-only">Open menu</span>
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleDownloadP9A(employee.id, `${employee.first_name} ${employee.last_name}`)}>
                                      <Download className="mr-2 h-4 w-4" />
                                      {downloading === employee.id && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      )}
                                      Download P9A
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleEmailSingleP9A(employee.id, selectedYear!)}>
                                      <Mail className="mr-2 h-4 w-4" />
                                      Email P9A
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center">
                              No employees found for this company.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="flex justify-center mt-4">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} />
                        </PaginationItem>
                        {[...Array(totalPages)].map((_, index) => (
                          <PaginationItem key={index}>
                            <PaginationLink
                              isActive={currentPage === index + 1}
                              onClick={() => setCurrentPage(index + 1)}
                            >
                              {index + 1}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
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
