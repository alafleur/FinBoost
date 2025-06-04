import logoPath from "@assets/Additive logo v1.png";

interface AdditiveLogoProps {
  className?: string;
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function AdditiveLogo({ 
  className = '', 
  variant = 'light',
  size = 'md'
}: AdditiveLogoProps) {
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-12', 
    lg: 'h-16',
    xl: 'h-24'
  };

  // Determine which quadrant of the logo to use based on variant
  const logoStyle = variant === 'light' 
    ? { objectPosition: 'top left' } // White background version
    : { objectPosition: 'top right' }; // Dark background version

  return (
    <div className={`flex items-center ${className}`}>
      <img 
        src={logoPath}
        alt="Additive"
        className={`${sizeClasses[size]} object-cover object-top-left`}
        style={{
          ...logoStyle,
          width: 'auto',
          aspectRatio: '1/1'
        }}
      />
    </div>
  );
}