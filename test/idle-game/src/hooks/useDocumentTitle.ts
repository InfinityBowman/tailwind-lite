/**
 * useDocumentTitle Hook
 * Set the document title
 */

import { useEffect, useRef } from 'react';

function useDocumentTitle(title: string, restoreOnUnmount: boolean = false): void {
  const previousTitle = useRef(document.title);

  useEffect(() => {
    document.title = title;

    if (restoreOnUnmount) {
      const prevTitle = previousTitle.current;
      return () => {
        document.title = prevTitle;
      };
    }
  }, [title, restoreOnUnmount]);
}

export default useDocumentTitle;
