import { motion } from 'framer-motion';
import { Spinner } from '@/components/ui/Spinner';
import { fadeIn } from '@/lib/motion';

export function LoadingPage({ label = 'Loading…' }: { label?: string }) {
  return (
    <motion.div
      variants={fadeIn}
      initial="initial"
      animate="animate"
      className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-slate-500"
    >
      <Spinner />
      <p className="text-sm">{label}</p>
    </motion.div>
  );
}
