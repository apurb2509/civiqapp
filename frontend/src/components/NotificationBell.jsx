import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationDetailModal from './NotificationDetailModal';

function NotificationBell() {
  const { session, profile, unreadCount, newReportCount, setUnreadCount, setNewReportCount } = useAuth();
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState(null);
  const dropdownRef = useRef(null);

  const markAsRead = async () => {
    if (!session || (profile?.role !== 'admin' && unreadCount === 0)) return;
    try {
      await fetch('http://localhost:8080/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
    } catch (error) {
      console.error("Failed to mark notifications as read", error);
    }
  };

  const fetchNotifications = async () => {
    if (!session) return;
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/notifications', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch notifications');
      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    if (newIsOpen) {
      fetchNotifications();
      if (profile?.role === 'admin') {
        setNewReportCount(0);
      } else {
        markAsRead();
        setUnreadCount(0);
      }
    }
  };
  
  const notificationCount = profile?.role === 'admin' ? newReportCount : unreadCount;

  return (
    <>
      <div ref={dropdownRef} className="relative">
        <button onClick={handleToggle} className="relative text-gray-400 hover:text-white p-2 rounded-full">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          {notificationCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-white text-xs items-center justify-center">
                {notificationCount}
              </span>
            </span>
          )}
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-gray-800 border border-gray-700 rounded-lg shadow-lg"
            >
              <div className="p-3 font-bold text-white border-b border-gray-700">Notifications</div>
              <div className="max-h-96 overflow-y-auto">
                {loading ? (
                  <p className="text-gray-400 p-4 text-center">Loading...</p>
                ) : notifications.length === 0 ? (
                  <p className="text-gray-400 p-4 text-center">No new notifications.</p>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => setSelectedNotif(notif)}
                      className={`p-4 border-b border-gray-700/50 hover:bg-gray-700/50 cursor-pointer ${
                        !notif.is_read ? 'bg-cyan-900/50' : ''
                      }`}
                    >
                      <p className="text-white text-sm truncate">{notif.content}</p>
                      <p className="text-gray-500 text-xs mt-1">
                        {new Date(notif.created_at).toLocaleString(i18n.language, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selectedNotif && (
          <NotificationDetailModal
            notification={selectedNotif}
            onClose={() => setSelectedNotif(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default NotificationBell;
