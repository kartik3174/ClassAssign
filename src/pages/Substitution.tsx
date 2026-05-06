import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription
} from '@/components/ui/dialog';
import { 
  fetchAllFaculty, 
  fetchTimetables, 
  attendanceCollection, 
  createSubstitutionRequest,
  substitutionCollection,
  updateSubstitutionStatus,
  deleteSubstitutionRequest
} from '../services/dataService';
import { findSubstituteCandidates } from '../services/substitutionEngine';
import { Faculty, TimetableEntry, Attendance, Substitution, SubstitutionCandidate } from '../types';
import { getDocs, query, where } from 'firebase/firestore';
import { toast } from 'sonner';
import { Shuffle, CheckCircle2, XCircle, ChevronRight, UserMinus, AlertCircle, Clock, Trash2 } from 'lucide-react';

export default function SubstitutionPage() {
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [timetables, setTimetables] = useState<TimetableEntry[]>([]);
  const [absentFaculty, setAbsentFaculty] = useState<Faculty[]>([]);
  const [absentIds, setAbsentIds] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeSubstitutions, setActiveSubstitutions] = useState<Substitution[]>([]);
  const [candidates, setCandidates] = useState<SubstitutionCandidate[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<{faculty: Faculty, entry: TimetableEntry} | null>(null);
  const [viewingSubstitution, setViewingSubstitution] = useState<Substitution | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async (date: string) => {
    try {
      setLoading(true);
      const allF = await fetchAllFaculty();
      const allT = await fetchTimetables();
      setFaculty(allF);
      setTimetables(allT);

      // Find absent/OD faculty for selected date
      const q = query(attendanceCollection, where('date', '==', date), where('status', 'in', ['Absent', 'On Duty']));
      const snapshot = await getDocs(q);
      const ids = snapshot.docs.map(doc => (doc.data() as Attendance).facultyId);
      setAbsentIds(ids);
      setAbsentFaculty(allF.filter(f => ids.includes(f.id)));

      // Fetch existing substitutions
      const sQ = query(substitutionCollection, where('date', '==', date));
      const sSnapshot = await getDocs(sQ);
      setActiveSubstitutions(sSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Substitution)));

    } catch (error) {
      console.error(error);
      toast.error('Failed to load data for the selected date');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedDate);
  }, [selectedDate]);

  const triggerAlgorithm = (f: Faculty, entry: TimetableEntry) => {
    const results = findSubstituteCandidates(
      f.id,
      entry.period,
      entry.day as any,
      entry.subject,
      f.department,
      faculty,
      timetables,
      activeSubstitutions.map(s => ({ assignedTeacherId: s.assignedTeacherId || '', date: s.date })),
      absentIds // Pass absent IDs to exclude them from candidates
    );
    setCandidates(results);
    setSelectedRequest({ faculty: f, entry });
    setIsDialogOpen(true);
  };

  const handleAssign = async (candidate: SubstitutionCandidate) => {
    if (!selectedRequest) return;
    try {
      const sub = {
        absentTeacherId: selectedRequest.faculty.id,
        assignedTeacherId: candidate.faculty.id,
        date: selectedDate,
        period: selectedRequest.entry.period,
        class: selectedRequest.entry.class,
        subject: selectedRequest.entry.subject,
        status: 'Requested' as const,
        scoreDetail: { [candidate.faculty.id]: candidate.score }
      };
      await createSubstitutionRequest(sub);
      toast.success(`Request sent to ${candidate.faculty.name}`);
      setIsDialogOpen(false);
      loadData(selectedDate);
    } catch (error) {
      toast.error('Failed to create request');
    }
  };

  const updateStatus = async (subId: string, status: 'Accepted' | 'Rejected') => {
    try {
       await updateSubstitutionStatus(subId, status);
       toast.success(`Status updated to ${status}`);
       loadData(selectedDate);
    } catch (error) {
       toast.error('Failed to update status');
    }
  }

  const handleDeleteSub = async (e: React.MouseEvent, subId: string) => {
    e.stopPropagation(); // Don't open the dialog
    try {
      await deleteSubstitutionRequest(subId);
      toast.success('Request removed successfully');
      loadData(selectedDate);
    } catch (error) {
      toast.error('Failed to remove request');
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
        <span className="ml-3 font-bold text-zinc-500">Syncing substitution data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Substitution Management</h2>
          <p className="text-zinc-500">Intelligent class handover and substitution planning.</p>
        </div>
        <div className="flex items-center space-x-3 rounded-xl border border-zinc-200 bg-white p-2 px-4 shadow-sm">
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Viewing Date</p>
            <input 
              type="date" 
              className="bg-transparent font-bold text-zinc-800 outline-none"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          <div className="h-8 w-[1px] bg-zinc-200" />
          <Clock className="h-5 w-5 text-zinc-400" />
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
             <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-600">
                <UserMinus className="h-6 w-6" />
             </div>
             <div>
                <CardTitle>Absentee Timetable Conflict</CardTitle>
                <CardDescription>Classes belonging to absent or on-duty faculty requiring immediate attention.</CardDescription>
             </div>
          </div>
        </CardHeader>
        <CardContent>
          {absentFaculty.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-zinc-100 rounded-xl">
              <CheckCircle2 className="mb-4 h-12 w-12 text-green-500 opacity-20" />
              <p className="text-sm font-medium text-zinc-500">All faculty members are present on this date.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {absentFaculty.map(f => {
                // Fix: Use the selected date to get the correct day of the week
                const day = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' });
                const periods = timetables.filter(t => t.facultyId === f.id && t.day === day).sort((a, b) => a.period - b.period);
                
                return (
                  <div key={f.id} className="rounded-xl border border-zinc-200 bg-white p-6 transition-shadow hover:shadow-md">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold">{f.name}</h3>
                        <Badge variant="secondary">{f.department}</Badge>
                      </div>
                      <Badge variant="destructive" className="animate-pulse">ABSENT</Badge>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      {periods.length === 0 ? (
                        <p className="col-span-full text-xs text-zinc-400 italic">No classes scheduled for today.</p>
                      ) : (
                        periods.map(entry => {
                          const existingSub = activeSubstitutions.find(s => 
                            s.absentTeacherId === f.id && 
                            s.period === entry.period && 
                            s.class === entry.class
                          );

                          return (
                            <div key={entry.id} className="relative flex flex-col justify-between rounded-lg border border-zinc-100 bg-zinc-50/50 p-4">
                              <div className="mb-3">
                                <div className="flex items-center justify-between">
                                   <span className="text-[10px] font-bold uppercase text-zinc-400">Period {entry.period}</span>
                                   <Badge variant="outline" className="text-[10px]">{entry.type}</Badge>
                                </div>
                                <h4 className="mt-1 line-clamp-1 font-semibold text-zinc-800">{entry.subject}</h4>
                                <p className="text-xs text-zinc-500">{entry.class} • {entry.room}</p>
                              </div>
                              
                              {existingSub ? (
                                <div className="mt-2 flex items-center justify-between border-t border-zinc-100 pt-3">
                                  <div className="flex items-center space-x-2">
                                     <div className={`h-1.5 w-1.5 rounded-full ${existingSub.status === 'Accepted' ? 'bg-green-500' : 'bg-orange-500'}`} />
                                     <span className="text-[10px] font-medium text-zinc-600">{existingSub.status}</span>
                                  </div>
                                  {existingSub.status === 'Requested' && (
                                     <div className="flex space-x-1">
                                        <Button size="icon" variant="ghost" className="h-6 w-6 text-green-600" onClick={() => updateStatus(existingSub.id, 'Accepted')}><CheckCircle2 className="h-4 w-4" /></Button>
                                        <Button size="icon" variant="ghost" className="h-6 w-6 text-red-600" onClick={() => updateStatus(existingSub.id, 'Rejected')}><XCircle className="h-4 w-4" /></Button>
                                     </div>
                                  )}
                                </div>
                              ) : (
                                <Button size="sm" className="w-full" onClick={() => triggerAlgorithm(f, entry)}>
                                  <Shuffle className="mr-2 h-3 w-3" />
                                  Find Smart Sub
                                </Button>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl font-sans">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Shuffle className="h-5 w-5 text-primary" />
              <span>Intelligent Substitution Engine</span>
            </DialogTitle>
            <DialogDescription>
              Calculating the best substitutes for <b>{selectedRequest?.entry.subject}</b> ({selectedRequest?.entry.class}) in Period {selectedRequest?.entry.period}.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Recommended Candidates</p>
            <div className="max-h-[400px] space-y-3 overflow-y-auto pr-2">
              {candidates.length === 0 ? (
                <div className="flex flex-col items-center justify-center space-y-2 py-12 text-center border-2 border-dashed border-zinc-100 rounded-xl">
                   <AlertCircle className="h-10 w-10 text-orange-400" />
                   <p className="text-sm font-medium text-zinc-500">No free teachers available for this period.</p>
                </div>
              ) : (
                candidates.map((c, i) => (
                  <div key={c.faculty.id} className={`group flex flex-col rounded-xl border border-zinc-100 p-4 transition-all hover:bg-zinc-50 ${i === 0 ? 'ring-2 ring-primary/20 bg-primary/5 border-primary/20' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 overflow-hidden rounded-full bg-zinc-200">
                           <div className="flex h-full w-full items-center justify-center bg-primary text-white text-lg font-bold">
                              {c.faculty.name.charAt(0)}
                           </div>
                        </div>
                        <div>
                           <p className="font-bold text-zinc-900">{c.faculty.name}</p>
                           <p className="text-xs text-zinc-500">{c.faculty.department} • Workload: {c.faculty.workload} hrs</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black text-primary">{c.score}</div>
                        <p className="text-[10px] uppercase font-bold text-zinc-400">Algo Score</p>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex flex-wrap gap-2">
                      {c.reasons.map((r, idx) => (
                        <Badge key={idx} variant="secondary" className="text-[10px] font-normal leading-none px-2 py-0.5 border-zinc-100">
                          {r}
                        </Badge>
                      ))}
                    </div>

                    <div className="mt-4 flex justify-end">
                       <Button size="sm" onClick={() => handleAssign(c)}>
                          Request Handover
                          <ChevronRight className="ml-1 h-3 w-3" />
                       </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Recent Substitution Requests</CardTitle>
          <CardDescription>Click a row to view the detailed request status and AI score details.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Absent Faculty</TableHead>
                <TableHead>Substitute</TableHead>
                <TableHead>Subject / Class</TableHead>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeSubstitutions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-zinc-500 italic">No historical records available for today.</TableCell>
                </TableRow>
              ) : (
                activeSubstitutions.map((sub) => {
                  const absent = faculty.find(f => f.id === sub.absentTeacherId);
                  const substitute = faculty.find(f => f.id === sub.assignedTeacherId);
                  return (
                    <TableRow 
                      key={sub.id} 
                      className="cursor-pointer transition-colors hover:bg-zinc-50"
                      onClick={() => setViewingSubstitution(sub)}
                    >
                      <TableCell className="font-medium">{absent?.name}</TableCell>
                      <TableCell>{substitute?.name || <span className="text-zinc-400">Pending</span>}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                           {sub.subject}
                           <p className="text-[10px] text-zinc-400 uppercase">{sub.class}</p>
                        </div>
                      </TableCell>
                      <TableCell>P{sub.period}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={
                          sub.status === 'Accepted' ? 'default' : 
                          sub.status === 'Rejected' ? 'destructive' : 'secondary'
                        }>
                          {sub.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-zinc-400 hover:text-red-600 hover:bg-red-50"
                          onClick={(e) => handleDeleteSub(e, sub.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <SubstitutionDetailDialog 
        substitution={viewingSubstitution} 
        onClose={() => setViewingSubstitution(null)} 
        faculty={faculty}
      />
    </div>
  );
}

function SubstitutionDetailDialog({ 
  substitution, 
  onClose,
  faculty
}: { 
  substitution: Substitution | null, 
  onClose: () => void,
  faculty: Faculty[]
}) {
  if (!substitution) return null;

  const absentFaculty = faculty.find(f => f.id === substitution.absentTeacherId);
  const substituteFaculty = faculty.find(f => f.id === substitution.assignedTeacherId);

  return (
    <Dialog open={!!substitution} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md font-sans">
        <DialogHeader>
          <DialogTitle>Substitution Request Details</DialogTitle>
          <DialogDescription>
            Full record of the class handover.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Status</p>
              <Badge variant={
                substitution.status === 'Accepted' ? 'default' : 
                substitution.status === 'Rejected' ? 'destructive' : 'secondary'
              }>
                {substitution.status}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Date</p>
              <p className="text-sm font-medium">{substitution.date}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl bg-zinc-50 p-4 border border-zinc-100">
               <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400">Class Info</p>
               <h4 className="text-lg font-bold text-zinc-900">{substitution.subject}</h4>
               <p className="text-sm text-zinc-600">{substitution.class} • Period {substitution.period}</p>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex-1 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-red-500/70">Absent Faculty</p>
                <p className="text-sm font-semibold">{absentFaculty?.name || 'Unknown'}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-zinc-300" />
              <div className="flex-1 space-y-1 text-right">
                <p className="text-[10px] font-bold uppercase tracking-wider text-green-500/70">Substitute</p>
                <p className="text-sm font-semibold">{substituteFaculty?.name || 'Assigning...'}</p>
              </div>
            </div>
          </div>

          {substitution.scoreDetail && (
            <div className="border-t border-zinc-100 pt-4">
               <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 text-center">AI Recommendation Score</p>
               <div className="flex justify-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-white font-black text-xl">
                    {substitution.scoreDetail && Object.values(substitution.scoreDetail)[0]}
                  </div>
               </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
