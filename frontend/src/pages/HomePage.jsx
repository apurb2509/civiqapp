import ReportForm from '../components/ReportForm';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

function HomePage() {
  const { t } = useTranslation();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.3 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
  };

  return (
    <motion.div initial="hidden" animate="visible" exit={{ opacity: 0 }} className="bg-gray-900 text-white scroll-smooth">
      <section 
        className="h-screen flex flex-col items-center justify-center bg-cover bg-center bg-fixed p-4" 
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1594495894542-a46123b4841a?q=80&w=2070&auto=format&fit=crop')" }}
      >
        <motion.div variants={containerVariants} className="bg-black bg-opacity-60 p-8 md:p-12 rounded-xl text-center max-w-4xl">
          <motion.h1 variants={itemVariants} className="text-4xl sm:text-5xl md:text-7xl font-extrabold mb-4 drop-shadow-lg">
            {t('homePage.heroTitle')}
          </motion.h1>
          <motion.p variants={itemVariants} className="text-lg sm:text-xl md:text-2xl mb-8 text-gray-200">
            {t('homePage.heroSubtitle')}
          </motion.p>
          <motion.div variants={itemVariants}>
            <a href="#report-form" className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-6 sm:py-4 sm:px-8 rounded-lg text-base sm:text-lg transition-transform transform hover:scale-105 duration-300 inline-block">
              {t('homePage.reportButton')}
            </a>
          </motion.div>
        </motion.div>
      </section>

      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={containerVariants}
        className="py-16 sm:py-20 bg-gray-800"
      >
        <div className="container mx-auto px-6 text-center">
          <motion.h2 variants={itemVariants} className="text-3xl sm:text-4xl font-bold mb-2">{t('homePage.howItWorksTitle')}</motion.h2>
          <motion.p variants={itemVariants} className="text-gray-400 mb-12 max-w-2xl mx-auto">
            {t('homePage.howItWorksSubtitle')}
          </motion.p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
            <motion.div variants={itemVariants} className="bg-gray-900 p-8 rounded-xl shadow-2xl">
              <div className="text-cyan-400 text-5xl sm:text-6xl font-bold mb-4">1</div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3">{t('homePage.step1Title')}</h3>
              <p className="text-gray-400">{t('homePage.step1Text')}</p>
            </motion.div>
            <motion.div variants={itemVariants} className="bg-gray-900 p-8 rounded-xl shadow-2xl">
              <div className="text-cyan-400 text-5xl sm:text-6xl font-bold mb-4">2</div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3">{t('homePage.step2Title')}</h3>
              <p className="text-gray-400">{t('homePage.step2Text')}</p>
            </motion.div>
            <motion.div variants={itemVariants} className="bg-gray-900 p-8 rounded-xl shadow-2xl">
              <div className="text-cyan-400 text-5xl sm:text-6xl font-bold mb-4">3</div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3">{t('homePage.step3Title')}</h3>
              <p className="text-gray-400">{t('homePage.step3Text')}</p>
            </motion.div>
          </div>
        </div>
      </motion.section>

      <section id="report-form" className="py-16 sm:py-20 flex justify-center items-center bg-gray-900 p-4">
        <ReportForm />
      </section>
    </motion.div>
  );
}

export default HomePage;