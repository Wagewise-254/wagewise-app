import { HashRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/auth/loginPage";
import SignUpPage from "./pages/auth/signupPage";
import SplashScreen from "./pages/SplashScreen";
import MainDashboard from "./pages/dashboard/mainDashboard";

const AppRouter = () => {
  // const [loading, setLoading] = useState(false);
  // const location = useLocation(); // Detect route changes

  // useEffect(() => {
  //   setLoading(true); // Show loader when switching pages
  //    // Wait for the new page component to mount
  //    const handleLoad = () => setLoading(false);

  //    // Simulate component loading
  //    setTimeout(handleLoad, 200); // Adjust timeout if needed
 
  //    return () => setLoading(false); // Cleanup on unmount
  //  }, [location]);

  return (
    <div className="relative">
       {/* {loading && <Loader />} Display spinner when loading */}
      <Routes>
        <Route path="/" element={<SplashScreen />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/dashboard" element={<MainDashboard />} />
        {/* Add other routes here */}
        {/* Example: */}
        {/* <Route path="/profile" element={<ProfilePage />} /> */}
        {/* <Route path="/settings" element={<SettingsPage />} /> */}

        {/* Uncomment and add your other routes as needed */}
        {/* <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/employee" element={<EmployeePage />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/report" element={<ReportPage />} />
        <Route path="/tax" element={<TaxPage />} />
        <Route path="/account" element={<AccountPage />} /> */}

      </Routes>
    </div>
  );
};

const AppRouterWrapper = () => {
  return (
    <HashRouter>
      <AppRouter />
    </HashRouter>
  );
};

export default AppRouterWrapper;