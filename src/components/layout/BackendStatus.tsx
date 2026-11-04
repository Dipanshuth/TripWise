import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { checkBackendHealth, isBackendHealthy } from '../../services/apiService';

export type BackendStatusState = 'waking_up' | 'connected' | 'timed_out';

const MAX_WAKEUP_MS = 90000; // 90 seconds maximum total wake-up window
const RETRY_INTERVAL_MS = 5000; // Retry every 5 seconds on failure / cold start
const ATTEMPT_TIMEOUT_MS = 15000; // 15 seconds per individual fetch attempt
const CONNECTED_BADGE_DISMISS_MS = 3500; // Auto-dismiss floating badge 3.5s after connected

export function BackendStatus() {
  const [status, setStatus] = useState<BackendStatusState>('waking_up');
  const [isDismissed, setIsDismissed] = useState(false);
  const [showFloating, setShowFloating] = useState(true);

  const isMountedRef = useRef(true);
  const checkIdRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const overallTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeAbortControllerRef = useRef<AbortController | null>(null);
  const wakeUpStartTimeRef = useRef<number>(0);
  const isConnectedRef = useRef(false);
  const triggerWakeUpRef = useRef<() => void>(() => {});

  useEffect(() => {
    isMountedRef.current = true;

    const clearAllTimers = () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
      if (overallTimerRef.current) {
        clearTimeout(overallTimerRef.current);
        overallTimerRef.current = null;
      }
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
        dismissTimerRef.current = null;
      }
      if (activeAbortControllerRef.current) {
        activeAbortControllerRef.current.abort();
        activeAbortControllerRef.current = null;
      }
    };

    const handleFailure = (currentCheckId: number) => {
      if (isConnectedRef.current) return;
      if (!isMountedRef.current || checkIdRef.current !== currentCheckId) return;

      const elapsed = Date.now() - wakeUpStartTimeRef.current;
      if (elapsed >= MAX_WAKEUP_MS) {
        clearAllTimers();
        setStatus('timed_out');
      } else {
        // Retry automatically every 5 seconds (Requirement 2)
        setStatus('waking_up');
        retryTimerRef.current = setTimeout(() => {
          if (isMountedRef.current && !isConnectedRef.current) {
            performCheck();
          }
        }, RETRY_INTERVAL_MS);
      }
    };

    const performCheck = async () => {
      // If already connected, do not run repeated health checks (Requirement 9)
      if (isConnectedRef.current || !isMountedRef.current) return;

      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }

      const elapsed = Date.now() - wakeUpStartTimeRef.current;
      if (elapsed >= MAX_WAKEUP_MS) {
        clearAllTimers();
        setStatus('timed_out');
        return;
      }

      const currentCheckId = ++checkIdRef.current;
      const controller = new AbortController();
      activeAbortControllerRef.current = controller;

      try {
        const data = await checkBackendHealth({
          timeoutMs: ATTEMPT_TIMEOUT_MS,
          signal: controller.signal,
          forceRefresh: true,
        });

        if (!isMountedRef.current || checkIdRef.current !== currentCheckId) return;

        if (isBackendHealthy(data)) {
          // Backend responded successfully! (Requirement 5)
          isConnectedRef.current = true;
          clearAllTimers();
          setStatus('connected');
          setShowFloating(true);

          // Auto-dismiss floating pill after 3.5s
          dismissTimerRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              setShowFloating(false);
            }
          }, CONNECTED_BADGE_DISMISS_MS);

          // Stop: do NOT send repeated health checks after connected (Requirement 9)
          return;
        } else {
          handleFailure(currentCheckId);
        }
      } catch {
        if (!isMountedRef.current || checkIdRef.current !== currentCheckId) return;
        handleFailure(currentCheckId);
      }
    };

    const startWakeUpProcess = () => {
      clearAllTimers();
      isConnectedRef.current = false;
      wakeUpStartTimeRef.current = Date.now();
      setIsDismissed(false);
      setShowFloating(true);

      // 90-second maximum wake-up deadline (Requirement 3)
      overallTimerRef.current = setTimeout(() => {
        if (!isMountedRef.current || isConnectedRef.current) return;
        clearAllTimers();
        setStatus('timed_out');
      }, MAX_WAKEUP_MS);

      // Call /api/health/ immediately when app loads (Requirement 1)
      performCheck();
    };

    triggerWakeUpRef.current = () => {
      setStatus('waking_up');
      startWakeUpProcess();
    };

    startWakeUpProcess();

    return () => {
      isMountedRef.current = false;
      clearAllTimers();
    };
  }, []);

  const handleManualRetry = () => {
    triggerWakeUpRef.current();
  };

  return (
    <>
      {/* Floating Status Indicator (Small, attractive, non-blocking) */}
      <AnimatePresence>
        {showFloating && !isDismissed && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed bottom-5 right-5 z-50 pointer-events-auto select-none"
            role="status"
            aria-live="polite"
          >
            {status === 'waking_up' && (
              <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-900/95 dark:bg-slate-800/95 text-slate-100 shadow-xl border border-amber-500/40 backdrop-blur-md text-xs font-medium">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                </span>
                <span>Waking up server...</span>
                <RotateCcw className="w-3 h-3 text-amber-400/80 animate-spin" />
              </div>
            )}

            {status === 'connected' && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/95 dark:bg-slate-800/95 text-emerald-300 shadow-xl border border-emerald-500/40 backdrop-blur-md text-xs font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Connected</span>
              </div>
            )}

            {status === 'timed_out' && (
              <div className="w-72 sm:w-80 p-3.5 rounded-2xl bg-slate-900/95 dark:bg-slate-800/95 text-slate-100 shadow-2xl border border-amber-500/30 backdrop-blur-md text-xs">
                <div className="flex items-start gap-2.5">
                  <div className="p-1 rounded-full bg-amber-500/10 text-amber-400 mt-0.5 shrink-0">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-200">Server is taking longer to wake up</p>
                    <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                      The Render free-tier backend is still starting. Static pages and navigation remain usable.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsDismissed(true)}
                    className="text-slate-400 hover:text-slate-200 p-1 -mr-1 -mt-1 rounded transition-colors cursor-pointer"
                    title="Dismiss"
                    aria-label="Dismiss notification"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button
                  onClick={handleManualRetry}
                  className="mt-3 w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retry Connection</span>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Backend Status Indicator */}
      <div className="text-xs mt-4 opacity-70">
        Backend Status: 
        {status === 'waking_up' && (
          <span className="ml-1.5 text-amber-400 inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block" />
            Waking up server...
          </span>
        )}
        {status === 'connected' && (
          <span className="ml-1.5 text-green-400 font-medium inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
            Connected
          </span>
        )}
        {status === 'timed_out' && (
          <span className="ml-1.5 text-rose-400 inline-flex items-center gap-2">
            Offline
            <button
              onClick={handleManualRetry}
              className="underline text-amber-400 hover:text-amber-300 cursor-pointer ml-1"
            >
              Retry
            </button>
          </span>
        )}
      </div>
    </>
  );
}
