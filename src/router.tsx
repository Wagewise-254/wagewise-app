import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import SplashScreen from './pages/onboarding/SplashScreen';
import LoginPage from './pages/onboarding/auth/LoginPage.tsx';
import SignUpPage from './pages/onboarding/auth/SignUpPage';
import RootDashboard from './pages/dashboard/RootDashboard';
import DashboardLayout from './pages/dashboard/DashboardLayout';
import AccountSettings from './pages/dashboard/AccountSettings.tsx';
import { useAuthStore } from './stores/authStore';
// Import the new company-specific dashboard layout
import CompanyDashboardLayout from './pages/company/CompanyDashboardLayout';
import CompanyOverview from './pages/company/CompanyOverview';
import CompanySettings from './pages/company/CompanySettings';
// Import the new HR pages
import EmployeesPage from './pages/company/hr/EmployeesPage';
import DepartmentsPage from './pages/company/hr/DepartmentsPage';

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
            <Route path="/dashboard/account-settings" element={<AccountSettings />} />
            {/* Add future dashboard pages here, e.g., /dashboard/settings */}
          </Route>
          {/* Company-specific Dashboard with a Company ID parameter */}
          <Route path="/company/:companyId" element={<CompanyDashboardLayout />}>
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<CompanyOverview />} />
            <Route path="settings" element={<CompanySettings />} />
            {/* HR Routes */}
            <Route path="hr/employees" element={<EmployeesPage />} />
            <Route path="hr/departments" element={<DepartmentsPage />} />
            {/* We will add more routes for Payroll etc. later */}
          </Route>
        </Route>
        
      </Routes>
    </HashRouter>
  );
};

export default AppRouterWrapper;