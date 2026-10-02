import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './Header.css';

const PAGE_TITLES = {
  profile:   { en: 'My Profile',                fr: 'Mon Profil' },
  admin:     { en: 'Admin Panel',               fr: 'Panneau Admin' },
  financial: { en: 'Financial Tracking',        fr: 'Suivi Financier' },
  technical: { en: 'Technical Tracking',        fr: 'Suivi Technique' },
  report:    { en: 'Generate Report',           fr: 'Générer un Rapport' },
  ai:        { en: 'AI Analysis & Predictions', fr: 'Analyse IA & Prévisions' },
  analytics: { en: 'ML Interactive',            fr: 'ML Interactif' },
  assistant: { en: 'AI Assistant',              fr: 'Assistant IA' },
};

export default function Header({ activePage, onLogout, currentUser }) {
  const { t, i18n } = useTranslation();
  const [confirmLogout, setConfirmLogout] = useState(false);

  const toggleLang = () => {
    i18n.changeLanguage(i18n.language === 'fr' ? 'en' : 'fr');
  };

  const lang = i18n.language === 'fr' ? 'fr' : 'en';
  const pageTitle = PAGE_TITLES[activePage]?.[lang] ?? '';

  const handleLogoutClick = () => {
    if (confirmLogout) {
      onLogout();
    } else {
      setConfirmLogout(true);
      setTimeout(() => setConfirmLogout(false), 3000);
    }
  };

  return (
    <header className="header">
      <div className="header__left">
        <h2 className="header__page-title" key={activePage}>
          {pageTitle}
        </h2>
      </div>

      <div className="header__right">
        {currentUser && (
          <>
            <div className="header__user-badge">
              <div className="header__user-avatar" style={{ overflow: 'hidden', padding: 0 }}>
                {currentUser.profile_pic ? (
                  <img src={currentUser.profile_pic} alt={currentUser.username}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', display: 'block' }} />
                ) : (
                  currentUser.username.charAt(0).toUpperCase()
                )}
              </div>
              <span className="header__user-name">{currentUser.username}</span>
            </div>
            <div className="header__divider" />
          </>
        )}

        <button className="header__lang-btn" onClick={toggleLang}
          title="Toggle language / Changer la langue">
          <svg viewBox="0 0 20 20" fill="none" width="14" height="14">
            <circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M10 1.5C10 1.5 7 5.5 7 10s3 8.5 3 8.5M10 1.5C10 1.5 13 5.5 13 10s-3 8.5-3 8.5M1.5 10h17"
              stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          <span>{i18n.language === 'fr' ? 'EN' : 'FR'}</span>
        </button>

        <div className="header__divider" />

        <button
          className={`header__logout-btn ${confirmLogout ? 'header__logout-btn--confirm' : ''}`}
          onClick={handleLogoutClick} title={t('header.logout')}>
          {confirmLogout ? (
            <>
              <svg viewBox="0 0 20 20" fill="none" width="14" height="14">
                <path d="M4 10l4 4 8-8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>{t('header.logoutConfirm')}</span>
            </>
          ) : (
            <>
              <svg viewBox="0 0 20 20" fill="none" width="14" height="14">
                <path d="M8 3H4a1 1 0 00-1 1v12a1 1 0 001 1h4M13 14l4-4-4-4M7 10h10"
                  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>{t('header.logout')}</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}