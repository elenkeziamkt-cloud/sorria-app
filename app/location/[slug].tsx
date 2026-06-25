import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { getLocationBySlug, getLocationContent, Location, LocationContent } from '../../src/db/queries/locations';
import { useT } from '../../src/hooks/useT';
import { categoryLabel } from '../../src/i18n/translations';
import { localizeLocation, localizeContent } from '../../src/i18n/localize';
import { useAccessibleTheme } from '../../src/hooks/useAccessibleTheme';
import { metaForCategory, colors } from '../../src/theme/colors';
import { Markdown } from '../../src/components/Markdown';

export default function LocationDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { T, lang } = useT();
  const { colors: ac, fontSize, contrastMode } = useAccessibleTheme();
  const [location, setLocation] = useState<Location | null>(null);
  const [content, setContent] = useState<LocationContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'historia' | 'curiosidades' | 'dicas'>('historia');

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const loc = await getLocationBySlug(slug);
      setLocation(loc);
      if (loc) {
        const cnt = await getLocationContent(loc.id);
        setContent(cnt);
      }
      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#0891B2" size="large" />
      </View>
    );
  }

  if (!location) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>{T.location.notFound}</Text>
      </View>
    );
  }

  const loc = localizeLocation(location, lang);
  const cnt = content ? localizeContent(slug, content, lang) : content;
  const hours = loc.opening_hours as Record<string, string>;
  const meta = metaForCategory(location.category_slug);

  // Base azul claro da paleta (variações de #EBF4FF) + dourado só nos detalhes.
  // Só no modo normal — acessibilidade mantém os tons de alto contraste.
  const isNormal  = contrastMode === 'normal';
  const pageBg    = isNormal ? '#EBF4FF' : ac.background;  // azul bem claro (base)
  const heroBg    = isNormal ? '#DCEAFD' : ac.background;  // azul claro (faixa do topo)
  const cardBg    = isNormal ? colors.surface : ac.surface;
  const cardBd    = isNormal ? '#C3DAFE' : ac.border;      // borda azul clara
  const gold      = colors.secondary;                      // #f7a706 — detalhe/accent
  const timeColor = isNormal ? colors.primary : ac.primary; // horários em azul (legível)
  const tabLabels = {
    historia:     T.location.tabs.historia,
    curiosidades: T.location.tabs.curiosidades,
    dicas:        T.location.tabs.dicas,
  };

  return (
    <View style={[styles.container, { backgroundColor: pageBg }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: heroBg, borderBottomWidth: 3, borderBottomColor: gold }]}>
          <View style={[styles.heroIcon, { backgroundColor: meta.color }]}>
            <Text style={styles.heroEmoji}>{meta.icon}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: meta.color + '1A', borderWidth: 1, borderColor: meta.color }]}>
            <Text style={[styles.badgeText, { color: meta.color }]}>
              {categoryLabel(location.category_slug, lang, location.category_label)}
            </Text>
          </View>
          <Text style={[styles.heroTitle, { color: ac.textDark, fontSize: fontSize(24) }]}>{loc.name}</Text>
          <Text style={[styles.heroDesc, { color: ac.textMedium, fontSize: fontSize(14) }]}>{loc.short_description}</Text>
        </View>

        {/* Info rápida */}
        <View style={styles.infoRow}>
          <InfoChip icon="📍" text={loc.neighborhood} />
          <InfoChip icon="💰" text={loc.admission} color="#059669" />
        </View>

        {loc.address && (
          <View style={styles.infoRow}>
            <InfoChip icon="🗺️" text={loc.address} />
          </View>
        )}

        {/* Horários */}
        {Object.keys(hours).length > 0 && (
          <View style={[styles.hoursCard, { backgroundColor: cardBg, borderColor: cardBd, borderLeftWidth: 4, borderLeftColor: gold }]}>
            <Text style={[styles.hoursTitle, { color: ac.textDark, fontSize: fontSize(14) }]}>{T.location.hours}</Text>
            {Object.entries(hours).map(([day, time]) => (
              <View key={day} style={styles.hoursRow}>
                <Text style={[styles.hoursDay, { color: ac.textMedium, fontSize: fontSize(13) }]}>{day}</Text>
                <Text style={[styles.hoursTime, { color: timeColor, fontSize: fontSize(13) }]}>{time}</Text>
              </View>
            ))}
          </View>
        )}

        {(loc.admission || loc.address || Object.keys(hours).length > 0) && (
          <Text style={styles.changeNote}>
            {T.location.changeNote}
          </Text>
        )}

        {/* Tabs */}
        <View style={styles.tabs}>
          {(['historia', 'curiosidades', 'dicas'] as const).map(key => (
            <TouchableOpacity
              key={key}
              style={[styles.tab, tab === key && styles.tabActive]}
              onPress={() => setTab(key)}
            >
              <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>
                {tabLabels[key]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.tabContent}>
          {tab === 'historia' && cnt?.history && (
            <Markdown color={ac.textDark} size={fontSize(15)}>{cnt.history}</Markdown>
          )}

          {tab === 'curiosidades' && (
            <View>
              {(cnt?.curiosities ?? []).map((c, i) => (
                <View key={i} style={styles.listItem}>
                  <Text style={styles.listBullet}>💡</Text>
                  <View style={{ flex: 1 }}>
                    <Markdown color={ac.textDark} size={fontSize(14)}>{c}</Markdown>
                  </View>
                </View>
              ))}
            </View>
          )}

          {tab === 'dicas' && (
            <View>
              {(cnt?.practical_tips ?? []).map((tip, i) => (
                <View key={i} style={styles.listItem}>
                  <Text style={styles.listBullet}>✅</Text>
                  <View style={{ flex: 1 }}>
                    <Markdown color={ac.textDark} size={fontSize(14)}>{tip}</Markdown>
                  </View>
                </View>
              ))}
              {cnt?.how_to_get_there && (
                <View style={styles.howToCard}>
                  <Text style={styles.howToTitle}>{T.location.howToGet}</Text>
                  <Markdown color={ac.textDark} size={fontSize(13)}>{cnt.how_to_get_there}</Markdown>
                </View>
              )}
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function InfoChip({ icon, text, color }: { icon: string; text: string; color?: string }) {
  const { colors: ac, fontSize, contrastMode } = useAccessibleTheme();
  const isNormal = contrastMode === 'normal';
  const bg = isNormal ? colors.surface : ac.surface;
  const bd = isNormal ? '#C3DAFE' : ac.border;
  return (
    <View style={[styles.chip, { backgroundColor: bg, borderColor: bd }]}>
      <Text>{icon}</Text>
      <Text style={[styles.chipText, { color: color ?? ac.textMedium, fontSize: fontSize(13) }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  notFound: { fontSize: 16, color: '#64748B' },
  changeNote: {
    marginHorizontal: 20, marginTop: 10, marginBottom: 4,
    fontSize: 12, color: '#92400E', lineHeight: 17,
    backgroundColor: '#FEF3C7', borderRadius: 10, padding: 10,
  },
  hero: { padding: 24, paddingTop: 32, alignItems: 'center' },
  heroIcon: {
    width: 64, height: 64, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  heroEmoji: { fontSize: 32 },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10, marginBottom: 10 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  heroTitle: {
    fontSize: 24, fontWeight: '800', color: '#0F172A',
    textAlign: 'center', marginBottom: 8,
  },
  heroDesc: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 21 },
  infoRow: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 20, gap: 8, marginBottom: 4,
  },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0',
  },
  chipText: { fontSize: 13, color: '#475569', fontWeight: '500' },
  hoursCard: {
    marginHorizontal: 20, marginTop: 12,
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  hoursTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A', marginBottom: 10 },
  hoursRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  hoursDay: { fontSize: 13, color: '#475569', textTransform: 'capitalize' },
  hoursTime: { fontSize: 13, color: '#0891B2', fontWeight: '600' },
  tabs: {
    flexDirection: 'row', marginHorizontal: 20, marginTop: 20,
    backgroundColor: '#DCEAFD', borderRadius: 12, padding: 4,
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  tabText: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },
  tabTextActive: { color: '#0F172A' },
  tabContent: { paddingHorizontal: 20, paddingTop: 16 },
  historyText: { fontSize: 15, color: '#334155', lineHeight: 26 },
  listItem: { flexDirection: 'row', gap: 10, marginBottom: 14, alignItems: 'flex-start' },
  listBullet: { fontSize: 16, marginTop: 2 },
  listText: { flex: 1, fontSize: 14, color: '#334155', lineHeight: 22 },
  howToCard: { backgroundColor: '#EBF4FF', borderRadius: 14, padding: 16, marginTop: 16, borderLeftWidth: 4, borderLeftColor: '#f7a706' },
  howToTitle: { fontSize: 14, fontWeight: '700', color: '#1D4ED8', marginBottom: 10 },
  howToText: { fontSize: 13, color: '#334155', lineHeight: 22 },
});
