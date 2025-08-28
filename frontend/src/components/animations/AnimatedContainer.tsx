import { motion, AnimatePresence } from "framer-motion";

import { useAnimations } from "@/hooks/useAnimations";

interface AnimatedContainerProps {
  children: React.ReactNode;
  animation: keyof ReturnType<typeof useAnimations>;
  className?: string;
  delay?: number;
  isVisible?: boolean;
  index?: number;
}

export function AnimatedContainer({
  children,
  animation,
  className,
  delay = 0,
  isVisible = true,
  index,
}: AnimatedContainerProps) {
  const animations = useAnimations();
  const animationValue = animations[animation];

  const variants =
    typeof animationValue === "function"
      ? animationValue(index ?? 0)
      : animationValue;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          animate="animate"
          className={className}
          exit="exit"
          initial="initial"
          transition={{
            duration: 0.2,
            delay,
          }}
          variants={variants}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
