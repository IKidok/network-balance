export function groupBy<T>(
  fieldSelector: (arg0: T) => string | number,
  target: T[],
  stackDuplicateKeys = false,
) {
  const stack = (acc: any, key: any, value: any) =>
    !acc[key]
      ? { ...acc, [key]: [value] }
      : { ...acc, [key]: [...acc[key], value] };
  const replace = (acc: any, key: any, value: any) => ({
    ...acc,
    [key]: value,
  });
  const insert = stackDuplicateKeys ? stack : replace;

  return target.reduce<{ [key: string]: T | T[] }>(
    (acc, item) => insert(acc, fieldSelector(item), item),
    {},
  );
}
