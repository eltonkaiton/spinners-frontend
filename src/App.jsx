import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import AdminHome from './pages/AdminHome';
import Login from './pages/Login';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check token in localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('adminToken');  // ✅ FIXED
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  // Protected route wrapper
  const ProtectedRoute = ({ children }) => {
    if (!isLoggedIn) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  return (
    <Router>
      <Routes>

        {/* Login route */}
        <Route path="/login" element={<Login />} />

        {/* Admin dashboard (protected) */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <AdminHome />
            </ProtectedRoute>
          }
        />

        {/* Optional: alias for backward compatibility */}
        <Route
          path="/admin-dashboard"
          element={<Navigate to="/admin/dashboard" replace />}
        />

        {/* Redirect all unknown routes */}
        <Route
          path="*"
          element={<Navigate to={isLoggedIn ? '/admin/dashboard' : '/login'} replace />}
        />

      </Routes>
    </Router>
  );
}

export default App;
