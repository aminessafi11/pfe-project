import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './AdminPage.css';
import API_BASE from '../config';

function MsgBanner({ msg, type, onClose }) {
  if (!msg) return null;
  return (
    <div className={`admin-msg admin-msg--${type}`}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span>{msg}</span>
      <button onClick={onClose} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: 'inherit', opacity: 0.7, padding: '0 0 0 10px',
        display: 'flex', alignItems: 'center',
      }}>
        <svg viewBox="0 0 12 12" fill="none" width="12" height="12">
          <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );
}

function TrashBtn({ onClick, disabled, title }) {
  return (
    <button
      className="admin-trash-btn"
      onClick={onClick}
      disabled={disabled}
      title={title || 'Delete'}
      style={{
        opacity: disabled ? 0.25 : undefined,
        cursor: disabled ? 'not-allowed' : undefined,
      }}
    >
      <svg viewBox="0 0 16 16" fill="none" width="14" height="14">
        <path d="M3 4h10M6 4V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5V4M5 4l.5 9h5L11 4"
          stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  );
}

function UserAvatar({ pic, username, size = 30 }) {
  if (pic) {
    return (
      <img src={pic} alt={username} style={{
        width: size, height: size, borderRadius: '50%',
        objectFit: 'cover', flexShrink: 0,
        border: '1.5px solid rgba(91,174,224,0.3)', display: 'block',
      }} />
    );
  }
  return (
    <div className="admin-table__avatar" style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {username[0].toUpperCase()}
    </div>
  );
}

function FieldDecision({ label, value, fieldKey, decisions, onChange }) {
  const decision = decisions[fieldKey] ?? 'approve';
  return (
    <div className="admin-field-decision">
      <div className="admin-field-decision__info">
        <span className="admin-field-decision__label">{label}</span>
        <span className="admin-field-decision__value">{value}</span>
      </div>
      <div className="admin-field-decision__toggle">
        <button
          className={`admin-field-decision__btn admin-field-decision__btn--approve ${decision === 'approve' ? 'active' : ''}`}
          onClick={() => onChange(fieldKey, 'approve')}>
          <svg viewBox="0 0 12 12" fill="none" width="11" height="11">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Apply
        </button>
        <button
          className={`admin-field-decision__btn admin-field-decision__btn--skip ${decision === 'skip' ? 'active' : ''}`}
          onClick={() => onChange(fieldKey, 'skip')}>
          <svg viewBox="0 0 12 12" fill="none" width="11" height="11">
            <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Skip
        </button>
      </div>
    </div>
  );
}

export default function AdminPage({ currentUser }) {
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    username: '', email: '', firstName: '', lastName: '', phone: '', role: 'user',
  });
  const [creating, setCreating]           = useState(false);
  const [createMsg, setCreateMsg]         = useState('');
  const [createMsgType, setCreateMsgType] = useState('');

  const [users, setUsers]               = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [requests, setRequests]               = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [decisions, setDecisions]             = useState({});
  const [rejectNote, setRejectNote]           = useState({});
  const [actionLoading, setActionLoading]     = useState({});

  const [allReports, setAllReports]         = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);

  useEffect(() => { fetchUsers(); fetchRequests(); fetchAllReports(); }, []);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/users`);
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch { setUsers([]); }
    finally { setLoadingUsers(false); }
  };

  const fetchRequests = async () => {
    setLoadingRequests(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/change-requests`);
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch { setRequests([]); }
    finally { setLoadingRequests(false); }
  };

  const fetchAllReports = async () => {
    setLoadingReports(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/reports`);
      const data = await res.json();
      setAllReports(Array.isArray(data) ? data : []);
    } catch { setAllReports([]); }
    finally { setLoadingReports(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.email || !formData.firstName || !formData.lastName) return;
    setCreating(true); setCreateMsg('');
    try {
      const res = await fetch(`${API_BASE}/api/admin/create-user`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username, email: formData.email,
          firstName: formData.firstName, lastName: formData.lastName,
          phone: formData.phone, role: formData.role,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setCreateMsgType('error'); setCreateMsg(data.message); }
      else {
        setCreateMsgType('success'); setCreateMsg(data.message);
        setFormData({ username: '', email: '', firstName: '', lastName: '', phone: '', role: 'user' });
        fetchUsers();
      }
    } catch { setCreateMsgType('error'); setCreateMsg('Cannot connect to server.'); }
    finally { setCreating(false); }
  };

  const handleDelete = async (id, username) => {
    if (currentUser && String(id) === String(currentUser.id)) {
      alert('You cannot delete your own account.');
      return;
    }
    if (!window.confirm(`Delete account "${username}"?`)) return;
    try {
      const res = await fetch(
        `${API_BASE}/api/admin/users/${id}?requestingAdminId=${currentUser?.id}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (!res.ok) { alert(data.message); return; }
      fetchUsers();
    } catch {}
  };

  const setDecision = (reqId, fieldKey, value) => {
    setDecisions(prev => ({ ...prev, [reqId]: { ...(prev[reqId] || {}), [fieldKey]: value } }));
  };

  const handleApprove = async (req) => {
    const reqDecisions = decisions[req.id] || {};
    const fieldsToApply = {};
    if (req.requested_first_name && (reqDecisions.first_name ?? 'approve') === 'approve')
      fieldsToApply.first_name = req.requested_first_name;
    if (req.requested_last_name  && (reqDecisions.last_name  ?? 'approve') === 'approve')
      fieldsToApply.last_name  = req.requested_last_name;
    if (req.requested_username   && (reqDecisions.username   ?? 'approve') === 'approve')
      fieldsToApply.username   = req.requested_username;
    if (req.requested_email      && (reqDecisions.email      ?? 'approve') === 'approve')
      fieldsToApply.email      = req.requested_email;
    if (req.requested_phone      && (reqDecisions.phone      ?? 'approve') === 'approve')
      fieldsToApply.phone      = req.requested_phone;

    setActionLoading(prev => ({ ...prev, [req.id]: 'approving' }));
    try {
      const res = await fetch(`${API_BASE}/api/admin/change-requests/${req.id}/approve`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: rejectNote[req.id] || '', fieldsToApply }),
      });
      const data = await res.json();
      if (!res.ok) alert(data.message);
      else { fetchRequests(); fetchUsers(); }
    } catch {}
    finally { setActionLoading(prev => ({ ...prev, [req.id]: null })); }
  };

  const handleReject = async (id) => {
    setActionLoading(prev => ({ ...prev, [id]: 'rejecting' }));
    try {
      await fetch(`${API_BASE}/api/admin/change-requests/${id}/reject`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: rejectNote[id] || '' }),
      });
      fetchRequests();
    } catch {}
    finally { setActionLoading(prev => ({ ...prev, [id]: null })); }
  };

  const handleDeleteRequest = async (id) => {
    try {
      await fetch(`${API_BASE}/api/admin/change-requests/${id}`, { method: 'DELETE' });
      setRequests(prev => prev.filter(r => r.id !== id));
    } catch {}
  };

  const handleClearRequestHistory = async () => {
    if (!window.confirm('Clear resolved request history? Pending will not be affected.')) return;
    try {
      await fetch(`${API_BASE}/api/admin/change-requests`, { method: 'DELETE' });
      setRequests(prev => prev.filter(r => r.status === 'pending'));
    } catch {}
  };

  const handleDeleteReport = async (id) => {
    try {
      await fetch(`${API_BASE}/api/admin/reports/${id}`, { method: 'DELETE' });
      setAllReports(prev => prev.filter(r => r.id !== id));
    } catch {}
  };

  const handleClearReports = async () => {
    if (!window.confirm('Clear all report history?')) return;
    try {
      await fetch(`${API_BASE}/api/admin/reports`, { method: 'DELETE' });
      setAllReports([]);
    } catch {}
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const otherRequests   = requests.filter(r => r.status !== 'pending');

  const statusStyle = {
    pending:  { background: 'rgba(234,179,8,0.12)',  color: '#b45309', border: '1px solid rgba(234,179,8,0.3)'  },
    approved: { background: 'rgba(34,197,94,0.12)',  color: '#15803d', border: '1px solid rgba(34,197,94,0.3)'  },
    rejected: { background: 'rgba(239,68,68,0.12)',  color: '#b91c1c', border: '1px solid rgba(239,68,68,0.3)'  },
  };

  function parseFilters(f) {
    try {
      const obj = typeof f === 'string' ? JSON.parse(f) : (f || {});
      const parts = [];
      if (obj.machine)      parts.push(`Machine ${obj.machine}`);
      if (obj.year)         parts.push(`Year ${obj.year}`);
      if (obj.month)        parts.push(`Month ${obj.month}`);
      if (obj.service)      parts.push(obj.service);
      if (obj.centreCharge) parts.push(`Centre ${obj.centreCharge}`);
      return parts.length ? parts.join(' · ') : 'Global';
    } catch { return 'Global'; }
  }

  const reqField = (key, label, type = 'text', placeholder = '') => (
    <div className="admin-field">
      <label className="admin-label">
        {label}<span style={{ color: '#e74c3c', marginLeft: 3 }}>*</span>
      </label>
      <input className="admin-input" type={type} placeholder={placeholder}
        value={formData[key]}
        onChange={e => setFormData(prev => ({ ...prev, [key]: e.target.value }))} />
    </div>
  );

  const optField = (key, label, type = 'text', placeholder = '') => (
    <div className="admin-field">
      <label className="admin-label">{label}</label>
      <input className="admin-input" type={type} placeholder={placeholder}
        value={formData[key]}
        onChange={e => setFormData(prev => ({ ...prev, [key]: e.target.value }))} />
    </div>
  );

  return (
    <div className="admin-root">
      <div className="admin-grid">

        <div className="admin-grid--top">

          {/* ── Create New Account ── */}
          <div className="admin-card">
            <div className="admin-card__head">
              <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
                <circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M3 18c0-3.87 3.13-6 7-6s7 2.13 7 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M15 11v4M13 13h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span>Create New Account</span>
            </div>
            <form className="admin-form" onSubmit={handleCreate} noValidate>
              <div className="admin-form__grid">
                {reqField('firstName', 'First Name',    'text',  'Enter first name')}
                {reqField('lastName',  'Last Name',     'text',  'Enter last name')}
                {reqField('username',  'Username',      'text',  'Enter username')}
                {reqField('email',     'Email',         'email', 'Enter email address')}
              </div>

              {optField('phone', 'Phone Number', 'tel', 'e.g. +216 XX XXX XXX (optional)')}

              {/* Role toggle */}
              <div className="admin-field">
                <label className="admin-label">Role</label>
                <div className="admin-role-select-wrap">
                  <button type="button"
                    className={`admin-role-btn ${formData.role === 'user' ? 'admin-role-btn--active-user' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, role: 'user' }))}>
                    <svg viewBox="0 0 16 16" fill="none" width="13" height="13">
                      <circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
                      <path d="M2 14c0-3.31 2.69-5 6-5s6 1.69 6 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                    </svg>
                    User
                  </button>
                  <button type="button"
                    className={`admin-role-btn ${formData.role === 'admin' ? 'admin-role-btn--active-admin' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, role: 'admin' }))}>
                    <svg viewBox="0 0 16 16" fill="none" width="13" height="13">
                      <circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
                      <path d="M2 14c0-3.31 2.69-5 6-5s6 1.69 6 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                      <path d="M11 2l1 1 2-2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Admin
                  </button>
                </div>
              </div>

              <MsgBanner msg={createMsg} type={createMsgType} onClose={() => setCreateMsg('')} />
              <button type="submit" className="admin-btn admin-btn--primary"
                disabled={creating || !formData.username || !formData.email || !formData.firstName || !formData.lastName}>
                {creating ? (
                  <><span className="admin-spinner" />{t('admin.creating')}</>
                ) : (
                  `Create ${formData.role === 'admin' ? 'Admin' : 'User'} & Send Email`
                )}
              </button>
            </form>
          </div>

          {/* ── Pending Change Requests ── */}
          <div className="admin-card">
            <div className="admin-card__head">
              <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
                <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M10 6v5l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span>Pending Change Requests</span>
              {pendingRequests.length > 0 && (
                <span className="admin-badge">{pendingRequests.length}</span>
              )}
            </div>

            {loadingRequests ? (
              <div className="admin-loading">Loading...</div>
            ) : pendingRequests.length === 0 ? (
              <div className="admin-empty">
                <svg viewBox="0 0 40 40" fill="none" width="36" height="36">
                  <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="1.5" opacity="0.3"/>
                  <path d="M14 20l4 4 8-8" stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
                </svg>
                No pending requests
              </div>
            ) : (
              <div className="admin-requests-list">
                {pendingRequests.map(req => (
                  <div key={req.id} className="admin-request-card">
                    <div className="admin-request-card__top">
                      <div className="admin-request-card__user">
                        <UserAvatar pic={req.user_profile_pic} username={req.username} size={34} />
                        <div>
                          <div className="admin-request-card__name">{req.username}</div>
                          <div className="admin-request-card__date">{new Date(req.created_at).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <span className="admin-request-card__status" style={statusStyle.pending}>PENDING</span>
                    </div>

                    <div className="admin-field-decisions">
                      {req.requested_first_name && (
                        <FieldDecision label="First Name" value={req.requested_first_name}
                          fieldKey="first_name" decisions={decisions[req.id] || {}}
                          onChange={(k, v) => setDecision(req.id, k, v)} />
                      )}
                      {req.requested_last_name && (
                        <FieldDecision label="Last Name" value={req.requested_last_name}
                          fieldKey="last_name" decisions={decisions[req.id] || {}}
                          onChange={(k, v) => setDecision(req.id, k, v)} />
                      )}
                      {req.requested_username && (
                        <FieldDecision label="Username" value={req.requested_username}
                          fieldKey="username" decisions={decisions[req.id] || {}}
                          onChange={(k, v) => setDecision(req.id, k, v)} />
                      )}
                      {req.requested_email && (
                        <FieldDecision label="Email" value={req.requested_email}
                          fieldKey="email" decisions={decisions[req.id] || {}}
                          onChange={(k, v) => setDecision(req.id, k, v)} />
                      )}
                      {req.requested_phone && (
                        <FieldDecision label="Phone" value={req.requested_phone}
                          fieldKey="phone" decisions={decisions[req.id] || {}}
                          onChange={(k, v) => setDecision(req.id, k, v)} />
                      )}
                    </div>

                    <div style={{ fontSize: '11.5px', color: '#9ab5cc', padding: '4px 2px' }}>
                      Current email: {req.current_email}
                    </div>

                    <div className="admin-request-card__note-wrap">
                      <input type="text" className="admin-input"
                        placeholder="Note for user (optional — sent with email)"
                        value={rejectNote[req.id] || ''}
                        onChange={e => setRejectNote(prev => ({ ...prev, [req.id]: e.target.value }))} />
                    </div>

                    <div className="admin-request-card__actions">
                      <button className="admin-btn admin-btn--approve"
                        onClick={() => handleApprove(req)}
                        disabled={!!actionLoading[req.id]}>
                        {actionLoading[req.id] === 'approving' ? <span className="admin-spinner" /> : (
                          <svg viewBox="0 0 16 16" fill="none" width="13" height="13">
                            <path d="M3 8l3.5 3.5L13 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                        Approve Selected
                      </button>
                      <button className="admin-btn admin-btn--reject"
                        onClick={() => handleReject(req.id)}
                        disabled={!!actionLoading[req.id]}>
                        {actionLoading[req.id] === 'rejecting' ? <span className="admin-spinner" /> : (
                          <svg viewBox="0 0 16 16" fill="none" width="13" height="13">
                            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                          </svg>
                        )}
                        Reject All
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>{/* end admin-grid--top */}

        {/* ── All Users ── */}
        <div className="admin-card">
          <div className="admin-card__head">
            <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
              <circle cx="7" cy="7" r="3" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M1 18c0-3.31 2.69-5 6-5s6 1.69 6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="14" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M17 18c0-2.76-1.34-4.5-3-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span>{t('admin.allUsers')}</span>
            <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--ice-slate)' }}>
              {users.length} accounts
            </span>
          </div>
          {loadingUsers ? (
            <div className="admin-loading">Loading users...</div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Full Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Created</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => {
                    const fullName = [u.first_name, u.last_name].filter(Boolean).join(' ') || '—';
                    const isSelf = currentUser && String(u.id) === String(currentUser.id);
                    return (
                      <tr key={u.id}>
                        <td>
                          <div className="admin-table__user">
                            <UserAvatar pic={u.profile_pic} username={u.username} size={30} />
                            {u.username}
                            {isSelf && (
                              <span style={{
                                fontSize: '10px', color: '#4a9fd4',
                                background: 'rgba(91,174,224,0.12)',
                                border: '1px solid rgba(91,174,224,0.3)',
                                borderRadius: '10px', padding: '1px 7px',
                              }}>You</span>
                            )}
                          </div>
                        </td>
                        <td>{fullName}</td>
                        <td>{u.email}</td>
                        <td>{u.phone || '—'}</td>
                        <td>
                          <span className={`admin-role-badge admin-role-badge--${u.role}`}>{u.role}</span>
                        </td>
                        <td>{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
                        <td style={{ textAlign: 'center' }}>
                          <TrashBtn
                            onClick={() => handleDelete(u.id, u.username)}
                            disabled={isSelf}
                            title={isSelf ? 'You cannot delete your own account' : `Delete ${u.username}`}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Request History ── */}
        {otherRequests.length > 0 && (
          <div className="admin-card">
            <div className="admin-card__head">
              <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
                <path d="M3 4h14M3 8h10M3 12h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span>Request History</span>
              <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--ice-slate)', marginRight: '12px' }}>
                {otherRequests.length} requests
              </span>
              <button className="admin-btn-clear" onClick={handleClearRequestHistory}>
                <svg viewBox="0 0 16 16" fill="none" width="12" height="12">
                  <path d="M2 4h12M5 4V2.5a.5.5 0 01.5-.5h5a.5.5 0 01.5.5V4M4 4l.667 9.333A1 1 0 005.66 14.5h4.68a1 1 0 00.993-.667L12 4"
                    stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Clear All
              </button>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Changes Requested</th>
                    <th>Status</th>
                    <th>Admin Note</th>
                    <th>Date</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {otherRequests.map(req => {
                    const changes = [
                      req.requested_first_name && `First: ${req.requested_first_name}`,
                      req.requested_last_name  && `Last: ${req.requested_last_name}`,
                      req.requested_username   && `Username: ${req.requested_username}`,
                      req.requested_email      && `Email: ${req.requested_email}`,
                      req.requested_phone      && `Phone: ${req.requested_phone}`,
                    ].filter(Boolean).join(' · ') || '—';
                    return (
                      <tr key={req.id}>
                        <td>
                          <div className="admin-table__user">
                            <UserAvatar pic={req.user_profile_pic} username={req.username} size={30} />
                            {req.username}
                          </div>
                        </td>
                        <td style={{ fontSize: '12px' }}>{changes}</td>
                        <td><span className="admin-role-badge" style={statusStyle[req.status]}>{req.status}</span></td>
                        <td style={{ fontSize: '12px' }}>{req.admin_note || '—'}</td>
                        <td style={{ fontSize: '12px' }}>{new Date(req.created_at).toLocaleDateString()}</td>
                        <td style={{ textAlign: 'center' }}>
                          <TrashBtn onClick={() => handleDeleteRequest(req.id)} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Reports Log ── */}
        <div className="admin-card">
          <div className="admin-card__head">
            <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
              <path d="M4 3h8l4 4v10a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z"
                stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M12 3v5h5M7 10h6M7 13h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span>Reports Generated</span>
            <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--ice-slate)', marginRight: '12px' }}>
              {allReports.length} reports
            </span>
            {allReports.length > 0 && (
              <button className="admin-btn-clear" onClick={handleClearReports}>
                <svg viewBox="0 0 16 16" fill="none" width="12" height="12">
                  <path d="M2 4h12M5 4V2.5a.5.5 0 01.5-.5h5a.5.5 0 01.5.5V4M4 4l.667 9.333A1 1 0 005.66 14.5h4.68a1 1 0 00.993-.667L12 4"
                    stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Clear All
              </button>
            )}
          </div>

          {loadingReports ? (
            <div className="admin-loading">Loading reports...</div>
          ) : allReports.length === 0 ? (
            <div className="admin-empty">
              <svg viewBox="0 0 40 40" fill="none" width="36" height="36">
                <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="1.5" opacity="0.3"/>
              </svg>
              No reports generated yet
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Filters Used</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {allReports.map(r => (
                    <tr key={r.id}>
                      <td>
                        <div className="admin-table__user">
                          <UserAvatar pic={r.user_profile_pic} username={r.username} size={30} />
                          {r.username}
                        </div>
                      </td>
                      <td style={{ fontSize: '12px' }}>{parseFilters(r.filters)}</td>
                      <td>
                        <span className="admin-role-badge" style={{
                          background: r.status === 'success' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                          color: r.status === 'success' ? '#15803d' : '#b91c1c',
                          border: `1px solid ${r.status === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                        }}>
                          {r.status}
                        </span>
                      </td>
                      <td style={{ fontSize: '12px' }}>{new Date(r.created_at).toLocaleString()}</td>
                      <td style={{ textAlign: 'center' }}>
                        <TrashBtn onClick={() => handleDeleteReport(r.id)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}