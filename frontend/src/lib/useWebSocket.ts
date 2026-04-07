import { useEffect, useRef, useCallback } from "react";
import { API_BASE } from "@/lib/api";

/**
 * Custom hook for WebSocket connection to the live feed.
 * Automatically reconnects with exponential backoff on disconnect.
 *
 * @param onMessage - Callback invoked with parsed JSON data on each message
 * @param enabled  - Whether the WebSocket should be active (e.g. only when authenticated)
 */
export function useWebSocket(
  onMessage: (data: any) => void,
  enabled: boolean = true,
  userId?: number | null
) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectDelay = useRef(1000);
  const onMessageRef = useRef(onMessage);

  // Keep the callback ref fresh without re-triggering the effect
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const connect = useCallback(() => {
    if (!enabled) return;

    // Derive WS URL from API_BASE (http→ws, https→wss)
    let wsUrl = API_BASE
      .replace(/^https:\/\//, "wss://")
      .replace(/^http:\/\//, "ws://")
      + "/ws/feed";

    if (userId) {
      wsUrl += `?user_id=${userId}`;
    }



    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {

      reconnectDelay.current = 1000; // Reset backoff on successful connect
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        onMessageRef.current(data);
      } catch (err) {
        console.error("🔌 [WS] Failed to parse message:", err);
      }
    };

    ws.onclose = (event) => {

      scheduleReconnect();
    };

    ws.onerror = (err) => {
      console.error("🔌 [WS] Error:", err);
      ws.close();
    };
  }, [enabled, userId]);

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    reconnectTimer.current = setTimeout(() => {
      reconnectDelay.current = Math.min(reconnectDelay.current * 2, 30000);
      connect();
    }, reconnectDelay.current);
  }, [connect]);

  useEffect(() => {
    connect();

    // Send a keep-alive ping every 25 seconds to prevent timeout
    const pingInterval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send("ping");
      }
    }, 25000);

    return () => {
      clearInterval(pingInterval);
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        wsRef.current.onclose = null; // Prevent reconnect on intentional close
        wsRef.current.close();
      }
    };
  }, [connect]);
}
