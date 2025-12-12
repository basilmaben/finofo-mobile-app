import { BottomNav } from '@/components/BottomNav';
import { UploadButton } from '@/components/UploadButton';
import { UserAvatar } from '@/components/UserAvatar';
import { Stack } from 'expo-router';
import * as React from 'react';
import {
  FlatList,
  StyleSheet,
  View,
} from 'react-native';
import {
  IconButton,
  List,
  Searchbar,
  Text,
  useTheme
} from 'react-native-paper';
import {
  Tabs,
  TabScreen,
  TabsProvider,
} from 'react-native-paper-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';

type DashboardFile = {
  id: string;
  name: string;
  uploadedAt: string;
  type: 'pdf' | 'image' | 'doc';
};

const MOCK_FILES: DashboardFile[] = [
  {
    id: '1',
    name: 'Purchase Order - PO_1232.pdf',
    uploadedAt: '11 Dec',
    type: 'pdf',
  },
  {
    id: '2',
    name: 'Purchase Order - PO_1233.pdf',
    uploadedAt: '11 Dec',
    type: 'pdf',
  },
  {
    id: '3',
    name: 'Purchase Order - PO_1234.pdf',
    uploadedAt: '12 Dec',
    type: 'pdf',
  },
  {
    id: '4',
    name: 'Purchase Order - PO_1235.pdf',
    uploadedAt: '12 Dec',
    type: 'pdf',
  },
  {
    id: '5',
    name: 'Purchase Order - PO_1236.pdf',
    uploadedAt: '13 Dec',
    type: 'pdf',
  },
  {
    id: '6',
    name: 'Purchase Order - PO_1237.pdf',
    uploadedAt: '13 Dec',
    type: 'pdf',
  },
];

export function Dashboard() {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredFiles = React.useMemo(() => {
    if (!searchQuery.trim()) return MOCK_FILES;
    const q = searchQuery.toLowerCase();
    return MOCK_FILES.filter((file) => file.name.toLowerCase().includes(q));
  }, [searchQuery]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <View style={styles.searchWrapper}>
          <Searchbar
            placeholder="Search for document"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchbar}
            inputStyle={styles.searchInput}
            icon="menu"
          />
          <View style={styles.avatarWrapper}>
            <UserAvatar />
          </View>
        </View>

        <TabsProvider defaultIndex={0}>
          <Tabs>
            <TabScreen label="Files">
              <FlatList
                data={filteredFiles}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                  <List.Item
                    title={item.name}
                    description={`You uploaded · ${item.uploadedAt}`}
                    left={(props) => (
                      <List.Icon
                        {...props}
                        icon={
                          item.type === 'pdf'
                            ? 'file-pdf-box'
                            : item.type === 'image'
                            ? 'file-image'
                            : 'file-document-outline'
                        }
                      />
                    )}
                    right={() => (
                      <IconButton
                        icon="dots-vertical"
                        onPress={() => {
                          // No-op for now
                        }}
                      />
                    )}
                    style={styles.listItem}
                    titleNumberOfLines={1}
                    descriptionNumberOfLines={1}
                  />
                )}
              />
            </TabScreen>
            <TabScreen label="Activity">
              <View style={styles.activityPlaceholder}>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  Activity view coming soon.
                </Text>
              </View>
            </TabScreen>
          </Tabs>
        </TabsProvider>
        <BottomNav />
        <UploadButton />
      </View>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
  },
  searchWrapper: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  searchbar: {
    borderRadius: 999,
  },
  searchInput: {
    fontSize: 16,
  },
  avatarWrapper: {
    position: 'absolute',
    right: 20,
    top: 16,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 96, // space for bottom nav & FAB
  },
  listItem: {
    paddingHorizontal: 8,
  },
  activityPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

});