import { GetInvoiceTableDocument, GetInvoiceTableQuery, GetInvoiceTableQueryVariables } from "@/graphql/types.gen";
import { useQuery } from "@apollo/client/react";
import { defaultQueryVariables } from "../../common/consts";

export const useInvoiceTable = (variables?: GetInvoiceTableQueryVariables) => 
  useQuery<GetInvoiceTableQuery, GetInvoiceTableQueryVariables>(GetInvoiceTableDocument, {
    variables: {...defaultQueryVariables, ...variables},
    notifyOnNetworkStatusChange: true
});