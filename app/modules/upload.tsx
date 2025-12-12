/**
 * Document Capture & Upload Screen
 * Main screen for capturing documents - supports mixing files from multiple sources
 */

import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomNav } from '@/components/BottomNav';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useFileBatch } from '@/store/file-batch-store';
import type { DocumentFile } from '@/types/document';

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export default function CaptureScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  // Use shared file batch store
  const { files, addFiles, removeFile, clearFiles } = useFileBatch();

  // Clear all files
  const handleClearAll = () => {
    Alert.alert('Clear All?', 'Remove all files from this batch?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          clearFiles();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  };

  // Handle opening camera
  const handleOpenCamera = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/modules/capture');
  };

  // Handle picking from photo library
  const handlePickFromGallery = async () => {
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

  // Handle remove file
  const handleRemoveFile = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    removeFile(id);
  };

  // Continue to upload preview
  const handleContinue = () => {
    if (files.length === 0) {
      Alert.alert('No Files', 'Please add at least one file to continue.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/modules/upload-preview',
      params: { files: JSON.stringify(files) },
    });
  };

  const hasFiles = files.length > 0;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, hasFiles && styles.scrollContentWithFiles]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Upload Document</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {hasFiles
              ? `${files.length} file${files.length > 1 ? 's' : ''} ready • Add more or continue`
              : 'Add files from any source to create a batch'}
          </Text>
        </View>

        {/* Files Preview (when files exist) */}
        {hasFiles && (
          <View style={styles.filesSection}>
            <View style={styles.filesSectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Your Batch</Text>
              <TouchableOpacity onPress={handleClearAll}>
                <Text style={[styles.clearButton, { color: colors.textMuted }]}>Clear all</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filesScroll}
            >
              {files.map((file) => (
                <View key={file.id} style={styles.fileCardWrapper}>
                  <View
                    style={[
                      styles.fileCard,
                      { backgroundColor: colors.cardSecondary, borderColor: colors.border },
                    ]}
                  >
                    {file.type.startsWith('image/') ? (
                      <Image source={{ uri: file.uri }} style={styles.fileImage} />
                    ) : (
                      <View style={styles.fileIconContainer}>
                        <Ionicons name="document-text" size={28} color={colors.text} />
                        <Text style={[styles.fileTypeLabel, { color: colors.text }]}>PDF</Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity
                    style={[styles.removeButton, { backgroundColor: colors.text }]}
                    onPress={() => handleRemoveFile(file.id)}
                  >
                    <Ionicons name="close" size={12} color={colors.background} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Add Sources */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            {hasFiles ? 'Add More From' : 'Add From'}
          </Text>

          <View style={styles.sourceGrid}>
            {/* Camera */}
            <TouchableOpacity
              style={[
                styles.sourceCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={handleOpenCamera}
              activeOpacity={0.7}
            >
              <View style={[styles.sourceCardIcon, { backgroundColor: colors.cardSecondary }]}>
                <Ionicons name="camera" size={28} color={colors.text} />
              </View>
              <Text style={[styles.sourceCardTitle, { color: colors.text }]}>Camera</Text>
              <Text style={[styles.sourceCardSubtitle, { color: colors.textMuted }]}>
                Scan docs
              </Text>
            </TouchableOpacity>

            {/* Gallery */}
            <TouchableOpacity
              style={[
                styles.sourceCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={handlePickFromGallery}
              activeOpacity={0.7}
            >
              <View style={[styles.sourceCardIcon, { backgroundColor: colors.cardSecondary }]}>
                <Ionicons name="images" size={28} color={colors.text} />
              </View>
              <Text style={[styles.sourceCardTitle, { color: colors.text }]}>Gallery</Text>
              <Text style={[styles.sourceCardSubtitle, { color: colors.textMuted }]}>Photos</Text>
            </TouchableOpacity>

            {/* Files */}
            <TouchableOpacity
              style={[
                styles.sourceCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={handlePickFromFiles}
              activeOpacity={0.7}
            >
              <View style={[styles.sourceCardIcon, { backgroundColor: colors.cardSecondary }]}>
                <Ionicons name="folder-open" size={28} color={colors.text} />
              </View>
              <Text style={[styles.sourceCardTitle, { color: colors.text }]}>Files</Text>
              <Text style={[styles.sourceCardSubtitle, { color: colors.textMuted }]}>
                iCloud, etc
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Supported Formats */}
        {!hasFiles && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              Supported Formats
            </Text>
            <View style={styles.formatsRow}>
              <View style={[styles.formatBadge, { backgroundColor: colors.cardSecondary }]}>
                <Ionicons name="image" size={16} color={colors.text} />
                <Text style={[styles.formatText, { color: colors.textSecondary }]}>JPG, PNG</Text>
              </View>
              <View style={[styles.formatBadge, { backgroundColor: colors.cardSecondary }]}>
                <Ionicons name="document-text" size={16} color={colors.text} />
                <Text style={[styles.formatText, { color: colors.textSecondary }]}>PDF</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Continue Button (when files exist) */}
      {hasFiles && (
        <View style={[styles.bottomBar, { backgroundColor: colors.background }]}>
          <TouchableOpacity
            style={[styles.continueButton, { backgroundColor: colors.primary }, Shadows.glow]}
            onPress={handleContinue}
            activeOpacity={0.8}
          >
            <Text style={[styles.continueButtonText, { color: colors.background }]}>
              Continue with {files.length} file{files.length > 1 ? 's' : ''}
            </Text>
            <View style={[styles.continueIconWrapper, { backgroundColor: colors.background }]}>
              <Ionicons name="arrow-forward" size={14} color={colors.primary} />
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom Navigation */}
      <BottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  scrollContentWithFiles: {
    paddingBottom: 180,
  },
  header: {
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  title: {
    ...Typography.h1,
    fontSize: 34,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    lineHeight: 22,
  },

  // Files Section
  filesSection: {
    marginBottom: Spacing.xl,
  },
  filesSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  clearButton: {
    ...Typography.caption,
  },
  filesScroll: {
    paddingRight: Spacing.lg,
  },
  fileCardWrapper: {
    position: 'relative',
    marginRight: Spacing.sm,
    paddingTop: 8,
    paddingRight: 8,
  },
  fileCard: {
    width: 80,
    height: 100,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  fileImage: {
    width: '100%',
    height: '100%',
  },
  fileIconContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileTypeLabel: {
    ...Typography.small,
    fontWeight: '700',
    marginTop: 4,
  },
  removeButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Sections
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.small,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: Spacing.md,
  },

  // Source Grid
  sourceGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  sourceCard: {
    flex: 1,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  sourceCardIcon: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  sourceCardTitle: {
    ...Typography.captionBold,
    marginBottom: 2,
  },
  sourceCardSubtitle: {
    ...Typography.small,
  },

  // Formats
  formatsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  formatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.full,
  },
  formatText: {
    ...Typography.caption,
    fontWeight: '500',
  },

  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 64,
    left: 0,
    right: 0,
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
    borderTopWidth: 0,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
  },
  continueButtonText: {
    ...Typography.bodyBold,
  },
  continueIconWrapper: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
