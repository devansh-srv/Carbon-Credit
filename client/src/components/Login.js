import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/api';
import { Turnstile } from '@marsidev/react-turnstile';


const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({ username: '', password: '', role: 'buyer' });
  const [captchaToken, setCaptchaToken] = useState('');
  const [status, setStatus] = useState(null)
  const navigate = useNavigate();
  const SITE_KEY = process.env.REACT_APP_SITE_KEY || '1x00000000000000000000AA';
  const [showPassword, setShowPassword] = useState(false);
  const [loadStatus, setLoadSatus] = useState(false);
  const [showTestPrompt, setShowTestPrompt] = useState(true); 

  useEffect(() => {
    setTimeout(() => setShowTestPrompt(false), 10000); // Auto-hide after 5 sec
  }, []);

  
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };


  const handleSubmit = async (e) => {
    if (!captchaToken) {
      alert('Please complete the CAPTCHA.');
      return;
    }
    e.preventDefault();
    try {
      setLoadSatus(true);
      const response = await login({ ...formData, 'cf-turnstile-response': captchaToken });
      localStorage.setItem('token', response.data.access_token);

      const userRole = response.data.role;
      onLogin({ username: formData.username, role: userRole });

      navigate(userRole === 'admin' ? '/admin-dashboard' : '/buyer-dashboard');
    } catch (error) {
      setLoadSatus(false);
      if (error.status === 401) {
        setStatus(error?.response?.data?.message)
        setInterval(() => setStatus(null), 3000)
      } else if (error.status === 400) {
        alert(error?.response?.data?.message);
      } else {
        console.error('Login failed:', error);
      }

    }
  };

  return (
    <>
      <div className="flex justify-center items-center py-12 px-4 w-full min-h-screen bg-gradient-to-br from-emerald-100 to-blue-200">
        {status && (
          <div className="flex fixed top-5 left-1/2 items-center py-2 px-4 text-white bg-red-500 rounded-lg shadow-lg transition-transform duration-300 transform -translate-x-1/2 animate-slideIn">
            <span>{status}</span>
          </div>
        )}

        {showTestPrompt && (
          <div className="fixed top-5 left-1/2 transform -translate-x-1/2 bg-white shadow-lg p-4 rounded-lg flex items-center gap-4">
            <span>Login as:</span>
            <button
              className="px-3 py-1 bg-cyan-800 text-white rounded-md"
              onClick={() => {
                setFormData({ username: "test_buyer", password: "sepolia", role: "buyer" });
                setShowTestPrompt(false);
              }}
            >
              Test Buyer
            </button>
            <button
              className="px-3 py-1 bg-emerald-600 text-white rounded-md"
              onClick={() => {
                setFormData({ username: "test_admin", password: "sepolia", role: "admin" });
                setShowTestPrompt(false);
              }}
            >
              Test Admin
            </button>
          </div>
        )}

        <div className="w-full max-w-md rounded-xl shadow-xl bg-white/80 backdrop-blur-sm">
          <div className="p-8 rounded-xl shadow-lg bg-emerald-50/90">
            <div className="mb-1 text-sm font-semibold tracking-wide text-emerald-700 uppercase">Welcome back</div>
            <h2 className="block mt-1 text-2xl font-medium leading-tight text-emerald-800">Login to your account</h2>
            <form onSubmit={handleSubmit} className="mt-6 space-y-6">
              <div>
                <label className="block mb-2 text-sm font-medium text-emerald-700" htmlFor="username">
                  Username
                </label>
                <input
                  className="py-2 px-3 w-full rounded-lg border border-emerald-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-emerald-100/50"
                  id="username"
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-emerald-700" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <input
                    className="py-2 px-3 w-full rounded-lg border border-emerald-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-emerald-100/50"
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    className="flex absolute inset-y-0 right-3 items-center text-emerald-600"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-emerald-700" htmlFor="role">
                  Role
                </label>
                <select
                  className="py-2 px-3 w-full rounded-lg border border-emerald-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-emerald-100/50"
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="buyer">Buyer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <Turnstile
                  options={{
                    theme: 'light',
                  }}
                  siteKey={SITE_KEY}
                  onError={() => alert('CAPTCHA failed Try again')}
                  onSuccess={(token) => setCaptchaToken(token)}
                />
              </div>
              <div>
                <button
                  className="py-2 px-4 w-full font-semibold text-white bg-emerald-600 rounded-lg transition-colors duration-300 hover:bg-emerald-700"
                  type="submit"
                >
                  {loadStatus? "Loading...": "Log In" }
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
