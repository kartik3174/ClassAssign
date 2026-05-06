import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  where, 
  setDoc,
  serverTimestamp,
  deleteDoc,
  getDoc,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Faculty, TimetableEntry, Attendance, Substitution, LeaveRequest, SystemLog } from '../types';

export const facultyCollection = collection(db, 'faculty');
export const timetableCollection = collection(db, 'timetable');
export const attendanceCollection = collection(db, 'attendance');
export const substitutionCollection = collection(db, 'substitution');
export const leaveRequestsCollection = collection(db, 'leaveRequests');
export const subjectsCollection = collection(db, 'subjects');
export const workloadsCollection = collection(db, 'workload');
export const logsCollection = collection(db, 'logs');

// --- Faculty Services ---

export async function fetchAllFaculty(): Promise<Faculty[]> {
  const snapshot = await getDocs(facultyCollection);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Faculty));
}

export async function updateFacultyProfile(facultyId: string, data: Partial<Faculty>) {
  await updateDoc(doc(db, 'faculty', facultyId), data);
}

// --- Timetable Services ---

export async function fetchTimetables(): Promise<TimetableEntry[]> {
  const snapshot = await getDocs(timetableCollection);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TimetableEntry));
}

// --- Leave Management ---

export async function submitLeaveRequest(data: Omit<LeaveRequest, 'id' | 'status' | 'createdAt'>): Promise<string> {
  const docRef = await addDoc(leaveRequestsCollection, {
    ...data,
    status: 'Pending',
    createdAt: new Date().toISOString()
  });
  await createLog('Leave', `New leave request submitted by ${data.facultyId}`);
  return docRef.id;
}

export async function updateLeaveStatus(requestId: string, status: LeaveRequest['status'], hodRemarks?: string, approvedBy?: string) {
  try {
    const updateData: any = { 
      status, 
      updatedAt: serverTimestamp() 
    };
    
    if (hodRemarks) updateData.hodRemarks = hodRemarks;
    if (approvedBy) updateData.approvedBy = approvedBy;

    await updateDoc(doc(db, 'leaveRequests', requestId), updateData);
    
    try {
      await createLog('Leave', `Leave request ${requestId} marked as ${status}`);
    } catch (logError) {
      console.warn("Log creation failed, but leave update succeeded:", logError);
    }
  } catch (error) {
    console.error("Critical error in updateLeaveStatus:", error);
    throw error;
  }
}

// --- Substitution Management (Request, Update, Delete) ---

export async function createSubstitutionRequest(sub: Omit<Substitution, 'id' | 'createdAt'>) {
  const docRef = await addDoc(substitutionCollection, {
    ...sub,
    createdAt: new Date().toISOString()
  });
  return docRef.id;
}

export async function updateSubstitutionStatus(subId: string, status: Substitution['status']) {
  await updateDoc(doc(db, 'substitution', subId), { status });
  await createLog('Substitution', `Substitution ${subId} status updated to ${status}`);
}

export async function deleteSubstitutionRequest(subId: string) {
  await deleteDoc(doc(db, 'substitution', subId));
  await createLog('Substitution', `Substitution ${subId} deleted`);
}

export async function fetchLiveSubstitutions(date: string) {
  const q = query(substitutionCollection, where('date', '==', date));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Substitution));
}

// --- System Logs ---

export async function createLog(type: SystemLog['type'], message: string, userId?: string) {
  await addDoc(logsCollection, {
    type,
    message,
    userId,
    date: new Date().toISOString().split('T')[0],
    timestamp: new Date().toISOString()
  });
}

export async function fetchRecentLogs(count: number = 20) {
  const q = query(logsCollection, orderBy('timestamp', 'desc'), limit(count));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SystemLog));
}

// --- User & Role Management ---

export async function getUserProfile(uid: string): Promise<any> {
  const docRef = doc(db, 'users', uid);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() : null;
}

export async function createUserProfile(uid: string, data: any) {
  await setDoc(doc(db, 'users', uid), {
    ...data,
    updatedAt: serverTimestamp()
  }, { merge: true });
}

// --- Helper Functions ---

export async function markAttendance(facultyId: string, status: Attendance['status'], customDate?: string) {
  const date = customDate || new Date().toISOString().split('T')[0];
  const q = query(attendanceCollection, where('facultyId', '==', facultyId), where('date', '==', date));
  const existing = await getDocs(q);
  
  if (!existing.empty) {
    await updateDoc(doc(db, 'attendance', existing.docs[0].id), { status });
  } else {
    await addDoc(attendanceCollection, {
      facultyId,
      date,
      status,
      createdAt: serverTimestamp()
    });
  }
}

export async function removeSubstitutionRequestsForFaculty(facultyId: string, date: string) {
  const q = query(
    substitutionCollection, 
    where('absentTeacherId', '==', facultyId), 
    where('date', '==', date)
  );
  const snapshot = await getDocs(q);
  const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, 'substitution', d.id)));
  await Promise.all(deletePromises);
}
