import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { CheckCircle, AlertCircle, Info, Undo2, X } from 'lucide-react';
import { generateId } from '../utils/formatters';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  /** Toast com botão "Desfazer" — usado para exclusões reversíveis */
  undo: (message: string, onUndo: () => void) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const ICONS: Record<ToastType, ReactNode> = {
  success: <CheckCircle size={18} />,
  error: <AlertCircle size={18} />,
  info: <Info size={18} />,
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (toast: Omit<ToastItem, 'id'>, duration: number) => {
      const id = generateId();
      setToasts((prev) => [...prev.slice(-2), { ...toast, id }]);
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), duration),
      );
    },
    [dismiss],
  );

  const value: ToastContextValue = {
    success: useCallback((message) => push({ type: 'success', message }, 3200), [push]),
    error: useCallback((message) => push({ type: 'error', message }, 5000), [push]),
    info: useCallback((message) => push({ type: 'info', message }, 3200), [push]),
    undo: useCallback(
      (message, onUndo) =>
        push({ type: 'info', message, actionLabel: 'Desfazer', onAction: onUndo }, 6000),
      [push],
    ),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-container" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <span className="toast-icon">{ICONS[toast.type]}</span>
            <span className="toast-message">{toast.message}</span>
            {toast.actionLabel && (
              <button
                type="button"
                className="toast-action"
                onClick={() => {
                  toast.onAction?.();
                  dismiss(toast.id);
                }}
              >
                <Undo2 size={14} />
                {toast.actionLabel}
              </button>
            )}
            <button
              type="button"
              className="toast-close"
              onClick={() => dismiss(toast.id)}
              aria-label="Fechar aviso"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast deve ser usado dentro de ToastProvider');
  return ctx;
};
