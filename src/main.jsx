import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { OnlineProvider } from './context/OnlineContext'
import { setupSyncListeners } from './lib/sync'
import './index.css'

setupSyncListeners()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <OnlineProvider>
        <AuthProvider>
          <App />
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3500,
              style: {
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.9rem',
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(44,24,16,0.18)',
              },
              success: {
                iconTheme: { primary: '#2D6A4F', secondary: '#fff' },
              },
              error: {
                iconTheme: { primary: '#9B2335', secondary: '#fff' },
              },
            }}
          />
        </AuthProvider>
      </OnlineProvider>
    </BrowserRouter>
  </React.StrictMode>
)
