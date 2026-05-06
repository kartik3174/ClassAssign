export type UserRole = 'faculty' | 'hod' | 'admin' | 'student';

export interface Faculty {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  designation: string;
  subjects: string[]; // List of subject names they are experts in
  workload: number; // Current week's workload in hours
  isAvailable: boolean;
  continuousClasses: number;
  acceptanceRate: number; // Historical rate of accepting substitution requests
  lastAssignedAt?: string;
  totalAssignedSubs?: number;
}

export interface TimetableEntry {
  id: string;
  facultyId: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  period: number;
  subject: string;
  class: string;
  room: string;
  type: 'Theory' | 'Lab';
}

export interface Attendance {
  id: string;
  facultyId: string;
  date: string; // YYYY-MM-DD
  status: 'Present' | 'Absent' | 'On Duty';
  remarks?: string;
}

export interface Substitution {
  id: string;
  absentTeacherId: string;
  assignedTeacherId?: string;
  date: string;
  period: number;
  class: string;
  subject: string;
  status: 'Requested' | 'Accepted' | 'Rejected' | 'Auto-Assigned';
  engineScore?: number;
  reasons?: string[];
  scoreDetail?: { [key: string]: number };
  createdAt: string;
}

export interface SubstitutionCandidate {
  faculty: Faculty;
  score: number;
  reasons: string[];
}

export interface LeaveRequest {
  id: string;
  facultyId: string;
  startDate: string;
  endDate: string;
  periods?: number[]; // Specific periods if partial leave
  type: 'Leave' | 'On Duty';
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  approvedBy?: string;
  hodRemarks?: string;
  createdAt: string;
}

export interface SystemLog {
  id: string;
  date: string;
  type: 'Auth' | 'Substitution' | 'Leave' | 'System';
  message: string;
  userId?: string;
  timestamp: string;
}

export interface WorkloadStats {
  facultyId: string;
  weekHours: number;
  monthHours: number;
  totalAssignedSubs: number;
}
