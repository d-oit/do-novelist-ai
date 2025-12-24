export type JsonSafe = string | number | boolean | null | JsonSafe[] | { [key: string]: JsonSafe };

const MAX_DEPTH = 6;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function sanitizeValue(value: unknown, depth: number, seen: WeakSet<object>): JsonSafe {
  if (value === null) return null;

  const valueType = typeof value;
  if (valueType === 'string' || valueType === 'number' || valueType === 'boolean') {
    return value as string | number | boolean;
  }

  if (valueType === 'bigint') {
    return (value as bigint).toString();
  }

  if (valueType === 'undefined') {
    return null;
  }

  if (valueType === 'function') {
    return '[Function]';
  }

  if (valueType === 'symbol') {
    return (value as symbol).toString();
  }

  if (depth >= MAX_DEPTH) {
    return '[MaxDepth]';
  }

  // Objects
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack ?? null,
    };
  }

  if (Array.isArray(value)) {
    return value.map(v => sanitizeValue(v, depth + 1, seen));
  }

  if (value instanceof Map) {
    return Array.from(value.entries()).map(([k, v]) => [
      sanitizeValue(k, depth + 1, seen),
      sanitizeValue(v, depth + 1, seen),
    ]);
  }

  if (value instanceof Set) {
    return Array.from(value.values()).map(v => sanitizeValue(v, depth + 1, seen));
  }

  if (typeof value === 'object') {
    if (seen.has(value)) return '[Circular]';
    seen.add(value);

    // Prefer toJSON when provided
    const maybeToJson = (value as { toJSON?: () => unknown }).toJSON;
    if (typeof maybeToJson === 'function') {
      try {
        return sanitizeValue(maybeToJson.call(value), depth + 1, seen);
      } catch {
        return '[UnserializableToJSON]';
      }
    }

    const record: Record<string, unknown> = isPlainObject(value)
      ? value
      : (value as Record<string, unknown>);

    const out: { [key: string]: JsonSafe } = {};
    for (const [k, v] of Object.entries(record)) {
      out[k] = sanitizeValue(v, depth + 1, seen);
    }
    return out;
  }

  return '[Unserializable]';
}

export function sanitizeLogContext(context: Record<string, unknown>): { [key: string]: JsonSafe } {
  return sanitizeValue(context, 0, new WeakSet()) as { [key: string]: JsonSafe };
}
