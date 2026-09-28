## V6 Data Packet

*XX,YYYYYYYYYY,V6,HHMMSS,A,latitude,N,longitude,E,speed,direction,DDMMYY,vehicle_status,net_mcc,net_mnc ,net_lac,net_cellid,ICCID#

## Command Structure: All characters are half-width

| Data | Number of Data Bits | Description |
| --- | --- | --- |
| * | 1 | Command Header |
| XX | 2 | Manufacturer name, e.g., TH, DC, XY, etc. |
| , | 1 | Delimiter (data delimiter); all commas in the data field serve as the " " delimiter |
| YYYYYYYYYY | 10 | On-board unit serial number (10 digits) |
| , | 1 | Delimiter (data delimiter); all commas within the data field serve as delimiters |
| V6 | 2 | Data Type: V6 (with ICCID; uploaded once each time the device is powered on or restarted) |
| , | 1 | Delimiter (data delimiter): All commas in the data field serve as delimiters |
| HHMMSS | 6 | Time: hours/minutes/seconds. The upload time is in the UTC time zone |
| , | 1 | Delimiter (data delimiter): All commas in the data field are treated as delimiters |
| A | 1 | Valid Data Bits (A/V) A: Indicates that the GPS data is valid positioning data, V: Indicates that the GPS data is an invalid position. |
| , | 1 | Delimiter (Data Delimiter) All commas within the data fields serve as delimiters |
| latitude | 8 | Latitude (degrees and minutes format): DDFF.FFFF (DD degrees, FF.FFFF minutes) DD: Degrees of latitude (00–90) FF.FFFF: Latitude minutes (00.0000–59.9999), rounded to four decimal places |
| , | 1 | Delimiter (data delimiter): All commas within the data field serve as delimiters |
| N | 1 | Latitude indicator (N: North, S: South) |
| , | 1 | Delimiter (data delimiter); all commas in the data field serve as delimiters |
| longitude | 9 | Longitude (degrees-minutes format): DDDFF.FFFF (DDD degrees, FF.FFFF minutes) DDD: Degrees of longitude (000–180) FF.FFFF: Minutes of longitude (00.0000–59.9999), rounded to four decimal places |
| , | 1 | Delimiter (data separator): All commas within the data field serve as delimiters |
| E | 1 | Longitude indicator (E: East Longitude, W: West Longitude) |
| , | 1 | Delimiter (Data Delimiter) All commas in the data field serve as delimiters |
| speed | 6 | Speed, range 000.00–999.99 (unit: knots), rounded to two decimal places. 1 knot = 1 nautical mile per hour = 1.852 kilometers per hour |
| , | 1 | Delimiter (data delimiter): All commas in the data field are treated as delimiters |
| direction | 3 | Azimuth 000–359 degrees, with true north at 0 degrees, 1-degree resolution, clockwise direction |
| , | 1 | Delimiter (data delimiter): All commas within the data field serve as delimiters |
| DDMMYY | 6 | Day/Month/Year |
| , | 1 | Delimiter (data delimiter): All commas in the data field are treated as delimiters |
| vehicle_status | 8 | Vehicle status, consisting of four bytes, indicating the status of the on-board unit components, vehicle components, and alarm status, etc. Hexadecimal values are represented using ASCII characters. The specific meaning of each bit in each byte of this variable is as follows; "bit" indicates negative logic, i.e., bit=0 is active. See Table in Appendix 1 at the end of this document |
| , | 1 | Delimiter (data delimiter): All commas within the data bits serve as delimiters |


| net_mcc | 3 | Mobile Country Code |
| --- | --- | --- |
| , | 1 | Delimiter (data delimiter): All commas in the data field are treated as delimiters |
| net_mnc | 2 | Mobile Network Code |
| , | 1 | Delimiter (data delimiter): All commas in the data field serve as delimiters |
| net_lac | N | Base Station Area Code |
| , | 1 | Delimiter (data delimiter): All commas in the data field serve as delimiters |
| net_cellid | N | Base Station Code |
| , | 1 | Delimiter (data delimiter): All commas in the data field serve as delimiters |
| ICCID | N | ICCID |
| # | 1 | Terminator |

## V8 Data Packet

*XX,YYYYYYYYYY,V8,HHMMSS,A,latitude,N,longitude,E,speed,direction,DDMMYY,vehicle_status,net_mcc,net_mnc

,net_lac,net_cellid,satellite_signal,network_signal,voltage,bat#

## Command Structure: All characters are half-width

| Data | Data Length | Description |
| --- | --- | --- |
| * | 1 | Command Header |
| XX | 2 | Manufacturer name, e.g., TH, DC, XY, etc. |
| , | 1 | Delimiter (data delimiter); all commas in the data field serve as delimiters |
| YYYYYYYYYY | 10 | On-board unit serial number (10 digits) |
| , | 1 | Delimiter (data delimiter); all commas within the data field serve as delimiters |
| V8 | 2 | Data Type: V8 (GPS signal values, GSM signal values, main power voltage, battery percentage) |
| , | 1 | Delimiter (data delimiter): All commas in the data field serve as delimiters |
| HHMMSS | 6 | Time: hours/minutes/seconds. The upload time is in the UTC time zone |
| , | 1 | Delimiter (Data Delimiter): All commas in the data field are treated as delimiters |
| A | 1 | Valid Data Bits (A/V) A: Indicates that the GPS data is valid positioning data, V: Indicates that the GPS data is an invalid position. |
| , | 1 | Delimiter (Data Delimiter) All commas within the data fields serve as delimiters |
| latitude | 8 | Latitude (degrees and minutes format): DDFF.FFFF (DD degrees, FF.FFFF minutes) DD: Degrees of latitude (00–90) FF.FFFF: Minutes of latitude (00.0000–59.9999), rounded to four decimal places |
| , | 1 | Delimiter (data delimiter): All commas within the data field serve as delimiters |
| N | 1 | Latitude indicator (N: North, S: South) |
| , | 1 | Delimiter (data delimiter); all commas in the data field serve as delimiters |
| longitude | 9 | Longitude (degrees-minutes format): DDDFF.FFFF (DDD degrees, FF.FFFF minutes) DDD: Degrees of longitude (000–180) FF.FFFF: Minutes of longitude (00.0000–59.9999), rounded to four decimal places |
| , | 1 | Delimiter (data separator): All commas within the data field serve as delimiters |
| E | 1 | Longitude indicator (E: East Longitude, W: West Longitude) |
| , | 1 | Delimiter (Data Delimiter) All commas in the data field serve as delimiters |
| speed | 6 | Speed, range 000.00–999.99 (unit: knots), rounded to two decimal places. 1 knot = 1 nautical mile/hour = 1.852 kilometers/hour |
| , | 1 | Delimiter (data delimiter): All commas in the data field are treated as delimiters |
| direction | 3 | Azimuth 000–359 degrees, with true north at 0 degrees, 1-degree resolution, clockwise direction |
| , | 1 | Delimiter (data delimiter): All commas in the data field serve as delimiters |
| DDMMYY | 6 | Day/Month/Year |
| , | 1 | Delimiter (data delimiter): All commas in the data field are treated as delimiters |
| vehicle_status | 8 | Vehicle status, consisting of four bytes, indicating the status of the on-board unit components, vehicle components, and alarm status, etc. |


|   |   | Hexadecimal values are represented using ASCII characters. The specific meaning of each bit in each byte of this variable is as follows; "bit" indicates negative logic, i.e., bit=0 is active. See Table in Appendix 1 at the end of this document |
| --- | --- | --- |
| , | 1 | Delimiter (data delimiter): All commas within the data bits serve as delimiters |
| net_mcc | 3 | Mobile Country Code |
| , | 1 | Delimiter (data delimiter): All commas in the data field are treated as delimiters |
| net_mnc | 2 | Mobile Network Code |
| , | 1 | Delimiter (data delimiter): All commas in the data field serve as delimiters |
| net_lac | N | Base Station Area Code |
| , | 1 | Delimiter (Data Delimiter): All commas in the data field are treated as delimiters |
| net_cellid | N | Base Station Code |
| , | 1 | Delimiter (data delimiter); all commas in the data field serve as delimiters |
| bssid | 6 | bssid: 0xd076e794d03c MAC address d0:76:e7:94:d0:3c |
| , | 1 | Delimiter (data delimiter): All commas within the data field serve as delimiters |
| RSSI | 1 | RSSI: 0x3a Signal value, 0x3a = 58–110 = –52 |
| , | 1 | Delimiter (data delimiter): All commas in the data field serve as delimiters |
| BSSID | 6 | BSSID: 0xd076e794d03c MAC address d0:76:e7:94:d0:3c |
| , | 1 | Delimiter (data delimiter): All commas within the data field serve as delimiters |
| RSSI | 1 | RSSI: 0x3a Signal value, 0x3a = 58–110 = –52 |
| , | 1 | Delimiter (data delimiter): All commas in the data field serve as delimiters |
| BSSID | 6 | BSSID: 0xd076e794d03c MAC address d0:76:e7:94:d0:3c |
| , | 1 | Delimiter (data delimiter): All commas within the data field serve as delimiters |
| RSSI | 1 | RSSI: 0x3a Signal value, 0x3a = 58–110 = –52 |
| , | 1 | Delimiter (data delimiter): All commas in the data field serve as delimiters |
| Satellite_signal | 2 | Number of positioning satellites |
| , | 1 | Delimiter (data delimiter): All commas in the data field serve as delimiters |
| Network_signal | 2 | Network signal value CSQ 0–31 |
| , | 1 | Delimiter (data delimiter): All commas in the data bits serve as delimiters |
| voltage | n | Voltage 0.1V 122=12.2V |
| , | 1 | Delimiter (data delimiter): All commas in the data field are treated as delimiters |
| bat | n | Battery charge percentage 0%–100% |
| # | 1 | End-of-line character |

## Note:

- A: The device defaults to transmitting V8 according to the configured upload interval and no longer transmits the previous V1.

- B: The V6 packet is uploaded once when the device powers on or reboots.

- C: The server has updated the Tianqin protocol, adding:

- 1. ICCID parsing for V6 commands.

- 2. GPS and GSM signal status plus battery percentage for V8 commands.

- 3. Compatibility with the battery percentage from the previous V1 version.


## Appendix 1 Table:

| Bi t |   | Reserved |   | On-Board Unit Component Status |   | Vehicle Component Status |   | Alarm Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| O rd er |   | First Byte |   | Second Byte |   | Third Byte |   | Fourth Byte |
| 0 | 1 | Reserved | 1 | Reserved | 0 | Reserved |   | 1 Reserved |
| 1 | 0 | Displacement Alarm | 0 | Vibration Alarm | 0 | Armed | 0 | Emergency Alarm |
| 2 | 0 | Data Update | 1 | Hold | 0 | ACC Off | 0 | Speeding Alert |
| 3 | 1 | Reserve | 1 | Reserved | 1 | Reserved |   | 1 Reserved |
| 4 | 1 | Reserved | 1 | Reserved | 1 | Reserved |   | 1 Reserved |
| 5 | 1 | Reserved | 1 | Reserved | 1 | Reserved | 0 | Low Battery Alert |
| 6 | 1 | Reserved | 1 | Reserved | 1 | Reserved | 0 | Low Battery Alert |
| 7 | 1 | Reserved | 1 | Reserved | 1 | Reserved |   | 1 Reserved |

## Central Server Command Set:

- 1） The server receives the data packet and sends the acknowledgment command R12

Device transmits: *HQ data and 24 data; the server returns the following acknowledgment data.

Server response: *HQ,8168000005,R12,062108#

8168000005: Corresponds to the device’s actual ID

062108: UTC time

- 2） Set the device data upload interval command D1

Example: *HQ,8168000005,D1,062108,30,1#

Set the ignition data upload interval to 30 seconds

Device response:

*HQ,8168000005,V4,D1,30,65535,062108,062225,A,2235.0086,N,11354.3668,E,000.00,000,160716,FFFFBBF

F,460,00,10342,3721#


3） Fuel Cut-off S20

Fuel Cut-off Command: *HQ,8168000005,S20,061158,1,1# Device Response: *HQ,8168000005,V4,S20,OK,061158,061202, A,2235.0086,N,11354.3668,E,000.00,000,160716F7FFBBFF,460,00,10342,3721#

Restore fuel and power command: *HQ,8168000005,S20,061713,0,0# Device response: *HQ,8168000005,V4,S20,OK,061713,061730, A,2235.0086,N,11354.3668,E,000.00,000,160716,FFFFB9FF,460,00,10342,3721#

4） Armed/Disarmed Command SCF

Activate: *HQ,8168000005,SCF,061837,0,0#

Device Response: *HQ,8168000005,V4,SCF,061837,061955,

A,2235.0086,N,11354.3668,E,000.00,000,160716,FFFFB9FF,460,00,10342,3721#

Withdraw: *HQ,8168000005,SCF,061939,1,1#

Equipment Return: *HQ,8168000005,V4,SCF,061939,062057,

A,2235.0086,N,11354.3668,E,000.00,000,160716,FFFFBBFF,460,00,10342,3721#

- 5） Command S71 to Set Master Control Number Server transmission: *HQ,8168000005,S71,062328,01,18688993050# Device response: *HQ,8168000005,V4,S71,01,062328, 062355, A,2235.0086,N,11354.3668,E,000.00,000,160716,FFFFB9FF,460,00,10342,3721#

- 6） Command S71 to Set SOS Number Server sends: *HQ,8168000005,S71,063012,02,18600000001,18600000002# Device response: *HQ,8168000005,V4,S71,02,063012, 063055, A,2235.0086,N,11354.3668,E,000.00,000,160716,FFFFB9FF,460,00,10342,3721#

7） SMS Command Pass-Through Response (ASCII Code)

Server sends SMS command: 139504434650000 1 Device response: *HQ,8168000005,SMS,SET OK#
