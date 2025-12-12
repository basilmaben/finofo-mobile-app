import * as React from 'react';
import {
  PurchaseOrderDocument,
} from "@/graphql/types.gen";
import { DocumentTable } from '../common/table';
import { usePurchaseOrderTable } from './data/usePurchaseOrderTable';
import { useFormattedTitle } from '../common/useFormattedTitle';
import { useRouter } from 'expo-router';


export const PurchaseOrderTable: React.FC<{searchQuery?: string}> = ({searchQuery}) => {

  const router = useRouter();
  const { data, loading, refetch, fetchMore } = usePurchaseOrderTable();
  const edges = data?.purchaseOrders?.edges ?? [];
  const pageInfo = data?.purchaseOrders?.pageInfo;

  const onRefresh = React.useCallback(() => {
    refetch();
  }, [refetch]);

  const onEndReached = React.useCallback(() => {
    if (!pageInfo?.hasNextPage || !pageInfo.endCursor) return;

    fetchMore({
      variables: {
        after: pageInfo.endCursor,
        first: 20,
      },
    });
  }, [fetchMore, pageInfo?.hasNextPage, pageInfo?.endCursor]);

  const titleFormatter = useFormattedTitle()
  const extractTitle = (node: unknown) => {
    const {documentUrl, purchaseOrderNumber} = node as PurchaseOrderDocument;
    return titleFormatter('Purchase Order',documentUrl, purchaseOrderNumber)
  };
  const onPress = () => {
    router.push('/modules/document-views/purchase-orders/details');
  }
  return (
    <DocumentTable
      onPress={onPress}
      loading={loading}
      edges={edges}
      onRefresh={onRefresh}
      onEndReached={onEndReached}
      titleExtractor={extractTitle}
    />
  )
}

