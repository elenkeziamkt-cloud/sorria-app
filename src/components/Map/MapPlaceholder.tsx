import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { useT } from '../../hooks/useT';

export default function MapPlaceholder() {
  const { lang } = useT();
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🗺️</Text>
      <Text style={styles.title}>
        {lang === 'en' ? 'Interactive Map' : 'Mapa Interativo'}
      </Text>
      <Text style={styles.sub}>
        {lang === 'en'
          ? 'The interactive map is available in the native app build.\nInstall via EAS Development Build to use it.'
          : 'O mapa interativo está disponível no build nativo do app.\nInstale via EAS Development Build para usá-lo.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 32,
    gap: 16,
  },
  icon:  { fontSize: 64 },
  title: { fontSize: 22, fontWeight: '700', color: colors.textDark, textAlign: 'center' },
  sub:   { fontSize: 15, color: colors.textMedium, textAlign: 'center', lineHeight: 22 },
});
