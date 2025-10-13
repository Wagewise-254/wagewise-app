import { Toaster } from 'sonner';
import AppRouterWrapper from './router';
import './index.css'
import { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import OfflineBanner from "@/components/common/OfflineBanner";

function App() {
  const { checkUser } = useAuthStore();

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  return (
    <>
    <Toaster position="top-right" richColors />
    <OfflineBanner />
      <AppRouterWrapper />
    </>
  )
}

export default App
