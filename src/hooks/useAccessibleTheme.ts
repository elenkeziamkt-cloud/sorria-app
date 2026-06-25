import { useAccessibilityStore } from '../store/accessibilityStore';
import { colors } from '../theme/colors';

// Tema acessível: combina a paleta base com overrides de contraste
// e expõe um helper de escala de fonte.
export function useAccessibleTheme() {
  const { contrastMode, fontSizeBase, fontScale } = useAccessibilityStore();

  const themeColors = {
    normal: {
      ...colors,
    },
    high: {
      ...colors,
      background: '#000000',
      textDark: '#FFFFFF',
      textMedium: '#FFFFFF',
      textLight: '#CCCCCC',
      surface: '#1A1A1A',
      border: '#FFFFFF',
      primary: '#FFD166',
    },
    inverted: {
      ...colors,
      background: '#FFFFE0',
      textDark: '#000000',
      textMedium: '#111111',
      textLight: '#333333',
      surface: '#FFFFF0',
      border: '#000000',
      primary: '#00008B',
    },
  } as const;

  return {
    colors: themeColors[contrastMode],
    contrastMode,
    fontSizeBase,
    fontScale,
    // escala um tamanho de fonte proporcionalmente
    fontSize: (size: number) => Math.round(size * fontScale),
  };
}
