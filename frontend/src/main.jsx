import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import './index.css';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// 2026-09-15: App.jsx uses useLocation()/<Routes>/<Route> (react-router-dom)
// but nothing here ever wrapped it in a Router - every render crashed with
// "useLocation() may be used only in the context of a <Router> component."
// before it could paint anything. Not a recent regression (git history on
// this file has no earlier Router wrapper to have lost).
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: 'hsl(var(--popover))',
              color: 'hsl(var(--popover-foreground))',
            },
          }}
        />
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
