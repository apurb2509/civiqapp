import { motion } from 'framer-motion';

function MediaViewerModal({ mediaUrl, onClose }) {
  const isVideo = mediaUrl && (mediaUrl.includes('.mp4') || mediaUrl.includes('.webm') || mediaUrl.includes('.mov'));

  return (
    <div onClick={onClose} className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4 cursor-pointer">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="relative cursor-default" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute -top-3 -right-3 bg-white text-black rounded-full h-8 w-8 flex items-center justify-center font-bold text-lg z-10">&times;</button>
        {isVideo ? (
          <video src={mediaUrl} controls autoPlay className="max-w-[90vw] max-h-[90vh] rounded-lg" />
        ) : (
          <img src={mediaUrl} alt="Report Media" className="max-w-[90vw] max-h-[90vh] rounded-lg" />
        )}
      </motion.div>
    </div>
  );
}

export default MediaViewerModal;