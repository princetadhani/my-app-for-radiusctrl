import { toast } from 'sonner';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { ReactNode } from 'react';

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface CustomToastConfig {
  variant: ToastVariant;
  message: string | ReactNode;
  duration?: number;
}

const variantStyles = {
  success: {
    borderColor: 'hsl(142, 76%, 36%, 0.6)',
    shadowColor: 'hsl(142, 76%, 36%, 0.3)',
    iconColor: 'hsl(142, 76%, 36%)',
    Icon: CheckCircle2,
  },
  error: {
    borderColor: 'hsl(0, 85%, 60%, 0.6)',
    shadowColor: 'hsl(0, 85%, 60%, 0.3)',
    iconColor: 'hsl(0, 85%, 60%)',
    Icon: XCircle,
  },
  warning: {
    borderColor: 'hsl(38, 95%, 60%, 0.6)',
    shadowColor: 'hsl(38, 95%, 60%, 0.3)',
    iconColor: 'hsl(38, 95%, 60%)',
    Icon: AlertTriangle,
  },
  info: {
    borderColor: 'hsl(210, 100%, 60%, 0.6)',
    shadowColor: 'hsl(210, 100%, 60%, 0.3)',
    iconColor: 'hsl(210, 100%, 60%)',
    Icon: Info,
  },
};

function CustomToastComponent({ variant, message, onDismiss }: CustomToastConfig & { onDismiss: () => void }) {
  const styles = variantStyles[variant];
  const IconComponent = styles.Icon;

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={onDismiss}
        style={{
          position: 'absolute',
          left: '-10px',
          top: '-10px',
          background: 'hsl(225, 25%, 12%)',
          border: '1px solid hsl(225, 15%, 18%)',
          borderRadius: '0.375rem',
          width: '20px',
          height: '20px',
          color: 'hsl(210, 40%, 92%)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.8,
          transition: 'opacity 0.2s',
          zIndex: 10,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.8')}
      >
        <X size={12} />
      </button>
      <div
        style={{
          background: 'hsl(225, 25%, 12%, 0.95)',
          border: `1px solid ${styles.borderColor}`,
          borderRadius: '0.5rem',
          padding: '0.875rem 1rem',
          color: 'hsl(210, 40%, 92%)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          boxShadow: `0 0 12px ${styles.shadowColor}, 0 0 4px ${styles.shadowColor}`,
          fontSize: '0.875rem',
          minWidth: '356px',
          maxWidth: '356px',
        }}
      >
        <IconComponent size={18} style={{ color: styles.iconColor, flexShrink: 0 }} />
        <span>{message}</span>
      </div>
    </div>
  );
}

export const customToast = {
  success: (message: string | ReactNode, duration = 4000) => {
    toast.custom(
      (t) => (
        <CustomToastComponent
          variant="success"
          message={message}
          onDismiss={() => toast.dismiss(t)}
        />
      ),
      { duration }
    );
  },
  error: (message: string | ReactNode, duration = 4000) => {
    toast.custom(
      (t) => (
        <CustomToastComponent
          variant="error"
          message={message}
          onDismiss={() => toast.dismiss(t)}
        />
      ),
      { duration }
    );
  },
  warning: (message: string | ReactNode, duration = 4000) => {
    toast.custom(
      (t) => (
        <CustomToastComponent
          variant="warning"
          message={message}
          onDismiss={() => toast.dismiss(t)}
        />
      ),
      { duration }
    );
  },
  info: (message: string | ReactNode, duration = 4000) => {
    toast.custom(
      (t) => (
        <CustomToastComponent
          variant="info"
          message={message}
          onDismiss={() => toast.dismiss(t)}
        />
      ),
      { duration }
    );
  },
};
