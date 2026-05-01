import { toast } from 'sonner';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [isVisible, setIsVisible] = useState(true);
  const [isHovering, setIsHovering] = useState(false);

  const handleDismiss = () => {
    setIsVisible(false);
    // Delay actual dismiss to allow animation to complete
    setTimeout(() => {
      onDismiss();
    }, 500);
  };

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          initial={{
            opacity: 0,
            x: 400,
            y: -50,
            scale: 0.3,
            rotate: 10,
          }}
          animate={{
            opacity: 1,
            x: 0,
            y: 0,
            scale: 1,
            rotate: 0,
          }}
          exit={{
            opacity: 0,
            x: 400,
            y: -30,
            scale: 0.5,
            rotate: -8,
          }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
            mass: 0.8,
          }}
          style={{ position: 'relative' }}
          onHoverStart={() => setIsHovering(true)}
          onHoverEnd={() => setIsHovering(false)}
        >
          <motion.button
            onClick={handleDismiss}
            initial={{ scale: 0, rotate: -180 }}
            animate={{
              scale: 1,
              rotate: 0,
            }}
            whileHover={{
              scale: 1.2,
              rotate: 90,
              backgroundColor: 'hsl(0, 85%, 60%)',
            }}
            whileTap={{
              scale: 0.9,
              rotate: -90,
            }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 15,
            }}
            style={{
              position: 'absolute',
              right: '-10px',
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
              zIndex: 10,
            }}
          >
            <X size={12} />
          </motion.button>

          <motion.div
            animate={{
              boxShadow: isHovering
                ? `0 0 25px ${styles.shadowColor}, 0 0 15px ${styles.shadowColor}, 0 8px 16px rgba(0,0,0,0.3)`
                : `0 0 12px ${styles.shadowColor}, 0 0 4px ${styles.shadowColor}`,
              scale: isHovering ? 1.02 : 1,
            }}
            transition={{
              duration: 0.2,
            }}
            style={{
              background: 'hsl(225, 25%, 12%, 0.95)',
              border: `1px solid ${styles.borderColor}`,
              borderRadius: '0.5rem',
              padding: '0.875rem 1rem',
              color: 'hsl(210, 40%, 92%)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              fontSize: '0.875rem',
              minWidth: '356px',
              maxWidth: '356px',
            }}
          >
            <motion.div
              animate={{
                rotate: [0, -10, 10, -10, 0],
                scale: [1, 1.1, 1.1, 1.1, 1],
              }}
              transition={{
                duration: 0.6,
                ease: "easeInOut",
                times: [0, 0.2, 0.4, 0.6, 0.8],
              }}
            >
              <IconComponent size={18} style={{ color: styles.iconColor, flexShrink: 0 }} />
            </motion.div>
            <span>{message}</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
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
