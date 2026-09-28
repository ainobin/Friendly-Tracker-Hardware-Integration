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
  bssid_1: string;
  rssi_1: string;
  bssid_2: string;
  rssi_2: string;
  bssid_3: string;
  rssi_3: string;
  satellite_signal: number;
  network_signal: number;
  voltage_v: number;
  battery_pct: number;
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

function parseV8(el: string[], common: CommonFields): V8Packet | null {
  // V8 needs 27 elements (index 0–26) with WiFi fields
  if (el.length < 27) {
    console.error("V8 packet too short:", el.length, "elements (need 27)");
    return null;
  }

  return {
    ...common,
    data_type: "V8",
    net_mcc: el[13],
    net_mnc: el[14],
    net_lac: el[15],
    net_cellid: el[16],
    bssid_1: el[17],
    rssi_1: el[18],
    bssid_2: el[19],
    rssi_2: el[20],
    bssid_3: el[21],
    rssi_3: el[22],
    satellite_signal: parseInt(el[23], 10) || 0,
    network_signal: parseInt(el[24], 10) || 0,
    voltage_v: (parseInt(el[25], 10) || 0) * 0.1,
    battery_pct: parseInt(el[26], 10) || 0,
  };
}
