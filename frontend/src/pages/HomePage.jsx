import { useEffect, useRef, useState } from 'react';
import ReportForm from '../components/ReportForm';
import { useTranslation } from 'react-i18next';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

function HomePage() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { scrollYProgress } = useScroll();
  const canvasRef = useRef(null);
  const modelViewerRef = useRef(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const y = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);

  // Load Google Model Viewer
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js';
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // Mouse tracking for hero 3D model
  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      setMousePosition({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Update model viewer camera based on mouse position
  useEffect(() => {
    if (modelViewerRef.current) {
      const azimuth = mousePosition.x * 30;
      const polar = 90 + mousePosition.y * 15;
      const orbit = `${azimuth}deg ${polar}deg 50m`;
      modelViewerRef.current.setAttribute('camera-orbit', orbit);
    }
  }, [mousePosition]);

  // 3D Particle System Background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();

    class Particle {
      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.z = Math.random() * 1000;
        this.vz = 2;
      }

      update() {
        this.z -= this.vz;
        if (this.z <= 0) {
          this.reset();
          this.z = 1000;
        }
      }

      draw() {
        const scale = 1000 / (1000 + this.z);
        const x2d = (this.x - canvas.width / 2) * scale + canvas.width / 2;
        const y2d = (this.y - canvas.height / 2) * scale + canvas.height / 2;
        const size = scale * 3;
        const opacity = (1000 - this.z) / 1000;

        ctx.fillStyle = `rgba(6, 182, 212, ${opacity * 0.8})`;
        ctx.beginPath();
        ctx.arc(x2d, y2d, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const particles = Array.from({ length: 150 }, () => new Particle());

    const animate = () => {
      ctx.fillStyle = 'rgba(2, 6, 23, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    window.addEventListener('resize', resizeCanvas);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1, 
      transition: { duration: 0.5, ease: "easeOut" } 
    }
  };

  return (
    <motion.div 
      initial="hidden" 
      animate="visible" 
      exit={{ opacity: 0 }} 
      className="bg-slate-950 text-white scroll-smooth relative"
    >
      {/* 3D Canvas Background */}
      <canvas 
        ref={canvasRef} 
        className="fixed top-0 left-0 w-full h-full pointer-events-none z-0"
      />

      {/* Hero Section with Mouse-Tracking City Model */}
      <section className="relative min-h-screen flex items-center justify-center p-0 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <model-viewer
            ref={modelViewerRef}
            src="https://res.cloudinary.com/dw28vl3tm/image/upload/v1760727835/city_rooftop_night_skybox_1_xqh0hu.glb"
            alt="Urban Infrastructure"
            touch-action="pan-y"
            shadow-intensity="1.2"
            environment-image="neutral"
            exposure="0.9"
            camera-orbit="0deg 90deg 50m"
            min-camera-orbit="auto auto 30m"
            max-camera-orbit="auto auto 100m"
            interpolation-decay="100"
            style={{ 
              width: '100%', 
              height: '100%',
              '--poster-color': 'transparent',
              opacity: '0.7'
            }}
          />
        </div>
        
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/60 to-slate-950/90 z-10" />

        <motion.div 
          variants={containerVariants} 
          className="relative z-20 max-w-5xl mx-auto text-center px-6"
        >
          <motion.h1 
            variants={itemVariants} 
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-6 tracking-tight drop-shadow-2xl"
          >
            <span className="block text-white leading-tight">
              {t('homePage.heroTitle')}
            </span>
          </motion.h1>
          
          <motion.p 
            variants={itemVariants} 
            className="text-lg sm:text-xl md:text-2xl mb-12 text-gray-200 max-w-3xl mx-auto font-light drop-shadow-lg"
          >
            {t('homePage.heroSubtitle')}
          </motion.p>
          
          {profile?.role !== 'admin' && (
            <motion.div 
              variants={itemVariants}
              className="flex justify-center gap-4 flex-wrap"
            >
<motion.a
  onClick={(e) => {
    e.preventDefault();
    const formSection = document.getElementById("report-form");
    if (formSection) {
      formSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }}
  href="#report-form"
  whileHover={{ scale: 1.08 }}
  whileTap={{ scale: 0.96 }}
  className="relative inline-flex items-center gap-3 px-10 py-4 font-semibold text-white text-lg rounded-xl 
             bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 
             shadow-[0_0_10px_rgba(56,189,248,0.35)] 
             hover:shadow-[0_0_25px_rgba(56,189,248,0.85)] 
             transition-all duration-300 group overflow-hidden cursor-pointer"
>
  {/* Subtle glow layer (soft by default) */}
  <span className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 opacity-20 blur-lg group-hover:opacity-60 transition-all duration-500"></span>

  {/* Button text + icon */}
  <span className="relative z-10 flex items-center gap-2">
    {t('homePage.reportButton')}
    <svg
      className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 8l4 4m0 0l-4 4m4-4H3"
      />
    </svg>
  </span>

  {/* Soft border glow */}
  <span className="absolute inset-0 rounded-xl border border-cyan-400/30 group-hover:border-cyan-300/70 transition-all duration-500"></span>
</motion.a>

            </motion.div>
          )}
        </motion.div>
      </section>

{/* Infrastructure Showcase - Interactive Video Section */}
<motion.section
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true, amount: 0.2 }}
  variants={containerVariants}
  className="relative py-24 bg-slate-900/50 overflow-hidden"
>
  <div className="w-full px-0">
    {/* Title & Subtitle */}
    <div className="text-center mb-16 px-6">
      <motion.h2
        variants={itemVariants}
        className="text-4xl sm:text-5xl font-bold mb-4 text-white"
      >
        Monitor Urban Infrastructure
      </motion.h2>
      <motion.p
        variants={itemVariants}
        className="text-gray-400 text-lg max-w-2xl mx-auto"
      >
        Real-time visualization of civic issues — potholes, water clogging, unsafe streets, and more
      </motion.p>
    </div>

    {/* Video Showcase */}
    <motion.div variants={itemVariants} className="relative w-full group">
      <div className="relative w-full h-[400px] sm:h-[500px] md:h-[600px] bg-gradient-to-b from-slate-800/30 to-slate-900/50 overflow-hidden rounded-2xl shadow-2xl">
        <video
          id="infrastructureVideo"
          src="https://res.cloudinary.com/dxasdsx7c/video/upload/v1760805426/civiq_homepage_video_vr1pzu.mp4"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          loop
          autoPlay
          playsInline
          muted
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/30 to-slate-950/70 pointer-events-none"></div>

        {/* Mute / Unmute Button */}
        <button
          onClick={() => {
            const video = document.getElementById('infrastructureVideo');
            if (video.muted) {
              video.muted = false;
              document.getElementById('soundLabel').textContent = 'Sound: ON';
            } else {
              video.muted = true;
              document.getElementById('soundLabel').textContent = 'Sound: OFF';
            }
          }}
          className="absolute bottom-6 right-6 bg-slate-900/70 backdrop-blur-md text-white px-5 py-2 rounded-full border border-cyan-400/50 text-sm font-medium hover:bg-cyan-600/80 hover:border-cyan-400 transition-all z-20"
        >
          <span id="soundLabel">Sound: OFF</span>
        </button>
      </div>
    </motion.div>
  </div>
</motion.section>


import { motion } from "framer-motion";
import { useRef } from "react";

{/* How It Works Section */}
<motion.section
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true, amount: 0.2 }}
  variants={containerVariants}
  className="relative py-24 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-hidden"
>
  {/* Decorative gradient glow background */}
  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(56,189,248,0.15),transparent_60%)] pointer-events-none"></div>

  <div className="max-w-7xl mx-auto px-6 relative z-10">
    {/* Title & Subtitle */}
    <div className="text-center mb-20">
      <motion.h2
        variants={itemVariants}
        className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 text-white tracking-tight"
      >
        {t("homePage.howItWorksTitle")}
      </motion.h2>

      <motion.p
        variants={itemVariants}
        className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed"
      >
        {t("homePage.howItWorksSubtitle")}
      </motion.p>
    </div>

    {/* Steps Grid */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto perspective-[1200px]">
      {[
        {
          num: "01",
          title: t("homePage.step1Title"),
          text: t("homePage.step1Text"),
          gradient: "from-cyan-500 to-blue-500",
        },
        {
          num: "02",
          title: t("homePage.step2Title"),
          text: t("homePage.step2Text"),
          gradient: "from-blue-500 to-purple-500",
        },
        {
          num: "03",
          title: t("homePage.step3Title"),
          text: t("homePage.step3Text"),
          gradient: "from-purple-500 to-pink-500",
        },
      ].map((step) => {
        const cardRef = useRef(null);

        const handleMouseMove = (e) => {
          const rect = cardRef.current.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const midX = rect.width / 2;
          const midY = rect.height / 2;

          const rotateX = ((y - midY) / midY) * -10;
          const rotateY = ((x - midX) / midX) * 10;

          cardRef.current.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        };

        const handleMouseLeave = () => {
          cardRef.current.style.transform = `rotateX(0deg) rotateY(0deg)`;
        };

        return (
          <motion.div
            key={step.num}
            variants={itemVariants}
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="relative group transition-transform duration-300 ease-out hover:-translate-y-2 rounded-2xl"
            style={{
              transformStyle: "preserve-3d",
              transformOrigin: "center",
            }}
          >
            {/* Glowing gradient ring — reduced base intensity */}
            <div
              className={`absolute -inset-[1px] rounded-2xl bg-gradient-to-br ${step.gradient} opacity-25 group-hover:opacity-100 blur-lg transition-all duration-500`}
            ></div>

            {/* Step Card */}
            <div
              className="relative bg-slate-900/80 backdrop-blur-md p-10 rounded-2xl border border-slate-800/70 hover:border-cyan-400/40 shadow-xl shadow-black/30 transition-all duration-500"
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Step Number Badge */}
              <div className="flex justify-center mb-8 relative">
                <div
                  className={`flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br ${step.gradient} bg-opacity-15 group-hover:bg-opacity-40 transition-all duration-300 shadow-inner`}
                  style={{ transform: "translateZ(30px)" }}
                >
                  <motion.span
                    className={`text-5xl font-extrabold bg-gradient-to-br ${step.gradient} bg-clip-text text-transparent`}
                    style={{
                      transform: "translateZ(60px)",
                      WebkitTextStroke: "1px rgba(255,255,255,0.5)", // softer white outline
                      textShadow: "0 2px 8px rgba(0,255,255,0.15)", // reduced glow intensity
                    }}
                    whileHover={{ scale: 1.3, rotate: 5 }}
                  >
                    {step.num}
                  </motion.span>

                  {/* Floating popup label */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileHover={{ opacity: 1, y: -30 }}
                    className="absolute -top-6 left-1/2 -translate-x-1/2 bg-cyan-500/15 text-white text-xs font-semibold px-2 py-1 rounded-md backdrop-blur-md shadow-md pointer-events-none"
                  >
                    Step {step.num}
                  </motion.div>
                </div>
              </div>

              {/* Title */}
              <h3
                className="text-2xl font-semibold mb-4 text-white text-center group-hover:text-cyan-400 transition-colors duration-300"
                style={{ transform: "translateZ(25px)" }}
              >
                {step.title}
              </h3>

              {/* Description */}
              <p
                className="text-gray-400 leading-relaxed text-center text-base group-hover:text-gray-300 transition-colors duration-300"
                style={{ transform: "translateZ(15px)" }}
              >
                {step.text}
              </p>

              {/* Subtle glowing line at bottom */}
              <div
                className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-2/3 h-[2px] bg-gradient-to-r ${step.gradient} opacity-20 group-hover:opacity-100 transition-all duration-500 rounded-full`}
              ></div>
            </div>
          </motion.div>
        );
      })}
    </div>
  </div>
</motion.section>

      

      {/* Report Form Section - Conditionally render entire section for non-admins */}
      {profile?.role !== 'admin' && (
  <section 
    id="report-form" 
    className="relative py-24 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-hidden"
  >
    {/* Decorative glowing background */}
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(56,189,248,0.12),transparent_60%)] pointer-events-none"></div>
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(168,85,247,0.1),transparent_60%)] pointer-events-none"></div>

    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="max-w-6xl mx-auto px-6 relative z-10"
    >
      {/* Section Heading */}
      <div className="text-center mb-16">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 drop-shadow-[0_0_20px_rgba(56,189,248,0.3)]"
        >
          Submit Your Report
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed"
        >
          Help make your community safer by reporting local civic issues.  
          Every submission helps build a better city for everyone.
        </motion.p>
      </div>

      {/* Report Form Wrapper with Glow */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative group"
      >
        {/* Glowing gradient ring around the form */}
        <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-500 opacity-60 group-hover:opacity-100 blur-xl transition-all duration-700"></div>

        {/* Form Container */}
        <div className="relative bg-slate-900/80 backdrop-blur-md p-10 sm:p-12 rounded-2xl border border-slate-800/60 shadow-2xl shadow-black/30 transition-all duration-500">
          {/* Decorative top glow line */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[2px] bg-gradient-to-r from-cyan-500 via-blue-400 to-purple-500 opacity-70 rounded-full"></div>

          {/* The Actual Form */}
          <div className="relative z-10">
            <ReportForm />
          </div>

          {/* Decorative bottom line */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-[2px] bg-gradient-to-r from-cyan-500 via-blue-400 to-purple-500 opacity-50 rounded-full"></div>
        </div>
      </motion.div>
    </motion.div>
  </section>
)}
    </motion.div>
  );
}

export default HomePage;