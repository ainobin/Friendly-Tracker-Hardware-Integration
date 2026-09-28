CREATE TABLE IF NOT EXISTS devices (
  device_id   TEXT PRIMARY KEY,
  iccid       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tracker_positions (
  id           BIGSERIAL PRIMARY KEY,
  device_id    TEXT        NOT NULL REFERENCES devices(device_id) ON DELETE CASCADE,
  timestamp    TIMESTAMPTZ NOT NULL,
  received_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  gps_valid    BOOLEAN     NOT NULL,
  latitude     DOUBLE PRECISION,
  longitude    DOUBLE PRECISION,
  speed_kmh    DOUBLE PRECISION,
  heading      INTEGER,

  battery_pct  INTEGER,
  voltage_v    DOUBLE PRECISION,
  satellites   INTEGER,
  signal_csq   INTEGER,

  mcc          TEXT,
  mnc          TEXT,
  lac          TEXT,
  cellid       TEXT,

  alarms       JSONB       NOT NULL DEFAULT '{}'::jsonb,
  raw_status   TEXT,
  raw_packet   TEXT,

  UNIQUE (device_id, timestamp)
);

CREATE INDEX IF NOT EXISTS idx_positions_device_time
  ON tracker_positions (device_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_positions_alarms
  ON tracker_positions USING GIN (alarms);

-- Geofence/SOS alert evaluation reads active alarms frequently
CREATE OR REPLACE VIEW active_alerts AS
SELECT
  device_id,
  timestamp,
  received_at,
  alarms->>'emergency_sos'  AS sos,
  alarms->>'speeding'       AS speeding,
  alarms->>'low_battery'    AS low_battery,
  alarms->>'vibration_alarm' AS vibration,
  alarms->>'displacement_alarm' AS displacement
FROM tracker_positions
WHERE gps_valid
  AND (
    alarms->>'emergency_sos'    = 'true'
    OR alarms->>'speeding'          = 'true'
    OR alarms->>'low_battery'       = 'true'
    OR alarms->>'vibration_alarm'   = 'true'
    OR alarms->>'displacement_alarm' = 'true'
  );
