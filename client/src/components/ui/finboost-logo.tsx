
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
    sm: 'h-16',
    md: 'h-20', 
    lg: 'h-32',
    xl: 'h-40'
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
