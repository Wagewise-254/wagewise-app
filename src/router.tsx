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
import CompanyOverview from './pages/company/dashboard/CompanyOverview.tsx';
import CompanySettings from './pages/company/settings/CompanySettings.tsx';
import CompanyReports from './pages/company/reports/CompanyReports.tsx';
// Import the new HR pages
import EmployeesPage from './pages/company/hr/EmployeesPage';
import DepartmentsPage from './pages/company/hr/DepartmentsPage';
//Import payroll pages
//import BankDetailsPage from './pages/company/payroll/BankDetailsPage';
import StatutoryPage from './pages/company/payroll/StatutoryPage';
import DeductionPage from './pages/company/payroll/DeductionPage.tsx';
import AllowancePage from './pages/company/payroll/AllowancePage.tsx';
import PayRunPage from './pages/company/payroll/PayrunPage.tsx';
import PayrollDetailsPage from './pages/company/payroll/PayrollDetailPage.tsx';
import ReportPreviewPage from "./pages/company/payroll/ReportPreviewPage";
//import HelbPage from './pages/company/payroll/HelbPage';

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
            <Route path="reports" element={<CompanyReports />} />
            {/* HR Routes */}
            <Route path="hr/employees" element={<EmployeesPage />} />
            <Route path="hr/departments" element={<DepartmentsPage />} />
            {/* Payroll Routes */}
             {/* Add the new statutory deductions route */}
            <Route path="payroll/statutory-deductions" element={<StatutoryPage />} />
            <Route path="payroll/deductions" element={<DeductionPage />} />
            <Route path="payroll/allowances" element={<AllowancePage />} />
            <Route path="payroll/pay-runs" element={<PayRunPage />} />
            <Route path="payroll/pay-runs/:runId" element={<PayrollDetailsPage />} />

             {/* === NEW ROUTE === */}
  <Route path="payroll/report-preview" element={<ReportPreviewPage />} />

          </Route>
        </Route>
        
      </Routes>
    </HashRouter>
  );
};

export default AppRouterWrapper;