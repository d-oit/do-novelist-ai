const cache = new Map<string, any>();

export const getCacheKey = (fnName: string, ...args: any[]) => {
  return `${fnName}:${JSON.stringify(args)}`;
};

export const getCached = (key: string) => {
  return cache.get(key);
};

export const setCached = (key: string, value: any) => {
  cache.set(key, value);
};

export const withCache = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  fnName: string
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