export type Lang = 'pt' | 'en';

// Rótulo traduzido de uma categoria pelo slug. Cai para o `fallback`
// (rótulo vindo do banco, em PT) se o slug não estiver mapeado.
export function categoryLabel(slug: string | undefined, lang: Lang, fallback?: string): string {
  const cats = translations[lang].categories as Record<string, string>;
  return (slug && cats[slug]) || fallback || slug || '';
}

export const translations = {
  pt: {
    loading: 'Carregando SorrIA...',
    loadingError: 'Erro ao iniciar:',
    notFound: 'Local não encontrado.',
    back: 'Voltar',

    home: {
      inputPlaceholder: 'Pergunte sobre a Região Portuária do Rio',
      navMap:     'Mapa',
      navExplore: 'Explorar',
      seeLocation: 'Saiba mais →',
      error:    'Erro ao buscar resposta. Tente novamente.',
      searching: 'Buscando...',
      welcome: 'Olá! Sou o guia do SorrIA 🌊\n\nPergunte sobre a história, pontos turísticos, transporte e curiosidades da Região Portuária e Centro do Rio de Janeiro.',
      suggestions: 'Sugestões:',
      slogan: 'O seu guia da Região Portuária do Rio',
      topBarTitle: 'Guia da Região Portuária do Rio',
      homeBtn: 'Início',
      backToChat: '↩ Voltar à conversa',
      highlightsHeading: '✨ Destaques',
      highlightTag: '🏛️ DESTAQUE',
      learnMore: 'Saiba mais →',
    },

    footer: {
      created:     'Criação: @GamboaAção',
      realization: 'Realização',
      sponsorship: 'Patrocínio',
    },

    map: {
      loading: 'Carregando mapa...',
      places: 'locais',
      seeMore: 'Ver mais →',
      filters: {
        all: 'Todos',
        museu: '🏛️ Museus',
        patrimonio: '🏰 Patrimônio',
        cultura: '🎭 Cultura',
        vlt: '🚋 VLT',
      },
    },

    explore: {
      title: 'Explorar',
      subtitle: 'Região Portuária & Centro do Rio',
      searchPlaceholder: 'Buscar local, história, bairro...',
      empty: 'Nenhum local encontrado.',
      filters: {
        all: 'Todos',
        museu: 'Museus',
        patrimonio: 'Patrimônio',
        praca: 'Praças',
        igreja: 'Igrejas',
        cultura: 'Cultura',
        gastronomia: 'Gastronomia',
      },
    },

    location: {
      hours: '🕐 Horários',
      notFound: 'Local não encontrado.',
      tabs: {
        historia: '📖 História',
        curiosidades: '💡 Curiosidades',
        dicas: '✅ Dicas',
      },
      howToGet: '🚋 Como Chegar',
      changeNote: '⚠️ Horários, preços e funcionamento podem mudar — confirme com o local antes de visitar.',
    },
    categories: {
      museu: 'Museu', igreja: 'Igreja', praca: 'Praça / Largo', patrimonio: 'Patrimônio',
      cultura: 'Centro Cultural', gastronomia: 'Gastronomia', estacao_vlt: 'Estação VLT',
      estacao_trem: 'Estação de Trem', aquario: 'Aquário', bairro: 'Bairro Histórico',
      teatro: 'Teatro', biblioteca: 'Biblioteca', ong: 'ONG / Projeto Social',
      lazer: 'Lazer / Atração', saude: 'Saúde', publico: 'Público / Governo',
    },
  },

  en: {
    loading: 'Loading SorrIA...',
    loadingError: 'Startup error:',
    notFound: 'Location not found.',
    back: 'Back',

    home: {
      inputPlaceholder: 'Ask about the Port Region of Rio',
      navMap:     'Map',
      navExplore: 'Explore',
      seeLocation: 'Learn more →',
      error:    'Error fetching answer. Please try again.',
      searching: 'Searching...',
      welcome: 'Hello! I am the SorrIA guide 🌊\n\nAsk me about the history, tourist spots, transport, and curiosities of the Port Region and Historic Downtown Rio de Janeiro.',
      suggestions: 'Suggestions:',
      slogan: 'Your guide to the Port District of Rio',
      topBarTitle: "Guide to Rio's Port District",
      homeBtn: 'Home',
      backToChat: '↩ Back to chat',
      highlightsHeading: '✨ Highlights',
      highlightTag: '🏛️ HIGHLIGHT',
      learnMore: 'Learn more →',
    },

    footer: {
      created:     'Created by: @GamboaAção',
      realization: 'Realization',
      sponsorship: 'Sponsorship',
    },


    map: {
      loading: 'Loading map...',
      places: 'places',
      seeMore: 'See more →',
      filters: {
        all: 'All',
        museu: '🏛️ Museums',
        patrimonio: '🏰 Heritage',
        cultura: '🎭 Culture',
        vlt: '🚋 VLT',
      },
    },

    explore: {
      title: 'Explore',
      subtitle: 'Port Region & Historic Downtown Rio',
      searchPlaceholder: 'Search places, history, neighborhood...',
      empty: 'No places found.',
      filters: {
        all: 'All',
        museu: 'Museums',
        patrimonio: 'Heritage',
        praca: 'Squares',
        igreja: 'Churches',
        cultura: 'Culture',
        gastronomia: 'Food & Drink',
      },
    },

    location: {
      hours: '🕐 Opening Hours',
      notFound: 'Location not found.',
      tabs: {
        historia: '📖 History',
        curiosidades: '💡 Curiosities',
        dicas: '✅ Tips',
      },
      howToGet: '🚋 How to Get There',
      changeNote: '⚠️ Opening hours, prices and operations may change — please confirm with the venue before visiting.',
    },
    categories: {
      museu: 'Museum', igreja: 'Church', praca: 'Square / Plaza', patrimonio: 'Heritage',
      cultura: 'Cultural Center', gastronomia: 'Food & Drink', estacao_vlt: 'Tram (VLT) Station',
      estacao_trem: 'Train Station', aquario: 'Aquarium', bairro: 'Historic District',
      teatro: 'Theater', biblioteca: 'Library', ong: 'NGO / Social Project',
      lazer: 'Leisure / Attraction', saude: 'Health', publico: 'Public / Government',
    },
  },
} as const;
