import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors } from '../../constants/theme';
import { useDownloadStore } from '../../store/downloadStore';
import Svg, { Path, Circle, Rect, Polyline, Line } from 'react-native-svg';

// Custom SVG icons
function IconDownload({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Polyline points="7 10 12 15 17 10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="12" y1="15" x2="12" y2="3" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function IconQueue({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="4" rx="2" stroke={color} strokeWidth="2" />
      <Rect x="3" y="10" width="14" height="4" rx="2" stroke={color} strokeWidth="2" />
      <Rect x="3" y="16" width="10" height="4" rx="2" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function IconStar({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        fill={color === Colors.premium ? Colors.premium : 'none'}
        fillOpacity={color === Colors.premium ? 0.2 : 0}
      />
    </Svg>
  );
}

function IconSettings({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
      <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
        stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  );
}

function TabBar({ state, descriptors, navigation }: any) {
  const activeDownloads = useDownloadStore((s) =>
    s.queue.filter((d) => d.status === 'downloading' || d.status === 'pending').length
  );

  const tabs = [
    { name: 'index', label: 'Descargar', Icon: IconDownload },
    { name: 'queue', label: 'Cola', Icon: IconQueue },
    { name: 'premium', label: 'Premium', Icon: IconStar },
    { name: 'settings', label: 'Ajustes', Icon: IconSettings },
  ];

  return (
    <View style={styles.tabBar}>
      {state.routes.map((route: any, index: number) => {
        const isFocused = state.index === index;
        const tab = tabs[index];
        if (!tab) return null;

        const isPremiumTab = tab.name === 'premium';
        const color = isFocused
          ? isPremiumTab ? Colors.premium : Colors.primary
          : Colors.textMuted;

        return (
          <Pressable
            key={route.key}
            style={styles.tabItem}
            onPress={() => {
              if (!isFocused) navigation.navigate(route.name);
            }}
          >
            <View style={styles.tabIconWrap}>
              <tab.Icon color={color} size={22} />
              {tab.name === 'queue' && activeDownloads > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{activeDownloads}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.tabLabel, { color }]}>{tab.label}</Text>
            {isFocused && (
              <View style={[
                styles.tabIndicator,
                { backgroundColor: isPremiumTab ? Colors.premium : Colors.primary }
              ]} />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="queue" />
      <Tabs.Screen name="premium" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.bgCard,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingBottom: 8,
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    position: 'relative',
    paddingVertical: 4,
  },
  tabIconWrap: {
    position: 'relative',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  tabIndicator: {
    position: 'absolute',
    top: -8,
    left: '50%',
    width: 24,
    height: 3,
    marginLeft: -12,
    borderRadius: 2,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -7,
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
});
