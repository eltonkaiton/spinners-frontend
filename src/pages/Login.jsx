import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaLock, FaEye, FaEyeSlash, FaSpinner } from 'react-icons/fa';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

function LoginForm() {
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const navigate = useNavigate(); // ✅ React Router hook

  const baseURL = 'https://spinners-backend-1.onrender.com/api/auth';

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLoginData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const handleRememberMe = (e) => setRememberMe(e.target.checked);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const emailTrimmed = loginData.email.trim();
      const password = loginData.password;

      if (!emailTrimmed || !password) {
        setError('Please fill in all fields');
        setLoading(false);
        return;
      }

      console.log('Sending login request:', { email: emailTrimmed, password });

      const response = await axios.post(`${baseURL}/login`, {
        email: emailTrimmed,
        password
      });

      if (response.data.success) {
        const user = response.data.user;

        localStorage.setItem('adminToken', response.data.token);
        localStorage.setItem('adminUser', JSON.stringify(user));

        alert('Login successful! Redirecting to admin dashboard...');
        navigate('/admin-dashboard'); // ✅ Client-side redirect
      } else {
        setError(response.data.message || 'Login failed');
      }

    } catch (err) {
      console.error('Login error:', err);
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Login failed. Please check your credentials and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <div className="flex-grow-1 d-flex align-items-center justify-content-center"
           style={{ 
             backgroundImage: 'url(/spinnerlog.png)',
             backgroundSize: 'cover',
             backgroundPosition: 'center',
             backgroundRepeat: 'no-repeat',
             fontFamily: 'Arial, sans-serif' 
           }}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-6 col-lg-4">
              <div className="card shadow-lg border-0 rounded-3">
                <div className="card-header bg-primary text-white text-center py-4 rounded-top-3">
                  <div className="d-flex align-items-center justify-content-center mb-3">
                    <div className="bg-white rounded-circle p-3 me-3">
                      <FaUser size={24} className="text-primary" />
                    </div>
                    <div>
                      <h2 className="mb-0 fw-bold">Spinners Web Kenya</h2>
                      <p className="mb-0 opacity-75">Admin Portal</p>
                    </div>
                  </div>
                </div>

                <div className="card-body p-4">
                  <div className="text-center mb-4">
                    <h4 className="text-dark fw-bold">Welcome Back</h4>
                    <p className="text-muted">Sign in to access the admin dashboard</p>
                  </div>

                  {error && (
                    <div className="alert alert-danger d-flex align-items-center" role="alert">
                      <div className="flex-grow-1">{error}</div>
                      <button type="button" className="btn-close" onClick={() => setError('')}></button>
                    </div>
                  )}

                  <form onSubmit={handleLogin}>
                    <div className="mb-3">
                      <label htmlFor="email" className="form-label fw-semibold text-dark">Email Address</label>
                      <div className="input-group">
                        <span className="input-group-text bg-light border-end-0">
                          <FaUser className="text-muted" />
                        </span>
                        <input
                          type="email"
                          className="form-control border-start-0"
                          id="email"
                          name="email"
                          value={loginData.email}
                          onChange={handleInputChange}
                          placeholder="Enter your email"
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="mb-4">
                      <label htmlFor="password" className="form-label fw-semibold text-dark">Password</label>
                      <div className="input-group">
                        <span className="input-group-text bg-light border-end-0">
                          <FaLock className="text-muted" />
                        </span>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          className="form-control border-start-0 border-end-0"
                          id="password"
                          name="password"
                          value={loginData.password}
                          onChange={handleInputChange}
                          placeholder="Enter your password"
                          required
                          disabled={loading}
                        />
                        <button 
                          type="button" 
                          className="input-group-text bg-light border-start-0"
                          onClick={togglePasswordVisibility} 
                          disabled={loading}
                        >
                          {showPassword ? <FaEyeSlash className="text-muted" /> : <FaEye className="text-muted" />}
                        </button>
                      </div>
                    </div>

                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <div className="form-check">
                        <input 
                          type="checkbox" 
                          className="form-check-input" 
                          id="rememberMe" 
                          checked={rememberMe}
                          onChange={handleRememberMe}
                        />
                        <label className="form-check-label text-muted" htmlFor="rememberMe">Remember me</label>
                      </div>
                      <a href="#forgot-password" className="text-primary text-decoration-none">Forgot Password?</a>
                    </div>

                    <button type="submit" className="btn btn-primary w-100 py-2 fw-semibold" disabled={loading}>
                      {loading ? <><FaSpinner className="fa-spin me-2" /> Signing In...</> : 'Log In'}
                    </button>
                  </form>

                  <div className="text-center mt-4 pt-3" style={{ borderTop: '1px solid #dee2e6' }}>
                    <small className="text-muted">
                      2025 © Designed by <strong style={{ color: '#007bff' }}>Forge Reactor</strong>
                    </small>
                  </div>
                </div>
              </div>

              <div className="text-center mt-4">
                <small className="text-white opacity-75">
                  <i className="fas fa-shield-alt me-1"></i>
                  Secure admin access only. Unauthorized access prohibited.
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginForm;
