
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AppointmentsPage from './pages/AppointmentsPage';
import NotFoundPage from './pages/NotFoundPage';

function RequirePatient({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (user?.role !== 'PATIENT') {
    return <Navigate to="/" replace />;
  }

  return children;
}

function GuestOnly({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  return isAuthenticated ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />

      <Route
        path="/login"
        element={
          <GuestOnly>
            <LoginPage />
          </GuestOnly>
        }
      />

      <Route
        path="/register"
        element={
          <GuestOnly>
            <RegisterPage />
          </GuestOnly>
        }
      />

      <Route
        path="/appointments"
        element={
          <RequirePatient>
            <AppointmentsPage />
          </RequirePatient>
        }
      />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
