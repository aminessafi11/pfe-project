// ─────────────────────────────────────────────────────────────────────────────
// POWER BI DASHBOARD CONFIGURATION
// Replace each embedUrl with your actual Power BI Service embed URL.
//
// How to get the URL:
//   1. Open your report on app.powerbi.com
//   2. File → Embed report → Website or portal
//   3. Copy the `src` value from the generated <iframe> tag
// ─────────────────────────────────────────────────────────────────────────────

const DASHBOARDS = [
  {
    id: 'financial',
    icon: '◈',
    labelKey: 'sidebar.financial',
    embedUrl: '............', // ← PASTE YOUR FINANCIAL DASHBOARD URL HERE
  },
  {
    id: 'technical',
    icon: '⬡',
    labelKey: 'sidebar.technical',
    embedUrl: '.........................', // ← PASTE YOUR TECHNICAL DASHBOARD URL HERE
  },
  {
    id: 'ai',
    icon: '◎',
    labelKey: 'sidebar.ai',
    embedUrl: '.....................', // ← PASTE YOUR AI ANALYSIS DASHBOARD URL HERE
  },
];

export default DASHBOARDS;
