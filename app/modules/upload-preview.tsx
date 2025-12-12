/**
 * Uploads Screen - Batch Builder
 * Shows batch of files ready to upload
 */

import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import {
  Alert,
  FlatList,
  StyleSheet,
  View,
} from 'react-native';
import {
  Appbar,
  Button,
  Chip,
  Divider,
  IconButton,
  List,
  Menu,
  Text,
  useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { UploadButton } from '@/components/UploadButton';
import { useFileBatch } from '@/store/file-batch-store';

export default function UploadsScreen() {
  const theme = useTheme();
  const { files, removeFile, clearFiles, startUpload, uploadState } = useFileBatch();
  const [sortMenuVisible, setSortMenuVisible] = useState(false);

  const isUploading = uploadState.status === 'uploading';

  const handleClose = () => {
    if (isUploading) {
      // If uploading, just minimize - don't cancel
      router.back();
    } else {
      router.back();
    }
  };

  const handleCancelAll = () => {
    if (files.length === 0) return;
    
    Alert.alert(
      'Cancel Upload?',
      'Are you sure you want to cancel all uploads?',
      [
        { text: 'Keep', style: 'cancel' },
        { 
          text: 'Cancel All', 
          style: 'destructive',
          onPress: () => {
            clearFiles();
            router.back();
          }
        },
      ]
    );
  };

  const handleRemoveFile = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    removeFile(id);
  };

  const handleStartUpload = () => {
    if (files.length === 0) return;
    
    // Start upload and immediately close drawer
    startUpload();
    router.back();
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
  };

  const renderFileItem = ({ item }: { item: typeof files[0] }) => {
    return (
      <List.Item
        title={item.name}
        description={`${formatSize(item.size)} · Waiting to upload`}
        titleNumberOfLines={1}
        descriptionNumberOfLines={1}
        left={() => (
          <View style={styles.fileIconContainer}>
            <List.Icon 
              icon={item.type.includes('pdf') ? 'file-pdf-box' : 'file-image'} 
            />
          </View>
        )}
        right={() => (
          <IconButton
            icon="close"
            size={20}
            onPress={() => handleRemoveFile(item.id)}
          />
        )}
        style={styles.listItem}
      />
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]} 
      edges={['top', 'bottom']}
    >
      {/* Header */}
      <Appbar.Header style={{ backgroundColor: theme.colors.background }} elevated={false}>
        <Appbar.Action icon="close" onPress={handleClose} />
        <Appbar.Content title="Uploads" titleStyle={styles.headerTitle} />
        {isUploading ? (
          <Button 
            mode="text" 
            onPress={handleCancelAll}
            textColor={theme.colors.onSurfaceVariant}
            compact
          >
            Cancel all
          </Button>
        ) : files.length > 0 ? (
          <Button 
            mode="text" 
            onPress={handleStartUpload}
            textColor={theme.colors.primary}
            compact
          >
            Upload
          </Button>
        ) : null}
      </Appbar.Header>

      {/* Sort/Filter Bar */}
      <View style={styles.filterBar}>
        <Menu
          visible={sortMenuVisible}
          onDismiss={() => setSortMenuVisible(false)}
          anchor={
            <Chip 
              icon="sort" 
              onPress={() => setSortMenuVisible(true)}
              style={styles.filterChip}
              compact
            >
              Date uploaded
            </Chip>
          }
        >
          <Menu.Item onPress={() => setSortMenuVisible(false)} title="Date uploaded" />
          <Menu.Item onPress={() => setSortMenuVisible(false)} title="Name" />
          <Menu.Item onPress={() => setSortMenuVisible(false)} title="Size" />
        </Menu>
      </View>

      <Divider />

      {/* File List */}
      <FlatList
        data={files}
        keyExtractor={(item) => item.id}
        renderItem={renderFileItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
              No files to upload
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Tap the + button to add documents
            </Text>
          </View>
        }
      />

      {/* FAB for adding more files */}
      <UploadButton skipNavigation />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerTitle: {
    fontWeight: '600',
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    height: 32,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  listItem: {
    paddingVertical: 8,
  },
  fileIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    gap: 8,
  },
});
