import { motion, AnimatePresence } from 'framer-motion';
import { useAnimations } from '@/hooks/useAnimations';

interface AnimatedListProps {
  items: React.ReactNode[];
  className?: string;
  itemClassName?: string;
  delay?: number;
}

export function AnimatedList({
  items,
  className,
  itemClassName,
  delay = 0,
}: AnimatedListProps) {
  const animations = useAnimations();

  return (
    <motion.div
      variants={animations.list}
      initial="initial"
      animate="animate"
      exit="exit"
      className={className}
    >
      <AnimatePresence>
        {items.map((item, index) => (
          <motion.div
            key={index}
            variants={animations.listItem(index)}
            initial="initial"
            animate="animate"
            exit="exit"
            className={itemClassName}
            transition={{
              duration: 0.2,
              delay: delay + index * 0.1,
            }}
          >
            {item}
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}