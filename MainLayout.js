import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import DashboardPage from './DashboardPage';
import AIAssistantPage from './AIAssistantPage';
import AnalyticsPage from './AnalyticsPage';
import AdminPage from './AdminPage';
import ProfilePage from './ProfilePage';
import ReportPage from './ReportPage';
import DASHBOARDS from '../dashboardConfig';
import './MainLayout.css';

export default function MainLayout({ onLogout, currentUser, onProfilePicUpdate }) {
  const { t } = useTranslation();
  const [activePage, setActivePage] = useState('profile');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const renderPage = () => {
    const dash = DASHBOARDS.find(d => d.id === activePage);
    if (dash) {
      return (
        <DashboardPage
          key={activePage}
          dashId={dash.id}
          embedUrl={dash.embedUrl}
          titleKey={dash.labelKey}
        />
      );
    }
    if (activePage === 'profile') {
      return (
        <ProfilePage
          key="profile"
          currentUser={currentUser}
          onProfilePicUpdate={onProfilePicUpdate}
        />
      );
    }
    if (activePage === 'report')    return <ReportPage key="report" currentUser={currentUser} />;
    if (activePage === 'assistant') return <AIAssistantPage key="assistant" currentUser={currentUser} />;
    if (activePage === 'analytics') return <AnalyticsPage key="analytics" />;
    if (activePage === 'admin')     return <AdminPage key="admin" currentUser={currentUser} />;
    return null;
  };

  return (
    <div className="main-layout">
      <div className="main-layout__body">
        <Sidebar
          activePage={activePage}
          onNavigate={setActivePage}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(v => !v)}
          currentUser={currentUser}
        />
        <div className="main-layout__right">
          <Header activePage={activePage} onLogout={onLogout} currentUser={currentUser} />
          <div className="main-layout__page">
            {renderPage()}
          </div>
        </div>
      </div>
    </div>
  );
}