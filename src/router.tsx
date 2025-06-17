import { HashRouter, Routes, Route} from "react-router-dom";
import LoginPage from "./pages/auth/loginPage";
import SignUpPage from "./pages/auth/signupPage";
import  ResetPasswordPage  from "./pages/auth/ResetPasswordPage";
import  ForgotPasswordPage  from "./pages/auth/ForgotPasswordPage";
import  VerifyCodePage  from "./pages/auth/VerifyCodePage";
import SplashScreen from "./pages/SplashScreen";
import MainDashboard from "./pages/dashboard/main/mainDashboard";
import EmployeePage from "./pages/dashboard/employee/employeePage";
import AddEmployeePage from '@/pages/dashboard/employee/add';
import EditEmployeePage from '@/pages/dashboard/employee/edit/EditEmployeePage';
import TaxPage from "./pages/dashboard/tax/TaxPage";
import PayrollPage from "./pages/dashboard/payroll/PayrollPage";
import ReportsPage from "./pages/dashboard/reports/ReportsPage";
import AccountPage from "./pages/dashboard/account/AccountPage";

const AppRouter = () => {


  return (
    <div className="relative">
      <Routes>
        <Route path="/" element={<SplashScreen />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/dashboard" element={<MainDashboard />} />
        <Route path="/employee" element={<EmployeePage />} />
        <Route path="/employee/add" element={<AddEmployeePage />} />
        <Route path="/employee/edit/:id" element={<EditEmployeePage />} />
        <Route path="/tax" element={<TaxPage />} />
        <Route path="/payroll" element={<PayrollPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/verify-code" element={<VerifyCodePage />} />  
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


