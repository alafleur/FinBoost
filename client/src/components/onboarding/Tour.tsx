import React, { useCallback } from 'react';
import Joyride, { CallBackProps, STATUS, EVENTS } from 'react-joyride';
import type { TourProps } from './types';

/**
 * Guided Tour Component using react-joyride
 * Provides step-by-step walkthrough of dashboard features
 */
export default function Tour({ 
  isOpen, 
  steps, 
  onComplete, 
  onSkip 
}: TourProps) {
  
  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const { status, type } = data;
    
    // Handle tour completion
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      if (status === STATUS.FINISHED) {
        onComplete();
      } else {
        onSkip();
      }
    }
    
    // Handle close button click
    if (type === EVENTS.TOUR_END && status === STATUS.SKIPPED) {
      onSkip();
    }
  }, [onComplete, onSkip]);

  if (!isOpen) return null;

  return (
    <Joyride
      steps={steps}
      run={isOpen}
      callback={handleJoyrideCallback}
      continuous={true}
      showProgress={true}
      showSkipButton={true}
      disableOverlayClose={false}
      disableCloseOnEsc={false}
      scrollToFirstStep={true}
      scrollDuration={300}
      styles={{
        options: {
          primaryColor: '#3b82f6', // Blue-500
          backgroundColor: '#ffffff',
          textColor: '#374151', // Gray-700
          overlayColor: 'rgba(0, 0, 0, 0.5)',
          spotlightShadow: '0 0 15px rgba(0, 0, 0, 0.5)',
          beaconSize: 36,
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: 12,
          padding: 20,
          fontSize: 14,
          lineHeight: 1.5,
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        tooltipTitle: {
          fontSize: 18,
          fontWeight: 600,
          color: '#1f2937', // Gray-800
          marginBottom: 8,
        },
        tooltipContent: {
          color: '#4b5563', // Gray-600
          lineHeight: 1.6,
        },
        buttonNext: {
          backgroundColor: '#3b82f6', // Blue-500
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 500,
          padding: '8px 16px',
          outline: 'none',
          border: 'none',
        },
        buttonBack: {
          color: '#6b7280', // Gray-500
          marginLeft: 'auto',
          marginRight: 8,
          fontSize: 14,
          fontWeight: 500,
          backgroundColor: 'transparent',
          border: 'none',
          outline: 'none',
        },
        buttonSkip: {
          color: '#6b7280', // Gray-500
          fontSize: 14,
          fontWeight: 500,
          backgroundColor: 'transparent',
          border: 'none',
          outline: 'none',
        },
        beacon: {
          border: '2px solid #3b82f6',
          backgroundColor: '#3b82f6',
        },
        beaconInner: {
          backgroundColor: '#ffffff',
        },
        spotlight: {
          borderRadius: 8,
        }
      }}
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Finish Tour',
        next: 'Next',
        skip: 'Skip Tour',
      }}
    />
  );
}