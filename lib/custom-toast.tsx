import { toast } from 'sonner';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { ReactNode, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface CustomToastConfig {
  variant: ToastVariant;
  message: string | ReactNode;
  duration?: number;
}

const variantStyles = {
  success: {
    borderColor: 'hsl(142, 76%, 36%, 0.8)',
    shadowColor: 'hsl(142, 76%, 36%)',
    glowColor: 'hsl(142, 76%, 36%)',
    iconColor: 'hsl(142, 76%, 36%)',
    bgGradient: 'linear-gradient(135deg, hsl(142, 76%, 36%, 0.08), hsl(142, 76%, 36%, 0.03))',
    Icon: CheckCircle2,
  },
  error: {
    borderColor: 'hsl(0, 85%, 60%, 0.8)',
    shadowColor: 'hsl(0, 85%, 60%)',
    glowColor: 'hsl(0, 85%, 60%)',
    iconColor: 'hsl(0, 85%, 60%)',
    bgGradient: 'linear-gradient(135deg, hsl(0, 85%, 60%, 0.08), hsl(0, 85%, 60%, 0.03))',
    Icon: XCircle,
  },
  warning: {
    borderColor: 'hsl(38, 95%, 60%, 0.8)',
    shadowColor: 'hsl(38, 95%, 60%)',
    glowColor: 'hsl(38, 95%, 60%)',
    iconColor: 'hsl(38, 95%, 60%)',
    bgGradient: 'linear-gradient(135deg, hsl(38, 95%, 60%, 0.08), hsl(38, 95%, 60%, 0.03))',
    Icon: AlertTriangle,
  },
  info: {
    borderColor: 'hsl(210, 100%, 60%, 0.8)',
    shadowColor: 'hsl(210, 100%, 60%)',
    glowColor: 'hsl(210, 100%, 60%)',
    iconColor: 'hsl(210, 100%, 60%)',
    bgGradient: 'linear-gradient(135deg, hsl(210, 100%, 60%, 0.08), hsl(210, 100%, 60%, 0.03))',
    Icon: Info,
  },
};

function CustomToastComponent({ variant, message, onDismiss }: CustomToastConfig & { onDismiss: () => void }) {
  const styles = variantStyles[variant];
  const IconComponent = styles.Icon;
  const [isVisible, setIsVisible] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Animated progress bar
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + 0.5;
      });
    }, 20);

    return () => clearInterval(timer);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    // Delay actual dismiss to allow animation to complete
    setTimeout(() => {
      onDismiss();
    }, 600);
  };

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          initial={{
            opacity: 0,
            x: 500,
            y: -100,
            scale: 0.4,
            rotateY: 45,
            rotateX: 20,
          }}
          animate={{
            opacity: 1,
            x: 0,
            y: 0,
            scale: 1,
            rotateY: 0,
            rotateX: 0,
          }}
          exit={{
            opacity: 0,
            x: 500,
            y: 100,
            scale: 0.3,
            rotateY: -45,
            rotateX: -20,
            filter: 'blur(10px)',
          }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 18,
            mass: 0.6,
          }}
          style={{
            position: 'relative',
            perspective: '1000px',
            transformStyle: 'preserve-3d',
          }}
          onHoverStart={() => setIsHovering(true)}
          onHoverEnd={() => setIsHovering(false)}
        >
          {/* Animated background glow effect */}
          <motion.div
            animate={{
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              position: 'absolute',
              inset: '-2px',
              background: `radial-gradient(circle at 50% 50%, ${styles.glowColor}, transparent 70%)`,
              borderRadius: '0.625rem',
              filter: 'blur(8px)',
              zIndex: -1,
              opacity: 0.4,
            }}
          />

          {/* Futuristic close button with holographic effect */}
          <motion.button
            onClick={handleDismiss}
            initial={{ scale: 0, rotate: -360, opacity: 0 }}
            animate={{
              scale: 1,
              rotate: 0,
              opacity: 1,
            }}
            whileHover={{
              scale: 1.3,
              rotate: 180,
              boxShadow: `0 0 20px ${styles.glowColor}`,
            }}
            whileTap={{
              scale: 0.8,
              rotate: -180,
            }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 15,
            }}
            style={{
              position: 'absolute',
              right: '-8px',
              top: '-8px',
              background: `linear-gradient(135deg, hsl(225, 25%, 15%), hsl(225, 25%, 8%))`,
              border: `1.5px solid ${styles.borderColor}`,
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              color: 'hsl(210, 40%, 98%)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 20,
              boxShadow: `0 0 10px ${styles.glowColor}40`,
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <X size={13} strokeWidth={2.5} />
            </motion.div>
          </motion.button>

          <motion.div
            animate={{
              boxShadow: isHovering
                ? `0 0 40px ${styles.shadowColor}60, 0 0 20px ${styles.shadowColor}40, 0 12px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)`
                : `0 0 20px ${styles.shadowColor}40, 0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)`,
              y: isHovering ? -2 : 0,
            }}
            transition={{
              duration: 0.3,
              type: "spring",
              stiffness: 300,
            }}
            style={{
              background: `linear-gradient(135deg, hsl(225, 25%, 13%, 0.98), hsl(225, 25%, 10%, 0.98))`,
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              border: `1.5px solid ${styles.borderColor}`,
              borderRadius: '0.625rem',
              padding: '1rem 1.125rem',
              color: 'hsl(210, 40%, 96%)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.875rem',
              fontSize: '0.875rem',
              minWidth: '380px',
              maxWidth: '380px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >


            {/* Animated scan line effect */}
            <motion.div
              animate={{
                x: [-100, 400],
                opacity: [0, 0.5, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
                repeatDelay: 1,
              }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100px',
                height: '100%',
                background: `linear-gradient(90deg, transparent, ${styles.glowColor}30, transparent)`,
                zIndex: 1,
              }}
            />

            {/* Icon with advanced animations */}
            <motion.div
              animate={{
                rotate: [0, -15, 15, -10, 10, 0],
                scale: [1, 1.2, 1.15, 1.1, 1.05, 1],
              }}
              transition={{
                duration: 0.8,
                ease: [0.34, 1.56, 0.64, 1],
                times: [0, 0.2, 0.4, 0.6, 0.8, 1],
              }}
              style={{
                position: 'relative',
                zIndex: 2,
              }}
            >
              <IconComponent size={20} style={{ color: styles.iconColor, flexShrink: 0, position: 'relative', zIndex: 1 }} strokeWidth={2} />
            </motion.div>

            {/* Message with typewriter effect styling */}
            <motion.span
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              style={{
                position: 'relative',
                zIndex: 2,
                fontWeight: 500,
                letterSpacing: '0.01em',
              }}
            >
              {message}
            </motion.span>

            {/* Progress bar at bottom */}
            <motion.div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                height: '2px',
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${styles.glowColor}, ${styles.glowColor}80)`,
                boxShadow: `0 0 8px ${styles.glowColor}`,
                zIndex: 3,
              }}
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
            />
          </motion.div>

          {/* Particle effects on hover */}
          <AnimatePresence>
            {isHovering && (
              <>
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{
                      opacity: 0,
                      scale: 0,
                      x: 190,
                      y: 20,
                    }}
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [0, 1, 0],
                      x: 190 + (Math.random() - 0.5) * 100,
                      y: 20 + (Math.random() - 0.5) * 100,
                    }}
                    exit={{ opacity: 0 }}
                    transition={{
                      duration: 1.5,
                      delay: i * 0.1,
                      repeat: Infinity,
                      repeatDelay: 0.5,
                    }}
                    style={{
                      position: 'absolute',
                      width: '4px',
                      height: '4px',
                      borderRadius: '50%',
                      background: styles.glowColor,
                      boxShadow: `0 0 6px ${styles.glowColor}`,
                      pointerEvents: 'none',
                    }}
                  />
                ))}
              </>
            )}
          </AnimatePresence>
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
