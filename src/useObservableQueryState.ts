import { useMemo, useSyncExternalStore } from "react";
import { ApolloError, ObservableQuery } from "@apollo/client";
import { GraphQLError } from "graphql";
import { equal } from "@wry/equality";

export interface ObservableQueryState<TData> {
  /** When true, query is waiting for data. */
  loading: boolean;

  /** Query result. */
  data: TData | undefined;

  /** Low-level network error. */
  networkError: ApolloError | undefined;

  /** GraphQL errors. */
  graphQLErrors: readonly GraphQLError[] | undefined;
}

/**
 * Hook subscribes to `ObservableQuery` updates and returns state as an object.
 * This is very similar to standard Apollo's `useQuery`. Works properly with new React 18 concurrent mode.
 *
 * @example
 *
 * ```typescript
 * const { loading, data, networkError, graphQLErrors } = useObservableQueryState(myQuery);
 * ```
 */
export function useObservableQueryState<TData>(
  observableQuery: ObservableQuery<TData, any>
): ObservableQueryState<TData> {
  const [subscribe, getSnapshot] = useMemo(() => {
    // Callback for the useSyncExternalStore that subscribes to new updates
    const subscribe = (onStoreChange: () => void) => {
      const subscription = observableQuery.subscribe(
        onStoreChange,
        onStoreChange
      );

      // Automatically unsubscribe from the ObservableQuery
      return () => {
        subscription.unsubscribe();
      };
    };

    // Snapshot MUST be memoized; otherwise there will be an infinite loop
    let currentSnapshot: ObservableQueryState<TData> | undefined;

    // Callback for the useSyncExternalStore that returns current state
    const getSnapshot = () => {
      // Get current state from the query
      const {
        loading,
        data,
        error: networkError,
        errors: graphQLErrors,
      } = observableQuery.getCurrentResult();

      const newSnapshot = {
        loading,
        data,
        networkError,
        graphQLErrors,
      };

      // Check for changes
      if (!currentSnapshot || !equal(newSnapshot, currentSnapshot)) {
        currentSnapshot = newSnapshot;
      }

      return currentSnapshot;
    };

    return [subscribe, getSnapshot];
  }, [observableQuery]);

  // New API to connect external state to the React
  // https://github.com/reactjs/rfcs/blob/main/text/0147-use-mutable-source.md
  // https://github.com/reactwg/react-18/discussions/86
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
