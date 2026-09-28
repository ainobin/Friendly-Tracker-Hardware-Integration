/**
 * Vehicle status parsing for Tianqin Protocol.
 * Source: SinoTrack Protocol NEW-EN.md Appendix 1 (lines 135–147)
 *
 * vehicle_status = 8-char hex string = 4 bytes
 * Negative logic: bit=0 means active/alert triggered.
 */

export interface VehicleAlarms {
  displacement_alarm: boolean;
  data_update: boolean;
  vibration_alarm: boolean;
  armed: boolean;
  acc_off: boolean;
  emergency_sos: boolean;
  speeding: boolean;
  low_battery: boolean;
}

/**
 * Parse the 8-char hex vehicle_status into alarm flags.
 * @param hex  e.g. "FFFFBBFF"
 *
 * Byte mapping (bit=0 is active):
 *   1st byte: bit1=Displacement, bit2=Data Update
 *   2nd byte: bit1=Vibration
 *   3rd byte: bit1=Armed, bit2=ACC Off
 *   4th byte: bit1=Emergency/SOS, bit2=Speeding, bit5=Low Battery, bit6=Low Battery
 */
export function parseVehicleStatus(hex: string): VehicleAlarms {
  const bytes = [
    parseInt(hex.slice(0, 2), 16),
    parseInt(hex.slice(2, 4), 16),
    parseInt(hex.slice(4, 6), 16),
    parseInt(hex.slice(6, 8), 16),
  ];

  const isBitActive = (byte: number, bit: number): boolean =>
    ((byte >> bit) & 1) === 0;

  return {
    displacement_alarm: isBitActive(bytes[0], 1),
    data_update: isBitActive(bytes[0], 2),
    vibration_alarm: isBitActive(bytes[1], 1),
    armed: isBitActive(bytes[2], 1),
    acc_off: isBitActive(bytes[2], 2),
    emergency_sos: isBitActive(bytes[3], 1),
    speeding: isBitActive(bytes[3], 2),
    low_battery: isBitActive(bytes[3], 5) || isBitActive(bytes[3], 6),
  };
}
