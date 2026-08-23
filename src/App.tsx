import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Internships from './pages/Internships';
import CodeLab from './pages/CodeLab';
import Dashboard from './pages/Dashboard';
import AdminPortal from './pages/AdminPortal';
import VerifyCertificate from './pages/VerifyCertificate';
import VerifyOffer from './pages/VerifyOffer';
import About from './pages/About';
import Reviews from './pages/Reviews';
import Contact from './pages/Contact';
import Domains from './pages/Domains';
import DomainDetails from './pages/DomainDetails';

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true' ||
      (!('darkMode' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [darkMode]);

  return (
    <Router>
      <AuthProvider>
        <div className="flex flex-col min-h-screen bg-brand-bgLight dark:bg-brand-bgDark text-slate-800 dark:text-slate-100 transition-colors duration-300">
          <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />

          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/internships" element={<Internships />} />
              <Route path="/internship" element={<Internships />} />
              <Route path="/about" element={<About />} />
              <Route path="/reviews" element={<Reviews />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/codelab" element={<CodeLab />} />
              <Route path="/domains" element={<Domains />} />
              <Route path="/domains/:slug" element={<DomainDetails />} />

              {/* Student Dashboard role check (standard uppercase / lowercase matches resolved) */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRole="student">
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              {/* Admin Portal role check */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRole="admin">
                    <AdminPortal />
                  </ProtectedRoute>
                }
              />

              {/* Verification Route paths */}
              <Route path="/verify" element={<VerifyCertificate />} />
              <Route path="/verify/:certNo" element={<VerifyCertificate />} />
              <Route path="/verify/offer" element={<VerifyOffer />} />
              <Route path="/verify/offer/:token" element={<VerifyOffer />} />

              {/* Redirect any other unknown elements to Home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          <Footer />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
