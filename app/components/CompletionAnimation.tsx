// CONTEXT ANCHOR
// PURPOSE: To display a celebratory confetti animation when a task is completed.
// DEPENDENCIES: framer-motion
// INVARIANTS: The animation is self-contained and does not affect any other component's state.
import { motion } from "framer-motion";

const NUM_CONFETTI = 15;
const VARIANTS = {
  initial: { opacity: 0, y: 0 },
  animate: (i: number) => ({
    opacity: [1, 1, 0],
    y: [0, -20, -10],
    x: ((i % 5) - 2) * 20 + (Math.random() - 0.5) * 10,
    scale: [0.5, 1, 0],
    rotate: Math.random() * 360,
    transition: {
      duration: 0.7 + Math.random() * 0.5,
      ease: "easeOut" as const,
      delay: (i % 5) * 0.05,
    },
  }),
};

const COLORS = [
  "#FFC700",
  "#FF0000",
  "#2E3192",
  "#41A62A",
  "#CC0066",
  "#FF6600",
];

export const CompletionAnimation = () => (
  <div className="absolute inset-0 pointer-events-none">
    {Array.from({ length: NUM_CONFETTI }).map((_, i) => (
      <motion.div
        key={i}
        custom={i}
        variants={VARIANTS}
        initial="initial"
        animate="animate"
        style={{
          position: "absolute",
          left: "10px",
          top: "10px",
          width: "8px",
          height: "8px",
          borderRadius: "4px",
          backgroundColor: COLORS[i % COLORS.length],
        }}
      />
    ))}
  </div>
);
