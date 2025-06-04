import logoPath from "@assets/Additive logo v2.png";

interface AdditiveLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function AdditiveLogo({ 
  className = '', 
  size = 'md'
}: AdditiveLogoProps) {
  const sizeClasses = {
    sm: 'h-12',
    md: 'h-16', 
    lg: 'h-20',
    xl: 'h-24'
  };

  return (
    <div className={`flex items-center ${className}`}>
      <img 
        src={logoPath}
        alt="Additive"
        className={`${sizeClasses[size]} w-auto object-contain`}
      />
    </div>
  );
}