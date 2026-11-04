import { useState, useEffect } from 'react';
import { checkBackendHealth } from '../../services/apiService';

export function BackendStatus() {
  const [status, setStatus] = useState<'loading' | 'online' | 'offline'>('loading');

  useEffect(() => {
    let isMounted = true;

    checkBackendHealth()
      .then((data) => {
        if (!isMounted) return;
        if (data && data.status === 'ok' && data.database === 'connected') {
          setStatus('online');
        } else {
          setStatus('offline');
        }
      })
      .catch((error) => {
        if (!isMounted) return;
        console.error('Backend health check failed:', error);
        setStatus('offline');
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="text-xs mt-4 opacity-70">
      Backend Status: 
      {status === 'loading' && <span className="ml-1 text-gray-400">Checking...</span>}
      {status === 'online' && <span className="ml-1 text-green-400">Online</span>}
      {status === 'offline' && <span className="ml-1 text-red-400">Offline</span>}
    </div>
  );
}
