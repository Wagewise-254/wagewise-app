// src/components/company/payroll/allowances/AllowanceManageTable.tsx

import * as React from "react";
import {
  ColumnDef,
  getCoreRowModel,
  useReactTable,
  flexRender,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Check, X } from "lucide-react";

// Updated type definition to match backend schema
export type AllowanceType = {
  id: string;
  name: string;
  description: string;
  is_cash: boolean;
  is_taxable: boolean;
  company_id: string;
};

interface Props {
  data: AllowanceType[];
  onEdit: (allowance: AllowanceType) => void;
  onDelete: (allowance: AllowanceType) => void;
}

const AllowanceManageTable: React.FC<Props> = ({ data, onEdit, onDelete }) => {
  const columns: ColumnDef<AllowanceType>[] = [
    {
      accessorKey: "name",
      header: "Allowance Type Name",
      cell: (info) => info.getValue() as string,
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: (info) => info.getValue() as string,
    },
    {
      accessorKey: "is_cash",
      header: "Is Cash",
      cell: ({ row }) => (
        row.original.is_cash ?  <Check className="h-4 w-4 text-green-500" /> :  <X className="h-4 w-4 text-red-500" />
        ),
    },
    {
      accessorKey: "is_taxable",
      header: "Is Taxable",
      cell: ({ row }) => (
        row.original.is_taxable ? <Check className="h-4 w-4 text-green-500" /> :  <X className="h-4 w-4 text-red-500" />
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const allowance = row.original;
        return (
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(allowance)}
            >
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(allowance)}
            >
              Delete
            </Button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (data.length === 0) {
    return (
      <div className="text-center text-gray-500 py-10">
        No allowances defined yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default AllowanceManageTable;
