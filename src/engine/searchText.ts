// Pipeline de processamento de texto para a busca do SorrIA.
// Compartilhado pelo chatbot (web + nativo). 100% offline.

import { SYNONYMS, CONCEPT_CATEGORIES } from './synonyms';

// Palavras irrelevantes (artigos, pronomes, saudações, genéricos).
// Tokens com 2 letras ou menos já são descartados na tokenização,
// então aqui ficam só os de 3+ letras que precisam ser ignorados.
export const STOPWORDS = new Set([
  // perguntas / conectivos
  'que', 'qual', 'quais', 'como', 'onde', 'quando', 'porque', 'fica', 'ficam',
  'sao', 'seu', 'sua', 'suas', 'seus', 'uma', 'uns', 'umas', 'para', 'pra',
  'por', 'com', 'sem', 'dos', 'das', 'nos', 'nas', 'aos', 'sobre', 'mais',
  'menos', 'tem', 'ter', 'tenho', 'pode', 'posso', 'quero', 'queria',
  'gostaria', 'isso', 'esse', 'essa', 'este', 'esta', 'isto', 'aqui', 'ali',
  'tudo', 'todo', 'toda', 'muito', 'muita', 'bem', 'bom', 'boa', 'dia', 'vez',
  'agora', 'hoje', 'algum', 'alguma', 'alguns', 'algumas', 'algo', 'coisa',
  'coisas', 'lugar', 'lugares', 'voce', 'meu', 'minha', 'nao', 'sim',
  // saudações / cortesia
  'oi', 'ola', 'opa', 'obrigado', 'obrigada', 'valeu', 'favor',
  // inglês comum
  'the', 'what', 'where', 'when', 'which', 'how', 'does', 'are', 'and', 'for',
  'with', 'about', 'this', 'that', 'you', 'your', 'can', 'want', 'need',
]);

// Minúsculas, remove acentos, mantém só letras/números/espaço.
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // tira diacríticos (café → cafe)
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Quebra em tokens significativos (sem stopwords, 3+ letras).
export function tokenize(text: string): string[] {
  return normalize(text)
    .split(' ')
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

// ── Índices invertidos do dicionário (construídos uma vez) ──
const SINGLE_TERM = new Map<string, string[]>();          // palavra → conceitos
const MULTI_TERM: { term: string; concepts: string[] }[] = []; // frase → conceitos

for (const [concept, terms] of Object.entries(SYNONYMS)) {
  for (const term of terms) {
    const n = normalize(term);
    if (n.includes(' ')) {
      MULTI_TERM.push({ term: n, concepts: [concept] });
    } else {
      const arr = SINGLE_TERM.get(n);
      if (arr) arr.push(concept);
      else SINGLE_TERM.set(n, [concept]);
    }
  }
}

export interface ExpandResult {
  original: Set<string>;  // tokens significativos digitados pelo usuário
  synonyms: Set<string>;  // tokens adicionados pelos conceitos (peso menor)
  concepts: Set<string>;  // conceitos detectados
}

// Expande a pergunta com sinônimos do dicionário.
export function expandQuery(userMessage: string): ExpandResult {
  const normQuery = normalize(userMessage);
  const original = new Set(tokenize(userMessage));
  const concepts = new Set<string>();

  // termos de uma palavra
  for (const tok of original) {
    const cs = SINGLE_TERM.get(tok);
    if (cs) for (const c of cs) concepts.add(c);
  }
  // frases (precisam aparecer inteiras)
  for (const { term, concepts: cs } of MULTI_TERM) {
    if (normQuery.includes(term)) for (const c of cs) concepts.add(c);
  }

  // monta o conjunto de sinônimos (sem repetir o que já foi digitado)
  const synonyms = new Set<string>();
  for (const c of concepts) {
    for (const term of SYNONYMS[c]) {
      for (const tok of tokenize(term)) {
        if (!original.has(tok)) synonyms.add(tok);
      }
    }
  }

  return { original, synonyms, concepts };
}

// Conceitos detectados → categorias de locais a reforçar.
export function conceptCategories(concepts: Set<string>): Set<string> {
  const cats = new Set<string>();
  for (const c of concepts) {
    for (const cat of CONCEPT_CATEGORIES[c] ?? []) cats.add(cat);
  }
  return cats;
}

// ── Similaridade fuzzy (tolerante a erro de digitação) ──

// Distância de edição de Levenshtein (mínimo de inserções/remoções/trocas).
export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
    }
    prev = cur;
  }
  return prev[n];
}

// Duas palavras "casam" se forem iguais, uma contiver a outra, ou a
// semelhança (1 - dist/maior) for >= minRatio (0.75 = até ~25% de erro).
export function fuzzyEqual(a: string, b: string, minRatio = 0.75): boolean {
  if (a === b) return true;
  if (a.length >= 4 && b.length >= 4 && (a.includes(b) || b.includes(a))) return true;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen < 3) return false;
  return 1 - levenshtein(a, b) / maxLen >= minRatio;
}

// Quantas palavras do usuário casam (fuzzy) com alguma palavra do alvo.
export function fuzzyOverlap(userWords: string[], targetWords: string[]): number {
  let count = 0;
  for (const u of userWords) {
    if (targetWords.some((t) => fuzzyEqual(u, t))) count++;
  }
  return count;
}

// Similaridade 0..1 (nº de palavras que casam / maior conjunto), com fuzzy.
export function similarity(userWords: string[], targetWords: string[]): number {
  if (userWords.length === 0 || targetWords.length === 0) return 0;
  return fuzzyOverlap(userWords, targetWords) / Math.max(userWords.length, targetWords.length);
}
