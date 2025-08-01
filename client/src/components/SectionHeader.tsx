import { LucideIcon } from "lucide-react";

interface SectionHeaderProps {
  icon: LucideIcon;
  iconColor: 'blue' | 'purple' | 'yellow' | 'green' | 'orange' | 'red';
  title: string;
  titleSize?: 'lg' | 'xl' | '2xl';
  className?: string;
}

const iconColorClasses = {
  blue: 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg',
  purple: 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg', 
  yellow: 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg',
  green: 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg',
  orange: 'bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-lg',
  red: 'bg-gradient-to-br from-red-500 to-pink-600 text-white shadow-lg',
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
    <div className={`flex items-center space-x-4 ${className}`}>
      <div className={`p-3 ${iconColorClasses[iconColor]} rounded-xl`}>
        <Icon className="h-6 w-6" />
      </div>
      <h3 className={`font-heading font-bold ${titleSizeClasses[titleSize]} bg-gradient-to-r from-gray-800 to-gray-900 bg-clip-text text-transparent`}>
        {title}
      </h3>
    </div>
  );
}