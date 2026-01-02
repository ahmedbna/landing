'use client';

import { cn } from '@/lib/utils';

export const mdxComponents = {
  h1: ({ className, ...props }: any) => (
    <h1
      className={cn(
        'scroll-m-20 text-4xl font-bold tracking-tight mb-2',
        className
      )}
      {...props}
    />
  ),
  h2: ({ className, ...props }: any) => (
    <h2
      className={cn(
        'scroll-m-20 text-2xl font-semibold tracking-tight mt-10 mb-2',
        className
      )}
      {...props}
    />
  ),
  p: ({ className, ...props }: any) => (
    <p
      className={cn(
        'leading-7 tracking-tight text-[#00000090] mb-1',
        className
      )}
      {...props}
    />
  ),
  ul: ({ className, ...props }: any) => (
    <ul className={cn('ml-6 list-disc mb-2', className)} {...props} />
  ),
  li: ({ className, ...props }: any) => (
    <li className={cn('mb-1', className)} {...props} />
  ),
};
