export interface Profile {
  id: string;
  name: string;
  phone: string;
  university: string;
  year: string;
  gender: 'Male' | 'Female';
  instagram?: string;
  city?: string;
  course?: string;
  highlighted?: boolean;
  highlight_reason?: string;

  // Quiz Responses
  spontaneous_preference: boolean;
  personality_type: 'Smart' | 'Funny';
  introvert_score: number; // 1-10
  creative_score: number; // 1-10
  college_life_score: number; // 1-10
  social_score: number; // 1-10
  family_importance: number; // 1-10
  humor_importance: number; // 1-10
  academic_importance: number; // 1-10
  fitness_active: boolean;
  weekend_plan: 'Partying' | 'Chill in cafe' | 'Long drives' | 'Bed rotting' | 'Binge watching';
  music_vibe: 'Bollywood' | 'Indie' | 'Rap' | 'Lo-fi' | 'EDM' | 'Depends on mood';
  college_vibe: 'Hustle & grind' | 'Chill & spontaneous' | 'Balanced' | 'Chaos & fun';
  relationship_status: 'Single' | 'Committed' | 'Not looking for anything';
}

export interface DinnerGroup {
  id: string;
  group_number: number;
  members: Profile[];
  compatibility_score: number;
  female_count: number;
  introvert_count: number;
  matching_reasons: string[];
}

export interface GroupingResult {
  groups: DinnerGroup[];
  totalProfiles: number;
  groupsFormed: number;
  ungroupedProfiles: Profile[];
}
