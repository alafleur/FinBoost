
import logoPath from "@assets/FinBoost logo v1_1749412447920.png";

interface FinBoostLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function FinBoostLogo({ 
  className = '', 
  size = 'md'
}: FinBoostLogoProps) {
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-12', 
    lg: 'h-16',
    xl: 'h-20'
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
