import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, getDocs, addDoc } from 'firebase/firestore';
import { Substitution, Faculty, TimetableEntry } from '../types';
import { findSubstituteCandidates } from './substitutionEngine';
import { createLog } from './dataService';

export const startAutomationWatchers = () => {
  console.log('[Automation] Starting background watchers...');

  // Watch for Rejected Substitutions to re-trigger engine
  const q = query(collection(db, 'substitution'), where('status', '==', 'Rejected'));
  
  const unsubscribe = onSnapshot(q, async (snapshot) => {
    for (const change of snapshot.docChanges()) {
      if (change.type === 'added' || change.type === 'modified') {
        const sub = { id: change.doc.id, ...change.doc.data() } as Substitution;
        await handleSubstitutionRejection(sub);
      }
    }
  });

  return unsubscribe;
};

const handleSubstitutionRejection = async (rejectedSub: Substitution) => {
  console.log(`[Automation] Rejection detected for ${rejectedSub.id}. Finding replacement...`);

  // 1. Fetch current context
  const facultySnapshot = await getDocs(collection(db, 'faculty'));
  const allFaculty = facultySnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Faculty));
  
  const timetableSnapshot = await getDocs(collection(db, 'timetable'));
  const allTimetables = timetableSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as TimetableEntry));

  // 2. Identify who has already rejected or is absent
  const sq = query(
    collection(db, 'substitution'), 
    where('absentTeacherId', '==', rejectedSub.absentTeacherId),
    where('period', '==', rejectedSub.period),
    where('date', '==', rejectedSub.date)
  );
  const existingSubs = await getDocs(sq);
  const rejectedTeacherIds = existingSubs.docs
    .map(d => d.data() as Substitution)
    .filter(s => s.status === 'Rejected')
    .map(s => s.assignedTeacherId!);

  const leaveSnapshot = await getDocs(query(collection(db, 'leaveRequests'), where('status', '==', 'Approved')));
  const currentAbsentees = leaveSnapshot.docs.map(d => d.data().facultyId);

  // 3. Re-run Engine
  const candidates = findSubstituteCandidates(
    rejectedSub.absentTeacherId,
    rejectedSub.period,
    new Date().toLocaleDateString('en-US', { weekday: 'long' }), // Current day
    rejectedSub.subject,
    'AI&DS',
    allFaculty,
    allTimetables,
    [],
    [...currentAbsentees, ...rejectedTeacherIds]
  );

  if (candidates.length > 0) {
    const nextBest = candidates[0].faculty;
    
    // Create new request
    await addDoc(collection(db, 'substitution'), {
      absentTeacherId: rejectedSub.absentTeacherId,
      assignedTeacherId: nextBest.name,
      date: rejectedSub.date,
      period: rejectedSub.period,
      class: rejectedSub.class,
      subject: rejectedSub.subject,
      status: 'Requested',
      engineScore: candidates[0].score,
      reasons: candidates[0].reasons,
      createdAt: new Date().toISOString()
    });
    
    await createLog('Substitution', `Auto-replaced rejected sub for ${rejectedSub.absentTeacherId} with ${nextBest.name}`);
    console.log(`[Automation] New candidate assigned: ${nextBest.name}`);
  } else {
    await createLog('System', `No replacement found for rejected sub in period ${rejectedSub.period}`);
    console.error('[Automation] No more candidates available.');
  }
};
