import { motion, AnimatePresence } from "framer-motion";

import { useAnimations } from "@/hooks/useAnimations";

interface AnimatedValueProps {
  value: string | number;
  className?: string;
  color?: string;
}

export function AnimatedValue({ value, className, color }: AnimatedValueProps) {
  const animations = useAnimations();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={value.toString()}
        animate="animate"
        className={`${className} ${color}`}
        exit="exit"
        initial="initial"
        variants={animations.sensorValue}
      >
        {value}
      </motion.div>
    </AnimatePresence>
  );
}
