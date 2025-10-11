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

const ACCENT = "#7F5EFD";

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
        return 'bg-green-100 text-green-700 border border-green-300';
      case 'On Leave':
        return 'bg-orange-100 text-orange-700 border border-orange-300';
      case 'Terminated':
        return 'bg-red-100 text-red-700 border border-red-300';
      default:
        return 'bg-gray-100 text-gray-700 border border-gray-300';
    }
  };

  const renderInfoList = (infoItems: InfoItem[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
      {infoItems.map((item, index) => (
        <div key={index} className="flex flex-col border-b border-gray-100 pb-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {item.label}
          </span>
          {item.isStatus ? (
            <Badge className={`mt-1 w-fit px-2 py-0.5 rounded-md text-xs font-medium ${getStatusVariant(item.value as string)}`}>
              {item.value}
            </Badge>
          ) : (
            <span className="text-sm font-medium text-gray-900 mt-0.5">
              {item.value}
            </span>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto bg-white border-none p-6 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-bold text-xl text-gray-900">
            Employee Details
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500 mt-1">
            {employee.first_name} {employee.last_name}
          </DialogDescription>
        </DialogHeader>

        <Accordion 
          type="single" 
          collapsible 
          defaultValue="personal" 
          className="w-full mt-4 space-y-2"
        >
          <AccordionItem value="personal" className="border border-gray-200 rounded-lg">
            <AccordionTrigger className={`px-4 py-2 text-[${ACCENT}] font-semibold`}>
              Personal Information
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              {renderInfoList(personalInfo)}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="employment" className="border border-gray-200 rounded-lg">
            <AccordionTrigger className={`px-4 py-2 text-[${ACCENT}] font-semibold`}>
              Employment Information
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              {renderInfoList(employmentInfo)}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="financial" className="border border-gray-200 rounded-lg">
            <AccordionTrigger className={`px-4 py-2 text-[${ACCENT}] font-semibold`}>
              Financial Information
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              {renderInfoList(financialInfo)}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="identification" className="border border-gray-200 rounded-lg">
            <AccordionTrigger className={`px-4 py-2 text-[${ACCENT}] font-semibold`}>
              Identification & Statutory Numbers
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              {renderInfoList(identificationInfo)}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </DialogContent>
    </Dialog>
  );
};

export default EmployeeDetailsDialog;
