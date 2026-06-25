import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useT } from '../hooks/useT';

export function LanguageToggle() {
  const { lang, setLang } = useT();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.btn, lang === 'pt' && styles.btnActive]}
        onPress={() => setLang('pt')}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
      >
        <Text style={[styles.flag, lang === 'pt' && styles.flagActive]}>🇧🇷</Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      <TouchableOpacity
        style={[styles.btn, lang === 'en' && styles.btnActive]}
        onPress={() => setLang('en')}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
      >
        <Text style={[styles.flag, lang === 'en' && styles.flagActive]}>🇺🇸</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    padding: 3,
  },
  btn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  btnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  flag: {
    fontSize: 18,
    opacity: 0.45,
  },
  flagActive: {
    opacity: 1,
  },
  divider: {
    width: 1,
    height: 14,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 2,
  },
});
