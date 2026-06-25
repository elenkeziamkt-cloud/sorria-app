import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useT } from '../hooks/useT';

// Botão fixo para voltar à Home (onde fica a busca/chat) a partir de
// qualquer tela — evita ficar "preso" no Mapa, Explorar ou Detalhe.
export function HomeButton() {
  const { T, lang } = useT();
  return (
    <TouchableOpacity
      onPress={() => router.navigate('/')}
      activeOpacity={0.7}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityRole="button"
      accessibilityLabel={lang === 'pt' ? 'Voltar para a Home (nova pesquisa)' : 'Back to Home (new search)'}
      style={styles.btn}
    >
      <Text style={styles.icon}>⌂</Text>
      <Text style={styles.txt}>{T.home.homeBtn}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 12,
  },
  icon: { fontSize: 16, color: '#1B75BB', fontWeight: '700', lineHeight: 18 },
  txt: { fontSize: 13, color: '#1B75BB', fontWeight: '600' },
});
