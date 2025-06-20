import React from 'react';
import { cn } from '@/lib/utils/utils';

interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  variant?: 'default' | 'muted' | 'error';
  size?: 'sm' | 'default' | 'lg';
}

const Text = React.forwardRef<HTMLParagraphElement, TextProps>(
  (
    { className, variant = 'default', size = 'default', children, ...props },
    ref,
  ) => {
    return (
      <p
        ref={ref}
        className={cn(
          'text-base leading-normal font-normal',
          variant === 'default' && 'text-foreground',
          variant === 'muted' && 'text-muted-foreground',
          variant === 'error' && 'text-destructive',
          size === 'sm' && 'text-sm',
          size === 'lg' && 'text-lg',
          className,
        )}
        {...props}
      >
        {children}
      </p>
    );
  },
);

Text.displayName = 'Text';

export { Text };
