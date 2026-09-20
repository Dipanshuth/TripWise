import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Info, AlertTriangle, X } from 'lucide-react';

type ToastType = 'success' | 'info' | 'error';

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className="pointer-events-auto bg-white dark:bg-gray-800 shadow-float rounded-xl p-4 flex items-center gap-3 border border-gray-100 dark:border-gray-700 min-w-[300px]"
            >
              {t.type === 'success' && <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center"><Check className="w-4 h-4" /></div>}
              {t.type === 'info' && <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"><Info className="w-4 h-4" /></div>}
              {t.type === 'error' && <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center"><AlertTriangle className="w-4 h-4" /></div>}
              
              <p className="font-medium text-charcoal dark:text-white flex-1">{t.message}</p>
              
              <button onClick={() => removeToast(t.id)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
