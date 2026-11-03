import { useState, useEffect } from 'react';
import { checkBackendHealth } from '../../services/apiService';

export function BackendStatus() {
  const [status, setStatus] = useState<'loading' | 'connected' | 'offline'>('loading');

  useEffect(() => {
    checkBackendHealth()
      .then(() => setStatus('connected'))
      .catch(() => setStatus('offline'));
  }, []);

  return (
    <div className="text-xs mt-4 opacity-70">
      Backend Status: 
      {status === 'loading' && <span className="ml-1 text-gray-400">Checking...</span>}
      {status === 'connected' && <span className="ml-1 text-green-400">Connected</span>}
      {status === 'offline' && <span className="ml-1 text-red-400">Offline</span>}
    </div>
  );
}
