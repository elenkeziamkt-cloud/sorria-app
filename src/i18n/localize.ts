// Sobreposição de conteúdo em inglês por slug. Quando o idioma é EN e existe
// tradução para o slug, troca os campos; senão mantém o PT (fallback seguro).
// A mesma fonte (seed/locations.en.json) é usada pelas telas e pelo chatbot.
import enData from '../../seed/locations.en.json';
import type { Lang } from './translations';
import type { Location, LocationContent } from '../db/queries/locations';

interface EnLoc {
  name?: string;
  short_description?: string;
  address?: string;
  neighborhood?: string;
  admission?: string;
  opening_hours?: Record<string, string>;
  content?: Partial<LocationContent>;
}

const EN = enData as Record<string, EnLoc>;

export function hasEnglish(slug: string | undefined): boolean {
  return !!slug && !!EN[slug];
}

// Tradução EN dos campos do local (nome, descrição, endereço, etc.).
export function localizeLocation(loc: Location, lang: Lang): Location {
  if (lang !== 'en') return loc;
  const t = EN[loc.slug];
  if (!t) return loc;
  return {
    ...loc,
    name: t.name ?? loc.name,
    short_description: t.short_description ?? loc.short_description,
    address: t.address ?? loc.address,
    neighborhood: t.neighborhood ?? loc.neighborhood,
    admission: t.admission ?? loc.admission,
    opening_hours: t.opening_hours ?? loc.opening_hours,
  };
}

// Tradução EN do conteúdo (história, curiosidades, dicas, como chegar).
export function localizeContent(
  slug: string | undefined,
  content: LocationContent,
  lang: Lang,
): LocationContent {
  if (lang !== 'en' || !slug) return content;
  const t = EN[slug]?.content;
  if (!t) return content;
  return {
    history: t.history ?? content.history,
    curiosities: t.curiosities ?? content.curiosities,
    practical_tips: t.practical_tips ?? content.practical_tips,
    how_to_get_there: t.how_to_get_there ?? content.how_to_get_there,
  };
}
