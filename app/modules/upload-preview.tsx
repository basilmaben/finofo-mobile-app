/**
 * Uploads Screen - Batch Builder
 * Shows batch of files ready to upload with preview capability
 * Includes circular progress indicators and pause/resume controls
 */

import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
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
  ProgressBar,
  Text,
  useTheme,
} from 'react-native-paper';
import Pdf from 'react-native-pdf';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ConfirmModal } from '@/components/ConfirmModal';
import { UploadButton } from '@/components/UploadButton';
import { useFileBatch } from '@/store/file-batch-store';
import type { DocumentFile } from '@/types/document';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Circular Progress Component using View-based approach
const CircularProgress = ({ 
  progress, 
  size = 56, 
  strokeWidth = 3,
  status,
}: { 
  progress: number; 
  size?: number;
  strokeWidth?: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed' | 'paused';
}) => {
  const theme = useTheme();

  const getColors = () => {
    switch (status) {
      case 'completed':
        return { primary: '#059669', bg: '#D1FAE5' };
      case 'failed':
        return { primary: theme.colors.error, bg: theme.colors.errorContainer };
      case 'paused':
        return { primary: '#D97706', bg: '#FEF3C7' };
      case 'uploading':
        return { primary: '#1C1C1E', bg: '#E5E5EA' }; // Black progress ring
      default:
        return { primary: theme.colors.surfaceVariant, bg: theme.colors.surfaceVariant };
    }
  };

  const colors = getColors();
  const innerSize = size - strokeWidth * 2;

  // Create segmented progress ring
  const segments = 8;
  const filledSegments = Math.floor((progress / 100) * segments);

  return (
    <View style={{ width: size, height: size, position: 'relative' }}>
      {/* Background ring */}
      <View 
        style={[
          circularStyles.ring,
          { 
            width: size, 
            height: size, 
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: colors.bg,
          }
        ]} 
      />
      
      {/* Progress indicator - simplified arc using border trick */}
      {progress > 0 && status !== 'pending' && (
        <View 
          style={[
            circularStyles.progressRing,
            { 
              width: size, 
              height: size, 
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: 'transparent',
              borderTopColor: colors.primary,
              borderRightColor: progress > 25 ? colors.primary : 'transparent',
              borderBottomColor: progress > 50 ? colors.primary : 'transparent',
              borderLeftColor: progress > 75 ? colors.primary : 'transparent',
              transform: [{ rotate: '-45deg' }],
            }
          ]} 
        />
      )}

      {/* Full ring for completed */}
      {status === 'completed' && (
        <View 
          style={[
            circularStyles.progressRing,
            { 
              width: size, 
              height: size, 
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: colors.primary,
            }
          ]} 
        />
      )}
      
      {/* Center content */}
      <View style={[circularStyles.center, { width: size, height: size }]}>
        {status === 'completed' ? (
          <IconButton icon="check" size={18} iconColor="#059669" style={{ margin: 0 }} />
        ) : status === 'failed' ? (
          <IconButton icon="alert-circle" size={18} iconColor={theme.colors.error} style={{ margin: 0 }} />
        ) : status === 'paused' ? (
          <IconButton icon="pause" size={16} iconColor="#D97706" style={{ margin: 0 }} />
        ) : status === 'uploading' ? (
          <Text variant="labelSmall" style={{ color: colors.primary, fontWeight: '600' }}>
            {Math.round(progress)}%
          </Text>
        ) : null}
      </View>
    </View>
  );
};

const circularStyles = StyleSheet.create({
  ring: {
    position: 'absolute',
  },
  progressRing: {
    position: 'absolute',
  },
  center: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// File status type for per-file tracking
interface FileUploadStatus {
  status: 'pending' | 'uploading' | 'completed' | 'failed' | 'paused';
  progress: number;
}

export default function UploadsScreen() {
  const theme = useTheme();
  const { 
    files, 
    removeFile,
    startUpload, 
    uploadState,
    pauseUpload,
    resumeUpload,
    cancelUpload,
    retryUpload,
  } = useFileBatch();
  const [previewFile, setPreviewFile] = useState<DocumentFile | null>(null);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  
  // Per-file progress tracking (simulated based on overall progress)
  const [fileStatuses, setFileStatuses] = useState<Map<string, FileUploadStatus>>(new Map());

  const isUploading = uploadState.status === 'uploading';
  const isPaused = uploadState.status === 'paused';
  const isError = uploadState.status === 'error';
  const isCompleted = uploadState.status === 'completed';
  const isActive = isUploading || isPaused || isError;

  // Update per-file status based on overall upload state
  useEffect(() => {
    if (files.length === 0) {
      setFileStatuses(new Map());
      return;
    }

    const newStatuses = new Map<string, FileUploadStatus>();
    const currentFileIndex = (uploadState.currentFile ?? 1) - 1;
    const progressPerFile = 100 / files.length;

    files.forEach((file, index) => {
      let status: FileUploadStatus['status'] = 'pending';
      let progress = 0;

      if (isCompleted) {
        status = 'completed';
        progress = 100;
      } else if (index < currentFileIndex) {
        // Already uploaded
        status = 'completed';
        progress = 100;
      } else if (index === currentFileIndex) {
        // Current file
        if (isUploading) {
          status = 'uploading';
          // Calculate this file's progress from overall progress
          const baseProgress = currentFileIndex * progressPerFile;
          const fileProgress = ((uploadState.progress - baseProgress) / progressPerFile) * 100;
          progress = Math.min(100, Math.max(0, fileProgress));
        } else if (isPaused) {
          status = 'paused';
          const baseProgress = currentFileIndex * progressPerFile;
          const fileProgress = ((uploadState.progress - baseProgress) / progressPerFile) * 100;
          progress = Math.min(100, Math.max(0, fileProgress));
        } else if (isError) {
          status = 'failed';
          progress = 0;
        }
      } else {
        // Not yet started
        status = 'pending';
        progress = 0;
      }

      newStatuses.set(file.id, { status, progress });
    });

    setFileStatuses(newStatuses);
  }, [files, uploadState, isUploading, isPaused, isError, isCompleted]);

  const handleClose = () => {
    // Show confirmation if there are pending files or active upload
    if (isUploading || isPaused || files.length > 0) {
      setShowCloseConfirm(true);
      return;
    }
    router.back();
  };

  const handleConfirmClose = () => {
    setShowCloseConfirm(false);
    cancelUpload();
    router.back();
  };

  const handleMinimize = () => {
    // Just minimize without cancelling - upload continues in background
    setShowCloseConfirm(false);
    router.back();
  };

  const handleCancelBatch = () => {
    Alert.alert(
      'Cancel Upload?',
      'This will cancel all pending uploads. Files already uploaded will remain.',
      [
        { text: 'Keep Uploading', style: 'cancel' },
        { 
          text: 'Cancel All', 
          style: 'destructive',
          onPress: () => {
            cancelUpload();
            router.back();
          }
        },
      ]
    );
  };

  const handleRemoveFile = (id: string) => {
    const fileStatus = fileStatuses.get(id);
    if (fileStatus?.status === 'uploading') {
      Alert.alert(
        'Cannot Remove',
        'This file is currently uploading. Pause the upload first.',
        [{ text: 'OK' }]
      );
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    removeFile(id);
  };

  const handleStartUpload = () => {
    if (files.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    startUpload();
    // Minimize drawer immediately - upload continues in background
    router.back();
  };

  const handlePauseResume = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isUploading) {
      pauseUpload();
    } else if (isPaused) {
      resumeUpload();
    }
  };

  const handleRetry = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    retryUpload();
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

  const getStatusText = (fileStatus: FileUploadStatus | undefined): string => {
    if (!fileStatus) return 'Pending';
    switch (fileStatus.status) {
      case 'completed':
        return 'Uploaded';
      case 'uploading':
        return `Uploading... ${Math.round(fileStatus.progress)}%`;
      case 'paused':
        return 'Paused';
      case 'failed':
        return 'Failed';
      default:
        return 'Pending';
    }
  };

  const renderFileItem = ({ item }: { item: DocumentFile }) => {
    const isImage = item.type.includes('image');
    const fileStatus = fileStatuses.get(item.id);
    const status = fileStatus?.status ?? 'pending';
    const progress = fileStatus?.progress ?? 0;

    return (
      <TouchableOpacity 
        onPress={() => handlePreviewFile(item)} 
        activeOpacity={0.7}
        disabled={status === 'uploading'}
      >
        <View style={styles.fileItem}>
          {/* Thumbnail with circular progress */}
          <View style={styles.thumbnailWrapper}>
            {isActive && (
              <View style={styles.progressRingWrapper}>
                <CircularProgress 
                  progress={progress} 
                  size={56} 
                  strokeWidth={3}
                  status={status}
                />
              </View>
            )}
            <View style={[
              styles.thumbnailContainer,
              isActive && styles.thumbnailContainerActive
            ]}>
              {isImage ? (
                <Image source={{ uri: item.uri }} style={styles.thumbnail} />
              ) : (
                <View style={[styles.pdfThumbnail, { backgroundColor: theme.colors.errorContainer }]}>
                  <Text style={[styles.pdfText, { color: theme.colors.onErrorContainer }]}>PDF</Text>
                </View>
              )}
            </View>
          </View>

          {/* File info */}
          <View style={styles.fileInfo}>
            <Text 
              variant="bodyMedium" 
              numberOfLines={1}
              style={{ color: theme.colors.onSurface }}
            >
              {item.name}
            </Text>
            <Text 
              variant="bodySmall" 
              style={{ 
                color: status === 'failed' 
                  ? theme.colors.error 
                  : status === 'completed'
                    ? '#059669'
                    : theme.colors.onSurfaceVariant 
              }}
            >
              {formatSize(item.size)} · {getStatusText(fileStatus)}
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.rightActions}>
            {!isActive && (
              <>
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
              </>
            )}
            {status === 'completed' && (
              <IconButton
                icon="check-circle"
                size={24}
                iconColor="#059669"
              />
            )}
            {status === 'failed' && (
              <IconButton
                icon="refresh"
                size={20}
                iconColor={theme.colors.error}
                onPress={handleRetry}
              />
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Header action button based on state
  const renderHeaderAction = () => {
    if (isUploading) {
      return (
        <Button 
          mode="text" 
          onPress={handlePauseResume}
          icon="pause"
          textColor={theme.colors.onSurfaceVariant}
          compact
        >
          Pause
        </Button>
      );
    }
    if (isPaused) {
      return (
        <Button 
          mode="text" 
          onPress={handlePauseResume}
          icon="play"
          textColor={theme.colors.primary}
          compact
        >
          Resume
        </Button>
      );
    }
    if (isError) {
      return (
        <Button 
          mode="text" 
          onPress={handleRetry}
          icon="refresh"
          textColor={theme.colors.primary}
          compact
        >
          Retry
        </Button>
      );
    }
    if (files.length > 0) {
      return (
        <Button 
          mode="text" 
          onPress={handleStartUpload}
          textColor={theme.colors.primary}
          compact
        >
          Upload
        </Button>
      );
    }
    return null;
  };

  // Status banner at top
  const renderStatusBanner = () => {
    if (!isActive && !isCompleted) return null;

    let bgColor = theme.colors.primaryContainer;
    let textColor = theme.colors.onPrimaryContainer;
    let message = '';

    if (isUploading) {
      bgColor = theme.colors.primaryContainer;
      textColor = theme.colors.onPrimaryContainer;
      message = `Uploading ${uploadState.currentFile} of ${uploadState.totalFiles}... ${uploadState.progress}%`;
    } else if (isPaused) {
      bgColor = '#FEF3C7';
      textColor = '#92400E';
      message = `Paused at ${uploadState.progress}% · Tap Resume to continue`;
    } else if (isError) {
      bgColor = theme.colors.errorContainer;
      textColor = theme.colors.onErrorContainer;
      message = uploadState.error || 'Upload failed. Tap Retry to try again.';
    } else if (isCompleted) {
      bgColor = '#D1FAE5';
      textColor = '#065F46';
      message = 'All files uploaded successfully!';
    }

    return (
      <View style={[styles.statusBanner, { backgroundColor: bgColor }]}>
        <Text variant="bodySmall" style={{ color: textColor }}>
          {message}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]} 
      edges={['bottom']}
    >
      {/* Header */}
      <Appbar.Header 
        style={{ backgroundColor: theme.colors.background, marginTop: 16, paddingHorizontal: 8 }} 
        elevated={false} 
        statusBarHeight={0}
      >
        <Appbar.Action icon="close" onPress={handleClose} />
        <Appbar.Content 
          title={isActive ? 'Uploading' : 'Uploads'} 
          titleStyle={styles.headerTitle} 
        />
        {renderHeaderAction()}
      </Appbar.Header>

      {/* Status Banner */}
      {renderStatusBanner()}

      {/* Sort/Filter Bar */}
      <View style={styles.filterBar}>
        <Chip 
          icon="sort" 
          style={styles.filterChip}
          compact
        >
          Date added
        </Chip>
        {isActive && (
          <Chip 
            icon="close-circle-outline" 
            style={[styles.filterChip, { marginLeft: 'auto' }]}
            onPress={handleCancelBatch}
            compact
          >
            Cancel batch
          </Chip>
        )}
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

      {/* FAB for adding more files - hidden during upload */}
      {!isActive && <UploadButton skipNavigation ignoreBanner />}

      {/* File Preview Modal */}
      <Modal
        visible={previewFile !== null}
        transparent
        animationType="fade"
        onRequestClose={closePreview}
      >
        <View style={styles.modalOverlay}>
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

      {/* Close Confirmation Modal */}
      <ConfirmModal
        visible={showCloseConfirm}
        onDismiss={() => setShowCloseConfirm(false)}
        onConfirm={isUploading || isPaused ? handleMinimize : handleConfirmClose}
        title={isUploading || isPaused ? "Minimize Upload?" : "Discard Files?"}
        message={
          isUploading || isPaused
            ? "Your upload will continue in the background. You can return to check progress anytime."
            : "You'll lose all files in this batch. This cannot be undone."
        }
        confirmLabel={isUploading || isPaused ? "Minimize" : "Discard"}
        cancelLabel="Stay"
        destructive={!isUploading && !isPaused}
      />
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
  statusBanner: {
    paddingHorizontal: 16,
    paddingVertical: 10,
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
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  thumbnailWrapper: {
    position: 'relative',
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressRingWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  thumbnailContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 48,
    height: 48,
  },
  thumbnailContainerActive: {
    width: 44,
    height: 44,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  pdfThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pdfText: {
    fontSize: 12,
    fontWeight: '700',
  },
  fileInfo: {
    flex: 1,
    marginLeft: 12,
    gap: 2,
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
  modalFooter: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalFooterText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
});
