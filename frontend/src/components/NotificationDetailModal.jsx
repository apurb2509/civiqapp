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
      style={{ zIndex: 2147483647 }}
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 50, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 30, opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 260, damping: 28 }}
        className="relative w-full max-w-lg bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Decorative gradient overlay */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-cyan-600/10 to-transparent pointer-events-none" />
        
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close notification"
          className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-slate-700/50 hover:bg-slate-700 text-gray-300 hover:text-white transition-all duration-200 border border-slate-600/50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="relative px-8 pt-10 pb-6 border-b border-slate-700/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-cyan-600/20 border border-cyan-600/30">
              <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">Notification Details</h3>
              <p className="text-sm text-gray-400 mt-0.5">View notification information</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-6 space-y-5">
          {/* Timestamp */}
          <div className="flex items-start gap-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700/30">
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-cyan-600/10 border border-cyan-600/20">
              <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <span className="block text-sm text-gray-400 mb-1">Received</span>
              <span className="block text-white font-semibold">
                {new Date(notification.created_at).toLocaleString(i18n.language, {
                  dateStyle: 'long',
                  timeStyle: 'short',
                })}
              </span>
            </div>
          </div>

          {/* Type */}
          <div className="flex items-start gap-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700/30">
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-cyan-600/10 border border-cyan-600/20">
              <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <div className="flex-1">
              <span className="block text-sm text-gray-400 mb-1">Type</span>
              <span className="inline-block px-3 py-1 bg-cyan-600/20 border border-cyan-600/30 rounded-full text-cyan-400 font-semibold text-sm uppercase tracking-wide">
                {notification.type ? notification.type.replace('_', ' ') : 'General'}
              </span>
            </div>
          </div>

          {/* Message */}
          <div className="flex items-start gap-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700/30">
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-cyan-600/10 border border-cyan-600/20">
              <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div className="flex-1">
              <span className="block text-sm text-gray-400 mb-2">Message</span>
              <p className="text-white leading-relaxed bg-slate-900/50 p-4 rounded-lg border border-slate-700/30">
                {notification.content}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 bg-slate-800/30 border-t border-slate-700/50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg shadow-cyan-600/20 hover:shadow-cyan-500/30"
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