/**
 * Uploads Screen - Batch Builder
 * Shows batch of files ready to upload with preview capability
 */

import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Appbar,
  Button,
  Chip,
  Divider,
  IconButton,
  List,
  Text,
  useTheme,
} from 'react-native-paper';
import Pdf from 'react-native-pdf';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UploadButton } from '@/components/UploadButton';
import { useFileBatch } from '@/store/file-batch-store';
import type { DocumentFile } from '@/types/document';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function UploadsScreen() {
  const theme = useTheme();
  const { files, removeFile, clearFiles, startUpload, uploadState } = useFileBatch();
  const [previewFile, setPreviewFile] = useState<DocumentFile | null>(null);
  const [pdfLoading, setPdfLoading] = useState(true);

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

  const handlePreviewFile = (file: DocumentFile) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPdfLoading(true);
    setPreviewFile(file);
  };

  const closePreview = () => {
    setPreviewFile(null);
    setPdfLoading(true);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
  };

  const renderFileItem = ({ item }: { item: DocumentFile }) => {
    const isImage = item.type.includes('image');
    const isPdf = item.type.includes('pdf');

    return (
      <TouchableOpacity onPress={() => handlePreviewFile(item)} activeOpacity={0.7}>
        <List.Item
          title={item.name}
          description={`${formatSize(item.size)} · Tap to preview`}
          titleNumberOfLines={1}
          descriptionNumberOfLines={1}
          left={() => (
            <View style={styles.thumbnailContainer}>
              {isImage ? (
                <Image source={{ uri: item.uri }} style={styles.thumbnail} />
              ) : (
                <View style={[styles.pdfThumbnail, { backgroundColor: theme.colors.errorContainer }]}>
                  <Text style={[styles.pdfText, { color: theme.colors.onErrorContainer }]}>PDF</Text>
                </View>
              )}
            </View>
          )}
          right={() => (
            <View style={styles.rightActions}>
              <IconButton
                icon="eye-outline"
                size={20}
                onPress={() => handlePreviewFile(item)}
              />
              <IconButton
                icon="close"
                size={20}
                onPress={() => handleRemoveFile(item.id)}
              />
            </View>
          )}
          style={styles.listItem}
        />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]} 
      edges={['bottom']}
    >
      {/* Header */}
      <Appbar.Header style={{ backgroundColor: theme.colors.background, marginTop: 16, paddingHorizontal: 8 }} elevated={false} statusBarHeight={0}>
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
        <Chip 
          icon="sort" 
          style={styles.filterChip}
          compact
        >
          Date added
        </Chip>
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

      {/* File Preview Modal */}
      <Modal
        visible={previewFile !== null}
        transparent
        animationType="fade"
        onRequestClose={closePreview}
      >
        <View style={styles.modalOverlay}>
          {/* Content - Image or PDF (full screen behind header) */}
          {previewFile && (
            <View style={styles.previewContent} pointerEvents="box-none">
              {previewFile.type.includes('image') ? (
                <View pointerEvents="none" style={styles.imageWrapper}>
                  <Image
                    source={{ uri: previewFile.uri }}
                    style={styles.previewImage}
                    resizeMode="contain"
                  />
                </View>
              ) : previewFile.type.includes('pdf') ? (
                <>
                  {pdfLoading && (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="large" color="#FFFFFF" />
                      <Text style={styles.loadingText}>Loading PDF...</Text>
                    </View>
                  )}
                  <Pdf
                    source={{ uri: previewFile.uri }}
                    style={styles.pdfViewer}
                    onLoadComplete={() => setPdfLoading(false)}
                    onError={() => {
                      setPdfLoading(false);
                      Alert.alert('Error', 'Failed to load PDF');
                    }}
                    enablePaging
                    horizontal
                  />
                </>
              ) : null}
            </View>
          )}

          {/* Header - Absolutely positioned on top */}
          <SafeAreaView style={styles.modalHeaderContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity 
                onPress={closePreview} 
                style={styles.closeButton}
                activeOpacity={0.6}
              >
                <View style={styles.closeIconCircle}>
                  <Text style={styles.closeIconText}>✕</Text>
                </View>
              </TouchableOpacity>
              <Text style={styles.modalTitle} numberOfLines={1}>
                {previewFile?.name}
              </Text>
              <View style={{ width: 48 }} />
            </View>
          </SafeAreaView>

          {/* Footer - Absolutely positioned at bottom */}
          <View style={styles.modalFooterContainer} pointerEvents="none">
            <SafeAreaView edges={['bottom']}>
              <View style={styles.modalFooter}>
                <Text style={styles.modalFooterText}>
                  {previewFile ? formatSize(previewFile.size) : ''}
                </Text>
              </View>
            </SafeAreaView>
          </View>
        </View>
      </Modal>
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
  thumbnailContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 48,
    height: 48,
    marginLeft: 8,
  },
  thumbnail: {
    width: 44,
    height: 44,
    borderRadius: 6,
  },
  pdfThumbnail: {
    width: 44,
    height: 44,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pdfText: {
    fontSize: 12,
    fontWeight: '700',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  modalHeaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    elevation: 999,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    marginTop: 40,
  },
  modalFooterContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  closeButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 101,
  },
  closeIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIconText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  modalTitle: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  previewContent: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  imageWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
  },
  pdfViewer: {
    flex: 1,
    width: SCREEN_WIDTH,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 12,
    fontSize: 14,
  },
  hidden: {
    opacity: 0,
  },
  modalFooter: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalFooterText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
});
