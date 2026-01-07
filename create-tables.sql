-- Create businesses table
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  lat VARCHAR(20),
  lng VARCHAR(20),
  phone VARCHAR(50),
  website TEXT,
  types JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create scans table
CREATE TABLE IF NOT EXISTS scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(64) NOT NULL UNIQUE,
  business_id UUID REFERENCES businesses(id),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  initiated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMP,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB
);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID REFERENCES scans(id) ON DELETE CASCADE NOT NULL,
  overall_score INTEGER NOT NULL,
  search_visibility_score INTEGER NOT NULL,
  website_experience_score INTEGER NOT NULL,
  local_listings_score INTEGER NOT NULL,
  raw_data JSONB NOT NULL,
  problems JSONB,
  competitors JSONB,
  revenue_estimate JSONB,
  generated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create email_captures table
CREATE TABLE IF NOT EXISTS email_captures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID REFERENCES scans(id),
  email VARCHAR(255) NOT NULL,
  store_name VARCHAR(255),
  opted_in_marketing BOOLEAN DEFAULT FALSE,
  captured_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create scan_jobs table
CREATE TABLE IF NOT EXISTS scan_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID REFERENCES scans(id) NOT NULL,
  job_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'queued',
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  error_message TEXT,
  result JSONB
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_scans_session_id ON scans(session_id);
CREATE INDEX IF NOT EXISTS idx_scans_business_id ON scans(business_id);
CREATE INDEX IF NOT EXISTS idx_reports_scan_id ON reports(scan_id);
CREATE INDEX IF NOT EXISTS idx_scan_jobs_scan_id ON scan_jobs(scan_id);
CREATE INDEX IF NOT EXISTS idx_businesses_place_id ON businesses(place_id);
