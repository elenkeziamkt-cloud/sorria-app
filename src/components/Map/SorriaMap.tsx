import { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Dimensions, ActivityIndicator,
} from 'react-native';
import {
  Map,
  Camera,
  Marker,
  type CameraRef,
} from '@maplibre/maplibre-react-native';
import { router } from 'expo-router';
import { getAllLocations, Location } from '../../db/queries/locations';
import { useT } from '../../hooks/useT';
import { metaForCategory } from '../../theme/colors';
import { categoryLabel } from '../../i18n/translations';
import { localizeLocation } from '../../i18n/localize';
import {
  MAP_STYLE_URL,
  RIO_PORT_CENTER,
  MAP_ZOOM_INITIAL,
} from './MapConfig';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function SorriaMap() {
  const { T, lang } = useT();
  const [locations, setLocations]       = useState<Location[]>([]);
  const [selected, setSelected]         = useState<Location | null>(null);
  const [mapReady, setMapReady]          = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const cameraRef = useRef<CameraRef>(null);

  const FILTERS = [
    { slug: null,         label: T.map.filters.all },
    { slug: 'museu',      label: T.map.filters.museu },
    { slug: 'patrimonio', label: T.map.filters.patrimonio },
    { slug: 'cultura',    label: T.map.filters.cultura },
    { slug: 'vlt',        label: T.map.filters.vlt },
  ];

  useEffect(() => {
    getAllLocations().then(setLocations);
  }, []);

  const displayedLocations = activeFilter
    ? locations.filter(l =>
        l.category_label?.toLowerCase().includes(activeFilter) ||
        l.category_icon?.toLowerCase().includes(activeFilter))
    : locations;

  const flyTo = useCallback((lat: number, lng: number) => {
    cameraRef.current?.flyTo({ center: [lng, lat], zoom: 16, duration: 500 });
  }, []);

  function handleMarkerPress(location: Location) {
    setSelected(location);
    flyTo(location.lat, location.lng);
  }

  const sel = selected ? localizeLocation(selected, lang) : null;

  return (
    <View style={styles.container}>
      {/* Filtros flutuantes */}
      <View style={styles.filtersWrapper}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={String(f.slug)}
            style={[styles.chip, activeFilter === f.slug && styles.chipActive]}
            onPress={() => setActiveFilter(f.slug)}
          >
            <Text style={[styles.chipText, activeFilter === f.slug && styles.chipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Mapa */}
      <Map
        style={styles.map}
        mapStyle={MAP_STYLE_URL}
        logo={false}
        attribution
        attributionPosition={{ bottom: 8, right: 8 }}
        onDidFinishLoadingMap={() => setMapReady(true)}
      >
        <Camera
          ref={cameraRef}
          initialViewState={{
            center: [RIO_PORT_CENTER.lng, RIO_PORT_CENTER.lat],
            zoom:    MAP_ZOOM_INITIAL,
          }}
        />

        {mapReady && displayedLocations.map(loc => (
          <Marker
            key={`m-${loc.id}`}
            id={`m-${loc.id}`}
            lngLat={[loc.lng, loc.lat]}
            anchor="bottom"
            onPress={() => handleMarkerPress(loc)}
          >
            <MarkerPin
              emoji={metaForCategory(loc.category_slug).icon}
              color={metaForCategory(loc.category_slug).color}
              isSelected={selected?.id === loc.id}
            />
          </Marker>
        ))}
      </Map>

      {/* Loading overlay */}
      {!mapReady && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color="#0891B2" size="large" />
          <Text style={styles.loadingText}>{T.map.loading}</Text>
        </View>
      )}

      {/* Badge contador */}
      {mapReady && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{displayedLocations.length} {T.map.places}</Text>
        </View>
      )}

      {/* Card de preview */}
      {sel && (
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => setSelected(null)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.closeTxt}>✕</Text>
          </TouchableOpacity>

          <View style={styles.cardHeader}>
            <View style={[
              styles.cardIcon,
              { backgroundColor: metaForCategory(sel.category_slug).color + '20' },
            ]}>
              <Text style={styles.cardEmoji}>
                {metaForCategory(sel.category_slug).icon}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardCat}>{categoryLabel(sel.category_slug, lang, sel.category_label)}</Text>
              <Text style={styles.cardName} numberOfLines={2}>{sel.name}</Text>
            </View>
          </View>

          <Text style={styles.cardDesc} numberOfLines={2}>
            {sel.short_description}
          </Text>

          <View style={styles.cardFooter}>
            <Text style={[
              styles.cardAdmission,
              { color: /gratu|free/i.test(sel.admission ?? '') ? '#059669' : '#0891B2' },
            ]}>
              {/gratu|free/i.test(sel.admission ?? '') ? '✅ ' : '💰 '}
              {sel.admission}
            </Text>

            <TouchableOpacity
              style={styles.openBtn}
              onPress={() => router.push(`/location/${sel.slug}`)}
            >
              <Text style={styles.openBtnTxt}>{T.map.seeMore}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

function MarkerPin({
  emoji, color, isSelected,
}: {
  emoji: string;
  color: string;
  isSelected: boolean;
}) {
  return (
    <View style={[
      styles.pin,
      { borderColor: color, backgroundColor: isSelected ? color : '#FFFFFF' },
      isSelected && styles.pinSelected,
    ]}>
      <Text style={[styles.pinEmoji, isSelected && styles.pinEmojiSelected]}>
        {emoji}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map:       { flex: 1 },

  filtersWrapper: {
    position: 'absolute', top: 8, left: 0, right: 0, zIndex: 10,
    flexDirection: 'row', paddingHorizontal: 16, gap: 8, flexWrap: 'nowrap',
  },
  chip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 4, elevation: 4,
  },
  chipActive:     { backgroundColor: '#0891B2' },
  chipText:       { fontSize: 12, color: '#475569', fontWeight: '600' },
  chipTextActive: { color: '#FFFFFF' },

  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: { color: '#0891B2', fontSize: 15, fontWeight: '600' },

  badge: {
    position: 'absolute', top: 48, right: 16,
    backgroundColor: '#FFFFFF', borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 5,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  badgeText: { fontSize: 12, color: '#64748B', fontWeight: '600' },

  pin: {
    width: 36, height: 36, borderRadius: 18, borderWidth: 2.5,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 3, elevation: 4,
  },
  pinSelected: {
    width: 46, height: 46, borderRadius: 23, borderWidth: 3,
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 8,
  },
  pinEmoji:         { fontSize: 17 },
  pinEmojiSelected: { fontSize: 22 },

  card: {
    position: 'absolute', bottom: 24, left: 16,
    width: SCREEN_WIDTH - 32,
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.14, shadowRadius: 12, elevation: 8,
  },
  closeBtn: {
    position: 'absolute', top: 12, right: 12, zIndex: 1,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center',
  },
  closeTxt: { fontSize: 12, color: '#64748B', fontWeight: '700' },

  cardHeader: { flexDirection: 'row', gap: 12, marginBottom: 8, alignItems: 'center' },
  cardIcon: {
    width: 48, height: 48, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  cardEmoji:    { fontSize: 24 },
  cardCat:      { fontSize: 11, color: '#94A3B8', fontWeight: '600', marginBottom: 2 },
  cardName:     { fontSize: 16, fontWeight: '700', color: '#0F172A', lineHeight: 21 },
  cardDesc:     { fontSize: 13, color: '#64748B', lineHeight: 19, marginBottom: 10 },
  cardFooter:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardAdmission:{ fontSize: 12, fontWeight: '600' },
  openBtn: {
    backgroundColor: '#0891B2', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 7,
  },
  openBtnTxt: { fontSize: 13, color: '#FFFFFF', fontWeight: '700' },
});
