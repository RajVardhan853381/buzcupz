import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/utils/cn';

interface CardProps extends HTMLMotionProps<'div'> {
  hover?: boolean;
  glow?: boolean;
  children: React.ReactNode;
}

export function Card({ hover = true, glow = false, className, children, ...props }: CardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -4, scale: 1.01 } : undefined}
      transition={{ duration: 0.2 }}
      className={cn(
        'bg-white rounded-2xl border border-gray-100 shadow-lg shadow-gray-100/50',
        hover && 'cursor-pointer hover:shadow-xl hover:shadow-gold-100/50 hover:border-gold-200/50',
        glow && 'glow-animation',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function CardHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('p-5 border-b border-gray-100', className)}>
      {children}
    </div>
  );
}

export function CardContent({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('p-5', className)}>{children}</div>;
}
