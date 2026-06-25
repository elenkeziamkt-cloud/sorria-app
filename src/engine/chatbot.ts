// Motor de busca do chatbot SorrIA — unificado (web + nativo), 100% offline.
//
// Lê a base direto dos JSON (16 intents + 16 locais), sem SQLite, então o
// comportamento é idêntico no navegador e no app. Pipeline:
//   normaliza → tokeniza (sem stopwords) → expande com sinônimos
//   → pontua intents + locais → ranqueia → resposta ou fallback inteligente.

import chatIntentsData from '../../seed/chat_intents.json';
import locationsData from '../../seed/locations.json';
import locationsEnData from '../../seed/locations.en.json';
import chatIntentsEnData from '../../seed/chat_intents.en.json';
import categoriesData from '../../seed/categories.json';
import stationsData from '../../seed/stations.json';
import {
  normalize, tokenize, expandQuery, conceptCategories, fuzzyEqual, similarity,
} from './searchText';

export interface ChatResponse {
  answer: string;
  relatedLocationSlug: string | null;
  confidence: 'high' | 'medium' | 'low';
}

// Intenção da pergunta — detectada ANTES de buscar, para dar resposta direta.
type QueryIntent = 'endereco' | 'transporte' | 'preco' | 'horario' | 'info';

// Sinais de cada intenção (ordem = prioridade). Frases batem por substring,
// tokens batem por palavra exata.
const INTENT_SIGNALS: { intent: QueryIntent; phrases: string[]; tokens: string[] }[] = [
  {
    intent: 'endereco',
    phrases: [
      // português — "onde fica" e variações
      'onde fica', 'onde e', 'onde esta', 'fica onde', 'fica aonde', 'onde que fica',
      'sabe onde fica', 'onde isso fica', 'onde aquilo fica', 'cade o', 'cade a',
      'poderia me informar onde fica', 'gostaria de saber onde fica',
      // endereço / localização
      'qual o endereco', 'qual e o endereco', 'que endereco', 'endereco de', 'qual endereco',
      'qual a localizacao', 'localizacao de', 'qual o local de', 'em qual endereco fica',
      'em que rua', 'em que rua fica', 'qual a rua', 'em que bairro fica',
      'qual o numero de', 'qual o cep de', 'em frente de', 'ao lado de',
      // proximidade
      'perto de onde fica', 'proximo de onde fica', 'fica perto de onde', 'tem perto de',
      // typos
      'ond fica', 'onde fika', 'ondefica',
      // inglês / espanhol
      'where is', 'where can i find', 'whats the address of', 'location of',
      'donde esta', 'donde queda', 'cual es la direccion de',
    ],
    tokens: ['endereco', 'enderecos', 'rua', 'avenida', 'localizacao', 'cep'],
  },
  {
    intent: 'transporte',
    phrases: ['como chegar', 'como chego', 'como ir', 'como faco', 'chegar ', 'perto d', 'proximo d', 'proxima d', 'mais perto', 'mais proxim', 'qual o caminho', 'como vou ate', 'preciso ir ate', 'how do i get to', 'como llego a'],
    tokens: ['estacao', 'estacoes', 'metro', 'vlt', 'onibus', 'bonde', 'bondinho', 'trem',
             'transporte', 'chegar', 'perto', 'proximo', 'proxima', 'locomover', 'baldeacao',
             'linha', 'linhas'],
  },
  {
    intent: 'preco',
    phrases: ['quanto custa', 'qual o preco', 'qual o valor', 'meia entrada', 'entrada franca'],
    tokens: ['preco', 'valor', 'ingresso', 'custa', 'custo', 'gratis', 'gratuito', 'gratuita',
             'meia', 'inteira', 'bilheteria', 'paga', 'pago'],
  },
  {
    intent: 'horario',
    phrases: ['que horas', 'quando abre', 'quando fecha', 'ate que horas', 'horario de funcionamento'],
    tokens: ['horario', 'horarios', 'hora', 'horas', 'abre', 'fecha', 'fechado', 'aberto',
             'funcionamento', 'visitacao'],
  },
];

function detectIntent(normQuery: string, qTokens: Set<string>): QueryIntent {
  for (const sig of INTENT_SIGNALS) {
    if (sig.phrases.some((p) => normQuery.includes(p))) return sig.intent;
    if (sig.tokens.some((t) => qTokens.has(t))) return sig.intent;
  }
  return 'info';
}

// Palavras dos gatilhos (endereço/transporte) que são "ruído" na hora de
// identificar QUAL é o local — removidas para isolar o nome do lugar.
const TRIGGER_NOISE = new Set([
  'endereco', 'enderecos', 'localizacao', 'local', 'rua', 'avenida', 'cep',
  'numero', 'bairro', 'frente', 'lado', 'perto', 'proximo', 'proxima', 'longe',
  'distancia', 'caminho', 'chegar', 'chego', 'locomover', 'baldeacao', 'informar',
  'saber', 'vou', 'ate', 'donde', 'queda', 'direccion', 'cual', 'location',
  'address', 'whats', 'find', 'llego', 'get',
]);

// ── Linhas do VLT (dados verificados — site oficial Motiva/VLT Carioca) ──
const VLT_LINE_INFO: Record<number, { color: string; colorEn: string; emoji: string; from: string; to: string }> = {
  1: { color: 'Azul',    colorEn: 'Blue',   emoji: '🔵', from: 'Santos Dumont', to: 'Terminal Gentileza' },
  2: { color: 'Verde',   colorEn: 'Green',  emoji: '🟢', from: 'Praça XV',      to: 'Praia Formosa' },
  3: { color: 'Amarela', colorEn: 'Yellow', emoji: '🟡', from: 'Santos Dumont', to: 'Central' },
  4: { color: 'Laranja', colorEn: 'Orange', emoji: '🟠', from: 'Praça XV',      to: 'Terminal Gentileza' },
};

// "Linha 1 (Azul)" / "Line 1 (Blue)" — ou lista com "e"/"and"
function linesLabel(lines: number[]): string {
  const parts = lines.map((n) => {
    const i = VLT_LINE_INFO[n];
    return `${n}${i ? ` (${tt(i.color, i.colorEn)})` : ''}`;
  });
  if (parts.length === 0) return '';
  if (parts.length === 1) return `${tt('Linha', 'Line')} ${parts[0]}`;
  return `${tt('Linhas', 'Lines')} ${parts.slice(0, -1).join(', ')} ${tt('e', 'and')} ${parts[parts.length - 1]}`;
}

function listVltLines(): string {
  const rows = [1, 2, 3, 4].map((n) => {
    const i = VLT_LINE_INFO[n];
    return `- ${i.emoji} **${tt('Linha', 'Line')} ${n} (${tt(i.color, i.colorEn)}):** ${i.from} ↔ ${i.to}`;
  });
  return [
    tt('**Linhas do VLT Carioca:**', '**VLT Carioca (tram) lines:**'),
    '',
    ...rows,
    '',
    tt(
      'Funciona todos os dias, das 5h às 23h · Tarifa R$ 5,00 (valores sujeitos a reajuste).',
      'Runs every day, 5am–11pm · Fare R$ 5.00 (prices subject to change).',
    ),
  ].join('\n');
}

// ── Estações (para achar a mais próxima e listar por bairro) ──
interface StationIdx { name: string; lat: number; lng: number; lines: number[]; neighborhood: string }
const STATIONS: StationIdx[] = (stationsData as any[])
  .filter((s) => typeof s.lat === 'number' && typeof s.lng === 'number')
  .map((s) => ({
    name: s.name,
    lat: s.lat,
    lng: s.lng,
    lines: Array.isArray(s.lines) ? s.lines : (s.line_id ? [s.line_id] : []),
    neighborhood: s.neighborhood ?? '',
  }));

// Bairros atendidos (para "quais estações passam pela [bairro]")
const AREAS: { key: string; label: string }[] = [
  { key: 'gamboa',        label: 'Gamboa' },
  { key: 'saude',         label: 'Saúde' },
  { key: 'santo cristo',  label: 'Santo Cristo' },
  { key: 'sao cristovao', label: 'São Cristóvão' },
  { key: 'centro',        label: 'Centro' },
];

function stationsByArea(normQuery: string): string | null {
  for (const a of AREAS) {
    if (normQuery.includes(a.key)) {
      const matches = STATIONS.filter((s) => normalize(s.neighborhood).includes(a.key));
      if (matches.length) {
        const list = matches.map((s) => `- **${s.name}** — ${linesLabel(s.lines)}`);
        return [tt(`**Estações do VLT em ${a.label}:**`, `**VLT stations in ${a.label}:**`), '', ...list].join('\n');
      }
    }
  }
  return null;
}

// Distância em metros (Haversine).
function distMeters(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

function nearestStations(lat: number, lng: number, n = 2): (StationIdx & { dist: number })[] {
  return STATIONS.map((s) => ({ ...s, dist: distMeters(lat, lng, s.lat, s.lng) }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, n);
}

// ── Pesos de pontuação de LOCAIS ──
const W_NAME   = 6; // nome do local presente (fuzzy) na pergunta
const W_CAT    = 2; // conceito casou com a categoria
const THRESHOLD = 3; // confiança mínima para identificar um local

// category_id → slug
const CAT_SLUG: Record<number, string> = Object.fromEntries(
  (categoriesData as any[]).map((c) => [c.id, c.slug]),
);

// Dados em inglês por slug — usados para ENTENDER perguntas em inglês
// (nome e descrição em EN entram no índice de busca, junto com os termos em PT).
const EN_LOC = locationsEnData as Record<string, {
  name?: string; short_description?: string; neighborhood?: string;
  address?: string; admission?: string;
  opening_hours?: Record<string, string>;
  content?: { history?: string; how_to_get_there?: string };
}>;

// Idioma da resposta — definido no início de queryChatbot. Como as perguntas
// são processadas uma de cada vez, uma variável de módulo é suficiente e evita
// passar `lang` por todas as funções de composição.
type Lang = 'pt' | 'en';
let LANG: Lang = 'pt';
const tt = (pt: string, en: string) => (LANG === 'en' ? en : pt);

// Respostas dos intents em inglês, por slug (vazio cai no PT).
const EN_INTENT = chatIntentsEnData as Record<string, string>;

// Proporção das palavras de um nome presentes na pergunta (fuzzy).
function nameRatioFor(words: string[], userWords: string[]): number {
  if (words.length === 0) return 0;
  const hit = words.filter((nw) => userWords.some((u) => fuzzyEqual(u, nw))).length;
  return hit / words.length;
}

// ── Índice de intents (busca por similaridade) ──
interface IntentIndex {
  answer: string;
  answerEn: string;        // resposta em inglês (vazia cai no PT)
  slug: string | null;
  category: string;
  topic: string;           // rótulo curto para o aviso de confiança média
  variations: string[][];  // question_variations + question_example, já tokenizados
  keywordWords: string[];  // todas as keywords tokenizadas (1 lista)
}

const INTENTS: IntentIndex[] = (chatIntentsData as any[]).map((i) => {
  const keys: string[] = Array.isArray(i.keywords)
    ? i.keywords
    : JSON.parse(i.keywords || '[]');
  const rawVariations: string[] = [
    ...(Array.isArray(i.question_variations) ? i.question_variations : []),
    i.question_example ?? '',
  ].filter(Boolean);
  return {
    answer: i.answer,
    answerEn: EN_INTENT[i.slug] ?? '',
    slug: i.related_location_slug ?? null,
    category: i.category ?? '',
    topic: keys[0] ?? i.category ?? 'esse assunto',
    variations: rawVariations.map((v) => tokenize(v)),
    keywordWords: keys.flatMap((k: string) => tokenize(k)),
  };
});

// ── Índice de locais ──
interface LocIndex {
  name: string;
  slug: string;
  short: string;
  address: string;
  neighborhood: string;
  categorySlug: string;
  history: string;
  admission: string;
  howToGet: string;
  website: string;
  openingHours: Record<string, string>;
  lat: number | null;
  lng: number | null;
  nameNorm: string;
  nameNormEn: string;      // nome em inglês normalizado (substring match)
  nameWords: string[];     // palavras do nome (para casamento fuzzy)
  nameWordsEn: string[];   // palavras do nome em inglês (perguntas em EN)
  tokenWords: string[];    // nome + descrição + bairro + categoria (PT e EN, fuzzy)
  variations: string[][];  // question_variations do local, tokenizadas
  // versões em inglês (para RESPONDER em EN) — vazias caem no PT
  nameEn: string; shortEn: string; addressEn: string; neighborhoodEn: string;
  historyEn: string; admissionEn: string; howToGetEn: string;
  openingHoursEn: Record<string, string> | null;
}

const LOCATIONS: LocIndex[] = (locationsData as any[]).map((l) => {
  const categorySlug = CAT_SLUG[l.category_id] ?? '';
  const en = EN_LOC[l.slug];
  const tokenWords = [...new Set<string>([
    ...tokenize(l.name),
    ...tokenize(l.short_description ?? ''),
    ...tokenize(l.neighborhood ?? ''),
    ...tokenize(categorySlug),
    // termos em inglês — permitem entender perguntas em EN
    ...tokenize(en?.name ?? ''),
    ...tokenize(en?.short_description ?? ''),
  ])];
  return {
    name: l.name,
    slug: l.slug,
    short: l.short_description ?? '',
    address: l.address ?? '',
    neighborhood: l.neighborhood ?? '',
    categorySlug,
    history: l.content?.history ?? '',
    admission: l.admission ?? '',
    howToGet: l.content?.how_to_get_there ?? '',
    website: l.website ?? '',
    openingHours: (l.opening_hours && typeof l.opening_hours === 'object') ? l.opening_hours : {},
    lat: typeof l.lat === 'number' ? l.lat : null,
    lng: typeof l.lng === 'number' ? l.lng : null,
    nameNorm: normalize(l.name),
    nameNormEn: en?.name ? normalize(en.name) : '',
    nameWords: tokenize(l.name),
    nameWordsEn: en?.name ? tokenize(en.name) : [],
    tokenWords,
    variations: (Array.isArray(l.question_variations) ? l.question_variations : []).map(tokenize),
    nameEn: en?.name ?? '',
    shortEn: en?.short_description ?? '',
    addressEn: en?.address ?? '',
    neighborhoodEn: en?.neighborhood ?? '',
    historyEn: en?.content?.history ?? '',
    admissionEn: en?.admission ?? '',
    howToGetEn: en?.content?.how_to_get_there ?? '',
    openingHoursEn: (en?.opening_hours && typeof en.opening_hours === 'object') ? en.opening_hours : null,
  };
});

// Visão do local no idioma atual (EN cai para PT quando faltar tradução).
interface LocView {
  slug: string; name: string; short: string; address: string; neighborhood: string;
  history: string; admission: string; howToGet: string;
  openingHours: Record<string, string>; website: string;
  lat: number | null; lng: number | null;
}
function viewOf(loc: LocIndex): LocView {
  const en = LANG === 'en';
  return {
    slug: loc.slug,
    name: (en && loc.nameEn) || loc.name,
    short: (en && loc.shortEn) || loc.short,
    address: (en && loc.addressEn) || loc.address,
    neighborhood: (en && loc.neighborhoodEn) || loc.neighborhood,
    history: (en && loc.historyEn) || loc.history,
    admission: (en && loc.admissionEn) || loc.admission,
    howToGet: (en && loc.howToGetEn) || loc.howToGet,
    openingHours: (en && loc.openingHoursEn) ? loc.openingHoursEn : loc.openingHours,
    website: loc.website,
    lat: loc.lat, lng: loc.lng,
  };
}

// ── Respostas padrão por confiança (níveis do plano) ──
// Texto PADRÃO para quando não há resposta — acolhedor, apologético e com
// sugestões do que perguntar. Reaproveitado em todos os fallbacks.
function defaultLow(): string {
  return tt(
    'Desculpe, ainda não tenho essa informação. 🌊\n\n' +
    'Sou o guia da **Região Portuária do Rio** — fique à vontade para perguntar sobre ela:\n' +
    '- 🏛️ **Museus e pontos turísticos** — Museu do Amanhã, MAR, AquaRio…\n' +
    '- ⛪ **Igrejas e patrimônio** — Candelária, Cais do Valongo, Mosteiro de São Bento…\n' +
    '- 🎭 **Cultura e história** da Região Portuária\n' +
    '- 🍽️ **Gastronomia** — bares e restaurantes da Saúde e da Gamboa\n' +
    '- 🚊 **VLT e transporte** — linhas, estações e como chegar\n' +
    '- 🎟️ **Horários e preços** dos locais\n' +
    '- 💚 **Gamboa Ação** e o Projeto SorrIA\n\n' +
    'É só escrever o nome de um lugar ou o que você quer saber que eu te ajudo. 😊',
    "Sorry, I don't have that information yet. 🌊\n\n" +
    "I'm the guide to the **Port District of Rio** — feel free to ask me about:\n" +
    '- 🏛️ **Museums and sights** — Museum of Tomorrow, MAR, AquaRio…\n' +
    '- ⛪ **Churches and heritage** — Candelária, Valongo Wharf, Monastery of São Bento…\n' +
    '- 🎭 **Culture and history** of the Port District\n' +
    '- 🍽️ **Food & drink** — bars and restaurants in Saúde and Gamboa\n' +
    '- 🚊 **Tram (VLT) and transport** — lines, stations and how to get there\n' +
    '- 🎟️ **Opening hours and prices** of the places\n' +
    '- 💚 **Gamboa Ação** and the SorrIA Project\n\n' +
    "Just type the name of a place or what you want to know and I'll help. 😊",
  );
}

function mediumPrefix(intent: IntentIndex): string {
  return tt(
    `Não tenho certeza, mas talvez você queira saber sobre **${intent.topic}**. Se não for isso, tente reformular a pergunta. 🌊\n\n`,
    `I'm not sure, but maybe you want to know about **${intent.topic}**. If not, try rephrasing your question. 🌊\n\n`,
  );
}

// Resposta de um intent no idioma atual (EN cai para PT se faltar answer_en).
function intentAnswer(i: IntentIndex): string {
  return (LANG === 'en' && i.answerEn) ? i.answerEn : i.answer;
}

export async function queryChatbot(userMessage: string, lang: Lang = 'pt'): Promise<ChatResponse> {
  LANG = lang;
  const { original, synonyms, concepts } = expandQuery(userMessage);
  const normQuery = normalize(userMessage);
  const cats = conceptCategories(concepts);
  const qIntent = detectIntent(normQuery, original);

  const userWords = [...original];
  const userWordsExpanded = [...new Set<string>([...original, ...synonyms])];

  // Atalho: pergunta explícita sobre as linhas do VLT (PT/EN), antes do ranqueamento.
  if (
    normQuery.includes('linhas do vlt') ||
    normQuery.includes('vlt lines') ||
    normQuery.includes('tram lines')
  ) {
    return { answer: finalize(listVltLines()), relatedLocationSlug: null, confidence: 'high' };
  }

  // ── Pontua locais com fuzzy (precisa identificar o alvo antes de decidir) ──
  let bestLoc: { score: number; item: LocIndex | null } = { score: 0, item: null };
  for (const loc of LOCATIONS) {
    let s = 0;
    // Nome (fuzzy): maior proporção entre o nome em PT e o nome em EN
    const rPt = nameRatioFor(loc.nameWords, userWordsExpanded);
    const rEn = nameRatioFor(loc.nameWordsEn, userWordsExpanded);
    const ratio = Math.max(rPt, rEn);
    const nameLen = rEn > rPt ? loc.nameWordsEn.length : loc.nameWords.length;
    if (ratio === 1) s += W_NAME;
    else if (ratio >= 0.5 && nameLen >= 2) s += 4;
    // Nome presente como substring (PT ou EN)
    if (loc.nameNorm.length > 4 && normQuery.includes(loc.nameNorm)) s += W_NAME;
    else if (loc.nameNormEn.length > 4 && normQuery.includes(loc.nameNormEn)) s += W_NAME;
    for (const u of userWordsExpanded) if (loc.tokenWords.some((t) => fuzzyEqual(u, t))) s += 1;
    if (loc.categorySlug && cats.has(loc.categorySlug)) s += W_CAT;
    if (s > bestLoc.score) bestLoc = { score: s, item: loc };
  }

  // ── Similaridade sobre as question_variations dos LOCAIS ──
  let locVarBest: { score: number; item: LocIndex | null } = { score: 0, item: null };
  for (const loc of LOCATIONS) {
    if (loc.variations.length === 0) continue;
    let s = 0;
    for (const v of loc.variations) {
      const sc = similarity(userWords, v);
      if (sc > s) s = sc;
    }
    if (s > locVarBest.score) locVarBest = { score: s, item: loc };
  }

  // ── Matcher por SIMILARIDADE (fuzzy) sobre as intents ──
  let simBest: { score: number; item: IntentIndex | null } = { score: 0, item: null };
  for (const intent of INTENTS) {
    let s = 0;
    for (const v of intent.variations) {
      const sc = similarity(userWords, v);
      if (sc > s) s = sc;
    }
    const kc = similarity(userWords, intent.keywordWords);
    if (kc > s) s = kc;
    if (s > simBest.score) simBest = { score: s, item: intent };
  }

  // Local-alvo para respostas diretas (endereço/transporte/preço/horário).
  // Remove o "ruído" dos gatilhos e identifica o local por nome (fuzzy) OU
  // por similaridade das variações — robusto a "onde fica o ccbb", "donde queda el ccbb".
  const placeWords = userWords.filter((w) => !TRIGGER_NOISE.has(w));
  const idWords = placeWords.length ? placeWords : userWords;
  let targetLoc: LocIndex | null = null;
  {
    let best = 0;
    for (const loc of LOCATIONS) {
      const nameRatio = Math.max(
        nameRatioFor(loc.nameWords, idWords),
        nameRatioFor(loc.nameWordsEn, idWords),
      );
      let vs = 0;
      for (const v of loc.variations) {
        const c = similarity(idWords, v);
        if (c > vs) vs = c;
      }
      const score = Math.max(nameRatio, vs);
      if (score > best) { best = score; targetLoc = loc; }
    }
    if (best < 0.6) targetLoc = null; // exige boa confiança de que é aquele local
  }

  // Fallback: se não achou o local pelo nome, mas uma intent forte aponta para
  // um local relacionado (ex.: "where is the museum of tomorrow"), usa esse local.
  const sbItem = simBest.item;
  if (!targetLoc && qIntent !== 'info' && sbItem && simBest.score >= 0.6 && sbItem.slug) {
    targetLoc = LOCATIONS.find((l) => l.slug === sbItem.slug) ?? null;
  }

  // ── PERGUNTAS GERAIS DE VLT (sem local específico) ──
  if (qIntent === 'transporte' && bestLoc.score < THRESHOLD) {
    // "Quais são as linhas do VLT?" / "what are the VLT lines?" / "tram lines"
    if (
      normQuery.includes('linhas do vlt') ||
      /quais.*linhas/.test(normQuery) ||
      (normQuery.includes('linha') && normQuery.includes('vlt')) ||
      (normQuery.includes('line') && (normQuery.includes('vlt') || normQuery.includes('tram')))
    ) {
      return { answer: finalize(listVltLines()), relatedLocationSlug: null, confidence: 'high' };
    }
    // "Quais estações passam pela [bairro]?" / "stations in [area]"
    if (normQuery.includes('estaca') || normQuery.includes('station')) {
      const byArea = stationsByArea(normQuery);
      if (byArea) return { answer: finalize(byArea), relatedLocationSlug: null, confidence: 'high' };
    }
  }

  // ── RESPOSTA DIRETA POR INTENÇÃO ──
  // Pergunta sobre endereço/transporte/preço/horário de um local identificado →
  // responde SÓ sobre isso (a 1ª linha já traz a informação pedida).
  if (qIntent !== 'info' && targetLoc) {
    const targeted =
      qIntent === 'endereco'   ? composeAddress(targetLoc)
      : qIntent === 'transporte' ? composeTransport(targetLoc)
      : qIntent === 'preco'    ? composePrice(targetLoc)
      : qIntent === 'horario'  ? composeHours(targetLoc)
      : null;
    if (targeted) {
      return { answer: targeted, relatedLocationSlug: targetLoc.slug, confidence: 'high' };
    }
  }

  // ── DECISÃO (limiares do plano: 60% / 40%) ──
  // Confiança alta: vence a maior similaridade entre intent e local.
  if (locVarBest.item && locVarBest.score >= 0.6 && locVarBest.score >= simBest.score) {
    return {
      answer: composeLocation(locVarBest.item),
      relatedLocationSlug: locVarBest.item.slug,
      confidence: 'high',
    };
  }
  if (simBest.item && simBest.score >= 0.6) {
    return { answer: finalize(intentAnswer(simBest.item)), relatedLocationSlug: simBest.item.slug, confidence: 'high' };
  }

  // Local identificado por nome/tokens
  if (bestLoc.item && bestLoc.score >= THRESHOLD) {
    return {
      answer: composeLocation(bestLoc.item),
      relatedLocationSlug: bestLoc.item.slug,
      confidence: bestLoc.score >= 6 ? 'high' : 'medium',
    };
  }

  // Confiança média
  if (locVarBest.item && locVarBest.score >= 0.4 && locVarBest.score >= simBest.score) {
    return {
      answer: composeLocation(locVarBest.item),
      relatedLocationSlug: locVarBest.item.slug,
      confidence: 'medium',
    };
  }
  if (simBest.item && simBest.score >= 0.4) {
    return {
      answer: finalize(mediumPrefix(simBest.item) + intentAnswer(simBest.item)),
      relatedLocationSlug: simBest.item.slug,
      confidence: 'medium',
    };
  }

  // Pergunta de localização sem local identificado → "não encontrei" + sugestões.
  if (qIntent === 'endereco') {
    return { answer: locationNotFound(suggestLocations(idWords)), relatedLocationSlug: null, confidence: 'low' };
  }

  return { answer: defaultLow(), relatedLocationSlug: null, confidence: 'low' };
}

// ── Avisos obrigatórios: dados sujeitos a alteração ──
function changeNote(): string {
  return tt(
    '\n\n⚠️ Horários, preços e funcionamento podem sofrer alterações. Recomendamos confirmar diretamente com o local antes de visitar.',
    '\n\n⚠️ Opening hours, prices and operations may change. We recommend confirming directly with the venue before visiting.',
  );
}
function addrNote(): string {
  return tt(
    '\n\n⚠️ Confirme o endereço e funcionamento antes de visitar, pois informações podem ter mudado.',
    '\n\n⚠️ Confirm the address and operation before visiting, as the information may have changed.',
  );
}
function hoursPriceNote(v: LocView): string {
  const site = v.website
    ? tt(` ou acesse o site oficial: ${v.website}`, ` or visit the official website: ${v.website}`)
    : '';
  return tt(
    '\n\n⚠️ Atenção: estas informações são baseadas nos dados disponíveis e podem ter sido alteradas. Confirme com o local antes de visitar' + site + '.',
    '\n\n⚠️ Note: this information is based on available data and may have changed. Confirm with the venue before visiting' + site + '.',
  );
}
// Anexa o aviso geral a qualquer resposta com horário, preço ou endereço (PT/EN).
function finalize(a: string): string {
  if (!a || a.includes('⚠️')) return a;
  const volatile = /\d\s*h\b|\dh\d|hor[áa]rio|hours?\b|r\$|pre[çc]o|price|ingresso|ticket|entrada|admission|\bfree\b|tarifa|fare|\brua\b|\bstreet\b|avenida|\bav\.|endere[çc]o|address|aberto|\bopen\b|fecha|clos|funciona/i.test(a);
  return volatile ? a + changeNote() : a;
}

// ── Respostas diretas e objetivas (uma intenção por resposta) ──

function composeTransport(loc: LocIndex): string | null {
  const v = viewOf(loc);
  const lines: string[] = [`**${tt('Como chegar', 'How to get there')} — ${v.name}**`, ''];

  if (v.howToGet) lines.push(v.howToGet, '');

  if (v.lat !== null && v.lng !== null) {
    const near = nearestStations(v.lat, v.lng, 2);
    const s0 = near[0];
    if (s0) {
      const ll = s0.lines.length ? ` — ${linesLabel(s0.lines)}` : '';
      lines.push(`🚉 ${tt('Estação de VLT mais próxima', 'Nearest tram (VLT) station')}: **${s0.name}** (≈ ${s0.dist} m)${ll}`);
      const s1 = near[1];
      if (s1 && s1.dist <= 700) {
        const l1 = s1.lines.length ? ` — ${linesLabel(s1.lines)}` : '';
        lines.push(`   ${tt('Também perto', 'Also nearby')}: ${s1.name} (≈ ${s1.dist} m)${l1}`);
      }
    }
  }

  const out = lines.join('\n').trim();
  // Se não tem nem texto nem estação, deixa o fluxo normal responder.
  if (!(v.howToGet || STATIONS.length > 0)) return null;
  return out + addrNote();
}

// Locais com nome mais parecido (fuzzy) com a pergunta — para sugerir
// quando o usuário pede um endereço que não achamos.
function suggestLocations(words: string[], n = 3): string[] {
  return LOCATIONS
    .map((l) => {
      const matched = l.nameWords.filter((nw) => words.some((u) => fuzzyEqual(u, nw))).length;
      return { name: viewOf(l).name, ratio: l.nameWords.length ? matched / l.nameWords.length : 0 };
    })
    .filter((x) => x.ratio > 0)
    .sort((a, b) => b.ratio - a.ratio)
    .slice(0, n)
    .map((x) => x.name);
}

function locationNotFound(names: string[]): string {
  // Achou nomes parecidos → sugere; senão, usa o texto padrão de "sem resposta".
  if (names.length) {
    const list = names.map((nm) => `- ${nm}`).join('\n');
    return tt(
      'Desculpe, ainda não tenho esse local no meu guia. 🌊\n\nVocê quis dizer:\n' + list +
        '\n\nSe não for nenhum desses, pode perguntar sobre museus, igrejas, história, gastronomia, VLT ou a Gamboa Ação que eu te ajudo. 😊',
      "Sorry, I don't have that place in my guide yet. 🌊\n\nDid you mean:\n" + list +
        "\n\nIf it's none of these, you can ask about museums, churches, history, food & drink, the tram (VLT) or Gamboa Ação. 😊",
    );
  }
  return defaultLow();
}

function composeAddress(loc: LocIndex): string | null {
  const v = viewOf(loc);
  if (!v.address && !v.neighborhood) return null;
  const local = v.address || v.neighborhood;
  const lines: string[] = [`📍 ${tt('Endereço', 'Address')}: ${local}`];
  if (v.lat !== null && v.lng !== null) {
    const near = nearestStations(v.lat, v.lng, 1)[0];
    if (near) {
      const ll = near.lines.length ? ` (${linesLabel(near.lines)})` : '';
      lines.push('', `🚉 ${tt('Estação de VLT mais próxima', 'Nearest tram (VLT) station')}: ${near.name} — ≈ ${near.dist} m${ll}.`);
    }
  }
  return lines.join('\n') + addrNote();
}

function composePrice(loc: LocIndex): string | null {
  const v = viewOf(loc);
  if (!v.admission) return null;
  const lines: string[] = [`🎟️ ${tt('Entrada', 'Admission')}: ${v.admission}`];
  const oh = Object.entries(v.openingHours).filter(([k]) => k !== 'obs' && k !== 'note');
  if (oh.length) lines.push(`⏰ ${tt('Horário', 'Hours')}: ${oh.map(([k, val]) => `${k} ${val}`).join(' · ')}`);
  return `**${tt('Ingressos', 'Tickets')} — ${v.name}**\n\n` + lines.join('\n') + hoursPriceNote(v);
}

function composeHours(loc: LocIndex): string | null {
  const v = viewOf(loc);
  const entries = Object.entries(v.openingHours);
  if (entries.length === 0) return null;
  const lines: string[] = [`⏰ ${tt('Horário', 'Opening hours')} — ${v.name}`, ''];
  for (const [k, val] of entries) {
    if (k === 'obs' || k === 'note') lines.push(`ℹ️ ${val}`);
    else lines.push(`🕐 ${k}: ${val}`);
  }
  if (v.admission) lines.push('', `🎟️ ${tt('Entrada', 'Admission')}: ${v.admission}`);
  return lines.join('\n') + hoursPriceNote(v);
}

// Resposta natural montada a partir dos dados do local.
function composeLocation(loc: LocIndex): string {
  const v = viewOf(loc);
  const parts: string[] = [`**${v.name}**`, '', v.short];

  if (v.history) {
    const snippet =
      v.history.length > 360 ? v.history.slice(0, 360).trimEnd() + '…' : v.history;
    parts.push('', snippet);
  }

  const footer: string[] = [];
  if (v.neighborhood) footer.push(`📍 ${v.neighborhood}`);
  if (v.admission) footer.push(v.admission);
  if (footer.length) parts.push('', footer.join(' · '));

  return parts.join('\n') + changeNote();
}
