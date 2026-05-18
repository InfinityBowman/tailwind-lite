/**
 * useAIViewer - Connect to MCP server's WebSocket to watch AI gameplay
 *
 * Receives real-time game state updates and action logs from the MCP server
 * when Claude is playing the game through MCP tools.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { GameState } from '../game/state/GameState';

export interface ActionLogEntry {
  time: number;
  action: string;
  result: unknown;
}

export interface WSMessage {
  type: 'state' | 'action' | 'actionLog' | 'connected';
  data: unknown;
  timestamp: number;
}

export interface UseAIViewerReturn {
  /** Current game state from AI session */
  state: GameState | null;
  /** Action log from AI session */
  actionLog: ActionLogEntry[];
  /** Whether connected to WebSocket server */
  connected: boolean;
  /** Connection status for UI display */
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  /** Error message if connection failed */
  error: string | null;
  /** Manually trigger reconnection */
  reconnect: () => void;
  /** Clear the action log */
  clearLog: () => void;
}

const DEFAULT_WS_URL = 'ws://localhost:8765';
const MAX_ACTION_LOG_SIZE = 500;
const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 10000]; // Exponential backoff

export function useAIViewer(wsUrl: string = DEFAULT_WS_URL): UseAIViewerReturn {
  const [state, setState] = useState<GameState | null>(null);
  const [actionLog, setActionLog] = useState<ActionLogEntry[]>([]);
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>(
    'disconnected'
  );
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<globalThis.WebSocket | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const manualDisconnectRef = useRef(false);

  const connect = useCallback(() => {
    // Clean up existing connection
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    manualDisconnectRef.current = false;
    setStatus('connecting');
    setError(null);

    try {
      const ws = new globalThis.WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[AIViewer] Connected to WebSocket server');
        setStatus('connected');
        setError(null);
        reconnectAttemptRef.current = 0;
      };

      ws.onmessage = event => {
        try {
          const message: WSMessage = JSON.parse(event.data);

          switch (message.type) {
            case 'state':
              setState(message.data as GameState);
              break;

            case 'action':
              setActionLog(prev => {
                const newLog = [...prev, message.data as ActionLogEntry];
                // Keep only the last N entries
                if (newLog.length > MAX_ACTION_LOG_SIZE) {
                  return newLog.slice(-MAX_ACTION_LOG_SIZE);
                }
                return newLog;
              });
              break;

            case 'actionLog':
              // Initial action log from server
              setActionLog(message.data as ActionLogEntry[]);
              break;

            case 'connected':
              console.log('[AIViewer] Server acknowledged connection');
              break;
          }
        } catch (err) {
          console.error('[AIViewer] Failed to parse message:', err);
        }
      };

      ws.onerror = () => {
        console.error('[AIViewer] WebSocket error');
        setStatus('error');
        setError('Connection error');
      };

      ws.onclose = () => {
        console.log('[AIViewer] WebSocket closed');
        wsRef.current = null;

        // Check BEFORE scheduling timeout to avoid race condition
        if (manualDisconnectRef.current) {
          setStatus('disconnected');
          return;
        }

        // Auto-reconnect with exponential backoff
        const delay =
          RECONNECT_DELAYS[Math.min(reconnectAttemptRef.current, RECONNECT_DELAYS.length - 1)];
        console.log(
          `[AIViewer] Reconnecting in ${delay}ms (attempt ${reconnectAttemptRef.current + 1})`
        );

        setStatus('connecting');
        reconnectAttemptRef.current++;

        reconnectTimeoutRef.current = setTimeout(() => {
          // Double-check in case disconnect was called while waiting
          if (!manualDisconnectRef.current) {
            connect();
          }
        }, delay);
      };
    } catch (err) {
      console.error('[AIViewer] Failed to create WebSocket:', err);
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to connect');
    }
  }, [wsUrl]);

  const _disconnect = useCallback(() => {
    manualDisconnectRef.current = true;

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setStatus('disconnected');
    setState(null);
  }, []);

  const reconnect = useCallback(() => {
    reconnectAttemptRef.current = 0;
    connect();
  }, [connect]);

  const clearLog = useCallback(() => {
    setActionLog([]);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      manualDisconnectRef.current = true;

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return {
    state,
    actionLog,
    connected: status === 'connected',
    status,
    error,
    reconnect,
    clearLog,
  };
}
