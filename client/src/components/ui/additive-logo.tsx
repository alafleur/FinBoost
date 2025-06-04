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
    sm: 'h-8',
    md: 'h-10', 
    lg: 'h-12',
    xl: 'h-16'
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