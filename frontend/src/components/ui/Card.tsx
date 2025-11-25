'use client';

import { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLMotionProps<'div'> {
  variant?: 'default' | 'elevated' | 'gradient' | 'glass';
  hover?: boolean;
  glow?: 'primary' | 'secondary' | 'success' | 'danger' | 'none';
}

const variants = {
  default: 'bg-bg-card border border-white/5',
  elevated: 'bg-bg-elevated border border-white/10',
  gradient: 'bg-gradient-to-br from-bg-card to-bg-tertiary border border-white/5',
  glass: 'bg-bg-card/50 backdrop-blur-xl border border-white/10',
};

const glowColors = {
  primary: 'hover:shadow-glow-primary hover:border-primary-500/30',
  secondary: 'hover:shadow-glow-secondary hover:border-secondary-500/30',
  success: 'hover:shadow-glow-success hover:border-success-500/30',
  danger: 'hover:shadow-glow-danger hover:border-danger-500/30',
  none: '',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', hover = false, glow = 'none', children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        whileHover={hover ? { scale: 1.02 } : undefined}
        className={cn(
          'rounded-2xl transition-all duration-200',
          variants[variant],
          glow !== 'none' && glowColors[glow],
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = 'Card';

export const CardHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('px-6 py-4 border-b border-white/5', className)}
      {...props}
    />
  )
);

CardHeader.displayName = 'CardHeader';

export const CardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6', className)} {...props} />
  )
);

CardContent.displayName = 'CardContent';

export const CardFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('px-6 py-4 border-t border-white/5', className)}
      {...props}
    />
  )
);

CardFooter.displayName = 'CardFooter';

