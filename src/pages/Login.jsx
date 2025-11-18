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

  const navigate = useNavigate();

  const baseURL = 'https://spinners-backend-1.onrender.com/api/auth';

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLoginData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

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

      const response = await axios.post(`${baseURL}/login`, {
        email: emailTrimmed,
        password
      });

      if (response.data.success) {
        const user = response.data.user;

        // ✅ Save correct token name
        localStorage.setItem('adminToken', response.data.token);
        localStorage.setItem('adminUser', JSON.stringify(user));

        // ❌ Remove alert — it blocks navigation on Render
        // alert('Login successful!');

        // ✅ Redirect to correct route
        navigate('/admin/dashboard');
        return;
      }

      setError(response.data.message || 'Login failed');

    } catch (err) {
      console.error('Login error:', err);
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Login failed. Please try again.'
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
          backgroundRepeat: 'no-repeat'
        }}
      >
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
                    <div className="alert alert-danger">{error}</div>
                  )}

                  <form onSubmit={handleLogin}>

                    <div className="mb-3">
                      <label className="form-label fw-semibold text-dark">Email</label>
                      <div className="input-group">
                        <span className="input-group-text bg-light">
                          <FaUser className="text-muted" />
                        </span>
                        <input
                          type="email"
                          name="email"
                          value={loginData.email}
                          onChange={handleInputChange}
                          className="form-control"
                          placeholder="Enter your email"
                          disabled={loading}
                          required
                        />
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="form-label fw-semibold text-dark">Password</label>
                      <div className="input-group">
                        <span className="input-group-text bg-light">
                          <FaLock className="text-muted" />
                        </span>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          value={loginData.password}
                          onChange={handleInputChange}
                          className="form-control border-end-0"
                          placeholder="Enter your password"
                          disabled={loading}
                          required
                        />
                        <button
                          type="button"
                          className="input-group-text bg-light"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={loading}
                        >
                          {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                    </div>

                    <button className="btn btn-primary w-100 py-2 fw-semibold" disabled={loading}>
                      {loading ? <><FaSpinner className="fa-spin me-2" /> Signing In...</> : 'Log In'}
                    </button>

                  </form>

                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginForm;
