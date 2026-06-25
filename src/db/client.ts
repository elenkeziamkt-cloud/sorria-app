import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

// Indica se as tabelas FTS5 puderam ser criadas nesta plataforma.
// No build web (wa-sqlite) o módulo fts5 não vem compilado, então fica false
// e a busca cai para LIKE. No nativo fica true (busca full-text).
let _ftsAvailable = false;
export function ftsAvailable(): boolean {
  return _ftsAvailable;
}

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('porto-rio.db');
  return db;
}

// Cria todas as tabelas (idempotente)
export async function createTables(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY,
      slug TEXT UNIQUE,
      label TEXT,
      icon TEXT,
      color TEXT
    );

    CREATE TABLE IF NOT EXISTS locations (
      id INTEGER PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      short_description TEXT,
      category_id INTEGER REFERENCES categories(id),
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      address TEXT,
      neighborhood TEXT,
      opening_hours TEXT,
      admission TEXT,
      website TEXT,
      is_featured INTEGER DEFAULT 0,
      is_heritage INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS location_content (
      location_id INTEGER PRIMARY KEY REFERENCES locations(id),
      history TEXT,
      curiosities TEXT,
      practical_tips TEXT,
      how_to_get_there TEXT
    );

    CREATE TABLE IF NOT EXISTS transport_lines (
      id INTEGER PRIMARY KEY,
      name TEXT,
      type TEXT,
      color TEXT,
      description TEXT,
      history TEXT
    );

    CREATE TABLE IF NOT EXISTS stations (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      line_id INTEGER REFERENCES transport_lines(id),
      line_order INTEGER,
      lat REAL,
      lng REAL,
      neighborhood TEXT,
      context TEXT,
      nearby_highlights TEXT,
      practical TEXT
    );

    CREATE TABLE IF NOT EXISTS chat_intents (
      id INTEGER PRIMARY KEY,
      slug TEXT UNIQUE,
      category TEXT,
      question_example TEXT,
      keywords TEXT,
      answer TEXT,
      related_location_slug TEXT
    );
  `);

  // FTS5 não está disponível em todas as plataformas — em especial no build web
  // (wa-sqlite), onde lança "no such module: fts5". Tentamos criar as tabelas de
  // busca; se falhar, marcamos indisponível e o app usa busca por LIKE.
  try {
    await database.execAsync(`
      CREATE VIRTUAL TABLE IF NOT EXISTS locations_fts USING fts5(
        name, short_description,
        content='locations', content_rowid='id'
      );

      CREATE VIRTUAL TABLE IF NOT EXISTS chat_fts USING fts5(
        question_example, answer, keywords,
        content='chat_intents', content_rowid='id'
      );
    `);
    _ftsAvailable = true;
  } catch (e: any) {
    _ftsAvailable = false;
    console.warn('[db] FTS5 indisponível — usando busca por LIKE.', e?.message ?? e);
  }
}

// Remove todas as tabelas (usado ao re-semear quando os dados mudam de versão)
export async function dropTables(database: SQLite.SQLiteDatabase): Promise<void> {
  // Tabelas FTS por último e isoladas: no web o módulo fts5 não carrega, então
  // o DROP delas pode falhar — não pode derrubar o resto do re-seed.
  try {
    await database.execAsync(`
      DROP TABLE IF EXISTS locations_fts;
      DROP TABLE IF EXISTS chat_fts;
    `);
  } catch (e: any) {
    console.warn('[db] DROP das tabelas FTS ignorado.', e?.message ?? e);
  }

  await database.execAsync(`
    DROP TABLE IF EXISTS location_content;
    DROP TABLE IF EXISTS locations;
    DROP TABLE IF EXISTS chat_intents;
    DROP TABLE IF EXISTS stations;
    DROP TABLE IF EXISTS transport_lines;
    DROP TABLE IF EXISTS categories;
  `);
}

export async function initDatabase(): Promise<void> {
  const database = await getDatabase();
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
  `);
  await createTables(database);
}
