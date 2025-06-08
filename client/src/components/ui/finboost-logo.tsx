
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
    sm: 'h-12',
    md: 'h-16', 
    lg: 'h-24',
    xl: 'h-32'
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
