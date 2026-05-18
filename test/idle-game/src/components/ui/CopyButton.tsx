/**
 * Copy Button
 * One-click copy to clipboard with feedback
 */

import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button, type ButtonProps } from './button';
import { Copy, Check } from 'lucide-react';

interface CopyButtonProps extends Omit<ButtonProps, 'onClick'> {
  text: string;
  onCopy?: () => void;
  feedbackDuration?: number;
}

const CopyButton: React.FC<CopyButtonProps> = ({
  text,
  onCopy,
  feedbackDuration = 2000,
  children,
  className,
  ...props
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      onCopy?.();

      setTimeout(() => {
        setCopied(false);
      }, feedbackDuration);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [text, onCopy, feedbackDuration]);

  return (
    <Button onClick={handleCopy} className={cn('gap-2', className)} {...props}>
      {copied ? (
        <>
          <Check className="w-4 h-4" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="w-4 h-4" />
          {children || 'Copy'}
        </>
      )}
    </Button>
  );
};

export default CopyButton;
