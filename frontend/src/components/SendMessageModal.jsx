import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

function SendMessageModal({ report, onClose, broadcast = false }) {
  const { session } = useAuth();
  const [message, setMessage] = useState('');
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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-xl font-bold text-white">{broadcast ? 'Send Broadcast Message' : 'Send Message'}</h3>
          {!broadcast && report && <p className="text-sm text-gray-400 mt-1">Regarding report #{report.id} ({report.issue_type})</p>}
        </div>
        <form onSubmit={handleSendMessage}>
          <div className="p-6">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={broadcast ? "Type your broadcast message to all users..." : "Type your message to the user..."}
              className="w-full h-32 p-3 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              required
            />
          </div>
          <div className="p-4 bg-gray-700/50 flex justify-end gap-4 rounded-b-lg">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-300 hover:text-white">Cancel</button>
            <button type="submit" disabled={isSending} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-md disabled:bg-gray-500">
              {isSending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
export default SendMessageModal;