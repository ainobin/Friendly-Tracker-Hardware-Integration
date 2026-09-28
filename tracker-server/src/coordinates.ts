/**
 * Coordinate conversion for Tianqin Protocol.
 * Source: SinoTrack Protocol NEW-EN.md lines 20–28, 71–79
 *
 * Tracker sends Degrees-Minutes format:
 *   Latitude:  DDFF.FFFF  (DD = 00–90, FF.FFFF = 00.0000–59.9999)
 *   Longitude: DDDFF.FFFF (DDD = 000–180, FF.FFFF = 00.0000–59.9999)
 *
 * Converts to Decimal Degrees for PostGIS / mapping APIs.
 */

/**
 * Convert latitude from DDFF.FFFF to decimal degrees.
 * @param raw  e.g. "2235.0086"
 * @param dir  "N" or "S"
 */
export function convertLatitude(raw: string, dir: string): number {
  const dd = parseInt(raw.slice(0, 2), 10);
  const ff = parseFloat(raw.slice(2));
  const dec = dd + ff / 60;
  return dir === "S" ? -dec : dec;
}

/**
 * Convert longitude from DDDFF.FFFF to decimal degrees.
 * @param raw  e.g. "11354.3668"
 * @param dir  "E" or "W"
 */
export function convertLongitude(raw: string, dir: string): number {
  const ddd = parseInt(raw.slice(0, 3), 10);
  const ff = parseFloat(raw.slice(3));
  const dec = ddd + ff / 60;
  return dir === "W" ? -dec : dec;
}

/**
 * Convert speed from knots to km/h.
 * 1 knot = 1.852 km/h  (NEW-EN line 28, 79)
 * Rounded to 2dp — otherwise 14.28 * 1.852 yields 26.446560000000002.
 */
export function knotsToKmh(knots: number): number {
  return Math.round(knots * 1.852 * 100) / 100;
}

/**
 * Parse DDMMYY date string to ISO date.
 * @param date  e.g. "160716" → 2016-07-16
 * @param time  e.g. "123456" → 12:34:56 UTC
 */
export function buildUTCDateTime(date: string, time: string): string {
  const dd = parseInt(date.slice(0, 2), 10);
  const mm = parseInt(date.slice(2, 4), 10);
  const yy = parseInt(date.slice(4, 6), 10);
  const year = 2000 + yy;

  const hh = time.slice(0, 2);
  const mi = time.slice(2, 4);
  const ss = time.slice(4, 6);

  return `${year}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}T${hh}:${mi}:${ss}Z`;
}
