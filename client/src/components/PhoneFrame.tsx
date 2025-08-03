import React from 'react';

interface PhoneFrameProps {
  children: React.ReactNode;
  className?: string;
}

export default function PhoneFrame({ children, className = "" }: PhoneFrameProps) {
  return (
    <div className={`relative inline-block transform transition-all duration-300 hover:scale-105 ${className}`}>
      {/* Phone Frame SVG */}
      <svg
        viewBox="0 0 320 640"
        className="w-full h-full max-w-[280px] max-h-[560px] drop-shadow-2xl filter hover:drop-shadow-3xl transition-all duration-300"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Phone Body - Outer Frame with Gradient */}
        <defs>
          <linearGradient id="phoneGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#374151" />
            <stop offset="50%" stopColor="#1f2937" />
            <stop offset="100%" stopColor="#111827" />
          </linearGradient>
          <filter id="phoneShadow">
            <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#000000" floodOpacity="0.3"/>
          </filter>
        </defs>
        <rect
          x="10"
          y="10"
          width="300"
          height="620"
          rx="50"
          ry="50"
          fill="url(#phoneGrad)"
          stroke="#4b5563"
          strokeWidth="1"
          filter="url(#phoneShadow)"
        />
        
        {/* Screen Bezel */}
        <rect
          x="20"
          y="60"
          width="280"
          height="520"
          rx="35"
          ry="35"
          fill="#000000"
          stroke="#1f2937"
          strokeWidth="0.5"
        />
        
        {/* Screen Reflection Effect */}
        <rect
          x="25"
          y="65"
          width="270"
          height="510"
          rx="30"
          ry="30"
          fill="url(#screenReflection)"
          opacity="0.1"
        />
        
        <defs>
          <linearGradient id="screenReflection" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Dynamic Island */}
        <rect
          x="130"
          y="25"
          width="60"
          height="20"
          rx="10"
          ry="10"
          fill="#000000"
        />
        
        {/* Home Indicator */}
        <rect
          x="140"
          y="600"
          width="40"
          height="4"
          rx="2"
          ry="2"
          fill="#6b7280"
        />
        
        {/* Screen Content Area - Clipping Path */}
        <defs>
          <clipPath id="screen-clip">
            <rect
              x="25"
              y="65"
              width="270"
              height="510"
              rx="30"
              ry="30"
            />
          </clipPath>
        </defs>
      </svg>
      
      {/* Content Container - Positioned absolutely over the screen area */}
      <div 
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{
          top: '10.15%',
          left: '7.8%',
          width: '84.4%',
          height: '79.7%'
        }}
      >
        <div 
          className="w-full h-full rounded-[20px] overflow-hidden bg-white shadow-inner pointer-events-auto"
          style={{
            clipPath: 'inset(0 round 20px)'
          }}
        >
          <div className="w-full h-full relative">
            {children}
            {/* Subtle screen overlay for realism */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/5 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
}