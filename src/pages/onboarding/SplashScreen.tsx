import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import companyLogo from "/icons/android-chrome-512x512.png";
import { API_BASE_URL } from "@/config";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import OfflineBanner from "@/components/common/OfflineBanner";

const SplashScreen = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  // Ping backend
  const pingBackend = useCallback( async () => {
    try {
      setStatus("loading");
      const res = await fetch(`${API_BASE_URL}/ping`, { cache: "no-cache" });
      if (!res.ok) throw new Error("Server not ready");
      const data = await res.json();
      console.log("✅ Backend awake:", data);

      // Short delay before navigating
      setStatus("ready");
      setTimeout(() => navigate("/login"), 1000);
    } catch (err) {
      console.error("❌ Backend ping failed:", err);
      setStatus("error");
    }
  }, [navigate]);

  useEffect(() => {
    pingBackend();
  }, [pingBackend]); 

  return (
    <>
      <OfflineBanner /> {/* Global offline indicator */}
      <AnimatePresence>
        {status !== "ready" && (
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

            {/* Status message */}
            <motion.p
              className="text-sm opacity-90 mt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {status === "loading"
                ? "Checking backend status..."
                : "Unable to reach server."}
            </motion.p>

            {/* Progress bar */}
            {status === "loading" && (
              <div className="mt-4 w-40 h-1 bg-white/30 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-white"
                  initial={{ width: "0%" }}
                  animate={{ width: "80%" }}
                  transition={{ duration: 2, repeat: Infinity, repeatType: "mirror" }}
                />
              </div>
            )}

            {/* Retry UI when backend fails */}
            {status === "error" && (
              <motion.div
                className="mt-6 flex flex-col items-center bg-yellow-100 text-yellow-900 px-4 py-3 rounded-2xl shadow-md"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-medium text-sm">
                    Backend unreachable
                  </span>
                </div>
                <button
                  onClick={pingBackend}
                  className="flex items-center gap-2 text-xs bg-yellow-500 text-white px-3 py-1.5 rounded-full hover:bg-yellow-600 transition"
                >
                  <RefreshCcw className="w-3 h-3" />
                  Retry
                </button>
              </motion.div>
            )}

            {/* Version text */}
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
    </>
  );
};

export default SplashScreen;
