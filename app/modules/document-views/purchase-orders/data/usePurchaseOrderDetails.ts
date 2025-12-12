import { GetPurchaseOrderDetailsDocument, GetPurchaseOrderDetailsQuery, GetPurchaseOrderDetailsQueryVariables } from "@/graphql/types.gen";
import { useQuery } from "@apollo/client/react";

export const usePurchaseOrderDetails = (variables: GetPurchaseOrderDetailsQueryVariables) => 
  useQuery<GetPurchaseOrderDetailsQuery, GetPurchaseOrderDetailsQueryVariables>(
    GetPurchaseOrderDetailsDocument, 
    {variables, notifyOnNetworkStatusChange: true}
  );