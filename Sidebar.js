import React from 'react';
import makladaLogo from '../assets/maklada-logo.webp';
import { useTranslation } from 'react-i18next';
import './Sidebar.css';

const NAV_ITEMS = [
  {
    id: 'financial',
    labelKey: 'sidebar.financial',
    icon: (
      <svg viewBox="0 0 22 22" fill="none" width="19" height="19">
        <rect x="2" y="13" width="3.5" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="7.5" y="9" width="3.5" height="11" rx="1" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="13" y="5" width="3.5" height="15" rx="1" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M18 2l-4 4-4-3-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: 'technical',
    labelKey: 'sidebar.technical',
    icon: (
      <svg viewBox="0 0 22 22" fill="none" width="19" height="19">
        <circle cx="11" cy="11" r="3" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M11 2v2M11 18v2M2 11h2M18 11h2M4.22 4.22l1.42 1.42M16.36 16.36l1.42 1.42M4.22 17.78l1.42-1.42M16.36 5.64l1.42-1.42"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'report',
    labelKey: 'sidebar.report',
    icon: (
      <svg viewBox="0 0 22 22" fill="none" width="19" height="19">
        <path d="M5 3h9l4 4v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4a1 1 0 011-1z"
          stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M14 3v5h5M8 12h6M8 15.5h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'ai',
    labelKey: 'sidebar.ai',
    icon: (
      <svg viewBox="0 0 22 22" fill="none" width="19" height="19">
        <path d="M11 3C7.13 3 4 6.13 4 10c0 2.39 1.19 4.5 3 5.74V18h8v-2.26C16.81 14.5 18 12.39 18 10c0-3.87-3.13-7-7-7z"
          stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M8 18v1.5a1 1 0 001 1h4a1 1 0 001-1V18"
          stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M9 10h4M11 8v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'analytics',
    labelKey: 'sidebar.analytics',
    icon: (
      <svg viewBox="0 0 22 22" fill="none" width="19" height="19">
        <path d="M3 17l4-5 4 3 4-6 4 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="2" y="2" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    id: 'assistant',
    labelKey: 'sidebar.assistant',
    icon: (
      <svg viewBox="0 0 22 22" fill="none" width="19" height="19">
        <path d="M4 4h14a1 1 0 011 1v9a1 1 0 01-1 1H7l-4 3V5a1 1 0 011-1z"
          stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <circle cx="8" cy="10" r="1" fill="currentColor"/>
        <circle cx="11" cy="10" r="1" fill="currentColor"/>
        <circle cx="14" cy="10" r="1" fill="currentColor"/>
      </svg>
    ),
  },
];

function ProfileAvatar({ currentUser, size = 22 }) {
  if (!currentUser?.username) {
    return (
      <svg viewBox="0 0 22 22" fill="none" width="19" height="19">
        <circle cx="11" cy="8.5" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M3 20c0-4.418 3.582-7 8-7s8 2.582 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    );
  }
  return (
    <span style={{
      width: size, height: size, borderRadius: '50%',
      background: 'rgba(91,174,224,0.2)',
      border: '1.5px solid rgba(91,174,224,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.5, fontWeight: 700, color: '#7ec5e8',
      overflow: 'hidden', flexShrink: 0,
    }}>
      {currentUser.profile_pic ? (
        <img src={currentUser.profile_pic} alt={currentUser.username}
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', display: 'block' }} />
      ) : (
        currentUser.username[0].toUpperCase()
      )}
    </span>
  );
}

export default function Sidebar({ activePage, onNavigate, collapsed, onToggle, currentUser }) {
  const { t } = useTranslation();
  const isAdmin = currentUser?.role === 'admin';

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>

      {/* Brand */}
      <div className="sidebar__brand">
        <div className="sidebar__logo-mark">
          <img src={makladaLogo} alt="Maklada" style={{
            width: collapsed ? '36px' : '110px',
            height: 'auto', objectFit: 'contain', transition: 'width 0.3s ease',
          }} />
        </div>
        {!collapsed && (
          <div className="sidebar__logo-text">
            <span className="sidebar__logo-name">MAKLADA</span>
            <span className="sidebar__logo-sub">PFE PROJECT</span>
          </div>
        )}
      </div>

      <div className="sidebar__divider" />

      <nav className="sidebar__nav" role="navigation">

        {/* My Profile */}
        <button
          className={`sidebar__item ${activePage === 'profile' ? 'sidebar__item--active' : ''}`}
          onClick={() => onNavigate('profile')}
          title={collapsed ? t('sidebar.profile') : undefined}
          aria-current={activePage === 'profile' ? 'page' : undefined}
        >
          {activePage === 'profile' && <span className="sidebar__item-bar" />}
          <span className="sidebar__item-icon">
            <ProfileAvatar currentUser={currentUser} size={22} />
          </span>
          {!collapsed && <span className="sidebar__item-label">{t('sidebar.profile')}</span>}
        </button>

        <div className="sidebar__divider" />

        {/* Admin Panel */}
        {isAdmin && (
          <button
            className={`sidebar__item ${activePage === 'admin' ? 'sidebar__item--active' : ''}`}
            onClick={() => onNavigate('admin')}
            title={collapsed ? t('sidebar.admin') : undefined}
            aria-current={activePage === 'admin' ? 'page' : undefined}
          >
            {activePage === 'admin' && <span className="sidebar__item-bar" />}
            <span className="sidebar__item-icon">
              <svg viewBox="0 0 22 22" fill="none" width="19" height="19">
                <circle cx="11" cy="8" r="3" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M4 19c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M16 3l1.5 1.5L20 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            {!collapsed && <span className="sidebar__item-label">{t('sidebar.admin')}</span>}
          </button>
        )}

        {/* Main nav items */}
        {NAV_ITEMS.map((item) => {
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              className={`sidebar__item ${isActive ? 'sidebar__item--active' : ''}`}
              onClick={() => onNavigate(item.id)}
              title={collapsed ? t(item.labelKey) : undefined}
              aria-current={isActive ? 'page' : undefined}
            >
              {isActive && <span className="sidebar__item-bar" />}
              <span className="sidebar__item-icon">{item.icon}</span>
              {!collapsed && <span className="sidebar__item-label">{t(item.labelKey)}</span>}
            </button>
          );
        })}

      </nav>

      <div style={{ flex: 1 }} />

      <button className="sidebar__toggle" onClick={onToggle}
        title={t(collapsed ? 'sidebar.expand' : 'sidebar.collapse')}>
        <svg viewBox="0 0 20 20" fill="none" width="16" height="16"
          className={`sidebar__toggle-icon ${collapsed ? 'sidebar__toggle-icon--flipped' : ''}`}>
          <path d="M13 4L7 10l6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {!collapsed && <span className="sidebar__toggle-label">{t('sidebar.collapse')}</span>}
      </button>

    </aside>
  );
}