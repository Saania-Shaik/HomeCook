import React, { useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';

const Modal = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content glass-panel"
        onClick={(e) => e.stopPropagation()}
        style={{ border: '1px solid var(--glass-border)' }}
      >
        <button className="modal-close" onClick={onClose}>
          <FaTimes />
        </button>
        {title && (
          <h2
            style={{
              marginBottom: '1.5rem',
              fontSize: '1.5rem',
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
              borderBottom: '1px solid var(--border-color)',
              paddingBottom: '0.75rem',
            }}
          >
            {title}
          </h2>
        )}
        <div>{children}</div>
      </div>
    </div>
  );
};

export default Modal;
