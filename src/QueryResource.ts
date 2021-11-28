import { ApolloError } from "@apollo/client";

import { ObservableQueryState } from "./useObservableQueryState";

/**
 * Represenst a "suspenseful" Apollo GraphQL query.
 */
export class QueryResource<T> {
  /** Current state; see `useObservableQueryState`. */
  private state: ObservableQueryState<T>;

  /** Callback to suspend the component. */
  private settle: () => void;

  constructor(state: ObservableQueryState<T>, settle: () => void) {
    this.state = state;
    this.settle = settle;
  }

  /**
   * Returns query result; suspends when data is loading; throws exception when there are errors.
   */
  read(): T {
    // Suspend if loading
    if (this.state.loading) {
      // MUST SUSPEND!
      this.settle();
    }

    // Sanity check
    if (this.state.loading) {
      throw new Error("Invariant violation: QueryResource: failed to suspend");
    }

    // Throw errors (should be handler by ErrorBoundary or good ole' try-catch)
    if (this.state.networkError) {
      throw this.state.networkError;
    }

    if (this.state.graphQLErrors) {
      throw new ApolloError({ graphQLErrors: this.state.graphQLErrors });
    }

    // Sanity check
    // TODO: test that it can handles nulls
    if (this.state.data === undefined) {
      throw new Error("Invariant violation: QueryResource: data is undefined");
    }

    return this.state.data;
  }

  /**
   * Returns current query error (if any).
   * Does not suspend!
   */
  error(): ApolloError | undefined {
    return (
      this.state.networkError ??
      new ApolloError({ graphQLErrors: this.state.graphQLErrors })
    );
  }

  /**
   * Returns true if query is loading. Useful when you don't want to suspend.
   */
  isLoading(): boolean {
    return this.state.loading;
  }
}
