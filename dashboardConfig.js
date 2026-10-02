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
    embedUrl: 'https://app.powerbi.com/view?r=eyJrIjoiYjUzZDlhZDQtODc5Yi00YjFhLTkwMmUtNzJhNWQ5YjNiNmUxIiwidCI6ImRiZDY2NjRkLTRlYjktNDZlYi05OWQ4LTVjNDNiYTE1M2M2MSIsImMiOjl9&pageName=7f50862e66a6d1e8cfb3', // ← PASTE YOUR FINANCIAL DASHBOARD URL HERE
  },
  {
    id: 'technical',
    icon: '⬡',
    labelKey: 'sidebar.technical',
    embedUrl: 'https://app.powerbi.com/view?r=eyJrIjoiNDcxNDA2NzUtMzBlYy00OTRiLThiYmItZWQ1ODVjYWFjYjIwIiwidCI6ImRiZDY2NjRkLTRlYjktNDZlYi05OWQ4LTVjNDNiYTE1M2M2MSIsImMiOjl9&pageName=5d5c9833d5f018b6b64a', // ← PASTE YOUR TECHNICAL DASHBOARD URL HERE
  },
  {
    id: 'ai',
    icon: '◎',
    labelKey: 'sidebar.ai',
    embedUrl: 'https://app.powerbi.com/view?r=eyJrIjoiZDMzYjIzMzAtMGUwMS00YTIzLThkZGMtMjBkNmY1ZjBiNjJkIiwidCI6ImRiZDY2NjRkLTRlYjktNDZlYi05OWQ4LTVjNDNiYTE1M2M2MSIsImMiOjl9&pageName=43be3b2d89c89e8d8aa4', // ← PASTE YOUR AI ANALYSIS DASHBOARD URL HERE
  },
];

export default DASHBOARDS;
