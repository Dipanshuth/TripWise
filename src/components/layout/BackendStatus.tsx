import { useState, useEffect, useRef } from 'react';
import { checkBackendHealth, isBackendHealthy } from '../../services/apiService';

export type BackendStatusState = 'checking' | 'waking_up' | 'online' | 'offline';

export function BackendStatus() {
  const [status, setStatus] = useState<BackendStatusState>('checking');
  const checkIdRef = useRef(0);
  const isMountedRef = useRef(true);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wakingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    isMountedRef.current = true;

    const performCheck = async () => {
      // Clear any pending timers
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      if (wakingTimeoutRef.current) {
        clearTimeout(wakingTimeoutRef.current);
        wakingTimeoutRef.current = null;
      }

      const currentCheckId = ++checkIdRef.current;

      // Only show "Checking..." if we are not already online
      setStatus(prev => (prev === 'online' ? 'online' : 'checking'));

      // If backend takes longer than 5 seconds (e.g. Render cold start), indicate "Waking up..."
      wakingTimeoutRef.current = setTimeout(() => {
        if (!isMountedRef.current || checkIdRef.current !== currentCheckId) return;
        setStatus(prev => (prev !== 'online' ? 'waking_up' : 'online'));
      }, 5000);

      try {
        const data = await checkBackendHealth({ timeoutMs: 30000 });
        if (!isMountedRef.current || checkIdRef.current !== currentCheckId) return;

        if (wakingTimeoutRef.current) {
          clearTimeout(wakingTimeoutRef.current);
          wakingTimeoutRef.current = null;
        }

        if (isBackendHealthy(data)) {
          setStatus('online');
          // Schedule gentle background refresh in 60 seconds
          retryTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) performCheck();
          }, 60000);
        } else {
          setStatus('offline');
          // Retry in 10 seconds on degraded/unreachable response
          retryTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) performCheck();
          }, 10000);
        }
      } catch (error) {
        if (!isMountedRef.current || checkIdRef.current !== currentCheckId) return;

        if (wakingTimeoutRef.current) {
          clearTimeout(wakingTimeoutRef.current);
          wakingTimeoutRef.current = null;
        }

        console.error('Backend health check failed:', error);
        setStatus('offline');

        // Retry in 10 seconds so temporary spin-up failures or network glitches auto-recover
        retryTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) performCheck();
        }, 10000);
      }
    };

    performCheck();

    return () => {
      isMountedRef.current = false;
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      if (wakingTimeoutRef.current) clearTimeout(wakingTimeoutRef.current);
    };
  }, []);

  return (
    <div className="text-xs mt-4 opacity-70">
      Backend Status: 
      {status === 'checking' && <span className="ml-1 text-gray-400">Checking...</span>}
      {status === 'waking_up' && <span className="ml-1 text-amber-400 animate-pulse">Waking up...</span>}
      {status === 'online' && <span className="ml-1 text-green-400">Online</span>}
      {status === 'offline' && <span className="ml-1 text-red-400">Offline</span>}
    </div>
  );
}
