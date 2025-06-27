import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import './index.css';
import { registerSW } from 'virtual:pwa-register';
import { useState, useEffect } from 'react';

function PWAUpdateModal() {
  const [showModal, setShowModal] = useState(false);
  const [updateSW, setUpdateSW] = useState(null);

  useEffect(() => {
    const updateServiceWorker = registerSW({
      onNeedRefresh() {
        setShowModal(true);
      },
      onOfflineReady() {
        console.log('La app está lista para funcionar offline.');
      },
    });
    setUpdateSW(() => updateServiceWorker);
  }, []);

  if (!showModal) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        padding: '20px',
        textAlign: 'center',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        maxWidth: '300px'
      }}>
        <h2 style={{ color: '#0A2A47', marginBottom: '10px' }}>Actualización disponible</h2>
        <p style={{ color: '#333', marginBottom: '20px' }}>Hay una nueva versión de la app. Actualiza para obtener las últimas mejoras.</p>
        <button
          onClick={() => updateSW(true)}
          style={{
            backgroundColor: '#0A2A47',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            padding: '10px 20px',
            cursor: 'pointer'
          }}
        >
          Actualizar ahora
        </button>
      </div>
    </div>
  );
}


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
      <PWAUpdateModal />
    </Provider>
  </React.StrictMode>
);
