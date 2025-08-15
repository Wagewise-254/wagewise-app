import { Toaster } from 'sonner';
import AppRouterWrapper from './router';
import './index.css'
import { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';

function App() {
  const { checkUser } = useAuthStore();

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  return (
    <>
    <Toaster position="top-center" richColors />
      <AppRouterWrapper />
    </>
  )
}

export default App
