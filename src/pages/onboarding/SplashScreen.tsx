import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import companyLogo from "/icons/android-chrome-512x512.png";
import { API_BASE_URL } from "@/config";

const SplashScreen = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  );

  useEffect(() => {
    // Ping your backend to "wake it up"
    fetch(`${API_BASE_URL}/ping`, { cache: "no-cache" })
      .then((res) => {
        if (!res.ok) throw new Error("Server not ready");
        return res.json();
      })
      .then((data) => {
        console.log("Backend awake:", data);
        setStatus("ready");
        // Wait a short moment before navigating to login
        setTimeout(() => navigate("/login"), 1000);
      })
      .catch((err) => {
        console.error("Ping failed:", err);
        setStatus("error");
        // Try again after a few seconds if still cold
        setTimeout(() => window.location.reload(), 5000);
      });
  }, [navigate]);

  return (
    <AnimatePresence>
      {status !== "ready" && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-[#8B5CF6] to-[#6366F1] text-white relative"
        >
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

          {/* Status text */}
          <motion.p
            className="text-sm opacity-90 mt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {status === "loading"
              ? "Preparing backend..."
              : status === "error"
              ? "Retrying connection..."
              : ""}
          </motion.p>
          <div className="mt-4 w-40 h-1 bg-white/30 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-white"
              initial={{ width: "0%" }}
              animate={{ width: status === "loading" ? "60%" : "100%" }}
              transition={{ duration: status === "loading" ? 2 : 0.5 }}
            />
          </div>

          <motion.div
            className="absolute bottom-6 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-medium text-white shadow-md"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            v2.1.4
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
