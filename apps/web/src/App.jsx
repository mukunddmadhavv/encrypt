import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Landing   from './pages/Landing.jsx';
import Login     from './pages/Login.jsx';
import Register  from './pages/Register.jsx';
import Connect   from './pages/Connect.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Settings  from './pages/Settings.jsx';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="mesh-bg" />
        <Routes>
          {/* Public */}
          <Route path="/"          element={<Landing />} />
          <Route path="/login"     element={<Login />} />
          <Route path="/register"  element={<Register />} />

          {/* Protected */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/connect"   element={<ProtectedRoute><Connect /></ProtectedRoute>} />
          <Route path="/settings"  element={<ProtectedRoute><Settings /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
