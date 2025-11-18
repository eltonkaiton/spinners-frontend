import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// ✅ Add Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css';

// ✅ Import AuthProvider
import { AuthProvider } from './contexts/AuthContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
);
