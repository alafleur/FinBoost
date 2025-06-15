import { useState, useEffect, useRef, useCallback } from 'react';

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp?: string;
}

interface UseWebSocketOptions {
  url: string;
  token?: string;
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  autoReconnect?: boolean;
  reconnectInterval?: number;
}

interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  lastMessage: WebSocketMessage | null;
}

export function useWebSocket(options: UseWebSocketOptions) {
  const {
    url,
    token,
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    autoReconnect = true,
    reconnectInterval = 5000
  } = options;

  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    lastMessage: null
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const shouldReconnectRef = useRef(true);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      const wsUrl = token ? `${url}?token=${encodeURIComponent(token)}` : url;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setState(prev => ({ ...prev, isConnected: true, isConnecting: false, error: null }));
        onConnect?.();
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setState(prev => ({ ...prev, lastMessage: message }));
          onMessage?.(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        setState(prev => ({ ...prev, isConnected: false, isConnecting: false }));
        onDisconnect?.();

        if (shouldReconnectRef.current && autoReconnect) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

      ws.onerror = (error) => {
        setState(prev => ({ 
          ...prev, 
          error: 'WebSocket connection failed',
          isConnecting: false 
        }));
        onError?.(error);
      };

    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to create WebSocket connection',
        isConnecting: false 
      }));
    }
  }, [url, token, onMessage, onConnect, onDisconnect, onError, autoReconnect, reconnectInterval]);

  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    shouldReconnectRef.current = true;
    setTimeout(connect, 100);
  }, [connect, disconnect]);

  useEffect(() => {
    if (url && token) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [url, token, connect, disconnect]);

  return {
    ...state,
    connect,
    disconnect,
    reconnect,
    sendMessage
  };
}

// Specialized hook for admin analytics WebSocket
export function useAnalyticsWebSocket(token?: string) {
  const wsUrl = `ws://localhost:5001`;
  
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [activityFeed, setActivityFeed] = useState<any[]>([]);

  const { isConnected, isConnecting, error, sendMessage, ...wsActions } = useWebSocket({
    url: wsUrl,
    token,
    onMessage: (message) => {
      switch (message.type) {
        case 'connection_established':
          console.log('Analytics WebSocket connected:', message.data);
          // Subscribe to analytics updates
          sendMessage({ type: 'subscribe_analytics' });
          break;
          
        case 'analytics_subscription_confirmed':
          console.log('Subscribed to analytics updates');
          // Request initial data
          sendMessage({ type: 'request_live_data' });
          break;
          
        case 'live_analytics_data':
          setAnalyticsData(message.data);
          break;
          
        case 'analytics_update':
          setAnalyticsData(message.data);
          break;
          
        case 'activity_update':
          setActivityFeed(prev => [message.data, ...prev.slice(0, 9)]); // Keep latest 10
          break;
          
        case 'error':
          console.error('WebSocket error:', message.data.message);
          break;
          
        default:
          console.log('Unknown message type:', message.type);
      }
    },
    onConnect: () => {
      console.log('Analytics WebSocket connected successfully');
    },
    onDisconnect: () => {
      console.log('Analytics WebSocket disconnected');
    },
    onError: (error) => {
      console.error('Analytics WebSocket error:', error);
    }
  });

  const requestLiveData = useCallback(() => {
    sendMessage({ type: 'request_live_data' });
  }, [sendMessage]);

  return {
    isConnected,
    isConnecting,
    error,
    analyticsData,
    activityFeed,
    requestLiveData,
    ...wsActions
  };
}