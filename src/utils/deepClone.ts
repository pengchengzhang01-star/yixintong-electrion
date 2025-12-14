// Utility for performing a structured deep clone of common JavaScript values.
export function deepClone<T>(value: T): T {
  return _deepClone(value, new WeakMap<object, any>());
}

function _deepClone<T>(value: T, cache: WeakMap<object, any>): T {
  if (value === null || typeof value !== "object") {
    return value;
  }

  if (cache.has(value as object)) {
    return cache.get(value as object);
  }

  if (value instanceof Date) {
    return new Date(value.getTime()) as T;
  }

  if (value instanceof RegExp) {
    const clonedRegExp = new RegExp(value.source, value.flags);
    clonedRegExp.lastIndex = value.lastIndex;
    return clonedRegExp as T;
  }

  if (value instanceof Map) {
    const result = new Map();
    cache.set(value as object, result);
    value.forEach((mapValue, mapKey) => {
      result.set(mapKey, _deepClone(mapValue, cache));
    });
    return result as T;
  }

  if (value instanceof Set) {
    const result = new Set();
    cache.set(value as object, result);
    value.forEach((setValue) => {
      result.add(_deepClone(setValue, cache));
    });
    return result as T;
  }

  if (Array.isArray(value)) {
    const result: unknown[] = [];
    cache.set(value as object, result);
    value.forEach((item, index) => {
      result[index] = _deepClone(item, cache);
    });
    return result as T;
  }

  const proto = Object.getPrototypeOf(value);
  const result = Object.create(proto);
  cache.set(value as object, result);

  const source = value as Record<PropertyKey, unknown>;
  const target = result as Record<PropertyKey, unknown>;

  Object.getOwnPropertyNames(source).forEach((key) => {
    target[key] = _deepClone(source[key], cache);
  });

  Object.getOwnPropertySymbols(source).forEach((symbol) => {
    target[symbol] = _deepClone(source[symbol], cache);
  });

  return result;
}
