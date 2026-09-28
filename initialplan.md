# Phase 1: Hardware Redirection & Protocol Parsing

## 1. Hardware Redirection (Device Configuration)
To route the ST-904L's data to the custom server, send the following SMS command to the tracker's Banglalink number.
*   **Command:** `8040000 [ORACLE_VPS_IP] [PORT]`
*   **Verification:** Wait for the `SET OK` reply.

## 2. TCP Server Architecture (Node.js / TypeScript)
Since the device maintains a persistent socket connection, a raw TCP server using the native Node.js `net` module is required.

### Core Connection Requirements
*   **Port Binding:** Listen on the specific port defined in the SMS command.
*   **Stream Buffering:** TCP packets can fragment over cellular networks. The server must buffer incoming `data` events and only process a string once the `#` terminator is received[cite: 2].
*   **Connection Lifecycle:** Handle `error`, `timeout`, and `close` events gracefully to prevent memory leaks when the tracker enters sleep mode or loses signal.

## 3. Protocol Parsing Engine (Tianqin Protocol)
The parser must split the incoming ASCII string by commas `,`[cite: 2]. 
*   **Command Header:** Always starts with `*XX` (where XX is the manufacturer code, e.g., `*HQ`)[cite: 2].
*   **Device ID:** The 10-digit serial number (`7026318172`) is the second element[cite: 2].
*   **Data Type:** The third element determines the parsing logic (e.g., `V6`, `V8`)[cite: 2].

### Case A: V6 Packets (Boot/Restart)
Sent once when the device powers on or reboots[cite: 2].
*   **Format:** `*XX,YYYYYYYYYY,V6,HHMMSS,A,latitude,N,longitude,E,speed,direction,DDMMYY,vehicle_status,net_mcc,net_mnc,net_lac,net_cellid,ICCID#`[cite: 2]
*   **Actionable Extraction:** Capture the `ICCID` (element 17) to link the physical SIM card to the device ID in the PostgreSQL database[cite: 2]. 

### Case B: V8 Packets (Primary Telemetry)
The continuous data stream containing GPS and hardware status[cite: 2].
*   **Format:** `*XX,YYYYYYYYYY,V8,HHMMSS,A,latitude,N,longitude,E,speed,direction,DDMMYY,vehicle_status,net_mcc,net_mnc,net_lac,net_cellid,satellite_signal,network_signal,voltage,bat#`[cite: 2]
*   **Actionable Extraction:**
    *   **Validity:** Element 4 must be `A` (Active GPS). If `V` (Void), the coordinates are invalid and should not update the live tracking map[cite: 2].
    *   **Battery:** Element 20 (`bat`) provides the battery percentage for low-power alerts[cite: 2].
    *   **Status Flags:** Element 12 (`vehicle_status`) is a 4-byte hexadecimal string[cite: 2]. It must be parsed to binary to extract alarm states (e.g., SOS button presses, low battery, displacement)[cite: 2].

### Case C: Coordinate Normalization (Crucial for PostGIS)
The tracker sends coordinates in Degrees-Minutes (`DDFF.FFFF` for latitude, `DDDFF.FFFF` for longitude)[cite: 2]. The parser must convert these to standard Decimal Degrees for mapping APIs and PostGIS.
*   **Latitude Calculation:** Extract `DD` and `FF.FFFF`. Formula: `DD + (FF.FFFF / 60)`[cite: 2]. Multiply by `-1` if the hemisphere indicator is `S`[cite: 2].
*   **Longitude Calculation:** Extract `DDD` and `FF.FFFF`. Formula: `DDD + (FF.FFFF / 60)`[cite: 2]. Multiply by `-1` if the hemisphere indicator is `W`[cite: 2].
*   **Speed Conversion:** Sent in knots[cite: 2]. Multiply by `1.852` to convert to km/h for the mobile app UI[cite: 2].

## 4. Server Acknowledgment (R12)
To prevent the tracker from continuously resending the same data packet, the TCP server must write an acknowledgment back to the socket[cite: 2].
*   **Trigger:** Execute immediately upon successfully parsing any V6 or V8 packet.
*   **Format:** `*HQ,[DEVICE_ID],R12,[HHMMSS]#`[cite: 2]
*   **Time Constraint:** The `HHMMSS` string must be generated dynamically using the server's current UTC time[cite: 2].

## 5. System Integration Handoff
Once normalized, the parser should encapsulate the data into a JSON object:
1.  Emit the JSON over a local Redis Pub/Sub channel for the WebSocket server (Live Tracking).
2.  Push the JSON to a worker queue to be bulk-inserted into PostgreSQL and evaluated for Geofence/SOS alerts.