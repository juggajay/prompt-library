import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'danger';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium backdrop-blur-sm transition-colors',
        {
          'bg-purple-500/20 text-purple-300 border border-purple-500/30': variant === 'default',
          'bg-white/10 text-gray-300 border border-white/20': variant === 'secondary',
          'bg-green-500/20 text-green-300 border border-green-500/30': variant === 'success',
          'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30': variant === 'warning',
          'bg-red-500/20 text-red-300 border border-red-500/30': variant === 'danger',
        },
        className
      )}
      {...props}
    />
  );
}
