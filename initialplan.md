# Phase 1: Hardware Redirection & Protocol Parsing

## 1. Hardware Redirection (Device Configuration)
To route the ST-904L's data to the custom server, send the following SMS command to the tracker's Banglalink number.
*   **Command:** `8040000 [ORACLE_VPS_IP] [PORT]`
*   **Verification:** Wait for the `SET OK` reply.

## 2. TCP Server Architecture (Node.js)
Since the device maintains a persistent socket connection, a raw TCP server using the native Node.js `net` module is required to handle the data stream.
*   **Port Binding:** Listen on the specific port defined in the SMS command.
*   **Stream Buffering:** TCP packets can fragment over cellular networks. The server must buffer incoming `data` events and only process a string once the `#` terminator is received.
*   **Connection Lifecycle:** Handle `error`, `timeout`, and `close` events gracefully to prevent memory leaks when the tracker enters sleep mode or loses signal.

## 3. Protocol Parsing Engine (Tianqin Protocol)
The parser must split the incoming ASCII string by commas `,`. 
*   **Command Header:** Always starts with `*XX` (where XX is the manufacturer code, e.g., `*HQ`).
*   **Device ID:** The 10-digit serial number (`7026318172`) is the second element.
*   **Data Type:** The third element determines the parsing logic (e.g., `V6`, `V8`).

### Case A: V6 Packets (Boot/Restart)
Sent once when the device powers on or reboots.
*   **Format:** `*XX,YYYYYYYYYY,V6,HHMMSS,A,latitude,N,longitude,E,speed,direction,DDMMYY,vehicle_status,net_mcc,net_mnc,net_lac,net_cellid,ICCID#`
*   **Actionable Extraction:** Capture the `ICCID` (element 17) to link the physical SIM card to the device ID in PostgreSQL. 

### Case B: V8 Packets (Primary Telemetry) - *UPDATED WITH WIFI FIELDS*
The continuous data stream containing GPS and hardware status. This format accounts for the 6 WiFi data points that prevent index shifting.
*   **Format:** `*XX,YYYYYYYYYY,V8,HHMMSS,A,latitude,N,longitude,E,speed,direction,DDMMYY,vehicle_status,net_mcc,net_mnc,net_lac,net_cellid,wifi_mac_1,wifi_rssi_1,wifi_mac_2,wifi_rssi_2,wifi_mac_3,wifi_rssi_3,satellite_signal,network_signal,voltage,bat#`
*   **Actionable Extraction:**
    *   **Validity:** Element 4 must be `A` (Active GPS). If `V` (Void), the coordinates are invalid and should not update the live tracking map.
    *   **Battery:** Element 26 (`bat`) provides the battery percentage for low-power alerts.
    *   **Status Flags:** Element 12 (`vehicle_status`) is a 4-byte hexadecimal string. It must be parsed to binary to extract alarm states (e.g., SOS button presses, displacement).

### Case C: Coordinate Normalization (Crucial for PostGIS)
The tracker sends coordinates in Degrees-Minutes (`DDFF.FFFF` for latitude, `DDDFF.FFFF` for longitude). The parser must convert these to standard Decimal Degrees for mapping APIs and PostGIS.
*   **Latitude Calculation:** Extract `DD` and `FF.FFFF`. Formula: `DD + (FF.FFFF / 60)`. Multiply by `-1` if the hemisphere indicator is `S`.
*   **Longitude Calculation:** Extract `DDD` and `FF.FFFF`. Formula: `DDD + (FF.FFFF / 60)`. Multiply by `-1` if the hemisphere indicator is `W`.
*   **Speed Conversion:** Sent in knots. Multiply by `1.852` to convert to km/h for the UI.

## 4. Server Acknowledgment (R12)
To prevent the tracker from continuously resending the same data packet, the Node.js TCP server must write an acknowledgment back to the socket.
*   **Trigger:** Execute immediately upon successfully parsing any V6 or V8 packet.
*   **Format:** `*HQ,[DEVICE_ID],R12,[HHMMSS]#`
*   **Time Constraint:** The `HHMMSS` string must be generated dynamically using the server's current UTC time.

## 5. System Integration Handoff
Once normalized, the parser should encapsulate the data into a JSON object:
1.  **Redis:** Emit the JSON over a local Redis Pub/Sub channel for the WebSocket server to broadcast to the child protection mobile app.
2.  **PostgreSQL:** Push the JSON to a worker queue to be bulk-inserted into PostgreSQL and evaluated for Geofence/SOS alerts.