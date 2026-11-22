import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const buttonVariants = cva(
  'group/btn relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold tracking-tight transition-all duration-300 ease-[var(--ease-premium)] disabled:pointer-events-none disabled:opacity-50 select-none [&_svg]:size-[1.05em] [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary:
          'bg-[linear-gradient(110deg,#00B8FF,#00E5D4)] text-[#03121a] shadow-[0_10px_30px_-10px_rgba(0,184,255,0.7)] hover:shadow-[0_14px_40px_-8px_rgba(0,229,212,0.75)] hover:-translate-y-0.5 active:translate-y-0',
        secondary: 'glass text-fg hover:border-line-strong hover:bg-surface-2/80 hover:-translate-y-0.5',
        outline: 'border border-line-strong text-fg hover:border-neon/60 hover:text-white hover:bg-neon/5',
        ghost: 'text-muted hover:text-fg hover:bg-white/5',
        danger: 'border border-danger/40 text-danger hover:bg-danger/10',
        link: 'text-neon underline-offset-4 hover:underline rounded-md px-0',
      },
      size: {
        sm: 'min-h-10 px-4 text-sm',
        md: 'min-h-11 px-5 text-[0.95rem]',
        lg: 'min-h-13 px-7 text-base',
        icon: 'size-11',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button';
  return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
});
Button.displayName = 'Button';
