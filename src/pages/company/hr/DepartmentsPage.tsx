import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useHrStore } from '@/stores/hrStore';
import  AddDepartmentDialog  from '@/components/company/hr/AddDepartmentDialog'; // Assuming you have this
import  DepartmentsTable  from '@/components/company/hr/DepartmentsTable';

const DepartmentsPage: React.FC = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const { fetchDepartments } = useHrStore();

  useEffect(() => {
    if (companyId) {
      fetchDepartments(companyId);
    }
  }, [companyId, fetchDepartments]);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Departments</h2>
        <div className="flex items-center space-x-2">
          <AddDepartmentDialog />
        </div>
      </div>
      <DepartmentsTable />
    </div>
  );
};

export default DepartmentsPage;