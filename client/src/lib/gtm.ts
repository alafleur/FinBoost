// Google Tag Manager integration
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

// Initialize Google Tag Manager
export const initGTM = () => {
  const gtmId = import.meta.env.VITE_GTM_CONTAINER_ID;

  if (!gtmId) {
    console.warn('Missing required Google Tag Manager key: VITE_GTM_CONTAINER_ID');
    return;
  }

  console.log('Initializing Google Tag Manager with ID:', gtmId);

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];

  // Add GTM script to head
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${gtmId}`;
  document.head.appendChild(script);

  // Add GTM initialization
  window.dataLayer.push({
    'gtm.start': new Date().getTime(),
    event: 'gtm.js'
  });

  console.log('Google Tag Manager initialized successfully');
};

// Add GTM noscript fallback to body
export const addGTMNoScript = () => {
  const gtmId = import.meta.env.VITE_GTM_CONTAINER_ID;
  
  if (!gtmId) return;

  const noscript = document.createElement('noscript');
  noscript.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
  document.body.insertBefore(noscript, document.body.firstChild);
};

// Push events to dataLayer for GTM
export const pushGTMEvent = (eventName: string, parameters: Record<string, any> = {}) => {
  if (typeof window === 'undefined' || !window.dataLayer) return;
  
  window.dataLayer.push({
    event: eventName,
    ...parameters
  });
  
  console.log('GTM Event pushed:', eventName, parameters);
};

// Enhanced tracking functions for growth engineering
export const trackGTMPageView = (url: string, title?: string) => {
  pushGTMEvent('page_view', {
    page_path: url,
    page_title: title || document.title
  });
};

export const trackGTMEvent = (action: string, category: string, label?: string, value?: number) => {
  pushGTMEvent('custom_event', {
    event_action: action,
    event_category: category,
    event_label: label,
    value: value
  });
};

// Conversion tracking for growth optimization
export const trackGTMConversion = (conversionType: string, value?: number, currency = 'USD') => {
  pushGTMEvent('conversion', {
    conversion_type: conversionType,
    value: value,
    currency: currency
  });
};

// User lifecycle tracking
export const trackGTMUserAction = (action: string, userId?: string, properties: Record<string, any> = {}) => {
  pushGTMEvent('user_action', {
    action: action,
    user_id: userId,
    ...properties
  });
};