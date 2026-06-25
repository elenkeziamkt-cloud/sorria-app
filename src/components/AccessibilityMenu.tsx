import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, Pressable,
} from 'react-native';
import { useAccessibilityStore } from '../store/accessibilityStore';
import { useT } from '../hooks/useT';

export function AccessibilityMenu() {
  const { lang } = useT();
  const pt = lang === 'pt';
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState(false);
  const {
    contrastMode, toggleContrast, increaseFontSize, decreaseFontSize, resetAll,
  } = useAccessibilityStore();

  const MODE_LABEL: Record<string, string> = pt
    ? { normal: 'Normal', high: 'Alto contraste', inverted: 'Invertido' }
    : { normal: 'Normal', high: 'High contrast', inverted: 'Inverted' };

  function handleReset() {
    resetAll();
    setOpen(false);
    setFeedback(true);
    setTimeout(() => setFeedback(false), 1600);
  }

  return (
    <>
      <TouchableOpacity
        style={styles.iconBtn}
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
        accessibilityLabel={pt ? 'Menu de acessibilidade' : 'Accessibility menu'}
        accessibilityRole="button"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.icon}>♿</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        {/* clicar fora fecha */}
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          {/* o dropdown absorve o toque para não fechar ao clicar nele */}
          <Pressable style={styles.dropdown} onPress={() => {}}>
            <Row
              circle="◑"
              label={pt ? 'contraste' : 'contrast'}
              right={`✓ ${MODE_LABEL[contrastMode]}`}
              onPress={toggleContrast}
            />
            <Divider />
            <Row circle="A+" label={pt ? 'aumentar fonte' : 'increase font'} onPress={increaseFontSize} />
            <Divider />
            <Row circle="A-" label={pt ? 'diminuir fonte' : 'decrease font'} onPress={decreaseFontSize} />
            <Divider />
            <Row label={pt ? 'limpar' : 'reset'} center onPress={handleReset} />
          </Pressable>
        </Pressable>
      </Modal>

      {/* feedback breve do "limpar" */}
      <Modal visible={feedback} transparent animationType="fade">
        <View style={styles.toastWrap} pointerEvents="none">
          <Text style={styles.toast}>✓ {pt ? 'Configurações resetadas' : 'Settings reset'}</Text>
        </View>
      </Modal>
    </>
  );
}

function Row({
  circle, label, right, center, onPress,
}: {
  circle?: string; label: string; right?: string; center?: boolean; onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {circle ? (
        <View style={styles.circle}>
          <Text style={styles.circleText}>{circle}</Text>
        </View>
      ) : null}
      <Text style={[styles.rowLabel, center && styles.rowLabelCenter, !circle && !center && { marginLeft: 0 }]}>
        {label}
      </Text>
      {right ? <Text style={styles.rowRight}>{right}</Text> : null}
    </Pressable>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  iconBtn: {
    marginLeft: 8,
    paddingHorizontal: 9,
    paddingVertical: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
  },
  icon: {
    fontSize: 20,
    color: '#1B75BB',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  dropdown: {
    position: 'absolute',
    top: 92,
    right: 12,
    width: 200,
    backgroundColor: '#2B6CB0',
    borderRadius: 12,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  rowPressed: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  circle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  circleText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  rowLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  rowLabelCenter: {
    textAlign: 'center',
  },
  rowRight: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
    opacity: 0.9,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  toastWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 80,
  },
  toast: {
    backgroundColor: '#1A202C',
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    overflow: 'hidden',
  },
});
