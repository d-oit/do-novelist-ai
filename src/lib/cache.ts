const cache = new Map<string, unknown>();

export const getCacheKey = (fnName: string, ...args: unknown[]): string => {
  return `${fnName}:${JSON.stringify(args)}`;
};

export const getCached = (key: string): unknown => {
  return cache.get(key);
};

export const setCached = (key: string, value: unknown): void => {
  cache.set(key, value);
};

export const clearCache = (): void => {
  cache.clear();
};

export const withCache = <T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  fnName: string,
) => {
  return async (...args: T): Promise<R> => {
    const key = getCacheKey(fnName, ...args);
    const cached = getCached(key);
    if (cached !== undefined) {
      return cached as R;
    }
    const result = await fn(...args);
    setCached(key, result);
    return result;
  };
};
