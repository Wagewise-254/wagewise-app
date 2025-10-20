// src/components/company/hr/AddEmployeeDialog.tsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Loader2 } from 'lucide-react';
import { useHrStore } from '@/stores/hrStore';
import { toast } from 'sonner';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const AddEmployeeDialog: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    other_names: '',
    email: '',
    phone: '',
    employee_number: '',
    date_of_birth: '',
    gender: '',
    date_joined: new Date().toISOString().split('T')[0],
    job_title: '',
    job_type: 'Full-time', // Default to 'Full-time'
    id_type: 'National ID', // Default to 'National ID'
    id_number: '',
    krapin: '',
    shif_number: '',
    nssf_number: '',
    citizenship: 'Kenyan', // Default to 'Kenyan'
    has_disability: false,
    salary: 0,
    employee_type: 'Primary', // Default to 'Primary'
    department_id: '',
  });
  const { companyId } = useParams();
  const { departments, loading: departmentsLoading, fetchDepartments, addEmployee } = useHrStore();
  const [addLoading, setAddLoading] = useState(false);

  useEffect(() => {
    if (isOpen && companyId) {
      fetchDepartments(companyId);
    }
  }, [isOpen, companyId, fetchDepartments]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSelectChange = (value: string, id: string) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !formData.first_name || !formData.last_name || !formData.employee_number || !formData.salary) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setAddLoading(true);
    const success = await addEmployee(companyId, {
      ...formData,
      salary: parseFloat(String(formData.salary)),
      department_id: formData.department_id || null,
      employee_status: 'Active',
      employee_status_effective_date: new Date().toISOString().split('T')[0],
      pays_paye: true,
      pays_nssf: true,
      pays_helb: false,
      pays_housing_levy: true,
    });
    setAddLoading(false);

    if (success) {
      setIsOpen(false);
      setFormData({
        first_name: '',
        last_name: '',
        other_names: '',
        email: '',
        phone: '',
        employee_number: '',
        date_of_birth: '',
        gender: '',
        date_joined: new Date().toISOString().split('T')[0],
        job_title: '',
        job_type: 'Full-time',
        id_type: 'National ID',
        id_number: '',
        krapin: '',
        shif_number: '',
        nssf_number: '',
        citizenship: 'Kenyan',
        has_disability: false,
        salary: 0,
        employee_type: 'Primary',
        department_id: '',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button  className='bg-[#7F5EFD]' onClick={() => setIsOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Employee
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Employee</DialogTitle>
          <DialogDescription>
            Enter the details for the new employee. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {/* Personal and Employment Details */}
            <div className="space-y-2">
              <Label htmlFor="employee_number">Employee Number *</Label>
              <Input id="employee_number" value={formData.employee_number} onChange={handleInputChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name *</Label>
              <Input id="first_name" value={formData.first_name} onChange={handleInputChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name *</Label>
              <Input id="last_name" value={formData.last_name} onChange={handleInputChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="other_names">Other Names</Label>
              <Input id="other_names" value={formData.other_names} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={formData.email} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={formData.phone} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Date of Birth</Label>
              <Input id="date_of_birth" type="date" value={formData.date_of_birth} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select onValueChange={(value) => handleSelectChange(value, 'gender')} value={formData.gender}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="citizenship">Citizenship</Label>
              <Select onValueChange={(value) => handleSelectChange(value, 'citizenship')} value={formData.citizenship}>
                <SelectTrigger>
                  <SelectValue placeholder="Select citizenship" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Kenyan">Kenyan</SelectItem>
                  <SelectItem value="Non-Kenyan">Non-Kenyan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Employment and Statutory Details */}
            <div className="space-y-2">
              <Label htmlFor="date_joined">Date Joined *</Label>
              <Input id="date_joined" type="date" value={formData.date_joined} onChange={handleInputChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="job_title">Job Title</Label>
              <Input id="job_title" value={formData.job_title} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="job_type">Job Type</Label>
              <Select onValueChange={(value) => handleSelectChange(value, 'job_type')} value={formData.job_type}>
                <SelectTrigger>
                  <SelectValue placeholder="Select job type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Full-time">Full-time</SelectItem>
                  <SelectItem value="Partime">Part-time</SelectItem>
                  <SelectItem value="Contract">Contract</SelectItem>
                  <SelectItem value="Internship">Internship</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee_type">Employee Type</Label>
              <Select onValueChange={(value) => handleSelectChange(value, 'employee_type')} value={formData.employee_type}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Primary Employee">Primary Employee</SelectItem>
                  <SelectItem value="Secondary Employee">Secondary Employee</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="department_id">Department</Label>
              <Select onValueChange={(value) => handleSelectChange(value, 'department_id')} value={formData.department_id} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a department" />
                </SelectTrigger>
                <SelectContent>
                  {departmentsLoading ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading departments...
                    </div>
                  ) : departments.length > 0 ? (
                    departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="" disabled>
                      No departments available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="salary">Salary *</Label>
              <Input id="salary" type="number" value={formData.salary} onChange={handleInputChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="id_type">ID Type</Label>
              <Select onValueChange={(value) => handleSelectChange(value, 'id_type')} value={formData.id_type}>
                <SelectTrigger>
                  <SelectValue placeholder="Select ID type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="National ID">National ID</SelectItem>
                  <SelectItem value="Passport">Passport</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="id_number">ID Number</Label>
              <Input id="id_number" value={formData.id_number} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="krapin">KRA PIN</Label>
              <Input id="krapin" value={formData.krapin} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shif_number">SHIF Number</Label>
              <Input id="shif_number" value={formData.shif_number} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nssf_number">NSSF Number</Label>
              <Input id="nssf_number" value={formData.nssf_number} onChange={handleInputChange} />
            </div>
            <div className="flex items-center space-x-2 md:col-span-2">
              <input
                type="checkbox"
                id="has_disability"
                checked={formData.has_disability}
                onChange={handleInputChange}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <Label htmlFor="has_disability">Has Disability</Label>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={addLoading}>
              {addLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEmployeeDialog;