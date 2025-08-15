// src/components/dashboard/CompanyCard.tsx
import { Company } from '@/stores/companyStore';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface CompanyCardProps {
  company: Company;
}

export const CompanyCard = ({ company }: CompanyCardProps) => {
  const fallbackLetter = company.business_name ? company.business_name.charAt(0).toUpperCase() : 'C';

  return (
    <Link to={`/company/${company.id}/overview`}>
    <Card className="w-full h-48 flex flex-col justify-between hover:border-purple-500 transition-colors duration-200">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">{company.business_name}</CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>View Dashboard</DropdownMenuItem>
            <DropdownMenuItem>Manage Employees</DropdownMenuItem>
            <DropdownMenuItem>Run Payroll</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col justify-end">
        <div className="flex items-center space-x-4">
          <Avatar>
            <AvatarImage src={company.logo_url} alt={company.business_name} />
            <AvatarFallback>{fallbackLetter}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium leading-none">{company.business_name}</p>
            <p className="text-sm text-muted-foreground">{company.business_type || 'N/A'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
    </Link>
  );
};