import React, { useEffect } from 'react';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes } from 'react-icons/fa';

const Toast = ({ message, type = 'success', onClose, duration = 4000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FaCheckCircle style={{ color: '#10b981', fontSize: '1.2rem' }} />;
      case 'error':
        return <FaExclamationCircle style={{ color: '#ef4444', fontSize: '1.2rem' }} />;
      case 'info':
      default:
        return <FaInfoCircle style={{ color: '#0ea5e9', fontSize: '1.2rem' }} />;
    }
  };

  return (
    <div className={`toast toast-${type} glass-panel`}>
      {getIcon()}
      <div style={{ flexGrow: 1, fontSize: '0.9rem', fontWeight: 600 }}>{message}</div>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: 'rgba(255, 255, 255, 0.4)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <FaTimes />
      </button>
    </div>
  );
};

export default Toast;
