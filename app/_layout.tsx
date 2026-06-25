import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { initDatabase, getDatabase } from '../src/db/client';
import { seedDatabase } from '../src/db/seed';
import { colors } from '../src/theme/colors';
import { useSeedStore } from '../src/store/seedStore';
import { HomeButton } from '../src/components/HomeButton';

export default function RootLayout() {
  const setSeeded = useSeedStore(s => s.setSeeded);

  // Inicializa o banco em BACKGROUND — sem bloquear a renderização do app.
  // A Home/Chat funcionam só com os JSON de /seed; quem depende do SQLite
  // (Explorar/Mapa/Detalhe) já espera pela flag `seeded`. Assim o app SEMPRE
  // abre, mesmo que o SQLite falhe (ex.: web sem cross-origin isolation).
  useEffect(() => {
    (async () => {
      try {
        await initDatabase();
        const db = await getDatabase();
        await seedDatabase(db);
        setSeeded(true);
      } catch (e: any) {
        console.warn('[db init]', e?.message ?? e);
      }
    })();
  }, [setSeeded]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="location/[slug]"
        options={{
          headerShown: true,
          headerTitle: '',
          headerStyle: { backgroundColor: colors.primaryDark },
          headerTintColor: '#FFFFFF',
          headerShadowVisible: false,
          headerRight: () => <HomeButton />,
        }}
      />
      <Stack.Screen
        name="projeto"
        options={{
          headerShown: true,
          headerTitle: '',
          headerStyle: { backgroundColor: colors.primaryDark },
          headerTintColor: '#FFFFFF',
          headerShadowVisible: false,
          headerRight: () => <HomeButton />,
        }}
      />
    </Stack>
  );
}
