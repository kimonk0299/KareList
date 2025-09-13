import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import { registerSW } from 'virtual:pwa-register';
import { Toaster } from 'react-hot-toast';

import App from './App';
import './index.css';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  registerSW({
    onNeedRefresh() {
      // Show a prompt to refresh the app when a new version is available
      if (confirm('New version available. Refresh to update?')) {
        window.location.reload();
      }
    },
    onOfflineReady() {
      console.log('App is ready to work offline');
      // You could show a toast notification here
    },
  });
}

// Handle online/offline status
window.addEventListener('online', () => {
  console.log('App is back online');
  // Invalidate queries to refetch fresh data
  queryClient.invalidateQueries();
});

window.addEventListener('offline', () => {
  console.log('App is offline');
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <App />
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#ffffff',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '0.75rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              padding: '12px 16px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
            },
            success: {
              iconTheme: {
                primary: '#16a34a',
                secondary: '#ffffff',
              },
            },
            error: {
              iconTheme: {
                primary: '#dc2626',
                secondary: '#ffffff',
              },
            },
            loading: {
              iconTheme: {
                primary: '#6b7280',
                secondary: '#ffffff',
              },
            },
          }}
        />
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>,
);