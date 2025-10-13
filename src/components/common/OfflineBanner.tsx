// src/components/common/OfflineBanner.tsx
import { useEffect, useState } from "react";
import { AlertTriangle, WifiOff, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const OfflineBanner = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [checking, setChecking] = useState(false);

  const checkConnection = async () => {
    setChecking(true);

    try {
      // Ping a reliable site or your backend
      const res = await fetch("https://www.google.com", {
        mode: "no-cors", // Avoid CORS errors — just checks network reachability
      });

      // If we reached here, assume we're back online
      if (res || navigator.onLine) {
        setIsOffline(false);
      }
    } catch {
      setIsOffline(true);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="fixed top-0 left-0 right-0 z-50 bg-yellow-100 border-b border-yellow-300 text-yellow-900 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 px-4 py-3 text-sm font-medium shadow-sm"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-700" />
            <WifiOff className="w-4 h-4 text-yellow-700" />
            <span className="text-center sm:text-left">
              You are offline — check your connection.
            </span>
          </div>

          <button
            onClick={checkConnection}
            disabled={checking}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-semibold transition-all
              ${
                checking
                  ? "bg-yellow-300 text-yellow-900 cursor-not-allowed"
                  : "bg-yellow-500 hover:bg-yellow-600 text-white"
              }`}
          >
            {checking ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Retry
              </>
            )}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineBanner;
