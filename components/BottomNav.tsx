import { usePathname, useRouter } from 'expo-router';
import * as React from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';
import {
  IconButton,
  Text,
  TouchableRipple,
  useTheme
} from 'react-native-paper';

export function BottomNav() {
  const theme = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  const items = [
    { key: 'home', label: 'Dashboard', icon: 'view-dashboard-outline', route: '/' },
    { key: 'docs', label: 'Documents', icon: 'clipboard-text-outline', route: '/modules/document-views/document-list' },
  ] as const;

  return (
    <View style={[styles.bottomNav, { backgroundColor: theme.colors.background }]}>
      {items.map((item) => {
        const isActive = pathname === item.route || (item.key === 'home' && pathname === '/');
        const color = isActive ? theme.colors.primary : theme.colors.onSurfaceVariant;
        // const icon = isActive ? item.activeIcon : item.icon;
        const {icon} = item;

        return (
          <TouchableRipple
            key={item.key}
            style={styles.bottomNavItem}
            borderless
            onPress={() => {
              if (!isActive) {
                router.push(item.route as any);
              }
            }}
          >
            <View style={styles.bottomNavInner}>
              <IconButton
                icon={icon}
                size={22}
                iconColor={color}
                style={styles.bottomNavIconButton}
              />
              <Text
                variant="labelMedium"
                style={[
                  styles.bottomNavLabel,
                  { color },
                ]}
              >
                {item.label}
              </Text>
            </View>
          </TouchableRipple>
        );
      })}
    </View>
  );
}


const styles = StyleSheet.create({
  bottomNav: {
    height: 64,
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.12)',
    backgroundColor: 'white',
  },
  bottomNavItem: {
    flex: 1,
  },
  bottomNavInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomNavIconButton: {
    margin: 0,
  },
  bottomNavLabel: {
    marginTop: -6,
  },
});