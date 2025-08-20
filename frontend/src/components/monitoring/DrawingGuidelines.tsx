import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';

interface DrawingGuidelinesProps {
  toolType: 'polygon' | 'rectangle' | 'circle' | null;
  isDrawing: boolean;
  pointsCount: number;
}

export function DrawingGuidelines({
  toolType,
  isDrawing,
  pointsCount,
}: DrawingGuidelinesProps) {
  if (!toolType) return null;

  const guidelines = {
    polygon: [
      {
        icon: 'tabler:mouse',
        text: 'Click to place points',
        condition: !isDrawing,
      },
      {
        icon: 'tabler:arrows-right',
        text: 'Double-click to complete',
        condition: isDrawing && pointsCount >= 2,
      },
      {
        icon: 'tabler:keyboard',
        text: 'Press ESC to cancel',
        condition: isDrawing,
      },
    ],
    rectangle: [
      {
        icon: 'tabler:mouse',
        text: 'Click and drag to draw',
        condition: !isDrawing,
      },
      {
        icon: 'tabler:mouse',
        text: 'Release to complete',
        condition: isDrawing,
      },
      {
        icon: 'tabler:keyboard',
        text: 'Press ESC to cancel',
        condition: isDrawing,
      },
    ],
    circle: [
      {
        icon: 'tabler:mouse',
        text: 'Click to set center',
        condition: !isDrawing,
      },
      {
        icon: 'tabler:cursor-arrow',
        text: 'Move to set radius',
        condition: isDrawing && pointsCount === 1,
      },
      {
        icon: 'tabler:mouse',
        text: 'Click to complete',
        condition: isDrawing && pointsCount === 1,
      },
    ],
  };

  const currentGuidelines = guidelines[toolType].filter(g => g.condition);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="fixed left-6 top-1/2 transform -translate-y-1/2 z-40
        bg-content1/80 backdrop-blur-sm rounded-xl shadow-lg
        border border-content3 p-4 space-y-3"
    >
      <div className="flex items-center gap-2 border-b border-content3 pb-2 mb-2">
        <Icon icon="tabler:bulb" className="text-warning text-xl" />
        <span className="text-sm font-medium">Drawing Guidelines</span>
      </div>
      
      {currentGuidelines.map((guideline, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-center gap-2 text-sm text-default-600"
        >
          <Icon icon={guideline.icon} className="text-default-400" />
          <span>{guideline.text}</span>
        </motion.div>
      ))}
    </motion.div>
  );
}