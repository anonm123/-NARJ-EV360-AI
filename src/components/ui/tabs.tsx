'use client';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';

export const Tabs = TabsPrimitive.Root;
export function TabsList({ className, ...p }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return <TabsPrimitive.List className={cn('no-scrollbar inline-flex max-w-full gap-1 overflow-x-auto rounded-full border border-line bg-bg-2/70 p-1', className)} {...p} />;
}
export function TabsTrigger({ className, ...p }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'min-h-10 shrink-0 rounded-full px-4 text-sm font-semibold text-muted transition-colors hover:text-fg data-[state=active]:bg-[linear-gradient(110deg,rgba(0,184,255,0.18),rgba(0,229,212,0.18))] data-[state=active]:text-fg data-[state=active]:shadow-[inset_0_0_0_1px_rgba(0,229,212,0.35)]',
        className,
      )}
      {...p}
    />
  );
}
export const TabsContent = ({ className, ...p }: React.ComponentProps<typeof TabsPrimitive.Content>) => <TabsPrimitive.Content className={cn('outline-none', className)} {...p} />;
