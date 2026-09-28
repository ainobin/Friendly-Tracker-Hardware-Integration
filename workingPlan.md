# Working Plan: ST-904L Hardware Integration

> Source of truth: `SinoTrack Protocol NEW-EN.md` (NEW-EN) for protocol parsing.
> `ST-904(L) User Manual 246.md` (User Manual) for SMS device setup.
> All element indices verified by manual comma-count against the doc field tables.

---

## Step 1: Device Configuration (SMS)

### 1a. Set APN (User Manual Step 3)

Send from another phone to the tracker's SIM number:

```
8030000 <APN>
```

If APN has username/password:

```
8030000 <APN> <USERNAME> <PASSWORD>
```

Wait for `SET OK` reply.

### 1b. Set GPRS Mode (User Manual Step 4)

```
7100000
```

Wait for `SET OK`. Both blue and orange lights should stay ON.

### 1c. Redirect Data to Custom Server

```
8040000 <SERVER_IP> <PORT>
```

Wait for `SET OK` reply.

> **Note:** This command is referenced in the plan but not explicitly listed in the
> User Manual's command table. The device does support IP/port config (shown in
> `RCONF` output: `IP:45.112.204.242:8090`). Verify with the actual device. If
> `8040000` does not work, check the `RCONF` command output or contact SinoTrack
> support for the correct IP/port set command.

### 1d. Verify Configuration

```
RCONF
```

Expected reply contains: `ID:<device_id>`, `IP:<your_ip>:<port>`, `APN:<your_apn>`.

---

## Step 2: TCP Server (Node.js)

The device opens a persistent TCP socket to the configured IP:PORT.

### 2a. Server Setup

```typescript
import net from "net";

const server = net.createServer((socket) => {
  let buffer = "";

  socket.on("data", (chunk) => {
    buffer += chunk.toString();

    // Process complete packets (terminated by #)
    let hashIndex;
    while ((hashIndex = buffer.indexOf("#")) !== -1) {
      const packet = buffer.slice(0, hashIndex + 1);
      buffer = buffer.slice(hashIndex + 1);
      handlePacket(packet, socket);
    }
  });

  socket.on("error", (err) => console.error("Socket error:", err));
  socket.on("close", () => console.log("Connection closed"));
  socket.setTimeout(300000); // 5 min timeout
  socket.on("timeout", () => socket.destroy());
});

server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
```

### 2b. Critical Requirements (from docs)

- **Terminator:** Every packet ends with `#`. Buffer until `#` is received. (NEW-EN line 48, 118)
- **Fragmentation:** TCP packets fragment over cellular. Must buffer across `data` events. (NEW-EN line 11)
- **Connection lifecycle:** Handle `error`, `timeout`, `close` to prevent memory leaks when tracker sleeps or loses signal. (User Manual: MOVE mode puts device to sleep when stopped)
- **Half-width:** All characters in commands/packets are half-width ASCII. (NEW-EN line 5)

---

## Step 3: Packet Parser

Split incoming string by `,` after stripping the leading `*` and trailing `#`.

```
raw: *HQ,7026318172,V8,123456,A,2235.0086,N,11354.3668,E,014.28,028,160716,FFFFBBFF,460,00,10342,3721,AA,BB,CC,DD,EE,FF,12,31,122,85#
strip * and #: HQ,7026318172,V8,123456,A,2235.0086,N,11354.3668,E,014.28,028,160716,FFFFBBFF,460,00,10342,3721,AA,BB,CC,DD,EE,FF,12,31,122,85
split by ,: elements[0..24]
```

### 3a. Common Fields (both V6 and V8)

| Index | Field | Example | Description |
|-------|-------|---------|-------------|
| 0 | manufacturer | `HQ` | 2-char manufacturer code (NEW-EN line 10) |
| 1 | device_id | `7026318172` | 10-digit serial number (NEW-EN line 12) |
| 2 | data_type | `V8` | Packet type: `V6` or `V8` (NEW-EN lines 14, 65) |
| 3 | time | `123456` | HHMMSS in UTC (NEW-EN line 16/67) |
| 4 | gps_valid | `A` | `A`=valid, `V`=invalid (NEW-EN line 18/69) |
| 5 | latitude | `2235.0086` | DDFF.FFFF format (NEW-EN line 20/71) |
| 6 | lat_dir | `N` | N=North, S=South (NEW-EN line 22/73) |
| 7 | longitude | `11354.3668` | DDDFF.FFFF format (NEW-EN line 24/75) |
| 8 | lon_dir | `E` | E=East, W=West (NEW-EN line 26/77) |
| 9 | speed | `014.28` | Knots, 000.00-999.99 (NEW-EN line 28/79) |
| 10 | direction | `028` | Degrees 000-359, true north (NEW-EN line 30/81) |
| 11 | date | `160716` | DDMMYY (NEW-EN line 32/83) |
| 12 | vehicle_status | `FFFFBBFF` | 8-char hex (4 bytes), negative logic (NEW-EN line 34/85) |

### 3b. V6 Packet — Full Format (NEW-EN line 3)

```
*XX,YYYYYYYYYY,V6,HHMMSS,A,latitude,N,longitude,E,speed,direction,DDMMYY,
vehicle_status,net_mcc,net_mnc,net_lac,net_cellid,ICCID#
```

| Index | Field | Example | Description |
|-------|-------|---------|-------------|
| 0–12 | (common) | — | See 3a above |
| 13 | net_mcc | `460` | Mobile Country Code (NEW-EN line 38) |
| 14 | net_mnc | `00` | Mobile Network Code (NEW-EN line 41) |
| 15 | net_lac | `10342` | Base Station Area Code (NEW-EN line 43) |
| 16 | net_cellid | `3721` | Base Station Code (NEW-EN line 45) |
| 17 | iccid | `...` | SIM card ICCID (NEW-EN line 47) |

**V6 total: 18 elements (index 0–17)**

**When sent:** Once on device power-on or reboot. (NEW-EN line 124)

### 3c. V8 Packet — Full Format (NEW-EN field table, lines 58–118)

> The V8 summary format (NEW-EN lines 52–54) omits WiFi fields. The detailed field
> table (lines 99–110) includes 3x BSSID + 3x RSSI between net_cellid and
> satellite_signal. The field table is authoritative.

```
*XX,YYYYYYYYYY,V8,HHMMSS,A,latitude,N,longitude,E,speed,direction,DDMMYY,
vehicle_status,net_mcc,net_mnc,net_lac,net_cellid,
bssid,rssi,BSSID,RSSI,BSSID,RSSI,
satellite_signal,network_signal,voltage,bat#
```

| Index | Field | Example | Description |
|-------|-------|---------|-------------|
| 0–12 | (common) | — | See 3a above |
| 13 | net_mcc | `460` | Mobile Country Code (NEW-EN line 91) |
| 14 | net_mnc | `00` | Mobile Network Code (NEW-EN line 94) |
| 15 | net_lac | `10342` | Base Station Area Code (NEW-EN line 96) |
| 16 | net_cellid | `3721` | Base Station Code (NEW-EN line 98) |
| 17 | bssid_1 | `d076e794d03c` | WiFi MAC #1 (NEW-EN line 99) |
| 18 | rssi_1 | `3a` | WiFi signal #1 (NEW-EN line 101) |
| 19 | bssid_2 | `d076e794d03c` | WiFi MAC #2 (NEW-EN line 103) |
| 20 | rssi_2 | `3a` | WiFi signal #2 (NEW-EN line 105) |
| 21 | bssid_3 | `d076e794d03c` | WiFi MAC #3 (NEW-EN line 107) |
| 22 | rssi_3 | `3a` | WiFi signal #3 (NEW-EN line 109) |
| 23 | satellite_signal | `12` | Number of GPS satellites (NEW-EN line 111) |
| 24 | network_signal | `31` | CSQ 0–31 (NEW-EN line 113) |
| 25 | voltage | `122` | 0.1V unit: 122 = 12.2V (NEW-EN line 115) |
| 26 | bat | `85` | Battery percentage 0–100% (NEW-EN line 117) |

**V8 total: 27 elements (index 0–26)**

**When sent:** Continuously at the configured upload interval. (NEW-EN line 122)

---

## Step 4: Coordinate Conversion (NEW-EN lines 20–28, 71–79)

Tracker sends Degrees-Minutes. Convert to Decimal Degrees for PostGIS/mapping.

### Latitude

Input: `DDFF.FFFF` (e.g., `2235.0086`)

```
DD = 22  (first 2 chars)
FF.FFFF = 35.0086  (remaining chars)
decimal_degrees = DD + (FF.FFFF / 60)
if lat_dir == 'S': decimal_degrees *= -1
```

### Longitude

Input: `DDDFF.FFFF` (e.g., `11354.3668`)

```
DDD = 113  (first 3 chars)
FF.FFFF = 54.3668  (remaining chars)
decimal_degrees = DDD + (FF.FFFF / 60)
if lon_dir == 'W': decimal_degrees *= -1
```

### Speed Conversion

Input: knots (e.g., `014.28`)

```
kmh = speed_knots * 1.852
```

(NEW-EN line 28: "1 knot = 1 nautical mile per hour = 1.852 kilometers per hour")

### Date Conversion

Input: `DDMMYY` (e.g., `160716`)

```
day = 16, month = 07, year = 2016
```

---

## Step 5: Vehicle Status Parsing (NEW-EN Appendix 1, lines 135–147)

`vehicle_status` is an 8-char hex string = 4 bytes. Negative logic: **bit=0 means active**.

### Byte Breakdown

| Byte | Bit 7 | Bit 6 | Bit 5 | Bit 4 | Bit 3 | Bit 2 | Bit 1 | Bit 0 |
|------|-------|-------|-------|-------|-------|-------|-------|-------|
| 1st (byte[0:2]) | Reserved (1) | Reserved (1) | Reserved (1) | Reserved (1) | Reserve (1) | Data Update (0) | Displacement Alarm (0) | Reserved (1) |
| 2nd (byte[2:4]) | Reserved (1) | Reserved (1) | Reserved (1) | Reserved (1) | Reserved (1) | Hold (1) | Vibration Alarm (0) | Reserved (1) |
| 3rd (byte[4:6]) | No Need (1) | Reserve (1) | Reserved (1) | Reserved (1) | Reserved (1) | ACC Off (0) | Armed (0) | Reserved (0) |
| 4th (byte[6:8]) | Reserved (1) | Low Battery (0) | Low Battery (0) | Reserved (1) | Reserved (1) | Speeding (0) | Emergency/SOS (0) | Reserved (1) |

### Active Alarms (bit=0 triggers)

| Byte | Bit | Name | NEW-EN Reference |
|------|-----|------|------------------|
| 1st | 1 | Displacement Alarm | line 141 |
| 2nd | 1 | Vibration Alarm | line 141 |
| 3rd | 1 | Armed status | line 141 |
| 3rd | 2 | ACC Off | line 142 |
| 4th | 1 | Emergency Alarm (SOS) | line 141 |
| 4th | 2 | Speeding Alert | line 142 |
| 4th | 5 | Low Battery Alert | line 145 |
| 4th | 6 | Low Battery Alert | line 146 |

### Parsing Logic

```typescript
function parseVehicleStatus(hex: string): Record<string, boolean> {
  // hex = "FFFFBBFF" → split into 4 bytes
  const bytes = [
    parseInt(hex.slice(0, 2), 16),  // 1st byte
    parseInt(hex.slice(2, 4), 16),  // 2nd byte
    parseInt(hex.slice(4, 6), 16),  // 3rd byte
    parseInt(hex.slice(6, 8), 16),  // 4th byte
  ];

  // Negative logic: bit=0 means active
  const isBitActive = (byte: number, bit: number) => ((byte >> bit) & 1) === 0;

  return {
    displacement_alarm:  isBitActive(bytes[0], 1),
    data_update:         isBitActive(bytes[0], 2),
    vibration_alarm:     isBitActive(bytes[1], 1),
    armed:               isBitActive(bytes[2], 1),
    acc_off:             isBitActive(bytes[2], 2),
    emergency_sos:       isBitActive(bytes[3], 1),
    speeding:            isBitActive(bytes[3], 2),
    low_battery:         isBitActive(bytes[3], 5) || isBitActive(bytes[3], 6),
  };
}
```

---

## Step 6: Server Acknowledgment — R12 (NEW-EN lines 149–159)

After successfully parsing any V6 or V8 packet, the server MUST send R12 back on the same socket.

### Format

```
*HQ,<DEVICE_ID>,R12,<HHMMSS>#
```

- `DEVICE_ID`: The 10-digit ID from the parsed packet (element 1).
- `HHMMSS`: Current UTC time, generated dynamically by the server.

### Example (NEW-EN line 155)

```
*HQ,8168000005,R12,062108#
```

### Implementation

```typescript
import net from "net";

function sendAck(socket: net.Socket, deviceId: string) {
  const now = new Date();
  const hh = String(now.getUTCHours()).padStart(2, "0");
  const mm = String(now.getUTCMinutes()).padStart(2, "0");
  const ss = String(now.getUTCSeconds()).padStart(2, "0");
  const ack = `*HQ,${deviceId},R12,${hh}${mm}${ss}#`;
  socket.write(ack);
}
```

---

## Step 7: Packet Handler — Full Flow

```typescript
function handlePacket(raw: string, socket: net.Socket) {
  // Strip * prefix and # suffix
  const cleaned = raw.replace(/^\*/, "").replace(/#$/, "");
  const elements = cleaned.split(",");

  const manufacturer = elements[0];  // e.g., "HQ"
  const deviceId     = elements[1];  // e.g., "7026318172"
  const dataType     = elements[2];  // "V6" or "V8"

  if (dataType === "V6") {
    handleV6(elements, socket);
  } else if (dataType === "V8") {
    handleV8(elements, socket);
  }

  // Always send R12 ack after successful parse (NEW-EN line 151)
  sendAck(socket, deviceId);
}
```

### V6 Handler

```typescript
function handleV6(el: string[], socket: net.Socket) {
  const iccid = el[17]; // NEW-EN line 47: ICCID is element 17

  // Link SIM card to device in PostgreSQL
  db.query(
    "INSERT INTO devices (device_id, iccid) VALUES ($1, $2) ON CONFLICT (device_id) DO UPDATE SET iccid = $2",
    [el[1], iccid]
  );

  // Also extract common GPS fields if needed (same indices as V8)
}
```

### V8 Handler

```typescript
function handleV8(el: string[], socket: net.Socket) {
  const gpsValid   = el[4];   // "A" or "V"
  const latRaw     = el[5];   // DDFF.FFFF
  const latDir     = el[6];   // "N" or "S"
  const lonRaw     = el[7];   // DDDFF.FFFF
  const lonDir     = el[8];   // "E" or "W"
  const speedKnots = parseFloat(el[9]);
  const direction  = parseInt(el[10]);
  const date       = el[11];  // DDMMYY
  const time       = el[3];   // HHMMSS
  const status     = el[12];  // 8-char hex
  const mcc        = el[13];
  const mnc        = el[14];
  const lac        = el[15];
  const cellid     = el[16];
  const satSignal  = parseInt(el[23]);
  const netSignal  = parseInt(el[24]);
  const voltageRaw = parseInt(el[25]);
  const battery    = parseInt(el[26]);

  // Only process valid GPS (NEW-EN line 69: A = valid, V = invalid)
  let lat: number | null = null;
  let lon: number | null = null;
  if (gpsValid === "A") {
    lat = convertLatitude(latRaw, latDir);
    lon = convertLongitude(lonRaw, lonDir);
  }

  const kmh = speedKnots * 1.852;       // NEW-EN line 28
  const voltage = voltageRaw * 0.1;      // NEW-EN line 115: "122=12.2V"
  const alarms  = parseVehicleStatus(status);

  const packet = {
    device_id:   el[1],
    timestamp:   buildUTCDateTime(date, time),
    gps_valid:   gpsValid === "A",
    latitude:    lat,
    longitude:   lon,
    speed_kmh:   kmh,
    heading:     direction,
    battery_pct: battery,
    voltage_v:   voltage,
    satellites:  satSignal,
    signal_csq:  netSignal,
    mcc, mnc, lac, cellid,
    alarms,
    raw_status:  status,
  };

  // Publish to Redis for live tracking WebSocket
  redis.publish("tracker:positions", JSON.stringify(packet));

  // Queue for PostgreSQL bulk insert + geofence/SOS evaluation
  queue.push("insert_position", packet);
}
```

---

## Step 8: Output JSON Shape

```json
{
  "device_id": "7026318172",
  "timestamp": "2026-07-16T12:34:56Z",
  "gps_valid": true,
  "latitude": 22.5834767,
  "longitude": 113.9061133,
  "speed_kmh": 26.4016,
  "heading": 28,
  "battery_pct": 85,
  "voltage_v": 12.2,
  "satellites": 12,
  "signal_csq": 31,
  "mcc": "460",
  "mnc": "00",
  "lac": "10342",
  "cellid": "3721",
  "alarms": {
    "displacement_alarm": false,
    "vibration_alarm": false,
    "armed": true,
    "acc_off": false,
    "emergency_sos": false,
    "speeding": false,
    "low_battery": false
  },
  "raw_status": "FFFFBBFF"
}
```

---

## Step 9: Data Pipeline

1. **Redis Pub/Sub** → WebSocket server broadcasts to child protection mobile app.
2. **Worker queue** → Bulk insert into PostgreSQL + evaluate geofence/SOS alerts.

---

## Step 10: Docker Deployment

VPS: `161.118.247.82` — Docker + Nginx reverse proxy + existing web app stack.

### 10a. Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 5000

CMD ["node", "dist/index.js"]
```

> Port 5000 is the default. Change to match what you send via SMS (`8040000`).

### 10b. docker-compose.yml (add service to existing stack)

```yaml
services:
  # --- existing services ---
  webapp:
    image: your-web-app
    ports:
      - "3000:3000"
    # ... existing config

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - webapp

  # --- new tracker service ---
  tracker:
    build: ./tracker-server
    ports:
      - "5000:5000"    # TCP port for ST-904L device
    environment:
      - TRACKER_PORT=5000
      - REDIS_URL=redis://redis:6379
      - DATABASE_URL=postgresql://user:pass@postgres:5432/friendlytracker
    depends_on:
      - redis
      - postgres
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "require('net').createConnection(5000,'127.0.0.1').on('connect',()=>process.exit(0)).on('error',()=>process.exit(1))"]
      interval: 30s
      timeout: 5s
      retries: 3

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: friendlytracker
      POSTGRES_USER: user
      POST Ağust_PASSWORD: pass
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

### 10c. Nginx — Does NOT Handle Tracker TCP

Nginx reverse-proxies HTTP/HTTPS only. The ST-904L opens a **raw TCP** connection — Nginx cannot proxy this.

The tracker port must be exposed **directly** on the VPS:

```
Device → 161.118.247.82:5000 → Docker container tracker:5000
```

Nginx continues to handle your web app on ports 80/443. No Nginx config change needed.

### 10d. Firewall — Open Tracker Port

```bash
# ufw (Ubuntu)
sudo ufw allow 5000/tcp

# or firewalld (CentOS/RHEL)
sudo firewall-cmd --permanent --add-port=5000/tcp
sudo firewall-cmd --reload
```

### 10e. Deploy

```bash
# on VPS
cd /path/to/project
git pull

# rebuild tracker container
docker compose build tracker
docker compose up -d tracker

# verify
docker compose logs -f tracker
```

### 10f. Verify End-to-End

1. Send `RCONF` SMS to tracker → confirm `IP:161.118.247.82:5000`
2. Watch tracker logs: `docker compose logs -f tracker`
3. Should see incoming packets: `*HQ,<device_id>,V8,...`
4. R12 ack sent back: `*HQ,<device_id>,R12,<time>#`

### 10g. Architecture Diagram

```
┌──────────────┐     SMS (8040000)      ┌──────────────┐
│  Your Phone  │ ──────────────────────→ │  ST-904L     │
└──────────────┘                         │  Tracker     │
                                         └──────┬───────┘
                                                │ TCP (port 5000)
                                                │ *HQ,ID,V8,...#
                                                ▼
┌──────────────────────────────────────────────────────────┐
│  VPS: 161.118.247.82                                     │
│                                                          │
│  ┌─────────┐    ┌─────────┐    ┌──────────┐             │
│  │ Nginx   │    │ Tracker │    │ Redis    │             │
│  │ :80/:443│    │ :5000   │───→│ :6379    │             │
│  │ (HTTP)  │    │ (TCP)   │    │ Pub/Sub  │             │
│  └────┬────┘    └────┬────┘    └──────────┘             │
│       │              │                                    │
│  ┌────▼────┐    ┌────▼────┐                              │
│  │ Web App │    │ Postgres│                              │
│  │ :3000   │    │ :5432   │                              │
│  └─────────┘    └─────────┘                              │
└──────────────────────────────────────────────────────────┘
```

---

## Quick Reference: Key Constraints

| Item | Value | Source |
|------|-------|--------|
| Packet terminator | `#` | NEW-EN line 48, 118 |
| GPS valid indicator | `A` = valid, `V` = invalid | NEW-EN line 18, 69 |
| Speed unit | Knots (×1.852 = km/h) | NEW-EN line 28, 79 |
| Voltage unit | 0.1V (122 = 12.2V) | NEW-EN line 115 |
| Battery unit | Percentage 0–100% | NEW-EN line 117 |
| vehicle_status logic | Negative: bit=0 is active | NEW-EN line 34, 85 |
| R12 ack time | UTC HHMMSS, dynamic | NEW-EN line 159 |
| Latitude format | DDFF.FFFF (2-digit DD) | NEW-EN line 20, 71 |
| Longitude format | DDDFF.FFFF (3-digit DDD) | NEW-EN line 24, 75 |
| V6 frequency | Once per power-on/reboot | NEW-EN line 124 |
| V8 frequency | Per configured upload interval | NEW-EN line 122 |
| WiFi fields in V8 | 3x BSSID + 3x RSSI (indices 17–22) | NEW-EN line 99–109 |
