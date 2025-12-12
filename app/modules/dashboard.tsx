import { BottomNav } from '@/components/BottomNav';
import { UploadButton } from '@/components/UploadButton';
import { UserAvatar } from '@/components/UserAvatar';
import type { SavedFile } from '@/services/encryptedStorage';
import { useActivity } from '@/store/activity-store';
import { useFileBatch } from '@/store/file-batch-store';
import * as Haptics from 'expo-haptics';
import { router, Stack } from 'expo-router';
import * as React from 'react';
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
  IconButton,
  List,
  Menu,
  ProgressBar,
  Searchbar,
  Text,
  useTheme
} from 'react-native-paper';
import Pdf from 'react-native-pdf';
import {
  Tabs,
  TabScreen,
  TabsProvider,
} from 'react-native-paper-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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

export default function Dashboard() {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [activityMenuVisible, setActivityMenuVisible] = React.useState<string | null>(null);
  const { files, uploadState, cancelUpload, pauseUpload, resumeUpload, retryUpload } = useFileBatch();
  const { savedFiles, isLoading: activityLoading, removeSavedFile, getFileUri } = useActivity();
  
  // Preview modal state
  const [previewFile, setPreviewFile] = React.useState<SavedFile | null>(null);
  const [previewUri, setPreviewUri] = React.useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = React.useState(false);
  const [pdfLoading, setPdfLoading] = React.useState(true);
  
  // Show different banners based on state
  const hasPendingFiles = files.length > 0 && uploadState.status === 'idle';
  const isUploading = uploadState.status === 'uploading';
  const isPaused = uploadState.status === 'paused';
  const uploadCompleted = uploadState.status === 'completed';
  const uploadError = uploadState.status === 'error';

  const filteredFiles = React.useMemo(() => {
    if (!searchQuery.trim()) return MOCK_FILES;
    const q = searchQuery.toLowerCase();
    return MOCK_FILES.filter((file) => file.name.toLowerCase().includes(q));
  }, [searchQuery]);

  const filteredActivityFiles = React.useMemo(() => {
    if (!searchQuery.trim()) return savedFiles;
    const q = searchQuery.toLowerCase();
    return savedFiles.filter((file) => file.name.toLowerCase().includes(q));
  }, [searchQuery, savedFiles]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
  };

  const handleDeleteActivityFile = (file: SavedFile) => {
    Alert.alert(
      'Delete File',
      `Are you sure you want to delete "${file.name}" from your activity?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeSavedFile(file.id);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete file');
            }
          },
        },
      ]
    );
  };

  const handlePreviewFile = async (file: SavedFile) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPreviewFile(file);
    setPreviewLoading(true);
    setPdfLoading(true);
    
    try {
      const uri = await getFileUri(file);
      setPreviewUri(uri);
    } catch (error) {
      console.error('Error loading file preview:', error);
      Alert.alert('Error', 'Failed to load file preview');
      closePreview();
    } finally {
      setPreviewLoading(false);
    }
  };

  const closePreview = () => {
    setPreviewFile(null);
    setPreviewUri(null);
    setPreviewLoading(false);
    setPdfLoading(true);
  };

  const renderActivityItem = ({ item }: { item: SavedFile }) => {
    const isPdf = item.type.includes('pdf');
    const isImage = item.type.includes('image');

    return (
      <TouchableOpacity onPress={() => handlePreviewFile(item)} activeOpacity={0.7}>
        <List.Item
          title={item.name}
          description={`${formatFileSize(item.size)} · ${formatDate(item.uploadedAt)} · Tap to preview`}
          left={(props) => (
            <List.Icon
              {...props}
              icon={
                isPdf
                  ? 'file-pdf-box'
                  : isImage
                  ? 'file-image'
                  : 'file-document-outline'
              }
            />
          )}
          right={() => (
            <View style={styles.rightActions}>
              <IconButton
                icon="eye-outline"
                size={20}
                onPress={() => handlePreviewFile(item)}
              />
              <Menu
                visible={activityMenuVisible === item.id}
                onDismiss={() => setActivityMenuVisible(null)}
                anchor={
                  <IconButton
                    icon="dots-vertical"
                    size={20}
                    onPress={() => setActivityMenuVisible(item.id)}
                  />
                }
              >
                <Menu.Item
                  onPress={() => {
                    setActivityMenuVisible(null);
                    handlePreviewFile(item);
                  }}
                  title="Preview"
                  leadingIcon="eye-outline"
                />
                <Menu.Item
                  onPress={() => {
                    setActivityMenuVisible(null);
                    handleDeleteActivityFile(item);
                  }}
                  title="Delete"
                  leadingIcon="delete-outline"
                />
              </Menu>
            </View>
          )}
          style={styles.listItem}
          titleNumberOfLines={1}
          descriptionNumberOfLines={1}
        />
      </TouchableOpacity>
    );
  };

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
    if (uploadCompleted) {
      return;
    }
    // Always open the drawer when banner is tapped (except when completed)
    router.push('/modules/upload-preview');
  };

  const showBanner = hasPendingFiles || isUploading || isPaused || uploadCompleted || uploadError;

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
              {activityLoading ? (
                <View style={styles.activityPlaceholder}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 12 }}>
                    Loading your files...
                  </Text>
                </View>
              ) : filteredActivityFiles.length === 0 ? (
                <View style={styles.activityPlaceholder}>
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                    {searchQuery.trim() ? 'No matching files found' : 'No uploaded files yet'}
                  </Text>
                  {!searchQuery.trim() && (
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
                      Your uploaded files will appear here
                    </Text>
                  )}
                </View>
              ) : (
                <FlatList
                  data={filteredActivityFiles}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.listContent}
                  renderItem={renderActivityItem}
                />
              )}
            </TabScreen>
          </Tabs>
        </TabsProvider>

        {/* Upload Status Banner */}
        {showBanner && (
          <TouchableOpacity 
            style={[
              styles.uploadBanner, 
              { 
                backgroundColor: uploadError 
                  ? theme.colors.errorContainer 
                  : uploadCompleted 
                    ? theme.colors.primaryContainer 
                    : isPaused
                      ? '#FEF3C7' // Amber-100 for paused state
                      : theme.colors.surfaceVariant 
              }
            ]}
            onPress={handleBannerPress}
            activeOpacity={0.8}
          >
            <View style={styles.uploadBannerContent}>
              <View style={styles.uploadBannerText}>
                <Text 
                  variant="bodyMedium" 
                  style={{ 
                    color: uploadError 
                      ? theme.colors.onErrorContainer 
                      : uploadCompleted 
                        ? theme.colors.onPrimaryContainer 
                        : isPaused
                          ? '#92400E' // Amber-800
                          : theme.colors.onSurface 
                  }}
                >
                  {getBannerText().title}
                </Text>
                <Text 
                  variant="bodySmall" 
                  style={{ 
                    color: uploadError 
                      ? theme.colors.onErrorContainer 
                      : uploadCompleted 
                        ? theme.colors.onPrimaryContainer 
                        : isPaused
                          ? '#B45309' // Amber-700
                          : theme.colors.onSurfaceVariant 
                  }}
                >
                  {getBannerText().subtitle}
                </Text>
              </View>
              {isUploading ? (
                <View style={styles.bannerActions}>
                  <IconButton 
                    icon="pause" 
                    size={20} 
                    iconColor={theme.colors.onSurfaceVariant}
                    onPress={pauseUpload}
                  />
                  <IconButton 
                    icon="close" 
                    size={20} 
                    iconColor={theme.colors.onSurfaceVariant}
                    onPress={cancelUpload}
                  />
                </View>
              ) : isPaused ? (
                <View style={styles.bannerActions}>
                  <IconButton 
                    icon="play" 
                    size={20} 
                    iconColor="#92400E"
                    onPress={() => resumeUpload()}
                  />
                  <IconButton 
                    icon="close" 
                    size={20} 
                    iconColor="#92400E"
                    onPress={cancelUpload}
                  />
                </View>
              ) : uploadError && uploadState.canResume ? (
                <View style={styles.bannerActions}>
                  <IconButton 
                    icon="refresh" 
                    size={20} 
                    iconColor={theme.colors.onErrorContainer}
                    onPress={() => retryUpload()}
                  />
                  <IconButton 
                    icon="close" 
                    size={20} 
                    iconColor={theme.colors.onErrorContainer}
                    onPress={cancelUpload}
                  />
                </View>
              ) : (
                <IconButton 
                  icon={hasPendingFiles ? "chevron-up" : uploadCompleted ? "check" : "alert-circle"} 
                  size={20} 
                  iconColor={
                    uploadError 
                      ? theme.colors.onErrorContainer 
                      : uploadCompleted 
                        ? theme.colors.onPrimaryContainer 
                        : theme.colors.onSurfaceVariant
                  }
                />
              )}
            </View>
            {(isUploading || isPaused) && (
              <ProgressBar 
                progress={uploadState.progress / 100} 
                color={isPaused ? '#D97706' : theme.colors.primary}
                style={styles.uploadProgressBar}
              />
            )}
          </TouchableOpacity>
        )}
        <BottomNav />
        <UploadButton />
      </View>

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
              {previewLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#FFFFFF" />
                  <Text style={styles.loadingText}>Loading...</Text>
                </View>
              ) : previewUri ? (
                previewFile.type.includes('image') ? (
                  <View pointerEvents="none" style={styles.imageWrapper}>
                    <Image
                      source={{ uri: previewUri }}
                      style={styles.previewImage}
                      resizeMode="contain"
                    />
                  </View>
                ) : previewFile.type.includes('pdf') ? (
                  <>
                    {pdfLoading && (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#FFFFFF" />
                        <Text style={styles.loadingText}>Loading...</Text>
                      </View>
                    )}
                    <Pdf
                      source={{ uri: previewUri }}
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
                ) : (
                  <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Preview not available for this file type</Text>
                  </View>
                )
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
                  {previewFile ? `${formatFileSize(previewFile.size)} · ${formatDate(previewFile.uploadedAt)}` : ''}
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
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadBanner: {
    position: 'absolute',
    bottom: 64, // above bottom nav
    left: 0,
    right: 0,
    paddingTop: 12,
    paddingHorizontal: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  uploadBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  uploadBannerText: {
    flex: 1,
  },
  uploadProgressBar: {
    marginTop: 8,
    marginBottom: 12,
    height: 3,
    borderRadius: 2,
  },
  bannerActions: {
    flexDirection: 'row',
    alignItems: 'center',
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
