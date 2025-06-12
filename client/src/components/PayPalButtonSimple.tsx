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
        setTimeout(() => initPayPal(), 100);
        return;
      }

      const script = document.createElement('script');
      // Use a default client ID for sandbox testing - this will be replaced with env var when available
      const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID || 'AZDxjDScFpQtjWTOUtWKbyN_bDt4OgqaF4eYXlewfBP4-8aqX3PiV8e1GWU6liB2CUXlkA59kJXE7M6R';
      script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}&intent=${intent}`;
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
              console.log('Creating PayPal order...');
              const token = localStorage.getItem('token');
              if (!token) {
                throw new Error('No authentication token');
              }
              
              const response = await fetch('/api/paypal/create-order', {
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
              
              const data = await response.json();
              console.log('PayPal order response:', data);
              
              if (data.success) {
                return data.orderId;
              }
              throw new Error(data.error || 'Order creation failed');
            } catch (error) {
              console.error('Error creating PayPal order:', error);
              throw error;
            }
          },
          
          onApprove: async (data: any) => {
            try {
              console.log('PayPal payment approved:', data);
              const token = localStorage.getItem('token');
              const response = await fetch(`/api/paypal/capture-order/${data.orderID}`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                }
              });
              
              const result = await response.json();
              if (result.success) {
                alert('Payment successful! Your subscription is now active.');
                window.location.href = '/dashboard';
              } else {
                throw new Error(result.error || 'Payment capture failed');
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
          },
          
          style: {
            layout: 'vertical',
            color: 'blue',
            shape: 'rect',
            label: 'paypal'
          }
        }).render(paypalRef.current).then(() => {
          console.log('PayPal buttons rendered successfully');
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
      <div ref={paypalRef} className="w-full min-h-[50px]"></div>
      {/* Fallback message for debugging */}
      <div className="text-xs text-gray-400 mt-2 text-center">
        PayPal component loaded - initializing payment button...
      </div>
    </div>
  );
}