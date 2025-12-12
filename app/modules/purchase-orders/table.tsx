// app/modules/purchaseOrders/table.tsx
import { useQuery } from "@apollo/client/react";
import { useRouter } from "expo-router";
import React, { useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BottomNav } from "@/components/BottomNav";
import { UploadButton } from "@/components/UploadButton";
import {
  GetPurchaseOrderTableDocument,
  type GetPurchaseOrderTableQuery,
  type GetPurchaseOrderTableQueryVariables,
} from "@/graphql/types.gen";

type Edge =
  NonNullable<GetPurchaseOrderTableQuery["purchaseOrders"]>["edges"][number];

export default function PurchaseOrderTableScreen() {
  const router = useRouter();

  const { data, loading, error, refetch, fetchMore } = useQuery<
    GetPurchaseOrderTableQuery,
    GetPurchaseOrderTableQueryVariables
  >(GetPurchaseOrderTableDocument, {
    variables: {
      first: 20,
      after: null,
      before: null,
      last: null,
      sort: [],
      filter: []
    },
    notifyOnNetworkStatusChange: true,
  });

  const edges = data?.purchaseOrders?.edges ?? [];
  const pageInfo = data?.purchaseOrders?.pageInfo;

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const onEndReached = useCallback(() => {
    if (!pageInfo?.hasNextPage || !pageInfo.endCursor) return;

    fetchMore({
      variables: {
        after: pageInfo.endCursor,
        first: 20,
      },
    });
  }, [fetchMore, pageInfo?.hasNextPage, pageInfo?.endCursor]);

  const renderItem = ({ item }: { item: Edge }) => {
    const po = item.node;
    if (!po) return null;

    const vendorDisplay = po.vendorName ?? po.vendor?.name ?? "Unknown vendor";

    return (
      <View style={styles.row}>
        <View style={styles.rowHeader}>
          <Text style={styles.poNumber}>{po.purchaseOrderNumber}</Text>
          <Text style={styles.status}>{po.status}</Text>
        </View>
        <Text style={styles.vendor}>{vendorDisplay}</Text>
        <View style={styles.rowFooter}>
          <Text style={styles.amount}>
            {po.totalAmount} {po.currency}
          </Text>
          <Text style={styles.meta}>
            Invoices: {po.invoices?.length ?? 0} • PS:{" "}
            {po.packingSlips?.length ?? 0}
          </Text>
        </View>
      </View>
    );
  };

  if (loading && !data) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.centered}>
        <ActivityIndicator />
        <Text style={styles.muted}>Loading purchase orders…</Text>
      </View>
        <BottomNav />
        <UploadButton />
      </SafeAreaView>
    );
  }

  if (error && !data) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.centered}>
        <Text style={styles.error}>Failed to load purchase orders.</Text>
        <Text style={styles.muted}>{String(error.message)}</Text>
        <TouchableOpacity
          style={[styles.button, { marginTop: 16 }]}
          onPress={() => refetch()}
        >
          <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.buttonSecondary, { marginTop: 8 }]}
          onPress={() => router.replace("/")}
        >
          <Text style={styles.buttonSecondaryText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </View>
        <BottomNav />
        <UploadButton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
    <View style={styles.container}>
        {/* Header */}
      <View style={styles.header}>
          <View style={{ width: 80 }} />
        <Text style={styles.headerTitle}>Purchase Orders</Text>
        <View style={{ width: 80 }} />
      </View>

      <FlatList
        data={edges}
        keyExtractor={(edge) => edge.node?.id ?? edge.cursor}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={loading && !!data}
            onRefresh={onRefresh}
            tintColor="#E5E7EB"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.muted}>
              No purchase orders found for this query.
            </Text>
          </View>
        }
      />
    </View>
      <BottomNav />
      <UploadButton />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#020617",
  },
  container: {
    flex: 1,
    backgroundColor: "#020617",
  },
  centered: {
    flex: 1,
    backgroundColor: "#020617",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  header: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#1F2937",
  },
  headerTitle: {
    color: "#F9FAFB",
    fontSize: 18,
    fontWeight: "600",
  },
  listContent: {
    padding: 16,
    paddingBottom: 120, // space for bottom nav & FAB
  },
  row: {
    backgroundColor: "#020617",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#1F2937",
  },
  rowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  poNumber: {
    color: "#E5E7EB",
    fontWeight: "600",
  },
  status: {
    color: "#93C5FD",
    fontSize: 12,
  },
  vendor: {
    color: "#9CA3AF",
    marginBottom: 4,
  },
  rowFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  amount: {
    color: "#E5E7EB",
    fontWeight: "500",
  },
  meta: {
    color: "#6B7280",
    fontSize: 12,
  },
  error: {
    color: "#F97373",
    marginBottom: 8,
    textAlign: "center",
  },
  muted: {
    color: "#9CA3AF",
    textAlign: "center",
  },
  button: {
    backgroundColor: "#2563EB",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  buttonText: {
    color: "#F9FAFB",
    fontWeight: "600",
  },
  buttonSecondary: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "#4B5563",
  },
  buttonSecondaryText: {
    color: "#E5E7EB",
  },
  emptyState: {
    marginTop: 40,
    alignItems: "center",
  },
});