import React, { useState } from 'react';
import LoginPage from './pages/LoginPage';
import MainLayout from './pages/MainLayout';
import TitleBar from './components/TitleBar';
import './App.css';
import API_BASE from './config';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showLogin, setShowLogin] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  const handleLogin = async (user) => {
    // Fetch full profile to get profile_pic
    try {
      const res = await fetch(`${API_BASE}/api/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username }),
      });
      const data = await res.json();
      if (res.ok && data.profile_pic) {
        user = { ...user, profile_pic: data.profile_pic };
      }
    } catch {}

    setCurrentUser(user);
    setIsTransitioning(true);
    setTimeout(() => {
      setShowLogin(false);
      setIsAuthenticated(true);
      setIsTransitioning(false);
    }, 500);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    setIsTransitioning(true);
    setTimeout(() => {
      setIsAuthenticated(false);
      setShowLogin(true);
      setIsTransitioning(false);
    }, 500);
  };

  const handleProfilePicUpdate = (newPic) => {
    setCurrentUser(prev => ({ ...prev, profile_pic: newPic }));
  };

  return (
    <div className="app-root" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* TitleBar always visible on login AND main app */}
      <TitleBar appName="MAKLADA PFE PROJECT" />

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {showLogin && !isAuthenticated ? (
          <div className={`app-page ${isTransitioning ? 'app-page--out' : 'app-page--in'}`}>
            <LoginPage onLogin={handleLogin} />
          </div>
        ) : (
          <div className={`app-page ${isTransitioning ? 'app-page--out' : 'app-page--in'}`}>
            <MainLayout
              onLogout={handleLogout}
              currentUser={currentUser}
              onProfilePicUpdate={handleProfilePicUpdate}
            />
          </div>
        )}
      </div>
    </div>
  );
}