import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import * as React from 'react';
import {
  StyleSheet,
} from 'react-native';
import {
  FAB,
  List,
} from 'react-native-paper';


export const UploadButton = () => {

  const bottomSheetRef = React.useRef<BottomSheet>(null);
  const snapPoints = React.useMemo(() => ['25%'], []);

  const handleOpenSheet = React.useCallback(() => {
    bottomSheetRef.current?.expand();
  }, []);

  const handleCloseSheet = React.useCallback(() => {
    bottomSheetRef.current?.close();
  }, []);

  const renderBackdrop = React.useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    [],
  );

  return (
    <>
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleOpenSheet}
      />

      <BottomSheet
        ref={bottomSheetRef}
        index={-1} // hidden by default
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
      >
        <BottomSheetView style={styles.sheetContent}>
          <List.Item
            title="Upload file"
            left={(props) => <List.Icon {...props} icon="upload" />}
            onPress={() => {
              handleCloseSheet();
              // TODO: trigger upload flow
            }}
            style={styles.sheetItem}
          />
          <List.Item
            title="Take photo"
            left={(props) => <List.Icon {...props} icon="camera" />}
            onPress={() => {
              handleCloseSheet();
              // TODO: trigger camera flow
            }}
            style={styles.sheetItem}
          />
        </BottomSheetView>
      </BottomSheet>
    </>
  )
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    borderRadius: 50,
    right: 24,
    bottom: 80, // just above bottom nav
  },
  sheetContent: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  sheetItem: {
    paddingHorizontal: 24,
  },
})