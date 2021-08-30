// https://gist.github.com/karol-majewski/b234a4aceb8884ccc1acf25a2e1ed16e#file-fromentries-with-literal-types-ts

type Option<K extends PropertyKey, V> = { name: K; value: V; type: number };

type UnionToIntersection<Union> = (
  Union extends unknown ? (argument: Union) => void : never
) extends (argument: infer Intersection) => void
  ? Intersection
  : never;

type FromEntries<
  T extends Option<K, V>,
  K extends PropertyKey,
  V extends unknown
> = UnionToIntersection<
  T extends { name: infer Key; value: infer Value; type: number }
    ? Key extends PropertyKey
      ? Record<Key, Value | undefined>
      : never
    : never
>;

export const optionArrayToObject = <
  T extends Option<K, V>,
  K extends PropertyKey,
  V extends unknown
>(
  options: T[]
): FromEntries<T, K, V> => {
  const optMap = {} as FromEntries<T, K, V>;
  for (const { name, value } of options) {
    // deno-lint-ignore no-explicit-any
    (optMap as any)[name] = value;
  }
  return optMap;
};
