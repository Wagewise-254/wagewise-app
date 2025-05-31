import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import companyLogo from "/icons/android-chrome-512x512.png";

const SplashScreen = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => navigate("/login"), 500);
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-[#8B5CF6] to-[#6366F1] text-white relative"
        >
          {/* Logo with fade-in and subtle pop */}
          <motion.img
            src={companyLogo}
            alt="WageWise Logo"
            className="w-32 h-32 mb-4"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />

          {/* App Name */}
          <motion.h1
            className="text-2xl font-semibold mb-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            WageWise
          </motion.h1>

          {/* Tagline */}
          <motion.p
            className="text-sm text-white/80 mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            Smart, Simple Payroll
          </motion.p>

          {/* Spinner */}
          <motion.div
            className="w-8 h-8 border-4 border-white border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />

          {/* Version number at bottom */}
          <motion.div
            className="absolute bottom-4 text-xs text-white/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <span className="absolute bottom-4 text-[11px] px-3 py-1 rounded-full bg-white/10 text-white/70 backdrop-blur-md border border-white/15 shadow-sm">
              v{import.meta.env.VITE_APP_VERSION}
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
