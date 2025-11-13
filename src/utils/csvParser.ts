import { Profile } from '../types/index';

export const parseCSV = (csvText: string): Profile[] => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV must have at least a header and one data row');
  }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const profiles: Profile[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    if (values.length < headers.length) continue;

    const row: { [key: string]: string } = {};
    headers.forEach((header, index) => {
      row[header] = values[index];
    });

    try {
      const profile: Profile = {
        id: `profile-${i}`,
        name: row['name'] || 'Unknown',
        phone: row['phone'] || '',
        university: row['university'] || 'Unknown University',
        year: row['year'] || 'First',
        gender: (row['gender']?.toLowerCase() === 'male' ? 'Male' : 'Female') as 'Male' | 'Female',
        instagram: row['instagram'] || '',
        city: row['city'] || '',
        course: row['course'] || '',

        spontaneous_preference: row['spontaneous']?.toLowerCase() === 'yes' || row['spontaneous'] === '1',
        personality_type: (row['personality_type']?.toLowerCase().includes('funny') ? 'Funny' : 'Smart') as 'Smart' | 'Funny',
        introvert_score: parseInt(row['introvert_score']) || 5,
        creative_score: parseInt(row['creative_score']) || 5,
        college_life_score: parseInt(row['college_life_score']) || 5,
        social_score: parseInt(row['social_score']) || 5,
        family_importance: parseInt(row['family_importance']) || 5,
        humor_importance: parseInt(row['humor_importance']) || 5,
        academic_importance: parseInt(row['academic_importance']) || 5,
        fitness_active: row['fitness']?.toLowerCase() === 'yes' || row['fitness'] === '1',
        weekend_plan: (row['weekend_plan'] || 'Chill in cafe') as any,
        music_vibe: (row['music_vibe'] || 'Depends on mood') as any,
        college_vibe: (row['college_vibe'] || 'Balanced') as any,
        relationship_status: (row['relationship_status'] || 'Single') as any,
      };

      profiles.push(profile);
    } catch (error) {
      console.error(`Error parsing row ${i}:`, error);
      continue;
    }
  }

  return profiles;
};

export const parseJSON = (jsonText: string): Profile[] => {
  const data = JSON.parse(jsonText);
  if (!Array.isArray(data)) {
    throw new Error('JSON must be an array of profiles');
  }

  return data.map((item, index) => ({
    id: item.id || `profile-${index}`,
    name: item.name || 'Unknown',
    phone: item.phone || '',
    university: item.university || 'Unknown University',
    year: item.year || 'First',
    gender: (item.gender === 'Male' ? 'Male' : 'Female') as 'Male' | 'Female',
    instagram: item.instagram || '',
    city: item.city || '',
    course: item.course || '',
    spontaneous_preference: item.spontaneous_preference,
    personality_type: item.personality_type,
    introvert_score: item.introvert_score,
    creative_score: item.creative_score,
    college_life_score: item.college_life_score,
    social_score: item.social_score,
    family_importance: item.family_importance,
    humor_importance: item.humor_importance,
    academic_importance: item.academic_importance,
    fitness_active: item.fitness_active,
    weekend_plan: item.weekend_plan,
    music_vibe: item.music_vibe,
    college_vibe: item.college_vibe,
    relationship_status: item.relationship_status,
  }));
};

export const generateSampleProfiles = (count: number): Profile[] => {
  const universities = ['IIT Delhi', 'DU', 'BITS Pilani', 'IISER Pune', 'IIM Bangalore', 'JNU'];
  const cities = ['Delhi', 'Mumbai', 'Bangalore', 'Pune', 'Hyderabad', 'Chennai'];
  const courses = ['Computer Science', 'Business', 'Engineering', 'Design', 'Liberal Arts', 'Data Science'];
  const weekendPlans = ['Partying', 'Chill in cafe', 'Long drives', 'Bed rotting', 'Binge watching'];
  const musicVibes = ['Bollywood', 'Indie', 'Rap', 'Lo-fi', 'EDM', 'Depends on mood'];
  const collegeVibes = ['Hustle & grind', 'Chill & spontaneous', 'Balanced', 'Chaos & fun'];
  const relationshipStatuses = ['Single', 'Committed', 'Not looking for anything'];

  const profiles: Profile[] = [];

  for (let i = 0; i < count; i++) {
    const gender = Math.random() > 0.4 ? 'Male' : 'Female'; // Slightly more males
    profiles.push({
      id: `profile-${i}`,
      name: `User ${i + 1}`,
      phone: `+91${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
      university: universities[Math.floor(Math.random() * universities.length)],
      year: ['First', 'Second', 'Third', 'Fourth'][Math.floor(Math.random() * 4)],
      gender: gender as 'Male' | 'Female',
      instagram: `user${i + 1}`,
      city: cities[Math.floor(Math.random() * cities.length)],
      course: courses[Math.floor(Math.random() * courses.length)],

      spontaneous_preference: Math.random() > 0.5,
      personality_type: Math.random() > 0.5 ? 'Smart' : 'Funny',
      introvert_score: Math.floor(Math.random() * 10) + 1,
      creative_score: Math.floor(Math.random() * 10) + 1,
      college_life_score: Math.floor(Math.random() * 10) + 1,
      social_score: Math.floor(Math.random() * 10) + 1,
      family_importance: Math.floor(Math.random() * 10) + 1,
      humor_importance: Math.floor(Math.random() * 10) + 1,
      academic_importance: Math.floor(Math.random() * 10) + 1,
      fitness_active: Math.random() > 0.5,
      weekend_plan: weekendPlans[Math.floor(Math.random() * weekendPlans.length)] as any,
      music_vibe: musicVibes[Math.floor(Math.random() * musicVibes.length)] as any,
      college_vibe: collegeVibes[Math.floor(Math.random() * collegeVibes.length)] as any,
      relationship_status: relationshipStatuses[Math.floor(Math.random() * relationshipStatuses.length)] as any,
    });
  }

  return profiles;
};
