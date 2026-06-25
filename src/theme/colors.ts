export const colors = {

  // ─── CORES PRINCIPAIS DA MARCA ───────────────────
  primary:          '#2B6CB0',  // Azul SorrIA (cor dominante)
  primaryDark:      '#1A4A80',  // Azul escuro (hover, pressed)
  primaryLight:     '#4A90D9',  // Azul claro (ícones suaves)
  primaryBg:        '#EBF4FF',  // Azul bem claro (fundo de badges)

  secondary:        '#f7a706',  // Dourado (sol do logo, botão enviar)
  secondaryDark:    '#D4891A',  // Dourado escuro (hover)
  secondaryLight:   '#FFD166',  // Dourado suave (detalhes)
  secondaryBg:      '#FFF8EB',  // Dourado quase branco

  accent:           '#E8602C',  // Laranja Gamboa Ação (ações principais)
  accentDark:       '#C44E1F',  // Laranja escuro (hover)
  accentLight:      '#FF8A50',  // Laranja claro
  accentBg:         '#FFF0EB',  // Laranja quase branco

  // ─── FUNDOS ──────────────────────────────────────
  background:       '#F5F0E8',  // Bege creme (fundo padrão do app)
  surface:          '#FFFFFF',  // Branco (cards, modais, inputs)
  surfaceAlt:       '#EDE8DF',  // Bege mais escuro (divisores, hover)

  // ─── TEXTOS ──────────────────────────────────────
  textDark:         '#1A202C',  // Títulos e texto principal
  textMedium:       '#4A5568',  // Texto secundário
  textLight:        '#718096',  // Texto de apoio, placeholders
  textOnPrimary:    '#FFFFFF',  // Texto sobre fundo azul
  textOnSecondary:  '#1A202C',  // Texto sobre fundo dourado
  textOnAccent:     '#FFFFFF',  // Texto sobre laranja

  // ─── BORDAS ──────────────────────────────────────
  border:           '#DDD8CE',  // Borda padrão (sobre bege)
  borderStrong:     '#2B6CB0',  // Borda de destaque (azul)

  // ─── CHAT ────────────────────────────────────────
  bubbleUser:       '#2B6CB0',  // Balão do usuário (azul)
  bubbleUserText:   '#FFFFFF',  // Texto do balão usuário
  bubbleBot:        '#FFFFFF',  // Balão do SorrIA (branco)
  bubbleBotText:    '#1A202C',  // Texto do balão SorrIA
  bubbleBotBorder:  '#2B6CB0',  // Borda do balão SorrIA (azul)

  // ─── STATUS ──────────────────────────────────────
  success:          '#38A169',  // Verde só para status de sucesso
  error:            '#E53E3E',  // Vermelho só para erros
  warning:          '#f7a706',  // Amarelo só para avisos

  // ─── SKELETON ────────────────────────────────────
  skeleton:         '#DDD8CE',  // Cor base do skeleton loading
  skeletonShimmer:  '#EDE8DF',  // Cor do shimmer animado

} as const;

// ─── PALETA EXCLUSIVA DA HOME (fundo azul "portal de entrada") ───
// Usada SOMENTE na tela Home; as demais telas seguem a paleta bege padrão.
export const homeColors = {
  background:          '#2B6CB0',            // Azul vibrante (fundo da home)
  backgroundDark:      '#1A4A80',            // Azul escuro (gradiente, seções)

  textPrimary:         '#FFFFFF',
  textSecondary:       'rgba(255,255,255,0.80)',
  textMuted:           'rgba(255,255,255,0.60)',

  cardBg:              '#FFFFFF',
  cardBorder:          'rgba(255,255,255,0.20)',
  cardShadow:          'rgba(0,0,0,0.15)',

  buttonPrimary:       '#E8602C',            // Laranja Gamboa Ação ("Pergunte ao SorrIA")
  buttonPrimaryText:   '#FFFFFF',
  buttonSecondary:     '#FFFFFF',
  buttonSecondaryText: '#2B6CB0',

  highlight:           '#f7a706',            // Dourado (card destaque, "IA")
  highlightLight:      '#FFD166',

  sectionAlt:          '#1A4A80',            // Seção "Sobre" no final da home

  footerBg:            '#FFFFFF',
  footerText:          '#4A5568',
  footerLink:          '#E8602C',
} as const;

// ─── PADRÃO DE ÍCONE + COR POR CATEGORIA ───────────
// Fonte única (emoji = offline, sem dependência). Usado na Explorar,
// nos cards e reaproveitável no resto do app.
export const categoryMeta: Record<string, { icon: string; color: string }> = {
  // ── cores extraídas da paleta oficial (imagem) ──
  biblioteca:   { icon: '📚', color: '#0E9C92' },  // teal
  museu:        { icon: '🖼️', color: '#F47B3D' },  // laranja
  praca:        { icon: '🌳', color: '#8DC63F' },  // verde-limão
  cultura:      { icon: '🎨', color: '#C71F86' },  // magenta
  patrimonio:   { icon: '🏛️', color: '#5BC6E8' },  // azul-céu
  gastronomia:  { icon: '🍽️', color: '#9C2B28' },  // vermelho-tijolo
  igreja:       { icon: '⛪',  color: '#5E7EB8' },  // azul-pervinca
  // ── demais categorias (não constam na imagem) — tons distintos ──
  teatro:       { icon: '🎭', color: '#9333EA' },  // roxo
  estacao_vlt:  { icon: '🚊', color: '#0891B2' },  // ciano
  estacao_trem: { icon: '🚆', color: '#4F46E5' },  // índigo
  aquario:      { icon: '🐠', color: '#0284C7' },  // azul-mar
  bairro:       { icon: '🗺️', color: '#16A34A' },  // verde
  ong:          { icon: '🤝', color: '#E11D48' },  // rosa
  lazer:        { icon: '🎡', color: '#DB2777' },  // magenta-claro
  saude:        { icon: '🏥', color: '#EF4444' },  // vermelho (saúde)
  publico:      { icon: '⚖️', color: '#475569' },  // cinza-ardósia (órgão público)
  default:      { icon: '📍', color: '#2B6CB0' },  // azul da marca
};

export function metaForCategory(slug?: string) {
  return (slug && categoryMeta[slug]) || categoryMeta.default;
}
