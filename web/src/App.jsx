import React, { useState, useEffect } from 'react';
import Home from './pages/Home';
import Login from './pages/Login';
import Admin from './pages/Admin';

export default function App() {
  const [currentView, setCurrentView] = useState(() => {
    const path = window.location.pathname;
    if (path.includes('/admin')) return 'admin';
    if (path.includes('/login')) return 'login';
    return 'home';
  });

  const [hasToken, setHasToken] = useState(() => Boolean(localStorage.getItem('tianyi_admin_token')));

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path.includes('/admin')) setCurrentView('admin');
      else if (path.includes('/login')) setCurrentView('login');
      else setCurrentView('home');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
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
