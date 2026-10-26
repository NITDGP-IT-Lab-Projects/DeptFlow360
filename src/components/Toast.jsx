import React from 'react';
import { useApp } from '../context/AppContext.jsx';

export const ToastContainer = () => {
  const { toasts, removeToast } = useApp();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container" id="toastContainer">
      {toasts.map((toast, index) => {
        const icon = toast.type === 'success' ? '✨' :
                     toast.type === 'danger' ? '⛔' :
                     toast.type === 'warning' ? '⚡' : 'ℹ️';

        return (
          <div 
            key={toast.id} 
            className={`toast-card toast-${toast.type || 'info'}`}
            style={{
              animationDelay: `${index * 40}ms`
            }}
          >
            <span className="toast-icon" style={{ fontSize: '1.15rem' }}>{icon}</span>
            <div className="toast-body" style={{ flex: 1 }}>
              <div className="toast-title">{toast.title}</div>
              <div className="toast-desc">{toast.message}</div>
            </div>
            <button 
              className="toast-close" 
              onClick={() => removeToast(toast.id)}
              aria-label="Close Notification"
            >
              &times;
            </button>
          </div>
        );
      })}
    </div>
  );
};
