import { unstable_getCacheForType as getCacheForType } from "react";
import {
  DocumentNode,
  ObservableQuery,
  OperationVariables,
  TypedDocumentNode,
  useApolloClient,
} from "@apollo/client";
import { getOperationName } from "@apollo/client/utilities";
import { equal } from "@wry/equality";

export interface ObservableQueryOptions<
  TVariables extends OperationVariables = OperationVariables
> {
  /** Unique identifier of the query. When null query operation name will be used. */
  id?: string;

  /** GraphQL query variables. */
  variables?: TVariables;
}

/**
 * Hook returns `ObservableQuery` associated with given ID or query operation name.
 * Works properly with Suspense.
 *
 * @example
 *
 * ```typescript
 * const query_1 = useObservableQuery(someQuery, { id: "foo" });
 * const query_2 = useObservableQuery(someQuery, { id: "foo" });
 *
 * query_1 == query_2;
 * ```
 */
export function useObservableQuery<
  TData = unknown,
  TVariables extends OperationVariables = OperationVariables
>(
  query: DocumentNode | TypedDocumentNode<TData, TVariables>,
  { id, variables }: ObservableQueryOptions<TVariables>
): ObservableQuery<TData, TVariables> {
  // Get global cache for ObservableQuery.
  // IMPORTANT! This is our only way to share data between hook re-renders when hook is suspended.
  const cache = getObservableQueryCache();

  // Get Apollo client instance.
  // TODO: for simplicity we are assuming that it will never change
  const client = useApolloClient();

  // Use operation name as ID unless it is passed explicitly.
  id ??= getOperationName(query) ?? undefined;

  // ID is manadatory because we use it as a global cache key.
  if (!id) {
    throw new Error("Can't get unique ID from the query; pass ID explicitly");
  }

  // Try to get cached observable first
  const cachedObservableQuery = cache.get(id) as
    | ObservableQuery<TData, TVariables>
    | undefined;

  if (!cachedObservableQuery) {
    // Query is not in the cache; create a new one
    const newObservableQuery = client.watchQuery({ query, variables });
    cache.set(id, newObservableQuery);

    return newObservableQuery;
  }

  // We don't support dynamic queries because it is helps us to detect duplicate IDs.
  if (!equal(cachedObservableQuery.options.query, query)) {
    throw new Error(
      "useObservableQuery: Query has changed since last render. Check for duplicate IDs. "
    );
  }

  if (
    // Syncronize query variables with ObservableQuery. Wwe don't use useEffect here,
    // because useObservableQuery could be suspended (and all effects discarded) and
    // we don't want to refetch query multiple times.
    !equal(cachedObservableQuery.options.variables, variables)
  ) {
    // Reset query with new options
    void cachedObservableQuery.reobserve(variables);
  }

  return cachedObservableQuery;
}

/**
 * Returns a cache instance to store ObservableQueries.
 */
export function getObservableQueryCache() {
  return getCacheForType(createObservableQueryCache);
}

/**
 * Constructor for the `getObservableQueryCache`.
 */
function createObservableQueryCache(): Map<string, ObservableQuery<any, any>> {
  return new Map();
}
