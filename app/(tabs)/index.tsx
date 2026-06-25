import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, StyleSheet, Image, Animated,
  LayoutAnimation, UIManager, useWindowDimensions,
  type NativeScrollEvent, type NativeSyntheticEvent,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { queryChatbot } from '../../src/engine/chatbot';
import { useT } from '../../src/hooks/useT';
import { HeaderTools } from '../../src/components/HeaderTools';
import { Footer } from '../../src/components/Footer';
import { Markdown } from '../../src/components/Markdown';
import { colors, homeColors } from '../../src/theme/colors';
import { useAccessibleTheme } from '../../src/hooks/useAccessibleTheme';

// Habilita animação de layout no Android (iOS/web já suportam)
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Message {
  id: string;
  role: 'user' | 'bot';
  text: string;
  relatedSlug?: string | null;
}

export default function HomeScreen() {
  const { T, lang } = useT();
  const { colors: ac, fontSize, contrastMode } = useAccessibleTheme();

  const isBlueHome    = contrastMode === 'normal';
  const homeBg        = isBlueHome ? homeColors.background : ac.background;
  const onBlue        = isBlueHome ? homeColors.textPrimary : ac.textDark;
  const onBlueMuted   = isBlueHome ? homeColors.textSecondary : ac.textMedium;
  const botBubbleBg   = isBlueHome ? '#EBF4FF' : ac.surface;   // azul bem claro (tom mais claro da paleta)
  const botBubbleBd   = isBlueHome ? '#C3DAFE' : ac.border;
  const botTextColor  = isBlueHome ? '#1A202C' : ac.textDark;  // preto suave
  const userBubbleBg  = isBlueHome ? homeColors.backgroundDark : ac.primary;
  const userTextColor = contrastMode === 'high' ? '#000000' : '#FFFFFF';
  const linkColor     = isBlueHome ? '#2B6CB0' : ac.primary;   // link azul (legível no fundo claro)
  const cardBg        = isBlueHome ? 'rgba(255,255,255,0.15)' : ac.surface;
  const cardBd        = isBlueHome ? 'rgba(255,255,255,0.30)' : ac.border;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [atBottom, setAtBottom] = useState(true);
  const scrollRef = useRef<ScrollView>(null);
  const [mode, setMode] = useState<'home' | 'chat'>('home'); // 'home' = vitrine; 'chat' = conversa (busca fixa)

  const hasMessages = messages.length > 0;

  // Rola SEMPRE para a última mensagem. O ScrollView do chat tem só as mensagens
  // (as seções ficam na Home), então scrollToEnd é confiável e nunca volta ao topo.
  const scrollToBottom = useCallback((animated = true) => {
    // timeout: garante que o conteúdo novo já foi renderizado antes de rolar
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated }), 50);
  }, []);

  // A cada nova mensagem/resposta, fim do "digitando…", ou ao (re)entrar no chat → vai pro fim.
  useEffect(() => {
    if (mode === 'chat') scrollToBottom(true);
  }, [messages, loading, mode, scrollToBottom]);

  // Botão "↓" aparece só quando o usuário rolou para cima (lendo o histórico).
  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    const dist = contentSize.height - (contentOffset.y + layoutMeasurement.height);
    setAtBottom(dist <= 80);
  }

  const handleSend = useCallback(async (preset?: string) => {
    const msg = (preset ?? input).trim();
    if (!msg || loading) return;
    setInput('');
    setMode('chat');        // entra no modo conversa (busca fixa, sem seções)
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: msg }]);
    setLoading(true);
    try {
      const response = await queryChatbot(msg, lang);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        text: response.answer,
        relatedSlug: response.relatedLocationSlug,
      }]);
    } catch {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'bot', text: T.home.error }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, T]);

  // Logo + slogan (roláveis)
  const logoBlock = (
    <View style={styles.logoSection}>
      <Image source={require('../../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
      <Text style={[styles.slogan, { color: onBlue, fontSize: fontSize(20) }]}>
        {T.home.slogan}
      </Text>
    </View>
  );

  // Grupo que anda junto: campo de busca + Mapa + Explorar
  const searchGroup = (
    <View style={[styles.searchGroup, mode === 'chat' && {
      borderTopWidth: 1,
      borderTopColor: isBlueHome ? 'rgba(255,255,255,0.15)' : ac.border,
      backgroundColor: isBlueHome ? 'rgba(255,255,255,0.06)' : ac.background,
    }]}>
      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, { backgroundColor: ac.surface, color: ac.textDark, fontSize: fontSize(15) }]}
          placeholder={T.home.inputPlaceholder}
          placeholderTextColor={ac.textLight}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => handleSend()}
          returnKeyType="send"
          multiline={false}
        />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={() => handleSend()}
          disabled={loading || !input.trim()}
          accessibilityLabel={lang === 'pt' ? 'Enviar' : 'Send'}
        >
          <Text style={styles.sendIcon}>↑</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.navCards}>
        <TouchableOpacity
          style={[styles.navCard, { backgroundColor: cardBg, borderColor: cardBd }]}
          activeOpacity={0.85}
          onPress={() => router.push('/map')}
        >
          <Text style={styles.navCardIcon}>🗺️</Text>
          <Text style={[styles.navCardLabel, { color: isBlueHome ? '#FFFFFF' : ac.textDark, fontSize: fontSize(13) }]}>
            {T.home.navMap}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navCard, { backgroundColor: cardBg, borderColor: cardBd }]}
          activeOpacity={0.85}
          onPress={() => router.push('/explore')}
        >
          <Text style={styles.navCardIcon}>🧭</Text>
          <Text style={[styles.navCardLabel, { color: isBlueHome ? '#FFFFFF' : ac.textDark, fontSize: fontSize(13) }]}>
            {T.home.navExplore}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: homeBg }]}>
      <StatusBar style={isBlueHome ? 'light' : 'dark'} />

      {/* Barra fixa do topo */}
      <View style={styles.topBar}>
        {mode === 'chat' && (
          <TouchableOpacity
            style={styles.topHomeBtn}
            onPress={() => setMode('home')}
            accessibilityRole="button"
            accessibilityLabel={lang === 'pt' ? 'Voltar ao início' : 'Back to home'}
          >
            <Text style={styles.topHomeBtnText}>⌂ {T.home.homeBtn}</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.topBarText} numberOfLines={1}>
          {T.home.topBarTitle}
        </Text>
        <HeaderTools />
      </View>

      {mode === 'home' ? (
        /* HOME (vitrine) — logo + busca + (voltar à conversa) + Destaques + Projeto + Footer */
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.initialContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.centerBlock}>
              {logoBlock}
              {searchGroup}
              {hasMessages && (
                <TouchableOpacity
                  style={styles.backToChat}
                  onPress={() => setMode('chat')}
                  accessibilityRole="button"
                >
                  <Text style={styles.backToChatText}>
                    {T.home.backToChat}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <DestaquesSection />
            <ProjetoSection />
            <Footer />
          </ScrollView>
        </KeyboardAvoidingView>
      ) : (
        /* CONVERSA — logo rola junto; grupo de busca fixo na base */
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.flex}>
            <ScrollView
              ref={scrollRef}
              style={styles.flex}
              contentContainerStyle={styles.chatContent}
              showsVerticalScrollIndicator={false}
              onScroll={onScroll}
              scrollEventThrottle={16}
              onContentSizeChange={() => scrollToBottom(false)}
              keyboardDismissMode="on-drag"
              keyboardShouldPersistTaps="handled"
            >
              {logoBlock}

              {messages.map(m => {
                const isUser = m.role === 'user';
                return (
                  <View
                    key={m.id}
                    style={
                      isUser
                        ? [styles.bubbleUser, { backgroundColor: userBubbleBg }]
                        : [styles.bubbleBot, { backgroundColor: botBubbleBg, borderColor: botBubbleBd }]
                    }
                  >
                    {isUser ? (
                      <Text style={[styles.bubbleUserText, { color: userTextColor, fontSize: fontSize(15) }]}>
                        {m.text}
                      </Text>
                    ) : (
                      <Markdown color={botTextColor} size={fontSize(15)}>{m.text}</Markdown>
                    )}
                    {m.relatedSlug && (
                      <TouchableOpacity
                        style={[styles.locationBtn, { borderTopColor: botBubbleBd }]}
                        onPress={() => router.push(`/location/${m.relatedSlug}`)}
                      >
                        <Text style={[styles.locationBtnText, { color: linkColor, fontSize: fontSize(13) }]}>
                          {T.home.seeLocation}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}

              {loading && (
                <View style={[styles.bubbleBot, { backgroundColor: botBubbleBg, borderColor: botBubbleBd }]}>
                  <TypingDots color={isBlueHome ? '#4A5568' : ac.textMedium} />
                </View>
              )}

            </ScrollView>

            {!atBottom && (
              <TouchableOpacity
                style={styles.scrollDownBtn}
                onPress={() => scrollToBottom(true)}
                accessibilityLabel={lang === 'pt' ? 'Ir para a última resposta' : 'Go to the latest reply'}
              >
                <Text style={styles.scrollDownIcon}>↓</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Campo de busca FIXO na base — as mensagens crescem só pra cima acima dele */}
          {searchGroup}
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

function TypingDots({ color }: { color: string }) {
  const opacity = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 500, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return <Animated.Text style={{ color, fontSize: 20, opacity }}>• • •</Animated.Text>;
}

// Seção "Projeto SorrIA" — destaque acima do footer, link para a página do projeto
function ProjetoSection() {
  const { lang } = useT();
  const { colors: ac, fontSize, contrastMode } = useAccessibleTheme();
  const pt = lang === 'pt';

  const isNormal   = contrastMode === 'normal';
  const cardBg     = isNormal ? homeColors.backgroundDark : ac.surface;  // azul escuro p/ destacar
  const titleColor = isNormal ? '#FFFFFF' : ac.textDark;
  const iaColor    = isNormal ? colors.secondary : ac.accent;            // "IA" em amarelo
  const descColor  = isNormal ? 'rgba(255,255,255,0.82)' : ac.textMedium;
  const tagBg      = isNormal ? 'rgba(247,167,6,0.18)' : ac.accent + '22';
  const tagText    = isNormal ? '#FFD166' : ac.accent;
  const btnBg      = isNormal ? 'rgba(255,255,255,0.16)' : ac.primary;   // branco translúcido (vidro)
  const btnBd      = isNormal ? 'rgba(255,255,255,0.40)' : ac.primary;

  return (
    <View style={styles.projetoWrap}>
      <View style={[styles.projetoCard, { backgroundColor: cardBg }]}>
        <View style={[styles.projetoTag, { backgroundColor: tagBg }]}>
          <Text style={[styles.projetoTagText, { color: tagText }]}>
            ✨ {pt ? 'NOSSO PROJETO' : 'OUR PROJECT'}
          </Text>
        </View>

        <Text
          accessibilityRole="header"
          style={[styles.projetoTitle, { color: titleColor, fontSize: fontSize(28) }]}
        >
          {pt ? 'Projeto ' : ''}Sorr<Text style={{ color: iaColor }}>IA</Text>{pt ? '' : ' Project'}
        </Text>

        <Text style={[styles.projetoDesc, { color: descColor, fontSize: fontSize(14) }]}>
          {pt
            ? 'SorrIA é um projeto da Gamboa Ação que deu voz a jovens da Região Portuária do Rio — para contar, com orgulho, a nossa própria história.'
            : "SorrIA is a Gamboa Ação project that gave young people from Rio's Port District a voice — to tell our own story, with pride."}
        </Text>

        <TouchableOpacity
          style={[styles.projetoBtn, { backgroundColor: btnBg, borderColor: btnBd }]}
          activeOpacity={0.85}
          onPress={() => router.push('/projeto')}
          accessibilityRole="link"
        >
          <Text style={styles.projetoBtnText}>{pt ? 'Conheça o projeto' : 'Discover the project'}</Text>
          <Text style={styles.projetoBtnArrow}>→</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Destaques da Home (carrossel) — textos vindos do banco (seed/locations.json)
const HIGHLIGHTS = [
  {
    slug: 'cais-do-valongo',
    image: require('../../assets/images/highlight-valongo.jpg'),
    badge: 'Patrimônio da UNESCO',
    title: 'Cais do Valongo',
    text: 'Maior sítio arqueológico da história africana nas Américas, tombado pela UNESCO em 2017.',
    accent: '#E8602C',
    en: {
      badge: 'UNESCO World Heritage',
      title: 'Valongo Wharf',
      text: 'The largest archaeological site of African heritage in the Americas, listed by UNESCO in 2017.',
    },
  },
  {
    slug: 'museu-do-amanha',
    image: require('../../assets/images/highlight-amanha.jpg'),
    badge: 'Museu de Ciências',
    title: 'Museu do Amanhã',
    text: 'Museu de ciência futurista de Santiago Calatrava, inaugurado em 2015 — um dos mais inovadores do mundo.',
    accent: '#2B6CB0',
    en: {
      badge: 'Science Museum',
      title: 'Museum of Tomorrow',
      text: "Santiago Calatrava's futuristic science museum, opened in 2015 — one of the most innovative in the world.",
    },
  },
  {
    slug: 'boulevard-olimpico',
    image: require('../../assets/images/highlight-boulevard.jpg'),
    badge: 'Legado Olímpico',
    title: 'Boulevard Olímpico',
    text: 'Orla revitalizada para 2016 com o Mural Etnias de Kobra, museus e a Roda Gigante.',
    accent: '#805AD5',
    en: {
      badge: 'Olympic Legacy',
      title: 'Olympic Boulevard',
      text: "Waterfront revitalized for 2016 with Kobra's Etnias mural, museums and the Ferris wheel.",
    },
  },
];

// Seção de destaques na Home — slide (1 por vez, auto-avança 5s, controles 1/2/3)
function DestaquesSection() {
  const { T, lang } = useT();
  const [active, setActive] = useState(0);
  const [boxW, setBoxW] = useState(0);
  const win = useWindowDimensions();
  const fade = useRef(new Animated.Value(1)).current;
  const W = boxW || win.width;
  const cardW = Math.min(W - 40, 480);     // 1 card por vez, responsivo
  const len = HIGHLIGHTS.length;

  // auto-avança 5s após a última troca (pausa naturalmente ao interagir)
  useEffect(() => {
    const t = setTimeout(() => setActive(a => (a + 1) % len), 5000);
    return () => clearTimeout(t);
  }, [active, len]);

  // fade suave ao trocar de slide
  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, [active, fade]);

  const h0 = HIGHLIGHTS[active];
  const h = lang === 'en' ? { ...h0, ...h0.en } : h0;

  return (
    <View style={styles.gridWrap} onLayout={e => setBoxW(e.nativeEvent.layout.width)}>
      <Text style={styles.gridHeading}>{T.home.highlightsHeading}</Text>

      <View style={styles.slideRow}>
        <Animated.View style={{ width: cardW, opacity: fade }}>
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.card}
            onPress={() => router.push({ pathname: '/location/[slug]', params: { slug: h.slug } })}
          >
            <View style={styles.cardImageWrap}>
              <Image source={h.image} style={styles.cardImage} resizeMode="cover" />
              <View style={styles.cardLabel}>
                <Text style={styles.cardLabelText}>{T.home.highlightTag}</Text>
              </View>
            </View>

            <View style={styles.cardBody}>
              <View style={[styles.cardBadge, { backgroundColor: h.accent }]}>
                <Text style={styles.cardBadgeText}>{h.badge}</Text>
              </View>
              <Text style={styles.cardTitle}>{h.title}</Text>
              <Text style={styles.cardText} numberOfLines={3}>{h.text}</Text>
              <View style={[styles.cardButton, { backgroundColor: h.accent }]}>
                <Text style={styles.cardButtonText}>{T.home.learnMore}</Text>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Controles: apenas as bolinhas (1/2/3) */}
      <View style={styles.dotsRow}>
        {HIGHLIGHTS.map((_, i) => (
          <TouchableOpacity key={i} onPress={() => setActive(i)} hitSlop={{ top: 10, bottom: 10, left: 4, right: 4 }}>
            <View style={[styles.dot, i === active ? styles.dotActive : styles.dotInactive]} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },

  topBar: {
    position: 'absolute',
    top: 0, left: 0, right: 0, zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primaryDark,
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 20,
  },
  topBarText: { flex: 1, color: '#FFFFFF', fontSize: 14, fontWeight: '600', marginRight: 16 },
  topHomeBtn: { backgroundColor: '#FFFFFF', borderRadius: 18, paddingHorizontal: 12, paddingVertical: 6, marginRight: 12 },
  topHomeBtnText: { color: '#1B75BB', fontSize: 13, fontWeight: '700' },
  backToChat: {
    alignSelf: 'center', marginTop: 16,
    backgroundColor: '#FFFFFF', borderRadius: 22,
    paddingVertical: 10, paddingHorizontal: 18,
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 6, elevation: 3,
  },
  backToChatText: { color: '#2B6CB0', fontSize: 14, fontWeight: '700' },

  // Estado inicial (centralizado)
  initialContent: { flexGrow: 1, paddingTop: 56 },
  centerBlock: { flex: 1, justifyContent: 'center', width: '100%' },

  // Conversa
  chatContent: { flexGrow: 1, justifyContent: 'flex-end', paddingTop: 56, paddingHorizontal: 16, paddingBottom: 12, gap: 8 },

  logoSection: { alignItems: 'center', paddingVertical: 12, paddingHorizontal: 24 },
  logo: { width: 120, height: 120 },
  slogan: { fontWeight: 'bold', textAlign: 'center', marginTop: 10 },

  // Balões
  bubbleUser: {
    alignSelf: 'flex-end',
    borderRadius: 18, borderBottomRightRadius: 4,
    paddingHorizontal: 16, paddingVertical: 12,
    maxWidth: '80%',
  },
  bubbleUserText: { fontSize: 15, lineHeight: 22 },
  bubbleBot: {
    alignSelf: 'flex-start',
    borderRadius: 18, borderBottomLeftRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 16, paddingVertical: 12,
    maxWidth: '85%',
  },
  locationBtn: { marginTop: 10, paddingTop: 8, borderTopWidth: 1 },
  locationBtnText: { fontWeight: '700' },

  scrollDownBtn: {
    position: 'absolute', bottom: 12, right: 16,
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: '#C3DAFE',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 5, elevation: 4,
  },
  scrollDownIcon: { color: '#2B6CB0', fontSize: 18, fontWeight: 'bold' },

  // Grupo: busca + Mapa/Explorar (andam juntos)
  searchGroup: { width: '100%' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    gap: 10,
  },
  input: {
    flex: 1,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sendButton: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#f7a706',
    alignItems: 'center', justifyContent: 'center',
  },
  sendIcon: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },

  navCards: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 12,
  },
  navCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 14,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
  navCardIcon: { fontSize: 14 },
  navCardLabel: { fontWeight: '600', letterSpacing: 0.2 },

  // Seção Projeto SorrIA (destaque)
  projetoWrap: { marginTop: 16, marginBottom: 8, paddingHorizontal: 20 },
  projetoCard: {
    borderRadius: 24,
    padding: 24,
    overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.28, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 8,
  },
  projetoTag: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5,
    marginBottom: 14,
  },
  projetoTagText: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  projetoTitle: { fontWeight: '800', marginBottom: 10, letterSpacing: 0.3 },
  projetoDesc: { lineHeight: 22, marginBottom: 20 },
  projetoBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    alignSelf: 'flex-start',
    borderRadius: 14, borderWidth: 1,
    paddingVertical: 12, paddingHorizontal: 22,
  },
  projetoBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  projetoBtnArrow: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },

  // Grade de destaques
  gridWrap: { marginTop: 8, width: '100%' },
  slideRow: { alignItems: 'center', paddingHorizontal: 20 },
  gridHeading: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 24,
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  cardImageWrap: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    overflow: 'hidden',
  },
  cardImage: { width: '100%', height: 150, backgroundColor: '#FFFFFF' },
  cardLabel: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cardLabelText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  cardBody: { padding: 14 },
  cardBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  cardBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  cardTitle: { fontSize: 19, fontWeight: '800', color: '#1A202C', marginBottom: 6 },
  cardText: { fontSize: 13, color: '#4A5568', lineHeight: 19, marginBottom: 14 },
  cardButton: { borderRadius: 12, paddingVertical: 11, alignItems: 'center' },
  cardButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  dotsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 14, marginBottom: 16 },
  dot: { height: 8, borderRadius: 4 },
  dotActive: { width: 20, backgroundColor: '#f7a706' },
  dotInactive: { width: 8, backgroundColor: 'rgba(255,255,255,0.5)' },
  arrow: { color: '#FFFFFF', fontSize: 28, fontWeight: '700', paddingHorizontal: 10 },
});
