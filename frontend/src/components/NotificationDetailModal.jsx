// NotificationDetailModal.jsx
import React from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

function NotificationDetailModal({ notification, onClose }) {
  const { i18n } = useTranslation();

  // If document is not ready (SSR), return null
  if (typeof document === 'undefined') return null;

  const modal = (
    <div
      onClick={onClose}
      // overlay covers entire viewport
      style={{ zIndex: 2147483647 }} // extreme z-index to force on top
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 40, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 20, opacity: 0, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 220, damping: 26 }}
        // center absolutely to avoid any stacking context issues
        style={{
          position: 'fixed',
          top: '27%',
          left: '35%',
          transform: 'translate(-50%, -50%)',
        }}
        className="w-full max-w-md bg-gray-800 rounded-lg shadow-2xl cursor-default"
        role="dialog"
        aria-modal="true"
      >
        {/* Close X at top-right */}
        <button
          onClick={onClose}
          aria-label="Close notification"
          className="absolute top-3 right-3 text-gray-300 hover:text-white text-2xl"
          style={{ zIndex: 10 }}
        >
          &times;
        </button>

        <div className="p-6 pt-8">
          <h3 className="text-xl font-bold text-white mb-2 text-center">Notification Details</h3>

          <div className="space-y-4 text-sm">
            <div className="flex justify-between border-b border-gray-700 pb-2">
              <span className="text-gray-400">Received:</span>
              <span className="text-white font-medium">
                {new Date(notification.created_at).toLocaleString(i18n.language, {
                  dateStyle: 'long',
                  timeStyle: 'short',
                })}
              </span>
            </div>

            <div className="flex justify-between border-b border-gray-700 pb-2">
              <span className="text-gray-400">Type:</span>
              <span className="text-white font-medium uppercase">
                {notification.type ? notification.type.replace('_', ' ') : ''}
              </span>
            </div>

            <div>
              <span className="text-gray-400 block mb-1">Message:</span>
              <p className="text-white bg-gray-700/50 p-3 rounded-md leading-relaxed">
                {notification.content}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-700/50 flex justify-end rounded-b-lg">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-md"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );

  return createPortal(modal, document.body);
}

export default NotificationDetailModal;
