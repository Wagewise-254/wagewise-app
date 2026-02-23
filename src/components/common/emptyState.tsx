import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionIcon?: LucideIcon;
  onAction?: () => void;
  variant?: 'default' | 'warning' | 'danger';
}

const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionIcon: ActionIcon,
  onAction,
  variant = 'default',
}: EmptyStateProps) => {
  
  const iconColors = {
    default: "bg-blue-50 text-blue-600",
    warning: "bg-amber-50 text-amber-600",
    danger: "bg-red-50 text-red-600",
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div className={`p-4 rounded-2xl mb-6 ${iconColors[variant]}`}>
        <Icon className="h-10 w-10" />
      </div>
      
      <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
        {title}
      </h2>
      
      <p className="mt-3 text-slate-500 max-w-sm leading-relaxed">
        {description}
      </p>

      {actionLabel && onAction && (
        <div className="mt-8">
          <Button 
            onClick={onAction} 
            size="lg"
            className="px-8 font-medium shadow-md transition-all hover:shadow-lg active:scale-95 bg-[#1F3A8A] cursor-pointer"
          >
            {ActionIcon && <ActionIcon className="mr-2 h-4 w-4" />}
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};

export default EmptyState;