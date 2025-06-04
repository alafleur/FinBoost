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

  const logoColor = variant === 'light' ? '#374151' : '#FFFFFF'; // Gray-700 for light, white for dark

  return (
    <div className={`flex items-center ${className}`}>
      <svg 
        className={sizeClasses[size]}
        viewBox="0 0 200 120" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Triangle A logo */}
        <g>
          {/* Outer triangle */}
          <path 
            d="M50 20 L10 80 L90 80 Z" 
            fill="none" 
            stroke={logoColor} 
            strokeWidth="6" 
            strokeLinejoin="round"
          />
          {/* Inner triangle */}
          <path 
            d="M50 35 L25 65 L75 65 Z" 
            fill="none" 
            stroke={logoColor} 
            strokeWidth="6" 
            strokeLinejoin="round"
          />
          {/* Center A bar */}
          <line 
            x1="37" y1="58" 
            x2="63" y2="58" 
            stroke={logoColor} 
            strokeWidth="6" 
            strokeLinecap="round"
          />
        </g>
        
        {/* ADDITIVE text */}
        <text 
          x="100" 
          y="65" 
          fill={logoColor} 
          fontSize="24" 
          fontFamily="system-ui, -apple-system, sans-serif" 
          fontWeight="600"
          letterSpacing="0.1em"
        >
          ADDITIVE
        </text>
      </svg>
    </div>
  );
}