/**
 * Upload Preview Screen
 * Preview captured/selected files before upload
 */

import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  CaptureSourceModal,
  DocumentTypeSelector,
  FileThumbnail,
  NotesInput,
} from '@/components/documents';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useFileBatch } from '@/store/file-batch-store';
import { type DocumentFile, type DocumentType, DocumentTypeLabels } from '@/types/document';

export default function UploadPreviewScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  // Use shared file batch store
  const { files, addFiles, removeFile, clearFiles } = useFileBatch();

  const [documentType, setDocumentType] = useState<DocumentType>('packing_slip');
  const [notes, setNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showAddSourceModal, setShowAddSourceModal] = useState(false);

  const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const handleRemoveFile = (fileId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    removeFile(fileId);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      Alert.alert('No Files', 'Please add at least one file to upload.');
      return;
    }

    setIsUploading(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // TODO: Implement actual upload logic
    // For now, simulate upload success
    setTimeout(() => {
      setIsUploading(false);
      Alert.alert(
        'Upload Started',
        `${files.length} file(s) queued for upload as "${DocumentTypeLabels[documentType]}"`,
        [
          {
            text: 'OK',
            onPress: () => {
              clearFiles(); // Clear the batch after upload
              router.replace('/(tabs)');
            },
          },
        ],
      );
    }, 1000);
  };

  const handleCancel = () => {
    // Just go back - files remain in the batch
    router.back();
  };

  const handleAddMore = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowAddSourceModal(true);
  };

  // Handle opening camera
  const handleOpenCamera = () => {
    setShowAddSourceModal(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/capture');
  };

  // Handle picking from photo library
  const handlePickFromGallery = async () => {
    setShowAddSourceModal(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.85,
        orderedSelection: true,
      });

      if (!result.canceled && result.assets.length > 0) {
        const newFiles: DocumentFile[] = result.assets.map((asset, index) => ({
          id: generateId(),
          uri: asset.uri,
          name: asset.fileName || `Photo_${files.length + index + 1}.jpg`,
          type: asset.mimeType || 'image/jpeg',
          size: asset.fileSize || 0,
          createdAt: new Date(),
        }));
        addFiles(newFiles);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Gallery picker error:', error);
      Alert.alert('Error', 'Failed to access photo library.');
    }
  };

  // Handle picking from files (iCloud, Google Drive, local storage)
  const handlePickFromFiles = async () => {
    setShowAddSourceModal(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets.length > 0) {
        const newFiles: DocumentFile[] = result.assets.map((asset) => ({
          id: generateId(),
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType || 'application/octet-stream',
          size: asset.size || 0,
          createdAt: new Date(),
        }));
        addFiles(newFiles);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('File picker error:', error);
      Alert.alert('Error', 'Failed to access files.');
    }
  };

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: colors.cardSecondary }]}
            onPress={handleCancel}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Review & Upload</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {files.length} file{files.length !== 1 ? 's' : ''}
              {totalSize > 0 ? ` • ${formatSize(totalSize)}` : ''}
            </Text>
          </View>
          <View style={styles.headerButton} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* File Previews */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>FILES</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filesScroll}
            >
              {files.map((file) => (
                <View key={file.id} style={styles.fileCard}>
                  <FileThumbnail
                    file={file}
                    size="large"
                    showDetails
                    onRemove={() => handleRemoveFile(file.id)}
                  />
                </View>
              ))}

              {/* Add More Button */}
              <TouchableOpacity
                style={[
                  styles.addMoreButton,
                  { backgroundColor: colors.cardSecondary, borderColor: colors.border },
                ]}
                onPress={handleAddMore}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.addMoreIconWrapper,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  <Ionicons name="add" size={24} color={colors.primary} />
                </View>
                <Text style={[styles.addMoreText, { color: colors.textSecondary }]}>Add More</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Document Type Selector */}
          <View style={styles.section}>
            <DocumentTypeSelector selectedType={documentType} onSelect={setDocumentType} />
          </View>

          {/* Notes Input */}
          <View style={styles.section}>
            <NotesInput value={notes} onChangeText={setNotes} />
          </View>
        </ScrollView>

        {/* Bottom Action Bar */}
        <View style={[styles.bottomBar, { backgroundColor: colors.background }]}>
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: colors.border }]}
            onPress={handleCancel}
            disabled={isUploading}
          >
            <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.uploadButton,
              { backgroundColor: colors.primary },
              (isUploading || files.length === 0) && styles.buttonDisabled,
              Shadows.glow,
            ]}
            onPress={handleUpload}
            disabled={isUploading || files.length === 0}
            activeOpacity={0.8}
          >
            {isUploading ? (
              <Text style={[styles.uploadButtonText, { color: colors.background }]}>
                Uploading...
              </Text>
            ) : (
              <>
                <Text style={[styles.uploadButtonText, { color: colors.background }]}>Upload</Text>
                <View style={[styles.uploadIconWrapper, { backgroundColor: colors.background }]}>
                  <Ionicons name="arrow-up" size={16} color={colors.primary} />
                </View>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Add Source Modal */}
      <CaptureSourceModal
        visible={showAddSourceModal}
        onClose={() => setShowAddSourceModal(false)}
        onSelectCamera={handleOpenCamera}
        onSelectGallery={handlePickFromGallery}
        onSelectFiles={handlePickFromFiles}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.md,
    borderBottomWidth: 0,
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    ...Typography.h3,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    ...Typography.small,
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    ...Typography.small,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },
  filesScroll: {
    paddingRight: Spacing.lg,
  },
  fileCard: {
    marginRight: Spacing.md,
  },
  addMoreButton: {
    width: 140,
    height: 150,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  addMoreText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  addMoreIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    borderTopWidth: 0,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    ...Typography.bodyBold,
  },
  uploadButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  uploadButtonText: {
    ...Typography.bodyBold,
  },
  uploadIconWrapper: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
