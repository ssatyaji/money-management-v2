'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface GlowCardProps extends React.HTMLAttributes<HTMLDivElement> {}

export const GlowCard = React.forwardRef<HTMLDivElement, GlowCardProps>(
  ({ className, children, ...props }, ref) => {
    const cardRef = React.useRef<HTMLDivElement>(null);
    React.useImperativeHandle(ref, () => cardRef.current!);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      cardRef.current.style.setProperty('--mouse-x', `${x}px`);
      cardRef.current.style.setProperty('--mouse-y', `${y}px`);
    };

    return (
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        className={cn(
          'group relative overflow-hidden rounded-[24px] border border-border/80 bg-card/65 backdrop-blur-md p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5',
          'before:absolute before:inset-0 before:pointer-events-none before:opacity-0 before:transition-opacity before:duration-500',
          'dark:hover:before:opacity-100',
          'dark:before:bg-[radial-gradient(350px_circle_at_var(--mouse-x,0px)_var(--mouse-y,0px),rgba(16,185,129,0.06),transparent_80%)]',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlowCard.displayName = 'GlowCard';
