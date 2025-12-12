import { GetPackingSlipTableDocument, GetPackingSlipTableQuery, GetPackingSlipTableQueryVariables } from "@/graphql/types.gen";
import { useQuery } from "@apollo/client/react";
import { defaultQueryVariables } from "../../common/consts";

export const usePackingSlipTable = (variables?: GetPackingSlipTableQueryVariables) => 
  useQuery<GetPackingSlipTableQuery, GetPackingSlipTableQueryVariables>(GetPackingSlipTableDocument, {
    variables: {...defaultQueryVariables, ...variables},
    notifyOnNetworkStatusChange: true
});