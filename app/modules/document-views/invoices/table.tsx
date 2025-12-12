import * as React from 'react';
import {
  InvoiceDocument,
} from "@/graphql/types.gen";
import { DocumentTable } from '../common/table';
import { useInvoiceTable } from './data/useInvoiceTable';
import { useFormattedTitle } from '../common/useFormattedTitle';

export const InvoiceTable: React.FC<{searchQuery?: string}> = ({searchQuery}) => {

  const { data, loading, refetch, fetchMore } = useInvoiceTable();
  const edges = data?.invoices?.edges ?? [];
  const pageInfo = data?.invoices?.pageInfo;

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
  const extractTitle = (node: unknown) => titleFormatter('Invoice', (node as InvoiceDocument).documentUrl, (node as InvoiceDocument).invoiceNumber);
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

