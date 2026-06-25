# Padrão para inserir novos locais (PT + EN)

Todo local novo entra em **dois arquivos**, sempre com o **mesmo `slug`**:

1. **`seed/locations.json`** → versão **português** (é o que vai pro banco/SQLite).
2. **`seed/locations.en.json`** → versão **inglês** (lida em runtime; troca quando o idioma é EN; se faltar, cai para o PT).

> A interface, o Mapa, o Explorar, o Detalhe e o chatbot já usam esse esquema.
> O chatbot **entende perguntas em inglês** automaticamente quando o `name`/
> `short_description` EN existem (eles entram no índice de busca).

Depois de inserir, **rode a verificação**:

```bash
node seed/check-i18n.js
```

Ela acusa qualquer local sem tradução ou com campo faltando (sai com erro se houver problema).

---

## 1) Template — `seed/locations.json` (PORTUGUÊS)

Adicione o objeto ao **array**. Use o **próximo `id` livre** (hoje o maior é **100**) e uma `category_id` existente (ver `categories.json`). `lat`/`lng` em graus decimais (confira no mapa para não cair na água).

```json
{
  "id": 101,
  "slug": "novo-local-exemplo",
  "is_heritage": 0,
  "question_variations": [
    "o que e o novo local exemplo",
    "onde fica o novo local exemplo",
    "historia do novo local exemplo",
    "horario do novo local exemplo",
    "novo local exemplo rio"
  ],
  "name": "Novo Local Exemplo",
  "short_description": "Resumo de 1–2 frases do local.",
  "category_id": 4,
  "lat": -22.8970,
  "lng": -43.1820,
  "address": "Rua Exemplo, 100 — Saúde",
  "neighborhood": "Saúde",
  "opening_hours": { "ter-dom": "10:00–17:00", "seg": "Fechado" },
  "admission": "Gratuito",
  "website": null,
  "is_featured": 0,
  "content": {
    "history": "Parágrafo(s) de história. Pode usar **negrito** em markdown.",
    "curiosities": ["Curiosidade 1.", "Curiosidade 2."],
    "practical_tips": ["Dica 1.", "Dica 2."],
    "how_to_get_there": "**VLT:** estação X.\nReferência de localização."
  }
}
```

## 2) Template — `seed/locations.en.json` (INGLÊS)

Adicione ao **objeto** (chave = o mesmo `slug`). **Só os campos traduzíveis** (não repita `id`, `category_id`, `lat`, `lng`, `is_featured`, `website`, `question_variations`):

```json
"novo-local-exemplo": {
  "name": "Example New Place",
  "short_description": "A 1–2 sentence summary of the place.",
  "neighborhood": "Saúde",
  "address": "Rua Exemplo, 100 — Saúde",
  "admission": "Free",
  "opening_hours": { "Tue–Sun": "10:00–17:00", "Mon": "Closed" },
  "content": {
    "history": "History paragraph(s). You can use **bold** markdown.",
    "curiosities": ["Curiosity 1.", "Curiosity 2."],
    "practical_tips": ["Tip 1.", "Tip 2."],
    "how_to_get_there": "**Tram (VLT):** X station.\nLocation reference."
  }
}
```

---

## Convenções de tradução (para manter consistência)

- **Bairros (neighborhood):** `Centro` → **Downtown**; `Zona Portuária` → **Port Area**. Mantenha nomes próprios: `Gamboa`, `Saúde`, `Santo Cristo`, `Lapa`.
- **`opening_hours` — traduza as chaves:**
  `seg`→`Mon`, `ter`→`Tue`, `qua`→`Wed`, `qui`→`Thu`, `sex`→`Fri`, `sab`→`Sat`, `dom`→`Sun`,
  `ter-dom`→`Tue–Sun`, `seg-sex`→`Mon–Fri`, `sab-dom`→`Sat–Sun`, `todos`→`Daily`, `obs`→`note`.
  Valores: `Fechado`→`Closed`, `Aberto 24 horas`→`Open 24 hours`, `Gratuito`→`Free`.
- **`admission`:** `Gratuito`→`Free`; `Entrada gratuita`→`Free entry`; `À la carte` mantém; `Consulte valores no site oficial`→`Check prices on the official website`.
- **Transporte (how_to_get_there):** `VLT`→`Tram (VLT)`; `Metrô`→`Subway`; `Ônibus`→`Bus`; `A pé`→`On foot`; `estação`→`station`.
- **Termos recorrentes:** `Cais do Valongo`→`Valongo Wharf`; `Pequena África`→`Little Africa`; `Baía de Guanabara`→`Guanabara Bay`; `Praça XV` mantém; `Tombado`→`Listed` (IPHAN/heritage).

## Categorias novas
Se o local precisar de uma categoria que não existe, adicione em **3 lugares**:
`seed/categories.json` (id/slug/label/icon/color) · `src/theme/colors.ts` (`categoryMeta`: emoji+cor) · `src/i18n/translations.ts` (`categories` em `pt` **e** `en`). Depois **bumpe** `SEED_VERSION` em `src/db/seed.ts` para forçar o re-seed.

> Mudou só conteúdo EN (`locations.en.json`)? **Não** precisa bumpar `SEED_VERSION` (esse arquivo não vai pro banco; é lido em runtime).
> Mudou `locations.json` (PT) ou `categories.json`? **Bumpe** `SEED_VERSION`.
