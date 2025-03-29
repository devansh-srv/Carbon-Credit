import React, { useState, useEffect } from 'react';
import { Route, Routes, Navigate, Link, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import NGOSignup from './components/NGOSignup';
import BuyerSignup from './components/BuyerSignup';
import AuditorSignup from './components/AuditorSignup';
import Login from './components/Login';
import NGODashboard from './components/NGODashboard';
import BuyerDashboard from './components/BuyerDashboard';
import AuditorDashboard from './components/AuditorDashboard'
import TestPage from './components/testPage';
import Home from './components/Home';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { CCProvider } from './context/SmartContractConnector';
import { jwtDecode } from "jwt-decode";





const App = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };


  useEffect(() => {
    document.title = "Carbon Credits";
    const token = localStorage.getItem('token');

    if (token) {
      console.log("token found!")
      try {
        const decodedToken = jwtDecode(token);
        const parsedSub = JSON.parse(decodedToken.sub);
        const isExpired = decodedToken.exp * 1000 < Date.now();
        console.log(decodedToken);
        if (!isExpired) {
          console.log('token is alive');
          setUser({
            username: parsedSub.username,
            role: parsedSub.role
          });
          // let currentPath = window.location.pathname;
          // console.log(currentPath);
          // navigate(currentPath);
          if (window.location.pathname === '/' || window.location.pathname === '/login') {
            navigate(parsedSub.role.toLowerCase() === 'ngo' ? '/NGO-dashboard' : parsedSub.role.toLowerCase() === 'auditor' ? '/auditor-dashboard' : '/buyer-dashboard');
          }

        }
        else {
          localStorage.removeItem('token');
          setUser(null);
          navigate('/login');
          //redirect to login
        }
      } catch (error) {
        console.error("Token failure:", error);
        setUser(null);
        localStorage.removeItem('token');
        navigate('/login');
      }

    }
  }, [navigate]);

  return (
    <CCProvider>
      {/* <Router> */}
      <div >
        <Navbar user={user} onLogout={handleLogout} />
        <div >
          <Routes>
            <Route path="/home" element={<Home />} />
            <Route path="/NGO-signup" element={<NGOSignup onLogin={handleLogin} />} />
            <Route path="/buyer-signup" element={<BuyerSignup onLogin={handleLogin} />} />
            <Route path="/auditor-signup" element={<AuditorSignup onLogin={handleLogin} />} />
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="/test" element={<TestPage />} />
            <Route
              path="/NGO-dashboard"
              element={
                user && user.role === 'NGO' ?
                  <NGODashboard onLogout={handleLogout} /> :
                  <Navigate to="/login" replace />
              }
            />
            <Route
              path="/buyer-dashboard"
              element={
                user && user.role === 'buyer' ?
                  <BuyerDashboard onLogout={handleLogout} /> :
                  <Navigate to="/login" replace />
              }
            />
            <Route
              path="/auditor-dashboard"
              element={
                user && user.role === 'auditor' ?
                  <AuditorDashboard onLogout={handleLogout} /> :
                  <Navigate to="/login" replace />
              }
            />
            <Route path="/" element={
              user ?
                user.role === 'NGO' ? <Navigate to="/NGO-dashboard" replace /> : user.role === 'auditor' ? <Navigate to="/auditor-dashboard" /> : <Navigate to="/buyer-dashboard" replace />

                : <Navigate to="/home" replace />}
            />
          </Routes>
        </div>
        <SpeedInsights />
      </div>
      {/* </Router> */}
    </CCProvider>
  );
};

export default App;
