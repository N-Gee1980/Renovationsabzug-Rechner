import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PublicLayout from './components/layouts/PublicLayout';
import AdminLayout from './components/layouts/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import ErfassungPage from './pages/ErfassungPage';
import ZusammenfassungPage from './pages/ZusammenfassungPage';
import LoginPage from './pages/admin/LoginPage';
import DashboardPage from './pages/admin/DashboardPage';
import KantonePage from './pages/admin/KantonePage';
import KategorienPage from './pages/admin/KategorienPage';
import RegelnPage from './pages/admin/RegelnPage';
import { SponsorsPage } from './pages/admin/SponsorsPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route index element={<HomePage />} />
            <Route path="erfassung/:sessionId" element={<ErfassungPage />} />
            <Route path="zusammenfassung/:sessionId" element={<ZusammenfassungPage />} />
          </Route>
          <Route path="admin/login" element={<LoginPage />} />
          <Route
            path="admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="kantone" element={<KantonePage />} />
            <Route path="kategorien" element={<KategorienPage />} />
            <Route path="regeln" element={<RegelnPage />} />
            <Route path="sponsoren" element={<SponsorsPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
