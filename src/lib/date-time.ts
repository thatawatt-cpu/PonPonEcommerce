const EXPLICIT_TIME_ZONE_PATTERN = /(z|[+-]\d{2}:?\d{2})$/i;

function hasExplicitTimeZone(value: string): boolean {
  return EXPLICIT_TIME_ZONE_PATTERN.test(value.trim());
}

export function parseApiDate(
  value: string,
  options: { utc?: boolean } = {}
): Date {
  const trimmed = value.trim();
  const normalized =
    options.utc && !hasExplicitTimeZone(trimmed) ? `${trimmed}Z` : trimmed;

  return new Date(normalized);
}

export function parseApiTime(
  value: string,
  options: { utc?: boolean } = {}
): number {
  const time = parseApiDate(value, options).getTime();
  return Number.isFinite(time) ? time : Number.NaN;
}
