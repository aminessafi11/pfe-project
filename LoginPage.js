import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import bgLogin from '../assets/bg-login.jpg';
import makladaLogo from '../assets/maklada-logo.webp';
import './LoginPage.css';
import API_BASE from '../config';

export default function LoginPage({ onLogin }) {
  const { t, i18n } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const [view, setView] = useState('login');
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotMessageType, setForgotMessageType] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const toggleLang = () => {
    i18n.changeLanguage(i18n.language === 'fr' ? 'en' : 'fr');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) return;
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || t('login.error'));
        setLoading(false);
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      onLogin(data.user);

    } catch (err) {
      setError('Cannot connect to server. Is the backend running?');
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotLoading(true);
    setForgotMessage('');

    try {
      const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        setForgotMessageType('error');
        setForgotMessage(data.message);
      } else {
        setForgotMessageType('success');
        setForgotMessage(data.message);
        setTimeout(() => {
          setView('reset');
          setForgotMessage('');
        }, 1500);
      }
    } catch (err) {
      setForgotMessageType('error');
      setForgotMessage('Cannot connect to server.');
    }

    setForgotLoading(false);
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!resetCode || !newPassword || !confirmPassword) return;

    if (newPassword !== confirmPassword) {
      setForgotMessageType('error');
      setForgotMessage(t('header.passwordMismatch'));
      return;
    }

    if (newPassword.length < 6) {
      setForgotMessageType('error');
      setForgotMessage(t('header.passwordTooShort'));
      return;
    }

    setForgotLoading(true);
    setForgotMessage('');

    try {
      const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, code: resetCode, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setForgotMessageType('error');
        setForgotMessage(data.message);
      } else {
        setForgotMessageType('success');
        setForgotMessage(t('login.resetSuccess'));
        setTimeout(() => {
          setView('login');
          setForgotEmail('');
          setResetCode('');
          setNewPassword('');
          setConfirmPassword('');
          setForgotMessage('');
        }, 2000);
      }
    } catch (err) {
      setForgotMessageType('error');
      setForgotMessage('Cannot connect to server.');
    }

    setForgotLoading(false);
  };

  return (
    <div className="login-root">
      <div className="login-bg" style={{ backgroundImage: `url(${bgLogin})` }} />
      <div className="login-overlay" />

      <button className="login-lang-btn" onClick={toggleLang} title="Toggle language">
        {i18n.language === 'fr' ? 'EN' : 'FR'}
      </button>

      <div className="login-card-wrap">
        <div className="login-card">
          <div className="login-card__highlight" />

          <div className="login-brand">
            <div className="login-brand__emblem">
              <img src={makladaLogo} alt="Maklada" style={{width:'120px', height:'auto', objectFit:'contain'}} />
            </div>
            <h1 className="login-brand__title">
              {view === 'login' ? t('login.title') : view === 'forgot' ? t('login.forgotTitle') : t('login.resetTitle')}
            </h1>
            <p className="login-brand__subtitle">
              {view === 'login' ? t('login.subtitle') : view === 'forgot' ? t('login.forgotSubtitle') : t('login.resetSubtitle')}
            </p>
          </div>

          <div className="login-divider" />

          {view === 'login' && (
            <form className="login-form" onSubmit={handleSubmit} noValidate>
              <div className="login-field">
                <label className="login-label">{t('login.username')}</label>
                <div className="login-input-wrap">
                  <span className="login-input-icon">
                    <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
                      <circle cx="10" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </span>
                  <input
                    type="text"
                    className="login-input"
                    placeholder={t('login.usernamePlaceholder')}
                    value={username}
                    onChange={e => { setUsername(e.target.value); setError(''); }}
                    autoComplete="username"
                    autoFocus
                  />
                </div>
              </div>

              <div className="login-field">
                <label className="login-label">{t('login.password')}</label>
                <div className="login-input-wrap">
                  <span className="login-input-icon">
                    <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
                      <rect x="4" y="9" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M7 9V6.5a3 3 0 016 0V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </span>
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="login-input"
                    placeholder={t('login.passwordPlaceholder')}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(''); }}
                    autoComplete="current-password"
                  />
                  <button type="button" className="login-toggle-pass" onClick={() => setShowPass(v => !v)} tabIndex={-1}>
                    {showPass ? (
                      <svg viewBox="0 0 20 20" fill="none" width="15" height="15">
                        <path d="M3 3l14 14M8.5 8.68A3 3 0 0011.3 11.5M6.3 6.35C4.7 7.4 3.4 8.9 2.5 10c1.5 2.5 4.4 5 7.5 5 1.2 0 2.3-.3 3.3-.9M10 5c3 0 5.8 2.4 7.5 5a14 14 0 01-2 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 20 20" fill="none" width="15" height="15">
                        <path d="M2.5 10C4 7.5 6.9 5 10 5s6 2.5 7.5 5c-1.5 2.5-4.4 5-7.5 5S4 12.5 2.5 10z" stroke="currentColor" strokeWidth="1.5"/>
                        <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="login-error" role="alert">
                  <svg viewBox="0 0 16 16" fill="none" width="14" height="14" style={{flexShrink:0}}>
                    <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M8 5v4M8 11v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  {error}
                </div>
              )}

              <button
                type="submit"
                className={`login-btn ${loading ? 'login-btn--loading' : ''}`}
                disabled={loading || !username || !password}
              >
                {loading ? <span className="login-btn__spinner" /> : t('login.button')}
              </button>

              <button
                type="button"
                className="login-forgot-btn"
                onClick={() => { setView('forgot'); setError(''); }}
              >
                {t('login.forgotPassword')}
              </button>
            </form>
          )}

          {view === 'forgot' && (
            <form className="login-form" onSubmit={handleForgotSubmit} noValidate>
              <div className="login-field">
                <label className="login-label">{t('login.forgotEmail')}</label>
                <div className="login-input-wrap">
                  <span className="login-input-icon">
                    <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
                      <path d="M3 5h14l-7 7-7-7zM3 5v10h14V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                  <input
                    type="email"
                    className="login-input"
                    placeholder={t('login.forgotEmailPlaceholder')}
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>

              {forgotMessage && (
                <div className={`login-error ${forgotMessageType === 'success' ? 'login-error--success' : ''}`} role="alert">
                  {forgotMessage}
                </div>
              )}

              <button
                type="submit"
                className={`login-btn ${forgotLoading ? 'login-btn--loading' : ''}`}
                disabled={forgotLoading || !forgotEmail}
              >
                {forgotLoading ? <span className="login-btn__spinner" /> : t('login.forgotButton')}
              </button>

              <button type="button" className="login-forgot-btn" onClick={() => setView('login')}>
                {t('login.backToLogin')}
              </button>
            </form>
          )}

          {view === 'reset' && (
            <form className="login-form" onSubmit={handleResetSubmit} noValidate>
              <div className="login-field">
                <label className="login-label">{t('login.resetCode')}</label>
                <div className="login-input-wrap">
                  <span className="login-input-icon">
                    <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
                      <rect x="4" y="9" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M7 9V6.5a3 3 0 016 0V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </span>
                  <input
                    type="text"
                    className="login-input"
                    placeholder="000000"
                    value={resetCode}
                    onChange={e => setResetCode(e.target.value)}
                    maxLength={6}
                    autoFocus
                  />
                </div>
              </div>

              <div className="login-field">
                <label className="login-label">{t('header.newPassword')}</label>
                <div className="login-input-wrap">
                  <span className="login-input-icon">
                    <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
                      <rect x="4" y="9" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M7 9V6.5a3 3 0 016 0V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </span>
                  <input
                    type="password"
                    className="login-input"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="login-field">
                <label className="login-label">{t('header.confirmPassword')}</label>
                <div className="login-input-wrap">
                  <span className="login-input-icon">
                    <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
                      <rect x="4" y="9" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M7 9V6.5a3 3 0 016 0V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </span>
                  <input
                    type="password"
                    className="login-input"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              {forgotMessage && (
                <div className={`login-error ${forgotMessageType === 'success' ? 'login-error--success' : ''}`} role="alert">
                  {forgotMessage}
                </div>
              )}

              <button
                type="submit"
                className={`login-btn ${forgotLoading ? 'login-btn--loading' : ''}`}
                disabled={forgotLoading || !resetCode || !newPassword || !confirmPassword}
              >
                {forgotLoading ? <span className="login-btn__spinner" /> : t('login.resetButton')}
              </button>

              <button type="button" className="login-forgot-btn" onClick={() => setView('login')}>
                {t('login.backToLogin')}
              </button>
            </form>
          )}

          <p className="login-footer">{t('login.footer')}</p>
        </div>
      </div>
    </div>
  );
}