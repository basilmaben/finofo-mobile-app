/**
 * Upload Status Banner
 * Shows upload progress - rendered as part of BottomNav
 */

import * as Haptics from 'expo-haptics';
import { router, usePathname } from 'expo-router';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { IconButton, ProgressBar, Text, useTheme } from 'react-native-paper';
import { useFileBatch } from '@/store/file-batch-store';

export const UploadStatusBanner = () => {
  const theme = useTheme();
  const pathname = usePathname();
  const { files, uploadState, cancelUpload, pauseUpload, resumeUpload, retryUpload } = useFileBatch();

  // Don't show on upload-preview page (it has its own UI)
  if (pathname === '/modules/upload-preview') {
    return null;
  }

  const hasPendingFiles = files.length > 0 && uploadState.status === 'idle';
  const isUploading = uploadState.status === 'uploading';
  const isPaused = uploadState.status === 'paused';
  const uploadCompleted = uploadState.status === 'completed';
  const uploadError = uploadState.status === 'error';

  const showBanner = hasPendingFiles || isUploading || isPaused || uploadCompleted || uploadError;

  if (!showBanner) {
    return null;
  }

  const getBannerText = () => {
    if (isUploading) {
      return {
        title: `Uploading ${uploadState.totalFiles || files.length} file${(uploadState.totalFiles || files.length) !== 1 ? 's' : ''}...`,
        subtitle: `${uploadState.progress}% complete`,
      };
    }
    if (isPaused) {
      return {
        title: 'Upload paused',
        subtitle: `${uploadState.progress}% complete · Tap to resume`,
      };
    }
    if (uploadCompleted) {
      return {
        title: 'Upload complete!',
        subtitle: 'All files uploaded successfully',
      };
    }
    if (uploadError) {
      return {
        title: 'Upload failed',
        subtitle: uploadState.canResume ? 'Tap to retry' : (uploadState.error || 'Something went wrong'),
      };
    }
    return {
      title: `${files.length} file${files.length !== 1 ? 's' : ''} ready to upload`,
      subtitle: 'Tap to review and upload',
    };
  };

  const handleBannerPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (uploadCompleted) {
      return;
    }
    router.push('/modules/upload-preview');
  };

  const getBannerColors = () => {
    if (uploadError) {
      return {
        bg: theme.colors.errorContainer,
        text: theme.colors.onErrorContainer,
        subtext: theme.colors.onErrorContainer,
      };
    }
    if (uploadCompleted) {
      return {
        bg: theme.colors.primaryContainer,
        text: theme.colors.onPrimaryContainer,
        subtext: theme.colors.onPrimaryContainer,
      };
    }
    if (isPaused) {
      return {
        bg: '#FEF3C7',
        text: '#92400E',
        subtext: '#B45309',
      };
    }
    return {
      bg: theme.colors.surfaceVariant,
      text: theme.colors.onSurface,
      subtext: theme.colors.onSurfaceVariant,
    };
  };

  const colors = getBannerColors();
  const bannerText = getBannerText();

  return (
    <TouchableOpacity
      style={[styles.banner, { backgroundColor: colors.bg }]}
      onPress={handleBannerPress}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        <View style={styles.textContainer}>
            <Text variant="bodyMedium" style={{ color: colors.text }}>
              {bannerText.title}
            </Text>
            <Text variant="bodySmall" style={{ color: colors.subtext }}>
              {bannerText.subtitle}
            </Text>
          </View>

          {isUploading ? (
            <View style={styles.actions}>
              <IconButton
                icon="pause"
                size={20}
                iconColor={colors.text}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  pauseUpload();
                }}
              />
              <IconButton
                icon="close"
                size={20}
                iconColor={colors.text}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  cancelUpload();
                }}
              />
            </View>
          ) : isPaused ? (
            <View style={styles.actions}>
              <IconButton
                icon="play"
                size={20}
                iconColor={colors.text}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  resumeUpload();
                }}
              />
              <IconButton
                icon="close"
                size={20}
                iconColor={colors.text}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  cancelUpload();
                }}
              />
            </View>
          ) : uploadError && uploadState.canResume ? (
            <View style={styles.actions}>
              <IconButton
                icon="refresh"
                size={20}
                iconColor={colors.text}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  retryUpload();
                }}
              />
              <IconButton
                icon="close"
                size={20}
                iconColor={colors.text}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  cancelUpload();
                }}
              />
            </View>
          ) : (
            <IconButton
              icon={hasPendingFiles ? 'chevron-up' : uploadCompleted ? 'check' : 'alert-circle'}
              size={20}
              iconColor={colors.text}
            />
          )}
        </View>

      {(isUploading || isPaused) && (
        <ProgressBar
          progress={uploadState.progress / 100}
          color={isPaused ? '#D97706' : theme.colors.primary}
          style={styles.progressBar}
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  banner: {
    paddingTop: 12,
    paddingHorizontal: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    marginTop: 8,
    marginBottom: 12,
    height: 3,
    borderRadius: 2,
  },
});

