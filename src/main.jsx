import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import './styles.css'
import './responsive.css'
import './ui-polish.css'
import './DesignRefinement.css'
import './Theme.css'
import './Entrance.css'
import './Spacious.css'
import './Interactions.css'
import { initializeTheme, ThemeProvider } from './context/ThemeContext'

initializeTheme()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider><AuthProvider>
        <App />
      </AuthProvider></ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
)
