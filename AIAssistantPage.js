import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import bgMain from '../assets/bg-main.jpg';
import './AIAssistantPage.css';
import API_BASE from '../config';

const COLORS = {
  depannages:    '#E24B4A',
  preventifs:    '#1D9E75',
  ameliorations: '#378ADD',
  total:         '#7F77DD',
  cout:          '#BA7517',
};
const PIE_COLORS = ['#E24B4A', '#1D9E75', '#378ADD', '#BA7517', '#7F77DD'];

// Button only shows for these — NOT for global_stats, bt_detail, date_detail, or "hi"
const CHART_ALLOWED_LABELS = [
  'machine_profile',
  'top_machines',
  'top_machines_cost',
  'top_pieces',
  'preventif_vs_correctif',
  'monthly_patterns',
  'year_stats',
  'predictions',
];

function ChartRenderer({ queryLabel, chartData, machineNum, year }) {
  if (!queryLabel || !chartData) return null;

  if (queryLabel === 'machine_profile' && chartData.par_annee?.length > 0) {
    return (
      <div style={styles.chartWrap}>
        <p style={styles.chartTitle}>Machine {machineNum} — Interventions par année</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData.par_annee} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
            <XAxis dataKey="ANNEE" tick={{ fontSize: 12, fill: '#64748b' }} />
            <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
            <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="depannages"    name="Dépannages"    fill={COLORS.depannages}    radius={[4,4,0,0]} />
            <Bar dataKey="preventifs"    name="Préventifs"    fill={COLORS.preventifs}    radius={[4,4,0,0]} />
            <Bar dataKey="ameliorations" name="Améliorations" fill={COLORS.ameliorations} radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (queryLabel === 'top_machines' || queryLabel === 'top_machines_cost') {
    const data = chartData.top_machines || chartData.top_machines_cout || [];
    if (!data.length) return null;
    const key  = queryLabel === 'top_machines_cost' ? 'cout_total_dt' : 'total_bt';
    const name = queryLabel === 'top_machines_cost' ? 'Coût (DT)' : 'Total BTs';
    return (
      <div style={styles.chartWrap}>
        <p style={styles.chartTitle}>Top machines — {name}</p>
        <ResponsiveContainer width="100%" height={data.length * 36 + 60}>
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
            <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
            <YAxis dataKey="NU_MACHINE" type="category" tick={{ fontSize: 11, fill: '#64748b' }} width={50} />
            <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
            <Bar dataKey={key} name={name} fill={COLORS.total} radius={[0,4,4,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (queryLabel === 'top_pieces' && chartData.top_pieces?.length > 0) {
    const data = chartData.top_pieces.map(p => ({
      ...p, name: p.DESIG_ART?.slice(0, 25) || p.CODE_ART
    }));
    return (
      <div style={styles.chartWrap}>
        <p style={styles.chartTitle}>Top pièces — Utilisations</p>
        <ResponsiveContainer width="100%" height={data.length * 36 + 60}>
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
            <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#64748b' }} width={120} />
            <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
            <Bar dataKey="utilisations" name="Utilisations" fill={COLORS.cout} radius={[0,4,4,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (queryLabel === 'preventif_vs_correctif' && chartData.preventif_vs_correctif?.length > 0) {
    const data = chartData.preventif_vs_correctif;
    const totals = data.reduce((acc, row) => {
      acc.depannages    += row.depannages    || 0;
      acc.preventifs    += row.preventifs    || 0;
      acc.ameliorations += row.ameliorations || 0;
      return acc;
    }, { depannages: 0, preventifs: 0, ameliorations: 0 });
    const pieData = [
      { name: 'Dépannages',    value: totals.depannages    },
      { name: 'Préventifs',    value: totals.preventifs    },
      { name: 'Améliorations', value: totals.ameliorations },
    ].filter(d => d.value > 0);
    return (
      <div style={styles.chartWrap}>
        <p style={styles.chartTitle}>Répartition des types d'intervention</p>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <ResponsiveContainer width="50%" height={200}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <ResponsiveContainer width="48%" height={200}>
            <BarChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
              <XAxis dataKey="ANNEE" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="depannages" name="Dépannages" fill={COLORS.depannages} radius={[4,4,0,0]} />
              <Bar dataKey="preventifs" name="Préventifs"  fill={COLORS.preventifs}  radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  if (queryLabel === 'monthly_patterns' && chartData.par_mois_global?.length > 0) {
    const data = chartData.par_mois_global.map(r => ({ ...r, name: r.MOIS_NOM }));
    return (
      <div style={styles.chartWrap}>
        <p style={styles.chartTitle}>Activité mensuelle (toutes années)</p>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
            <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="depannages" name="Dépannages" stroke={COLORS.depannages} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="preventifs"  name="Préventifs"  stroke={COLORS.preventifs}  strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (queryLabel === 'year_stats' && chartData.annee_par_mois?.length > 0) {
    const data = chartData.annee_par_mois.map(r => ({ ...r, name: r.MOIS_NOM }));
    return (
      <div style={styles.chartWrap}>
        <p style={styles.chartTitle}>Année {year} — Interventions par mois</p>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
            <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="depannages" name="Dépannages" stroke={COLORS.depannages} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="preventifs"  name="Préventifs"  stroke={COLORS.preventifs}  strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (queryLabel === 'predictions' && chartData.tendance_annuelle?.length > 0) {
    return (
      <div style={styles.chartWrap}>
        <p style={styles.chartTitle}>Tendance historique — Base pour prédiction</p>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData.tendance_annuelle} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
            <XAxis dataKey="ANNEE" tick={{ fontSize: 12, fill: '#64748b' }} />
            <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
            <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="total_bt"   name="Total BTs"  stroke={COLORS.total}      strokeWidth={2} />
            <Line type="monotone" dataKey="depannages" name="Dépannages" stroke={COLORS.depannages} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="preventifs" name="Préventifs" stroke={COLORS.preventifs} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return null;
}

async function sendToBackend(messages, username) {
  const response = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, username }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Backend error');
  return data;
}

function AvatarIcon({ size = 32 }) {
  return (
    <div className="ai-avatar" style={{ width: size, height: size }}>
      <div className="ai-avatar__glow" />
      <svg viewBox="0 0 32 32" fill="none" width={size} height={size} className="ai-avatar__svg">
        <circle cx="16" cy="16" r="14.5" stroke="url(#avatarGrad)" strokeWidth="1.5"/>
        <path d="M16 8C12.13 8 9 11.13 9 15c0 2.39 1.19 4.5 3 5.74V23h8v-2.26C21.81 19.5 23 17.39 23 15c0-3.87-3.13-7-7-7z"
          stroke="url(#avatarGrad)" strokeWidth="1.4" strokeLinejoin="round"/>
        <path d="M13 23v1.5a1 1 0 001 1h4a1 1 0 001-1V23"
          stroke="url(#avatarGrad)" strokeWidth="1.4" strokeLinejoin="round"/>
        <circle cx="13.5" cy="15" r="1" fill="url(#avatarGrad)"/>
        <circle cx="18.5" cy="15" r="1" fill="url(#avatarGrad)"/>
        <defs>
          <linearGradient id="avatarGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop stopColor="#5BAEE0"/>
            <stop offset="1" stopColor="#3E87C7"/>
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  const [chartVisible, setChartVisible] = useState(false);

  const hasChart = !isUser
    && message.queryLabel
    && CHART_ALLOWED_LABELS.includes(message.queryLabel)
    && message.chartData;

  return (
    <div className={`msg ${isUser ? 'msg--user' : 'msg--ai'}`}>
      {!isUser && <div className="msg__avatar"><AvatarIcon /></div>}
      <div className={`msg__bubble ${isUser ? 'msg__bubble--user' : 'msg__bubble--ai'}`}>
        <p className="msg__text" style={{ whiteSpace: 'pre-wrap' }}>{message.content}</p>
        <span className="msg__time">{message.time}</span>
        {hasChart && (
          <button onClick={() => setChartVisible(v => !v)} style={styles.chartBtn}>
            📊 {chartVisible ? 'Masquer le graphique' : 'Afficher en graphique'}
          </button>
        )}
        {hasChart && chartVisible && (
          <ChartRenderer
            queryLabel={message.queryLabel}
            chartData={message.chartData}
            machineNum={message.machineNum}
            year={message.year}
          />
        )}
      </div>
    </div>
  );
}

function TypingIndicator({ label }) {
  return (
    <div className="msg msg--ai">
      <div className="msg__avatar"><AvatarIcon /></div>
      <div className="msg__bubble msg__bubble--ai msg__bubble--typing">
        <div className="typing-dots"><span /><span /><span /></div>
        <span className="typing-label">{label}</span>
      </div>
    </div>
  );
}

function now() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function AIAssistantPage({ currentUser }) {
  const { t } = useTranslation();

  const STORAGE_KEY = `maklada_chat_messages_${currentUser?.username || 'guest'}`;
  const HISTORY_KEY = `maklada_chat_history_${currentUser?.username || 'guest'}`;

  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [{ id: 0, role: 'ai', time: now(), content: t('assistant.welcome') }];
  });

  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const [input, setInput]           = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isSending, setIsSending]   = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages)); } catch (e) {}
  }, [messages]);

  useEffect(() => {
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); } catch (e) {}
  }, [history]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isThinking) return;

    const userMsg = { id: Date.now(), role: 'user', content: text, time: now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);

    const newHistory = [...history, { role: 'user', content: text }];
    const apiMessages = newHistory.slice(-8);
    const username = currentUser?.username || 'utilisateur';

    try {
      const data = await sendToBackend(apiMessages, username);
      const aiMsg = {
        id:         Date.now() + 1,
        role:       'ai',
        content:    data.reply,
        time:       now(),
        queryLabel: data.queryLabel || null,
        chartData:  data.chartData  || null,
        machineNum: data.machineNum || null,
        year:       data.year       || null,
      };
      setMessages(prev => [...prev, aiMsg]);
      setHistory(prev => [
        ...prev,
        { role: 'user',      content: text       },
        { role: 'assistant', content: data.reply }
      ].slice(-14));
    } catch (err) {
      let errMsg = '❌ Erreur de connexion au serveur.';
      if (err.message?.includes('429'))      errMsg = '⏳ Limite API atteinte. Attendez 1 minute.';
      else if (err.message?.includes('401')) errMsg = '❌ Clé API invalide.';
      else errMsg = `❌ Erreur : ${err.message}`;
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'ai', content: errMsg, time: now() }]);
    } finally {
      setIsThinking(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const clearChat = () => {
    const welcome = [{ id: 0, role: 'ai', time: now(), content: t('assistant.welcome') }];
    setMessages(welcome);
    setHistory([]);
    setIsThinking(false);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(HISTORY_KEY);
  };

  const sendReport = async () => {
    if (isSending || messages.length <= 1) return;
    setIsSending(true);
    try {
      const username = currentUser?.username || 'utilisateur';
      const response = await fetch(`${API_BASE}/api/send-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, username, userEmail: currentUser?.email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setMessages(prev => [...prev, {
        id: Date.now(), role: 'ai', time: now(),
        content: `📧 Rapport envoyé à ${currentUser?.email || 'votre email'} !`,
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now(), role: 'ai', time: now(),
        content: `❌ Erreur rapport: ${err.message}`,
      }]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div className="assistant" style={{ backgroundImage: `url(${bgMain})` }}>
      <div className="assistant__overlay" />
      <div className="assistant__container">
        <div className="assistant__header">
          <div className="assistant__header-identity">
            <AvatarIcon size={36} />
            <div>
              <h3 className="assistant__header-title">{t('assistant.title')}</h3>
              <p className="assistant__header-sub">{t('assistant.subtitle')}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="assistant__clear-btn"
              onClick={sendReport}
              disabled={isSending || messages.length <= 1}
              style={{
                background: 'rgba(232,112,58,0.15)',
                borderColor: 'rgba(232,112,58,0.3)',
                color: '#e8703a',
                opacity: messages.length <= 1 ? 0.4 : 1,
              }}
            >
              <svg viewBox="0 0 18 18" fill="none" width="14" height="14">
                <path d="M9 1v10M5 7l4 4 4-4M3 14h12v2H3z"
                  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>{isSending ? 'Envoi...' : 'Envoyer rapport'}</span>
            </button>
            <button className="assistant__clear-btn" onClick={clearChat}>
              <svg viewBox="0 0 18 18" fill="none" width="14" height="14">
                <path d="M3 4h12M6 4V3a1 1 0 011-1h4a1 1 0 011 1v1M5 4l1 11h6l1-11"
                  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>{t('assistant.clearChat')}</span>
            </button>
          </div>
        </div>

        <div className="assistant__messages">
          {messages.map(msg => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          {isThinking && <TypingIndicator label={t('assistant.thinking')} />}
          <div ref={bottomRef} />
        </div>

        <div className="assistant__input-area">
          <div className="assistant__input-wrap">
            <textarea
              ref={inputRef}
              className="assistant__input"
              placeholder={t('assistant.placeholder')}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={isThinking}
            />
            <button
              className="assistant__send-btn"
              onClick={sendMessage}
              disabled={!input.trim() || isThinking}
            >
              <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
                <path d="M3 10L17 3l-7 7 7 7-14-7z" fill="currentColor"/>
              </svg>
            </button>
          </div>
          <p className="assistant__input-hint">
            Enter ↵ {t('assistant.send')} · Shift+Enter {t('assistant.thinking')}
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  chartBtn: {
    marginTop: 10,
    padding: '6px 14px',
    background: 'rgba(55,138,221,0.12)',
    border: '1px solid rgba(55,138,221,0.3)',
    borderRadius: 10,
    color: '#185FA5',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    transition: 'all 0.2s',
  },
  chartWrap: {
    marginTop: 12,
    background: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    padding: '12px 14px',
    border: '1px solid rgba(200,220,240,0.6)',
  },
  chartTitle: {
    margin: '0 0 10px',
    fontSize: 13,
    fontWeight: 600,
    color: '#1e293b',
  },
};