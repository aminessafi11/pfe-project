import React, { useState, useEffect } from 'react';
import './TitleBar.css';

export default function TitleBar({ appName }) {
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    if (!window.electronAPI) return;
    window.electronAPI.isMaximized().then(setMaximized).catch(() => {});
    window.electronAPI.onWindowStateChange(({ maximized: m }) => setMaximized(m));
  }, []);

  const handleMaximize = () => {
    window.electronAPI?.maximize();
  };

  return (
    <div className="titlebar">
      {/* Drag region fills most of the bar */}
      <div className="titlebar__drag">
        <span className="titlebar__name">{appName}</span>
      </div>

      {/* Window controls */}
      <div className="titlebar__controls">
        <button
          className="titlebar__btn titlebar__btn--minimize"
          onClick={() => window.electronAPI?.minimize()}
          title="Minimize"
        >
          <svg width="10" height="1" viewBox="0 0 10 1">
            <line x1="0" y1="0.5" x2="10" y2="0.5"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>

        <button
          className="titlebar__btn titlebar__btn--maximize"
          onClick={handleMaximize}
          title={maximized ? 'Restore' : 'Maximize'}
        >
          {maximized ? (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <rect x="3" y="0" width="7" height="7" rx="1"
                stroke="currentColor" strokeWidth="1.4"/>
              <path d="M1 3v6h6" stroke="currentColor" strokeWidth="1.4"
                strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <rect x="0.7" y="0.7" width="8.6" height="8.6" rx="1.2"
                stroke="currentColor" strokeWidth="1.4"/>
            </svg>
          )}
        </button>

        <button
          className="titlebar__btn titlebar__btn--close"
          onClick={() => window.electronAPI?.close()}
          title="Close"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <line x1="1" y1="1" x2="9" y2="9"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="9" y1="1" x2="1" y2="9"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
