import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { router } from './router';
import { ConvexAppProvider } from './lib/convex';
import './global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConvexAppProvider>
      <RouterProvider router={router} />
    </ConvexAppProvider>
  </React.StrictMode>
);
