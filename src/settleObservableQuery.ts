import { unstable_getCacheForType as getCacheForType } from "react";
import { ObservableQuery } from "@apollo/client";

/**
 * Helper suspends the execution until given ObservableQuery has loading = false.
 *
 * @example
 *
 * ```typescript
 * observableQuery.getCurrentResult().loading === true; // before
 * settleObservableQuery(observableQuery);
 * observableQuery.getCurrentResult().loading === false; // after
 * ```
 */
export function settleObservableQuery(
  observableQuery: ObservableQuery<any, any>
) {
  // Do nothing if query is already settled
  if (!observableQuery.getCurrentResult().loading) {
    return;
  }

  // A cache that will survive the Suspense
  const cache = getSuspenseCache();

  // Find or initialize a promise that will resolve / reject when query will get data / error
  const promise =
    cache.get(observableQuery) ??
    new Promise<void>((resolve, reject) => {
      const subscription = observableQuery.subscribe({
        next({ loading }) {
          if (loading) {
            return;
          }

          subscription.unsubscribe();
          cache.delete(observableQuery);

          resolve();
        },

        error(err) {
          subscription.unsubscribe();
          cache.delete(observableQuery);

          reject(err);
        },
      });
    });

  cache.set(observableQuery, promise);

  // Suspend!
  throw promise;
}

/**
 * Returns a cache instance to store Promises that we use to trigger Suspense.
 */
function getSuspenseCache() {
  return getCacheForType(createSuspenseCache);
}

/**
 * Constructor for the `getSuspenseCache`.
 */
function createSuspenseCache(): Map<ObservableQuery<any>, Promise<void>> {
  // TODO: maybe WeakMap is better
  return new Map();
}
