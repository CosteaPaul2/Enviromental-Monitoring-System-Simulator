import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";

interface DrawingFeedbackProps {
  message: string;
  type: "info" | "success" | "warning";
  duration?: number;
  onDismiss?: () => void;
}

export function DrawingFeedback({
  message,
  type,
  duration = 3000,
  onDismiss,
}: DrawingFeedbackProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    setIsVisible(true);

    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onDismiss?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [message, duration, onDismiss]);

  const config = {
    info: {
      icon: "tabler:info-circle",
      bgColor: "bg-blue-500/90",
      iconColor: "text-blue-200",
    },
    success: {
      icon: "tabler:check",
      bgColor: "bg-success-500/90",
      iconColor: "text-success-200",
    },
    warning: {
      icon: "tabler:alert-triangle",
      bgColor: "bg-warning-500/90",
      iconColor: "text-warning-200",
    },
  }[type];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50"
          exit={{ opacity: 0, y: -20 }}
          initial={{ opacity: 0, y: 20 }}
        >
          <div
            className={`
              ${config.bgColor}
              px-4 py-2 rounded-xl shadow-lg backdrop-blur-sm
              flex items-center gap-2 text-white
              border border-white/10
            `}
          >
            <Icon
              className={`text-xl ${config.iconColor}`}
              icon={config.icon}
            />
            <span className="text-sm font-medium">{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
