-- Proof of Work Table - Time & Geotagging with Anti-Tamper Technology
-- This table stores cryptographically verified location and timestamp proofs

CREATE TABLE IF NOT EXISTS proof_of_work (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  photo_url TEXT NOT NULL,
  verified_timestamp TIMESTAMPTZ NOT NULL,
  latitude NUMERIC(10, 8) NOT NULL,
  longitude NUMERIC(11, 8) NOT NULL,
  accuracy NUMERIC(8, 2) DEFAULT 0,
  integrity_hash CHAR(64) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_proof_user_id ON proof_of_work(user_id);
CREATE INDEX IF NOT EXISTS idx_proof_timestamp ON proof_of_work(verified_timestamp);
CREATE INDEX IF NOT EXISTS idx_proof_location ON proof_of_work(latitude, longitude);

-- Comments for documentation
COMMENT ON TABLE proof_of_work IS 'Stores cryptographically verified location and timestamp proofs with anti-tamper protection';
COMMENT ON COLUMN proof_of_work.user_id IS 'Links proof to the authenticated user';
COMMENT ON COLUMN proof_of_work.photo_url IS 'Location of the stored image file';
COMMENT ON COLUMN proof_of_work.verified_timestamp IS 'Time & Geotagging proof point - timestamp from GPS fix';
COMMENT ON COLUMN proof_of_work.latitude IS 'Time & Geotagging proof point - precise latitude';
COMMENT ON COLUMN proof_of_work.longitude IS 'Time & Geotagging proof point - precise longitude';
COMMENT ON COLUMN proof_of_work.accuracy IS 'Optional quality metric for location data in meters';
COMMENT ON COLUMN proof_of_work.integrity_hash IS 'Anti-Tamper Proof: Cryptographic link between file and metadata (SHA-256)';
