const express = require('express');
const router = express.Router();
const Database = require('better-sqlite3');
const path = require('path');

const GROQ_API_KEY = 'YOUR_GROQ_API_KEY';

const db = new Database(path.join(__dirname, 'database.db'), { readonly: true });
console.log('✅ SQLite database connected');

const BASE_SYSTEM = `You are an expert AI assistant for Maklada Eljem, a steel manufacturing company in Tunisia.
You analyze real maintenance data from their Dynamics AX 2012 system (2020–2025).

DATABASE STRUCTURE:
- bons_de_travail: work orders — fields: NU__BT, SERVICE, DATE_DEM, DEMANDE, NU_MACHINE, REF_TRAV, DATE_CORRIGEE, TYPE_TRAVAIL, SERVICE_LABEL, ANNEE, MOIS, MOIS_NOM, TRIMESTRE
- sorties_pieces: spare parts exits — fields: CODE_ART, DESIG_ART, NU__BT, CENT_CHARG, PRIX_UNIT, Q_SORT, DATE_SORT, EMPLACT, MOUVEMENT, COUT_TOTAL, PRIX_MANQUANT, ANNEE, MOIS, MOIS_NOM, TRIMESTRE

STRICT RULES:
- ONLY answer about the company data provided to you
- NEVER talk about world news, sports, politics, or anything outside the data
- Answer in the SAME language the user writes in (French or English)
- Use EXACT numbers from the data — never estimate or invent
- Format numbers clearly (spaces for thousands, 2 decimals for costs)
- Currency is ALWAYS Tunisian Dinar — write DT or TND — NEVER euros
- If no data found, say so clearly
- Be precise and professional
- The data given to you is already fully calculated from ALL records — trust it completely`;

function generateSQL(question) {
  //detecte key words
  const q = question.toLowerCase();

  // BT number
  const btPatterns = [
    /(?:bt|bon|n[°#]?|num[eé]ro?)\s*[:#\-]?\s*(\d{4,6})/i,
    /\b(\d{5,6})\b/,
  ];
  for (const pat of btPatterns) {
    const m = q.match(pat);
    if (m) {
      const num = parseInt(m[1]);
      //check in exists in the database 
      const exists = db.prepare('SELECT 1 FROM bons_de_travail WHERE NU__BT = ? LIMIT 1').get(num);
      if (exists) {
        return {
          label: 'bt_detail',
          queries: [
            { name: 'work_order',  sql: `SELECT * FROM bons_de_travail WHERE NU__BT = ?`, params: [num] },
            { name: 'spare_parts', sql: `SELECT * FROM sorties_pieces WHERE NU__BT = ?`,  params: [num] }
          ]
        };
      }
    }
  }

  //Specific date
  //function to check two diff ways 
  const dp1 = q.match(/(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/);
  const dp2 = q.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/);
  let dateStr = null;
  //turn the date to the right way of the date so the sqlite can read it 
  if (dp1) dateStr = `${dp1[1]}-${String(dp1[2]).padStart(2,'0')}-${String(dp1[3]).padStart(2,'0')}`;
  else if (dp2) dateStr = `${dp2[3]}-${String(dp2[2]).padStart(2,'0')}-${String(dp2[1]).padStart(2,'0')}`;
  if (dateStr) {
    return {
      label: 'date_detail',
      queries: [{
        name: 'work_orders_on_date',
        sql: `SELECT NU__BT, NU_MACHINE, TYPE_TRAVAIL, SERVICE_LABEL, DEMANDE
              FROM bons_de_travail WHERE DATE_DEM LIKE ? LIMIT 50`,
        params: [`${dateStr}%`]
      }]
    };
  }

  //Machine number
  const machPatterns = [
    //does a double verifaction with num and words
    /machine\s*[n°#:]?\s*(\d{2,4})/i,
    /m[- ]?(\d{3,4})\b/i,
    /\b(\d{1,4})\b/,
  ];
  for (const pat of machPatterns) {
    const m = q.match(pat);
    if (m && (
      q.includes('machine')    || q.includes('équipement') || q.includes('equipment') ||
      q.includes('engin')      || q.includes('about')      || q.includes('sur')  ||
      q.includes('pour')       || q.includes('tell me')    || q.includes('show me') ||
      q.includes('historique') || q.includes('history')    || q.includes('donne') ||
      q.includes('voir')       || q.includes('analyse')    || q.includes('analyze') ||
      q.includes('detail')     || q.includes('détail')     || q.includes('info')
    )) {
      const num = parseInt(m[1]);
      const exists = db.prepare('SELECT 1 FROM bons_de_travail WHERE NU_MACHINE = ? LIMIT 1').get(num);
      if (exists) {
        return {
          label: 'machine_profile',
          machineNum: num,
          queries: [
            {
              // COUNT(*) from bons_de_travail only 
              name: 'machine_summary',
              sql: `SELECT
                      COUNT(*) as total_bt,
                      SUM(CASE WHEN TYPE_TRAVAIL = 'Dépannage'    THEN 1 ELSE 0 END) as depannages,
                      SUM(CASE WHEN TYPE_TRAVAIL = 'Préventif'    THEN 1 ELSE 0 END) as preventifs,
                      SUM(CASE WHEN TYPE_TRAVAIL = 'Amélioration' THEN 1 ELSE 0 END) as ameliorations,
                      MIN(DATE_DEM) as premiere_intervention,
                      MAX(DATE_DEM) as derniere_intervention
                    FROM bons_de_travail
                    WHERE NU_MACHINE = ?`,
              params: [num]
            },
            {
              // Per year from bons_de_travail only
              name: 'par_annee',
              sql: `SELECT
                      ANNEE,
                      COUNT(*) as total,
                      SUM(CASE WHEN TYPE_TRAVAIL = 'Dépannage'    THEN 1 ELSE 0 END) as depannages,
                      SUM(CASE WHEN TYPE_TRAVAIL = 'Préventif'    THEN 1 ELSE 0 END) as preventifs,
                      SUM(CASE WHEN TYPE_TRAVAIL = 'Amélioration' THEN 1 ELSE 0 END) as ameliorations
                    FROM bons_de_travail
                    WHERE NU_MACHINE = ?
                    GROUP BY ANNEE ORDER BY ANNEE`,
              params: [num]
            },
            {
              // Per month from bons_de_travail only
              name: 'par_mois',
              sql: `SELECT
                      ANNEE, MOIS, MOIS_NOM,
                      COUNT(*) as total,
                      SUM(CASE WHEN TYPE_TRAVAIL = 'Dépannage' THEN 1 ELSE 0 END) as depannages,
                      SUM(CASE WHEN TYPE_TRAVAIL = 'Préventif' THEN 1 ELSE 0 END) as preventifs
                    FROM bons_de_travail
                    WHERE NU_MACHINE = ?
                    GROUP BY ANNEE, MOIS ORDER BY ANNEE, MOIS`,
              params: [num]
            },
            {
              // Spare parts cost — from sorties_pieces joined to get machine filter
              // Using subquery to avoid row duplication
              name: 'pieces_detachees',
              sql: `SELECT
                      s.DESIG_ART,
                      COUNT(*) as utilisations,
                      SUM(s.Q_SORT) as quantite_totale,
                      ROUND(SUM(s.COUT_TOTAL), 2) as cout_total_dt
                    FROM sorties_pieces s
                    WHERE s.NU__BT IN (
                      SELECT NU__BT FROM bons_de_travail WHERE NU_MACHINE = ?
                    )
                    GROUP BY s.DESIG_ART
                    ORDER BY cout_total_dt DESC LIMIT 15`,
              params: [num]
            },
            {
              // Total spare parts cost subquery
              name: 'cout_total',
              sql: `SELECT
                      ROUND(SUM(s.COUT_TOTAL), 2) as cout_total_dt,
                      COUNT(*) as nb_sorties_pieces
                    FROM sorties_pieces s
                    WHERE s.NU__BT IN (
                      SELECT NU__BT FROM bons_de_travail WHERE NU_MACHINE = ?
                    )`,
              params: [num]
            },
            {
              // Rank from bons_de_travail only
              name: 'rang_global',
              sql: `SELECT COUNT(*) + 1 as rang FROM (
                      SELECT NU_MACHINE, COUNT(*) as bts
                      FROM bons_de_travail
                      WHERE NU_MACHINE IS NOT NULL
                      GROUP BY NU_MACHINE
                    ) WHERE bts > (
                      SELECT COUNT(*) FROM bons_de_travail WHERE NU_MACHINE = ?
                    )`,
              params: [num]
            }
          ]
        };
      }
    }
  }

  // Top machines by breakdown count
  //detection of key words
  if ((q.includes('top') || q.includes('plus') || q.includes('most') || q.includes('worst') || q.includes('premier')) &&
      (q.includes('machine') || q.includes('panne') || q.includes('breakdown') || q.includes('reparation') || q.includes('réparation'))) {
    const limitMatch = q.match(/top\s*(\d+)/i) || q.match(/(\d+)\s*(machine|premier)/i);
    //the limit is 10
    const limit = limitMatch ? parseInt(limitMatch[1]) : 10;
    return {
      label: 'top_machines',
      queries: [{
        name: 'top_machines',
        sql: `SELECT
                b.NU_MACHINE,
                COUNT(*) as total_bt,
                SUM(CASE WHEN b.TYPE_TRAVAIL = 'Dépannage'    THEN 1 ELSE 0 END) as depannages,
                SUM(CASE WHEN b.TYPE_TRAVAIL = 'Préventif'    THEN 1 ELSE 0 END) as preventifs,
                SUM(CASE WHEN b.TYPE_TRAVAIL = 'Amélioration' THEN 1 ELSE 0 END) as ameliorations,
                (
                  SELECT ROUND(SUM(s.COUT_TOTAL), 2)
                  FROM sorties_pieces s
                  WHERE s.NU__BT IN (
                    SELECT NU__BT FROM bons_de_travail WHERE NU_MACHINE = b.NU_MACHINE
                  )
                ) as cout_total_dt
              FROM bons_de_travail b
              GROUP BY b.NU_MACHINE
              ORDER BY total_bt DESC
              LIMIT ?`,
        params: [limit]
      }]
    };
  }

  // Top machines by cost
  if ((q.includes('top') || q.includes('plus') || q.includes('most') || q.includes('cher') || q.includes('expensive') || q.includes('coûteux')) &&
      (q.includes('cost') || q.includes('cout') || q.includes('coût') || q.includes('prix') || q.includes('budget'))) {
    const limitMatch = q.match(/top\s*(\d+)/i);
    //limit 10
    const limit = limitMatch ? parseInt(limitMatch[1]) : 10;
    return {
      label: 'top_machines_cost',
      queries: [{
        name: 'top_machines_cout',
        sql: `SELECT
                b.NU_MACHINE,
                COUNT(*) as total_bt,
                (
                  SELECT ROUND(SUM(s.COUT_TOTAL), 2)
                  FROM sorties_pieces s
                  WHERE s.NU__BT IN (
                    SELECT NU__BT FROM bons_de_travail WHERE NU_MACHINE = b.NU_MACHINE
                  )
                ) as cout_total_dt
              FROM bons_de_travail b
              GROUP BY b.NU_MACHINE
              ORDER BY cout_total_dt DESC
              LIMIT ?`,
        params: [limit]
      }]
    };
  }

  // Top spare parts 
  if ((q.includes('top') || q.includes('plus') || q.includes('most')) &&
      (q.includes('piece') || q.includes('pièce') || q.includes('part') || q.includes('article') || q.includes('spare'))) {
    const limitMatch = q.match(/top\s*(\d+)/i);
    const limit = limitMatch ? parseInt(limitMatch[1]) : 10;
    return {
      label: 'top_pieces',
      queries: [{
        name: 'top_pieces',
        sql: `SELECT
                DESIG_ART, CODE_ART,
                COUNT(*) as utilisations,
                SUM(Q_SORT) as quantite_totale,
                ROUND(SUM(COUT_TOTAL), 2) as cout_total_dt,
                ROUND(AVG(PRIX_UNIT), 2) as prix_moyen
              FROM sorties_pieces
              WHERE MOUVEMENT = 'Sortie'
              GROUP BY CODE_ART, DESIG_ART
              ORDER BY utilisations DESC
              LIMIT ?`,
        params: [limit]
      }]
    };
  }

  //Preventive vs corrective
  if (q.includes('preventif') || q.includes('préventif') || q.includes('preventive') ||
      q.includes('correctif') || q.includes('corrective') ||
      (q.includes('compare') && q.includes('type'))) {
    return {
      label: 'preventif_vs_correctif',
      queries: [{
        name: 'preventif_vs_correctif',
        sql: `SELECT
                ANNEE,
                COUNT(*) as total_bt,
                SUM(CASE WHEN TYPE_TRAVAIL = 'Dépannage'    THEN 1 ELSE 0 END) as depannages,
                SUM(CASE WHEN TYPE_TRAVAIL = 'Préventif'    THEN 1 ELSE 0 END) as preventifs,
                SUM(CASE WHEN TYPE_TRAVAIL = 'Amélioration' THEN 1 ELSE 0 END) as ameliorations,
                ROUND(100.0 * SUM(CASE WHEN TYPE_TRAVAIL = 'Dépannage' THEN 1 ELSE 0 END) / COUNT(*), 1) as pct_depannage,
                ROUND(100.0 * SUM(CASE WHEN TYPE_TRAVAIL = 'Préventif' THEN 1 ELSE 0 END) / COUNT(*), 1) as pct_preventif
              FROM bons_de_travail
              GROUP BY ANNEE ORDER BY ANNEE`,
        params: []
      }]
    };
  }

  //Monthly patterns
  if (q.includes('mois') || q.includes('month') || q.includes('saisonn') ||
      q.includes('seasonal') || q.includes('pattern') || q.includes('tendance') || q.includes('trend')) {
    return {
      label: 'monthly_patterns',
      queries: [{
        name: 'par_mois_global',
        sql: `SELECT
                MOIS, MOIS_NOM,
                COUNT(*) as total_bt,
                SUM(CASE WHEN TYPE_TRAVAIL = 'Dépannage' THEN 1 ELSE 0 END) as depannages,
                SUM(CASE WHEN TYPE_TRAVAIL = 'Préventif' THEN 1 ELSE 0 END) as preventifs
              FROM bons_de_travail
              GROUP BY MOIS, MOIS_NOM ORDER BY MOIS`,
        params: []
      }]
    };
  }

  //Predictions
  if (q.includes('predict') || q.includes('prédiction') || q.includes('prediction') ||
      q.includes('forecast') || q.includes('prévision') || q.includes('next') ||
      q.includes('prochain') || q.includes('future') || q.includes('futur') ||
      q.includes('will') || q.includes('expect') || q.includes('anticipat')) {
    return {
      label: 'predictions',
      queries: [
        {
          // Yearly trend BT count from bons_de_travail
          name: 'tendance_annuelle',
          sql: `SELECT
                  ANNEE,
                  COUNT(*) as total_bt,
                  SUM(CASE WHEN TYPE_TRAVAIL = 'Dépannage' THEN 1 ELSE 0 END) as depannages,
                  SUM(CASE WHEN TYPE_TRAVAIL = 'Préventif' THEN 1 ELSE 0 END) as preventifs,
                  (
                    SELECT ROUND(SUM(COUT_TOTAL), 2)
                    FROM sorties_pieces
                    WHERE ANNEE = b.ANNEE
                  ) as cout_total_dt
                FROM bons_de_travail b
                GROUP BY ANNEE ORDER BY ANNEE`,
          params: []
        },
        {
          name: 'machines_a_risque',
          sql: `SELECT
                  NU_MACHINE,
                  COUNT(*) as total_bt,
                  MAX(DATE_DEM) as derniere_intervention,
                  SUM(CASE WHEN TYPE_TRAVAIL = 'Dépannage' THEN 1 ELSE 0 END) as depannages
                FROM bons_de_travail
                GROUP BY NU_MACHINE
                ORDER BY depannages DESC LIMIT 10`,
          params: []
        }
      ]
    };
  }

  //Specific year
  const yearMatch = q.match(/\b(202[0-9])\b/);
  if (yearMatch) {
    const year = parseInt(yearMatch[1]);
    return {
      label: 'year_stats',
      year,
      queries: [
        {
          // Monthly breakdown BT count from bons_de_travail
          name: 'annee_par_mois',
          sql: `SELECT
                  b.MOIS, b.MOIS_NOM,
                  COUNT(*) as total_bt,
                  SUM(CASE WHEN b.TYPE_TRAVAIL = 'Dépannage' THEN 1 ELSE 0 END) as depannages,
                  SUM(CASE WHEN b.TYPE_TRAVAIL = 'Préventif' THEN 1 ELSE 0 END) as preventifs,
                  (
                    SELECT ROUND(SUM(COUT_TOTAL), 2)
                    FROM sorties_pieces
                    WHERE ANNEE = ? AND MOIS = b.MOIS
                  ) as cout_dt
                FROM bons_de_travail b
                WHERE b.ANNEE = ?
                GROUP BY b.MOIS, b.MOIS_NOM
                ORDER BY b.MOIS`,
          params: [year, year]
        },
        {
          name: 'annee_par_type',
          sql: `SELECT TYPE_TRAVAIL, COUNT(*) as total
                FROM bons_de_travail
                WHERE ANNEE = ?
                GROUP BY TYPE_TRAVAIL ORDER BY total DESC`,
          params: [year]
        },
        {
          name: 'annee_top_machines',
          sql: `SELECT NU_MACHINE, COUNT(*) as total_bt
                FROM bons_de_travail
                WHERE ANNEE = ?
                GROUP BY NU_MACHINE ORDER BY total_bt DESC LIMIT 10`,
          params: [year]
        },
        {
          name: 'annee_cout_total',
          sql: `SELECT ROUND(SUM(COUT_TOTAL), 2) as cout_total_dt
                FROM sorties_pieces WHERE ANNEE = ?`,
          params: [year]
        }
      ]
    };
  }

  //Global default
  return {
    label: 'global_stats',
    queries: [
      {
        //All counts from bons_de_travail
        name: 'stats_globales',
        sql: `SELECT
                (SELECT COUNT(*) FROM bons_de_travail) as total_bt,
                (SELECT COUNT(*) FROM sorties_pieces) as total_pieces,
                (SELECT COUNT(DISTINCT NU_MACHINE) FROM bons_de_travail) as total_machines,
                (SELECT COUNT(DISTINCT CODE_ART) FROM sorties_pieces) as total_articles,
                (SELECT ROUND(SUM(COUT_TOTAL), 2) FROM sorties_pieces) as cout_total_dt,
                (SELECT MIN(DATE_DEM) FROM bons_de_travail) as date_debut,
                (SELECT MAX(DATE_DEM) FROM bons_de_travail) as date_fin,
                (SELECT COUNT(*) FROM bons_de_travail WHERE TYPE_TRAVAIL = 'Dépannage') as total_depannages,
                (SELECT COUNT(*) FROM bons_de_travail WHERE TYPE_TRAVAIL = 'Préventif') as total_preventifs`,
        params: []
      },
      {
        // Yearly breakdown — bons_de_travail only
        name: 'par_annee',
        sql: `SELECT
                ANNEE,
                COUNT(*) as total_bt,
                SUM(CASE WHEN TYPE_TRAVAIL = 'Dépannage' THEN 1 ELSE 0 END) as depannages,
                SUM(CASE WHEN TYPE_TRAVAIL = 'Préventif' THEN 1 ELSE 0 END) as preventifs
              FROM bons_de_travail
              GROUP BY ANNEE ORDER BY ANNEE`,
        params: []
      },
      {
        // Top 10 bons_de_travail only
        name: 'top_10_machines',
        sql: `SELECT
                NU_MACHINE,
                COUNT(*) as total_bt,
                SUM(CASE WHEN TYPE_TRAVAIL = 'Dépannage' THEN 1 ELSE 0 END) as depannages,
                (
                  SELECT ROUND(SUM(s.COUT_TOTAL), 2)
                  FROM sorties_pieces s
                  WHERE s.NU__BT IN (
                    SELECT NU__BT FROM bons_de_travail WHERE NU_MACHINE = b.NU_MACHINE
                  )
                ) as cout_dt
              FROM bons_de_travail b
              GROUP BY NU_MACHINE
              ORDER BY total_bt DESC LIMIT 10`,
        params: []
      }
    ]
  };
}

router.post('/chat', async (req, res) => {
  const { messages, username } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ message: 'Messages required' });
  }

  const lastUserMsg = messages.filter(m => m.role === 'user').pop();
  const question = lastUserMsg?.content || '';
  const user = username || 'user';

  console.log(`💬 [${user}] "${question}"`);

  //call the generate sql functions with lable requet machinenum year
  const { label, queries, machineNum, year } = generateSQL(question);
  const results = {};
  for (const q of queries) {
    //exucte the requet in sqlite
    try {
      results[q.name] = db.prepare(q.sql).all(...q.params);
    } catch (err) {
      console.error(`❌ SQL error in ${q.name}:`, err.message);
      results[q.name] = [];
    }
  }

  const totalRows = Object.values(results).reduce((s, r) => s + r.length, 0);
  console.log(`📊 "${label}" → ${totalRows} rows`);
//build message for llama
  const systemPrompt = `${BASE_SYSTEM}\n\nYou are talking to: ${user}`;
  const dataMessage  = `=== DONNÉES RÉELLES DE LA BASE DE DONNÉES ===
Query type: ${label}
${JSON.stringify(results, null, 2)}
=== FIN DES DONNÉES ===

Utilisateur: ${user}
Question: ${question}`;

//send messege to llama to generate intelligent anwser
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.slice(-4, -1),
          { role: 'user', content: dataMessage }
        ],
        temperature: 0.05,
        max_tokens: 1500,
      })
    });

    //send to frontend 
    const data = await response.json();
    if (!response.ok) {
      console.error('❌ Groq error:', data.error?.message);
      return res.status(response.status).json({ message: data.error?.message || 'Groq error' });
    }

    const reply = data.choices[0].message.content;
    console.log(`✅ Reply sent (${reply.length} chars)`);

    res.json({
      reply,
      queryLabel: label,
      machineNum: machineNum || null,
      year:       year       || null,
      chartData:  results
    });

  } catch (err) {
    console.error('❌ Server error:', err.message);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

module.exports = router;