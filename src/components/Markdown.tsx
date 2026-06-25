import { Text, View, StyleSheet, TextStyle } from 'react-native';
import { colors } from '../theme/colors';

interface MarkdownProps {
  children: string;
  color?: string;
  size?: number;
}

// Parser leve: suporta **negrito**, *'itálico'*, bullets "- " e quebras de linha.
// Não é um parser markdown completo — cobre só o que as respostas do bot usam.
export function Markdown({ children, color = colors.textDark, size = 14 }: MarkdownProps) {
  const lines = children.split('\n');

  return (
    <View>
      {lines.map((line, i) => {
        if (line.trim() === '') {
          return <View key={i} style={{ height: 8 }} />;
        }

        const isBullet = /^\s*[-•]\s+/.test(line);
        const content  = isBullet ? line.replace(/^\s*[-•]\s+/, '') : line;

        return (
          <View key={i} style={isBullet ? styles.bulletRow : undefined}>
            {isBullet && <Text style={[styles.bullet, { color, fontSize: size }]}>•</Text>}
            <Text style={[styles.line, { color, fontSize: size, lineHeight: size * 1.5 }]}>
              {parseInline(content, { color, fontSize: size })}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// Quebra uma linha em segmentos normais/negrito/itálico
function parseInline(text: string, base: TextStyle): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  // Captura **bold** ou *'italic'* ou *italic*
  const regex = /\*\*(.+?)\*\*|\*'(.+?)'\*|\*(.+?)\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;

  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) {
      nodes.push(<Text key={key++}>{text.slice(last, m.index)}</Text>);
    }
    if (m[1] !== undefined) {
      nodes.push(<Text key={key++} style={styles.bold}>{m[1]}</Text>);
    } else {
      const italicText = m[2] ?? m[3] ?? '';
      nodes.push(<Text key={key++} style={styles.italic}>{italicText}</Text>);
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) {
    nodes.push(<Text key={key++}>{text.slice(last)}</Text>);
  }
  return nodes;
}

const styles = StyleSheet.create({
  line:      { },
  bold:      { fontWeight: '700' },
  italic:    { fontStyle: 'italic' },
  bulletRow: { flexDirection: 'row', paddingLeft: 4 },
  bullet:    { marginRight: 6, lineHeight: 21 },
});
