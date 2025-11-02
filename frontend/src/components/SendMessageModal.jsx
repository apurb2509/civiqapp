import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

function SendMessageModal({ report, onClose, broadcast = false, initialMessage = '' }) {
  const { session } = useAuth();
  const [message, setMessage] = useState(initialMessage);
  const [isSending, setIsSending] = useState(false);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setIsSending(true);

    const endpoint = broadcast ? 'http://localhost:8080/api/admin/broadcast' : 'http://localhost:8080/api/admin/messages';
    
    const body = broadcast ? { content: message } : {
      recipient_id: report.user_id,
      report_id: report.id,
      content: message,
    };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send message.');
      }
      alert('Message sent successfully!');
      onClose();
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex justify-center items-center z-50 p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }} 
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="bg-slate-800 rounded-lg w-full max-w-lg shadow-2xl"
      >
        {/* Decorative gradient overlay */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-cyan-600/10 to-transparent pointer-events-none" />
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 sm:top-4 right-3 sm:right-4 z-10 w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-slate-700/50 hover:bg-slate-700 text-gray-300 hover:text-white transition-all duration-200 border border-slate-600/50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="relative px-4 sm:px-6 md:px-8 pt-8 sm:pt-10 pb-4 sm:pb-6 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-xl bg-cyan-600/20 border border-cyan-600/30">
              {broadcast ? (
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              )}
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-white">
                {broadcast ? 'Broadcast Message' : 'Send Message'}
              </h3>
              <p className="text-sm text-gray-400 mt-0.5">
                {broadcast ? 'Send to all users' : 'Send to specific user'}
              </p>
            </div>
          </div>
          
          {/* Report Info Badge */}
          {!broadcast && report && (
            <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-slate-800/50 rounded-lg border border-slate-700/30">
              <div >
                <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-gray-400">Report:</span>
                <span className="text-white font-semibold">#{report.id}</span>
                <span className="mx-1 text-gray-600">•</span>
                <span className="px-2 py-0.5 bg-cyan-600/20 border border-cyan-600/30 rounded text-cyan-400 text-xs font-medium uppercase">
                  {report.issue_type}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSendMessage}>
          <div className="p-4 sm:p-6 md:p-8">
            <label className="block text-xs sm:text-sm font-semibold text-gray-300 mb-2 sm:mb-3">
              {broadcast ? 'Broadcast Message' : 'Message Content'}
            </label>
            <div className="relative">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={broadcast ? "Type your broadcast message to all users..." : "Type your message to the user..."}
                className="w-full h-32 sm:h-40 p-3 sm:p-4 bg-slate-900/50 text-white text-sm sm:text-base rounded-lg border border-slate-700/50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent placeholder-gray-500 resize-none transition-all duration-200"
                required
              />
              <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 text-[10px] sm:text-xs text-gray-500">
                {message.length} characters
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-5 bg-slate-800/30 border-t border-slate-700/50 flex justify-end gap-2 sm:gap-3">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 sm:px-5 py-2 sm:py-2.5 text-sm sm:text-base text-gray-300 hover:text-white font-semibold rounded-lg hover:bg-slate-700/50 transition-all duration-200"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSending || !message.trim()}
              className="px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-cyan-600/20 hover:shadow-cyan-500/30 flex items-center gap-1.5 sm:gap-2"
            >
              {isSending ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  <span>Send Message</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default SendMessageModal;