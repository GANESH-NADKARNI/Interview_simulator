import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#0f1117',
            color: '#e2e8f0',
            border: '1px solid #1e293b',
            fontFamily: 'Space Grotesk, sans-serif',
          },
          success: { iconTheme: { primary: '#00ff88', secondary: '#0f1117' } },
          error: { iconTheme: { primary: '#ff4466', secondary: '#0f1117' } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
)
