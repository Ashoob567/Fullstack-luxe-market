'use client';

import { useToastStore } from '@/hooks/useToast';
import { X, CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react';

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const colorMap = {
  success: { bg: '#E8F5E9', border: '#4CAF50', text: '#2E7D32', icon: '#4CAF50' },
  error: { bg: '#FFEBEE', border: '#F44336', text: '#C62828', icon: '#F44336' },
  info: { bg: '#E3F2FD', border: '#2196F3', text: '#1565C0', icon: '#2196F3' },
  warning: { bg: '#FFF3E0', border: '#FF9800', text: '#E65100', icon: '#FF9800' },
};

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        maxWidth: '400px',
      }}
    >
      {toasts.map((toast) => {
        const Icon = iconMap[toast.type];
        const colors = colorMap[toast.type];

        return (
          <div
            key={toast.id}
            style={{
              background: colors.bg,
              border: `1.5px solid ${colors.border}`,
              borderRadius: '10px',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              animation: 'slideIn 0.3s ease',
            }}
          >
            <Icon size={20} color={colors.icon} style={{ flexShrink: 0, marginTop: '2px' }} />

            <p
              style={{
                flex: 1,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.9rem',
                color: colors.text,
                fontWeight: 500,
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              {toast.message}
            </p>

            <button
              onClick={() => removeToast(toast.id)}
              style={{
                background: 'none',
                border: 'none',
                padding: '2px',
                cursor: 'pointer',
                color: colors.text,
                opacity: 0.7,
                flexShrink: 0,
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = '1')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = '0.7')}
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
