import { parsePacket } from "../dist/parser.js";

let pass = 0;
let fail = 0;

function check(name: string, cond: boolean, detail?: unknown) {
  if (cond) {
    pass++;
    console.log(`  ok  ${name}`);
  } else {
    fail++;
    console.log(`FAIL  ${name}`, detail ?? "");
  }
}

// --- 21-element compact V8, real device from log (Banglalink, GPS invalid) ---
const compact =
  "*HQ,7026318172,V8,111958,V,2434.8341,N,09022.6882,E,0.00,271,280926,fbfffbff,470,01,1234,56789,8,27,121,100#";
const p1 = parsePacket(compact);

console.log("\n[1] 21-element compact V8 (real hardware)");
check("parsed", p1 !== null);
if (p1?.data_type === "V8") {
  check("has_wifi false", p1.has_wifi === false);
  check("mcc=470 (Bangladesh)", p1.net_mcc === "470", p1.net_mcc);
  check("mnc=01", p1.net_mnc === "01", p1.net_mnc);
  check("battery=100", p1.battery_pct === 100, p1.battery_pct);
  check("voltage=12.1", p1.voltage_v === 12.1, p1.voltage_v);
  check("satellites=8", p1.satellite_signal === 8, p1.satellite_signal);
  check("csq=27", p1.network_signal === 27, p1.network_signal);
  check("gps invalid -> lat null", p1.latitude === null);
  check("gps invalid -> lon null", p1.longitude === null);
  check("speed 0 kn -> 0 km/h", p1.speed_kmh === 0, p1.speed_kmh);
  check("status fbfffbff parsed", typeof p1.alarms === "object");
}

// --- 21-element V6 boot packet (must still work) ---
const v6 =
  "*HQ,7026318172,V6,123001,A,2235.0086,N,11354.3668,E,000.00,000,160716,FFFFBBFF,460,00,10342,3721,89440001234567890123#";
const p2 = parsePacket(v6);
console.log("\n[2] V6 boot packet");
check("parsed", p2 !== null);
check("iccid present", p2?.data_type === "V6" && p2.iccid === "89440001234567890123");
check("lat converts", p2 && "latitude" in p2 && Math.abs(p2.latitude! - 22.5834767) < 1e-5, p2 && "latitude" in p2 ? p2.latitude : "?");

// --- 27-element V8 with WiFi block ---
const wifi =
  "*HQ,7026318172,V8,123456,A,2235.0086,N,11354.3668,E,014.28,028,160716,FFFFBBFF,460,00,10342,3721,d076e794d03c,3a,d076e794d03c,3a,d076e794d03c,3a,12,31,122,85#";
const p3 = parsePacket(wifi);
console.log("\n[3] 27-element V8 with WiFi");
check("parsed", p3 !== null);
if (p3?.data_type === "V8") {
  check("has_wifi true", p3.has_wifi === true);
  check("battery=85 (index 26)", p3.battery_pct === 85, p3.battery_pct);
  check("voltage=12.2 (index 25)", p3.voltage_v === 12.2, p3.voltage_v);
  check("csq=31 (index 24)", p3.network_signal === 31, p3.network_signal);
  check("sat=12 (index 23)", p3.satellite_signal === 12, p3.satellite_signal);
  check("bssid_1 captured", p3.bssid_1 === "d076e794d03c", p3.bssid_1);
  check("lat valid", Math.abs(p3.latitude! - 22.5834767) < 1e-5, p3.latitude);
  check("speed 14.28kn -> 26.45km/h", Math.abs(p3.speed_kmh - 26.45) < 1e-9, p3.speed_kmh);
}

// --- malformed / short packets must be rejected, not crash ---
console.log("\n[4] malformed inputs");
check("empty rejected", parsePacket("") === null);
check("no # rejected", parsePacket("*HQ,7026318172,V8") === null);
check("short rejected", parsePacket("*HQ,1,V8,123456#") === null);
check("garbage rejected", parsePacket("hello world") === null);

// --- southern / western hemisphere sign handling ---
const sw = "*HQ,7026318172,V8,123456,A,2235.0086,S,11354.3668,W,014.28,028,160716,FFFFBBFF,470,01,1,2,9,20,121,90#";
const p5 = parsePacket(sw);
console.log("\n[5] hemisphere signs");
check("south -> negative lat", p5?.latitude! < 0, p5 && "latitude" in p5 ? p5.latitude : "?");
check("west -> negative lon", p5?.longitude! < 0, p5 && "longitude" in p5 ? p5.longitude : "?");

// --- alarm decoding: SOS armed in 4th byte ---
console.log("\n[6] alarm decoding");
// 4th byte = FB => 11111011, bit1=1 (no SOS), bit2=0 (speeding active)
const speeding = "*HQ,7026318172,V8,123456,A,2235.0086,N,11354.3668,E,014.28,028,160716,FFFFBBFB,470,01,1,2,9,20,121,90#";
const p6 = parsePacket(speeding);
if (p6) check("speeding bit active (neg logic)", p6.alarms.speeding === true, p6.alarms);
// 4th byte = F9 => 11111001, bit1=0 (SOS active), bit2=0 (speeding active)
const sos = "*HQ,7026318172,V8,123456,A,2235.0086,N,11354.3668,E,014.28,028,160716,FFFFBBF9,470,01,1,2,9,20,121,90#";
const p7 = parsePacket(sos);
if (p7) check("sos bit active (neg logic)", p7.alarms.emergency_sos === true, p7.alarms);

console.log(`\n${fail === 0 ? "ALL PASSED" : "FAILURES"}: ${pass} ok, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
