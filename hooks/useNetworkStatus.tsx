/**
 * Network Status Hook & Provider
 * Monitors network connectivity and shows toast notifications
 */

import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useToast } from '@/components/Toast';

interface NetworkContextType {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  connectionType: string | null;
}

const NetworkContext = createContext<NetworkContextType>({
  isConnected: true,
  isInternetReachable: true,
  connectionType: null,
});

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [networkState, setNetworkState] = useState<NetworkContextType>({
    isConnected: true,
    isInternetReachable: true,
    connectionType: null,
  });
  const toast = useToast();
  const wasConnectedRef = useRef(true);
  const offlineToastIdRef = useRef<string | null>(null);
  const hasInitializedRef = useRef(false);

  const handleNetworkChange = useCallback(
    (state: NetInfoState) => {
      const isConnected = state.isConnected ?? false;
      const isInternetReachable = state.isInternetReachable;

      setNetworkState({
        isConnected,
        isInternetReachable,
        connectionType: state.type,
      });

      // Skip first update (initial state)
      if (!hasInitializedRef.current) {
        hasInitializedRef.current = true;
        wasConnectedRef.current = isConnected;
        return;
      }

      // Went offline
      if (wasConnectedRef.current && !isConnected) {
        // Dismiss any existing offline toast
        if (offlineToastIdRef.current) {
          toast.hide(offlineToastIdRef.current);
        }
        
        offlineToastIdRef.current = toast.error(
          'Check your connection and try again.',
          "You're Offline"
        );
      }

      // Came back online
      if (!wasConnectedRef.current && isConnected) {
        // Dismiss offline toast
        if (offlineToastIdRef.current) {
          toast.hide(offlineToastIdRef.current);
          offlineToastIdRef.current = null;
        }

        toast.success(
          'Your uploads will resume automatically.',
          'Back Online'
        );
      }

      wasConnectedRef.current = isConnected;
    },
    [toast]
  );

  useEffect(() => {
    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener(handleNetworkChange);

    // Get initial state
    NetInfo.fetch().then((state) => {
      setNetworkState({
        isConnected: state.isConnected ?? true,
        isInternetReachable: state.isInternetReachable,
        connectionType: state.type,
      });
    });

    return () => {
      unsubscribe();
      if (offlineToastIdRef.current) {
        toast.hide(offlineToastIdRef.current);
      }
    };
  }, [handleNetworkChange, toast]);

  return (
    <NetworkContext.Provider value={networkState}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetworkStatus() {
  return useContext(NetworkContext);
}

/**
 * Hook to check if network is available
 */
export function useIsOnline(): boolean {
  const { isConnected } = useNetworkStatus();
  return isConnected;
}

