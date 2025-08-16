// src/pages/company/hr/EmployeesPage.tsx
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useHrStore } from '@/stores/hrStore';
import  AddEmployeeDialog  from '@/components/company/hr/AddEmployeeDialog';
import  EmployeesTable  from '@/components/company/hr/EmployeesTable';

const EmployeesPage = () => {
   const { companyId } = useParams<{ companyId: string }>();
  const { fetchEmployees } = useHrStore();

  useEffect(() => {
    if (companyId) {
      fetchEmployees(companyId);
    }
  }, [companyId, fetchEmployees]);


 return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Employees</h2>
        <div className="flex items-center space-x-2">
          <AddEmployeeDialog />
        </div>
      </div>
      <EmployeesTable />
    </div>
  );
};

export default EmployeesPage;