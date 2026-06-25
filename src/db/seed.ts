import { SQLiteDatabase } from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createTables, dropTables, ftsAvailable } from './client';
import categories from '../../seed/categories.json';
import locations from '../../seed/locations.json';
import transportLines from '../../seed/transport_lines.json';
import stations from '../../seed/stations.json';
import chatIntents from '../../seed/chat_intents.json';

// Escapa string para SQL — substitui ' por ''
function s(v: string | null | undefined): string {
  if (v === null || v === undefined) return 'NULL';
  return `'${String(v).replace(/'/g, "''")}'`;
}
function n(v: number | null | undefined): string {
  return (v === null || v === undefined) ? 'NULL' : String(Number(v));
}

// Bump esta versão sempre que os dados em /seed mudarem
// (coordenadas, novos locais, intents, etc.) para forçar o re-seed no app.
const SEED_VERSION = '2026-06-23-marinha-civicos';
const SEED_VERSION_KEY = 'sorria-seed-version';

export async function seedDatabase(db: SQLiteDatabase): Promise<void> {
  const storedVersion = await AsyncStorage.getItem(SEED_VERSION_KEY);
  const existing = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM locations'
  );
  // Já está na versão atual e populado → não faz nada
  if (storedVersion === SEED_VERSION && existing && existing.count > 0) return;

  // Dados mudaram (ou primeira execução) → recria as tabelas do zero
  await dropTables(db);
  await createTables(db);

  // 1 — Categories (bulk: 1 insert em vez de 12)
  const catRows = (categories as any[]).map(c =>
    `(${n(c.id)},${s(c.slug)},${s(c.label)},${s(c.icon)},${s(c.color)})`
  ).join(',');
  await db.execAsync(
    `INSERT OR IGNORE INTO categories (id,slug,label,icon,color) VALUES ${catRows};`
  );

  // 2 — Transport lines (bulk: 1 insert em vez de 8)
  const lineRows = (transportLines as any[]).map(l =>
    `(${n(l.id)},${s(l.name)},${s(l.type)},${s(l.color)},${s(l.description)},${s(l.history)})`
  ).join(',');
  await db.execAsync(
    `INSERT OR IGNORE INTO transport_lines (id,name,type,color,description,history) VALUES ${lineRows};`
  );

  // 3 — Locations (bulk: 1 insert em vez de 16)
  const locRows = (locations as any[]).map((l: any) =>
    `(${n(l.id)},${s(l.slug)},${s(l.name)},${s(l.short_description)},${n(l.category_id)},` +
    `${n(l.lat)},${n(l.lng)},${s(l.address)},${s(l.neighborhood)},` +
    `${s(JSON.stringify(l.opening_hours))},${s(l.admission)},${s(l.website ?? null)},${n(l.is_featured)},${n(l.is_heritage)})`
  ).join(',');
  await db.execAsync(
    `INSERT OR IGNORE INTO locations (id,slug,name,short_description,category_id,lat,lng,address,neighborhood,opening_hours,admission,website,is_featured,is_heritage) VALUES ${locRows};`
  );

  // 4 — Location content (bulk: 1 insert em vez de 16)
  const contentRows = (locations as any[])
    .filter((l: any) => l.content)
    .map((l: any) =>
      `(${n(l.id)},${s(l.content.history)},${s(JSON.stringify(l.content.curiosities))},` +
      `${s(JSON.stringify(l.content.practical_tips))},${s(l.content.how_to_get_there)})`
    ).join(',');
  if (contentRows) {
    await db.execAsync(
      `INSERT OR IGNORE INTO location_content (location_id,history,curiosities,practical_tips,how_to_get_there) VALUES ${contentRows};`
    );
  }

  // 5 — Stations (bulk: 1 insert em vez de 29)
  const stRows = (stations as any[]).map(st =>
    `(${n(st.id)},${s(st.name)},${n(st.line_id)},${n(st.line_order)},` +
    `${n(st.lat)},${n(st.lng)},${s(st.neighborhood)},${s(st.context)},` +
    `${s(JSON.stringify(st.nearby_highlights))},${s(st.practical)})`
  ).join(',');
  await db.execAsync(
    `INSERT OR IGNORE INTO stations (id,name,line_id,line_order,lat,lng,neighborhood,context,nearby_highlights,practical) VALUES ${stRows};`
  );

  // 6 — Chat intents (bulk: 1 insert em vez de 16)
  const intentRows = (chatIntents as any[]).map(i =>
    `(${n(i.id)},${s(i.slug)},${s(i.category)},${s(i.question_example)},` +
    `${s(JSON.stringify(i.keywords))},${s(i.answer)},${s(i.related_location_slug ?? null)})`
  ).join(',');
  await db.execAsync(
    `INSERT OR IGNORE INTO chat_intents (id,slug,category,question_example,keywords,answer,related_location_slug) VALUES ${intentRows};`
  );

  // 7 — FTS (só se disponível; no web não há fts5, então pulamos)
  if (ftsAvailable()) {
    await db.execAsync(`
      INSERT INTO locations_fts(rowid,name,short_description)
        SELECT id,name,short_description FROM locations;
      INSERT INTO chat_fts(rowid,question_example,answer,keywords)
        SELECT id,question_example,answer,keywords FROM chat_intents;
    `);
  }

  // Marca a versão semeada para evitar re-seed desnecessário nas próximas aberturas
  await AsyncStorage.setItem(SEED_VERSION_KEY, SEED_VERSION);
}
