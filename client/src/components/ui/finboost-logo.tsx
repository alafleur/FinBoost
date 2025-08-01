
import logoPath from "@/assets/finboost-logo-v9.png";

interface FinBoostLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function FinBoostLogo({ 
  className = '', 
  size = 'md'
}: FinBoostLogoProps) {
  const sizeClasses = {
    sm: 'h-6',
    md: 'h-8', 
    lg: 'h-10',
    xl: 'h-12'
  };

  return (
    <div className={`flex items-center ${className}`}>
      <img 
        src={logoPath}
        alt="FinBoost"
        className={`${sizeClasses[size]} w-auto object-contain`}
      />
    </div>
  );
}
