
export function AdditiveLogo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Central vertical line of dollar sign */}
      <path 
        d="M12 1v22" 
        stroke="currentColor" 
        strokeWidth="2.5" 
        strokeLinecap="round"
      />
      
      {/* Top S curve - modified to create A shape */}
      <path 
        d="M16 8c0-3-2-5-4-5s-4 2-4 5c0 2 1 3 2.5 3.5" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* Bottom S curve */}
      <path 
        d="M8 16c0 3 2 5 4 5s4-2 4-5c0-2-1-3-2.5-3.5" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* A crossbar integrated into design */}
      <path 
        d="M9 11h6" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round"
      />
      
      {/* A triangle top accent */}
      <path 
        d="M10 6l2-3 2 3" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
