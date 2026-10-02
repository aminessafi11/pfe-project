import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import './ProfilePage.css';
import API_BASE from '../config';

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 6000);
    return () => clearTimeout(timer);
  }, [onClose]);
  return (
    <div className={`prof-toast prof-toast--${type}`}>
      {type === 'success' ? (
        <svg viewBox="0 0 16 16" fill="none" width="15" height="15"><circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4"/><path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
      ) : (
        <svg viewBox="0 0 16 16" fill="none" width="15" height="15"><circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4"/><path d="M8 5v4M8 11v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
      )}
      <span>{message}</span>
      <button className="prof-toast__close" onClick={onClose}>
        <svg viewBox="0 0 12 12" fill="none" width="11" height="11">
          <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );
}

function SectionHeader({ icon, title, subtitle }) {
  return (
    <div className="prof-section-head">
      <div className="prof-section-icon">{icon}</div>
      <div>
        <h3 className="prof-section-title">{title}</h3>
        {subtitle && <p className="prof-section-sub">{subtitle}</p>}
      </div>
    </div>
  );
}

function InfoRow({ label, value, icon }) {
  return (
    <div className="prof-info-row">
      <span className="prof-info-icon">{icon}</span>
      <div className="prof-info-content">
        <span className="prof-info-label">{label}</span>
        <span className="prof-info-value">{value || '—'}</span>
      </div>
    </div>
  );
}

function StatusBanner({ request, onDismiss, t }) {
  if (!request) return null;
  const { status, admin_note, requested_username, requested_email,
          requested_first_name, requested_last_name, requested_phone } = request;

  const colors = {
    pending:  { bg: 'rgba(234,179,8,0.10)',  border: 'rgba(234,179,8,0.35)',  color: '#b45309' },
    approved: { bg: 'rgba(34,197,94,0.10)',  border: 'rgba(34,197,94,0.35)',  color: '#15803d' },
    rejected: { bg: 'rgba(239,68,68,0.10)',  border: 'rgba(239,68,68,0.35)',  color: '#b91c1c' },
  };
  const c = colors[status] || colors.pending;

  const icon = status === 'approved'
    ? <svg viewBox="0 0 16 16" fill="none" width="16" height="16"><circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4"/><path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
    : status === 'rejected'
    ? <svg viewBox="0 0 16 16" fill="none" width="16" height="16"><circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4"/><path d="M5 5l6 6M11 5l-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
    : <svg viewBox="0 0 16 16" fill="none" width="16" height="16"><circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4"/><path d="M8 5v4M8 11v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>;

  const title = status === 'approved' ? t('profile.requestApproved')
    : status === 'rejected' ? t('profile.requestRejected')
    : t('profile.requestPending');

  const changes = [
    requested_first_name && `${t('profile.firstName')} → ${requested_first_name}`,
    requested_last_name  && `${t('profile.lastName')} → ${requested_last_name}`,
    requested_username   && `${t('profile.username')} → ${requested_username}`,
    requested_email      && `${t('profile.email')} → ${requested_email}`,
    requested_phone      && `${t('profile.phone')} → ${requested_phone}`,
  ].filter(Boolean);

  return (
    <div className="prof__request-status" style={{
      background: c.bg, border: `1px solid ${c.border}`, color: c.color,
    }}>
      <span style={{ flexShrink: 0, marginTop: 1 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <strong>{title}</strong>
        {changes.length > 0 && (
          <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.85 }}>
            {changes.map((ch, i) => <div key={i}>{ch}</div>)}
          </div>
        )}
        {admin_note && (
          <div style={{ fontSize: '12px', marginTop: '4px' }}>
            {t('profile.adminNote')} <em>{admin_note}</em>
          </div>
        )}
        {status === 'rejected' && (
          <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.7 }}>
            {t('profile.canSubmitNew')}
          </div>
        )}
      </div>
      <button onClick={onDismiss} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: 'inherit', opacity: 0.6, padding: '2px',
        display: 'flex', alignItems: 'center', flexShrink: 0,
      }}>
        <svg viewBox="0 0 12 12" fill="none" width="12" height="12">
          <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );
}

export default function ProfilePage({ currentUser, onProfilePicUpdate }) {
  const { t } = useTranslation();
  const fileInputRef = useRef(null);

  const [profile, setProfile]               = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [picUploading, setPicUploading]     = useState(false);

  const [pwForm, setPwForm]       = useState({ current: '', newPw: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [showPw, setShowPw]       = useState({ current: false, newPw: false, confirm: false });

  const [myRequest, setMyRequest] = useState(null);
  const [dismissedRequestId, setDismissedRequestId] = useState(() => {
    try { return localStorage.getItem('maklada_dismissed_request') || null; }
    catch { return null; }
  });

  const [changeForm, setChangeForm] = useState({
    firstName: '', lastName: '', username: '', email: '', phone: '',
  });
  const [changeFormVisible, setChangeFormVisible] = useState(false);
  const [reqLoading, setReqLoading] = useState(false);

  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => setToast({ message, type });
  const isAdmin = currentUser?.role === 'admin';

  const showBanner = myRequest && String(myRequest.id) !== String(dismissedRequestId);

  const handleDismissBanner = () => {
    if (myRequest) {
      const key = String(myRequest.id);
      setDismissedRequestId(key);
      try { localStorage.setItem('maklada_dismissed_request', key); } catch {}
    }
  };

  // Load profile
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_BASE}/api/profile`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: currentUser?.username }),
        });
        const data = await res.json();
        if (res.ok) setProfile(data);
      } catch { setProfile(currentUser); }
      finally { setLoadingProfile(false); }
    }
    load();
  }, [currentUser]);

  // Load change request
  useEffect(() => {
    if (!currentUser?.id || isAdmin) return;
    fetch(`${API_BASE}/api/profile/my-request/${currentUser.id}`)
      .then(r => r.json())
      .then(data => {
        setMyRequest(data);
        if (data) {
          const stored = localStorage.getItem('maklada_dismissed_request');
          if (stored && String(data.id) === stored) setDismissedRequestId(stored);
        }
      }).catch(() => {});
  }, [currentUser, isAdmin]);

  // Profile picture upload
  const handlePicChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { showToast('Please select an image file', 'error'); return; }
    if (file.size > 2 * 1024 * 1024) { showToast('Image too large (max 2MB)', 'error'); return; }
    setPicUploading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const res = await fetch(`${API_BASE}/api/profile/upload-pic`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUser?.id, imageData: ev.target.result }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        setProfile(prev => ({ ...prev, profile_pic: ev.target.result }));
        onProfilePicUpdate?.(ev.target.result);
        showToast('Profile picture updated!');
      } catch (err) { showToast(err.message || 'Failed to save picture', 'error'); }
      finally { setPicUploading(false); }
    };
    reader.readAsDataURL(file);
  };

  // Change password
  const handleChangePassword = async () => {
    if (!pwForm.current || !pwForm.newPw || !pwForm.confirm) { showToast(t('profile.pwAllFields'), 'error'); return; }
    if (pwForm.newPw !== pwForm.confirm) { showToast(t('header.passwordMismatch'), 'error'); return; }
    if (pwForm.newPw.length < 6) { showToast(t('header.passwordTooShort'), 'error'); return; }
    if (!/[a-zA-Z]/.test(pwForm.newPw)) { showToast(t('header.passwordNeedsLetter'), 'error'); return; }
    if (!/[0-9]/.test(pwForm.newPw)) { showToast(t('header.passwordNeedsNumber'), 'error'); return; }
    setPwLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/change-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser?.id, currentPassword: pwForm.current, newPassword: pwForm.newPw }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      showToast(t('header.passwordChanged'));
      setPwForm({ current: '', newPw: '', confirm: '' });
    } catch (err) { showToast(err.message || t('profile.pwError'), 'error'); }
    finally { setPwLoading(false); }
  };

  // Admin direct update
  const handleAdminUpdate = async (field, value) => {
    try {
      const body = { userId: currentUser?.id };
      if (field === 'username')   body.newUsername   = value;
      if (field === 'email')      body.newEmail      = value;
      if (field === 'first_name') body.newFirstName  = value;
      if (field === 'last_name')  body.newLastName   = value;
      if (field === 'phone')      body.newPhone      = value;
      const res = await fetch(`${API_BASE}/api/auth/update-info`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setProfile(prev => ({ ...prev, [field]: value }));
      showToast('Updated successfully!');
    } catch (err) { showToast(err.message || 'Failed to update', 'error'); }
  };

  // Submit change request
  const handleSubmitChangeRequest = async () => {
    const hasChange = changeForm.firstName || changeForm.lastName ||
                      changeForm.username  || changeForm.email    || changeForm.phone;
    if (!hasChange) { showToast(t('profile.fillOnlyChanged'), 'error'); return; }
    setReqLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/profile/request-change`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id,
          username: currentUser?.username,
          requestedFirstName: changeForm.firstName || null,
          requestedLastName:  changeForm.lastName  || null,
          requestedUsername:  changeForm.username  || null,
          requestedEmail:     changeForm.email     || null,
          requestedPhone:     changeForm.phone     || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      showToast(data.message);
      setChangeForm({ firstName: '', lastName: '', username: '', email: '', phone: '' });
      setChangeFormVisible(false);
      const reqRes = await fetch(`${API_BASE}/api/profile/my-request/${currentUser.id}`);
      const reqData = await reqRes.json();
      setMyRequest(reqData);
      if (reqData) {
        setDismissedRequestId(null);
        try { localStorage.removeItem('maklada_dismissed_request'); } catch {}
      }
    } catch (err) { showToast(err.message || 'Failed to submit request', 'error'); }
    finally { setReqLoading(false); }
  };

  const formatDate = (d) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }); }
    catch { return d; }
  };

  const displayProfile = profile || currentUser;
  const picSrc   = displayProfile?.profile_pic || null;
  const initials = (displayProfile?.username || '?')[0].toUpperCase();

  function AdminEditRow({ label, fieldKey, value, icon, type = 'text' }) {
    const [editing, setEditing] = useState(false);
    const [val, setVal] = useState('');
    return (
      <div className="prof-info-row">
        <span className="prof-info-icon">{icon}</span>
        <div className="prof-info-content" style={{ flex: 1 }}>
          <span className="prof-info-label">{label}</span>
          {editing ? (
            <div className="prof-info-edit-row">
              <input type={type} className="prof-info-edit-input" value={val}
                onChange={e => setVal(e.target.value)} placeholder={label}
                autoFocus onKeyDown={e => {
                  if (e.key === 'Enter') { if (val.trim()) handleAdminUpdate(fieldKey, val.trim()); setEditing(false); }
                  if (e.key === 'Escape') setEditing(false);
                }} />
              <button className="prof-info-edit-save" onClick={() => { if (val.trim()) handleAdminUpdate(fieldKey, val.trim()); setEditing(false); }}>✓</button>
              <button className="prof-info-edit-cancel" onClick={() => setEditing(false)}>✕</button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="prof-info-value">{value || '—'}</span>
              <button className="prof-info-pen" onClick={() => { setVal(''); setEditing(true); }} title={label}>
                <svg viewBox="0 0 16 16" fill="none" width="12" height="12">
                  <path d="M11.5 2.5a1.5 1.5 0 012.121 2.121L5.5 12.743 2 13.5l.757-3.5L11.5 2.5z"
                    stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const svgIcon = (d) => (
    <svg viewBox="0 0 16 16" fill="none" width="14" height="14">
      <path d={d} stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );

  return (
    <div className="prof">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handlePicChange} />

      <div className="prof__container">

        {/* Hero */}
        <div className="prof__hero">
          <div className="prof__hero-glow" />
          <div className="prof__pic-container">
            <div className="prof__pic-wrap" onClick={() => fileInputRef.current?.click()}>
              {picSrc ? (
                <img src={picSrc} alt="profile" className="prof__pic-img" />
              ) : (
                <div className="prof__pic-placeholder">{initials}</div>
              )}
              <div className="prof__pic-overlay">
                {picUploading ? <span className="prof__spinner prof__spinner--white" /> : (
                  <svg viewBox="0 0 20 20" fill="none" width="20" height="20">
                    <path d="M3 13.5V17h3.5l8.5-8.5-3.5-3.5L3 13.5zM16.7 4.3a1 1 0 000-1.4l-2.1-2.1a1 1 0 00-1.4 0l-1.4 1.4 3.5 3.5 1.4-1.4z" fill="white"/>
                  </svg>
                )}
              </div>
            </div>
            {picSrc && (
              <button className="prof__pic-delete"
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    await fetch(`${API_BASE}/api/profile/upload-pic`, {
                      method: 'POST', headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ userId: currentUser?.id, imageData: null }),
                    });
                    setProfile(prev => ({ ...prev, profile_pic: null }));
                    onProfilePicUpdate?.(null);
                    showToast('Profile picture removed');
                  } catch { showToast('Failed to remove picture', 'error'); }
                }}>
                <svg viewBox="0 0 16 16" fill="none" width="11" height="11">
                  <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
              </button>
            )}
          </div>

          <div className="prof__hero-info">
            <h2 className="prof__hero-name">
              {[displayProfile?.first_name, displayProfile?.last_name].filter(Boolean).join(' ') || displayProfile?.username || '—'}
            </h2>
            <p className="prof__hero-email">{displayProfile?.email || '—'}</p>
            <span className={`prof-badge prof-badge--${isAdmin ? 'admin' : 'user'}`}>
              {isAdmin ? (
                <><svg viewBox="0 0 14 14" fill="none" width="11" height="11"><circle cx="7" cy="5" r="2.2" stroke="currentColor" strokeWidth="1.3"/><path d="M2 12c0-2.76 2.24-4 5-4s5 1.24 5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M10 2l1 1 2-2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>Admin</>
              ) : (
                <><svg viewBox="0 0 14 14" fill="none" width="11" height="11"><circle cx="7" cy="5" r="2.2" stroke="currentColor" strokeWidth="1.3"/><path d="M2 12c0-2.76 2.24-4 5-4s5 1.24 5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>User</>
              )}
            </span>
          </div>

          <div className="prof__hero-stat">
            <span className="prof__hero-stat-val">
              {loadingProfile ? '…' : (displayProfile?.created_at ? new Date(displayProfile.created_at).getFullYear() : '—')}
            </span>
            <span className="prof__hero-stat-label">{t('profile.since')}</span>
          </div>
        </div>

        <div className="prof__grid">

          {/* Account Info */}
          <div className="prof__card">
            <SectionHeader
              title={t('profile.accountInfo')}
              subtitle={isAdmin ? t('profile.accountInfoSubAdmin') : t('profile.accountInfoSubUser')}
              icon={<svg viewBox="0 0 20 20" fill="none" width="18" height="18"><circle cx="10" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.5"/><path d="M3 18c0-3.87 3.13-6 7-6s7 2.13 7 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}
            />

            {!isAdmin && myRequest && showBanner && (
              <StatusBanner request={myRequest} onDismiss={handleDismissBanner} t={t} />
            )}

            <div className="prof__info-list">
              {isAdmin ? (
                <>
                  <AdminEditRow label={t('profile.firstName')} fieldKey="first_name" value={displayProfile?.first_name} icon={svgIcon('M8 6a2 2 0 100-4 2 2 0 000 4zM2 14a6 6 0 1112 0')} />
                  <AdminEditRow label={t('profile.lastName')}  fieldKey="last_name"  value={displayProfile?.last_name}  icon={svgIcon('M8 6a2 2 0 100-4 2 2 0 000 4zM2 14a6 6 0 1112 0')} />
                  <AdminEditRow label={t('profile.username')}  fieldKey="username"   value={displayProfile?.username}   icon={svgIcon('M8 6a2 2 0 100-4 2 2 0 000 4zM2 14a6 6 0 1112 0')} />
                  <AdminEditRow label={t('profile.email')}     fieldKey="email"      value={displayProfile?.email}      type="email" icon={svgIcon('M2 4h12l-6 5-6-5zM2 4v8h12V4')} />
                  <AdminEditRow label={t('profile.phone')}     fieldKey="phone"      value={displayProfile?.phone}      type="tel"   icon={svgIcon('M3 3h3l1.5 3.5-2 1.5a9 9 0 004.5 4.5l1.5-2L15 12v3a1 1 0 01-1 1C6 16 1 10 1 4a1 1 0 011-1z')} />
                </>
              ) : (
                <>
                  <InfoRow label={t('profile.firstName')} value={displayProfile?.first_name} icon={svgIcon('M8 6a2 2 0 100-4 2 2 0 000 4zM2 14a6 6 0 1112 0')} />
                  <InfoRow label={t('profile.lastName')}  value={displayProfile?.last_name}  icon={svgIcon('M8 6a2 2 0 100-4 2 2 0 000 4zM2 14a6 6 0 1112 0')} />
                  <InfoRow label={t('profile.username')}  value={displayProfile?.username}   icon={svgIcon('M8 6a2 2 0 100-4 2 2 0 000 4zM2 14a6 6 0 1112 0')} />
                  <InfoRow label={t('profile.email')}     value={displayProfile?.email}      icon={svgIcon('M2 4h12l-6 5-6-5zM2 4v8h12V4')} />
                  <InfoRow label={t('profile.phone')}     value={displayProfile?.phone}      icon={svgIcon('M3 3h3l1.5 3.5-2 1.5a9 9 0 004.5 4.5l1.5-2L15 12v3a1 1 0 01-1 1C6 16 1 10 1 4a1 1 0 011-1z')} />
                </>
              )}
              <InfoRow label={t('profile.role')}        value={displayProfile?.role}      icon={svgIcon('M8 2l1.5 3 3.5.5-2.5 2.5.5 3.5L8 10l-3 1.5.5-3.5L3 5.5 6.5 5z')} />
              <InfoRow label={t('profile.memberSince')} value={loadingProfile ? '…' : formatDate(displayProfile?.created_at)} icon={svgIcon('M1.5 5.5h13M4 1.5v2M12 1.5v2M2 3.5h12a.5.5 0 01.5.5v10a.5.5 0 01-.5.5H2a.5.5 0 01-.5-.5V4a.5.5 0 01.5-.5z')} />
            </div>

            {!isAdmin && (
              <div style={{ marginTop: '12px' }}>
                {!changeFormVisible ? (
                  <button className="prof__btn prof__btn--primary" onClick={() => setChangeFormVisible(true)} style={{ width: '100%' }}>
                    <svg viewBox="0 0 16 16" fill="none" width="14" height="14">
                      <path d="M11.5 2.5a1.5 1.5 0 012.121 2.121L5.5 12.743 2 13.5l.757-3.5L11.5 2.5z"
                        stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {t('profile.requestInfoChange')}
                  </button>
                ) : (
                  <div className="prof__change-request-form">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <p style={{ margin: 0, fontSize: '12.5px', color: '#7a99b8', fontWeight: 500 }}>
                        {t('profile.fillOnlyChanged')}
                      </p>
                      <button onClick={() => setChangeFormVisible(false)} style={{
                        background: 'none', border: 'none', cursor: 'pointer', color: '#a0b8cc', padding: '2px',
                      }}>
                        <svg viewBox="0 0 12 12" fill="none" width="12" height="12">
                          <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>
                    <div className="prof__change-grid">
                      {[
                        { key: 'firstName', label: t('profile.newFirstName'), type: 'text'  },
                        { key: 'lastName',  label: t('profile.newLastName'),  type: 'text'  },
                        { key: 'username',  label: t('profile.newUsername'),  type: 'text'  },
                        { key: 'email',     label: t('profile.newEmail'),     type: 'email' },
                        { key: 'phone',     label: t('profile.newPhone'),     type: 'tel'   },
                      ].map(({ key, label, type }) => (
                        <div className="prof__field" key={key}>
                          <label className="prof__label">{label}</label>
                          <input type={type} className="prof__input"
                            placeholder={t('profile.leaveBlank')}
                            style={{ paddingLeft: '13px' }}
                            value={changeForm[key]}
                            onChange={e => setChangeForm(prev => ({ ...prev, [key]: e.target.value }))} />
                        </div>
                      ))}
                    </div>
                    <button className="prof__btn prof__btn--primary" onClick={handleSubmitChangeRequest}
                      disabled={reqLoading} style={{ width: '100%', marginTop: '8px' }}>
                      {reqLoading ? <span className="prof__spinner" /> : (
                        <svg viewBox="0 0 16 16" fill="none" width="14" height="14">
                          <path d="M2 8h9M8 5l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                      {reqLoading ? t('profile.submitting') : t('profile.submitRequest')}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Change Password */}
          <div className="prof__card">
            <SectionHeader title={t('header.changePassword')} subtitle={t('header.changePasswordSub')}
              icon={<svg viewBox="0 0 20 20" fill="none" width="18" height="18"><rect x="4" y="9" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M7 9V6a3 3 0 016 0v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="10" cy="13.5" r="1" fill="currentColor"/></svg>}
            />
            <div className="prof__pw-form">
              {[
                { key: 'current', label: t('header.currentPassword') },
                { key: 'newPw',   label: t('header.newPassword') },
                { key: 'confirm', label: t('header.confirmPassword') },
              ].map(({ key, label }) => (
                <div className="prof__field" key={key}>
                  <label className="prof__label">{label}</label>
                  <div className="prof__input-wrap">
                    <input type={showPw[key] ? 'text' : 'password'} className="prof__input"
                      value={pwForm[key]} onChange={e => setPwForm(p => ({ ...p, [key]: e.target.value }))}
                      placeholder="••••••••" />
                    <button className="prof__eye" onClick={() => setShowPw(p => ({ ...p, [key]: !p[key] }))} type="button" tabIndex={-1}>
                      {showPw[key] ? (
                        <svg viewBox="0 0 16 16" fill="none" width="14" height="14"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.3"/><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3"/><path d="M2 2l12 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                      ) : (
                        <svg viewBox="0 0 16 16" fill="none" width="14" height="14"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.3"/><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3"/></svg>
                      )}
                    </button>
                  </div>
                </div>
              ))}
              <button className="prof__btn prof__btn--primary" onClick={handleChangePassword} disabled={pwLoading}>
                {pwLoading ? <span className="prof__spinner" /> : <svg viewBox="0 0 16 16" fill="none" width="14" height="14"><path d="M2 8l4 4 8-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                {pwLoading ? t('header.saving') : t('header.savePassword')}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}