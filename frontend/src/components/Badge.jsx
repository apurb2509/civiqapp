import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

function Badge({ title, date }) {
  const { i18n } = useTranslation();
  
  return (
    <motion.div
      className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex items-center gap-4 shadow-lg"
      whileHover={{ y: -5, boxShadow: "0px 10px 20px rgba(0, 0, 0, 0.2)" }}
    >
      <div className="bg-gradient-to-br from-amber-400 to-amber-600 p-3 rounded-full shadow-md shadow-amber-500/20">
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path></svg>
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-white">{title}</h3>
        <p className="text-xs text-gray-400">Awarded on {new Date(date).toLocaleDateString(i18n.language, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>
    </motion.div>
  );
}

export default Badge;