// src/components/company/hr/employee/EmployeeDetailsDialog.tsx

import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Employee } from "@/stores/hrStore";
import { format } from 'date-fns';

interface EmployeeDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
}
interface InfoItem {
  label: string;
  value: string | boolean;
  isStatus?: boolean;
}

const EmployeeDetailsDialog: React.FC<EmployeeDetailsDialogProps> = ({ isOpen, onClose, employee }) => {
  if (!employee) return null;

  const formatDate = (dateString: string | null) => {
    return dateString ? format(new Date(dateString), 'PPP') : 'N/A';
  };

  const personalInfo = [
    { label: 'Full Name', value: `${employee.first_name} ${employee.last_name} ${employee.other_names || ''}`.trim() },
    { label: 'Employee No.', value: employee.employee_number },
    { label: 'Email', value: employee.email || 'N/A' },
    { label: 'Phone', value: employee.phone || 'N/A' },
    { label: 'Date of Birth', value: formatDate(employee.date_of_birth) },
    { label: 'Gender', value: employee.gender || 'N/A' },
    { label: 'Citizenship', value: employee.citizenship || 'N/A' },
    { label: 'Disability Status', value: employee.has_disability ? 'Yes' : 'No' },
  ];

  const employmentInfo = [
    { label: 'Date Joined', value: formatDate(employee.date_joined) },
    { label: 'Job Title', value: employee.job_title || 'N/A' },
    { label: 'Job Type', value: employee.job_type || 'N/A' },
    { label: 'Department', value: employee.departments?.name || 'N/A' },
    { label: 'Status', value: employee.employee_status, isStatus: true },
    { label: 'Status Effective Date', value: formatDate(employee.employee_status_effective_date) },
    { label: 'Employee Type', value: employee.employee_type || 'N/A' },
  ];

  const financialInfo = [
    { label: 'Salary', value: employee.salary ? `Ksh ${employee.salary.toFixed(2)}` : 'N/A' },
    { label: 'Pays PAYE', value: employee.pays_paye ? 'Yes' : 'No' },
    { label: 'Pays NSSF', value: employee.pays_nssf ? 'Yes' : 'No' },
    { label: 'Pays HELB', value: employee.pays_helb ? 'Yes' : 'No' },
    { label: 'Pays Housing Levy', value: employee.pays_housing_levy ? 'Yes' : 'No' },
  ];

  const identificationInfo = [
    { label: 'ID Type', value: employee.id_type || 'N/A' },
    { label: 'ID Number', value: employee.id_number || 'N/A' },
    { label: 'KRA PIN', value: employee.krapin || 'N/A' },
    { label: 'SHIF Number', value: employee.shif_number || 'N/A' },
    { label: 'NSSF Number', value: employee.nssf_number || 'N/A' },
  ];

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'On Leave':
        return 'bg-orange-100 text-orange-800';
      case 'Terminated':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderInfoList = (infoItems: InfoItem[]) => (
    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {infoItems.map((item, index) => (
        <li key={index} className="flex flex-col">
          <span className="font-semibold text-sm text-gray-500">{item.label}</span>
          {item.isStatus ? (
            <Badge className={getStatusVariant(item.value as string)}>{item.value}</Badge>
          ) : (
            <span className="text-sm font-medium">{item.value}</span>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className='font-bold text-xl'>Employee Details: {employee.first_name} {employee.last_name}</DialogTitle>
          <DialogDescription>
            Detailed information about the employee.
          </DialogDescription>
        </DialogHeader>
        <Accordion type="multiple" defaultValue={["item-1", "item-2", "item-3", "item-4"]} className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger className='text-[#7F5EFD] text-md font-medium'>Personal Information</AccordionTrigger>
            <AccordionContent>
              {renderInfoList(personalInfo)}
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger className='text-[#7F5EFD] text-md font-medium'>Employment Information</AccordionTrigger>
            <AccordionContent>
              {renderInfoList(employmentInfo)}
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger className='text-[#7F5EFD] text-md font-medium'>Financial Information</AccordionTrigger>
            <AccordionContent>
              {renderInfoList(financialInfo)}
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-4">
            <AccordionTrigger className='text-[#7F5EFD] text-md font-medium'>Identification & Statutory Numbers</AccordionTrigger>
            <AccordionContent>
              {renderInfoList(identificationInfo)}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </DialogContent>
    </Dialog>
  );
};

export default EmployeeDetailsDialog;