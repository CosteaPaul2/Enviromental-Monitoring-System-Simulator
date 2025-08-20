import { motion, AnimatePresence } from 'framer-motion';
import { useAnimations } from '@/hooks/useAnimations';

interface AnimatedValueProps {
  value: string | number;
  className?: string;
  color?: string;
}

export function AnimatedValue({
  value,
  className,
  color,
}: AnimatedValueProps) {
  const animations = useAnimations();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={value.toString()}
        variants={animations.sensorValue}
        initial="initial"
        animate="animate"
        exit="exit"
        className={`${className} ${color}`}
      >
        {value}
      </motion.div>
    </AnimatePresence>
  );
}