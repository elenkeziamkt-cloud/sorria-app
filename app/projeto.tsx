import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking, Image,
  useWindowDimensions,
} from 'react-native';
import { Stack } from 'expo-router';
import { useT } from '../src/hooks/useT';
import { useAccessibleTheme } from '../src/hooks/useAccessibleTheme';
import { colors, homeColors } from '../src/theme/colors';
import { HeaderTools } from '../src/components/HeaderTools';
import { HomeButton } from '../src/components/HomeButton';

const GAMBOA_URL = 'https://gamboaacao.org.br';
const PHOTO = require('../assets/images/projeto-sorria.jpg');     // 1558x1600 (~1:1)
const SPONSORS = require('../assets/images/patrocinio-sorria.png'); // 1350x221 (~6:1)

export default function ProjetoScreen() {
  const { lang } = useT();
  const { colors: ac, fontSize, contrastMode } = useAccessibleTheme();
  const { width } = useWindowDimensions();
  const pt = lang === 'pt';
  const wide = width >= 640;

  const isNormal   = contrastMode === 'normal';
  const pageBg     = isNormal ? '#EBF4FF' : ac.background;
  const heroBg     = isNormal ? colors.primaryDark : ac.surface;
  const heroTitle  = isNormal ? '#FFFFFF' : ac.textDark;
  const iaColor    = isNormal ? colors.secondary : ac.accent;
  const heroDesc   = isNormal ? 'rgba(255,255,255,0.92)' : ac.textMedium;
  const cardBg     = isNormal ? colors.surface : ac.surface;
  const cardBd     = isNormal ? '#C3DAFE' : ac.border;
  const footerBg   = isNormal ? colors.primaryDark : ac.surface;
  const footerText = isNormal ? 'rgba(255,255,255,0.75)' : ac.textMedium;

  const t = {
    sectionTitle: pt ? 'Sobre o Projeto' : 'About the Project',
    heroDesc: pt
      ? 'SorrIA é um projeto da Gamboa Ação que deu voz a jovens da Região Portuária do Rio — para contar, com orgulho, a nossa própria história.'
      : "SorrIA is a Gamboa Ação project that gave young people from Rio's Port District a voice — to tell our own story, with pride.",
    p1: pt
      ? 'A Gamboa Ação acredita no poder da educação, da cultura e da tecnologia para transformar vidas. Atuando na região portuária do Rio de Janeiro, desenvolve projetos que fortalecem o pertencimento, ampliam oportunidades e valorizam a história local.'
      : 'Gamboa Ação believes in the power of education, culture and technology to transform lives. Working in the port area of Rio de Janeiro, it develops projects that strengthen belonging, expand opportunities and value local history.',
    p2: pt
      ? 'Este aplicativo é resultado do Projeto SorrIA, iniciativa que une história, turismo, cultura e tecnologia para conectar jovens ao seu território e ao futuro. Durante o projeto, adolescentes e jovens da região central do Rio de Janeiro pesquisaram a história da Zona Portuária, da Pequena África e dos patrimônios que fazem parte da identidade carioca.'
      : 'This app is the result of the SorrIA Project, an initiative that unites history, tourism, culture and technology to connect young people to their territory and to the future. During the project, teenagers and young people from central Rio de Janeiro researched the history of the Port Area, Little Africa and the heritage sites that are part of the carioca identity.',
    p3: pt
      ? 'O conteúdo deste aplicativo foi desenvolvido com a participação dos próprios jovens, protagonistas na criação desta ferramenta digital de valorização da memória, da cultura e do turismo da Região Portuária.'
      : 'The content of this app was developed with the participation of the young people themselves, protagonists in creating this digital tool for valuing the memory, culture and tourism of the Port Area.',
    realizacaoLabel: pt ? 'Realização' : 'Produced by',
    patrocinioLabel: pt ? 'Patrocínio' : 'Sponsorship',
    incentivoLabel: pt ? 'Incentivo' : 'Support',
    realizacao: 'Gamboa Ação',
    patrocinio: pt
      ? 'VLT Carioca, Sotreq e Secretaria de Estado de Cultura e Economia Criativa do Rio de Janeiro.'
      : 'VLT Carioca, Sotreq and the State Secretariat of Culture and Creative Economy of Rio de Janeiro.',
    incentivo: pt
      ? 'Lei Municipal de Incentivo à Cultura – ISS Rio.'
      : 'Municipal Culture Incentive Law – ISS Rio.',
    button: pt ? 'Conheça a Gamboa Ação' : 'Visit Gamboa Ação',
    footerLabel: pt ? 'Patrocínio e apoio' : 'Sponsorship & support',
  };

  const Paragraph = ({ children }: { children: string }) => (
    <Text style={[styles.paragraph, { color: ac.textMedium, fontSize: fontSize(15) }]}>{children}</Text>
  );

  return (
    <View style={[styles.container, { backgroundColor: pageBg }]}>
      <Stack.Screen
        options={{
          headerLeft: () => <HomeButton />,
          headerRight: () => <HeaderTools />,
        }}
      />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HERO */}
        <View style={[styles.hero, { backgroundColor: heroBg, borderBottomColor: colors.secondary }]}>
          <View style={[styles.heroTag, { backgroundColor: 'rgba(247,167,6,0.18)' }]}>
            <Text style={styles.heroTagText}>✨ {pt ? 'NOSSO PROJETO' : 'OUR PROJECT'}</Text>
          </View>
          <Text accessibilityRole="header" style={[styles.heroTitle, { color: heroTitle, fontSize: fontSize(32) }]}>
            {pt ? 'Projeto ' : ''}Sorr<Text style={{ color: iaColor }}>IA</Text>{pt ? '' : ' Project'}
          </Text>
          <Text style={[styles.heroDesc, { color: heroDesc, fontSize: fontSize(15) }]}>{t.heroDesc}</Text>
        </View>

        {/* CORPO */}
        <View style={styles.body}>
          <Text style={[styles.sectionTitle, { color: ac.textDark, fontSize: fontSize(20) }]}>
            {t.sectionTitle}
          </Text>

          {/* Foto do projeto — logo abaixo do título "Sobre o Projeto" */}
          <View style={[styles.photoCard, { width: wide ? 240 : 200 }]}>
            <Image source={PHOTO} style={styles.photo} resizeMode="contain" />
          </View>

          <Paragraph>{t.p1}</Paragraph>
          <Paragraph>{t.p2}</Paragraph>
          <Paragraph>{t.p3}</Paragraph>

          {/* Créditos */}
          <View style={[styles.credits, { backgroundColor: cardBg, borderColor: cardBd }]}>
            <Credit label={t.realizacaoLabel} value={t.realizacao} ac={ac} fontSize={fontSize} accent={colors.accent} />
            <View style={[styles.creditDivider, { backgroundColor: cardBd }]} />
            <Credit label={t.patrocinioLabel} value={t.patrocinio} ac={ac} fontSize={fontSize} accent={colors.primary} />
            <View style={[styles.creditDivider, { backgroundColor: cardBd }]} />
            <Credit label={t.incentivoLabel} value={t.incentivo} ac={ac} fontSize={fontSize} accent={colors.secondaryDark} />
          </View>

          <TouchableOpacity
            style={styles.linkBtn}
            onPress={() => Linking.openURL(GAMBOA_URL)}
            accessibilityRole="link"
            accessibilityLabel={pt ? 'Abrir site da Gamboa Ação' : 'Open Gamboa Ação website'}
          >
            <Text style={styles.linkBtnText}>{t.button}</Text>
            <Text style={styles.linkBtnArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* RODAPÉ com a faixa de patrocínio */}
        <View style={[styles.footer, { backgroundColor: footerBg }]}>
          <Text style={[styles.footerLabel, { color: footerText }]}>{t.footerLabel}</Text>
          <Image source={SPONSORS} style={styles.sponsors} resizeMode="contain" />
        </View>
      </ScrollView>
    </View>
  );
}

function Credit({
  label, value, ac, fontSize, accent,
}: {
  label: string; value: string; ac: any; fontSize: (n: number) => number; accent: string;
}) {
  return (
    <View style={styles.credit}>
      <View style={[styles.creditDot, { backgroundColor: accent }]} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.creditLabel, { color: accent, fontSize: fontSize(12) }]}>{label.toUpperCase()}</Text>
        <Text style={[styles.creditValue, { color: ac.textDark, fontSize: fontSize(14) }]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  hero: {
    paddingHorizontal: 24, paddingTop: 28, paddingBottom: 30,
    alignItems: 'center', borderBottomWidth: 3,
  },
  heroTag: {
    alignSelf: 'center', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5, marginBottom: 12,
  },
  heroTagText: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, color: '#FFD166' },
  heroTitle: { fontWeight: '800', textAlign: 'center', marginBottom: 12, letterSpacing: 0.3 },
  heroDesc: { textAlign: 'center', lineHeight: 22, maxWidth: 560 },

  body: { paddingHorizontal: 20, paddingTop: 22, width: '100%', maxWidth: 760, alignSelf: 'center' },
  sectionTitle: { fontWeight: '800', marginBottom: 12 },
  paragraph: { lineHeight: 23, marginBottom: 16 },

  mediaBlock: { marginBottom: 2 },
  mediaRow: { flexDirection: 'row', gap: 20, alignItems: 'center' },
  paragraphWrap: {},
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  photoCard: {
    borderRadius: 20, overflow: 'hidden', backgroundColor: '#FFFFFF',
    aspectRatio: 1558 / 1600,   // proporção real da foto -> não corta
    alignSelf: 'flex-start', marginTop: 6, marginBottom: 18,
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 }, elevation: 6,
  },
  photo: { width: '100%', height: '100%' },

  credits: {
    borderRadius: 18, borderWidth: 1, padding: 18, marginTop: 6, marginBottom: 20,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2,
  },
  credit: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  creditDot: { width: 10, height: 10, borderRadius: 5, marginTop: 5 },
  creditLabel: { fontWeight: '800', letterSpacing: 0.8, marginBottom: 2 },
  creditValue: { lineHeight: 20, fontWeight: '500' },
  creditDivider: { height: 1, marginVertical: 12, marginLeft: 22 },

  linkBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'center',
    backgroundColor: colors.secondary, borderRadius: 26,
    paddingVertical: 13, paddingHorizontal: 26, marginBottom: 8,
  },
  linkBtnText: { color: '#1A202C', fontWeight: '800', fontSize: 14 },
  linkBtnArrow: { color: '#1A202C', fontWeight: '800', fontSize: 16 },

  footer: {
    marginTop: 18, paddingHorizontal: 20, paddingTop: 22, paddingBottom: 28,
    alignItems: 'center', gap: 14,
  },
  footerLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' },
  sponsors: { width: '100%', maxWidth: 540, aspectRatio: 1350 / 221, alignSelf: 'center' },
});
