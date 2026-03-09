/*
  # Create Analytics Tables

  1. New Tables
    - `page_views`: Tracks each page visit with timestamp, URL, and session ID
    - `user_interactions`: Tracks specific user actions (button clicks, form submissions, etc.)
    - `user_sessions`: Aggregate session data with entry/exit times

  2. Security
    - Enable RLS on all tables
    - Allow public insert access (no authentication needed for tracking)
    - Allow authenticated users to read analytics data

  3. Indexes
    - Optimize queries for analytics dashboards (timestamps, session aggregation)
*/

CREATE TABLE IF NOT EXISTS page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  page_url text NOT NULL,
  page_title text,
  referrer text,
  user_agent text,
  ip_address text,
  viewport_width integer,
  viewport_height integer,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  interaction_type text NOT NULL,
  element_id text,
  element_class text,
  page_url text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS analytics_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text UNIQUE NOT NULL,
  first_page_view timestamptz NOT NULL,
  last_page_view timestamptz NOT NULL,
  page_view_count integer DEFAULT 1,
  interaction_count integer DEFAULT 0,
  referrer text,
  user_agent text,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can track page views"
  ON page_views FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read page views"
  ON page_views FOR SELECT
  TO authenticated
  USING (auth.jwt()->>'role' = 'authenticated');

CREATE POLICY "Anyone can track interactions"
  ON user_interactions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read interactions"
  ON user_interactions FOR SELECT
  TO authenticated
  USING (auth.jwt()->>'role' = 'authenticated');

CREATE POLICY "Anyone can track sessions"
  ON analytics_sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update sessions"
  ON analytics_sessions FOR UPDATE
  TO authenticated
  USING (auth.jwt()->>'role' = 'authenticated')
  WITH CHECK (auth.jwt()->>'role' = 'authenticated');

CREATE POLICY "Authenticated users can read sessions"
  ON analytics_sessions FOR SELECT
  TO authenticated
  USING (auth.jwt()->>'role' = 'authenticated');

CREATE INDEX idx_page_views_session_id ON page_views(session_id);
CREATE INDEX idx_page_views_created_at ON page_views(created_at DESC);
CREATE INDEX idx_page_views_page_url ON page_views(page_url);

CREATE INDEX idx_user_interactions_session_id ON user_interactions(session_id);
CREATE INDEX idx_user_interactions_created_at ON user_interactions(created_at DESC);
CREATE INDEX idx_user_interactions_type ON user_interactions(interaction_type);

CREATE INDEX idx_analytics_sessions_session_id ON analytics_sessions(session_id);
CREATE INDEX idx_analytics_sessions_created_at ON analytics_sessions(created_at DESC);
