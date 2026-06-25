// Dicionário de sinônimos e intenções do SorrIA.
//
// Cada CONCEITO agrupa os termos que o usuário pode digitar em linguagem natural.
// O motor de busca expande a pergunta com os termos do mesmo conceito, ligando
// o vocabulário do usuário ("música", "comer", "como chegar") ao vocabulário que
// já existe na base de dados (keywords das intents + nomes dos locais).
//
// Termos com espaço ("roda de samba", "como chegar") são tratados como frase:
// só batem se a frase inteira aparecer na pergunta.
//
// 100% offline — nenhuma chamada externa.

export const SYNONYMS: Record<string, string[]> = {
  // ── Cultura musical (Pedra do Sal, samba, Lapa) ──
  musica: [
    'musica', 'samba', 'choro', 'mpb', 'pagode', 'roda de samba',
    'bossa nova', 'bossa', 'boemia', 'noite', 'show', 'banda', 'cantar',
    'dancar', 'forro', 'gafieira',
  ],

  // ── Gastronomia (Confeitaria Colombo, bares, cafés) ──
  gastronomia: [
    'comer', 'comida', 'restaurante', 'almoco', 'almocar', 'jantar', 'janta',
    'cafe', 'confeitaria', 'doce', 'doces', 'bolo', 'lanche', 'fome',
    'gastronomia', 'bar', 'cardapio', 'petisco', 'cerveja', 'chopp',
  ],

  // ── História geral ──
  historia: [
    'historia', 'historico', 'historica', 'antigo', 'antiga', 'colonial',
    'imperio', 'imperial', 'passado', 'memoria', 'seculo', 'fundacao',
    'origem', 'surgiu', 'aconteceu', 'antigamente',
  ],

  // ── Patrimônio / UNESCO ──
  patrimonio: [
    'patrimonio', 'unesco', 'tombado', 'tombamento', 'monumento', 'heranca',
    'preservacao', 'iphan', 'patrimonio mundial', 'patrimonio cultural',
  ],

  // ── Escravidão / Pequena África (Cais do Valongo) ──
  escravidao: [
    'escravidao', 'escravos', 'escravizados', 'africanos', 'negros', 'negro',
    'diaspora', 'valongo', 'quilombo', 'africa', 'pretos', 'pequena africa',
    'cais dos pretos novos', 'afro', 'afro brasileiro',
  ],

  // ── Família Real / 1808 (Paço Imperial) ──
  familia_real: [
    'familia real', 'dom joao', 'dom joao vi', 'corte', 'imperador', 'rei',
    'rainha', 'principe', 'princesa', 'monarquia', 'portugueses', 'coroa',
    '1808', 'lei aurea', 'independencia', 'dom pedro',
  ],

  // ── Transporte (VLT, trem, metrô) ──
  transporte: [
    'como chegar', 'transporte', 'onibus', 'metro', 'vlt', 'trem', 'bonde',
    'bondinho', 'estacao', 'parada', 'riocard', 'bilhete', 'passagem',
    'tram', 'tarifa', 'integracao', 'baldeacao', 'ir ate', 'chegar em',
  ],

  // ── Gratuidade ──
  gratuito: [
    'gratis', 'gratuito', 'gratuita', 'free', 'entrada franca', 'de graca',
    'sem custo', 'nao paga', 'nao pago', 'sem pagar',
  ],

  // ── Ingressos / preço ──
  ingresso: [
    'ingresso', 'preco', 'valor', 'quanto custa', 'custa', 'bilheteria',
    'meia entrada', 'inteira', 'meia', 'pagar', 'entrada',
  ],

  // ── Horário de funcionamento ──
  horario: [
    'horario', 'hora', 'abre', 'fecha', 'funcionamento', 'aberto', 'fechado',
    'visitacao', 'que horas', 'ate que horas',
  ],

  // ── Turismo / vista / fotos ──
  turismo: [
    'vista', 'mirante', 'paisagem', 'foto', 'fotografia', 'fotos', 'passeio',
    'passear', 'turismo', 'turistico', 'atracao', 'o que ver', 'o que visitar',
    'visitar', 'conhecer', 'ponto turistico', 'pontos turisticos',
  ],

  // ── Museus ──
  museu: [
    'museu', 'museus', 'exposicao', 'exposicoes', 'mostra', 'galeria', 'acervo',
    'amanha', 'museu do amanha', 'mar', 'museu de arte', 'ciencia', 'calatrava',
  ],

  // ── Arte urbana / azulejos (Selarón) ──
  arte: [
    'arte', 'azulejo', 'azulejos', 'mural', 'murais', 'grafite', 'escadaria',
    'selaron', 'artista', 'obra', 'colorido', 'mosaico',
  ],

  // ── Igrejas ──
  igreja: [
    'igreja', 'igrejas', 'catedral', 'mosteiro', 'religioso', 'religiosa',
    'capela', 'missa', 'fe', 'religiao', 'sao bento',
  ],

  // ── Bibliotecas (Real Gabinete) ──
  biblioteca: [
    'biblioteca', 'bibliotecas', 'livro', 'livros', 'leitura', 'gabinete',
    'obras raras', 'real gabinete', 'biblioteca nacional', 'ler',
  ],

  // ── Teatro / ópera (Cinelândia) ──
  teatro: [
    'teatro', 'opera', 'espetaculo', 'bale', 'concerto', 'municipal', 'palco',
    'cinema', 'cinelandia', 'apresentacao',
  ],

  // ── Aquário (AquaRio) ──
  aquario: [
    'aquario', 'peixe', 'peixes', 'tubarao', 'tubaroes', 'marinho', 'tartaruga',
    'raia', 'oceano', 'aquatico', 'animais marinhos',
  ],

  // ── Praças e largos ──
  praca: [
    'praca', 'pracas', 'largo', 'praca maua', 'praca xv', 'boulevard',
    'orla', 'orla conde',
  ],

  // ── Roteiros / o que fazer ──
  roteiro: [
    'roteiro', 'roteiros', 'itinerario', 'o que fazer', 'programacao', 'plano',
    'um dia', '1 dia', 'meio dia', 'passeio de um dia', 'sugestao', 'dica',
    'dicas', 'agenda',
  ],

  // ── Bairros / Zona Portuária ──
  bairro: [
    'bairro', 'bairros', 'saude', 'gamboa', 'conceicao', 'morro da conceicao',
    'centro', 'zona portuaria', 'regiao portuaria', 'lapa', 'porto', 'santo cristo',
  ],

  // ── Arquitetura ──
  arquitetura: [
    'arquitetura', 'predio', 'edificio', 'construcao', 'estilo', 'art deco',
    'art nouveau', 'fachada', 'arquiteto',
  ],
};

// Conceito → categorias da base (slugs em categories.json).
// Reforça a pontuação de LOCAIS daquela categoria quando o conceito aparece.
export const CONCEPT_CATEGORIES: Record<string, string[]> = {
  musica:       ['cultura', 'teatro'],
  gastronomia:  ['gastronomia'],
  historia:     ['patrimonio', 'bairro'],
  patrimonio:   ['patrimonio'],
  escravidao:   ['patrimonio', 'bairro'],
  familia_real: ['patrimonio'],
  transporte:   ['estacao_vlt', 'estacao_trem'],
  turismo:      ['praca', 'patrimonio', 'museu'],
  museu:        ['museu', 'aquario'],
  arte:         ['cultura', 'patrimonio'],
  igreja:       ['igreja'],
  biblioteca:   ['biblioteca'],
  teatro:       ['teatro', 'cultura'],
  aquario:      ['aquario'],
  praca:        ['praca'],
  bairro:       ['bairro'],
  arquitetura:  ['patrimonio', 'museu'],
};

// Rótulos amigáveis para o fallback ("Entendi que você procura sobre...").
export const CONCEPT_LABELS: Record<string, string> = {
  musica:       'música e samba',
  gastronomia:  'gastronomia',
  historia:     'história',
  patrimonio:   'patrimônio',
  escravidao:   'história da escravidão',
  familia_real: 'Família Real',
  transporte:   'transporte',
  gratuito:     'lugares gratuitos',
  ingresso:     'ingressos e preços',
  horario:      'horários',
  turismo:      'pontos turísticos',
  museu:        'museus',
  arte:         'arte urbana',
  igreja:       'igrejas',
  biblioteca:   'bibliotecas',
  teatro:       'teatro e ópera',
  aquario:      'o AquaRio',
  praca:        'praças',
  roteiro:      'roteiros',
  bairro:       'bairros da Zona Portuária',
  arquitetura:  'arquitetura',
};
