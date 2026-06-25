// Versão WEB do mapa — usa LEAFLET (tiles raster), que NÃO precisa de WebGL.
// O app nativo usa SorriaMap.tsx (@maplibre/maplibre-react-native).
//
// Os locais são lidos DIRETO do JSON (seed/locations.json), como o chatbot —
// assim os marcadores não dependem do SQLite/OPFS (que no navegador pode falhar
// com erro de concorrência) nem de carregamento assíncrono: aparecem na hora.
//
// O Leaflet manipula o DOM diretamente; para não conflitar com o React, ele
// recebe um container PRÓPRIO (criado via document.createElement).
import { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { router } from 'expo-router';
import { Location } from '../../db/queries/locations';
import { metaForCategory, colors } from '../../theme/colors';
import { useT } from '../../hooks/useT';
import { categoryLabel } from '../../i18n/translations';
import { localizeLocation } from '../../i18n/localize';
import { RIO_PORT_CENTER, MAP_ZOOM_INITIAL } from './MapConfig';
import locationsData from '../../../seed/locations.json';
import categoriesData from '../../../seed/categories.json';

const TILE_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

// Locais com a categoria resolvida (slug/label), lidos do JSON — sem banco.
const CAT_BY_ID: Record<number, any> = Object.fromEntries(
  (categoriesData as any[]).map((c) => [c.id, c]),
);
const ALL_LOCATIONS: Location[] = (locationsData as any[])
  .filter((l) => typeof l.lat === 'number' && typeof l.lng === 'number')
  .map((l) => ({
    ...l,
    opening_hours: l.opening_hours ?? {},
    category_slug: CAT_BY_ID[l.category_id]?.slug,
    category_label: CAT_BY_ID[l.category_id]?.label,
    category_color: CAT_BY_ID[l.category_id]?.color,
    category_icon: CAT_BY_ID[l.category_id]?.icon,
  })) as Location[];

export default function SorriaMapWeb() {
  const { T, lang } = useT();
  const hostRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [selected, setSelected] = useState<Location | null>(null);
  const [failed, setFailed] = useState(false);

  // Cria o mapa + todos os marcadores uma única vez.
  useEffect(() => {
    if (failed || !hostRef.current || mapRef.current) return;
    try {
      const inner = document.createElement('div');
      inner.style.width = '100%';
      inner.style.height = '100%';
      hostRef.current.appendChild(inner);
      innerRef.current = inner;

      const map = L.map(inner, {
        center: [RIO_PORT_CENTER.lat, RIO_PORT_CENTER.lng],
        zoom: MAP_ZOOM_INITIAL,
        zoomControl: true,
        attributionControl: true,
      });
      L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: 19, subdomains: 'abcd' }).addTo(map);
      map.on('click', () => setSelected(null));

      // marcadores — um por local, com a cor e o ícone da categoria
      for (const loc of ALL_LOCATIONS) {
        const meta = metaForCategory(loc.category_slug);
        const icon = L.divIcon({
          className: 'sorria-pin',
          html:
            `<div style="width:32px;height:32px;border-radius:16px;border:3px solid #FFFFFF;` +
            `background:${meta.color};display:flex;align-items:center;justify-content:center;` +
            `font-size:16px;box-shadow:0 1px 5px rgba(0,0,0,0.35)">${meta.icon}</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });
        L.marker([loc.lat, loc.lng], { icon, title: loc.name })
          .addTo(map)
          .on('click', () => setSelected(loc));
      }

      mapRef.current = map;
      setTimeout(() => map.invalidateSize(), 0);
    } catch (e) {
      console.warn('[map] falha ao iniciar o Leaflet — usando lista de locais.', e);
      setFailed(true);
    }
    return () => {
      try { mapRef.current?.remove(); } catch {}
      mapRef.current = null;
      try { innerRef.current?.remove(); } catch {}
      innerRef.current = null;
    };
  }, [failed]);

  if (failed) {
    return <MapFallback lang={lang} />;
  }

  const sel = selected ? localizeLocation(selected, lang) : null;

  return (
    <View style={styles.wrap}>
      <div ref={hostRef} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />

      <View style={styles.badge} pointerEvents="none">
        <Text style={styles.badgeText}>{ALL_LOCATIONS.length} {T.map.places}</Text>
      </View>

      {sel && selected && (
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => setSelected(null)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.closeTxt}>✕</Text>
          </TouchableOpacity>

          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: metaForCategory(selected.category_slug).color + '22' }]}>
              <Text style={styles.cardEmoji}>{metaForCategory(selected.category_slug).icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardCat}>{categoryLabel(selected.category_slug, lang, selected.category_label)}</Text>
              <Text style={styles.cardName} numberOfLines={2}>{sel.name}</Text>
            </View>
          </View>

          <Text style={styles.cardDesc} numberOfLines={3}>{sel.short_description}</Text>

          <View style={styles.cardFooter}>
            {!!sel.admission && (
              <Text
                style={[styles.cardAdm, { color: /gratu|free/i.test(sel.admission) ? colors.success : colors.primary }]}
                numberOfLines={1}
              >
                {/gratu|free/i.test(sel.admission) ? '✅ ' : '💰 '}{sel.admission}
              </Text>
            )}
            <TouchableOpacity style={styles.openBtn} onPress={() => router.push(`/location/${selected.slug}`)}>
              <Text style={styles.openBtnTxt}>{T.map.seeMore}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

// Rede de segurança: se o mapa não puder ser criado, mostra os locais em lista.
function MapFallback({ lang }: { lang: 'pt' | 'en' }) {
  const pt = lang === 'pt';
  return (
    <View style={styles.fb}>
      <Text style={styles.fbIcon}>🗺️</Text>
      <Text style={styles.fbTitle}>
        {pt ? 'Não foi possível carregar o mapa' : 'Could not load the map'}
      </Text>
      <Text style={styles.fbSub}>
        {pt ? 'Veja os locais na lista — toque para abrir:' : 'Browse the places below — tap to open:'}
      </Text>
      <ScrollView style={styles.fbList} contentContainerStyle={{ paddingBottom: 24 }}>
        {ALL_LOCATIONS.map((raw) => {
          const loc = localizeLocation(raw, lang);
          const meta = metaForCategory(raw.category_slug);
          return (
            <TouchableOpacity
              key={raw.id}
              style={styles.fbItem}
              activeOpacity={0.8}
              onPress={() => router.push(`/location/${raw.slug}`)}
            >
              <Text style={styles.fbItemIcon}>{meta.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.fbItemName} numberOfLines={1}>{loc.name}</Text>
                <Text style={styles.fbItemSub} numberOfLines={1}>📍 {loc.neighborhood}</Text>
              </View>
              <Text style={styles.fbChevron}>›</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, position: 'relative', backgroundColor: '#EFF6FF' },

  badge: {
    position: 'absolute', top: 12, right: 12, zIndex: 1000,
    backgroundColor: '#FFFFFF', borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 5,
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 4, elevation: 3,
  },
  badgeText: { fontSize: 12, color: '#64748B', fontWeight: '600' },

  card: {
    position: 'absolute', bottom: 16, left: 16, right: 16, zIndex: 1000,
    backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 14, elevation: 10,
    maxWidth: 520, alignSelf: 'center', width: 'auto',
  },
  closeBtn: {
    position: 'absolute', top: 10, right: 10, zIndex: 1,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center',
  },
  closeTxt: { fontSize: 12, color: '#64748B', fontWeight: '700' },
  cardHeader: { flexDirection: 'row', gap: 12, marginBottom: 8, alignItems: 'center' },
  cardIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  cardEmoji: { fontSize: 24 },
  cardCat: { fontSize: 11, color: '#94A3B8', fontWeight: '600', marginBottom: 2 },
  cardName: { fontSize: 16, fontWeight: '700', color: '#0F172A', lineHeight: 21 },
  cardDesc: { fontSize: 13, color: '#64748B', lineHeight: 19, marginBottom: 10 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  cardAdm: { fontSize: 12, fontWeight: '600', flexShrink: 1 },
  openBtn: { backgroundColor: '#2B6CB0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7 },
  openBtnTxt: { fontSize: 13, color: '#FFFFFF', fontWeight: '700' },

  fb: { flex: 1, backgroundColor: colors.background, padding: 20 },
  fbIcon: { fontSize: 48, textAlign: 'center', marginTop: 8 },
  fbTitle: { fontSize: 18, fontWeight: '800', color: colors.textDark, textAlign: 'center', marginTop: 8 },
  fbSub: { fontSize: 13, color: colors.textMedium, textAlign: 'center', lineHeight: 19, marginTop: 8, marginBottom: 12 },
  fbList: { flex: 1, borderTopWidth: 1, borderTopColor: colors.border },
  fbItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  fbItemIcon: { fontSize: 22, width: 28, textAlign: 'center' },
  fbItemName: { fontSize: 15, fontWeight: '700', color: colors.textDark },
  fbItemSub: { fontSize: 12, color: colors.textLight, marginTop: 2 },
  fbChevron: { fontSize: 22, color: colors.textLight },
});
