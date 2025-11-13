import { Profile, DinnerGroup, GroupingResult } from '../types/index';
import { calculateCompatibility, hasSharedInterests } from './scoring';

const MIN_GROUP_SIZE = 6;
const MAX_GROUP_SIZE = 8;
const MIN_FEMALES = 2;
const MAX_FEMALES = 3;
const MAX_INTROVERTS = 2;
const MIN_SHARED_INTERESTS = 2;
const MANUAL_REVIEW_MESSAGE = 'Manual review needed for highlighted members';

const getFemaleRangeForSize = (groupSize: number) => {
  if (groupSize <= 6) {
    return { min: MIN_FEMALES, max: MAX_FEMALES };
  }
  return { min: 2, max: MAX_FEMALES };
};

const isFemaleCountValid = (femaleCount: number, groupSize: number): boolean => {
  const { min, max } = getFemaleRangeForSize(groupSize);
  return femaleCount >= min && femaleCount <= max;
};

const computeGroupSizes = (total: number): number[] => {
  if (total <= 0) return [];
  if (total <= MIN_GROUP_SIZE) return [total];

  const minGroups = Math.ceil(total / MAX_GROUP_SIZE);
  const maxGroups = Math.max(Math.ceil(total / MIN_GROUP_SIZE), minGroups);

  for (let groupCount = minGroups; groupCount <= maxGroups; groupCount++) {
    if (groupCount <= 0) continue;

    const base = groupCount * MIN_GROUP_SIZE;
    const diff = total - base;

    if (diff < 0) continue;
    if (diff > groupCount * (MAX_GROUP_SIZE - MIN_GROUP_SIZE)) continue;

    const sizes = Array(groupCount).fill(MIN_GROUP_SIZE);
    let remaining = diff;
    let idx = 0;

    while (remaining > 0) {
      if (sizes[idx] < MAX_GROUP_SIZE) {
        sizes[idx]++;
        remaining--;
      }
      idx = (idx + 1) % groupCount;
    }

    return sizes;
  }

  return [total];
};

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

  if (!isFemaleCountValid(group.femaleCount, groupSize)) {
    if (strictMode) return { valid: false, softViolations: 0 };
    const { min, max } = getFemaleRangeForSize(groupSize);
    if (group.femaleCount < min) {
      softViolations += min - group.femaleCount;
    } else if (group.femaleCount > max) {
      softViolations += group.femaleCount - max;
    }
  }

  if (group.introvertCount > MAX_INTROVERTS) {
    if (strictMode) return { valid: false, softViolations: 0 };
    softViolations += group.introvertCount - MAX_INTROVERTS;
  }

  return { valid: true, softViolations };
};

const describeConstraintIssues = (group: GroupConstraints, groupSize: number): string[] => {
  const issues: string[] = [];
  const { min, max } = getFemaleRangeForSize(groupSize);

  if (group.femaleCount < min) {
    issues.push(`Needs at least ${min} female${min > 1 ? 's' : ''}`);
  }
  if (group.femaleCount > max) {
    issues.push(`Limit females to ${max}`);
  }
  if (group.introvertCount > MAX_INTROVERTS) {
    issues.push(`Limit introverts to ${MAX_INTROVERTS}`);
  }

  return issues;
};

const countIntroverts = (members: Profile[]): number => {
  return members.filter(m => m.introvert_score >= 7).length;
};

const countFemales = (members: Profile[]): number => {
  return members.filter(m => m.gender === 'Female').length;
};

const markHighlight = (profile: Profile, reason: string, highlightMap: Map<string, string>) => {
  const existing = highlightMap.get(profile.id);
  const combinedReason = existing ? `${existing}; ${reason}` : reason;
  highlightMap.set(profile.id, combinedReason);
  profile.highlighted = true;
  profile.highlight_reason = combinedReason;
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
    const newGroupSize = currentGroup.length + 1;
    const newFemaleCount = currentFemales + (candidate.gender === 'Female' ? 1 : 0);

    if (strictMode) {
      if (!isFemaleCountValid(newFemaleCount, newGroupSize)) continue;

      const { min: minFemalesAtFinal } = getFemaleRangeForSize(maxGroupSize);
      const remainingSlots = maxGroupSize - newGroupSize;
      const potentialMaxFemales = newFemaleCount + remainingSlots;
      if (potentialMaxFemales < minFemalesAtFinal) continue;

      if (candidate.introvert_score >= 7 && currentIntroverts >= MAX_INTROVERTS) continue;
    }

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

    if (currentGroup.length < maxGroupSize) {
      const currentFemaleRatio = currentFemales / Math.max(currentGroup.length, 1);
      const newFemaleRatio = (currentFemales + (candidate.gender === 'Female' ? 1 : 0)) / (currentGroup.length + 1);
      if (Math.abs(newFemaleRatio - 0.4) < Math.abs(currentFemaleRatio - 0.4)) {
        score += 15;
      }
    }

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

const pickStartIndex = (availableProfiles: Profile[], usedIndices: Set<number>): number => {
  for (let i = 0; i < availableProfiles.length; i++) {
    if (!usedIndices.has(i) && availableProfiles[i].gender === 'Female') {
      return i;
    }
  }
  for (let i = 0; i < availableProfiles.length; i++) {
    if (!usedIndices.has(i)) {
      return i;
    }
  }
  return -1;
};

const findFirstUnusedIndex = (availableProfiles: Profile[], usedIndices: Set<number>): number => {
  for (let i = 0; i < availableProfiles.length; i++) {
    if (!usedIndices.has(i)) {
      return i;
    }
  }
  return -1;
};

interface BuildGroupResult {
  members: Profile[];
  highlightMap: Map<string, string>;
}

const buildGroup = (
  availableProfiles: Profile[],
  usedIndices: Set<number>,
  targetGroupSize: number
): BuildGroupResult => {
  const currentGroup: Profile[] = [];
  const highlightMap = new Map<string, string>();
  const flexibleMemberReasons = new Map<string, string>();

  const addMember = (index: number, reason?: string) => {
    const profile = availableProfiles[index];
    currentGroup.push(profile);
    usedIndices.add(index);
    if (reason) {
      flexibleMemberReasons.set(profile.id, reason);
    }
  };

  const startIndex = pickStartIndex(availableProfiles, usedIndices);
  if (startIndex === -1) {
    return { members: currentGroup, highlightMap };
  }

  addMember(startIndex);

  let iterations = 0;
  const maxIterations = 200;

  while (currentGroup.length < targetGroupSize && iterations < maxIterations) {
    iterations++;
    const candidate = findBestCandidate(availableProfiles, currentGroup, usedIndices, targetGroupSize, true);
    if (candidate) {
      addMember(candidate.index);
      continue;
    }

    const relaxed = findBestCandidate(availableProfiles, currentGroup, usedIndices, targetGroupSize, false);
    if (relaxed) {
      addMember(relaxed.index, `Best available fit for constraints`);
      continue;
    }

    const fallbackIdx = findFirstUnusedIndex(availableProfiles, usedIndices);
    if (fallbackIdx === -1) {
      break;
    }

    addMember(fallbackIdx, `Placed to complete table`);
  }

  const groupConstraints: GroupConstraints = {
    femaleCount: countFemales(currentGroup),
    introvertCount: countIntroverts(currentGroup),
    members: currentGroup,
  };

  const validation = validateGroupConstraints(groupConstraints, targetGroupSize, true);
  const issues = validation.valid ? [] : describeConstraintIssues(groupConstraints, targetGroupSize);

  flexibleMemberReasons.forEach((forcedReason, memberId) => {
    const member = currentGroup.find(m => m.id === memberId);
    if (member) {
      const reason = issues.length > 0 ? `${forcedReason} • ${issues.join('; ')}` : forcedReason;
      markHighlight(member, reason, highlightMap);
    }
  });

  if (!validation.valid && flexibleMemberReasons.size === 0) {
    const fallbackReason = issues.length > 0 ? issues.join('; ') : 'Constraint review needed';
    currentGroup.forEach(member => {
      markHighlight(member, fallbackReason, highlightMap);
    });
  }

  return { members: currentGroup, highlightMap };
};

const refreshHighlightReasons = (group: DinnerGroup, highlightMap: Map<string, string>) => {
  const highlightedNames = group.members
    .filter(member => highlightMap.has(member.id))
    .map(member => member.name);

  group.members.forEach(member => {
    const reason = highlightMap.get(member.id);
    if (reason) {
      member.highlighted = true;
      member.highlight_reason = reason;
    }
  });

  const attentionMessageIndex = group.matching_reasons.findIndex(reason => reason.startsWith('Needs attention:'));

  if (highlightedNames.length > 0) {
    const attentionMessage = `Needs attention: ${highlightedNames.join(', ')}`;
    if (attentionMessageIndex >= 0) {
      group.matching_reasons[attentionMessageIndex] = attentionMessage;
    } else {
      group.matching_reasons.push(attentionMessage);
    }
    if (!group.matching_reasons.includes(MANUAL_REVIEW_MESSAGE)) {
      group.matching_reasons.push(MANUAL_REVIEW_MESSAGE);
    }
  } else if (attentionMessageIndex >= 0) {
    group.matching_reasons.splice(attentionMessageIndex, 1);
    const manualIdx = group.matching_reasons.indexOf(MANUAL_REVIEW_MESSAGE);
    if (manualIdx >= 0) {
      group.matching_reasons.splice(manualIdx, 1);
    }
  }
};

export const createDinnerGroups = (profiles: Profile[]): GroupingResult => {
  const availableProfiles = profiles.map(profile => ({ ...profile, highlighted: false, highlight_reason: undefined }));
  const groups: DinnerGroup[] = [];
  const groupHighlightMaps: Map<string, string>[] = [];
  const usedIndices = new Set<number>();

  const targetGroupSizes = computeGroupSizes(availableProfiles.length);

  targetGroupSizes.forEach(targetSize => {
    if (usedIndices.size >= availableProfiles.length) {
      return;
    }

    const { members, highlightMap } = buildGroup(availableProfiles, usedIndices, targetSize);
    if (members.length === 0) {
      return;
    }

    const group = createGroupObject(members, groups.length, highlightMap);
    groups.push(group);
    groupHighlightMaps.push(highlightMap);
  });

  const remainingIndices = availableProfiles
    .map((_, idx) => idx)
    .filter(idx => !usedIndices.has(idx));

  for (const idx of remainingIndices) {
    const profile = availableProfiles[idx];

    let bestValidGroup = -1;
    let bestValidScore = -1;
    let bestFlexibleGroup = -1;
    let bestFlexibleScore = -1;
    let bestOverflowGroup = -1;
    let bestOverflowScore = -1;

    groups.forEach((group, groupIdx) => {
      let compatSum = 0;
      for (const member of group.members) {
        compatSum += calculateCompatibility(profile, member);
      }
      const avgCompat = compatSum / group.members.length;

      const currentSize = group.members.length;

      if (currentSize < MAX_GROUP_SIZE) {
        const potentialMembers = [...group.members, profile];
        const constraints: GroupConstraints = {
          femaleCount: countFemales(potentialMembers),
          introvertCount: countIntroverts(potentialMembers),
          members: potentialMembers,
        };
        const validation = validateGroupConstraints(constraints, potentialMembers.length, true);

        if (validation.valid && avgCompat > bestValidScore) {
          bestValidScore = avgCompat;
          bestValidGroup = groupIdx;
        }

        if (avgCompat > bestFlexibleScore) {
          bestFlexibleScore = avgCompat;
          bestFlexibleGroup = groupIdx;
        }
      } else {
        if (avgCompat > bestOverflowScore) {
          bestOverflowScore = avgCompat;
          bestOverflowGroup = groupIdx;
        }
      }
    });

    if (bestValidGroup >= 0) {
      const group = groups[bestValidGroup];
      group.members.push(profile);
      usedIndices.add(idx);
      refreshHighlightReasons(group, groupHighlightMaps[bestValidGroup]);
      continue;
    }

    if (bestFlexibleGroup >= 0) {
      const group = groups[bestFlexibleGroup];
      group.members.push(profile);
      usedIndices.add(idx);
      markHighlight(profile, 'Forced placement to seat everyone', groupHighlightMaps[bestFlexibleGroup]);
      refreshHighlightReasons(group, groupHighlightMaps[bestFlexibleGroup]);
      continue;
    }

    if (bestOverflowGroup >= 0) {
      const group = groups[bestOverflowGroup];
      group.members.push(profile);
      usedIndices.add(idx);
      markHighlight(profile, 'Table exceeds capacity — manual adjustment required', groupHighlightMaps[bestOverflowGroup]);
      refreshHighlightReasons(group, groupHighlightMaps[bestOverflowGroup]);
      continue;
    }

    const highlightMap = new Map<string, string>();
    markHighlight(profile, 'No other tables available', highlightMap);
    const newGroup = createGroupObject([profile], groups.length, highlightMap);
    groups.push(newGroup);
    groupHighlightMaps.push(highlightMap);
    usedIndices.add(idx);
  }

  groups.forEach((group, idx) => {
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

    refreshHighlightReasons(group, groupHighlightMaps[idx]);
  });

  return {
    groups,
    totalProfiles: availableProfiles.length,
    groupsFormed: groups.length,
    ungroupedProfiles: [],
  };
};

function createGroupObject(currentGroup: Profile[], groupNumber: number, highlightMap: Map<string, string>): DinnerGroup {
  currentGroup.forEach(member => {
    const reason = highlightMap.get(member.id);
    if (reason) {
      member.highlighted = true;
      member.highlight_reason = reason;
    }
  });

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

  const highlightedNames = currentGroup
    .filter(member => highlightMap.has(member.id))
    .map(member => member.name);

  if (highlightedNames.length > 0) {
    reasons.push(`Needs attention: ${highlightedNames.join(', ')}`);
    reasons.push(MANUAL_REVIEW_MESSAGE);
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
