import React, { useState, useEffect } from 'react';
import Home from './pages/Home';
import Login from './pages/Login';
import Admin from './pages/Admin';

export default function App() {
  const [currentView, setCurrentView] = useState(() => {
    const full = window.location.pathname + window.location.hash;
    if (full.includes('admin')) return 'admin';
    if (full.includes('login')) return 'login';
    return 'home';
  });

  const [hasToken, setHasToken] = useState(() => Boolean(localStorage.getItem('tianyi_admin_token')));

  useEffect(() => {
    const handlePopState = () => {
      const full = window.location.pathname + window.location.hash;
      if (full.includes('admin')) setCurrentView('admin');
      else if (full.includes('login')) setCurrentView('login');
      else setCurrentView('home');
    };
    const handleAuthExpired = () => {
      setHasToken(false);
      navigate('login');
    };
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('tianyi_auth_expired', handleAuthExpired);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('tianyi_auth_expired', handleAuthExpired);
    };
  }, []);

  const navigate = (view) => {
    setCurrentView(view);
    const newPath = view === 'home' ? '/' : `/${view}`;
    window.history.pushState({}, '', newPath);
  };

  const handleLoginSuccess = () => {
    setHasToken(true);
    navigate('admin');
  };

  const handleLogout = () => {
    localStorage.removeItem('tianyi_admin_token');
    localStorage.removeItem('tianyi_admin_user');
    setHasToken(false);
    navigate('login');
  };

  if (currentView === 'admin') {
    if (!hasToken) {
      return <Login onLoginSuccess={handleLoginSuccess} onNavigateHome={() => navigate('home')} />;
    }
    return <Admin onLogout={handleLogout} />;
  }

  if (currentView === 'login') {
    return <Login onLoginSuccess={handleLoginSuccess} onNavigateHome={() => navigate('home')} />;
  }

  return <Home onNavigateLogin={() => navigate('login')} />;
}
