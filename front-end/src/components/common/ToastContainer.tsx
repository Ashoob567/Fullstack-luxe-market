'use client';

import { useToastStore } from '@/hooks/useToast';
import { X, CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react';

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const toastStyles = {
  success: {
    container: 'bg-green-50 border-green-500 text-green-800',
    icon: '#4CAF50',
  },
  error: {
    container: 'bg-red-50 border-red-500 text-red-800',
    icon: '#F44336',
  },
  info: {
    container: 'bg-blue-50 border-blue-500 text-blue-900',
    icon: '#2196F3',
  },
  warning: {
    container: 'bg-orange-50 border-orange-500 text-orange-900',
    icon: '#FF9800',
  },
};

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 max-w-[400px]">
      {toasts.map((toast) => {
        const Icon = iconMap[toast.type];
        const styles = toastStyles[toast.type];

        return (
          <div
            key={toast.id}
            className={`${styles.container} border-[1.5px] rounded-[10px] px-4 py-3.5 flex items-start gap-3 shadow-[0_4px_12px_rgba(0,0,0,0.1)] animate-[slideIn_0.3s_ease]`}
          >
            <Icon size={20} color={styles.icon} className="shrink-0 mt-0.5" />

            <p className="flex-1 font-['DM_Sans'] text-[0.9rem] font-medium leading-[1.5] m-0">
              {toast.message}
            </p>

            <button
              onClick={() => removeToast(toast.id)}
              className="bg-transparent border-none p-0.5 cursor-pointer opacity-70 hover:opacity-100 shrink-0 transition-opacity duration-200"
              aria-label="Close notification"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
