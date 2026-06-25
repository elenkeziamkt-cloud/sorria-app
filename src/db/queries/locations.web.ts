// Web: lê os locais direto do JSON de /seed — SEM SQLite/OPFS.
// Espelha a abordagem já usada pelo mapa web (SorriaMap.web.tsx), que é imune
// a recarregar a página. O Metro resolve este arquivo .web.ts automaticamente
// no build web; no nativo continua valendo locations.ts (SQLite/FTS).
import type { Location, LocationContent } from './locations';
import locationsData from '../../../seed/locations.json';
import categoriesData from '../../../seed/categories.json';

export type { Location, LocationContent };

type Cat = { id: number; slug: string; label: string; icon: string; color: string };
const CATS = categoriesData as Cat[];
const catById = new Map<number, Cat>(CATS.map(c => [c.id, c]));

const ALL = locationsData as any[];

function toLocation(l: any): Location {
  const c = catById.get(l.category_id);
  return {
    id: l.id,
    slug: l.slug,
    name: l.name,
    short_description: l.short_description,
    category_id: l.category_id,
    lat: l.lat,
    lng: l.lng,
    address: l.address,
    neighborhood: l.neighborhood,
    opening_hours: (l.opening_hours && typeof l.opening_hours === 'object') ? l.opening_hours : {},
    admission: l.admission,
    website: l.website ?? null,
    is_featured: l.is_featured ?? 0,
    is_heritage: l.is_heritage ?? 0,
    category_label: c?.label,
    category_color: c?.color,
    category_icon: c?.icon,
    category_slug: c?.slug,
  };
}

// is_featured DESC, name ASC — mesma ordem do SQLite
function sortFeatured(a: Location, b: Location): number {
  const fa = a.is_featured ?? 0;
  const fb = b.is_featured ?? 0;
  if (fb !== fa) return fb - fa;
  return a.name.localeCompare(b.name, 'pt');
}

const deburr = (s: string | undefined) =>
  (s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export async function getAllLocations(): Promise<Location[]> {
  return ALL.map(toLocation).sort(sortFeatured);
}

export async function getLocationBySlug(slug: string): Promise<Location | null> {
  const l = ALL.find(x => x.slug === slug);
  return l ? toLocation(l) : null;
}

export async function getLocationContent(locationId: number): Promise<LocationContent | null> {
  const l = ALL.find(x => x.id === locationId);
  if (!l || !l.content) return null;
  return {
    history: l.content.history ?? '',
    curiosities: Array.isArray(l.content.curiosities) ? l.content.curiosities : [],
    practical_tips: Array.isArray(l.content.practical_tips) ? l.content.practical_tips : [],
    how_to_get_there: l.content.how_to_get_there ?? '',
  };
}

export async function searchLocations(query: string): Promise<Location[]> {
  const q = deburr(query);
  return ALL
    .filter(l => deburr(l.name).includes(q) || deburr(l.short_description).includes(q) || deburr(l.neighborhood).includes(q))
    .map(toLocation)
    .sort(sortFeatured)
    .slice(0, 20);
}
