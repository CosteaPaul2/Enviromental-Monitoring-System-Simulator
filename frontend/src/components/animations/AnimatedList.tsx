import { motion, AnimatePresence } from "framer-motion";

import { useAnimations } from "@/hooks/useAnimations";

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
      animate="animate"
      className={className}
      exit="exit"
      initial="initial"
      variants={animations.list}
    >
      <AnimatePresence>
        {items.map((item, index) => (
          <motion.div
            key={index}
            animate="animate"
            className={itemClassName}
            exit="exit"
            initial="initial"
            transition={{
              duration: 0.2,
              delay: delay + index * 0.1,
            }}
            variants={animations.listItem(index)}
          >
            {item}
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
