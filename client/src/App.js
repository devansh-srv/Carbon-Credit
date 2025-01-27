import React, { useState, useEffect } from 'react';
import {Route, Routes, Navigate, Link, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import AdminSignup from './components/AdminSignup';
import BuyerSignup from './components/BuyerSignup';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import BuyerDashboard from './components/BuyerDashboard';
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
    
    if(token){
      console.log("token found!")
      try{
        const decodedToken = jwtDecode(token);
        const parsedSub = JSON.parse(decodedToken.sub);
        const isExpired = decodedToken.exp*1000<Date.now();
        console.log(decodedToken);
        if(!isExpired){
          console.log('token is alive');
          setUser({
            username: parsedSub.username,
            role: parsedSub.role
          });
          // let currentPath = window.location.pathname;
          // console.log(currentPath);
          // navigate(currentPath);
          if (window.location.pathname === '/' || window.location.pathname === '/login') {
            navigate(parsedSub.role === 'admin' ? '/admin-dashboard' : '/buyer-dashboard');
          }
          
        }
        else{
          localStorage.removeItem('token');
          setUser(null);
          navigate('/login');
          //redirect to login
        }
      }catch(error){
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
              <Route path="/home" element={<Home/>} />
              <Route path="/admin-signup" element={<AdminSignup onLogin={handleLogin}/>} />
              <Route path="/buyer-signup" element={<BuyerSignup onLogin={handleLogin} />} />
              <Route path="/login" element={<Login onLogin={handleLogin} />} />
              <Route path="/test" element={<TestPage />} />
              <Route
                path="/admin-dashboard"
                element={
                  user && user.role === 'admin' ?
                    <AdminDashboard onLogout={handleLogout} /> :
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
              <Route path="/" element={
                user? 
                user.role==='admin'? <Navigate to="/admin-dashboard" replace/>: <Navigate to="/buyer-dashboard" replace/>

                : <Navigate to="/home" replace/>}
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
