import * as React from 'react';
import {
  PackingSlipDocument,
} from "@/graphql/types.gen";
import { DocumentTable } from '../common/table';
import { usePackingSlipTable } from './data/usePackingSlipTable';
import { useFormattedTitle } from '../common/useFormattedTitle';


export const PackingSlipTable: React.FC<{searchQuery?: string}> = ({searchQuery}) => {

  const { data, loading, refetch, fetchMore } = usePackingSlipTable();
  const edges = data?.packingSlips?.edges ?? [];
  const pageInfo = data?.packingSlips?.pageInfo;

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
  const extractTitle = (node: unknown) => titleFormatter('Packing Slip', (node as PackingSlipDocument).documentUrl, (node as PackingSlipDocument).slipNumber);

  return (
    <DocumentTable
      loading={loading}
      edges={edges}
      onRefresh={onRefresh}
      onEndReached={onEndReached}
      titleExtractor={extractTitle}
    />
  )
}

