//import { useState } from 'react'
//import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import AppRouterWrapper from "./router";
// import "@fontsource/inter"; // Defaults to 400 weight
// import "@fontsource/inter/400.css"; // Specific weight
// import "@fontsource/inter/700.css"; // Bold weight


import './index.css'

const App = () => {

  return (
  <>
    <Toaster position="top-center" richColors />
    <AppRouterWrapper />
  </>)
    ;
};

export default App;