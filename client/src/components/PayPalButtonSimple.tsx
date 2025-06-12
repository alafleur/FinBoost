
import React, { useEffect, useRef } from "react";

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
  const hasRendered = useRef(false);

  useEffect(() => {
    if (hasRendered.current) return;

    const loadPayPalScript = () => {
      // Check if script already exists
      if (document.querySelector('script[src*="paypal.com/sdk"]')) {
        console.log('PayPal script already exists, initializing...');
        setTimeout(() => initPayPal(), 100);
        return;
      }

      console.log('Loading PayPal SDK...');
      const script = document.createElement('script');
      
      // Use environment variable or fallback to sandbox client ID
      const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID || 'AZDxjDScFpQtjWTOUtWKbyN_bDt4OgqaF4eYXlewfBP4-8aqX3PiV8e1GWU6liB2CUXlkA59kJXE7M6R';
      
      // Correct PayPal SDK URL with proper parameters
      script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}&intent=${intent}&components=buttons`;
      script.async = true;
      
      script.onload = () => {
        console.log('PayPal SDK loaded successfully');
        setTimeout(() => initPayPal(), 100);
      };
      
      script.onerror = () => {
        console.error('PayPal SDK failed to load');
      };
      
      document.head.appendChild(script);
    };

    const initPayPal = () => {
      console.log('Initializing PayPal buttons...');
      
      if (!window.paypal) {
        console.error('PayPal SDK not available');
        return;
      }
      
      if (!paypalRef.current) {
        console.error('PayPal container ref not available');
        return;
      }
      
      if (hasRendered.current) {
        console.log('PayPal buttons already rendered');
        return;
      }

      hasRendered.current = true;

      try {
        window.paypal.Buttons({
          createOrder: async () => {
            try {
              console.log('Creating PayPal order with amount:', amount);
              const token = localStorage.getItem('token');
              if (!token) {
                throw new Error('No authentication token');
              }
              
              // Match the correct server route
              const response = await fetch('/api/paypal/order', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  amount: parseFloat(amount),
                  currency,
                  intent
                })
              });
              
              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP ${response.status}`);
              }
              
              const data = await response.json();
              console.log('PayPal order response:', data);
              
              if (data.id) {
                console.log('Order created successfully with ID:', data.id);
                return data.id;
              }
              throw new Error('No order ID received');
            } catch (error) {
              console.error('Error creating PayPal order:', error);
              throw error;
            }
          },
          
          onApprove: async (data: any) => {
            try {
              console.log('PayPal payment approved with order ID:', data.orderID);
              const token = localStorage.getItem('token');
              
              // Match the correct server route
              const response = await fetch(`/api/paypal/order/${data.orderID}/capture`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                }
              });
              
              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP ${response.status}`);
              }
              
              const result = await response.json();
              console.log('Payment capture result:', result);
              
              // Check if the capture was successful
              if (result.status === 'COMPLETED' || result.purchase_units) {
                alert('Payment successful! Your subscription is now active.');
                window.location.href = '/dashboard';
              } else {
                throw new Error('Payment capture incomplete');
              }
            } catch (error) {
              console.error('Error capturing PayPal payment:', error);
              alert('Payment processing failed. Please try again.');
            }
          },
          
          onError: (err: any) => {
            console.error('PayPal error:', err);
            alert('Payment failed. Please try again.');
          },
          
          onCancel: (data: any) => {
            console.log('PayPal payment cancelled:', data);
            alert('Payment was cancelled.');
          },
          
          style: {
            layout: 'vertical',
            color: 'blue',
            shape: 'rect',
            label: 'paypal',
            height: 40
          }
        }).render(paypalRef.current).then(() => {
          console.log('PayPal buttons rendered successfully to DOM');
        }).catch((error: any) => {
          console.error('Error rendering PayPal buttons:', error);
          hasRendered.current = false;
        });
      } catch (error) {
        console.error('Error initializing PayPal buttons:', error);
        hasRendered.current = false;
      }
    };

    loadPayPalScript();

    return () => {
      hasRendered.current = false;
    };
  }, [amount, currency, intent]);

  return (
    <div className="w-full">
      <div ref={paypalRef} className="w-full min-h-[50px] bg-gray-50 rounded-lg p-2"></div>
      <div className="text-xs text-gray-500 mt-2 text-center">
        {hasRendered.current ? 'PayPal button should appear above' : 'Loading PayPal payment button...'}
      </div>
    </div>
  );
}
