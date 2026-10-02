import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, ReferenceLine, Cell, LabelList, Legend,
} from 'recharts';
import './AnalyticsPage.css';

const NAVY   = '#1E2D4A';
const STEEL  = '#5B9BD5';
const RED    = '#D64045';
const ORANGE = '#E07B3A';
const MUTED  = '#6B7FA3';
const GREEN  = '#2E7D52';
const YELLOW = '#E8B84B';
const PURPLE = '#7B5EA7';

// ─── HW Machine bar data (PDF page 1) ────────────────────────────────────────
const hwBarData = [
  { machine:'Machine 620', y2025:117845, y2026:191785 },
  { machine:'Machine 790', y2025: 67127, y2026: 82896 },
  { machine:'Machine 640', y2025: 24038, y2026: 40302 },
  { machine:'Machine 770', y2025: 32611, y2026: 66767 },
  { machine:'Machine 990', y2025: 39284, y2026: 27957 },
];
// ─── LR Machine bar data (PDF page 2) ────────────────────────────────────────
const lrBarData = [
  { machine:'Machine 620', y2025:113987, y2026:173736 },
  { machine:'Machine 790', y2025: 69361, y2026: 81448 },
  { machine:'Machine 640', y2025: 19311, y2026: 32006 },
  { machine:'Machine 770', y2025: 26059, y2026: 53835 },
  { machine:'Machine 990', y2025: 41222, y2026: 55308 },
];
const hwMachineForecast = {
  '620':{ full2025:117845, full2026:191785, pct:62.7,  dir:'increase', slope:null },
  '790':{ full2025: 67127, full2026: 82896, pct:23.5,  dir:'increase', slope:null },
  '640':{ full2025: 24038, full2026: 40302, pct:67.7,  dir:'increase', slope:null },
  '770':{ full2025: 32611, full2026: 66767, pct:104.7, dir:'increase', slope:null },
  '990':{ full2025: 39284, full2026: 27957, pct:28.8,  dir:'decrease', slope:null },
};
const lrMachineForecast = {
  '620':{ full2025:113987, full2026:173736, pct:52.4,  dir:'increase', slope:1420 },
  '790':{ full2025: 69361, full2026: 81448, pct:17.4,  dir:'increase', slope: 541 },
  '640':{ full2025: 19311, full2026: 32006, pct:65.7,  dir:'increase', slope:-285 },
  '770':{ full2025: 26059, full2026: 53835, pct:106.6, dir:'increase', slope: 143 },
  '990':{ full2025: 41222, full2026: 55308, pct:34.2,  dir:'increase', slope: 208 },
};

// ─── Parts Consumption ────────────────────────────────────────────────────────
const hwPartsBar = [
  { machine:'Machine 790', y2025:58383, y2026:82035 },
  { machine:'Machine 990', y2025: 2735, y2026: 3252 },
  { machine:'Machine 620', y2025: 1833, y2026: 2126 },
  { machine:'Machine 650', y2025: 2082, y2026: 1816 },
  { machine:'Machine 730', y2025:    0, y2026:   27 },
];
const lrPartsBar = [
  { machine:'Machine 790', y2025:45740, y2026:51035 },
  { machine:'Machine 990', y2025: 1800, y2026: 3416 },
  { machine:'Machine 620', y2025: 1754, y2026: 2210 },
  { machine:'Machine 650', y2025:   25, y2026:    0 },
  { machine:'Machine 730', y2025:    0, y2026:    0 },
];

// ─── Total factory ────────────────────────────────────────────────────────────
const totalFactoryData = [
  {period:'Q1 2020',cost: 99000,type:'reel'},{period:'Q2 2020',cost:134000,type:'reel'},
  {period:'Q3 2020',cost:148000,type:'reel'},{period:'Q4 2020',cost:163000,type:'reel'},
  {period:'Q1 2021',cost:300000,type:'reel'},{period:'Q2 2021',cost:148000,type:'reel'},
  {period:'Q3 2021',cost:270000,type:'reel'},{period:'Q4 2021',cost:285000,type:'reel'},
  {period:'Q1 2022',cost:457592,type:'reel'},{period:'Q2 2022',cost:210000,type:'reel'},
  {period:'Q3 2022',cost:162000,type:'reel'},{period:'Q4 2022',cost:202000,type:'reel'},
  {period:'Q1 2023',cost:150000,type:'reel'},{period:'Q2 2023',cost:115000,type:'reel'},
  {period:'Q3 2023',cost:149000,type:'reel'},{period:'Q4 2023',cost:145000,type:'reel'},
  {period:'Q1 2024',cost:130000,type:'reel'},{period:'Q2 2024',cost:341351,type:'reel'},
  {period:'Q3 2024',cost:370000,type:'reel'},{period:'Q4 2024',cost:250000,type:'reel'},
  {period:'Q1 2025',cost:181374,type:'reel'},{period:'Q2 2025',cost:265347,type:'reel'},
  {period:'Q3 2025',cost:232860,type:'hw'  },{period:'Q4 2025',cost:250269,type:'hw'  },
  {period:'Q1 2026',cost:284023,type:'hw'  },{period:'Q2 2026',cost:239394,type:'hw'  },
  {period:'Q3 2026',cost:242253,type:'hw'  },{period:'Q4 2026',cost:259662,type:'hw'  },
];
const lrTotalData = totalFactoryData.map(d=>({
  ...d,
  cost: d.type==='reel'?d.cost
      : d.period==='Q3 2025'?238020:d.period==='Q4 2025'?239066
      : d.period==='Q1 2026'?240112:d.period==='Q2 2026'?241158
      : d.period==='Q3 2026'?242203:d.period==='Q4 2026'?243249:d.cost,
  type: d.type==='hw'?'lr':d.type,
}));
const hwQuarterly=[
  {q:'Q1',y2025:181374,y2026:284023,pct:56.6},
  {q:'Q2',y2025:265347,y2026:239394,pct: 9.8},
  {q:'Q3',y2025:232860,y2026:242253,pct: 4.0},
  {q:'Q4',y2025:250269,y2026:259662,pct: 3.8},
];
const lrQuarterly=[
  {q:'Q1',y2025:181374,y2026:240112,pct:32.4},
  {q:'Q2',y2025:265347,y2026:241158,pct: 9.1},
  {q:'Q3',y2025:238020,y2026:242203,pct: 1.8},
  {q:'Q4',y2025:239066,y2026:243249,pct: 1.7},
];

// ─── Phantom ──────────────────────────────────────────────────────────────────
const phantomYearData=[
  {year:'2020',normal:390294, phantom:392976,pct:50.2},
  {year:'2021',normal:683112, phantom:295632,pct:30.2},
  {year:'2022',normal:1263405,phantom: 72172,pct: 5.4},
  {year:'2023',normal: 566044,phantom: 74456,pct:11.6},
  {year:'2024',normal:1052208,phantom: 68243,pct: 6.1},
  {year:'2025',normal: 141992,phantom:310549,pct:68.6},
];
const phantomArticles=[
  {code:'29260001',name:'FILTRE ANTI HARMONIQUE ACTIF',    cost:123814,exits: 1,date:'28/01/2020',               p:'HIGH'  },
  {code:'28221013',name:'VARIAT.FREQ.6SE7027-2TD61Z',      cost: 91540,exits: 2,date:'12/01/2021 → 18/06/2025', p:'HIGH'  },
  {code:'29260002',name:'FILTRE ANTI HARMONIQUE ACTIF',    cost: 57969,exits: 1,date:'28/01/2020',               p:'HIGH'  },
  {code:'X0013478',name:'TRAVEAUX DE PEINTURE DIVERS',     cost: 42385,exits: 1,date:'31/03/2021',               p:'MEDIUM'},
  {code:'X0013496',name:'TRVX DE PEINTURE USINE MKL SA',  cost: 37364,exits: 1,date:'17/06/2021',               p:'MEDIUM'},
  {code:'X0013464',name:'FOURNT.POSE BACHE EAU CHAUDIER', cost: 36000,exits: 1,date:'30/09/2020',               p:'MEDIUM'},
  {code:'X0013892',name:'TRVX.FOURNIT.POSE PLACO ADMINI', cost: 29956,exits: 1,date:'16/12/2022',               p:'MEDIUM'},
  {code:'X0013501',name:'FOURNIT.ET POSE MENUIS.ALU ADM', cost: 27871,exits: 1,date:'30/06/2021',               p:'MEDIUM'},
  {code:'2162002', name:'HUILE SYNTH.SHELL CORENA AS46',  cost: 26467,exits:33,date:'04/03/2020 → 23/02/2026', p:'LOW'   },
  {code:'401002',  name:'ECHAFFODAGE MOBILE H.11M-500KG', cost: 24900,exits: 1,date:'29/05/2024',               p:'LOW'   },
  {code:'15113805',name:'POMPE CENTRIFUGE 22KW 144 M3/H', cost: 24044,exits: 2,date:'15/07/2025 → 09/02/2026', p:'LOW'   },
  {code:'65014002',name:'RESISTANCE D5/D40 25KW-4.9OHM',  cost: 23710,exits: 4,date:'06/02/2025 → 15/12/2025', p:'LOW'   },
  {code:'15114007',name:'ELE.PPE 130M3/H 35m 22KW LOT11', cost: 23493,exits: 1,date:'28/08/2025',               p:'LOW'   },
  {code:'X0014589',name:'AADAPTATION CIRCUIT VAPEUR TRI',  cost: 18526,exits: 1,date:'28/10/2025',               p:'LOW'   },
  {code:'29130004',name:'CONDENSATEUR 400V 500uF 10KHz',   cost: 17781,exits: 2,date:'16/07/2025 → 16/07/2025', p:'LOW'   },
];

// ─── Machine Risk ─────────────────────────────────────────────────────────────
const machineRiskData=[
  {machine:'Machine 720',score:66.4,breakdowns:852,cost:196639, risk:'HIGH'  },
  {machine:'Machine 790',score:64.7,breakdowns:667,cost:359342, risk:'HIGH'  },
  {machine:'Machine 620',score:62.4,breakdowns:344,cost:557952, risk:'HIGH'  },
  {machine:'Machine 640',score:55.3,breakdowns:580,cost:270853, risk:'MEDIUM'},
  {machine:'Machine 990',score:54.9,breakdowns:608,cost:248447, risk:'MEDIUM'},
  {machine:'Machine 691',score:48.2,breakdowns:633,cost:110335, risk:'MEDIUM'},
  {machine:'Machine 810',score:45.6,breakdowns:471,cost:210464, risk:'MEDIUM'},
  {machine:'Machine 650',score:44.1,breakdowns:279,cost:232490, risk:'MEDIUM'},
  {machine:'Machine 692',score:41.0,breakdowns:516,cost: 84782, risk:'MEDIUM'},
  {machine:'Machine 770',score:40.8,breakdowns:350,cost:248917, risk:'MEDIUM'},
  {machine:'Machine 696',score:39.7,breakdowns:360,cost:102029, risk:'MEDIUM'},
  {machine:'Machine 630',score:37.4,breakdowns:205,cost:118975, risk:'MEDIUM'},
  {machine:'Machine 682',score:35.6,breakdowns:388,cost: 79238, risk:'MEDIUM'},
  {machine:'Machine 821',score:32.4,breakdowns:381,cost:104140, risk:'MEDIUM'},
  {machine:'Machine 710',score:30.2,breakdowns:305,cost: 78562, risk:'MEDIUM'},
  {machine:'Machine 683',score:30.1,breakdowns:155,cost:152269, risk:'MEDIUM'},
  {machine:'Machine 633',score:30.0,breakdowns:265,cost:135068, risk:'LOW'   },
  {machine:'Machine 697',score:29.7,breakdowns:119,cost: 54298, risk:'LOW'   },
  {machine:'Machine 695',score:29.5,breakdowns:280,cost: 91796, risk:'LOW'   },
  {machine:'Machine 621',score:24.5,breakdowns:230,cost: 35165, risk:'LOW'   },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getRiskColor(r){ return r==='HIGH'?RED:r==='MEDIUM'?ORANGE:GREEN; }
function getPColor(p)   { return p==='HIGH'?RED:p==='MEDIUM'?ORANGE:STEEL; }

function ChartCard({title,subtitle,badge,badgeColor,children,note,mlNote}){
  return(
    <div className="analytics__card">
      <div className="analytics__card-header">
        <div>
          <h2 className="analytics__card-title">{title}</h2>
          <p className="analytics__card-sub">{subtitle}</p>
        </div>
        {badge&&<span className="analytics__badge" style={{
          background:`${badgeColor}18`,color:badgeColor,border:`1px solid ${badgeColor}40`
        }}>{badge}</span>}
      </div>
      {children}
      {(note||mlNote)&&(
        <div className="analytics__conclusion" style={{marginTop:12}}>
          {note&&<div>{note}</div>}
          {mlNote&&<div style={{marginTop:note?8:0,paddingTop:note?8:0,
            borderTop:note?'1px solid rgba(255,255,255,0.15)':'none',
            color:'rgba(255,255,255,0.85)',fontSize:11.5}}>🧠 {mlNote}</div>}
        </div>
      )}
    </div>
  );
}
const T=({children})=><div className="analytics__tooltip">{children}</div>;

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function AnalyticsPage(){
  const {t}=useTranslation();
  const [selMachine,   setSelMachine  ]=useState('620');
  const [forecastAlgo, setForecastAlgo]=useState('HW');
  const [partsAlgo,    setPartsAlgo   ]=useState('HW');
  const [totalAlgo,    setTotalAlgo   ]=useState('HW');
  const machines=['620','790','640','770','990'];

  const macForecast  = forecastAlgo==='HW'?hwMachineForecast:lrMachineForecast;
  const selF         = macForecast[selMachine];
  const totalData    = totalAlgo==='HW'?totalFactoryData:lrTotalData;
  const quarterlyData= totalAlgo==='HW'?hwQuarterly:lrQuarterly;
  const partsData    = partsAlgo==='HW'?hwPartsBar:lrPartsBar;

  return(
    <div className="analytics">

      {/* ── HEADER ── */}
      <div className="analytics__header">
        <div>
          <h1 className="analytics__title">{t('analytics.title')}</h1>
          <p className="analytics__subtitle">{t('analytics.subtitle')}</p>
        </div>
        <div className="analytics__stats">
          {[
            {v:'9,488',l:t('analytics.totalBT'),   c:STEEL },
            {v:'36',   l:t('analytics.anomalies'), c:RED   },
            {v:'7,031',l:t('analytics.unlinked'),  c:ORANGE},
            {v:'4 ML', l:t('analytics.algorithms'),c:GREEN },
          ].map(s=>(
            <div key={s.l} className="analytics__stat">
              <span className="analytics__stat-val" style={{color:s.c}}>{s.v}</span>
              <span className="analytics__stat-lbl">{s.l}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="analytics__grid">

        {/* ══ 1. MACHINE COST FORECAST ══════════════════════════════════════ */}
        <ChartCard
          title={t('analytics.machineCost_title')}
          subtitle={t('analytics.machineCost_sub')}
          badge={forecastAlgo==='HW'?'Holt-Winters ML':'Linear Regression ML'}
          badgeColor={forecastAlgo==='HW'?GREEN:ORANGE}
          note={forecastAlgo==='HW'
            ?t('analytics.machineCost_note_hw')
            :t('analytics.machineCost_note_lr')}
          mlNote={forecastAlgo==='HW'
            ?t('analytics.ml_holtwinters')
            :t('analytics.ml_linreg')}
        >
          <div className="analytics__filter-row">
            <span style={{fontSize:11,color:MUTED,alignSelf:'center'}}>{t('analytics.algorithm')}:</span>
            {['HW','LR'].map(a=>(
              <button key={a} onClick={()=>setForecastAlgo(a)}
                className={`analytics__filter-btn${forecastAlgo===a?' analytics__filter-btn--active':''}`}
                style={forecastAlgo===a?{background:a==='HW'?GREEN:ORANGE,color:'white',borderColor:'transparent'}:{}}>
                {a==='HW'?'Holt-Winters':'Linear Regression'}
              </button>
            ))}
            <span style={{fontSize:11,color:MUTED,marginLeft:8,alignSelf:'center'}}>{t('analytics.machineDetail')}:</span>
            {machines.map(m=>(
              <button key={m} onClick={()=>setSelMachine(m)}
                className={`analytics__filter-btn${selMachine===m?' analytics__filter-btn--active':''}`}
                style={selMachine===m?{background:STEEL,color:'white',borderColor:'transparent'}:{}}>
                M-{m}
              </button>
            ))}
          </div>

          {/* Detail card */}
          <div style={{display:'flex',gap:12,marginBottom:16,
            background:`${STEEL}08`,borderRadius:10,padding:'12px 16px',flexWrap:'wrap'}}>
            <div style={{flex:1,minWidth:110}}>
              <div style={{fontSize:10,color:MUTED}}>M-{selMachine} · {t('analytics.full2025')}</div>
              <div style={{fontSize:18,fontWeight:700,color:NAVY}}>{selF.full2025.toLocaleString()} DT</div>
              <div style={{fontSize:10,color:MUTED}}>{t('analytics.realPlusPredicted')}</div>
            </div>
            <div style={{flex:1,minWidth:110}}>
              <div style={{fontSize:10,color:MUTED}}>{t('analytics.forecast2026')}</div>
              <div style={{fontSize:18,fontWeight:700,color:selF.dir==='increase'?RED:GREEN}}>
                {selF.full2026.toLocaleString()} DT
              </div>
              <div style={{fontSize:11,fontWeight:600,color:selF.dir==='increase'?RED:GREEN}}>
                {selF.dir==='increase'?'📈':'📉'} {selF.pct}% {t(`analytics.dir_${selF.dir}`)} vs 2025
              </div>
            </div>
            {forecastAlgo==='LR'&&(
              <div style={{flex:1,minWidth:110}}>
                <div style={{fontSize:10,color:MUTED}}>{t('analytics.slope')}</div>
                <div style={{fontSize:16,fontWeight:700,
                  color:lrMachineForecast[selMachine].slope>0?RED:GREEN}}>
                  {lrMachineForecast[selMachine].slope>0?'+':''}{lrMachineForecast[selMachine].slope.toLocaleString()} DT/qtr
                </div>
              </div>
            )}
          </div>

          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={forecastAlgo==='HW'?hwBarData:lrBarData}
              margin={{top:20,right:20,left:10,bottom:5}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#D0DCF0" vertical={false}/>
              <XAxis dataKey="machine" stroke={MUTED} tick={{fill:MUTED,fontSize:11}}/>
              <YAxis tickFormatter={v=>`${(v/1000).toFixed(0)}k`} stroke={MUTED} tick={{fill:MUTED,fontSize:11}}/>
              <Tooltip formatter={(v,n)=>[`${v.toLocaleString()} DT`,
                n==='y2025'?t('analytics.legend2025'):t('analytics.legend2026')]}
                contentStyle={{borderRadius:8,fontSize:12}}/>
              <Legend formatter={v=>v==='y2025'?`📅 ${t('analytics.legend2025')}`:`🔮 ${t('analytics.legend2026')}`}/>
              <Bar dataKey="y2025" fill={STEEL} radius={[4,4,0,0]} maxBarSize={50}>
                <LabelList dataKey="y2025" position="top" formatter={v=>`${(v/1000).toFixed(0)}k`}
                  style={{fill:NAVY,fontSize:10,fontWeight:600}}/>
              </Bar>
              <Bar dataKey="y2026" fill={forecastAlgo==='HW'?ORANGE:PURPLE}
                radius={[4,4,0,0]} maxBarSize={50} opacity={0.75}>
                <LabelList dataKey="y2026" position="top" formatter={v=>`${(v/1000).toFixed(0)}k`}
                  style={{fill:NAVY,fontSize:10,fontWeight:600}}/>
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* ══ 2. PARTS CONSUMPTION FORECAST ════════════════════════════════ */}
        <ChartCard
          title={t('analytics.parts_title')}
          subtitle={t('analytics.parts_sub')}
          badge={partsAlgo==='HW'?'Holt-Winters ML':'Linear Regression ML'}
          badgeColor={partsAlgo==='HW'?GREEN:PURPLE}
          note={partsAlgo==='HW'?t('analytics.parts_note_hw'):t('analytics.parts_note_lr')}
          mlNote={t('analytics.parts_mlnote')}
        >
          <div className="analytics__filter-row">
            <span style={{fontSize:11,color:MUTED,alignSelf:'center'}}>{t('analytics.algorithm')}:</span>
            {['HW','LR'].map(a=>(
              <button key={a} onClick={()=>setPartsAlgo(a)}
                className={`analytics__filter-btn${partsAlgo===a?' analytics__filter-btn--active':''}`}
                style={partsAlgo===a?{background:a==='HW'?GREEN:PURPLE,color:'white',borderColor:'transparent'}:{}}>
                {a==='HW'?'Holt-Winters':'Linear Regression'}
              </button>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={partsData} margin={{top:20,right:20,left:10,bottom:5}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#D0DCF0" vertical={false}/>
              <XAxis dataKey="machine" stroke={MUTED} tick={{fill:MUTED,fontSize:11}}/>
              <YAxis tickFormatter={v=>v>=1000?`${(v/1000).toFixed(0)}k`:String(v)}
                stroke={MUTED} tick={{fill:MUTED,fontSize:11}}/>
              <Tooltip formatter={(v,n)=>[`${v.toLocaleString()} pcs`,
                n==='y2025'?t('analytics.legend2025'):t('analytics.legend2026')]}
                contentStyle={{borderRadius:8,fontSize:12}}/>
              <Legend formatter={v=>v==='y2025'?`📅 ${t('analytics.legend2025')}`:`🔮 ${t('analytics.legend2026')}`}/>
              <Bar dataKey="y2025" fill={STEEL} radius={[4,4,0,0]} maxBarSize={50}>
                <LabelList dataKey="y2025" position="top"
                  formatter={v=>v>0?`${v.toLocaleString()} pcs`:''}
                  style={{fill:NAVY,fontSize:10}}/>
              </Bar>
              <Bar dataKey="y2026" fill={partsAlgo==='HW'?ORANGE:PURPLE}
                radius={[4,4,0,0]} maxBarSize={50} opacity={0.75}>
                <LabelList dataKey="y2026" position="top"
                  formatter={v=>v>0?`${v.toLocaleString()} pcs`:''}
                  style={{fill:NAVY,fontSize:10}}/>
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* ══ 3. TOTAL FACTORY FORECAST ═════════════════════════════════════ */}
        <ChartCard
          title={t('analytics.total_title')}
          subtitle={t('analytics.total_sub')}
          badge={totalAlgo==='HW'?'Holt-Winters ML':'Linear Regression ML'}
          badgeColor={totalAlgo==='HW'?GREEN:PURPLE}
          note={totalAlgo==='HW'?t('analytics.total_note_hw'):t('analytics.total_note_lr')}
          mlNote={totalAlgo==='HW'?t('analytics.total_mlnote_hw'):t('analytics.total_mlnote_lr')}
        >
          <div className="analytics__filter-row">
            <span style={{fontSize:11,color:MUTED,alignSelf:'center'}}>{t('analytics.algorithm')}:</span>
            {['HW','LR'].map(a=>(
              <button key={a} onClick={()=>setTotalAlgo(a)}
                className={`analytics__filter-btn${totalAlgo===a?' analytics__filter-btn--active':''}`}
                style={totalAlgo===a?{background:a==='HW'?GREEN:PURPLE,color:'white',borderColor:'transparent'}:{}}>
                {a==='HW'?'Holt-Winters':'Linear Regression'}
              </button>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={totalData} margin={{top:10,right:60,left:20,bottom:60}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#D0DCF0"/>
              <XAxis dataKey="period" stroke={MUTED}
                tick={{fill:MUTED,fontSize:9,angle:-45,textAnchor:'end'}} interval={1}/>
              <YAxis tickFormatter={v=>`${(v/1000).toFixed(0)}k`} stroke={MUTED} tick={{fill:MUTED,fontSize:11}}/>
              <Tooltip content={({active,payload,label})=>{
                if(!active||!payload?.length) return null;
                const d=payload[0]?.payload;
                return <T>
                  <p style={{fontWeight:700,marginBottom:4}}>{label}</p>
                  <p>{t('analytics.cost')}: <strong>{payload[0]?.value?.toLocaleString()} DT</strong></p>
                  <p style={{fontSize:11,color:d?.type==='reel'?STEEL:totalAlgo==='HW'?ORANGE:PURPLE}}>
                    {d?.type==='reel'?`📊 ${t('analytics.historical')}`:`📈 ${t('analytics.forecast')}`}
                  </p>
                </T>;
              }}/>
              <ReferenceLine y={200000} stroke={ORANGE} strokeDasharray="4 4"
                label={{value:`⚠ ${t('analytics.alert')}`,fill:ORANGE,fontSize:9,position:'right'}}/>
              <ReferenceLine y={400000} stroke={RED} strokeDasharray="4 4"
                label={{value:`🔴 ${t('analytics.danger')}`,fill:RED,fontSize:9,position:'right'}}/>
              <Line type="monotone" dataKey="cost" strokeWidth={2.5} stroke={STEEL}
                dot={(props)=>{
                  const{cx,cy,payload}=props;
                  const col=payload.type==='reel'?STEEL:totalAlgo==='HW'?ORANGE:PURPLE;
                  return <circle key={payload.period} cx={cx} cy={cy} r={3.5}
                    fill={col} stroke="white" strokeWidth={1.5}/>;
                }}/>
            </LineChart>
          </ResponsiveContainer>

          <p style={{fontSize:12,fontWeight:600,color:NAVY,margin:'12px 0 8px 0'}}>
            {t('analytics.quarterlyBreakdown')}
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={quarterlyData} margin={{top:16,right:20,left:10,bottom:5}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#D0DCF0" vertical={false}/>
              <XAxis dataKey="q" stroke={MUTED} tick={{fill:MUTED,fontSize:12}}/>
              <YAxis tickFormatter={v=>`${(v/1000).toFixed(0)}k`} stroke={MUTED} tick={{fill:MUTED,fontSize:11}}/>
              <Tooltip formatter={(v,n)=>[`${v.toLocaleString()} DT`,
                n==='y2025'?'2025':t('analytics.forecast2026')]}
                contentStyle={{borderRadius:8,fontSize:12}}/>
              <Legend formatter={v=>v==='y2025'?`📅 2025`:`🔮 ${t('analytics.legend2026')}`}/>
              <Bar dataKey="y2025" fill={STEEL} radius={[4,4,0,0]} maxBarSize={60}>
                <LabelList dataKey="y2025" position="top" formatter={v=>`${(v/1000).toFixed(0)}k`}
                  style={{fill:NAVY,fontSize:10,fontWeight:600}}/>
              </Bar>
              <Bar dataKey="y2026" fill={totalAlgo==='HW'?ORANGE:PURPLE}
                radius={[4,4,0,0]} maxBarSize={60} opacity={0.75}>
                <LabelList dataKey="y2026" position="top" formatter={v=>`${(v/1000).toFixed(0)}k`}
                  style={{fill:NAVY,fontSize:10,fontWeight:600}}/>
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div style={{display:'flex',gap:8,marginTop:8}}>
            {quarterlyData.map(d=>(
              <div key={d.q} style={{
                flex:1,textAlign:'center',borderRadius:8,padding:'6px 4px',
                background:`${d.pct>30?RED:d.pct>10?ORANGE:GREEN}12`,
                border:`1px solid ${d.pct>30?RED:d.pct>10?ORANGE:GREEN}30`
              }}>
                <div style={{fontSize:11,fontWeight:600,color:NAVY}}>{d.q}</div>
                <div style={{fontSize:13,fontWeight:700,color:d.pct>30?RED:d.pct>10?ORANGE:GREEN}}>+{d.pct}%</div>
                <div style={{fontSize:9,color:MUTED}}>vs 2025</div>
              </div>
            ))}
          </div>
          <div className="analytics__legend-row">
            <span className="analytics__legend-dot" style={{background:STEEL}}/> {t('analytics.historical')} (2020–Q2 2025)
            <span className="analytics__legend-dot" style={{background:totalAlgo==='HW'?ORANGE:PURPLE}}/> {t('analytics.forecast')} (Q3 2025 → Q4 2026)
          </div>
        </ChartCard>

        {/* ══ 4. ANOMALY DETECTION ══════════════════════════════════════════ */}
        <ChartCard
          title={t('analytics.anomaly_title')}
          subtitle={t('analytics.anomaly_sub')}
          badge="Z-Score ML"
          badgeColor={RED}
          note={t('analytics.anomaly_note')}
          mlNote={t('analytics.ml_zscore')}
        >
          <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap'}}>
            {[
              {l:t('analytics.woWithParts'), v:'3,049',c:STEEL},
              {l:t('analytics.normalWO'),    v:'3,028',c:GREEN},
              {l:t('analytics.anomaliesDetected'),v:'36', c:RED  },
              {l:t('analytics.worstAnomaly'),v:'BT 99549 — 220,970 DT',c:NAVY},
            ].map(k=>(
              <div key={k.l} style={{
                flex:1,minWidth:120,background:'#F8F9FA',borderRadius:8,
                padding:'8px 10px',textAlign:'center'
              }}>
                <div style={{fontSize:10,color:MUTED}}>{k.l}</div>
                <div style={{fontSize:12,fontWeight:700,color:k.c,marginTop:2}}>{k.v}</div>
              </div>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={[
                {bt:'BT 71697',cost: 66361,machine:'M-683',year:2021},
                {bt:'BT 99551',cost: 90730,machine:'M-790',year:2025},
                {bt:'BT 99541',cost:101235,machine:'M-620',year:2021},
                {bt:'BT 99993',cost:146162,machine:'M-790',year:2022},
                {bt:'BT 99550',cost:149085,machine:'M-614',year:2024},
                {bt:'BT 99543',cost:170341,machine:'M-620',year:2021},
                {bt:'BT 99549',cost:220970,machine:'M-620',year:2024},
              ]}
              layout="vertical" margin={{top:5,right:160,left:75,bottom:5}}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#D0DCF0" horizontal={false}/>
              <XAxis type="number" tickFormatter={v=>`${(v/1000).toFixed(0)}k`}
                stroke={MUTED} tick={{fill:MUTED,fontSize:11}}/>
              <YAxis type="category" dataKey="bt" stroke={MUTED}
                tick={{fill:NAVY,fontSize:11}} width={70}/>
              <Tooltip content={({active,payload})=>{
                if(!active||!payload?.length) return null;
                const d=payload[0].payload;
                return <T>
                  <p style={{fontWeight:700,marginBottom:4}}>{d.bt}</p>
                  <p>{t('analytics.cost')}: <strong>{d.cost.toLocaleString()} DT</strong></p>
                  <p>{t('analytics.machine')}: <strong>{d.machine}</strong> · {t('analytics.year_label')}: <strong>{d.year}</strong></p>
                  <p style={{color:RED,fontSize:11}}>🔴 {t('analytics.aboveThreshold')}</p>
                </T>;
              }}/>
              <Bar dataKey="cost" radius={[0,4,4,0]} maxBarSize={26}>
                {[66361,90730,101235,146162,149085,170341,220970].map((v,i)=>(
                  <Cell key={i} fill={v>150000?RED:v>80000?ORANGE:STEEL}/>
                ))}
                <LabelList dataKey="cost" position="right"
                  formatter={v=>`${v.toLocaleString()} DT`}
                  style={{fill:NAVY,fontSize:10}}/>
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div style={{display:'flex',gap:8,marginTop:12,flexWrap:'wrap'}}>
            {[
              {z:`🟢 ${t('analytics.normalZone')}`, r:'< 2,440 DT',  c:GREEN },
              {z:`🟠 ${t('analytics.alertZone')}`,  r:'2,440–8,132 DT',c:ORANGE},
              {z:`🔴 ${t('analytics.dangerZone')}`, r:'> 8,132 DT',  c:RED   },
              {z:`— ${t('analytics.threshold')}`,   r:'8,132 DT',    c:YELLOW},
            ].map(z=>(
              <span key={z.z} style={{
                fontSize:10,fontWeight:600,color:z.c,
                background:`${z.c}12`,borderRadius:20,
                padding:'3px 10px',border:`1px solid ${z.c}30`
              }}>{z.z} ({z.r})</span>
            ))}
          </div>

          <div style={{display:'flex',gap:8,marginTop:12,flexWrap:'wrap'}}>
            {[{yr:'2020',n:1},{yr:'2021',n:8},{yr:'2022',n:11},{yr:'2023',n:4},{yr:'2024',n:8},{yr:'2025',n:2}].map(y=>(
              <div key={y.yr} style={{
                flex:1,minWidth:60,textAlign:'center',
                background:y.n>=8?`${RED}12`:y.n>=4?`${ORANGE}12`:`${STEEL}10`,
                borderRadius:8,padding:'8px 4px',
                border:`1px solid ${y.n>=8?RED:y.n>=4?ORANGE:STEEL}30`
              }}>
                <div style={{fontSize:10,color:MUTED}}>{y.yr}</div>
                <div style={{fontSize:18,fontWeight:700,color:y.n>=8?RED:y.n>=4?ORANGE:STEEL}}>{y.n}</div>
                <div style={{fontSize:9,color:MUTED}}>{t('analytics.anomaly_count',{count:y.n})}</div>
              </div>
            ))}
          </div>
        </ChartCard>

        {/* ══ 5. PHANTOM PARTS ══════════════════════════════════════════════ */}
        <ChartCard
          title={t('analytics.phantom_title')}
          subtitle={t('analytics.phantom_sub')}
          badge={t('analytics.badge_quality')}
          badgeColor={ORANGE}
          note={t('analytics.phantom_note')}
        >
          <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap'}}>
            {[
              {l:t('analytics.totalPhantomExits'), v:'7,031',                           c:RED   },
              {l:t('analytics.totalUntracedCost'), v:'2,016,160 DT',                    c:RED   },
              {l:t('analytics.mostExitsArticle'),  v:'SCOTCH ISOLANT (108 exits)',       c:ORANGE},
              {l:t('analytics.mostExpensive'),      v:'FILTRE ANTI HARM. (123,814 DT)', c:NAVY  },
            ].map(k=>(
              <div key={k.l} style={{
                flex:1,minWidth:130,background:'#FFF3E0',borderRadius:8,padding:'8px 10px'
              }}>
                <div style={{fontSize:10,color:MUTED}}>{k.l}</div>
                <div style={{fontSize:11,fontWeight:700,color:k.c,marginTop:2}}>{k.v}</div>
              </div>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={phantomYearData} margin={{top:20,right:20,left:10,bottom:5}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#D0DCF0" vertical={false}/>
              <XAxis dataKey="year" stroke={MUTED} tick={{fill:MUTED,fontSize:12}}/>
              <YAxis tickFormatter={v=>`${(v/1000).toFixed(0)}k`} stroke={MUTED} tick={{fill:MUTED,fontSize:11}}/>
              <Tooltip content={({active,payload,label})=>{
                if(!active||!payload?.length) return null;
                const d=payload[0]?.payload||payload[1]?.payload;
                return <T>
                  <p style={{fontWeight:700,marginBottom:4}}>{t('analytics.year_label')} {label}</p>
                  <p style={{color:STEEL}}>{t('analytics.normalWO_short')}: <strong>{d.normal.toLocaleString()} DT</strong></p>
                  <p style={{color:RED}}>{t('analytics.phantom_short')}: <strong>{d.phantom.toLocaleString()} DT</strong></p>
                  <p style={{color:RED}}>{t('analytics.phantomRate')}: <strong>{d.pct}%</strong></p>
                </T>;
              }}/>
              <Legend formatter={v=>v==='normal'
                ?t('analytics.normalWithWO')
                :t('analytics.phantomNoWO')}/>
              <Bar dataKey="normal" fill={STEEL} radius={[4,4,0,0]} maxBarSize={50}>
                <LabelList dataKey="normal" position="top"
                  formatter={v=>`${(v/1000).toFixed(0)}k`}
                  style={{fill:NAVY,fontSize:9}}/>
              </Bar>
              <Bar dataKey="phantom" fill={RED} radius={[4,4,0,0]} maxBarSize={50}>
                {phantomYearData.map((d,i)=>(
                  <Cell key={i} fill={RED} opacity={d.pct>50?1:0.65}/>
                ))}
                <LabelList dataKey="phantom" position="top"
                  formatter={v=>`${(v/1000).toFixed(0)}k`}
                  style={{fill:NAVY,fontSize:9}}/>
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div style={{display:'flex',gap:6,marginTop:8,flexWrap:'wrap'}}>
            {phantomYearData.map(d=>(
              <div key={d.year} style={{
                flex:1,minWidth:60,textAlign:'center',borderRadius:8,padding:'6px 4px',
                background:d.pct>50?`${RED}12`:d.pct>20?`${ORANGE}12`:`${GREEN}10`,
                border:`1px solid ${d.pct>50?RED:d.pct>20?ORANGE:GREEN}30`
              }}>
                <div style={{fontSize:10,color:MUTED}}>{d.year}</div>
                <div style={{fontSize:14,fontWeight:700,color:d.pct>50?RED:d.pct>20?ORANGE:GREEN}}>{d.pct}%</div>
                <div style={{fontSize:9,color:MUTED}}>phantom</div>
              </div>
            ))}
          </div>

          {/* Top 15 */}
          <div style={{marginTop:20}}>
            <p style={{fontSize:12,fontWeight:700,color:NAVY,margin:'0 0 10px 0'}}>
              {t('analytics.top15Title')}
              <span style={{fontSize:10,fontWeight:400,color:MUTED,marginLeft:8}}>02/01/2020 – 02/03/2026</span>
            </p>
            {phantomArticles.map((a,i)=>{
              const col=getPColor(a.p);
              const barW=(a.cost/123814*100).toFixed(1);
              return(
                <div key={a.code} style={{
                  display:'flex',alignItems:'center',gap:10,marginBottom:5,
                  padding:'6px 8px',background:i%2===0?'#FAFAFA':'white',
                  borderRadius:6,borderLeft:`3px solid ${col}`
                }}>
                  <span style={{
                    width:22,height:22,borderRadius:4,background:col,color:'white',
                    fontSize:9,fontWeight:700,display:'flex',alignItems:'center',
                    justifyContent:'center',flexShrink:0
                  }}>#{i+1}</span>
                  <div style={{flex:3,minWidth:160}}>
                    <div style={{fontSize:10,fontWeight:600,color:NAVY}}>{a.code} — {a.name.substring(0,32)}</div>
                    <div style={{fontSize:9,color:MUTED}}>📅 {a.date}</div>
                  </div>
                  <div style={{flex:1,minWidth:80}}>
                    <div style={{height:6,borderRadius:3,background:'#E0E0E0',overflow:'hidden'}}>
                      <div style={{width:`${barW}%`,height:'100%',background:col,borderRadius:3}}/>
                    </div>
                  </div>
                  <div style={{minWidth:120,textAlign:'right',whiteSpace:'nowrap'}}>
                    <span style={{fontSize:11,fontWeight:700,color:NAVY}}>{a.cost.toLocaleString()} DT</span>
                    <span style={{fontSize:9,color:MUTED,marginLeft:6}}>
                      {a.exits} {t('analytics.exit')}{a.exits>1?t('analytics.exits_s'):''}
                    </span>
                  </div>
                </div>
              );
            })}
            <div style={{
              marginTop:10,padding:'8px 12px',borderRadius:8,
              background:`${ORANGE}10`,border:`1px solid ${ORANGE}40`,fontSize:11,color:NAVY
            }}>
              📊 {t('analytics.top15Summary')}
            </div>
          </div>
        </ChartCard>

        {/* ══ 6. MACHINE RISK DASHBOARD ═════════════════════════════════════ */}
        <ChartCard
          title={t('analytics.risk_title')}
          subtitle={t('analytics.risk_sub')}
          badge={t('analytics.risk_badge')}
          badgeColor={RED}
          note={t('analytics.risk_note')}
          mlNote={t('analytics.risk_mlnote')}
        >
          <div style={{display:'flex',gap:16,marginBottom:16,flexWrap:'wrap'}}>
            {[
              {l:`🔴 ${t('analytics.highRisk')}`,   v:'3', c:RED   },
              {l:`🟠 ${t('analytics.mediumRisk')}`,  v:'13',c:ORANGE},
              {l:`🟢 ${t('analytics.lowRisk')}`,     v:'4', c:GREEN },
              {l:t('analytics.totalMachines'),        v:'20',c:NAVY  },
            ].map(s=>(
              <div key={s.l} style={{flex:1,minWidth:80}}>
                <div style={{fontSize:10,color:MUTED}}>{s.l}</div>
                <div style={{fontSize:22,fontWeight:700,color:s.c}}>{s.v}</div>
              </div>
            ))}
          </div>

          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'separate',borderSpacing:'0 3px'}}>
              <thead>
                <tr style={{background:NAVY}}>
                  {[
                    t('analytics.col_rank'),
                    t('analytics.col_machine'),
                    t('analytics.col_breakdowns'),
                    t('analytics.col_cost'),
                    t('analytics.col_score'),
                    t('analytics.col_level'),
                    t('analytics.col_action'),
                  ].map(h=>(
                    <th key={h} style={{fontSize:10,fontWeight:700,color:'white',
                      textAlign:'left',padding:'6px 8px'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {machineRiskData.map((r,i)=>{
                  const col=getRiskColor(r.risk);
                  const bg=i%2===0?(r.risk==='HIGH'?'#FFF5F5':r.risk==='MEDIUM'?'#FFFAF5':'#F5FFF8'):'white';
                  return(
                    <tr key={r.machine} style={{background:bg}}>
                      <td style={{padding:'7px 8px',fontSize:12,fontWeight:700,
                        color:col,borderLeft:`4px solid ${col}`}}>#{i+1}</td>
                      <td style={{padding:'7px 8px',fontSize:12,fontWeight:700,color:NAVY}}>{r.machine}</td>
                      <td style={{padding:'7px 8px',fontSize:12,color:NAVY}}>{r.breakdowns.toLocaleString()}</td>
                      <td style={{padding:'7px 8px',fontSize:12,color:NAVY}}>{r.cost.toLocaleString()} DT</td>
                      <td style={{padding:'7px 8px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <div style={{width:50,height:7,borderRadius:4,
                            background:'#E0E0E0',overflow:'hidden',flexShrink:0}}>
                            <div style={{width:`${r.score}%`,height:'100%',background:col,borderRadius:4}}/>
                          </div>
                          <span style={{fontSize:11,fontWeight:700,color:col,whiteSpace:'nowrap'}}>
                            {r.score}/100
                          </span>
                        </div>
                      </td>
                      <td style={{padding:'7px 8px',fontSize:11,fontWeight:700,color:col}}>
                        {r.risk==='HIGH'?'🔴':r.risk==='MEDIUM'?'🟠':'🟢'} {t(`analytics.risk_${r.risk.toLowerCase()}`)}
                      </td>
                      <td style={{padding:'7px 8px',fontSize:11,color:col,fontStyle:'italic'}}>
                        {t(`analytics.action_${r.risk.toLowerCase()}`)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </ChartCard>

      </div>

      <div className="analytics__footer">{t('analytics.footer')}</div>
    </div>
  );
}
