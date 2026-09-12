import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/motion';
import { cn } from '@/utils/cn';
import type { ReactNode } from 'react';

export function PageTransition({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={cn(className)}
      variants={fadeUp}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {children}
    </motion.div>
  );
}
