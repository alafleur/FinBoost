import { LucideIcon } from "lucide-react";

interface SectionHeaderProps {
  icon: LucideIcon;
  iconColor: 'blue' | 'purple' | 'yellow' | 'green' | 'orange' | 'red';
  title: string;
  titleSize?: 'lg' | 'xl' | '2xl';
  className?: string;
}

const iconColorClasses = {
  blue: 'bg-blue-100 text-blue-600',
  purple: 'bg-purple-100 text-purple-600', 
  yellow: 'bg-yellow-100 text-yellow-600',
  green: 'bg-green-100 text-green-600',
  orange: 'bg-orange-100 text-orange-600',
  red: 'bg-red-100 text-red-600',
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
      <div className={`p-1.5 ${iconColorClasses[iconColor]} rounded-lg`}>
        <Icon className="h-4 w-4" />
      </div>
      <h3 className={`font-heading font-bold ${titleSizeClasses[titleSize]} text-gray-900`}>
        {title}
      </h3>
    </div>
  );
}