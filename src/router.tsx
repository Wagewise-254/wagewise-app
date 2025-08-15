import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import SplashScreen from './pages/onboarding/SplashScreen';
import LoginPage from './pages/onboarding/auth/LoginPage.tsx';
import SignUpPage from './pages/onboarding/auth/SignUpPage';
import RootDashboard from './pages/dashboard/RootDashboard';
import DashboardLayout from './pages/dashboard/DashboardLayout';
import { useAuthStore } from './stores/authStore';
// Import the new company-specific dashboard layout
import CompanyDashboardLayout from './pages/company/CompanyDashboardLayout';
import CompanyOverview from './pages/company/CompanyOverview';
import CompanySettings from './pages/company/CompanySettings';

// A component to protect routes
const ProtectedRoute = () => {
  const { session } = useAuthStore.getState(); // Use getState for immediate value in router setup
  return session ? <Outlet /> : <Navigate to="/login" replace />;
};

const AppRouterWrapper = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<SplashScreen />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />

         {/* Protected Dashboard Routes with Layout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<RootDashboard />} />
            {/* Add future dashboard pages here, e.g., /dashboard/settings */}
          </Route>
          {/* Company-specific Dashboard with a Company ID parameter */}
          <Route path="/company/:companyId" element={<CompanyDashboardLayout />}>
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<CompanyOverview />} />
            <Route path="settings" element={<CompanySettings />} />
            {/* We will add more routes for HR, Payroll, etc. later */}
          </Route>
        </Route>
        
      </Routes>
    </HashRouter>
  );
};

export default AppRouterWrapper;