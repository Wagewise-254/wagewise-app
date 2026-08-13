import './index.css'
import { Toaster } from 'sonner';
import { TooltipProvider } from "@/components/ui/tooltip"
import AppRouterWrapper from './router';
import { QueryProvider } from './providers/QueryProvider';
//import OfflineBanner from "@/components/common/offlinebanner";

function App() {

  return (
    <QueryProvider>
    
    <Toaster
        position="top-center"
        richColors
        toastOptions={{
          style: {
            background: "white",
          },
        }}
      />
    <TooltipProvider><AppRouterWrapper /></TooltipProvider>
      
    </QueryProvider>
  )
}

export default App
