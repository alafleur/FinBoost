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
      {/* Clean Realistic iPhone Frame */}
      <svg
        viewBox="0 0 300 600"
        className="w-full h-full max-w-[280px] max-h-[560px] drop-shadow-xl transition-all duration-300"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          {/* Phone body gradient */}
          <linearGradient id={`phoneGrad-${testId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6b7280" />
            <stop offset="100%" stopColor="#374151" />
          </linearGradient>
          
          {/* Screen reflection */}
          <linearGradient id={`screenReflection-${testId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Phone Body */}
        <rect
          x="5"
          y="5"
          width="290"
          height="590"
          rx="48"
          ry="48"
          fill={`url(#phoneGrad-${testId})`}
          stroke="#4b5563"
          strokeWidth="1"
        />
        
        {/* Screen */}
        <rect
          x="12"
          y="12"
          width="276"
          height="576"
          rx="42"
          ry="42"
          fill="#000000"
        />
        
        {/* Dynamic Island */}
        <rect
          x="125"
          y="26"
          width="50"
          height="18"
          rx="9"
          ry="9"
          fill="#000000"
        />
        
        {/* Home indicator */}
        <rect
          x="135"
          y="576"
          width="30"
          height="3"
          rx="1.5"
          ry="1.5"
          fill="#666666"
        />
        
        {/* Side buttons */}
        <rect x="2" y="120" width="3" height="24" rx="1.5" fill="#4b5563" />
        <rect x="2" y="150" width="3" height="24" rx="1.5" fill="#4b5563" />
        <rect x="295" y="135" width="3" height="36" rx="1.5" fill="#4b5563" />
      </svg>
      
      {/* Content Container with Error Boundary */}
      <div 
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{
          top: '4%',
          left: '4%',
          width: '92%',
          height: '92%'
        }}
        data-testid={`${testId}-content-area`}
      >
        <div 
          className="w-full h-full rounded-[42px] overflow-hidden bg-white pointer-events-auto"
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