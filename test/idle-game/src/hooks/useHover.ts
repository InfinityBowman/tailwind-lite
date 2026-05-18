/**
 * useHover Hook
 * Detects when an element is hovered
 */

import { useState, useCallback, useRef, type RefCallback } from 'react';

function useHover<T extends HTMLElement = HTMLElement>(): [RefCallback<T>, boolean] {
  const [isHovered, setIsHovered] = useState(false);
  const savedNode = useRef<T | null>(null);

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);

  // Ref callback to attach event listeners
  const setRef = useCallback(
    (node: T | null) => {
      // Clean up previous node
      if (savedNode.current) {
        savedNode.current.removeEventListener('mouseenter', handleMouseEnter);
        savedNode.current.removeEventListener('mouseleave', handleMouseLeave);
      }

      // Set up new node
      if (node) {
        node.addEventListener('mouseenter', handleMouseEnter);
        node.addEventListener('mouseleave', handleMouseLeave);
      }

      savedNode.current = node;
    },
    [handleMouseEnter, handleMouseLeave]
  );

  return [setRef, isHovered];
}

export default useHover;
