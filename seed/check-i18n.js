/**
 * Verifica a paridade PT/EN dos locais.
 * Uso:  node seed/check-i18n.js
 *
 * Garante que TODO local em locations.json tenha tradução completa em
 * locations.en.json (mesma chave = slug). Sai com código 1 se houver problema
 * — bom para rodar antes de subir dados novos.
 */
const pt = require('./locations.json');
const en = require('./locations.en.json');

const REQ = ['name', 'short_description', 'neighborhood', 'address', 'admission', 'content'];
const REQ_CONTENT = ['history', 'curiosities', 'practical_tips', 'how_to_get_there'];

let problems = 0;
const fail = (msg) => { console.log('  ✗ ' + msg); problems++; };

const ptSlugs = new Set(pt.map((l) => l.slug));

// 1) entradas EN sem PT correspondente
for (const slug of Object.keys(en)) {
  if (!ptSlugs.has(slug)) fail(`EN "${slug}" não tem local PT correspondente`);
}

// 2) cada local PT precisa de tradução EN completa
for (const l of pt) {
  const e = en[l.slug];
  if (!e) { fail(`FALTA tradução EN para "${l.slug}" (${l.name})`); continue; }
  for (const f of REQ) {
    if (e[f] == null || e[f] === '') fail(`"${l.slug}": campo EN ausente: ${f}`);
  }
  if (e.content) {
    for (const f of REQ_CONTENT) {
      if (e.content[f] == null) fail(`"${l.slug}": content.${f} EN ausente`);
    }
  }
}

console.log(`\nPT: ${pt.length} locais | EN: ${Object.keys(en).length} traduções | problemas: ${problems}`);
if (problems === 0) console.log('✓ Tudo certo: PT e EN em paridade.');
process.exit(problems ? 1 : 0);
