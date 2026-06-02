export type RouteSearchParams = Record<string, string | string[] | undefined>;

export function readSearchParam(searchParams: RouteSearchParams, key: string) {
  const value = searchParams[key];
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export function toSearchParamEntries(
  searchParams: RouteSearchParams,
  options?: { omitKeys?: string[] }
) {
  const omit = new Set(options?.omitKeys ?? []);

  return Object.keys(searchParams)
    .filter((key) => !omit.has(key))
    .map((key) => [key, readSearchParam(searchParams, key)] as const)
    .filter((entry): entry is [string, string] => typeof entry[1] === "string" && entry[1].length > 0);
}
