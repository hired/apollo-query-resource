/// <reference types="react/next" />

declare module React {
  export function unstable_getCacheForType<T>(createNewCache: () => T): T;
  export function unstable_getCacheSignal(): AbortSignal;
}
