import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';

export const Modal = ({ isOpen, onClose, title, subtitle, children, maxWidth = 'max-w-lg' }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-ink-primary/30 backdrop-blur-xs"
      />

      {/* Modal Surface */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 6 }}
        transition={{ duration: 0.15, ease: [0.2, 0.8, 0.2, 1] }}
        className={`relative w-full ${maxWidth} bg-surface border border-border-subtle rounded-md shadow-md overflow-hidden z-10`}
      >
        <div className="flex items-center justify-between p-4 border-b border-border-subtle">
          <div>
            <h3 className="text-sm font-semibold font-serif text-ink-primary">{title}</h3>
            {subtitle && <p className="text-xs text-text-secondary mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-text-muted hover:text-ink-primary hover:bg-sunken transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4">{children}</div>
      </motion.div>
    </div>
  );
};
