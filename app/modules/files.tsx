/**
 * Files Screen
 * Shows all uploaded documents
 */

import { FlatList, StyleSheet, View } from 'react-native';
import {
  Appbar,
  IconButton,
  List,
  Searchbar,
  Text,
  useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { BottomNav } from '@/components/BottomNav';
import { UploadButton } from '@/components/UploadButton';

type FileItem = {
  id: string;
  name: string;
  uploadedAt: string;
  uploadedBy: string;
  type: 'pdf' | 'image' | 'doc';
};

const MOCK_FILES: FileItem[] = [
  { id: '1', name: 'Purchase Order - PO_1232.pdf', uploadedAt: '11 Dec', uploadedBy: 'You', type: 'pdf' },
  { id: '2', name: 'Purchase Order - PO_1232.pdf', uploadedAt: '11 Dec', uploadedBy: 'You', type: 'pdf' },
  { id: '3', name: 'Purchase Order - PO_1232.pdf', uploadedAt: '11 Dec', uploadedBy: 'You', type: 'pdf' },
  { id: '4', name: 'Purchase Order - PO_1232.pdf', uploadedAt: '11 Dec', uploadedBy: 'You', type: 'pdf' },
  { id: '5', name: 'Purchase Order - PO_1232.pdf', uploadedAt: '10 Dec', uploadedBy: 'You', type: 'pdf' },
  { id: '6', name: 'Purchase Order - PO_1232.pdf', uploadedAt: '9 Dec', uploadedBy: 'Charles maranda', type: 'pdf' },
  { id: '7', name: 'Purchase Order - PO_1232.pdf', uploadedAt: '8 Dec', uploadedBy: 'Prateek sodhi', type: 'pdf' },
  { id: '8', name: 'Purchase Order - PO_1232.pdf', uploadedAt: '6 Dec', uploadedBy: 'Prateek sodhi', type: 'pdf' },
  { id: '9', name: 'Purchase Order - PO_1232.pdf', uploadedAt: '5 Dec', uploadedBy: 'Prateek sodhi', type: 'pdf' },
];

export default function FilesScreen() {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFiles = searchQuery.trim()
    ? MOCK_FILES.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : MOCK_FILES;

  const renderItem = ({ item }: { item: FileItem }) => (
    <List.Item
      title={item.name}
      description={`${item.uploadedBy} uploaded · ${item.uploadedAt}`}
      left={(props) => (
        <List.Icon
          {...props}
          icon={item.type === 'pdf' ? 'file-pdf-box' : item.type === 'image' ? 'file-image' : 'file-document-outline'}
        />
      )}
      right={() => (
        <IconButton icon="dots-vertical" size={20} onPress={() => {}} />
      )}
      style={styles.listItem}
      titleNumberOfLines={1}
      descriptionNumberOfLines={1}
    />
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      {/* Header */}
      <Appbar.Header style={{ backgroundColor: theme.colors.background }} elevated={false}>
        <Appbar.Action icon="menu" onPress={() => {}} />
        <Appbar.Content title="" />
        <Appbar.Action icon="magnify" onPress={() => {}} />
      </Appbar.Header>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onSurface }]}>
          Files
        </Text>
      </View>

      {/* File List */}
      <FlatList
        data={filteredFiles}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              No files found
            </Text>
          </View>
        }
      />

      <BottomNav />
      <UploadButton />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  titleContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  title: {
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 96, // space for bottom nav & FAB
  },
  listItem: {
    paddingVertical: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
});

