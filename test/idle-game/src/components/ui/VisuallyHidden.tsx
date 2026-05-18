/**
 * Visually Hidden
 * Hides content visually but keeps it accessible to screen readers
 */

import React from 'react';

interface VisuallyHiddenProps {
  children: React.ReactNode;
  as?: 'span' | 'div';
}

const VisuallyHidden: React.FC<VisuallyHiddenProps> = ({ children, as: Component = 'span' }) => {
  return (
    <Component
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: 0,
      }}
    >
      {children}
    </Component>
  );
};

export default VisuallyHidden;
