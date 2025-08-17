import { ColumnDef } from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Check, X, MoreHorizontal } from "lucide-react";
import { Employee } from "@/types/statutory";


export const columns: ColumnDef<Employee>[] = [
  {
    accessorKey: "employee_number",
    header: "Employee #",
  },
  {
    accessorKey: "first_name",
    header: "First Name",
  },
  {
    accessorKey: "last_name",
    header: "Last Name",
  },
  {
    id: "paye",
    accessorKey: "pays_paye",
    header: "PAYE",
    cell: ({ row }) => {
      const paysPaye = row.getValue("paye");
      return paysPaye ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-500" />;
    },
  },
  {
    id: "nssf",
    accessorKey: "pays_nssf",
    header: "NSSF",
    cell: ({ row }) => {
      const paysNssf = row.getValue("nssf");
      return paysNssf ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-500" />;
    },
  },
  {
    id: "housing_levy",
    accessorKey: "pays_housing_levy",
    header: "Housing Levy",
    cell: ({ row }) => {
      const paysHousingLevy = row.getValue("housing_levy");
      return paysHousingLevy ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-500" />;
    },
  },
  {
    id: "shif",
    header: "SHIF",
    cell: () => {
      // SHIF is always mandatory, so it's always true.
      return <Check className="h-4 w-4 text-green-500" />;
    },
  },
  {
    id: "helb",
    accessorKey: "pays_helb",
    header: "HELB",
    cell: ({ row }) => {
      const paysHelb = row.getValue("helb");
      return paysHelb ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-500" />;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem            >
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View details</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];