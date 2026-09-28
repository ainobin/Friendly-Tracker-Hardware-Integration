/**
 * R12 Acknowledgment builder for Tianqin Protocol.
 * Source: SinoTrack Protocol NEW-EN.md lines 149–159
 *
 * Format: *HQ,<DEVICE_ID>,R12,<HHMMSS>#
 * HHMMSS = current UTC time, generated dynamically.
 */

import net from "net";

/**
 * Send R12 acknowledgment to the tracker socket.
 * Must be called after successfully parsing any V6 or V8 packet.
 */
export function sendAck(socket: net.Socket, deviceId: string): void {
  const now = new Date();
  const hh = String(now.getUTCHours()).padStart(2, "0");
  const mm = String(now.getUTCMinutes()).padStart(2, "0");
  const ss = String(now.getUTCSeconds()).padStart(2, "0");
  const ack = `*HQ,${deviceId},R12,${hh}${mm}${ss}#`;
  socket.write(ack);
}
