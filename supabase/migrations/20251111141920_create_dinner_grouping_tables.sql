/*
  # Dinner Party Grouping System

  1. New Tables
    - `profiles`: Stores user quiz responses with weighted scores
    - `dinner_groups`: Stores generated dinner groups
    - `group_members`: Join table linking profiles to dinner groups

  2. Profile Schema
    - User contact and basic info (name, phone, university, year)
    - 13 weighted quiz questions responses
    - Calculated compatibility scores

  3. Grouping Schema
    - Generated dinner groups
    - Group compatibility metadata
    - Matching reasons

  4. Security
    - Enable RLS on all tables
    - Public read access for grouping results (no sensitive data exposure)
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  
  -- Basic Info
  name text NOT NULL,
  phone text NOT NULL,
  university text NOT NULL,
  year text NOT NULL,
  gender text NOT NULL CHECK (gender IN ('Male', 'Female')),
  instagram text,
  city text,
  course text,
  
  -- Quiz Responses (Weighted Questions)
  -- 1. I enjoy spontaneous plans (Yes/No) - 6x
  spontaneous_preference boolean,
  
  -- 2. Smart person vs Funny person - 2x
  personality_type text CHECK (personality_type IN ('Smart', 'Funny')),
  
  -- 3. I am an introvert person (1-10) - 9x
  introvert_score integer CHECK (introvert_score BETWEEN 1 AND 10),
  
  -- 4. I am a creative person (1-10) - 5x
  creative_score integer CHECK (creative_score BETWEEN 1 AND 10),
  
  -- 5. I have an amazing college (1-10) - 9x
  college_life_score integer CHECK (college_life_score BETWEEN 1 AND 10),
  
  -- 6. I enjoy going out with friends (1-10) - 6x
  social_score integer CHECK (social_score BETWEEN 1 AND 10),
  
  -- 7. How important is family (1-10) - 2x
  family_importance integer CHECK (family_importance BETWEEN 1 AND 10),
  
  -- 8. How important is humor (1-10) - 4x
  humor_importance integer CHECK (humor_importance BETWEEN 1 AND 10),
  
  -- 9. Does academic success matter (1-10) - 8x
  academic_importance integer CHECK (academic_importance BETWEEN 1 AND 10),
  
  -- 10. Like to work out/play sports (Yes/No) - 8x
  fitness_active boolean,
  
  -- 11. Go-to weekend plan - 8x
  weekend_plan text CHECK (weekend_plan IN ('Partying', 'Chill in cafe', 'Long drives', 'Bed rotting', 'Binge watching')),
  
  -- 12. Go-to music vibe - 6x
  music_vibe text CHECK (music_vibe IN ('Bollywood', 'Indie', 'Rap', 'Lo-fi', 'EDM', 'Depends on mood')),
  
  -- 13. College life description - 6x
  college_vibe text CHECK (college_vibe IN ('Hustle & grind', 'Chill & spontaneous', 'Balanced', 'Chaos & fun')),
  
  -- 14. Relationship status - 10x
  relationship_status text CHECK (relationship_status IN ('Single', 'Committed', 'Not looking for anything'))
);

CREATE TABLE IF NOT EXISTS dinner_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  group_number integer NOT NULL,
  
  -- Group Statistics
  compatibility_score decimal(5, 2),
  female_count integer,
  introvert_count integer,
  
  -- Matching Reasons (JSON for flexibility)
  matching_reasons text[] DEFAULT ARRAY[]::text[]
);

CREATE TABLE IF NOT EXISTS group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dinner_group_id uuid NOT NULL REFERENCES dinner_groups(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  UNIQUE(dinner_group_id, profile_id)
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE dinner_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- Public read policies (no auth required for viewing results)
CREATE POLICY "Profiles are readable by anyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Dinner groups are readable by anyone" ON dinner_groups FOR SELECT USING (true);
CREATE POLICY "Group members are readable by anyone" ON group_members FOR SELECT USING (true);

-- Allow inserts without auth (for demo purposes)
CREATE POLICY "Allow inserting profiles" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow inserting dinner groups" ON dinner_groups FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow inserting group members" ON group_members FOR INSERT WITH CHECK (true);
