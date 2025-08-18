import { Company } from '@/stores/companyStore';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface CompanyCardProps {
  company: Company;
}

export const CompanyCard = ({ company }: CompanyCardProps) => {
  const fallbackLetter = company.business_name ? company.business_name.charAt(0).toUpperCase() : 'C';
  const status = 'active'; // default for now
  const statusColor = status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700';

  return (
    <Link to={`/company/${company.id}/overview`}>
      <Card className="w-full h-40 p-4 flex flex-col justify-between hover:border-purple-500 transition-colors duration-200 shadow-sm rounded-lg">
        {/* Top row: Logo, Name, Menu */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={company.logo_url} alt={company.business_name} />
              <AvatarFallback>{fallbackLetter}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-lg font-medium">{company.business_name}</span>
              <span className="text-sm text-muted-foreground">{company.business_type || 'N/A'}</span>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <Link to={`/company/${company.id}/settings`}>
              <DropdownMenuItem>View Settings</DropdownMenuItem>
              </Link>
              <Link to={`/company/${company.id}/hr/employees`}>
                <DropdownMenuItem>Manage Employees</DropdownMenuItem>
              </Link>
              <Link to={`/company/${company.id}/payroll/pay-runs`}>
                <DropdownMenuItem>Run Payroll</DropdownMenuItem>
              </Link>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Status Tag */}
        <div>
          <Badge className={`${statusColor} capitalize px-2 py-0.5 text-xs`}>
            ● {status}
          </Badge>
        </div>
      </Card>
    </Link>
  );
};
