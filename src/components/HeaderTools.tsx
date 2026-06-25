import { View, StyleSheet } from 'react-native';
import { LanguageToggle } from './LanguageToggle';
import { AccessibilityMenu } from './AccessibilityMenu';

// Ferramentas do topo à direita: seletor de idioma (BR | US) + acessibilidade (♿).
// O ♿ fica imediatamente à direita do BR|US, com 12px de espaçamento
// (definidos pela marginLeft do AccessibilityMenu).
export function HeaderTools() {
  return (
    <View style={styles.row}>
      <LanguageToggle />
      <AccessibilityMenu />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
