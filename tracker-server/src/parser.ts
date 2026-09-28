/**
 * Packet parser for Tianqin Protocol V6 and V8 packets.
 * Source: SinoTrack Protocol NEW-EN.md
 *
 * V6 (line 3):   *XX,ID,V6,HHMMSS,A,Lat,N,Lon,E,Speed,Dir,Date,Status,MCC,MNC,LAC,CellID,ICCID#
 * V8 (field table lines 58–118):
 *   *XX,ID,V8,HHMMSS,A,Lat,N,Lon,E,Speed,Dir,Date,Status,MCC,MNC,LAC,CellID,
 *   BSSID1,RSSI1,BSSID2,RSSI2,BSSID3,RSSI3,SatSig,NetSig,Voltage,Bat#
 */

import {
  convertLatitude,
  convertLongitude,
  knotsToKmh,
  buildUTCDateTime,
} from "./coordinates.js";
import { parseVehicleStatus, type VehicleAlarms } from "./vehicle-status.js";

// --- Packet type definitions ---

export interface CommonFields {
  manufacturer: string;
  device_id: string;
  data_type: "V6" | "V8";
  time_utc: string;
  gps_valid: boolean;
  latitude: number | null;
  longitude: number | null;
  speed_kmh: number;
  heading: number;
  date: string;
  vehicle_status_raw: string;
  alarms: VehicleAlarms;
  timestamp: string;
  raw: string;
}

export interface V6Packet extends CommonFields {
  data_type: "V6";
  net_mcc: string;
  net_mnc: string;
  net_lac: string;
  net_cellid: string;
  iccid: string;
}

export interface V8Packet extends CommonFields {
  data_type: "V8";
  net_mcc: string;
  net_mnc: string;
  net_lac: string;
  net_cellid: string;
  satellite_signal: number;
  network_signal: number;
  voltage_v: number;
  battery_pct: number;
  /**
   * True when the device includes the optional 3x BSSID/RSSI WiFi block
   * (27-element form, NEW-EN field table lines 99–110).
   * False when firmware omits it (21-element form, NEW-EN summary lines 52–54).
   */
  has_wifi: boolean;
  bssid_1?: string;
  rssi_1?: string;
  bssid_2?: string;
  rssi_2?: string;
  bssid_3?: string;
  rssi_3?: string;
}

export type TrackerPacket = V6Packet | V8Packet;

/**
 * Parse raw TCP data into a structured packet.
 * @param raw  Raw string including * prefix and # suffix
 * @returns Parsed packet or null if invalid
 */
export function parsePacket(raw: string): TrackerPacket | null {
  // Strip * prefix and # suffix
  const cleaned = raw.replace(/^\*/, "").replace(/#$/, "");
  const elements = cleaned.split(",");

  // Minimum: common fields (13) + at least 1 more = 14
  if (elements.length < 14) {
    console.error("Packet too short:", elements.length, "elements");
    return null;
  }

  const manufacturer = elements[0];
  const deviceId = elements[1];
  const dataType = elements[2] as "V6" | "V8";
  const timeRaw = elements[3];
  const gpsValid = elements[4] === "A";
  const latRaw = elements[5];
  const latDir = elements[6];
  const lonRaw = elements[7];
  const lonDir = elements[8];
  const speedKnots = parseFloat(elements[9]) || 0;
  const heading = parseInt(elements[10], 10) || 0;
  const dateRaw = elements[11];
  const statusRaw = elements[12];

  // Common parsed fields
  const lat = gpsValid ? convertLatitude(latRaw, latDir) : null;
  const lon = gpsValid ? convertLongitude(lonRaw, lonDir) : null;
  const common: CommonFields = {
    manufacturer,
    device_id: deviceId,
    data_type: dataType,
    time_utc: timeRaw,
    gps_valid: gpsValid,
    latitude: lat,
    longitude: lon,
    speed_kmh: knotsToKmh(speedKnots),
    heading,
    date: dateRaw,
    vehicle_status_raw: statusRaw,
    alarms: parseVehicleStatus(statusRaw),
    timestamp: buildUTCDateTime(dateRaw, timeRaw),
    raw,
  };

  if (dataType === "V6") {
    return parseV6(elements, common);
  } else if (dataType === "V8") {
    return parseV8(elements, common);
  }

  console.error("Unknown data type:", dataType);
  return null;
}

function parseV6(el: string[], common: CommonFields): V6Packet | null {
  // V6 needs 18 elements (index 0–17)
  if (el.length < 18) {
    console.error("V6 packet too short:", el.length, "elements (need 18)");
    return null;
  }

  return {
    ...common,
    data_type: "V6",
    net_mcc: el[13],
    net_mnc: el[14],
    net_lac: el[15],
    net_cellid: el[16],
    iccid: el[17],
  };
}

/**
 * V8 arrives in two shapes depending on firmware/runtime conditions:
 *
 *  21 elements — NEW-EN summary format (lines 52–54), no WiFi block:
 *      0..16 common+net, 17 sat, 18 signal, 19 voltage, 20 bat
 *
 *  27 elements — NEW-EN field table (lines 99–110), with 3x BSSID/RSSI:
 *      0..16 common+net, 17..22 wifi, 23 sat, 24 signal, 25 voltage, 26 bat
 *
 * Observed from the physical device: both forms occur (Banglalink,
 * 116.58.201.79 / 103.197.154.12). Detect by content, not by assuming.
 */
function isMacLike(v: string | undefined): boolean {
  return typeof v === "string" && /^(0x)?[0-9a-fA-F]{12}$/.test(v);
}

/** 121 * 0.1 is 12.100000000000001 in IEEE754 — round before storing. */
function parseVoltage(v: string | undefined): number {
  const n = parseInt(v ?? "", 10);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 0.1 * 10) / 10;
}

function parseV8(el: string[], common: CommonFields): V8Packet | null {
  if (el.length < 21) {
    console.error("V8 packet too short:", el.length, "elements (need 21)");
    return null;
  }

  const base = {
    ...common,
    data_type: "V8" as const,
    net_mcc: el[13],
    net_mnc: el[14],
    net_lac: el[15],
    net_cellid: el[16],
  };

  const hasWifi =
    el.length >= 27 && isMacLike(el[17]) && isMacLike(el[19]) && isMacLike(el[21]);

  if (hasWifi) {
    return {
      ...base,
      has_wifi: true,
      bssid_1: el[17],
      rssi_1: el[18],
      bssid_2: el[19],
      rssi_2: el[20],
      bssid_3: el[21],
      rssi_3: el[22],
      satellite_signal: parseInt(el[23], 10) || 0,
      network_signal: parseInt(el[24], 10) || 0,
      voltage_v: parseVoltage(el[25]),
      battery_pct: parseInt(el[26], 10) || 0,
    };
  }

  if (el.length >= 27) {
    // Long enough for WiFi but index 17 isn't a MAC — log it, still parse
    // with the compact layout so telemetry is not lost.
    console.warn(
      `V8: ${el.length} elements but el[17]=${el[17]} is not a BSSID; using compact layout`
    );
  }

  return {
    ...base,
    has_wifi: false,
    satellite_signal: parseInt(el[17], 10) || 0,
    network_signal: parseInt(el[18], 10) || 0,
    voltage_v: parseVoltage(el[19]),
    battery_pct: parseInt(el[20], 10) || 0,
  };
}
