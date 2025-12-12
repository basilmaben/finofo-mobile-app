import { BottomNav } from '@/components/BottomNav';
import { UploadButton } from '@/components/UploadButton';
import { UserAvatar } from '@/components/UserAvatar';
import { Stack } from 'expo-router';
import * as React from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';
import {
  Searchbar,
  useTheme
} from 'react-native-paper';
import {
  Tabs,
  TabScreen,
  TabsProvider,
} from 'react-native-paper-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PurchaseOrderTable } from './purchase-orders/table';
import { PackingSlipTable } from './packing-slips/table';
import { InvoiceTable } from './invoices/table';


export default function DocumentList() {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = React.useState('');

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
            <TabScreen label="PO">
              <PurchaseOrderTable searchQuery={searchQuery} />
            </TabScreen>
            <TabScreen label="Packing slip">
              <PackingSlipTable searchQuery={searchQuery} />
            </TabScreen>
            <TabScreen label="Invoice">
              <InvoiceTable searchQuery={searchQuery} />
            </TabScreen>
          </Tabs>
        </TabsProvider>
        <BottomNav />
        <UploadButton />
      </View>
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
});