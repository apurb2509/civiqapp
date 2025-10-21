import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

function SmartReplyModal({ report, onSelectReply, onClose }) {
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const generateReplies = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/admin/generate-reply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            issue_type: report.issue_type,
            description: report.description,
          }),
        });
        if (!response.ok) throw new Error('Failed to generate replies.');
        const data = await response.json();
        setReplies(data.replies);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    generateReplies();
  }, [report]);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-6">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        exit={{ scale: 0.9, opacity: 0 }} 
        className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col"
      >
        <div className="p-8 border-b border-gray-700/50 flex items-start justify-between">
          <div>
            <h3 className="text-2xl font-bold text-white">Smart Reply Suggestions</h3>
            <p className="text-sm text-gray-400 mt-2">AI-generated responses for report #{report.id}</p>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="flex-shrink-0 w-10 h-10 bg-gray-700 hover:bg-cyan-500 text-gray-300 hover:text-white rounded-lg transition-colors flex items-center justify-center"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mb-4"></div>
              <p className="text-gray-400 text-lg">Generating automated AI replies...</p>
            </div>
          )}
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-center">
              <p className="text-red-400 text-lg">{error}</p>
            </div>
          )}
          
          {!loading && !error && (
            <div className="space-y-4">
              {replies.map((reply, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => onSelectReply(reply)}
                  className="w-full text-left p-6 bg-gray-700/30 hover:bg-cyan-500/20 border border-gray-600/50 hover:border-cyan-500/50 rounded-xl transition-all duration-200 group"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center text-cyan-400 font-semibold group-hover:bg-cyan-500/30 transition-colors">
                      {index + 1}
                    </div>
                    <p className="text-gray-200 leading-relaxed flex-1 whitespace-pre-wrap break-words">{reply}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default SmartReplyModal;