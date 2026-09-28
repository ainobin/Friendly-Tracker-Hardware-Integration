/**
 * ST-904L Tracker TCP Server
 * Listens for raw TCP connections from the SinoTrack ST-904L GPS tracker.
 * Parses Tianqin Protocol V6/V8 packets, sends R12 ack,
 * publishes to Redis and queues for PostgreSQL.
 */

import net from "net";
import { config } from "dotenv";
import { parsePacket } from "./parser.js";
import { sendAck } from "./ack.js";

config();

const PORT = parseInt(process.env.TRACKER_PORT || "5000", 10);
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

// Lazy-load Redis/PG so the server starts even without them
let redis: any = null;
let pgPool: any = null;

async function initRedis() {
  try {
    const { Redis } = await import("ioredis");
    redis = new Redis(REDIS_URL);
    redis.on("error", (err: Error) => console.error("Redis error:", err.message));
    redis.on("connect", () => console.log("Redis connected"));
    console.log("Redis initialized");
  } catch (err) {
    console.warn("Redis not available, publishing disabled:", (err as Error).message);
  }
}

async function initPostgres() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.warn("DATABASE_URL not set, PostgreSQL disabled");
    return;
  }
  try {
    const { Pool } = await import("pg");
    pgPool = new Pool({ connectionString: dbUrl });
    await pgPool.query("SELECT 1");
    console.log("PostgreSQL connected");
  } catch (err) {
    console.warn("PostgreSQL not available:", (err as Error).message);
    pgPool = null;
  }
}

async function publishPosition(packet: any) {
  if (!redis) return;
  try {
    await redis.publish("tracker:positions", JSON.stringify(packet));
  } catch (err) {
    console.error("Redis publish error:", (err as Error).message);
  }
}

async function insertPosition(packet: any) {
  if (!pgPool) return;
  try {
    // Ensure device row exists first (V6 only arrives on boot, but V8 comes
    // continuously and tracker_positions has an FK to devices)
    await pgPool.query(
      `INSERT INTO devices (device_id, iccid)
       VALUES ($1, $2)
       ON CONFLICT (device_id) DO UPDATE
         SET iccid = COALESCE(EXCLUDED.iccid, devices.iccid),
             updated_at = now()`,
      [packet.device_id, "iccid" in packet ? packet.iccid : null]
    );

    await pgPool.query(
      `INSERT INTO tracker_positions
        (device_id, timestamp, gps_valid, latitude, longitude, speed_kmh,
         heading, battery_pct, voltage_v, satellites, signal_csq,
         mcc, mnc, lac, cellid, alarms, raw_status, raw_packet)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
       ON CONFLICT (device_id, timestamp) DO NOTHING`,
      [
        packet.device_id,
        packet.timestamp,
        packet.gps_valid,
        packet.latitude,
        packet.longitude,
        packet.speed_kmh,
        packet.heading,
        "battery_pct" in packet ? packet.battery_pct : null,
        "voltage_v" in packet ? packet.voltage_v : null,
        "satellite_signal" in packet ? packet.satellite_signal : null,
        "network_signal" in packet ? packet.network_signal : null,
        packet.net_mcc,
        packet.net_mnc,
        packet.net_lac,
        packet.net_cellid,
        JSON.stringify(packet.alarms),
        packet.vehicle_status_raw,
        packet.raw,
      ]
    );
  } catch (err) {
    console.error("PostgreSQL insert error:", (err as Error).message);
  }
}

function handlePacket(raw: string, socket: net.Socket) {
  const trimmed = raw.trim();
  if (!trimmed.startsWith("*")) {
    console.warn("Ignoring non-packet data:", trimmed.slice(0, 60));
    return;
  }

  const packet = parsePacket(trimmed);
  if (!packet) {
    console.error("Failed to parse:", trimmed.slice(0, 80));
    return;
  }

  const { device_id, data_type, latitude, longitude, speed_kmh, alarms } = packet;
  const batteryPct = "battery_pct" in packet ? packet.battery_pct : null;

  // Log with key info
  const coords =
    latitude !== null && longitude !== null
      ? `${latitude.toFixed(6)},${longitude.toFixed(6)}`
      : "no-fix";

  const activeAlarms = Object.entries(alarms)
    .filter(([, v]) => v)
    .map(([k]) => k);

  console.log(
    `[${data_type}] ${device_id} | ${coords} | ${speed_kmh.toFixed(1)}km/h | bat:${batteryPct ?? "N/A"}%` +
      (activeAlarms.length ? ` | ALARMS: ${activeAlarms.join(",")}` : "")
  );

  // Send R12 ack (NEW-EN line 151)
  sendAck(socket, device_id);

  // Publish to Redis for live tracking
  publishPosition(packet);

  // Insert into PostgreSQL
  insertPosition(packet);
}

// --- TCP Server ---

const server = net.createServer((socket) => {
  const clientAddr = `${socket.remoteAddress}:${socket.remotePort}`;
  console.log(`Connection from ${clientAddr}`);

  let buffer = "";

  socket.on("data", (chunk) => {
    buffer += chunk.toString();

    // Process complete packets (terminated by #)
    let hashIndex: number;
    while ((hashIndex = buffer.indexOf("#")) !== -1) {
      const packet = buffer.slice(0, hashIndex + 1);
      buffer = buffer.slice(hashIndex + 1);
      handlePacket(packet, socket);
    }
  });

  socket.on("error", (err) => {
    console.error(`Socket error [${clientAddr}]:`, err.message);
  });

  socket.on("close", () => {
    console.log(`Connection closed [${clientAddr}]`);
  });

  socket.setTimeout(300_000); // 5 minutes
  socket.on("timeout", () => {
    console.log(`Socket timeout [${clientAddr}], destroying`);
    socket.destroy();
  });
});

server.on("error", (err) => {
  console.error("Server error:", err);
  process.exit(1);
});

// --- Start ---

async function main() {
  console.log("=== ST-904L Tracker Server ===");
  console.log(`Protocol: Tianqin (NEW-EN)`);
  console.log(`V8 WiFi fields: enabled (27 elements)`);

  await initRedis();
  await initPostgres();

  server.listen(PORT, () => {
    console.log(`TCP server listening on port ${PORT}`);
    console.log(`Waiting for tracker connections...`);
  });
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
