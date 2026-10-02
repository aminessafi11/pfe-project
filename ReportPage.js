import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './ReportPage.css';
import API_BASE from '../config';

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 6000);
    return () => clearTimeout(timer);
  }, [onClose]);
  return (
    <div className={`rp-toast rp-toast--${type}`}>
      {type === 'success' ? (
        <svg viewBox="0 0 16 16" fill="none" width="15" height="15"><circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4"/><path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
      ) : (
        <svg viewBox="0 0 16 16" fill="none" width="15" height="15"><circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4"/><path d="M8 5v4M8 11v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
      )}
      <span>{message}</span>
      <button className="rp-toast__close" onClick={onClose}>
        <svg viewBox="0 0 12 12" fill="none" width="11" height="11">
          <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options, placeholder }) {
  return (
    <div className="rp__filter-field">
      <label className="rp__filter-label">{label}</label>
      <div className="rp__select-wrap">
        <select className="rp__select" value={value} onChange={e => onChange(e.target.value)}>
          <option value="">{placeholder}</option>
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <span className="rp__select-arrow">
          <svg viewBox="0 0 10 10" fill="none" width="10" height="10">
            <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </div>
    </div>
  );
}

export default function ReportPage({ currentUser }) {
  const { t } = useTranslation();

  const [machines, setMachines]   = useState([]);
  const [years, setYears]         = useState([]);
  const [months, setMonths]       = useState([]);
  const [services, setServices]   = useState([]);
  const [centres, setCentres]     = useState([]);
  const [filters, setFilters]     = useState({ machine: '', year: '', month: '', service: '', centreCharge: '' });
  const [observations, setObservations] = useState('');
  const [reportLoading, setReportLoading] = useState(false);
  const [myReports, setMyReports] = useState([]);
  const [toast, setToast]         = useState(null);

  const showToast = (message, type = 'success') => setToast({ message, type });
  const setFilter = (key, val) => setFilters(prev => ({ ...prev, [key]: val }));
  const activeFilterCount = Object.values(filters).filter(v => v !== '').length;

  useEffect(() => {
    async function loadOptions() {
      try {
        const [mRes, yRes, moRes, sRes, cRes] = await Promise.all([
          fetch(`${API_BASE}/api/profile/machines`),
          fetch(`${API_BASE}/api/profile/years`),
          fetch(`${API_BASE}/api/profile/months`),
          fetch(`${API_BASE}/api/profile/services`),
          fetch(`${API_BASE}/api/profile/centres`),
        ]);
        const [mData, yData, moData, sData, cData] = await Promise.all([
          mRes.json(), yRes.json(), moRes.json(), sRes.json(), cRes.json(),
        ]);
        setMachines(mData.machines || []);
        setYears(yData.years || []);
        setMonths(moData.months || []);
        setServices(sData.services || []);
        setCentres(cData.centres || []);
      } catch {}
    }
    loadOptions();
  }, []);

  useEffect(() => {
    reloadReports();
  }, [currentUser]);

  const reloadReports = () => {
    if (!currentUser?.id) return;
    fetch(`${API_BASE}/api/profile/my-reports/${currentUser.id}`)
      .then(r => r.json())
      .then(data => setMyReports(Array.isArray(data) ? data : []))
      .catch(() => {});
  };

  const handleSendReport = async () => {
    if (reportLoading) return;
    const email = currentUser?.email;
    if (!email) { showToast('No email address found', 'error'); return; }
    setReportLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/profile/report`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: currentUser?.username,
          userId: currentUser?.id,
          userEmail: email,
          filters,
          observations,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      showToast(`${t('report.reportSent')} ${email}`);
      reloadReports();
    } catch (err) {
      showToast(err.message || t('report.reportError'), 'error');
    } finally {
      setReportLoading(false);
    }
  };

  const handleDeleteReport = async (reportId) => {
    try {
      await fetch(`${API_BASE}/api/profile/my-reports/${reportId}`, { method: 'DELETE' });
      setMyReports(prev => prev.filter(r => r.id !== reportId));
    } catch { showToast('Failed to delete', 'error'); }
  };

  const handleClearMyReports = async () => {
    if (!window.confirm('Clear your entire report history?')) return;
    try {
      await fetch(`${API_BASE}/api/profile/my-reports/clear/${currentUser.id}`, { method: 'DELETE' });
      setMyReports([]);
    } catch { showToast('Failed to clear history', 'error'); }
  };

  function parseFilters(f) {
    try {
      const obj = typeof f === 'string' ? JSON.parse(f) : (f || {});
      const parts = [];
      if (obj.machine)      parts.push(`${t('report.machine')} ${obj.machine}`);
      if (obj.year)         parts.push(`${t('report.year')} ${obj.year}`);
      if (obj.month)        parts.push(`${t('report.month')} ${obj.month}`);
      if (obj.service)      parts.push(obj.service);
      if (obj.centreCharge) parts.push(`${t('report.centreCharge')} ${obj.centreCharge}`);
      return parts.length ? parts.join(' · ') : t('report.globalReport');
    } catch { return t('report.globalReport'); }
  }

  return (
    <div className="rp">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="rp__overlay" />

      <div className="rp__container">
        <div className="rp__card">

          {/* Filters section */}
          <div className="rp__section-head">
            <svg viewBox="0 0 16 16" fill="none" width="14" height="14">
              <path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            <span>{t('report.filters') || 'Filters'}</span>
            {activeFilterCount > 0 && (
              <div className="rp__filter-badge">
                {activeFilterCount} {activeFilterCount > 1 ? t('report.filtersActivePlural') : t('report.filtersActive')}
                <button className="rp__filter-clear"
                  onClick={() => setFilters({ machine: '', year: '', month: '', service: '', centreCharge: '' })}>
                  {t('report.clearAll')}
                </button>
              </div>
            )}
          </div>

          <div className="rp__filters-grid">
            <FilterSelect label={t('report.machine')} value={filters.machine}
              onChange={v => setFilter('machine', v)}
              options={machines.map(m => ({ value: m, label: `Machine ${m}` }))}
              placeholder={t('report.allMachines')} />
            <FilterSelect label={t('report.year')} value={filters.year}
              onChange={v => setFilter('year', v)}
              options={years.map(y => ({ value: y, label: String(y) }))}
              placeholder={t('report.allYears')} />
            <FilterSelect label={t('report.month')} value={filters.month}
              onChange={v => setFilter('month', v)}
              options={months.map(m => ({ value: m.MOIS, label: m.MOIS_NOM || `Month ${m.MOIS}` }))}
              placeholder={t('report.allMonths')} />
            <FilterSelect label={t('report.service')} value={filters.service}
              onChange={v => setFilter('service', v)}
              options={services.map(s => ({ value: s, label: s }))}
              placeholder={t('report.allServices')} />
            <FilterSelect label={t('report.centreCharge')} value={filters.centreCharge}
              onChange={v => setFilter('centreCharge', v)}
              options={centres.map(c => ({ value: c, label: String(c) }))}
              placeholder={t('report.allCentres')} />
          </div>

          {/* Observations */}
          <div className="rp__obs-section">
            <label className="rp__obs-label">
              <svg viewBox="0 0 16 16" fill="none" width="14" height="14">
                <rect x="2" y="2" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M5 5h6M5 8h6M5 11h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              {t('report.observations')}
              <span className="rp__obs-hint">{t('report.observationsHint')}</span>
            </label>
            <textarea className="rp__obs-textarea"
              placeholder={t('report.observationsPlaceholder')}
              value={observations}
              onChange={e => setObservations(e.target.value)}
              rows={5} />
            <div className="rp__obs-counter">{observations.length} {t('report.characters')}</div>
          </div>

          {/* Footer */}
          <div className="rp__footer">
            <div className="rp__footer-info">
              <svg viewBox="0 0 14 14" fill="none" width="13" height="13">
                <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M7 6v4M7 4.5v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              <span>
                {t('report.pdfSentTo')} <strong>{currentUser?.email || '—'}</strong>
                {activeFilterCount === 0 && ` · ${t('report.globalReport')}`}
              </span>
            </div>
            <button className="rp__generate-btn" onClick={handleSendReport} disabled={reportLoading}>
              {reportLoading ? (
                <><span className="rp__spinner" /> {t('report.generating')}</>
              ) : (
                <>
                  <svg viewBox="0 0 16 16" fill="none" width="15" height="15">
                    <path d="M2 8h9M8 5l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M13 3v10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                  {t('report.generateBtn')}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Report History */}
        {myReports.length > 0 && (
          <div className="rp__card">
            <div className="rp__history-head">
              <div className="rp__section-head">
                <svg viewBox="0 0 16 16" fill="none" width="14" height="14">
                  <path d="M2 4h12M2 8h8M2 12h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
                <span>{t('report.myReportHistory')}</span>
                <span className="rp__history-sub">{t('report.myReportHistorySub')}</span>
              </div>
              <button className="rp__clear-btn" onClick={handleClearMyReports}>
                <svg viewBox="0 0 16 16" fill="none" width="12" height="12">
                  <path d="M2 4h12M5 4V2.5a.5.5 0 01.5-.5h5a.5.5 0 01.5.5V4M4 4l.667 9.333A1 1 0 005.66 14.5h4.68a1 1 0 00.993-.667L12 4"
                    stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {t('report.clearHistory')}
              </button>
            </div>
            <div className="rp__table-wrap">
              <table className="rp__table">
                <thead>
                  <tr>
                    <th>{t('report.date')}</th>
                    <th>{t('report.filters')}</th>
                    <th>{t('report.status')}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {myReports.map(r => (
                    <tr key={r.id}>
                      <td>{new Date(r.created_at).toLocaleString()}</td>
                      <td>{parseFilters(r.filters)}</td>
                      <td>
                        <span style={{
                          padding: '3px 10px', borderRadius: '20px',
                          fontSize: '11px', fontWeight: 600,
                          background: r.status === 'success' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                          color: r.status === 'success' ? '#15803d' : '#b91c1c',
                          border: `1px solid ${r.status === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                        }}>
                          {r.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button className="rp__delete-btn" onClick={() => handleDeleteReport(r.id)}>
                          <svg viewBox="0 0 16 16" fill="none" width="13" height="13">
                            <path d="M3 4h10M6 4V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5V4M5 4l.5 9h5L11 4"
                              stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}