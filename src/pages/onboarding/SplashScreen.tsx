import { useEffect} from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import companyLogo from "/icons/android-chrome-512x512.png";
import { API_BASE_URL } from "@/config";
import { Loader2 } from "lucide-react";
import OfflineBanner from "@/components/common/OfflineBanner";

const SplashScreen = () => {
  const navigate = useNavigate();

  // Ping backend
  useEffect(() => {
    // Start backend ping in background
    fetch(`${API_BASE_URL}/ping`, { cache: "no-cache" })
      .then((res) => res.json())
      .then((data) => console.log("✅ Backend ping:", data))
      .catch((err) => console.warn("⚠️ Backend not ready yet:", err));

    // Navigate after fixed time (e.g. 5s)
    const timer = setTimeout(() => navigate("/login"), 5000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <>
      <OfflineBanner /> {/* Global offline indicator */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-[#8B5CF6] to-[#6366F1] text-white relative"
        >
          {/* Logo */}
          <motion.img
            src={companyLogo}
            alt="WageWise Logo"
            className="w-32 h-32 mb-4"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
          <motion.h1
            className="text-2xl font-semibold tracking-wide mb-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            WageWise
          </motion.h1>

          {/* Replace the old bar with a spinning loader */}
          <Loader2 className="animate-spin w-6 h-6 mt-4" />

          <motion.p
            className="text-sm opacity-90 mt-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Launching WageWise...
          </motion.p>

          {/* Version text */}
          <motion.div
            className="absolute bottom-6 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-medium text-white shadow-md"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            v2.1.5
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </>
  );
};

export default SplashScreen;
