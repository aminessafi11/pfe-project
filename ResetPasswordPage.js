import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import makladaLogo from '../assets/maklada-logo.webp';
import bgLogin from '../assets/bg-login.jpg';
import './LoginPage.css';

export default function ResetPasswordPage({ token, onBackToLogin }) {
  const { t } = useTranslation();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) return;

    if (newPassword !== confirmPassword) {
      setMessageType('error');
      setMessage(t('header.passwordMismatch'));
      return;
    }

    if (newPassword.length < 6) {
      setMessageType('error');
      setMessage(t('header.passwordTooShort'));
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessageType('error');
        setMessage(data.message);
      } else {
        setMessageType('success');
        setMessage(t('login.resetSuccess'));
        setDone(true);
      }
    } catch (err) {
      setMessageType('error');
      setMessage('Cannot connect to server.');
    }

    setLoading(false);
  };

  return (
    <div className="login-root">
      <div className="login-bg" style={{ backgroundImage: `url(${bgLogin})` }} />
      <div className="login-overlay" />

      <div className="login-card-wrap">
        <div className="login-card">
          <div className="login-card__highlight" />

          <div className="login-brand">
            <div className="login-brand__emblem">
              <img src={makladaLogo} alt="Maklada" style={{width:'120px', height:'auto', objectFit:'contain'}} />
            </div>
            <h1 className="login-brand__title">{t('login.resetTitle')}</h1>
            <p className="login-brand__subtitle">{t('login.resetSubtitle')}</p>
          </div>

          <div className="login-divider" />

          {!done ? (
            <form className="login-form" onSubmit={handleSubmit} noValidate>
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

              {message && (
                <div className={`login-error ${messageType === 'success' ? 'login-error--success' : ''}`} role="alert">
                  {message}
                </div>
              )}

              <button
                type="submit"
                className={`login-btn ${loading ? 'login-btn--loading' : ''}`}
                disabled={loading || !newPassword || !confirmPassword}
              >
                {loading ? <span className="login-btn__spinner" /> : t('login.resetButton')}
              </button>
            </form>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <p style={{ color: '#065f46', marginBottom: '20px' }}>{t('login.resetSuccess')}</p>
              <button className="login-btn" onClick={onBackToLogin}>
                {t('login.backToLogin')}
              </button>
            </div>
          )}

          <button
            className="login-footer"
            onClick={onBackToLogin}
            style={{ background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {t('login.backToLogin')}
          </button>
        </div>
      </div>
    </div>
  );
}