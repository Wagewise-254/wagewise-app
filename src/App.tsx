import { Toaster } from 'sonner';
import AppRouterWrapper from './router';
import { TooltipProvider } from "@/components/ui/tooltip"
import './index.css'
import { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import OfflineBanner from "@/components/common/offlinebanner";

function App() {
  const { checkUser } = useAuthStore();

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  return (
    <>
    <Toaster position="top-right" richColors />
    <OfflineBanner />
     <TooltipProvider><AppRouterWrapper /></TooltipProvider>
    </>
  )
}

export default App
