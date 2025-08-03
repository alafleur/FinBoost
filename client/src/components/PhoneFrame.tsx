import React, { Component, ErrorInfo, ReactNode, memo } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false
  };

  public static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('PhoneFrame ErrorBoundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

/**
 * Props for the PhoneFrame component
 */
interface PhoneFrameProps {
  /** Content to display inside the phone screen */
  children: React.ReactNode;
  /** Additional CSS classes to apply to the component */
  className?: string;
  /** Accessible label for screen readers */
  ariaLabel?: string;
  /** Test identifier for automated testing */
  testId?: string;
}

/**
 * PhoneFrame Component
 * 
 * A reusable component that displays content within a realistic iPhone frame mockup.
 * Features professional styling, accessibility support, error boundaries, and performance optimization.
 * 
 * @param children - Content to display inside the phone screen
 * @param className - Additional CSS classes for styling
 * @param ariaLabel - Accessible description for screen readers
 * @param testId - Identifier for testing frameworks
 * 
 * @example
 * ```tsx
 * <PhoneFrame ariaLabel="App screenshot showing dashboard" testId="dashboard-frame">
 *   <img src="/screenshot.png" alt="Dashboard view" />
 * </PhoneFrame>
 * ```
 */
const PhoneFrame = memo(function PhoneFrame({ 
  children, 
  className = "", 
  ariaLabel = "Mobile app screenshot in phone frame",
  testId = "phone-frame"
}: PhoneFrameProps) {
  return (
    <div 
      className={`relative inline-block transform transition-all duration-300 hover:scale-105 focus-within:scale-105 ${className}`}
      role="img"
      aria-label={ariaLabel}
      data-testid={testId}
      tabIndex={0}
      onKeyDown={(e) => {
        // Accessibility: Allow Enter/Space to focus content
        if (e.key === 'Enter' || e.key === ' ') {
          const contentArea = e.currentTarget.querySelector('[data-testid$="-content-area"]');
          if (contentArea) {
            (contentArea as HTMLElement).focus();
          }
        }
      }}
    >
      {/* Premium Modern Phone Frame SVG */}
      <svg
        viewBox="0 0 340 680"
        className="w-full h-full max-w-[300px] max-h-[600px] drop-shadow-2xl filter hover:drop-shadow-3xl transition-all duration-300"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
      >
        {/* Enhanced Definitions for Premium Look */}
        <defs>
          {/* Main phone gradient - more realistic titanium/space gray */}
          <linearGradient id={`phoneGrad-${testId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b9dc3" />
            <stop offset="30%" stopColor="#6b7280" />
            <stop offset="70%" stopColor="#374151" />
            <stop offset="100%" stopColor="#1f2937" />
          </linearGradient>
          
          {/* Phone body shadow for depth */}
          <linearGradient id={`phoneShadow-${testId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#000000" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.1" />
          </linearGradient>
          
          {/* Screen reflection effect */}
          <linearGradient id={`screenReflection-${testId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.15" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          {/* Button highlights */}
          <linearGradient id={`buttonGrad-${testId}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#9ca3af" />
            <stop offset="50%" stopColor="#6b7280" />
            <stop offset="100%" stopColor="#4b5563" />
          </linearGradient>
          
          {/* Enhanced shadow filter */}
          <filter id={`phoneShadow-${testId}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="6"/>
            <feOffset dx="0" dy="8" result="offset"/>
            <feFlood floodColor="#000000" floodOpacity="0.25"/>
            <feComposite in2="offset" operator="in"/>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          {/* Screen clip path with proper rounded corners */}
          <clipPath id={`screen-clip-${testId}`}>
            <rect x="28" y="80" width="284" height="520" rx="40" ry="40" />
          </clipPath>
        </defs>
        
        {/* Phone Body - Main Frame with realistic proportions */}
        <rect
          x="8"
          y="8"
          width="324"
          height="664"
          rx="58"
          ry="58"
          fill={`url(#phoneGrad-${testId})`}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="0.5"
          filter={`url(#phoneShadow-${testId})`}
        />
        
        {/* Side button details - Volume buttons */}
        <rect
          x="4"
          y="140"
          width="4"
          height="28"
          rx="2"
          ry="2"
          fill={`url(#buttonGrad-${testId})`}
        />
        <rect
          x="4"
          y="180"
          width="4"
          height="28"
          rx="2"
          ry="2"
          fill={`url(#buttonGrad-${testId})`}
        />
        
        {/* Power button */}
        <rect
          x="332"
          y="160"
          width="4"
          height="48"
          rx="2"
          ry="2"
          fill={`url(#buttonGrad-${testId})`}
        />
        
        {/* Camera module area (top) */}
        <rect
          x="20"
          y="20"
          width="300"
          height="50"
          rx="25"
          ry="25"
          fill="rgba(0,0,0,0.8)"
        />
        
        {/* Screen Bezel - More realistic black border */}
        <rect
          x="25"
          y="75"
          width="290"
          height="530"
          rx="45"
          ry="45"
          fill="#000000"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="0.3"
        />
        
        {/* Dynamic Island - More accurate size and position */}
        <rect
          x="140"
          y="35"
          width="60"
          height="24"
          rx="12"
          ry="12"
          fill="#000000"
        />
        
        {/* Front camera (visible through Dynamic Island) */}
        <circle
          cx="155"
          cy="47"
          r="4"
          fill="#1a1a1a"
        />
        
        {/* Screen reflection overlay for realism */}
        <rect
          x="28"
          y="80"
          width="284"
          height="520"
          rx="40"
          ry="40"
          fill={`url(#screenReflection-${testId})`}
          opacity="0.6"
        />
        
        {/* Home indicator - Modern swipe bar */}
        <rect
          x="150"
          y="625"
          width="40"
          height="4"
          rx="2"
          ry="2"
          fill="#666666"
          opacity="0.8"
        />
        
        {/* Subtle edge highlights for premium feel */}
        <rect
          x="8"
          y="8"
          width="324"
          height="664"
          rx="58"
          ry="58"
          fill="none"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="0.5"
          opacity="0.6"
        />
      </svg>
      
      {/* Content Container with Error Boundary */}
      <div 
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{
          top: '11.8%',
          left: '8.2%',
          width: '83.5%',
          height: '76.5%'
        }}
        data-testid={`${testId}-content-area`}
      >
        <div 
          className="w-full h-full rounded-[32px] overflow-hidden bg-white shadow-inner pointer-events-auto"
          style={{
            clipPath: 'inset(0 round 32px)'
          }}
          role="presentation"
        >
          <div className="w-full h-full relative">
            <ErrorBoundary fallback={
              <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-500 text-sm">
                Content unavailable
              </div>
            }>
              {children}
            </ErrorBoundary>
            {/* Subtle screen overlay for realism */}
            <div 
              className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/5 pointer-events-none" 
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    </div>
  );
});

export default PhoneFrame;