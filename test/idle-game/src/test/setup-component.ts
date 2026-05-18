/**
 * Component Test Setup File
 * Extends base setup with React Testing Library and jest-dom
 */

// Import base setup (localStorage, matchMedia mocks)
import './setup';

// Import jest-dom matchers (e.g., toBeInTheDocument, toHaveTextContent)
import '@testing-library/jest-dom/vitest';

// Cleanup after each test
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
