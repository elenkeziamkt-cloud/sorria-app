import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { getAllLocations, searchLocations, Location } from '../../src/db/queries/locations';
import { useT } from '../../src/hooks/useT';
import { categoryLabel } from '../../src/i18n/translations';
import { localizeLocation } from '../../src/i18n/localize';
import { HeaderTools } from '../../src/components/HeaderTools';
import { colors, metaForCategory } from '../../src/theme/colors';
import { LocationCardSkeleton } from '../../src/components/Skeleton';
import { useSeedStore } from '../../src/store/seedStore';
import { useAccessibleTheme } from '../../src/hooks/useAccessibleTheme';

const norm = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export default function ExploreScreen() {
  const { T, lang } = useT();
  const { colors: ac, fontSize, contrastMode } = useAccessibleTheme();
  // Fundo no tom mais claro da paleta (mantém preto/amarelo nos modos de contraste)
  const screenBg = contrastMode === 'normal' ? colors.primaryBg : ac.background;
  const seeded = useSeedStore(s => s.seeded);
  const [locations, setLocations] = useState<Location[]>([]);
  const [filtered, setFiltered] = useState<Location[]>([]);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const CATEGORY_FILTERS = [
    { slug: 'all',         label: T.explore.filters.all,         icon: '🧭' },
    { slug: 'museu',       label: T.explore.filters.museu,       icon: '🖼️' },
    { slug: 'patrimonio',  label: T.explore.filters.patrimonio,  icon: '🏛️' },
    { slug: 'praca',       label: T.explore.filters.praca,       icon: '🌳' },
    { slug: 'igreja',      label: T.explore.filters.igreja,      icon: '⛪' },
    { slug: 'cultura',     label: T.explore.filters.cultura,     icon: '🎨' },
    { slug: 'gastronomia', label: T.explore.filters.gastronomia, icon: '🍽️' },
  ];

  // Só carrega quando o seed terminou
  useEffect(() => {
    if (!seeded) return;
    getAllLocations().then(data => {
      setLocations(data);
      setFiltered(data);
      setLoading(false);
    });
  }, [seeded]);

  useEffect(() => {
    if (search.length > 2) {
      searchLocations(search).then(setFiltered);
    } else {
      let result: Location[];
      if (activeFilter === 'all') {
        result = locations;
      } else if (activeFilter === 'patrimonio') {
        // Patrimônio histórico: todos os locais marcados como heritage,
        // independente da categoria (Igreja, Teatro, Museu, etc.)
        result = locations.filter(l => l.is_heritage === 1);
      } else {
        result = locations.filter(l => norm(l.category_label ?? '').includes(activeFilter));
      }
      setFiltered(result);
    }
  }, [search, activeFilter, locations]);

  function renderItem({ item }: { item: Location }) {
    const loc = localizeLocation(item, lang);
    const meta = metaForCategory(item.category_slug);
    const admNorm = norm(loc.admission ?? '');
    const isFree = /gratu|gratis|livre|nao ha ingresso|area publica/.test(admNorm);
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: ac.surface, borderColor: ac.border, borderLeftColor: meta.color }]}
        onPress={() => router.push(`/location/${item.slug}`)}
        activeOpacity={0.85}
      >
        {/* Ícone colorido da categoria */}
        <View style={[styles.cardIcon, { backgroundColor: meta.color }]}>
          <Text style={styles.cardIconText}>{meta.icon}</Text>
        </View>

        {/* Conteúdo */}
        <View style={styles.cardContent}>
          <View style={[styles.catPill, { backgroundColor: meta.color + '1A' }]}>
            <Text style={[styles.catPillText, { color: meta.color }]} numberOfLines={1}>
              {categoryLabel(item.category_slug, lang, item.category_label)}
            </Text>
          </View>
          <Text style={[styles.cardTitle, { color: ac.textDark, fontSize: fontSize(17) }]} numberOfLines={1}>
            {loc.name}
          </Text>
          <Text style={[styles.cardDesc, { color: ac.textMedium, fontSize: fontSize(13) }]} numberOfLines={2}>
            {loc.short_description}
          </Text>
          <View style={styles.cardFooter}>
            <Text style={[styles.cardNeighborhood, { color: ac.textLight, fontSize: fontSize(12) }]} numberOfLines={1}>
              📍 {loc.neighborhood}
            </Text>
            {!!loc.admission && (
              <Text
                style={[styles.cardAdmission, { color: isFree ? colors.success : ac.textMedium, fontSize: fontSize(12) }]}
                numberOfLines={1}
              >
                {loc.admission}
              </Text>
            )}
          </View>
        </View>

        <Text style={[styles.chevron, { color: ac.textLight }]}>›</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: screenBg }]}>
      <Stack.Screen
        options={{
          headerTitle: T.explore.title,
          headerRight: () => <HeaderTools />,
        }}
      />
      <View style={styles.titleRow}>
        <Text style={[styles.title, { color: ac.textDark, fontSize: fontSize(28) }]}>{T.explore.title}</Text>
        <Text style={[styles.subtitle, { color: ac.textLight, fontSize: fontSize(14) }]}>{T.explore.subtitle}</Text>
      </View>

      {/* Busca com ícone */}
      <View style={[styles.searchBar, { backgroundColor: ac.surface, borderColor: ac.border }]}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={[styles.searchInput, { color: ac.textDark, fontSize: fontSize(15) }]}
          placeholder={T.explore.searchPlaceholder}
          value={search}
          onChangeText={setSearch}
          placeholderTextColor={ac.textLight}
        />
      </View>

      {/* Filtros — quebram em linha (não cortam) */}
      <View style={styles.filterWrap}>
        {CATEGORY_FILTERS.map(f => {
          const isActive = activeFilter === f.slug;
          const activeColor = f.slug === 'all' ? ac.primary : metaForCategory(f.slug).color;
          return (
            <TouchableOpacity
              key={f.slug}
              activeOpacity={0.8}
              onPress={() => setActiveFilter(f.slug)}
              style={[
                styles.chip,
                {
                  backgroundColor: isActive ? activeColor : ac.surface,
                  borderColor: isActive ? activeColor : ac.border,
                },
              ]}
            >
              <Text style={[styles.chipText, { color: isActive ? '#FFFFFF' : ac.textMedium, fontSize: fontSize(13) }]}>
                {f.icon} {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <FlatList
          data={[1, 2, 3, 4, 5, 6]}
          keyExtractor={i => String(i)}
          renderItem={() => <LocationCardSkeleton />}
          contentContainerStyle={styles.list}
          scrollEnabled={false}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={i => String(i.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: ac.textLight, fontSize: fontSize(15) }]}>{T.explore.empty}</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  titleRow: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
  title: { fontSize: 28, fontWeight: '800', color: colors.textDark },
  subtitle: { fontSize: 14, color: colors.textLight, marginTop: 2 },

  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 20, marginTop: 12,
    backgroundColor: colors.surface, borderRadius: 24,
    paddingHorizontal: 16, borderWidth: 1, borderColor: colors.border,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: colors.textDark },

  // Filtros (wrap — nada corta)
  filterWrap: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 6,
  },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, backgroundColor: colors.surface,
  },
  chipText: { fontSize: 13, fontWeight: '600' },

  list: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 24 },

  // Card
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surface, borderRadius: 18, padding: 14,
    marginBottom: 12, borderWidth: 1, borderLeftWidth: 5,
    shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  cardIcon: {
    width: 50, height: 50, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start',
  },
  cardIconText: { fontSize: 24 },
  cardContent: { flex: 1 },
  catPill: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginBottom: 6 },
  catPillText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
  chevron: { fontSize: 26, fontWeight: '400', marginLeft: 2 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: colors.textDark, marginBottom: 4 },
  cardDesc: { fontSize: 13, color: colors.textMedium, lineHeight: 19, marginBottom: 8 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  cardNeighborhood: { fontSize: 12, color: colors.textLight, flexShrink: 1 },
  cardAdmission: { fontSize: 12, color: colors.textMedium, fontWeight: '600' },
  emptyText: { textAlign: 'center', color: colors.textLight, marginTop: 40, fontSize: 15 },
});
