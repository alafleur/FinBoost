
export function AdditiveLogo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Dollar sign base with integrated A shape */}
      <path 
        d="M12 2v20" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round"
      />
      
      {/* Top curve of dollar sign */}
      <path 
        d="M8 7c0-2.5 1.8-4 4-4s4 1.5 4 4-1.8 4-4 4H8" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* Bottom curve of dollar sign */}
      <path 
        d="M8 17c0 2.5 1.8 4 4 4s4-1.5 4-4-1.8-4-4-4H8" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* Letter A integrated into the center */}
      <path 
        d="M9.5 14.5l2.5-6 2.5 6M10.5 12.5h3" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
