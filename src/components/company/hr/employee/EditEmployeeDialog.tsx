import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useHrStore, Employee } from '@/stores/hrStore';
import { toast } from 'sonner'; // Assuming your Employee type is here

interface EditEmployeeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
}

const EditEmployeeDialog: React.FC<EditEmployeeDialogProps> = ({ isOpen, onClose, employee }) => {
  const [formData, setFormData] = useState<Partial<Employee>>({});
  const { departments, fetchDepartments, updateEmployee } = useHrStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (employee) {
      setFormData(employee);
    }
  }, [employee]);

  useEffect(() => {
    // Fetch departments if needed
    if (isOpen && employee?.company_id) {
      fetchDepartments(employee.company_id);
    }
  }, [isOpen, employee?.company_id, fetchDepartments]);

const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  const { id, value } = e.target;
  const newValue = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : value; // Use type assertion for checkboxes
  setFormData(prev => ({
    ...prev,
    [id]: newValue,
  }));
};

  const handleSelectChange = (value: string, id: string) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee?.company_id || !employee?.id || !formData) return;

    setLoading(true);
    const success = await updateEmployee(employee.company_id, employee.id, formData);
    setLoading(false);

    if (success) {
      toast.success('Employee updated successfully.');
      onClose();
    } else {
      toast.error('Failed to update employee.');
    }
  };

  if (!employee) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Employee</DialogTitle>
          <DialogDescription>
            Make changes to the employee details.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="employee_number">Employee Number</Label>
              <Input id="employee_number" value={formData.employee_number || ''} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input id="first_name" value={formData.first_name || ''} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input id="last_name" value={formData.last_name || ''} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="other_names">Other Names</Label>
              <Input id="other_names" value={formData.other_names || ''} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={formData.email || ''} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={formData.phone || ''} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Date of Birth</Label>
              <Input id="date_of_birth" type="date" value={formData.date_of_birth?.split('T')[0] || ''} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select onValueChange={(value) => handleSelectChange(value, 'gender')} value={formData.gender || ''}>
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
              <Select onValueChange={(value) => handleSelectChange(value, 'citizenship')} value={formData.citizenship || ''}>
                <SelectTrigger>
                  <SelectValue placeholder="Select citizenship" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Kenyan">Kenyan</SelectItem>
                  <SelectItem value="Non-Kenyan">Non-Kenyan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date_joined">Date Joined</Label>
              <Input id="date_joined" type="date" value={formData.date_joined?.split('T')[0] || ''} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="job_title">Job Title</Label>
              <Input id="job_title" value={formData.job_title || ''} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="job_type">Job Type</Label>
              <Select onValueChange={(value) => handleSelectChange(value, 'job_type')} value={formData.job_type || ''}>
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
              <Select onValueChange={(value) => handleSelectChange(value, 'employee_type')} value={formData.employee_type || ''}>
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
              <Select onValueChange={(value) => handleSelectChange(value, 'department_id')} value={formData.department_id || ''}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="salary">Salary</Label>
              <Input id="salary" type="number" value={formData.salary || 0} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="id_type">ID Type</Label>
              <Select onValueChange={(value) => handleSelectChange(value, 'id_type')} value={formData.id_type || ''}>
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
              <Input id="id_number" value={formData.id_number || ''} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="krapin">KRA PIN</Label>
              <Input id="krapin" value={formData.krapin || ''} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shif_number">SHIF Number</Label>
              <Input id="shif_number" value={formData.shif_number || ''} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nssf_number">NSSF Number</Label>
              <Input id="nssf_number" value={formData.nssf_number || ''} onChange={handleInputChange} />
            </div>
            <div className="flex items-center space-x-2 md:col-span-2">
              <input
                type="checkbox"
                id="has_disability"
                checked={!!formData.has_disability}
                onChange={handleInputChange}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <Label htmlFor="has_disability">Has Disability</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditEmployeeDialog;