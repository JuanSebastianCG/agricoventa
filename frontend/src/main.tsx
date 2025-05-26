import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AppProvider } from './context/AppContext'

// Delay the rendering to avoid potential conflicts with browser extensions
setTimeout(() => {
  try {
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <AppProvider>
          <App />
        </AppProvider>
      </React.StrictMode>,
    )
  } catch (error) {
    console.error("Failed to render application:", error);
    
    // Display a fallback UI if the app fails to render
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; height: 100vh; padding: 20px;">
          <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); max-width: 500px;">
            <h2 style="color: #e53e3e; margin-bottom: 16px;">Error al cargar la aplicación</h2>
            <p style="margin-bottom: 16px;">Ha ocurrido un error al cargar Agricoventas.</p>
            <p style="margin-bottom: 16px;">Intenta desactivar las extensiones del navegador o usar una ventana de incógnito.</p>
            <button 
              style="width: 100%; padding: 8px 16px; background: #046B4D; color: white; border: none; border-radius: 4px; cursor: pointer;"
              onclick="window.location.reload()"
            >
              Recargar Página
            </button>
          </div>
        </div>
      `;
    }
  }
}, 200)
