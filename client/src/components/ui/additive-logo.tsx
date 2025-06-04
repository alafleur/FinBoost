export function AdditiveLogo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer triangle */}
      <path 
        d="M50 5 L85 75 L15 75 Z" 
        stroke="currentColor" 
        strokeWidth="4" 
        strokeLinejoin="round"
        fill="none"
      />

      {/* Inner triangle */}
      <path 
        d="M50 20 L70 60 L30 60 Z" 
        stroke="currentColor" 
        strokeWidth="4" 
        strokeLinejoin="round"
        fill="none"
      />

      {/* A crossbar */}
      <path 
        d="M35 55 L65 55" 
        stroke="currentColor" 
        strokeWidth="4" 
        strokeLinecap="round"
      />
    </svg>
  );
}