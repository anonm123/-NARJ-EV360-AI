import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const cardVariants = cva('relative rounded-3xl', {
  variants: {
    variant: {
      glass: 'glass',
      solid: 'bg-surface border border-line shadow-[var(--shadow-premium)]',
      outline: 'border border-line bg-transparent',
      feature: 'bg-[linear-gradient(160deg,rgba(17,29,47,0.9),rgba(7,14,25,0.9))] border border-line shadow-[var(--shadow-premium)]',
    },
    interactive: {
      true: 'transition-all duration-500 ease-[var(--ease-premium)] hover:-translate-y-1 hover:border-line-strong hover:shadow-[0_30px_70px_-30px_rgba(0,184,255,0.35)]',
    },
  },
  defaultVariants: { variant: 'solid' },
});

export interface CardProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {}

export function Card({ className, variant, interactive, ...props }: CardProps) {
  return <div className={cn(cardVariants({ variant, interactive }), className)} {...props} />;
}
export const CardBody = ({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) => <div className={cn('p-5 sm:p-6', className)} {...p} />;
export const CardTitle = ({ className, ...p }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={cn('font-display text-lg font-semibold text-fg', className)} {...p} />
);
