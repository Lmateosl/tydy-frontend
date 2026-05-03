import { useEffect, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';

export default function PWAUpdateModal() {
  const [showModal, setShowModal] = useState(false);
  const [updateSW, setUpdateSW] = useState(null);

  useEffect(() => {
    let intervalId = null;
    let visibilityHandler = null;

    const updateServiceWorker = registerSW({
      immediate: true,
      onNeedRefresh() {
        setShowModal(true);
      },
      onOfflineReady() {
        console.log('La app está lista para funcionar offline.');
      },
      onRegisteredSW(_swUrl, registration) {
        if (!registration) return;

        // Revisa periódicamente si existe una nueva versión publicada.
        intervalId = window.setInterval(() => {
          registration.update();
        }, 60 * 1000);

        visibilityHandler = () => {
          if (document.visibilityState === 'visible') {
            registration.update();
          }
        };

        document.addEventListener('visibilitychange', visibilityHandler);
      },
    });

    setUpdateSW(() => updateServiceWorker);

    return () => {
      if (intervalId) {
        window.clearInterval(intervalId);
      }

      if (visibilityHandler) {
        document.removeEventListener('visibilitychange', visibilityHandler);
      }
    };
  }, []);

  if (!showModal) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: '#f4f8fb',
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
        <h2 style={{ color: '#0A2A47', marginBottom: '10px' }}>Actualizacion disponible</h2>
        <p style={{ color: '#333', marginBottom: '20px' }}>Hay una nueva version de la app. Actualiza para obtener las ultimas mejoras.</p>
        <button
          onClick={() => {
            if (!updateSW) return;
            setShowModal(false);
            updateSW(true);
          }}
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
