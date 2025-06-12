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
  const paypalRef = useRef<HTMLDivElement>(null);
  const hasRendered = useRef(false);

  useEffect(() => {
    if (hasRendered.current) return;

    const loadPayPalScript = () => {
      // Check if script already exists
      if (document.querySelector('script[src*="paypal.com/sdk"]')) {
        initPayPal();
        return;
      }

      const script = document.createElement('script');
      // Use a default client ID for sandbox testing - this will be replaced with env var when available
      const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID || 'AZDxjDScFpQtjWTOUtWKbyN_bDt4OgqaF4eYXlewfBP4-8aqX3PiV8e1GWU6liB2CUXlkA59kJXE7M6R';
      script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}&intent=${intent}`;
      script.async = true;
      script.onload = () => initPayPal();
      script.onerror = () => console.error('PayPal SDK failed to load');
      document.head.appendChild(script);
    };

    const initPayPal = () => {
      if (!window.paypal || !paypalRef.current || hasRendered.current) {
        return;
      }

      hasRendered.current = true;

      window.paypal.Buttons({
        createOrder: async () => {
          try {
            const token = localStorage.getItem('auth_token');
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
            const token = localStorage.getItem('auth_token');
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
        }
      }).render(paypalRef.current);
    };

    loadPayPalScript();

    return () => {
      hasRendered.current = false;
    };
  }, [amount, currency, intent]);

  return <div ref={paypalRef} className="w-full"></div>;
}