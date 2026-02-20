import { cn } from '@/lib/utils';

export const mdxComponents = {
  h1: ({ className, ...props }: any) => (
    <h1
      className={cn(
        'scroll-m-20 text-4xl font-bold tracking-tight mb-2',
        className,
      )}
      {...props}
    />
  ),
  h2: ({ className, ...props }: any) => (
    <h2
      className={cn(
        'scroll-m-20 text-2xl font-semibold tracking-tight mt-10 mb-2',
        className,
      )}
      {...props}
    />
  ),
  h3: ({ className, ...props }: any) => (
    <h2
      className={cn(
        'scroll-m-20 text-lg font-semibold tracking-tight mt-4 mb-1',
        className,
      )}
      {...props}
    />
  ),
  p: ({ className, ...props }: any) => (
    <p
      className={cn('tracking-tight text-[#00000095] font-medium', className)}
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
