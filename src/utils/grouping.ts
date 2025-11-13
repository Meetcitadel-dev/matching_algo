import { Profile, DinnerGroup, GroupingResult } from '../types/index';
import { calculateCompatibility, getExtroversionScore, hasSharedInterests } from './scoring';

const GROUP_SIZE = 6;
const MIN_GROUP_SIZE = 5;
const MIN_FEMALES = 2;
const MAX_FEMALES = 3;
const MAX_INTROVERTS = 2;
const MIN_SHARED_INTERESTS = 2;

interface GroupConstraints {
  femaleCount: number;
  introvertCount: number;
  members: Profile[];
}

interface ValidationResult {
  valid: boolean;
  softViolations: number;
}

const validateGroupConstraints = (group: GroupConstraints, groupSize: number, strictMode: boolean = true): ValidationResult => {
  let softViolations = 0;

  // Check female count
  if (groupSize === 5) {
    if (group.femaleCount < 2 || group.femaleCount > 3) {
      if (strictMode) return { valid: false, softViolations: 0 };
      softViolations += Math.abs(group.femaleCount < 2 ? 2 - group.femaleCount : group.femaleCount - 3);
    }
  } else {
    if (group.femaleCount < MIN_FEMALES || group.femaleCount > MAX_FEMALES) {
      if (strictMode) return { valid: false, softViolations: 0 };
      softViolations += Math.abs(group.femaleCount < MIN_FEMALES ? MIN_FEMALES - group.femaleCount : group.femaleCount - MAX_FEMALES);
    }
  }

  // Check introvert count - softer check, allow overflow
  if (group.introvertCount > MAX_INTROVERTS) {
    if (strictMode) return { valid: false, softViolations: 0 };
    softViolations += group.introvertCount - MAX_INTROVERTS;
  }

  return { valid: true, softViolations };
};

const countIntroverts = (members: Profile[]): number => {
  return members.filter(m => m.introvert_score >= 7).length;
};

const countFemales = (members: Profile[]): number => {
  return members.filter(m => m.gender === 'Female').length;
};

const findBestCandidate = (
  availableProfiles: Profile[],
  currentGroup: Profile[],
  usedIndices: Set<number>,
  maxGroupSize: number,
  strictMode: boolean = true
): { index: number; score: number } | null => {
  let bestScore = -1;
  let bestIndex = -1;

  for (let i = 0; i < availableProfiles.length; i++) {
    if (usedIndices.has(i)) continue;

    const candidate = availableProfiles[i];
    const currentFemales = countFemales(currentGroup);
    const currentIntroverts = countIntroverts(currentGroup);

    // In strict mode, enforce constraints
    if (strictMode) {
      if (candidate.gender === 'Female' && currentFemales >= MAX_FEMALES) continue;
      if (candidate.gender === 'Male' && currentGroup.length - currentFemales >= maxGroupSize - MIN_FEMALES) continue;
      if (candidate.introvert_score >= 7 && currentIntroverts >= MAX_INTROVERTS) continue;
    }

    // Calculate compatibility score
    let compatibilitySum = 0;
    let sharedInterestCount = 0;

    for (const member of currentGroup) {
      const compat = calculateCompatibility(candidate, member);
      compatibilitySum += compat;

      const shared = hasSharedInterests(candidate, member);
      sharedInterestCount += shared.length;
    }

    const avgCompatibility = currentGroup.length > 0 ? compatibilitySum / currentGroup.length : 50;

    let score = avgCompatibility;
    if (sharedInterestCount >= MIN_SHARED_INTERESTS) {
      score += 20;
    } else if (sharedInterestCount > 0) {
      score += 10;
    }

    // Bonus for gender diversity
    if (currentGroup.length < maxGroupSize) {
      const currentFemaleRatio = currentFemales / currentGroup.length;
      const newFemaleRatio = (currentFemales + (candidate.gender === 'Female' ? 1 : 0)) / (currentGroup.length + 1);
      if (Math.abs(newFemaleRatio - 0.4) < Math.abs(currentFemaleRatio - 0.4)) {
        score += 15;
      }
    }

    // Bonus for different universities
    const sameUniversityCount = currentGroup.filter(m => m.university === candidate.university).length;
    if (sameUniversityCount === 0) {
      score += 10;
    } else if (sameUniversityCount <= 1) {
      score += 5;
    }

    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }

  return bestIndex >= 0 ? { index: bestIndex, score: bestScore } : null;
};

const createGroupWithRelaxedConstraints = (
  availableProfiles: Profile[],
  usedIndices: Set<number>,
  targetGroupSize: number
): Profile[] | null => {
  const currentGroup: Profile[] = [];
  let attempts = 0;
  const maxAttempts = 100;

  // Find first unused profile
  let startIndex = -1;
  for (let i = 0; i < availableProfiles.length; i++) {
    if (!usedIndices.has(i)) {
      startIndex = i;
      break;
    }
  }

  if (startIndex === -1) return null;

  currentGroup.push(availableProfiles[startIndex]);
  usedIndices.add(startIndex);

  // Fill group with relaxed constraints
  while (currentGroup.length < targetGroupSize && attempts < maxAttempts) {
    const candidate = findBestCandidate(availableProfiles, currentGroup, usedIndices, targetGroupSize, false);

    if (!candidate) {
      break;
    }

    currentGroup.push(availableProfiles[candidate.index]);
    usedIndices.add(candidate.index);
  }

  return currentGroup.length >= MIN_GROUP_SIZE ? currentGroup : null;
};

export const createDinnerGroups = (profiles: Profile[]): GroupingResult => {
  const availableProfiles = [...profiles];
  const groups: DinnerGroup[] = [];
  const usedIndices = new Set<number>();

  let groupNumber = 0;

  // Phase 1: Form groups with strict constraints
  while (availableProfiles.filter((_, i) => !usedIndices.has(i)).length >= GROUP_SIZE) {
    const remainingCount = availableProfiles.filter((_, i) => !usedIndices.has(i)).length;

    let targetGroupSize = GROUP_SIZE;
    if (remainingCount === GROUP_SIZE + 1) {
      targetGroupSize = GROUP_SIZE;
    }

    const currentGroup: Profile[] = [];
    let attempts = 0;
    const maxAttempts = 50;

    // Start with a female
    let startIndex = -1;
    for (let i = 0; i < availableProfiles.length; i++) {
      if (!usedIndices.has(i) && availableProfiles[i].gender === 'Female') {
        startIndex = i;
        break;
      }
    }

    if (startIndex === -1) {
      for (let i = 0; i < availableProfiles.length; i++) {
        if (!usedIndices.has(i)) {
          startIndex = i;
          break;
        }
      }
    }

    if (startIndex === -1) break;

    currentGroup.push(availableProfiles[startIndex]);
    usedIndices.add(startIndex);

    // Fill with strict constraints
    while (currentGroup.length < targetGroupSize && attempts < maxAttempts) {
      const candidate = findBestCandidate(availableProfiles, currentGroup, usedIndices, targetGroupSize, true);

      if (!candidate) {
        if (currentGroup.length > 1) {
          const lastMember = currentGroup.pop();
          const lastIndex = availableProfiles.indexOf(lastMember!);
          usedIndices.delete(lastIndex);
          attempts++;
          continue;
        } else {
          break;
        }
      }

      currentGroup.push(availableProfiles[candidate.index]);
      usedIndices.add(candidate.index);
    }

    // Validate with strict mode
    if (currentGroup.length === targetGroupSize) {
      const groupConstraints: GroupConstraints = {
        femaleCount: countFemales(currentGroup),
        introvertCount: countIntroverts(currentGroup),
        members: currentGroup,
      };

      const validation = validateGroupConstraints(groupConstraints, currentGroup.length, true);
      if (validation.valid) {
        groups.push(createGroupObject(currentGroup, groupNumber));
        groupNumber++;
      } else {
        // Backtrack
        currentGroup.forEach(member => {
          const index = availableProfiles.indexOf(member);
          usedIndices.delete(index);
        });
      }
    }

    if (attempts >= maxAttempts) break;
  }

  // Phase 2: Form groups of 5 if we have exactly 5+ remaining
  while (availableProfiles.filter((_, i) => !usedIndices.has(i)).length >= MIN_GROUP_SIZE) {
    const remainingCount = availableProfiles.filter((_, i) => !usedIndices.has(i)).length;

    if (remainingCount < MIN_GROUP_SIZE) break;

    let targetGroupSize = remainingCount >= GROUP_SIZE ? GROUP_SIZE : MIN_GROUP_SIZE;
    if (remainingCount === MIN_GROUP_SIZE) {
      targetGroupSize = MIN_GROUP_SIZE;
    } else if (remainingCount > MIN_GROUP_SIZE && remainingCount < GROUP_SIZE) {
      targetGroupSize = remainingCount;
    }

    const currentGroup: Profile[] = [];
    let attempts = 0;
    const maxAttempts = 50;

    let startIndex = -1;
    for (let i = 0; i < availableProfiles.length; i++) {
      if (!usedIndices.has(i) && availableProfiles[i].gender === 'Female') {
        startIndex = i;
        break;
      }
    }

    if (startIndex === -1) {
      for (let i = 0; i < availableProfiles.length; i++) {
        if (!usedIndices.has(i)) {
          startIndex = i;
          break;
        }
      }
    }

    if (startIndex === -1) break;

    currentGroup.push(availableProfiles[startIndex]);
    usedIndices.add(startIndex);

    while (currentGroup.length < targetGroupSize && attempts < maxAttempts) {
      const candidate = findBestCandidate(availableProfiles, currentGroup, usedIndices, targetGroupSize, true);

      if (!candidate) {
        if (currentGroup.length > 1) {
          const lastMember = currentGroup.pop();
          const lastIndex = availableProfiles.indexOf(lastMember!);
          usedIndices.delete(lastIndex);
          attempts++;
          continue;
        } else {
          break;
        }
      }

      currentGroup.push(availableProfiles[candidate.index]);
      usedIndices.add(candidate.index);
    }

    if (currentGroup.length >= MIN_GROUP_SIZE) {
      const groupConstraints: GroupConstraints = {
        femaleCount: countFemales(currentGroup),
        introvertCount: countIntroverts(currentGroup),
        members: currentGroup,
      };

      const validation = validateGroupConstraints(groupConstraints, currentGroup.length, true);
      if (validation.valid) {
        groups.push(createGroupObject(currentGroup, groupNumber));
        groupNumber++;
      } else {
        currentGroup.forEach(member => {
          const index = availableProfiles.indexOf(member);
          usedIndices.delete(index);
        });
      }
    }

    if (attempts >= maxAttempts) break;
  }

  // Phase 3: Add remaining profiles to existing groups (NO ONE LEFT BEHIND)
  const ungroupedIndices = availableProfiles
    .map((_, i) => i)
    .filter(i => !usedIndices.has(i));

  for (const ungroupedIdx of ungroupedIndices) {
    const ungroupedProfile = availableProfiles[ungroupedIdx];

    // Find the best group to add this person to (highest compatibility)
    let bestGroupIdx = -1;
    let bestScore = -1;

    for (let g = 0; g < groups.length; g++) {
      let compatSum = 0;
      for (const member of groups[g].members) {
        compatSum += calculateCompatibility(ungroupedProfile, member);
      }
      const avgCompat = compatSum / groups[g].members.length;

      if (avgCompat > bestScore) {
        bestScore = avgCompat;
        bestGroupIdx = g;
      }
    }

    // Add to best group
    if (bestGroupIdx >= 0) {
      groups[bestGroupIdx].members.push(ungroupedProfile);
      usedIndices.add(ungroupedIdx);
    }
  }

  // Recalculate group stats after adding stragglers
  groups.forEach(group => {
    group.female_count = countFemales(group.members);
    group.introvert_count = countIntroverts(group.members);

    let totalCompatibility = 0;
    let pairCount = 0;
    for (let i = 0; i < group.members.length; i++) {
      for (let j = i + 1; j < group.members.length; j++) {
        totalCompatibility += calculateCompatibility(group.members[i], group.members[j]);
        pairCount++;
      }
    }
    group.compatibility_score = pairCount > 0 ? Math.round((totalCompatibility / pairCount) * 100) / 100 : 0;
  });

  return {
    groups,
    totalProfiles: profiles.length,
    groupsFormed: groups.length,
    ungroupedProfiles: [],
  };
};

function createGroupObject(currentGroup: Profile[], groupNumber: number): DinnerGroup {
  const groupConstraints: GroupConstraints = {
    femaleCount: countFemales(currentGroup),
    introvertCount: countIntroverts(currentGroup),
    members: currentGroup,
  };

  const reasons: string[] = [];

  if (groupConstraints.femaleCount === 2) {
    reasons.push(`2 females, ${currentGroup.length - 2} males - balanced gender mix`);
  } else if (groupConstraints.femaleCount === 3) {
    reasons.push(`3 females, ${currentGroup.length - 3} males - balanced gender mix`);
  }

  const extroverts = currentGroup.filter(m => m.introvert_score <= 4).length;
  if (extroverts >= currentGroup.length - 2) {
    reasons.push(`${extroverts} extroverts - lively energy`);
  }

  const allSharedInterests = new Map<string, number>();
  for (let i = 0; i < currentGroup.length; i++) {
    for (let j = i + 1; j < currentGroup.length; j++) {
      const shared = hasSharedInterests(currentGroup[i], currentGroup[j]);
      for (const interest of shared) {
        allSharedInterests.set(interest, (allSharedInterests.get(interest) || 0) + 1);
      }
    }
  }

  const topInterests = Array.from(allSharedInterests.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([interest]) => interest);

  if (topInterests.length > 0) {
    reasons.push(`Shared interests: ${topInterests.join(', ')}`);
  }

  const universities = new Set(currentGroup.map(m => m.university));
  reasons.push(`From ${universities.size} different colleges`);

  const collegeVibes = new Map<string, number>();
  for (const member of currentGroup) {
    collegeVibes.set(member.college_vibe, (collegeVibes.get(member.college_vibe) || 0) + 1);
  }
  const dominantVibe = Array.from(collegeVibes.entries()).sort((a, b) => b[1] - a[1])[0];
  if (dominantVibe && dominantVibe[1] >= Math.ceil(currentGroup.length / 2)) {
    reasons.push(`Shared college vibe: "${dominantVibe[0]}"`);
  }

  let totalCompatibility = 0;
  let pairCount = 0;
  for (let i = 0; i < currentGroup.length; i++) {
    for (let j = i + 1; j < currentGroup.length; j++) {
      totalCompatibility += calculateCompatibility(currentGroup[i], currentGroup[j]);
      pairCount++;
    }
  }
  const compatibilityScore = pairCount > 0 ? totalCompatibility / pairCount : 0;

  return {
    id: `group-${groupNumber}`,
    group_number: groupNumber + 1,
    members: currentGroup,
    compatibility_score: Math.round(compatibilityScore * 100) / 100,
    female_count: groupConstraints.femaleCount,
    introvert_count: groupConstraints.introvertCount,
    matching_reasons: reasons,
  };
}
