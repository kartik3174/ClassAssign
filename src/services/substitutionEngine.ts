import { Faculty, TimetableEntry, SubstitutionCandidate } from '../types';

/**
 * Calculates a priority score for a substitute candidate.
 * Higher scores indicate better candidates.
 */
export function calculateSubstitutionScore(
  isSameSubject: boolean,
  isSameDepartment: boolean,
  currentWorkload: number,
  continuousClasses: number,
  acceptanceRate: number,
  recentlyAssigned: boolean
): number {
  let score = 0;

  // 1. Subject Expertise (Highest weight)
  if (isSameSubject) score += 50;

  // 2. Department Match
  if (isSameDepartment) score += 30;

  // 3. Workload Balance (Avoid overload)
  // Max workload threshold is 18 hours
  if (currentWorkload > 18) score -= 20;
  else score += 10; // Bonus for light workload

  // 4. continuity (Avoid burnout)
  if (continuousClasses >= 3) score -= 10;

  // 5. Reliability (Past acceptance rate)
  if (acceptanceRate > 0.8) score += 10;
  else if (acceptanceRate < 0.4) score -= 20;

  // 6. Recency (Avoid repeated assignment)
  if (recentlyAssigned) score -= 15;

  return score;
}

export function findSubstituteCandidates(
  absentTeacherId: string,
  period: number,
  day: string,
  targetSubject: string,
  targetDepartment: string,
  allFaculty: Faculty[],
  allTimetables: TimetableEntry[],
  recentSubstitutions: { assignedTeacherId?: string; date: string }[],
  absentTeacherIds: string[] = []
): SubstitutionCandidate[] {
  
  // Step 1: Identify Available Teachers
  const availableFaculty = allFaculty.filter(faculty => {
    // 1. Cannot substitute for yourself (Check both ID and Name)
    if (faculty.id === absentTeacherId || faculty.name === absentTeacherId) return false;
    
    // 2. Cannot substitute if you are also absent or on leave
    if (absentTeacherIds.includes(faculty.id) || absentTeacherIds.includes(faculty.name)) return false;

    // 3. Cannot substitute if you have a class in that period
    const hasClass = allTimetables.some(entry => 
      (entry.facultyId === faculty.id || entry.facultyId === faculty.name) && 
      entry.period === period && 
      entry.day === day
    );
    
    if (hasClass) return false;

    return faculty.isAvailable !== false;
  });

  // Step 2: Apply Smart Preferences & Scoring
  const candidates: SubstitutionCandidate[] = availableFaculty.map(faculty => {
    const isSameSubject = faculty.subjects.includes(targetSubject);
    const isSameDepartment = faculty.department === targetDepartment;
    
    // Check if assigned in the last 24 hours
    const wasRecentlyAssigned = recentSubstitutions.some(sub => 
      sub.assignedTeacherId === faculty.id
    );

    const score = calculateSubstitutionScore(
      isSameSubject,
      isSameDepartment,
      faculty.workload,
      faculty.continuousClasses,
      faculty.acceptanceRate,
      wasRecentlyAssigned
    );

    const reasons: string[] = [];
    if (isSameSubject) reasons.push('Subject Match (+50)');
    if (isSameDepartment) reasons.push('Dept Match (+30)');
    if (faculty.workload < 18) reasons.push('Light Workload (+10)');
    if (faculty.workload > 18) reasons.push('High Workload (-20)');
    if (wasRecentlyAssigned) reasons.push('Assigned Recently (-15)');

    return { faculty, score, reasons };
  });

  // Step 3: Sort by highest score
  return candidates.sort((a, b) => b.score - a.score);
}
