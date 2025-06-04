import logoPath from "@assets/Additive logo v1.png";

interface AdditiveLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function AdditiveLogo({ 
  className = '', 
  size = 'md'
}: AdditiveLogoProps) {
  const sizeClasses = {
    sm: 'h-6 w-auto',
    md: 'h-8 w-auto', 
    lg: 'h-10 w-auto',
    xl: 'h-12 w-auto'
  };

  return (
    <div className={`flex items-center ${className}`}>
      <div 
        className={`${sizeClasses[size]} bg-cover bg-no-repeat`}
        style={{
          backgroundImage: `url(${logoPath})`,
          backgroundPosition: '0% 0%',
          backgroundSize: '200% 200%',
          aspectRatio: '2.5/1'
        }}
        aria-label="Additive Logo"
      />
    </div>
  );
}