/**
 * Confirm Button
 * Requires two clicks to execute dangerous actions
 */

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button, type ButtonProps } from './button';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmButtonProps extends Omit<ButtonProps, 'onClick'> {
  onConfirm: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmTimeout?: number; // Auto-cancel after ms
}

const ConfirmButton: React.FC<ConfirmButtonProps> = ({
  onConfirm,
  confirmLabel = 'Confirm?',
  cancelLabel: _cancelLabel = 'Cancel',
  confirmTimeout = 5000,
  children,
  variant = 'destructive',
  className,
  ...props
}) => {
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!confirming) return;

    const timer = setTimeout(() => {
      setConfirming(false);
    }, confirmTimeout);

    return () => clearTimeout(timer);
  }, [confirming, confirmTimeout]);

  const handleClick = () => {
    if (confirming) {
      onConfirm();
      setConfirming(false);
    } else {
      setConfirming(true);
    }
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirming(false);
  };

  if (confirming) {
    return (
      <div className="inline-flex gap-2">
        <Button
          variant="destructive"
          onClick={handleClick}
          className={cn('gap-1', className)}
          {...props}
        >
          <AlertTriangle className="w-4 h-4" />
          {confirmLabel}
        </Button>
        <Button variant="outline" onClick={handleCancel} size={props.size}>
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button variant={variant} onClick={handleClick} className={className} {...props}>
      {children}
    </Button>
  );
};

export default ConfirmButton;
