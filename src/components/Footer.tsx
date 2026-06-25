import { View, Text, StyleSheet, TouchableOpacity, Linking, Image } from 'react-native';
import { colors } from '../theme/colors';
import { useT } from '../hooks/useT';
import { useAccessibleTheme } from '../hooks/useAccessibleTheme';

const GAMBOA_URL = 'https://gamboaacao.org.br';
const SPONSORS = require('../../assets/images/patrocinio-sorria.png'); // 1350x221 (~6:1)

export function Footer() {
  const { lang } = useT();
  const { colors: ac, fontSize } = useAccessibleTheme();

  return (
    <View style={[styles.container, { backgroundColor: ac.surface, borderTopColor: ac.border }]}>
      <Text style={[styles.sponsorsLabel, { color: ac.textLight }]}>
        {lang === 'pt' ? 'PATROCÍNIO E APOIO' : 'SPONSORSHIP & SUPPORT'}
      </Text>
      <Image source={SPONSORS} style={styles.sponsors} resizeMode="contain" />

      <Text style={[styles.created, { color: ac.textMedium, fontSize: fontSize(12) }]}>
        {lang === 'pt' ? 'Criado por ' : 'Created by '}
        <Text style={[styles.brand, { color: ac.accent }]}>Gamboa Ação</Text>
      </Text>

      <TouchableOpacity
        onPress={() => Linking.openURL(GAMBOA_URL)}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        accessibilityRole="link"
        accessibilityLabel={lang === 'pt' ? 'Abrir site da Gamboa Ação' : 'Open Gamboa Ação website'}
      >
        <Text style={[styles.link, { color: ac.accent, fontSize: fontSize(12) }]}>
          gamboaacao.org.br
        </Text>
      </TouchableOpacity>

      <Text style={[styles.copy, { color: ac.textLight, fontSize: fontSize(11) }]}>
        © 2025 SorrIA · v1.0
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 16,
    paddingBottom: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 3,
  },
  sponsorsLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 },
  sponsors: { width: '100%', maxWidth: 460, aspectRatio: 1350 / 221, marginBottom: 14 },
  created: { textAlign: 'center' },
  brand: { fontWeight: '700' },
  link: { fontWeight: '600', textDecorationLine: 'underline' },
  copy: { marginTop: 10, letterSpacing: 0.3 },
});
