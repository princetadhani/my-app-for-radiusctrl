import { ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnimatedToastWrapperProps {
  children: ReactNode;
  onDismiss: () => void;
}

export function AnimatedToastWrapper({ children, onDismiss }: AnimatedToastWrapperProps) {
  const [isVisible, setIsVisible] = useState(true);

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
        >
          {typeof children === 'function' ? (children as any)(handleDismiss) : children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
