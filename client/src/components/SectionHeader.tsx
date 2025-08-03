import { LucideIcon } from "lucide-react";

interface SectionHeaderProps {
  icon: LucideIcon;
  iconColor: 'blue' | 'yellow' | 'green' | 'orange' | 'red';
  title: string;
  titleSize?: 'lg' | 'xl' | '2xl';
  className?: string;
}

const iconColorClasses = {
  blue: 'dashboard-icon-primary text-accent',
  yellow: 'dashboard-icon-neutral text-gray-600',
  green: 'dashboard-icon-success text-emerald-600',
  orange: 'dashboard-icon-neutral text-orange-600',
  red: 'dashboard-icon-neutral text-red-600',
};

const titleSizeClasses = {
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
};

export default function SectionHeader({ 
  icon: Icon, 
  iconColor, 
  title, 
  titleSize = 'lg',
  className = '' 
}: SectionHeaderProps) {
  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div className={`${iconColorClasses[iconColor]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <h3 className={`font-heading font-semibold ${titleSizeClasses[titleSize]} text-gray-900 tracking-tight`}>
        {title}
      </h3>
    </div>
  );
}