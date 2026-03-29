/*
  # Newton-Ai Initial Schema
  
  This migration creates the core database structure for the Newton-Ai educational platform
  that helps students solve and understand problems.
  
  ## New Tables
  
  ### `profiles`
  - `id` (uuid, primary key, references auth.users)
  - `full_name` (text)
  - `avatar_url` (text, optional)
  - `created_at` (timestamptz, defaults to now)
  - `updated_at` (timestamptz, defaults to now)
  
  ### `problems`
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `title` (text)
  - `description` (text)
  - `image_url` (text, optional)
  - `subject` (text)
  - `grade_level` (text)
  - `status` (text, defaults to 'pending')
  - `created_at` (timestamptz, defaults to now)
  - `updated_at` (timestamptz, defaults to now)
  
  ### `solutions`
  - `id` (uuid, primary key)
  - `problem_id` (uuid, references problems)
  - `content` (text)
  - `steps` (jsonb)
  - `created_at` (timestamptz, defaults to now)
  
  ## Security
  
  ### Row Level Security (RLS)
  1. Enable RLS on all tables
  2. Profiles:
     - Users can view all profiles
     - Users can insert their own profile
     - Users can update only their own profile
  3. Problems:
     - Users can view all problems
     - Authenticated users can insert problems
     - Users can update only their own problems
     - Users can delete only their own problems
  4. Solutions:
     - Users can view all solutions
     - System can insert solutions (via service role)
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create problems table
CREATE TABLE IF NOT EXISTS problems (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  image_url text,
  subject text NOT NULL,
  grade_level text NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE problems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view problems"
  ON problems FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert problems"
  ON problems FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own problems"
  ON problems FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own problems"
  ON problems FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create solutions table
CREATE TABLE IF NOT EXISTS solutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id uuid NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  content text NOT NULL,
  steps jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE solutions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view solutions"
  ON solutions FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_problems_user_id ON problems(user_id);
CREATE INDEX IF NOT EXISTS idx_problems_status ON problems(status);
CREATE INDEX IF NOT EXISTS idx_solutions_problem_id ON solutions(problem_id);
CREATE INDEX IF NOT EXISTS idx_problems_created_at ON problems(created_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_problems_updated_at
  BEFORE UPDATE ON problems
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
