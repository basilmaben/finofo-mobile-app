import {
  GetPurchaseOrderTableDocument,
  type GetPurchaseOrderTableQuery,
  type GetPurchaseOrderTableQueryVariables,
} from "@/graphql/types.gen";
import { useQuery } from "@apollo/client/react";
import { defaultQueryVariables } from "../../common/consts";

export const usePurchaseOrderTable = (variables?: GetPurchaseOrderTableQueryVariables) => useQuery<
  GetPurchaseOrderTableQuery,
  GetPurchaseOrderTableQueryVariables
  >(GetPurchaseOrderTableDocument, {
    variables: {...defaultQueryVariables, ...variables},
    notifyOnNetworkStatusChange: true
  });