import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/sonner';
import { useSessionValidation } from '@/hooks/useSessionValidation';
import MainLayout from '@/components/layout/MainLayout';
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import RegisterSuccessPage from '@/pages/RegisterSuccessPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import EmailVerifiedPage from '@/pages/EmailVerifiedPage';
import ProfilePage from '@/pages/ProfilePage';
import ReportsPage from '@/pages/ReportsPage';
import MyReportsPage from '@/pages/MyReportsPage';
import CreateReportPage from '@/pages/CreateReportPage';
import EditReportPage from '@/pages/EditReportPage';
import ReportDetailPage from '@/pages/ReportDetailPage';
import LocationsPage from '@/pages/LocationsPage';
import LocationDetailPage from '@/pages/LocationDetailPage';
import SuggestLocationPage from '@/pages/SuggestLocationPage';
import TrophyGalleryPage from '@/pages/TrophyGalleryPage';
import CronogramaPage from '@/pages/CronogramaPage';
import AboutPage from '@/pages/AboutPage';
import ContactPage from '@/pages/ContactPage';
import TermsPage from '@/pages/TermsPage';
import PrivacyPage from '@/pages/PrivacyPage';
import AdminDashboardPage from '@/pages/AdminDashboardPage';
import AccountSettingsPage from '@/pages/AccountSettingsPage';
import PrivacySettingsPage from '@/pages/PrivacySettingsPage';
import NotificationSettingsPage from '@/pages/NotificationSettingsPage';
import DeactivateAccountPage from '@/pages/DeactivateAccountPage';
import NotFound from '@/pages/NotFound';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import PublicProfilePage from '@/pages/PublicProfilePage';
import '@/App.css';

const queryClient = new QueryClient();

// Componente para validação de sessão
const SessionValidator = () => {
  useSessionValidation();
  return null;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SessionValidator />
        <Router>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<HomePage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="register-success" element={<RegisterSuccessPage />} />
              <Route path="forgot-password" element={<ForgotPasswordPage />} />
              <Route path="reset-password" element={<ResetPasswordPage />} />
              <Route path="email-verified" element={<EmailVerifiedPage />} />
              <Route path="profile" element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } />
              <Route path="user/:userId" element={<PublicProfilePage />} />
              <Route path="account-settings" element={
                <ProtectedRoute>
                  <AccountSettingsPage />
                </ProtectedRoute>
              } />
              <Route path="privacy-settings" element={
                <ProtectedRoute>
                  <PrivacySettingsPage />
                </ProtectedRoute>
              } />
              <Route path="notification-settings" element={
                <ProtectedRoute>
                  <NotificationSettingsPage />
                </ProtectedRoute>
              } />
              <Route path="deactivate-account" element={
                <ProtectedRoute>
                  <DeactivateAccountPage />
                </ProtectedRoute>
              } />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="my-reports" element={
                <ProtectedRoute>
                  <MyReportsPage />
                </ProtectedRoute>
              } />
              <Route path="create-report" element={
                <ProtectedRoute>
                  <CreateReportPage />
                </ProtectedRoute>
              } />
              <Route path="edit-report/:id" element={
                <ProtectedRoute>
                  <EditReportPage />
                </ProtectedRoute>
              } />
              <Route path="reports/:id" element={<ReportDetailPage />} />
              <Route path="locations" element={<LocationsPage />} />
              <Route path="location/:id" element={<LocationDetailPage />} />
              <Route path="suggest-location" element={
                <ProtectedRoute>
                  <SuggestLocationPage />
                </ProtectedRoute>
              } />
              <Route path="trophy-gallery" element={<TrophyGalleryPage />} />
              <Route path="cronograma" element={<CronogramaPage />} />
              <Route path="about" element={<AboutPage />} />
              <Route path="contact" element={<ContactPage />} />
              <Route path="terms" element={<TermsPage />} />
              <Route path="privacy" element={<PrivacyPage />} />
              <Route path="admin/*" element={
                <ProtectedRoute requireAdmin>
                  <AdminDashboardPage />
                </ProtectedRoute>
              } />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
          <Toaster />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
