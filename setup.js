const Database = require('better-sqlite3');
const XLSX = require('xlsx');
const path = require('path');

function excelDateToString(val) {
  if (!val) return null;
  if (typeof val === 'number') {
    const date = new Date(Math.round((val - 25569) * 86400 * 1000));
    return date.toISOString().slice(0, 10);
  }
  return String(val).slice(0, 10);
}

console.log('🔄 Loading Excel files...');

const btFile = XLSX.readFile(path.join(__dirname, 'bons_de_travail.xlsx'));
const spFile = XLSX.readFile(path.join(__dirname, 'sorties_pieces.xlsx'));

const btData = XLSX.utils.sheet_to_json(btFile.Sheets[btFile.SheetNames[0]]);
const spData = XLSX.utils.sheet_to_json(spFile.Sheets[spFile.SheetNames[0]]);

console.log(`✅ Loaded ${btData.length} work orders (BT)`);
console.log(`✅ Loaded ${spData.length} spare parts records`);

const db = new Database(path.join(__dirname, 'database.db'));

console.log('🔄 Creating tables...');

db.exec(`
  DROP TABLE IF EXISTS bons_de_travail;
  DROP TABLE IF EXISTS sorties_pieces;

  CREATE TABLE bons_de_travail (
    NU__BT INTEGER,
    SERVICE TEXT,
    DATE_DEM TEXT,
    DEMANDE TEXT,
    NU_MACHINE INTEGER,
    REF_TRAV TEXT,
    DATE_CORRIGEE TEXT,
    TYPE_TRAVAIL TEXT,
    SERVICE_LABEL TEXT,
    ANNEE INTEGER,
    MOIS INTEGER,
    MOIS_NOM TEXT,
    TRIMESTRE INTEGER
  );

  CREATE TABLE sorties_pieces (
    CODE_ART TEXT,
    DESIG_ART TEXT,
    NU__BT INTEGER,
    CENT_CHARG INTEGER,
    PRIX_UNIT REAL,
    Q_SORT REAL,
    DATE_SORT TEXT,
    EMPLACT TEXT,
    MOUVEMENT TEXT,
    COUT_TOTAL REAL,
    PRIX_MANQUANT TEXT,
    ANNEE INTEGER,
    MOIS INTEGER,
    MOIS_NOM TEXT,
    TRIMESTRE INTEGER
  );
`);

console.log('🔄 Inserting work orders...');
const insertBT = db.prepare(`
  INSERT INTO bons_de_travail VALUES (
    @NU__BT, @SERVICE, @DATE_DEM, @DEMANDE, @NU_MACHINE,
    @REF_TRAV, @DATE_CORRIGEE, @TYPE_TRAVAIL, @SERVICE_LABEL,
    @ANNEE, @MOIS, @MOIS_NOM, @TRIMESTRE
  )
`);

const insertManyBT = db.transaction((rows) => {
  for (const row of rows) {
    insertBT.run({
      NU__BT: row['NU__BT'] ?? null,
      SERVICE: row['SERVICE'] ? String(row['SERVICE']) : null,
      DATE_DEM: excelDateToString(row['DATE_DEM']),
      DEMANDE: row['DEMANDE'] ? String(row['DEMANDE']) : null,
      NU_MACHINE: row['NU_MACHINE'] ?? null,
      REF_TRAV: row['REF_TRAV'] ? String(row['REF_TRAV']) : null,
      DATE_CORRIGEE: excelDateToString(row['DATE_CORRIGEE']),
      TYPE_TRAVAIL: row['TYPE_TRAVAIL'] ? String(row['TYPE_TRAVAIL']) : null,
      SERVICE_LABEL: row['SERVICE_LABEL'] ? String(row['SERVICE_LABEL']) : null,
      ANNEE: row['ANNEE'] ?? null,
      MOIS: row['MOIS'] ?? null,
      MOIS_NOM: row['MOIS_NOM'] ? String(row['MOIS_NOM']) : null,
      TRIMESTRE: row['TRIMESTRE'] ?? null,
    });
  }
});

insertManyBT(btData);
console.log(`✅ Inserted ${btData.length} work orders`);

console.log('🔄 Inserting spare parts...');
const insertSP = db.prepare(`
  INSERT INTO sorties_pieces VALUES (
    @CODE_ART, @DESIG_ART, @NU__BT, @CENT_CHARG, @PRIX_UNIT,
    @Q_SORT, @DATE_SORT, @EMPLACT, @MOUVEMENT, @COUT_TOTAL,
    @PRIX_MANQUANT, @ANNEE, @MOIS, @MOIS_NOM, @TRIMESTRE
  )
`);

const insertManySP = db.transaction((rows) => {
  for (const row of rows) {
    insertSP.run({
      CODE_ART: row['CODE_ART'] ? String(row['CODE_ART']) : null,
      DESIG_ART: row['DESIG_ART'] ? String(row['DESIG_ART']) : null,
      NU__BT: row['NU__BT'] ?? null,
      CENT_CHARG: row['CENT_CHARG'] ?? null,
      PRIX_UNIT: row['PRIX_UNIT'] ?? null,
      Q_SORT: row['Q_SORT'] ?? null,
      DATE_SORT: excelDateToString(row['DATE_SORT']),
      EMPLACT: row['EMPLACT'] ? String(row['EMPLACT']) : null,
      MOUVEMENT: row['MOUVEMENT'] ? String(row['MOUVEMENT']) : null,
      COUT_TOTAL: row['COUT_TOTAL'] ?? null,
      PRIX_MANQUANT: String(row['PRIX_MANQUANT'] ?? ''),
      ANNEE: row['ANNEE'] ?? null,
      MOIS: row['MOIS'] ?? null,
      MOIS_NOM: row['MOIS_NOM'] ? String(row['MOIS_NOM']) : null,
      TRIMESTRE: row['TRIMESTRE'] ?? null,
    });
  }
});

insertManySP(spData);
console.log(`✅ Inserted ${spData.length} spare parts records`);

console.log('🔄 Creating indexes for fast queries...');
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_bt_num ON bons_de_travail(NU__BT);
  CREATE INDEX IF NOT EXISTS idx_bt_machine ON bons_de_travail(NU_MACHINE);
  CREATE INDEX IF NOT EXISTS idx_bt_date ON bons_de_travail(DATE_DEM);
  CREATE INDEX IF NOT EXISTS idx_bt_year ON bons_de_travail(ANNEE);
  CREATE INDEX IF NOT EXISTS idx_sp_bt ON sorties_pieces(NU__BT);
  CREATE INDEX IF NOT EXISTS idx_sp_machine ON sorties_pieces(CENT_CHARG);
  CREATE INDEX IF NOT EXISTS idx_sp_date ON sorties_pieces(DATE_SORT);
`);

db.close();
console.log('');
console.log('🎉 database.db created successfully!');
console.log('✅ Ready — you can now start the server.');