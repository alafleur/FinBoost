import { LucideIcon } from "lucide-react";

interface SectionHeaderProps {
  icon: LucideIcon;
  iconColor: 'blue' | 'purple' | 'yellow' | 'green' | 'orange' | 'red';
  title: string;
  titleSize?: 'lg' | 'xl' | '2xl';
  className?: string;
}

const iconColorClasses = {
  blue: 'bg-gray-50 text-gray-600 border border-gray-100',
  purple: 'bg-gray-50 text-gray-600 border border-gray-100', 
  yellow: 'bg-gray-50 text-gray-600 border border-gray-100',
  green: 'bg-gray-50 text-gray-600 border border-gray-100',
  orange: 'bg-gray-50 text-gray-600 border border-gray-100',
  red: 'bg-gray-50 text-gray-600 border border-gray-100',
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
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`p-2 ${iconColorClasses[iconColor]} rounded-lg`}>
        <Icon className="h-4 w-4" />
      </div>
      <h3 className={`font-heading font-bold ${titleSizeClasses[titleSize]} text-gray-900`}>
        {title}
      </h3>
    </div>
  );
}