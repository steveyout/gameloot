import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, AlertTriangle, XCircle, Info, 
  HelpCircle, Sparkles, X, ChevronRight 
} from 'lucide-react';

const AlertContext = createContext(null);

export function AlertProvider({ children }) {
  const [alerts, setAlerts] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState(null);

  // Auto-dismiss alert banner/toast
  const showAlert = useCallback((options) => {
    // options: { title, message, type: 'success' | 'error' | 'warning' | 'info', duration?: number }
    const id = 'alt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const newAlert = {
      id,
      title: options.title || (options.type === 'error' ? 'Action Failed' : options.type === 'success' ? 'Success' : 'Notice'),
      message: options.message || '',
      type: options.type || 'info',
      duration: options.duration !== undefined ? options.duration : 4000
    };

    setAlerts((prev) => [newAlert, ...prev.slice(0, 4)]);

    if (newAlert.duration > 0) {
      setTimeout(() => {
        setAlerts((prev) => prev.filter((a) => a.id !== id));
      }, newAlert.duration);
    }

    return id;
  }, []);

  const dismissAlert = useCallback((id) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  // Helper shortcuts
  const success = useCallback((message, title = 'Success') => showAlert({ message, title, type: 'success' }), [showAlert]);
  const error = useCallback((message, title = 'Error Occurred') => showAlert({ message, title, type: 'error' }), [showAlert]);
  const warning = useCallback((message, title = 'Warning') => showAlert({ message, title, type: 'warning' }), [showAlert]);
  const info = useCallback((message, title = 'Information') => showAlert({ message, title, type: 'info' }), [showAlert]);

  // Premium Confirm Modal (Promise-based, replaces window.confirm)
  const confirm = useCallback(({ title = 'Are you sure?', message, confirmText = 'Confirm', cancelText = 'Cancel', type = 'danger' }) => {
    return new Promise((resolve) => {
      setConfirmDialog({
        title,
        message,
        confirmText,
        cancelText,
        type,
        onConfirm: () => {
          setConfirmDialog(null);
          resolve(true);
        },
        onCancel: () => {
          setConfirmDialog(null);
          resolve(false);
        }
      });
    });
  }, []);

  return (
    <AlertContext.Provider value={{ showAlert, dismissAlert, success, error, warning, info, confirm }}>
      {children}

      {/* Floating Animated Alert Stack */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {alerts.map((alt) => {
            const isSuccess = alt.type === 'success';
            const isError = alt.type === 'error';
            const isWarning = alt.type === 'warning';

            return (
              <motion.div
                key={alt.id}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                className={`pointer-events-auto p-4 rounded-2xl shadow-2xl backdrop-blur-xl border flex items-start gap-3.5 select-none ${
                  isSuccess
                    ? 'bg-slate-900/95 border-emerald-500/40 text-emerald-200 shadow-emerald-950/40'
                    : isError
                    ? 'bg-slate-900/95 border-rose-500/40 text-rose-200 shadow-rose-950/40'
                    : isWarning
                    ? 'bg-slate-900/95 border-amber-500/40 text-amber-200 shadow-amber-950/40'
                    : 'bg-slate-900/95 border-cyan-500/40 text-cyan-200 shadow-cyan-950/40'
                }`}
              >
                <div className={`p-2 rounded-xl shrink-0 ${
                  isSuccess ? 'bg-emerald-500/15 text-emerald-400' :
                  isError ? 'bg-rose-500/15 text-rose-400' :
                  isWarning ? 'bg-amber-500/15 text-amber-400' :
                  'bg-cyan-500/15 text-cyan-400'
                }`}>
                  {isSuccess && <CheckCircle2 className="w-5 h-5" />}
                  {isError && <XCircle className="w-5 h-5" />}
                  {isWarning && <AlertTriangle className="w-5 h-5" />}
                  {!isSuccess && !isError && !isWarning && <Info className="w-5 h-5" />}
                </div>

                <div className="flex-1 min-w-0 pt-0.5">
                  <h4 className="text-xs font-bold text-white tracking-tight m-0">{alt.title}</h4>
                  <p className="text-xs text-slate-300 mt-0.5 leading-snug break-words m-0">{alt.message}</p>
                </div>

                <button
                  type="button"
                  onClick={() => dismissAlert(alt.id)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Styled Confirmation Modal (Never uses native browser window.confirm!) */}
      <AnimatePresence>
        {confirmDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative max-w-md w-full bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl text-slate-100"
            >
              <div className="flex items-center gap-3.5 mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  confirmDialog.type === 'danger' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' :
                  'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                }`}>
                  {confirmDialog.type === 'danger' ? <AlertTriangle className="w-6 h-6" /> : <HelpCircle className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white m-0">{confirmDialog.title}</h3>
                  <p className="text-xs text-slate-400 m-0 mt-0.5">Please confirm your administrative action</p>
                </div>
              </div>

              <p className="text-sm text-slate-300 mb-6 bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/80">
                {confirmDialog.message}
              </p>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={confirmDialog.onCancel}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  {confirmDialog.cancelText}
                </button>
                <button
                  type="button"
                  onClick={confirmDialog.onConfirm}
                  className={`px-5 py-2 rounded-xl text-white text-xs font-semibold shadow-lg transition-all cursor-pointer ${
                    confirmDialog.type === 'danger'
                      ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                      : 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-600/30'
                  }`}
                >
                  {confirmDialog.confirmText}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AlertContext.Provider>
  );
}

export const useAlert = () => useContext(AlertContext);
