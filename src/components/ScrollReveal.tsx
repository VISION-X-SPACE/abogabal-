import { motion } from 'motion/react';
import React from 'react';

interface ScrollRevealProps {
  children: React.ReactNode;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  duration?: number;
}

export default function ScrollReveal({ children, delay = 0, direction = 'up', duration = 0.7 }: ScrollRevealProps) {
  // Custom transition curve for premium, natural fluid motion
  const getVariants = () => {
    const offset = 35;
    return {
      hidden: {
        opacity: 0,
        x: direction === 'left' ? offset : direction === 'right' ? -offset : 0,
        y: direction === 'up' ? offset : direction === 'down' ? -offset : 0,
      },
      visible: {
        opacity: 1,
        x: 0,
        y: 0,
        transition: {
          duration,
          delay,
          ease: [0.16, 1, 0.3, 1], // easeOutExpo
        },
      },
    };
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
      variants={getVariants()}
      className="w-full"
    >
      {children}
    </motion.div>
  );
}
