import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import axios from 'axios'
import { API_URL } from './config/api'
import { AuthProvider } from './context/AuthContext'
import { SocketProvider } from './context/SocketContext'
import { ThemeProvider } from './context/ThemeContext'
import { ConfirmationProvider } from './context/ConfirmationContext'
import './index.css'
import App from './App.jsx'

// Step 8: all axios calls use `/api/...` — baseURL prepends VITE_API_URL in production
if (API_URL) {
  axios.defaults.baseURL = API_URL
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <ThemeProvider>
            <ConfirmationProvider>
              <App />
            </ConfirmationProvider>
          </ThemeProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
