import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import bgMain from '../assets/bg-main.jpg';
import './DashboardPage.css';

export default function DashboardPage({ dashId, embedUrl, titleKey }) {
  const { t } = useTranslation();
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const hasUrl = embedUrl && embedUrl.trim().length > 0;

  return (
    <div
      className="dashboard"
      style={{ backgroundImage: `url(${bgMain})` }}
    >
      {/* Frosted glass layer over background */}
      <div className="dashboard__overlay" />

      {/* Content area */}
      <div className="dashboard__content">
        {hasUrl ? (
          <>
            {!iframeLoaded && (
              <div className="dashboard__loading">
                <div className="dashboard__loading-spinner" />
                <span>{t('dashboard.loading')}</span>
              </div>
            )}
            <iframe
              className={`dashboard__iframe ${iframeLoaded ? 'dashboard__iframe--visible' : ''}`}
              src={embedUrl}
              title={t(titleKey)}
              allowFullScreen
              frameBorder="0"
              onLoad={() => setIframeLoaded(true)}
            />
          </>
        ) : (
          <PlaceholderCard dashId={dashId} titleKey={titleKey} />
        )}
      </div>
    </div>
  );
}

function PlaceholderCard({ dashId, titleKey }) {
  const { t } = useTranslation();

  const ICONS = {
    financial: (
      <svg viewBox="0 0 48 48" fill="none" width="48" height="48">
        <rect x="4" y="28" width="8" height="16" rx="2" stroke="currentColor" strokeWidth="1.8"/>
        <rect x="16" y="20" width="8" height="24" rx="2" stroke="currentColor" strokeWidth="1.8"/>
        <rect x="28" y="12" width="8" height="32" rx="2" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M40 4l-8 9-8-6-12 11" stroke="currentColor" strokeWidth="1.8"
          strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="40" cy="4" r="2.5" fill="currentColor"/>
      </svg>
    ),
    technical: (
      <svg viewBox="0 0 48 48" fill="none" width="48" height="48">
        <circle cx="24" cy="24" r="7" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M24 4v5M24 39v5M4 24h5M39 24h5M9.2 9.2l3.5 3.5M35.3 35.3l3.5 3.5M9.2 38.8l3.5-3.5M35.3 12.7l3.5-3.5"
          stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
    ai: (
      <svg viewBox="0 0 48 48" fill="none" width="48" height="48">
        <path d="M24 6C15.2 6 8 13.2 8 22c0 5.2 2.6 9.8 6.5 12.6V40h19v-5.4C37.4 31.8 40 27.2 40 22c0-8.8-7.2-16-16-16z"
          stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
        <path d="M18 40v3.5A2 2 0 0020 45.5h8a2 2 0 002-2V40"
          stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
        <path d="M20 22h8M24 18v8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
  };

  const steps = [
    t('dashboard.step1'),
    t('dashboard.step2'),
    t('dashboard.step3'),
    t('dashboard.step4'),
  ];

  return (
    <div className="placeholder">
      <div className="placeholder__card">
        <div className="placeholder__card-highlight" />
        <div className="placeholder__icon">{ICONS[dashId]}</div>
        <h3 className="placeholder__title">{t('dashboard.placeholder')}</h3>
        <p className="placeholder__sub">{t('dashboard.placeholderSub')}</p>

        <div className="placeholder__steps">
          {steps.map((step, i) => (
            <div className="placeholder__step" key={i}>
              <span className="placeholder__step-num">{i + 1}</span>
              <span className="placeholder__step-text">{step}</span>
            </div>
          ))}
        </div>

        <div className="placeholder__code-hint">
          <code>src/dashboardConfig.js</code>
        </div>
      </div>
    </div>
  );
}
