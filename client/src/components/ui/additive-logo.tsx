
export function AdditiveLogo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Dollar sign base */}
      <path 
        d="M12 2v20M8.5 8.5C8.5 6.5 10 5 12 5s3.5 1.5 3.5 3.5-1.5 3.5-3.5 3.5H8.5m0 3h3.5c2 0 3.5 1.5 3.5 3.5S14 19 12 19s-3.5-1.5-3.5-3.5" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      {/* Letter A overlay */}
      <path 
        d="M9 16l1.5-4 1.5 4m-2.5-1.5h2" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
