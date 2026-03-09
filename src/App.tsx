import './index.css'
import { Toaster } from 'sonner';
import { TooltipProvider } from "@/components/ui/tooltip"
import AppRouterWrapper from './router';
//import OfflineBanner from "@/components/common/offlinebanner";

function App() {

  return (
    <>
    <Toaster position="top-center" richColors />
    <TooltipProvider><AppRouterWrapper /></TooltipProvider>
      
    </>
  )
}

export default App
