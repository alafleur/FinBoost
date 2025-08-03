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
      {/* Optimized Phone Frame SVG */}
      <svg
        viewBox="0 0 320 640"
        className="w-full h-full max-w-[280px] max-h-[560px] drop-shadow-2xl filter hover:drop-shadow-3xl transition-all duration-300"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
      >
        {/* Consolidated Definitions for Performance */}
        <defs>
          <linearGradient id={`phoneGrad-${testId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#374151" />
            <stop offset="50%" stopColor="#1f2937" />
            <stop offset="100%" stopColor="#111827" />
          </linearGradient>
          <linearGradient id={`screenReflection-${testId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <filter id={`phoneShadow-${testId}`}>
            <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#000000" floodOpacity="0.3"/>
          </filter>
          <clipPath id={`screen-clip-${testId}`}>
            <rect x="25" y="65" width="270" height="510" rx="30" ry="30" />
          </clipPath>
        </defs>
        
        {/* Phone Body - Outer Frame */}
        <rect
          x="10"
          y="10"
          width="300"
          height="620"
          rx="50"
          ry="50"
          fill={`url(#phoneGrad-${testId})`}
          stroke="#4b5563"
          strokeWidth="1"
          filter={`url(#phoneShadow-${testId})`}
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
          fill={`url(#screenReflection-${testId})`}
          opacity="0.1"
        />
        
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
      </svg>
      
      {/* Content Container with Error Boundary */}
      <div 
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{
          top: '10.15%',
          left: '7.8%',
          width: '84.4%',
          height: '79.7%'
        }}
        data-testid={`${testId}-content-area`}
      >
        <div 
          className="w-full h-full rounded-[20px] overflow-hidden bg-white shadow-inner pointer-events-auto"
          style={{
            clipPath: 'inset(0 round 20px)'
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