import { LucideIcon } from "lucide-react";

interface SectionHeaderProps {
  icon: LucideIcon;
  iconColor?: 'blue' | 'yellow' | 'green' | 'orange' | 'red';
  title: string;
  titleSize?: 'lg' | 'xl' | '2xl';
  className?: string;
  showAccentBar?: boolean;
}

const iconColorClasses = {
  blue: 'text-blue-600',
  yellow: 'text-yellow-600',
  green: 'text-emerald-600',
  orange: 'text-orange-600',
  red: 'text-red-600',
};

const titleSizeClasses = {
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
};

export default function SectionHeader({ 
  icon: Icon, 
  iconColor = 'blue', 
  title, 
  titleSize = 'lg',
  className = '',
  showAccentBar = true
}: SectionHeaderProps) {
  return (
    <div className={`${className}`}>
      {showAccentBar && (
        <div className="h-1 w-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-3" />
      )}
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100 ${iconColorClasses[iconColor]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <h3 className={`font-heading font-semibold ${titleSizeClasses[titleSize]} text-gray-900 tracking-tight`}>
          {title}
        </h3>
      </div>
    </div>
  );
}