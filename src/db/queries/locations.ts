import { getDatabase, ftsAvailable } from '../client';

export interface Location {
  id: number;
  slug: string;
  name: string;
  short_description: string;
  category_id: number;
  lat: number;
  lng: number;
  address: string;
  neighborhood: string;
  opening_hours: Record<string, string>;
  admission: string;
  website: string | null;
  is_featured: number;
  is_heritage?: number;
  category_label?: string;
  category_color?: string;
  category_icon?: string;
  category_slug?: string;
}

export interface LocationContent {
  history: string;
  curiosities: string[];
  practical_tips: string[];
  how_to_get_there: string;
}

export async function getAllLocations(): Promise<Location[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(`
    SELECT l.*, c.label as category_label, c.color as category_color, c.icon as category_icon, c.slug as category_slug
    FROM locations l
    LEFT JOIN categories c ON l.category_id = c.id
    ORDER BY l.is_featured DESC, l.name ASC
  `);
  return rows.map(parseLocation);
}

export async function getLocationBySlug(slug: string): Promise<Location | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<any>(`
    SELECT l.*, c.label as category_label, c.color as category_color, c.icon as category_icon, c.slug as category_slug
    FROM locations l
    LEFT JOIN categories c ON l.category_id = c.id
    WHERE l.slug = ?
  `, [slug]);
  return row ? parseLocation(row) : null;
}

export async function getLocationContent(locationId: number): Promise<LocationContent | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<any>(
    'SELECT * FROM location_content WHERE location_id = ?',
    [locationId]
  );
  if (!row) return null;
  return {
    history: row.history,
    curiosities: JSON.parse(row.curiosities || '[]'),
    practical_tips: JSON.parse(row.practical_tips || '[]'),
    how_to_get_there: row.how_to_get_there,
  };
}

export async function searchLocations(query: string): Promise<Location[]> {
  const db = await getDatabase();

  // Caminho rápido com FTS5 (nativo)
  if (ftsAvailable()) {
    const rows = await db.getAllAsync<any>(`
      SELECT l.*, c.label as category_label, c.color as category_color, c.icon as category_icon, c.slug as category_slug
      FROM locations_fts fts
      JOIN locations l ON l.id = fts.rowid
      LEFT JOIN categories c ON l.category_id = c.id
      WHERE locations_fts MATCH ?
      ORDER BY rank
      LIMIT 20
    `, [query + '*']);
    return rows.map(parseLocation);
  }

  // Fallback sem FTS (web): busca por LIKE em nome, descrição e bairro
  const like = `%${query}%`;
  const rows = await db.getAllAsync<any>(`
    SELECT l.*, c.label as category_label, c.color as category_color, c.icon as category_icon, c.slug as category_slug
    FROM locations l
    LEFT JOIN categories c ON l.category_id = c.id
    WHERE l.name LIKE ? OR l.short_description LIKE ? OR l.neighborhood LIKE ?
    ORDER BY l.is_featured DESC, l.name ASC
    LIMIT 20
  `, [like, like, like]);
  return rows.map(parseLocation);
}

function parseLocation(row: any): Location {
  return {
    ...row,
    opening_hours: safeJson(row.opening_hours, {}),
  };
}

function safeJson(str: string, fallback: any) {
  try { return JSON.parse(str); } catch { return fallback; }
}
