// import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './components/theme-provider.tsx'
import { BrowserRouter } from "react-router";
createRoot(document.getElementById('root')!).render(
    <ThemeProvider defaultTheme="dark">
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </ThemeProvider>
)
