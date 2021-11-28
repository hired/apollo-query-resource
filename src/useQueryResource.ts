import { useCallback, useMemo } from "react";
import {
  DocumentNode,
  OperationVariables,
  TypedDocumentNode,
} from "@apollo/client";

import {
  ObservableQueryOptions,
  useObservableQuery,
} from "./useObservableQuery";
import { settleObservableQuery } from "./settleObservableQuery";
import { useObservableQueryState } from "./useObservableQueryState";
import { QueryResource } from "./QueryResource";

// Prior art:
//   - https://github.com/trojanowski/react-apollo-hooks/blob/master/src/useQuery.ts
//   - https://github.com/apollographql/apollo-client/blob/v3.6.0-beta.3/src/react/hooks/useQuery.ts
//   - https://github.com/facebook/react/blob/main/packages/use-subscription/src/useSubscription.js
//   - https://codesandbox.io/s/sad-banach-tcnim?file=/src/App.js
//   - https://github.com/facebook/react/blob/main/packages/react-fetch/src/ReactFetchBrowser.js
//   - https://github.com/pmndrs/use-asset/tree/v2

/**
 * Creates `QueryResource`: a wrapper around standard Apollo query that works with Suspense for data-fetching.
 *
 * @example
 *
 * ```typescript
 * const query = useQueryResource(someQuery, { variables });
 *
 * const { myData: { id, name }} = query.read(); // will suspend!
 * ```
 */
export function useQueryResource<
  TData = unknown,
  TVariables extends OperationVariables = OperationVariables
>(
  query: DocumentNode | TypedDocumentNode<TData, TVariables>,
  options: ObservableQueryOptions<TVariables>
): QueryResource<TData> {
  // observableQuery will survive the suspension
  const observableQuery = useObservableQuery(query, options);
  const observableQueryState = useObservableQueryState(observableQuery);

  // Settle will suspend while observableQueryState.loading == true
  const settle = useCallback(
    () => settleObservableQuery(observableQuery),
    [observableQuery]
  );

  return useMemo(
    () => new QueryResource(observableQueryState, settle),
    [observableQueryState, settle]
  );
}
