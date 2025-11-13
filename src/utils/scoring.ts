import { Profile } from '../types/index';

export const WEIGHTS = {
  spontaneous: 6,
  personality_type: 2,
  introvert: 9,
  creative: 5,
  college_life: 9,
  social: 6,
  family: 2,
  humor: 4,
  academic: 8,
  fitness: 8,
  weekend_plan: 8,
  music_vibe: 6,
  college_vibe: 6,
  relationship: 10,
  gender: 10,
};

export interface PersonalitySegments {
  low: number; // 1-3
  medium: number; // 4-6
  high: number; // 7-10
}

export const segmentScore = (score: number): 'low' | 'medium' | 'high' => {
  if (score <= 3) return 'low';
  if (score <= 6) return 'medium';
  return 'high';
};

export const calculateCompatibility = (profile1: Profile, profile2: Profile): number => {
  let score = 0;
  let totalWeight = 0;

  // Gender compatibility
  totalWeight += WEIGHTS.gender;
  if (profile1.gender === profile2.gender) score += WEIGHTS.gender * 0.5; // Slight penalty for same gender
  else score += WEIGHTS.gender; // Preference for diversity

  // Spontaneous preference
  totalWeight += WEIGHTS.spontaneous;
  if (profile1.spontaneous_preference === profile2.spontaneous_preference) score += WEIGHTS.spontaneous * 0.7;
  else score += WEIGHTS.spontaneous * 0.3; // Some balance is good

  // Personality type (Smart vs Funny)
  totalWeight += WEIGHTS.personality_type;
  if (profile1.personality_type === profile2.personality_type) score += WEIGHTS.personality_type * 0.6;
  else score += WEIGHTS.personality_type; // Diversity preferred

  // Introvert score - segment-based
  totalWeight += WEIGHTS.introvert;
  const introvert1 = segmentScore(profile1.introvert_score);
  const introvert2 = segmentScore(profile2.introvert_score);
  if (introvert1 === introvert2) score += WEIGHTS.introvert * 0.6;
  else score += WEIGHTS.introvert * 0.3; // Complement different levels

  // Creative score - segment-based
  totalWeight += WEIGHTS.creative;
  const creative1 = segmentScore(profile1.creative_score);
  const creative2 = segmentScore(profile2.creative_score);
  if (creative1 === creative2) score += WEIGHTS.creative * 0.7;
  else score += WEIGHTS.creative * 0.4;

  // College life score - segment-based
  totalWeight += WEIGHTS.college_life;
  const college1 = segmentScore(profile1.college_life_score);
  const college2 = segmentScore(profile2.college_life_score);
  if (college1 === college2) score += WEIGHTS.college_life * 0.8; // High priority for similar college vibes
  else score += WEIGHTS.college_life * 0.2;

  // Social score - segment-based
  totalWeight += WEIGHTS.social;
  const social1 = segmentScore(profile1.social_score);
  const social2 = segmentScore(profile2.social_score);
  if (social1 === social2) score += WEIGHTS.social * 0.7;
  else score += WEIGHTS.social * 0.3;

  // Family importance
  totalWeight += WEIGHTS.family;
  const family1 = segmentScore(profile1.family_importance);
  const family2 = segmentScore(profile2.family_importance);
  if (family1 === family2) score += WEIGHTS.family * 0.5;

  // Humor importance
  totalWeight += WEIGHTS.humor;
  const humor1 = segmentScore(profile1.humor_importance);
  const humor2 = segmentScore(profile2.humor_importance);
  if (humor1 === humor2) score += WEIGHTS.humor * 0.6;
  else score += WEIGHTS.humor * 0.3;

  // Academic importance
  totalWeight += WEIGHTS.academic;
  const academic1 = segmentScore(profile1.academic_importance);
  const academic2 = segmentScore(profile2.academic_importance);
  if (academic1 === academic2) score += WEIGHTS.academic * 0.6;
  else score += WEIGHTS.academic * 0.3;

  // Fitness
  totalWeight += WEIGHTS.fitness;
  if (profile1.fitness_active === profile2.fitness_active) score += WEIGHTS.fitness * 0.7;
  else score += WEIGHTS.fitness * 0.2;

  // Weekend plan
  totalWeight += WEIGHTS.weekend_plan;
  if (profile1.weekend_plan === profile2.weekend_plan) score += WEIGHTS.weekend_plan * 0.9; // High match!
  else score += WEIGHTS.weekend_plan * 0.1;

  // Music vibe
  totalWeight += WEIGHTS.music_vibe;
  if (profile1.music_vibe === profile2.music_vibe || profile1.music_vibe === 'Depends on mood' || profile2.music_vibe === 'Depends on mood') {
    score += WEIGHTS.music_vibe * 0.8;
  } else {
    score += WEIGHTS.music_vibe * 0.2;
  }

  // College vibe
  totalWeight += WEIGHTS.college_vibe;
  if (profile1.college_vibe === profile2.college_vibe) score += WEIGHTS.college_vibe * 0.85; // High priority
  else score += WEIGHTS.college_vibe * 0.15;

  // Relationship status
  totalWeight += WEIGHTS.relationship;
  if (profile1.relationship_status === profile2.relationship_status) score += WEIGHTS.relationship * 0.8;
  else score += WEIGHTS.relationship * 0.2;

  return totalWeight > 0 ? (score / totalWeight) * 100 : 0;
};

export const getExtroversionScore = (profile: Profile): number => {
  // Inverse of introvert score (higher = more extroverted)
  return 11 - profile.introvert_score;
};

export const hasSharedInterests = (profile1: Profile, profile2: Profile): string[] => {
  const shared: string[] = [];

  if (profile1.weekend_plan === profile2.weekend_plan) {
    shared.push(`Both love ${profile1.weekend_plan}`);
  }

  if (profile1.music_vibe === profile2.music_vibe) {
    shared.push(`Both into ${profile1.music_vibe}`);
  }

  if (profile1.college_vibe === profile2.college_vibe) {
    shared.push(`Both describe college as "${profile1.college_vibe}"`);
  }

  if (profile1.fitness_active === profile2.fitness_active && profile1.fitness_active) {
    shared.push(`Both workout regularly`);
  }

  if (profile1.spontaneous_preference === profile2.spontaneous_preference && profile1.spontaneous_preference) {
    shared.push(`Both love spontaneous plans`);
  }

  return shared;
};
