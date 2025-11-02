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
        {/* Bell Button */}
        <button 
          onClick={handleToggle} 
          className="relative text-gray-400 hover:text-white p-2.5 rounded-full hover:bg-slate-800/50 transition-all duration-200 group"
        >
          <svg 
            width="22" 
            height="22" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="group-hover:scale-110 transition-transform duration-200"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          
          {/* Notification Badge */}
          {notificationCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-5 w-5 bg-gradient-to-br from-cyan-500 to-cyan-600 text-white text-[10px] font-bold items-center justify-center shadow-lg">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            </span>
          )}
        </button>

        {/* Dropdown Panel */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full right-0 mt-3 w-[calc(100vw-2rem)] sm:w-80 md:w-96 max-w-96 bg-slate-800 border border-slate-700/50 rounded-xl shadow-2xl overflow-hidden backdrop-blur-sm"
            >
              {/* Header */}
              <div className="px-3 sm:px-4 py-3 sm:py-3.5 bg-gradient-to-r from-slate-800 to-slate-800/80 border-b border-slate-700/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-cyan-600/20 border border-cyan-600/30">
                    <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-white text-sm sm:text-base">Notifications</h3>
                </div>
                {notifications.length > 0 && (
                  <span className="text-[10px] sm:text-xs text-gray-400 bg-slate-700/50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                    {notifications.length} total
                  </span>
                )}
              </div>

              {/* Notifications List */}
              <div className="max-h-96 overflow-y-auto custom-scrollbar">
                {loading ? (
                  <div className="flex flex-col items-center justify-center p-6 sm:p-8">
                    <div className="w-10 h-10 border-3 border-cyan-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                    <p className="text-gray-400 text-xs sm:text-sm">Loading notifications...</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 sm:p-12">
                    <div className="w-16 h-16 flex items-center justify-center rounded-full bg-slate-700/30 mb-4">
                      <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                    </div>
                    <p className="text-gray-400 text-xs sm:text-sm font-medium">No new notifications</p>
<p className="text-gray-500 text-[10px] sm:text-xs mt-1">You're all caught up!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-700/30">
                    {notifications.map((notif, index) => (
                      <motion.div
                        key={notif.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => setSelectedNotif(notif)}
                        className={`p-3 sm:p-4 hover:bg-slate-700/40 cursor-pointer transition-all duration-200 group ${
                          !notif.is_read ? 'bg-cyan-900/20 border-l-2 border-l-cyan-500' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Icon */}
                          <div className={`flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg ${
                            !notif.is_read 
                              ? 'bg-cyan-600/20 border border-cyan-600/30' 
                              : 'bg-slate-700/50 border border-slate-600/30'
                          }`}>
                            <svg 
                              className={`w-4 h-4 ${!notif.is_read ? 'text-cyan-400' : 'text-gray-400'}`} 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-xs sm:text-sm leading-relaxed line-clamp-2 group-hover:text-cyan-400 transition-colors">
                              {notif.content}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <p className="text-gray-500 text-xs">
                                {new Date(notif.created_at).toLocaleString(i18n.language, {
                                  dateStyle: 'medium',
                                  timeStyle: 'short',
                                })}
                              </p>
                            </div>
                          </div>

                          {/* Unread indicator */}
                          {!notif.is_read && (
                            <div className="flex-shrink-0">
                              <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Notification Detail Modal */}
      <AnimatePresence>
        {selectedNotif && (
          <NotificationDetailModal
            notification={selectedNotif}
            onClose={() => setSelectedNotif(null)}
          />
        )}
      </AnimatePresence>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(51, 65, 85, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(6, 182, 212, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(6, 182, 212, 0.7);
        }
      `}</style>
    </>
  );
}

export default NotificationBell;