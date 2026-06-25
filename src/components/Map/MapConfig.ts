// Centro da Zona Portuária do Rio de Janeiro
export const RIO_PORT_CENTER = {
  lat: -22.897,
  lng: -43.177,
};

export const MAP_ZOOM_INITIAL = 13.5;
export const MAP_ZOOM_MIN     = 11;
export const MAP_ZOOM_MAX     = 19;

// Bounds que cobrem toda a Região Portuária + Centro histórico
export const RIO_PORT_BOUNDS = {
  ne: [-43.140, -22.880],  // nordeste
  sw: [-43.210, -22.930],  // sudoeste
} as const;

// Estilo gratuito do OpenFreeMap — sem API key, sem limite de uso
// "liberty" = estilo rico com relevo e detalhes urbanos
export const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

// Cores dos marcadores por categoria (mesmas do categories.json)
export const CATEGORY_COLORS: Record<string, string> = {
  museu:        '#7C3AED',
  igreja:       '#B45309',
  praca:        '#059669',
  patrimonio:   '#DC2626',
  cultura:      '#2563EB',
  gastronomia:  '#D97706',
  estacao_vlt:  '#0891B2',
  estacao_trem: '#4F46E5',
  aquario:      '#0284C7',
  bairro:       '#16A34A',
  teatro:       '#9333EA',
  biblioteca:   '#0F766E',
};

export const CATEGORY_EMOJIS: Record<string, string> = {
  museu:        '🏛️',
  igreja:       '⛪',
  praca:        '🌳',
  patrimonio:   '🏰',
  cultura:      '🎭',
  gastronomia:  '☕',
  estacao_vlt:  '🚋',
  estacao_trem: '🚂',
  aquario:      '🐠',
  bairro:       '🏘️',
  teatro:       '🎼',
  biblioteca:   '📚',
};
