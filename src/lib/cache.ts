const cache = new Map<string, unknown>();

export const getCacheKey = (fnName: string, ...args: unknown[]) => {
  return `${fnName}:${JSON.stringify(args)}`;
};

export const getCached = (key: string) => {
  return cache.get(key);
};

export const setCached = (key: string, value: unknown) => {
  cache.set(key, value);
};

export const withCache = <T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  fnName: string,
) => {
  return async (...args: T): Promise<R> => {
    const key = getCacheKey(fnName, ...args);
    const cached = getCached(key);
    if (cached !== undefined) {
      return cached;
    }
    const result = await fn(...args);
    setCached(key, result);
    return result;
  };
};
