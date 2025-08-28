import type { Variants } from "framer-motion";

import { useMemo } from "react";

export function useAnimations() {
  const animations = useMemo(
    () => ({
      fadeIn: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      } as Variants,

      slideUp: {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -20 },
      } as Variants,

      slideRight: {
        initial: { opacity: 0, x: -20 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: 20 },
      } as Variants,

      scale: {
        initial: { opacity: 0, scale: 0.9 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.9 },
      } as Variants,

      drawer: {
        initial: { x: "-100%" },
        animate: { x: 0 },
        exit: { x: "-100%" },
      } as Variants,

      modal: {
        initial: { opacity: 0, scale: 0.95 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.95 },
      } as Variants,

      list: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      } as Variants,

      listItem: (index: number) =>
        ({
          initial: { opacity: 0, x: -20 },
          animate: {
            opacity: 1,
            x: 0,
            transition: { delay: index * 0.1 },
          },
          exit: { opacity: 0, x: 20 },
        }) as Variants,

      notification: {
        initial: { opacity: 0, y: 50, scale: 0.3 },
        animate: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: {
            type: "spring",
            stiffness: 500,
            damping: 25,
          },
        },
        exit: {
          opacity: 0,
          y: 50,
          scale: 0.3,
          transition: {
            duration: 0.2,
          },
        },
      } as Variants,

      tooltip: {
        initial: { opacity: 0, y: 10 },
        animate: {
          opacity: 1,
          y: 0,
          transition: {
            type: "spring",
            stiffness: 500,
            damping: 25,
          },
        },
        exit: {
          opacity: 0,
          y: 10,
          transition: {
            duration: 0.15,
          },
        },
      } as Variants,

      sensorValue: {
        initial: { opacity: 0, scale: 0.8 },
        animate: {
          opacity: 1,
          scale: 1,
          transition: {
            type: "spring",
            stiffness: 500,
            damping: 25,
          },
        },
        exit: {
          opacity: 0,
          scale: 0.8,
          transition: {
            duration: 0.2,
          },
        },
      } as Variants,

      mapShape: {
        initial: { opacity: 0, scale: 0.95 },
        animate: {
          opacity: 1,
          scale: 1,
          transition: {
            type: "spring",
            stiffness: 500,
            damping: 25,
          },
        },
        exit: {
          opacity: 0,
          scale: 0.95,
          transition: {
            duration: 0.2,
          },
        },
      } as Variants,

      alert: {
        initial: { opacity: 0, y: -20 },
        animate: {
          opacity: 1,
          y: 0,
          transition: {
            type: "spring",
            stiffness: 500,
            damping: 25,
          },
        },
        exit: {
          opacity: 0,
          y: -20,
          transition: {
            duration: 0.2,
          },
        },
      } as Variants,
    }),
    [],
  );

  return animations;
}
