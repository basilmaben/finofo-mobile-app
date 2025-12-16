import * as React from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import {
  Appbar,
  useTheme,
  Surface,
  Card,
  Text,
  Avatar,
  Button,
  Icon,
} from "react-native-paper";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  interpolateColor,
  Extrapolation,
} from "react-native-reanimated";
import { useLocalSearchParams, useRouter } from "expo-router";
import { UploadButton } from "@/components/UploadButton";
import { useUploadSheet } from "@/hooks/useUploadSheet";
import {
  Tabs,
  TabScreen,
  TabsProvider,
  useTabIndex,
} from "react-native-paper-tabs";
import { getFileExtension, getFileIcon, getFilename } from "../common/filename";
import Pdf from "react-native-pdf";
import { usePurchaseOrderDetails } from "./data/usePurchaseOrderDetails";
import { formatDate } from "../common/table";

const { width } = Dimensions.get("window");

const DOCUMENT_DISPLAY_HEIGHT = 260;
const SNAP_DISTANCE = DOCUMENT_DISPLAY_HEIGHT / 2;
const SNAP_TOLERANCE = 1; // px

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);
const AnimatedSurface = Animated.createAnimatedComponent(Surface);
const AnimatedCard = Animated.createAnimatedComponent(Card);

 const TEST_PDF = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
// const TEST_PDF = "http://samples.leanpub.com/thereactnativebook-sample.pdf"

const formatCurrency = (amount: number, currency: string = 'USD') => {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    currencyDisplay: 'narrowSymbol'
  }).format(amount);

  return formatted;
};

export default function DocumentScreen() {
  const theme = useTheme();
  const router = useRouter();

  const scrollY = useSharedValue(0);
  const scrollRef = React.useRef<ScrollView | null>(null);

  const { id } = useLocalSearchParams<{ id: string }>();

  const { data, loading } = usePurchaseOrderDetails({ id });

  // Animated scroll handler for reanimated
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Animated style for document display container (height + background)
  const documentContainerStyle = useAnimatedStyle(() => {
    const height = interpolate(
      scrollY.value,
      [0, DOCUMENT_DISPLAY_HEIGHT],
      [DOCUMENT_DISPLAY_HEIGHT, 0],
      Extrapolation.CLAMP
    );
    const backgroundColor = interpolateColor(
      scrollY.value,
      [0, DOCUMENT_DISPLAY_HEIGHT],
      [theme.colors.primaryContainer, theme.colors.background]
    );
    return { height, backgroundColor };
  });

  // Animated style for preview (scale + opacity)
  const previewStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollY.value,
      [0, DOCUMENT_DISPLAY_HEIGHT],
      [1, 0.85],
      Extrapolation.CLAMP
    );
    const opacity = interpolate(
      scrollY.value,
      [0, DOCUMENT_DISPLAY_HEIGHT * 0.6],
      [1, 0],
      Extrapolation.CLAMP
    );
    return { transform: [{ scale }], opacity };
  });

  const handleSnap = React.useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = e.nativeEvent.contentOffset.y;
  
      // ignore overscroll / already past snap zone
      if (offsetY < 0 || offsetY > SNAP_DISTANCE) return;
  
      const halfway = SNAP_DISTANCE / 2;
      const target = offsetY < halfway ? 0 : SNAP_DISTANCE;
  
      // if we're already basically at the target, don't do anything
      if (Math.abs(offsetY - target) <= SNAP_TOLERANCE) {
        // console.log("Skip snap, close enough", { offsetY, target });
        return;
      }
  
      // console.log("Snapping to", target, "from", offsetY);
      scrollRef.current?.scrollTo({
        y: target,
        animated: true,
      });
    },
    []
  );

  return (
    <TabsProvider defaultIndex={0}>
      <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
        <Appbar.Header mode="center-aligned">
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title={data?.purchaseOrder?.purchaseOrderNumber} />
        </Appbar.Header>

        <AnimatedScrollView
          ref={scrollRef}
          contentContainerStyle={[styles.scrollContent]}
          scrollEventThrottle={16}
          onScroll={scrollHandler}
          onScrollEndDrag={handleSnap}
          // index 0 = preview, index 1 = sticky header + tabs
          stickyHeaderIndices={[1]}
        >
          {/* Document display / preview */}
          <AnimatedSurface
            style={[styles.documentDisplayContainer, documentContainerStyle]}
            elevation={0}
          >
            <Animated.View style={[styles.previewWrapper, previewStyle]}>
              <TouchableOpacity activeOpacity={0.9} onPress={() => {}}>
                  <DocumentPreview url={TEST_PDF} />
              </TouchableOpacity>
            </Animated.View>
          </AnimatedSurface>

          {/* Sticky header: file meta + tabs bar */}
          <Surface
            style={[styles.headerSurface, {backgroundColor: theme.colors.background}]}
            elevation={1}
          >
            <DocumentHeader fileName={getFilename(data?.purchaseOrder?.documentUrl)} amount={data?.purchaseOrder?.totalAmount + ''} />
            <Tabs
              uppercase={false}
              showTextLabel
              style={styles.tabs}
              iconPosition="top"
              disableSwipe={false}
            >
              {/* We don't put content inside TabScreen; we render it below with useTabIndex */}
              <TabScreen label="Document details" icon="file-document-outline"><></></TabScreen>
              <TabScreen label="Comments" icon="message-text-outline"><></></TabScreen>
            </Tabs>
          </Surface>

          {/* Tab content – scrolls under the sticky header */}
          <TabContent />
        </AnimatedScrollView>
      </View>
      <UploadButton ignoreBanner />
    </TabsProvider>
  );
}

/**
 * Sticky header: icon + filename + amount
 */
type DocumentHeaderProps = {
  fileName: string;
  amount?: string | null;
  currency?: string | null;
};

const DocumentHeader: React.FC<DocumentHeaderProps> = ({
  fileName,
  amount,
  currency,
}) => {
  const theme = useTheme();
  const icon = getFileIcon(fileName);

  return (
    <View style={[styles.headerContent, {backgroundColor: theme.colors.background}]}>
      <View style={styles.headerRow}>
        <Avatar.Icon
          size={40}
          icon={icon}
          style={{ backgroundColor: theme.colors.secondaryContainer }}
        />
        <View style={styles.headerTextWrapper}>
          <Text
            variant="titleMedium"
            numberOfLines={1}
            style={styles.headerTitle}
          >
            {fileName}
          </Text>
          <Text
            variant="bodyMedium"
            style={[styles.headerSubtitle, { color: theme.colors.onSurfaceVariant }]}
          >
            {formatCurrency(parseInt(amount || '0', 10), currency || 'USD')}
          </Text>
        </View>
      </View>
    </View>
  );
};

/**
 * Tab content renderer, driven by react-native-paper-tabs' context.
 * Tab index 0: Document details
 * Tab index 1: Comments
 */
const TabContent: React.FC = () => {
  const index = useTabIndex();
  const theme = useTheme();

  return (
    <View style={[styles.tabContentWrapper, { backgroundColor: theme.colors.background }]}>
      {index === 0 ? <DocumentDetailsCard /> : <CommentsPlaceholder />}
    </View>
  );
};

/**
 * "Document details" tab: PO details + Attachments card.
 * Only the top of the card is “real”; the rest are duplicated rows as requested.
 */
const DocumentDetailsCard: React.FC = () => {
  const theme = useTheme();
  const { openUploadSheet } = useUploadSheet();

  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, loading } = usePurchaseOrderDetails({ id });

  const rows = [
    { label: "Doc type", value: data?.purchaseOrder?.type },
    { label: "Vendor", value: data?.purchaseOrder?.vendor?.name || data?.purchaseOrder?.vendorName },
    { label: "Status", value: data?.purchaseOrder?.status },
    { label: "Date added", value: formatDate(data?.purchaseOrder?.createdAt || 0)},
    { label: "Uploader", value: "Charles Maranda" },
    { label: "Approver", value: "Jane Doe" },
    { label: "Cost center", value: "Marketing" },
  ];

  return (
    <>
      {/* Main PO details card */}
      <Card mode="elevated" style={styles.detailsCard}>
        <Card.Content>
          <View style={styles.detailsHeaderRow}>
            <Text variant="titleMedium">PO details</Text>
            <Icon
              source="chevron-right"
              size={24}
              color={theme.colors.onSurfaceVariant}
            />
          </View>

          {rows.map((row) => (
            <View style={styles.detailRow} key={row.label}>
              <Text
                variant="labelSmall"
                style={[
                  styles.detailLabel,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {row.label}
              </Text>
              <Text variant="bodyMedium" style={styles.detailValue}>
                {row.value}
              </Text>
            </View>
          ))}
        </Card.Content>
      </Card>

      {/* Attachments card */}
      <Card mode="elevated" style={styles.attachmentsCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.attachmentsTitle}>
            Attachments
          </Text>

          <View style={styles.attachmentsBody}>
            <Surface
              mode="flat"
              style={[
                styles.attachmentIconSurface,
                { backgroundColor: theme.colors.surfaceVariant },
              ]}
            >
              <Icon
                source="file-plus-outline"
                size={28}
                color={theme.colors.onSurfaceVariant}
              />
            </Surface>
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              No attachments
            </Text>
            <Text
              variant="bodySmall"
              style={[
                styles.attachmentsHint,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              All attachments will be stored here and can be downloaded.
            </Text>
          </View>

          <Button
            mode="contained"
            style={styles.attachButton}
            onPress={openUploadSheet}
          >
            Add attachment
          </Button>
        </Card.Content>
      </Card>
    </>
  );
};

const CommentsPlaceholder: React.FC = () => {
  const theme = useTheme();
  return (
    <Card mode="elevated" style={styles.commentsCard}>
      <Card.Content>
        <Text
          variant="bodyMedium"
          style={{ color: theme.colors.onSurfaceVariant }}
        >
          Comments will appear here.
        </Text>
      </Card.Content>
    </Card>
  );
};

const DocumentPreview: React.FC<{ url: string }> = ({ url }) => {
  const ext = getFileExtension(url);


  if (ext === "jpg" || ext === "jpeg" || ext === "png") {
    return (
      <Card.Cover
        source={{ uri: url }}
        style={styles.previewImage}
        resizeMode="contain"
      />
    );
  }
  console.log('render pdf');

  // PDF (or unknown) — render first page, disable its own scroll

  return (
    <View style={{ flex: 1 }}>
      <Pdf
        source={{uri: url, cache: true}}
        onLoadComplete={(numberOfPages,filePath) => {
          console.log(`Number of pages: ${numberOfPages}, file path: ${filePath}`);
        }}
        onPageChanged={(page,numberOfPages) => {
            console.log(`Current page: ${page}`);
        }}
        onError={(error) => {
            console.log(error);
        }}
        onPressLink={(uri) => {
            console.log(`Link pressed: ${uri}`);
        }}
        style={styles.pdf}
        singlePage={true}
        spacing={0}
        enablePaging={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  documentDisplayContainer: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  previewWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  previewCard: {
    width: width * 0.7,
    aspectRatio: Math.SQRT2, // ~ A-series page ratio
    overflow: "hidden",
  },
  previewImage: {
    flex: 1,
    backgroundColor: "transparent",
  },
  pdfStub: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  pdfStubText: {
    marginTop: 8,
  },
  headerSurface: {
    width: "100%",
    paddingBottom: 4,
  },
  headerContent: {
    paddingBottom: 8,
    paddingTop: 12,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTextWrapper: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    marginBottom: 2,
  },
  headerSubtitle: {
    fontWeight: "500",
  },
  tabs: {
    paddingTop: 4,
  },
  tabContentWrapper: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  detailsCard: {
    marginBottom: 16,
  },
  detailsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  detailRow: {
    marginBottom: 12,
  },
  detailLabel: {
    marginBottom: 2,
  },
  detailValue: {
    fontWeight: "500",
  },
  attachmentsCard: {
    marginBottom: 16,
  },
  attachmentsTitle: {
    marginBottom: 12,
  },
  attachmentsBody: {
    alignItems: "center",
    marginBottom: 12,
  },
  attachmentIconSurface: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  attachmentsHint: {
    marginTop: 4,
    textAlign: "center",
  },
  attachButton: {
    alignSelf: "stretch",
    marginTop: 4,
  },
  commentsCard: {
    marginBottom: 16,
  },
  pdf: {
    flex:1,
    width:Dimensions.get('window').width,
    height:Dimensions.get('window').height,
}
});
