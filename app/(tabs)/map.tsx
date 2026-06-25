import { Stack } from 'expo-router';
import { HeaderTools } from '../../src/components/HeaderTools';
import { useT } from '../../src/hooks/useT';
// Metro resolve SorriaMap.web.tsx no navegador e SorriaMap.tsx no app nativo.
import SorriaMap from '../../src/components/Map/SorriaMap';

export default function MapScreen() {
  const { T } = useT();
  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: T.home.navMap,
          headerRight: () => <HeaderTools />,
        }}
      />
      <SorriaMap />
    </>
  );
}
