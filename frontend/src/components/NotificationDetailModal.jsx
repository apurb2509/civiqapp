import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

function NotificationDetailModal({ notification, onClose }) {
  const { i18n } = useTranslation();

  return (
    <div onClick={onClose} className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md cursor-default" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex justify-between items-start">
            <h3 className="text-xl font-bold text-white mb-2">Notification Details</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
          </div>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between border-b border-gray-700 pb-2">
              <span className="text-gray-400">Received:</span>
              <span className="text-white font-medium">{new Date(notification.created_at).toLocaleString(i18n.language, { dateStyle: 'long', timeStyle: 'short' })}</span>
            </div>
            <div className="flex justify-between border-b border-gray-700 pb-2">
              <span className="text-gray-400">Type:</span>
              <span className="text-white font-medium uppercase">{notification.type.replace('_', ' ')}</span>
            </div>
            <div>
              <span className="text-gray-400 block mb-1">Message:</span>
              <p className="text-white bg-gray-700/50 p-3 rounded-md">{notification.content}</p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-gray-700/50 flex justify-end rounded-b-lg">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-md">Close</button>
        </div>
      </motion.div>
    </div>
  );
}

export default NotificationDetailModal;