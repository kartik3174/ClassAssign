import { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, addDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { TimetableEntry, LeaveRequest, Substitution, Faculty } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Calendar, Clock, Send, UserCheck, Zap, Upload, FileJson, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import timetableData from '@/Data/timetable.json';

interface FacultyDashboardProps {
  activeTab?: string;
}

export default function FacultyDashboard({ activeTab }: FacultyDashboardProps) {
  const [myProfile, setMyProfile] = useState<Faculty | null>(null);
  const [myTimetable, setMyTimetable] = useState<TimetableEntry[]>([]);
  const [myRequests, setMyRequests] = useState<LeaveRequest[]>([]);
  const [substitutions, setSubstitutions] = useState<Substitution[]>([]);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    startDate: '',
    endDate: '',
    type: 'Leave' as 'Leave' | 'On Duty',
    reason: ''
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const facultyName = localStorage.getItem('facultyName');

  useEffect(() => {
    if (!facultyName) return;

    // 1. Fetch Profile
    const fQuery = query(collection(db, 'faculty'), where('name', '==', facultyName));
    const unsubscribeFaculty = onSnapshot(fQuery, (snapshot) => {
      if (!snapshot.empty) setMyProfile({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Faculty);
    });

    // 2. Fetch Timetable
    const tQuery = query(collection(db, 'timetable'), where('facultyId', '==', facultyName));
    const unsubscribeTimetable = onSnapshot(tQuery, (snapshot) => {
      if (snapshot.empty) {
        // Fallback to local JSON data
        const localData = (timetableData as any)[facultyName || ''];
        if (localData) {
          const transformed: TimetableEntry[] = [];
          Object.entries(localData).forEach(([day, periods]: [string, any]) => {
            periods.forEach((subject: string | null, index: number) => {
              if (subject) {
                transformed.push({
                  id: `local-${day}-${index}`,
                  facultyId: facultyName || '',
                  day: day as any,
                  period: index + 1,
                  subject: subject,
                  class: 'III AI&DS',
                  room: 'B-101',
                  type: subject.toLowerCase().includes('lab') ? 'Lab' : 'Theory'
                });
              }
            });
          });
          setMyTimetable(transformed);
        } else {
          setMyTimetable([]);
        }
      } else {
        setMyTimetable(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TimetableEntry)));
      }
    });

    // 3. Fetch Leave Requests
    const lQuery = query(collection(db, 'leaveRequests'), where('facultyId', '==', facultyName));
    const unsubscribeLeave = onSnapshot(lQuery, (snapshot) => {
      setMyRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LeaveRequest)));
    });

    // 4. Fetch Substitutions Assigned to Me
    const sQuery = query(collection(db, 'substitution'), where('assignedTeacherId', '==', facultyName));
    const unsubscribeSubs = onSnapshot(sQuery, (snapshot) => {
      setSubstitutions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Substitution)));
    });

    return () => {
      unsubscribeFaculty();
      unsubscribeTimetable();
      unsubscribeLeave();
      unsubscribeSubs();
    };
  }, [facultyName]);

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'leaveRequests'), {
        ...leaveForm,
        facultyId: facultyName,
        status: 'Pending',
        createdAt: new Date().toISOString()
      });
      toast.success('Leave request submitted successfully');
      setIsLeaveModalOpen(false);
    } catch (error) {
      toast.error('Failed to submit request');
    }
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const getEntry = (day: string, period: number) => {
    return myTimetable.find(t => t.day === day && t.period === period);
  };

  const handleSyncSchedule = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsSyncing(true);
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        // Data format: { "Staff Name": { "Monday": [P1, P2...], ... } }
        const timetableRef = collection(db, 'timetable');
        let updateCount = 0;

        for (const [staffName, schedule] of Object.entries(data)) {
          // 1. Clear existing entries for this specific staff
          const q = query(timetableRef, where('facultyId', '==', staffName));
          const snapshot = await getDocs(q);
          const deletePromises = snapshot.docs.map(d => deleteDoc(d.ref));
          await Promise.all(deletePromises);

          // 2. Add new entries
          for (const [day, periods] of Object.entries(schedule as any)) {
            const periodArray = periods as (string | null)[];
            for (let i = 0; i < periodArray.length; i++) {
              const subject = periodArray[i];
              if (subject) {
                await addDoc(timetableRef, {
                  facultyId: staffName,
                  day: day,
                  period: i + 1,
                  subject: subject,
                  class: 'III AI&DS', // Default class
                  department: 'AI&DS',
                  room: 'B-101',
                  type: subject.toLowerCase().includes('lab') ? 'Lab' : 'Theory'
                });
                updateCount++;
              }
            }
          }
        }

        toast.success('Synchronization Complete!', {
          description: `Successfully updated ${updateCount} slots across the department.`
        });
        window.location.reload(); // Refresh to show new data
      } catch (err) {
        console.error(err);
        toast.error('Sync Failed', { description: 'Please ensure the JSON format matches the standard timetable schema.' });
      } finally {
        setIsSyncing(false);
      }
    };

    reader.readAsText(file);
  };

  if (activeTab === 'schedule') {
     const columns = [
       { id: 'p1', label: 'P1', type: 'period', index: 1 },
       { id: 'p2', label: 'P2', type: 'period', index: 2 },
       { id: 'break1', label: 'SHORT BREAK', type: 'break' },
       { id: 'p3', label: 'P3', type: 'period', index: 3 },
       { id: 'p4', label: 'P4', type: 'period', index: 4 },
       { id: 'lunch', label: 'LUNCH BREAK', type: 'break' },
       { id: 'p5', label: 'P5', type: 'period', index: 5 },
       { id: 'p6', label: 'P6', type: 'period', index: 6 },
       { id: 'break2', label: 'BREAK', type: 'break' },
       { id: 'p7', label: 'P7', type: 'period', index: 7 },
     ];

     return (
      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 md:p-8 rounded-[2rem] shadow-xl shadow-zinc-100 border border-zinc-50">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-zinc-900 tracking-tighter uppercase italic leading-tight">
              Academic <span className="text-indigo-600">Schedule</span>
            </h1>
            <p className="text-zinc-500 font-medium mt-1">Official weekly timetable for {facultyName}.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <input 
              type="file" 
              accept=".json" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleSyncSchedule}
            />
            <Button 
              variant="outline" 
              onClick={() => fileInputRef.current?.click()}
              className="h-12 rounded-xl border-zinc-900 border-2 bg-white text-zinc-900 font-black text-[10px] uppercase tracking-widest gap-2 hover:bg-zinc-900 hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] w-full sm:w-auto"
            >
              {isSyncing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {isSyncing ? 'Syncing...' : 'Update Schedule'}
            </Button>
            <Button 
              onClick={() => {
                const data = JSON.stringify(timetableData, null, 2);
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'timetable_master.json';
                link.click();
                toast.success('Master JSON downloaded');
              }}
              variant="outline" 
              className="h-12 rounded-xl border-zinc-200 font-black text-[10px] uppercase tracking-widest gap-2 w-full sm:w-auto"
            >
              <FileJson className="h-4 w-4" /> Master JSON
            </Button>
          </div>
        </div>

        <Card className="border-none shadow-3xl bg-white overflow-hidden rounded-[2.5rem]">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest">
                    <th className="p-6 text-left border-r border-white/5 min-w-[120px]">Day / Period</th>
                    {columns.map(col => (
                      <th key={col.id} className={`p-6 text-center border-r border-white/5 ${col.type === 'break' ? 'bg-white/5 text-zinc-400' : ''}`}>
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {days.map(day => (
                    <tr key={day} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/50 transition-colors">
                      <td className="p-6 font-black text-xs uppercase bg-zinc-50 border-r border-zinc-100">{day}</td>
                      {columns.map(col => {
                        if (col.type === 'break') {
                          return (
                            <td key={col.id} className="p-2 text-center border-r border-zinc-100 bg-zinc-50/80">
                               <span className="text-[8px] font-black text-zinc-300 uppercase vertical-text tracking-widest">Break</span>
                            </td>
                          );
                        }

                        const entry = getEntry(day, col.index!);
                        return (
                          <td key={col.id} className={`p-4 text-center border-r border-zinc-50 last:border-0 min-w-[140px] transition-all ${entry ? 'bg-indigo-50/30' : ''}`}>
                            {entry ? (
                              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}>
                                <p className="font-black text-indigo-700 text-sm leading-tight mb-1">{entry.subject}</p>
                                <Badge variant="secondary" className="bg-white text-[9px] font-black uppercase border-indigo-100 text-indigo-600 shadow-sm">{entry.class}</Badge>
                              </motion.div>
                            ) : (
                              <span className="text-[10px] text-zinc-200 font-bold uppercase italic tracking-tighter">Free</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-10 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-4xl font-black text-zinc-900 tracking-tighter uppercase italic">
            Faculty <span className="text-indigo-600">Hub</span>
          </h1>
          <p className="text-zinc-500 font-medium mt-1">Manage your academic schedule and presence.</p>
        </motion.div>
        
        <Button 
          onClick={() => setIsLeaveModalOpen(true)}
          className="h-14 px-8 rounded-2xl bg-zinc-900 hover:bg-indigo-600 text-white font-bold shadow-2xl shadow-indigo-200 transition-all gap-3"
        >
          <Calendar className="h-5 w-5" />
          Apply for Leave / OD
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass border-indigo-500/10 shadow-sm overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><Clock className="h-24 w-24" /></div>
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Total Workload</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-zinc-900">{myProfile?.workload || 0}H</div>
            <p className="text-xs font-bold text-zinc-400 mt-1 uppercase tracking-tighter">Current Academic Week</p>
          </CardContent>
        </Card>

        <Card className="glass border-emerald-500/10 shadow-sm overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><UserCheck className="h-24 w-24" /></div>
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Acceptance Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-emerald-600">{Math.round((myProfile?.acceptanceRate || 0) * 100)}%</div>
            <p className="text-xs font-bold text-zinc-400 mt-1 uppercase tracking-tighter">Substitution Reliability</p>
          </CardContent>
        </Card>

        <Card className="glass border-amber-500/10 shadow-sm overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><Send className="h-24 w-24" /></div>
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Pending Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-amber-500">{myRequests.filter(r => r.status === 'Pending').length}</div>
            <p className="text-xs font-bold text-zinc-400 mt-1 uppercase tracking-tighter">Awaiting HOD Approval</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Substitution Section */}
        <div className="lg:col-span-2">
          <Card className="bg-zinc-900 text-white shadow-2xl border-none h-full overflow-hidden rounded-3xl">
            <CardHeader className="border-b border-white/5">
              <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400 flex items-center gap-2">
                <Zap className="h-4 w-4" /> Assigned Substitutions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {substitutions.length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center text-zinc-700">
                    <UserCheck className="h-8 w-8" />
                  </div>
                  <p className="text-zinc-500 italic text-sm font-medium">You have no pending substitution requests.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {substitutions.map(sub => (
                    <div key={sub.id} className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group">
                      <div className="flex justify-between items-start mb-4">
                        <Badge className="bg-indigo-500 text-white border-none text-[9px] font-black tracking-widest uppercase">{sub.status}</Badge>
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">{sub.date}</span>
                      </div>
                      <h3 className="font-black text-lg text-white group-hover:text-indigo-400 transition-colors">{sub.subject}</h3>
                      <div className="flex items-center gap-2 mt-1">
                         <Badge variant="outline" className="border-white/10 text-zinc-400 text-[10px]">{sub.class}</Badge>
                         <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Period {sub.period}</span>
                      </div>
                      <div className="mt-4 flex gap-2">
                         <Button className="h-9 px-4 rounded-xl bg-white text-zinc-900 hover:bg-indigo-50 font-black text-[10px] uppercase tracking-widest flex-1">Accept</Button>
                         <Button variant="outline" className="h-9 px-4 rounded-xl border-white/10 text-white hover:bg-red-500/10 hover:text-red-500 font-black text-[10px] uppercase tracking-widest">Reject</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Status Column */}
        <div className="space-y-6 h-full">
          {/* Leave Tracker */}
          <Card className="border-none shadow-xl bg-white h-full rounded-3xl overflow-hidden">
            <CardHeader className="bg-zinc-50 border-b border-zinc-100">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-zinc-500">Recent Leave Activity</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {myRequests.length === 0 ? (
                <div className="py-10 text-center text-zinc-400 italic text-xs">No leave history found.</div>
              ) : (
                myRequests.sort((a,b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8).map(req => (
                  <div key={req.id} className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50/50 border border-zinc-100 hover:border-indigo-200 transition-colors">
                    <div>
                      <p className="text-xs font-black text-zinc-900">{req.type}</p>
                      <p className="text-[10px] text-zinc-400 font-bold mt-0.5 truncate max-w-[120px]">{req.reason}</p>
                      <p className="text-[9px] text-indigo-400 font-black mt-1 uppercase tracking-tighter">{req.startDate}</p>
                    </div>
                    <Badge className={`h-6 text-[9px] font-black uppercase border-none ${
                      req.status === 'Approved' ? 'bg-emerald-500 text-white' : 
                      req.status === 'Rejected' ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'
                    }`}>
                      {req.status}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Leave Application Modal */}
      <AnimatePresence>
        {isLeaveModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg bg-white rounded-3xl shadow-3xl overflow-hidden"
            >
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-black italic uppercase tracking-tighter">Apply <span className="text-indigo-600">Leave</span></h2>
                  <Button variant="ghost" onClick={() => setIsLeaveModalOpen(false)} className="rounded-full h-10 w-10 p-0">×</Button>
                </div>

                <form onSubmit={handleLeaveSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Start Date</label>
                      <Input type="date" value={leaveForm.startDate} onChange={e => setLeaveForm({...leaveForm, startDate: e.target.value})} className="h-12 rounded-xl" required />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">End Date</label>
                      <Input type="date" value={leaveForm.endDate} onChange={e => setLeaveForm({...leaveForm, endDate: e.target.value})} className="h-12 rounded-xl" required />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Request Type</label>
                    <select 
                      className="w-full h-12 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={leaveForm.type}
                      onChange={e => setLeaveForm({...leaveForm, type: e.target.value as any})}
                    >
                      <option value="Leave">Casual Leave</option>
                      <option value="On Duty">On Duty (OD)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Reason</label>
                    <textarea 
                      className="w-full h-32 rounded-xl border border-zinc-200 bg-white p-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                      placeholder="Specify your reason..."
                      value={leaveForm.reason}
                      onChange={e => setLeaveForm({...leaveForm, reason: e.target.value})}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full h-14 rounded-2xl bg-indigo-600 text-white font-bold text-lg shadow-xl shadow-indigo-200">
                    Submit Request
                  </Button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
