
import React, { useEffect, useRef, useState } from "react";

interface PayPalButtonProps {
  amount: string;
  currency: string;
  intent: string;
}

declare global {
  interface Window {
    paypal?: any;
  }
}

export default function PayPalButtonSimple({
  amount,
  currency,
  intent,
}: PayPalButtonProps) {
  console.log('PayPal component rendered with props:', { amount, currency, intent });
  const paypalRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasRendered, setHasRendered] = useState(false);

  useEffect(() => {
    if (hasRendered) return;

    const initializePayPal = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get client ID from environment or use fallback
        const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID || 'AZDxjDScFpQtjWTOUtWKbyN_bDt4OgqaF4eYXlewfBP4-8aqX3PiV8e1GWU6liB2CUXlkA59kJXE7M6R';
        console.log('Using PayPal client ID:', clientId.substring(0, 10) + '...');

        // Check if PayPal SDK is already loaded
        if (window.paypal) {
          console.log('PayPal SDK already available');
          await renderPayPalButtons();
          return;
        }

        // Load PayPal SDK
        console.log('Loading PayPal SDK...');
        await loadPayPalSDK(clientId);
        
        // Wait a moment for SDK to initialize
        setTimeout(async () => {
          if (window.paypal) {
            console.log('PayPal SDK loaded successfully');
            await renderPayPalButtons();
          } else {
            throw new Error('PayPal SDK failed to load');
          }
        }, 500);

      } catch (error) {
        console.error('PayPal initialization error:', error);
        setError(error instanceof Error ? error.message : 'PayPal initialization failed');
        setIsLoading(false);
      }
    };

    const loadPayPalSDK = (clientId: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        // Remove any existing PayPal scripts
        const existingScript = document.querySelector('script[src*="paypal.com/sdk"]');
        if (existingScript) {
          existingScript.remove();
        }

        const script = document.createElement('script');
        script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}&intent=${intent}&components=buttons`;
        script.async = true;
        
        script.onload = () => {
          console.log('PayPal SDK script loaded');
          resolve();
        };
        
        script.onerror = () => {
          console.error('PayPal SDK script failed to load');
          reject(new Error('Failed to load PayPal SDK'));
        };
        
        document.head.appendChild(script);
      });
    };

    const renderPayPalButtons = async (): Promise<void> => {
      if (!window.paypal) {
        throw new Error('PayPal SDK not available');
      }
      
      if (!paypalRef.current) {
        throw new Error('PayPal container not available');
      }
      
      if (hasRendered) {
        console.log('PayPal buttons already rendered');
        return;
      }

      console.log('Rendering PayPal buttons...');
      
      try {
        await window.paypal.Buttons({
          createOrder: async () => {
            try {
              console.log('Creating PayPal order...');
              const token = localStorage.getItem('token');
              if (!token) {
                throw new Error('Authentication required');
              }
              
              const response = await fetch('/api/paypal/order', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  amount: parseFloat(amount),
                  currency: currency,
                  intent: intent
                })
              });
              
              if (!response.ok) {
                const errorText = await response.text();
                console.error('Order creation failed:', response.status, errorText);
                throw new Error(`Order creation failed: ${response.status}`);
              }
              
              const data = await response.json();
              console.log('Order created:', data);
              
              if (!data.id) {
                throw new Error('No order ID received');
              }
              
              return data.id;
            } catch (error) {
              console.error('Error in createOrder:', error);
              throw error;
            }
          },
          
          onApprove: async (data: any) => {
            try {
              console.log('Payment approved, capturing order:', data.orderID);
              const token = localStorage.getItem('token');
              
              const response = await fetch(`/api/paypal/order/${data.orderID}/capture`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                }
              });
              
              if (!response.ok) {
                const errorText = await response.text();
                console.error('Payment capture failed:', response.status, errorText);
                throw new Error(`Payment capture failed: ${response.status}`);
              }
              
              const result = await response.json();
              console.log('Payment captured:', result);
              
              // Success - redirect to dashboard
              alert('Payment successful! Your subscription is now active.');
              window.location.href = '/dashboard';
            } catch (error) {
              console.error('Payment capture error:', error);
              alert('Payment processing failed. Please try again or contact support.');
            }
          },
          
          onError: (err: any) => {
            console.error('PayPal payment error:', err);
            alert('Payment failed. Please try again or contact support.');
          },
          
          onCancel: () => {
            console.log('Payment cancelled by user');
            alert('Payment cancelled.');
          },
          
          style: {
            layout: 'vertical',
            color: 'blue',
            shape: 'rect',
            label: 'paypal',
            height: 45,
            tagline: false
          }
        }).render(paypalRef.current);
        
        console.log('PayPal buttons rendered successfully');
        setHasRendered(true);
        setIsLoading(false);
        
      } catch (error) {
        console.error('Error rendering PayPal buttons:', error);
        throw error;
      }
    };

    initializePayPal();

    return () => {
      // Cleanup
      setHasRendered(false);
    };
  }, [amount, currency, intent, hasRendered]);

  if (error) {
    return (
      <div className="w-full p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="text-red-700 font-medium">PayPal Error</div>
        <div className="text-red-600 text-sm mt-1">{error}</div>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div 
        ref={paypalRef} 
        className="w-full min-h-[50px]"
        style={{ minHeight: '50px' }}
      />
      {isLoading && (
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 text-gray-600">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Loading PayPal payment button...</span>
          </div>
        </div>
      )}
    </div>
  );
}
