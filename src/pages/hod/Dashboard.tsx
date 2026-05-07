import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { LeaveRequest, Faculty, Substitution, TimetableEntry } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent } from '../../components/ui/dialog';
import { toast } from 'sonner';
import { Zap, Users, BarChart3, Clock, Calendar } from 'lucide-react';
import { findSubstituteCandidates } from '../../services/substitutionEngine';
import { createSubstitutionRequest, updateLeaveStatus } from '../../services/dataService';
import timetableData from '../../Data/timetable.json';

export default function HODDashboard({ activeTab, user }: { activeTab?: string, user: any }) {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [timetables, setTimetables] = useState<TimetableEntry[]>([]);
  const [substitutions, setSubstitutions] = useState<Substitution[]>([]);
  const [selectedFaculty, setSelectedFaculty] = useState<string | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Faculty | null>(null);

  useEffect(() => {
    const unsub1 = onSnapshot(query(collection(db, 'leaveRequests')), (snap) => {
      setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() } as LeaveRequest)));
    });
    const unsub2 = onSnapshot(query(collection(db, 'faculty')), (snap) => {
      setFaculty(snap.docs.map(d => ({ id: d.id, ...d.data() } as Faculty)));
    });
    const unsub3 = onSnapshot(query(collection(db, 'timetable')), (snap) => {
      setTimetables(snap.docs.map(d => ({ id: d.id, ...d.data() } as TimetableEntry)));
    });
    const unsub4 = onSnapshot(query(collection(db, 'substitution')), (snap) => {
      setSubstitutions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Substitution)));
    });
    return () => { unsub1(); unsub2(); unsub3(); unsub4(); };
  }, []);

  const handleApprove = async (request: LeaveRequest) => {
    try {
      console.log("Starting approval for:", request.facultyId);
      
      // 1. Update Leave Status
      try {
        await updateLeaveStatus(request.id, 'Approved', 'Approved by HOD', user?.name || 'HOD');
        console.log("Leave status updated successfully");
      } catch (e) {
        console.error("Failed to update leave status:", e);
        throw new Error("Leave update failed");
      }
      
      // 2. Trigger Auto-Substitution
      toast.info(`Finding substitutes for ${request.facultyId}...`);
      
      // Get all classes for this faculty
      const fTimetable = timetables.filter(t => 
        t.facultyId === request.facultyId || 
        t.facultyId === faculty.find(f => f.id === request.facultyId)?.name
      );
      
      console.log(`Found ${fTimetable.length} classes to substitute`);
      
      for (const entry of fTimetable) {
         try {
           const candidates = findSubstituteCandidates(
              request.facultyId,
              entry.period,
              entry.day,
              entry.subject,
              'AI&DS',
              faculty,
              timetables,
              substitutions,
              [request.facultyId]
           );

           if (candidates.length > 0) {
              const best = candidates[0];
              await createSubstitutionRequest({
                 absentTeacherId: request.facultyId,
                 assignedTeacherId: best.faculty.name,
                 date: request.startDate,
                 period: entry.period,
                 class: entry.class,
                 subject: entry.subject,
                 status: 'Requested',
                 engineScore: best.score,
                 reasons: best.reasons
              });
              console.log(`Sub assigned for period ${entry.period}: ${best.faculty.name}`);
           } else {
              console.warn(`No candidates found for period ${entry.period}`);
           }
         } catch (e) {
           console.error(`Error processing period ${entry.period}:`, e);
         }
      }
      
      toast.success('Leave approved and substitutions assigned!');
    } catch (error: any) {
      console.error("Workflow Error Detail:", error);
      toast.error(`Workflow failed: ${error.message || 'Unknown error'}`);
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await updateLeaveStatus(requestId, 'Rejected');
      toast.error('Request rejected');
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const getFacultyStatus = (fName: string) => {
     const today = new Date().toISOString().split('T')[0];
     const activeLeave = requests.find(r => r.facultyId === fName && r.status === 'Approved' && today >= r.startDate && today <= r.endDate);
     if (activeLeave) return activeLeave.type === 'Leave' ? 'On Leave' : 'On Duty';
     return 'Present';
  };

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

  const renderTimetable = (fName: string, title: string, isHOD: boolean = false) => {
    let fTimetable = timetables.filter(t => t.facultyId === fName);
    if (fTimetable.length === 0) {
       const normalizedSearch = fName.toLowerCase().replace(/\s/g, '');
       const jsonName = Object.keys(timetableData).find(k => k.toLowerCase().replace(/\s/g, '') === normalizedSearch);
       const local = jsonName ? (timetableData as any)[jsonName] : null;
       if (local) {
          Object.entries(local).forEach(([day, sessions]: [string, any]) => {
             sessions.forEach((subject: string | null, idx: number) => {
                if (subject) {
                   fTimetable.push({
                      id: `local-${fName}-${day}-${idx}`,
                      facultyId: fName,
                      day: day as any,
                      period: idx + 1,
                      subject: subject,
                      class: 'III AI&DS',
                      room: 'B-101',
                      type: subject.toLowerCase().includes('lab') ? 'Lab' : 'Theory'
                   } as TimetableEntry);
                }
             });
          });
       }
    }

    return (
       <Card key={fName} className="border-none shadow-xl overflow-hidden rounded-3xl group bg-white">
          <CardHeader className="bg-zinc-900 text-white flex flex-row items-center justify-between">
             <div className="flex items-center gap-3">
                {isHOD && <Badge className="bg-emerald-500 text-white font-black text-[8px] uppercase tracking-widest border-none">Your Schedule</Badge>}
                <CardTitle className="text-sm font-black uppercase tracking-widest italic">{title}</CardTitle>
             </div>
             <Badge variant="outline" className="border-white/20 text-white text-[9px] uppercase tracking-widest">{fTimetable.length} Sessions</Badge>
          </CardHeader>
          <CardContent className="p-0">
             <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                   <thead>
                      <tr className="bg-zinc-50 text-zinc-400 text-[9px] font-black uppercase tracking-widest">
                         <th className="p-4 text-left border-r border-zinc-100">Day / Period</th>
                         {columns.map(col => (
                           <th key={col.id} className={`p-4 text-center border-r border-zinc-100 ${col.type === 'break' ? 'bg-zinc-100/50' : ''}`}>
                             {col.label}
                           </th>
                         ))}
                      </tr>
                   </thead>
                   <tbody>
                      {days.map(day => (
                         <tr key={day} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/30 transition-colors">
                            <td className="p-4 font-black text-[10px] uppercase bg-zinc-50/50 border-r border-zinc-100">{day}</td>
                            {columns.map(col => {
                               if (col.type === 'break') {
                                 return (
                                   <td key={col.id} className="p-2 text-center border-r border-zinc-100 bg-zinc-50/80">
                                      <span className="text-[8px] font-black uppercase vertical-text tracking-widest text-zinc-300">Break</span>
                                   </td>
                                 );
                               }
                               const entry = fTimetable.find(t => t.day === day && t.period === col.index);
                               return (
                                  <td key={col.id} className={`p-4 text-center border-r border-zinc-100 last:border-0 min-w-[120px] ${entry ? 'bg-indigo-50/40' : ''}`}>
                                     {entry ? (
                                        <div>
                                           <div className="text-[10px] font-black text-indigo-700 mb-0.5">{entry.subject}</div>
                                           <div className="text-[8px] font-bold text-indigo-400/70 uppercase">{entry.room}</div>
                                        </div>
                                     ) : (
                                        <span className="text-[8px] text-zinc-200 font-bold uppercase tracking-tighter">FREE</span>
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
    );
  };

  // --- TAB: DASHBOARD ---
  if (activeTab === 'dashboard' || !activeTab) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {[
            { label: 'Pending Leaves', value: requests.filter(r => r.status === 'Pending').length, color: 'text-amber-500', icon: Clock },
            { label: 'Total Faculty', value: faculty.length, color: 'text-indigo-600', icon: Users },
            { label: 'Active Subs', value: substitutions.filter(s => s.status === 'Requested').length, color: 'text-emerald-600', icon: Zap },
            { label: 'Dept Presence', value: `${Math.round(((faculty.length - requests.filter(r => r.status === 'Approved').length) / faculty.length) * 100)}%`, color: 'text-zinc-900', icon: BarChart3 },
          ].map((stat, i) => (
            <Card key={i} className="glass shadow-sm border-none overflow-hidden group">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">{stat.label}</p>
                    <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
                  </div>
                  <stat.icon className="h-5 w-5 text-zinc-300 group-hover:text-indigo-500 transition-colors" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2">
              <Card className="bg-zinc-900 text-white shadow-3xl border-none h-full overflow-hidden rounded-3xl">
                <CardHeader className="border-b border-white/5">
                  <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-emerald-400">Department Substitution Feed</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {substitutions.length === 0 ? (
                          <div className="col-span-full py-20 text-center flex flex-col items-center justify-center gap-4 opacity-50">
                             <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center">
                                <Zap className="h-8 w-8 text-zinc-600" />
                             </div>
                             <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">No active substitutions recorded</p>
                          </div>
                       ) : (
                          substitutions
                            .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
                            .slice(0, 10)
                            .map(sub => (
                              <div key={sub.id} className="p-5 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/15 transition-all group relative overflow-hidden">
                                 <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform">
                                    <Clock className="h-4 w-4" />
                                 </div>
                                 <div className="flex justify-between items-center mb-4">
                                    <Badge className="bg-indigo-500 text-white border-none text-[8px] font-black tracking-widest uppercase px-3 py-1 rounded-full">{sub.status}</Badge>
                                    <div className="flex items-center gap-1.5 text-emerald-400 font-black text-[9px] uppercase tracking-tighter">
                                       <Calendar className="h-3 w-3" />
                                       {sub.date}
                                    </div>
                                 </div>
                                 
                                 <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                       <div className="h-2 w-2 rounded-full bg-red-500 shadow-lg shadow-red-500/20" />
                                       <p className="text-[10px] text-zinc-400 font-bold">Absent: <span className="text-white font-black uppercase tracking-tight ml-1">{sub.absentTeacherId}</span></p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                       <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/20" />
                                       <p className="text-[10px] text-zinc-400 font-bold">Assigned: <span className="text-indigo-400 font-black uppercase tracking-tight ml-1">{sub.assignedTeacherId}</span></p>
                                    </div>
                                 </div>

                                 <div className="mt-5 pt-4 border-t border-white/5 flex justify-between items-center">
                                    <div>
                                       <p className="text-[10px] font-black text-white tracking-tight">{sub.subject}</p>
                                       <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">{sub.class}</p>
                                    </div>
                                    <div className="px-3 py-1 bg-white/10 rounded-lg">
                                       <span className="text-[10px] font-black text-white italic">P{sub.period}</span>
                                    </div>
                                 </div>
                              </div>
                            ))
                       )}
                    </div>
                </CardContent>
              </Card>
           </div>
           
           <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden">
              <CardHeader className="bg-zinc-50 border-b border-zinc-100">
                 <CardTitle className="text-xs font-black uppercase tracking-widest text-zinc-500">Quick Department View</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                 <div className="space-y-2">
                    {faculty.slice(0, 8).map(f => (
                       <div key={f.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-50 transition-colors border border-transparent hover:border-zinc-100">
                          <div className="flex items-center gap-3">
                             <div className="h-8 w-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-400 font-black text-[10px]">{f.name[0]}</div>
                             <span className="text-xs font-bold text-zinc-800">{f.name}</span>
                          </div>
                          <Badge variant="outline" className="text-[8px] border-zinc-200">{getFacultyStatus(f.name)}</Badge>
                       </div>
                    ))}
                 </div>
              </CardContent>
           </Card>
        </div>
      </div>
    );
  }

  // --- TAB: LEAVE REQUESTS ---
  if (activeTab === 'approvals') {
    const pending = requests.filter(r => r.status === 'Pending');
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
          <div>
            <h1 className="text-3xl font-black text-zinc-900 tracking-tighter uppercase italic">
              Leave <span className="text-indigo-600">Approvals</span>
            </h1>
            <p className="text-zinc-500 font-medium mt-1">Review and manage faculty absence requests.</p>
          </div>
          <Badge className="bg-indigo-600 text-white h-8 px-4 rounded-full font-black text-[10px] tracking-widest uppercase w-fit">{pending.length} Pending</Badge>
        </div>

        <Card className="border-none shadow-2xl bg-white overflow-hidden rounded-3xl">
          <CardContent className="p-0">
            {pending.length === 0 ? (
               <div className="py-32 text-center flex flex-col items-center gap-4">
                  <div className="h-20 w-20 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-200">
                     <Zap className="h-10 w-10" />
                  </div>
                  <p className="text-zinc-400 font-medium italic">No pending leave or OD requests.</p>
               </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[800px]">
                  <thead className="bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest">
                    <tr>
                      <th className="px-8 py-5">Faculty Member</th>
                      <th className="px-8 py-5">Request Details</th>
                      <th className="px-8 py-5">Duration</th>
                      <th className="px-8 py-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pending.map(req => (
                      <tr key={req.id} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
                        <td className="px-8 py-6">
                           <p className="font-black text-zinc-900">{req.facultyId}</p>
                           <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">AI&DS Department</p>
                        </td>
                        <td className="px-8 py-6">
                           <Badge className="bg-zinc-100 text-zinc-600 border-none text-[9px] mb-2 uppercase font-black">{req.type}</Badge>
                           <p className="text-xs text-zinc-500 font-medium italic">{req.reason}</p>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-2 text-xs font-bold text-zinc-900">
                              <Calendar className="h-3 w-3 text-indigo-500" />
                              {req.startDate}
                           </div>
                           <p className="text-[9px] text-zinc-400 font-black uppercase tracking-tighter mt-1 ml-5">to {req.endDate}</p>
                        </td>
                        <td className="px-8 py-6 text-right space-x-3">
                           <Button 
                              onClick={() => handleApprove(req)}
                              className="h-11 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-100"
                           >
                              Approve
                           </Button>
                           <Button 
                              onClick={() => handleReject(req.id)}
                              variant="outline"
                              className="h-11 px-6 rounded-xl border-red-100 text-red-600 hover:bg-red-50 font-black text-[10px] uppercase tracking-widest"
                           >
                              Reject
                           </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- TAB: STAFF TIMETABLE ---
  if (activeTab === 'staff-timetable') {
     const hodName = user?.name || 'Dr. Suganthi';
     // Filter out HOD and duplicates
     const uniqueOtherFaculty = faculty.reduce((acc: Faculty[], current) => {
        const isDuplicate = acc.find(item => item.name === current.name);
        if (!isDuplicate && current.name !== hodName) {
           acc.push(current);
        }
        return acc;
     }, []);
     

     return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="flex justify-between items-center">
             <div>
               <h1 className="text-3xl font-black text-zinc-900 tracking-tighter uppercase italic">
                 Staff <span className="text-emerald-600">Timetable</span>
               </h1>
               <p className="text-zinc-500 font-medium mt-1">HOD Schedule & Staff Lookup</p>
             </div>
             <div className="flex items-center gap-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Select Staff to View:</span>
                <select 
                   className="h-12 px-6 rounded-2xl border-2 border-zinc-900 text-xs font-black bg-white shadow-xl shadow-zinc-100 focus:ring-0 focus:border-indigo-600 transition-all"
                   onChange={(e) => setSelectedFaculty(e.target.value === 'none' ? null : e.target.value)}
                   value={selectedFaculty || 'none'}
                >
                   <option value="none">-- Choose a Faculty Member --</option>
                   {uniqueOtherFaculty.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                </select>
             </div>
           </div>

           <div className="space-y-12">
              {/* Permanent HOD Timetable */}
              {renderTimetable(hodName, hodName, true)}

              {/* Selected Staff Timetable */}
              {selectedFaculty ? (
                 <div className="pt-8 border-t-4 border-dashed border-zinc-100">
                    <div className="mb-6 flex items-center gap-2">
                       <Users className="h-5 w-5 text-indigo-600" />
                       <h2 className="text-xl font-black uppercase tracking-tight text-zinc-900">Viewing <span className="text-indigo-600">{selectedFaculty}</span></h2>
                    </div>
                    {renderTimetable(selectedFaculty, selectedFaculty, false)}
                 </div>
              ) : (
                 <div className="py-20 text-center bg-zinc-50 rounded-[3rem] border-2 border-dashed border-zinc-200">
                    <Users className="mx-auto h-12 w-12 text-zinc-200 mb-4" />
                    <p className="text-zinc-400 font-black uppercase tracking-widest italic">Please select a faculty member from the dropdown above to view their schedule.</p>
                 </div>
              )}
           </div>
        </div>
     );
  }

  // --- TAB: MASTER STAFF ---
  if (activeTab === 'master-staff') {
     // Filter out duplicates for the display
     const uniqueFaculty = faculty.reduce((acc: Faculty[], current) => {
        const isDuplicate = acc.find(item => item.name === current.name);
        if (!isDuplicate) {
           acc.push(current);
        }
        return acc;
     }, []);

     return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="flex justify-between items-center">
             <div>
               <h1 className="text-3xl font-black text-zinc-900 tracking-tighter uppercase italic">
                 Master <span className="text-emerald-600">Staff</span>
               </h1>
               <p className="text-zinc-500 font-medium mt-1">Real-time faculty tracking and availability monitoring.</p>
             </div>
             <Button className="rounded-2xl bg-zinc-900 font-bold uppercase text-[10px] tracking-widest h-12 px-8">Export Staff Report</Button>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {uniqueFaculty.map(f => {
                 const status = getFacultyStatus(f.name);
                 return (
                    <Card 
                       key={f.id} 
                       className="border-none shadow-xl bg-white rounded-3xl overflow-hidden group hover:scale-[1.02] transition-all duration-300 cursor-pointer"
                       onClick={() => setSelectedStaff(f)}
                    >
                       <CardHeader className="pb-4 flex flex-row items-start justify-between">
                          <div className="flex items-center gap-4">
                             <div className="h-12 w-12 rounded-2xl bg-zinc-900 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-zinc-200">
                                {f.name.charAt(0)}
                             </div>
                             <div>
                                <CardTitle className="text-sm font-black text-zinc-900 uppercase tracking-tight">{f.name}</CardTitle>
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{f.designation}</p>
                             </div>
                          </div>
                          <Badge className={`${status === 'Present' ? 'bg-emerald-500' : status === 'On Leave' ? 'bg-red-500' : status === 'On Duty' ? 'bg-amber-500' : 'bg-indigo-600'} border-none text-white font-black text-[8px] uppercase tracking-widest px-3 py-1 rounded-full shadow-sm`}>
                             {status}
                          </Badge>
                       </CardHeader>
                       <CardContent className="space-y-6">
                          <div>
                             <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">
                                <span>Current Workload</span>
                                <span className="text-zinc-900">{f.workload || 0}H / 20H</span>
                             </div>
                             <div className="h-2 w-full bg-zinc-50 rounded-full overflow-hidden border border-zinc-100">
                                <div 
                                   className="h-full bg-zinc-900 rounded-full"
                                   style={{ width: `${Math.min(((f.workload || 0) / 20) * 100, 100)}%` }}
                                />
                             </div>
                          </div>

                          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-zinc-50">
                             <div className="text-center">
                                <div className="text-xs font-black text-zinc-900">{Math.round((f.acceptanceRate || 0) * 100)}%</div>
                                <div className="text-[8px] font-bold text-zinc-400 uppercase tracking-tighter">Reliability</div>
                             </div>
                             <div className="text-center">
                                <div className="text-xs font-black text-zinc-900">{f.totalAssignedSubs || 0}</div>
                                <div className="text-[8px] font-bold text-zinc-400 uppercase tracking-tighter">Total Subs</div>
                             </div>
                             <div className="text-center">
                                <div className="text-xs font-black text-zinc-900">{f.continuousClasses || 0}</div>
                                <div className="text-[8px] font-bold text-zinc-400 uppercase tracking-tighter">Continuous</div>
                             </div>
                          </div>
                       </CardContent>
                    </Card>
                 );
              })}
           </div>

           {/* Staff Detail Modal */}
           <Dialog open={!!selectedStaff} onOpenChange={() => setSelectedStaff(null)}>
              <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-0 border-none bg-zinc-50 rounded-[2.5rem]">
                  {selectedStaff && (
                    <div className="space-y-0">
                       {/* Header Card */}
                       <div className="bg-zinc-900 text-white p-6 md:p-12 rounded-b-[3rem] shadow-2xl relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-6 md:p-12 opacity-10">
                             <Users className="h-24 w-24 md:h-32 md:h-32" />
                          </div>
                          <div className="flex flex-col md:flex-row md:items-end gap-6 md:gap-8 relative z-10">
                             <div className="h-20 w-20 md:h-24 md:w-24 rounded-3xl bg-indigo-600 flex items-center justify-center text-3xl md:text-4xl font-black shadow-2xl shadow-indigo-500/20">
                                {selectedStaff.name.charAt(0)}
                             </div>
                             <div>
                                <Badge className="mb-3 md:mb-4 bg-emerald-500 text-[10px] font-black uppercase tracking-widest border-none">Active Faculty</Badge>
                                <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tighter italic leading-tight">{selectedStaff.name}</h2>
                                <p className="text-indigo-400 font-bold uppercase tracking-widest text-[10px] md:text-sm mt-1">{selectedStaff.designation} | {selectedStaff.department || 'AI&DS'}</p>
                             </div>
                          </div>
                       </div>

                       <div className="p-6 md:p-12 space-y-8 md:space-y-12">
                          {/* Profile Metrics */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                             {[
                                { label: 'Workload', value: `${selectedStaff.workload || 0} Hours`, icon: Zap, color: 'text-indigo-600' },
                                { label: 'Reliability', value: `${Math.round((selectedStaff.acceptanceRate || 0) * 100)}%`, icon: BarChart3, color: 'text-emerald-600' },
                                { label: 'Substitutions', value: selectedStaff.totalAssignedSubs || 0, icon: Users, color: 'text-amber-600' },
                                { label: 'Continuous', value: selectedStaff.continuousClasses || 0, icon: Clock, color: 'text-red-600' },
                             ].map((stat, idx) => (
                                <div key={idx} className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100 flex items-center gap-4">
                                   <div className={`h-12 w-12 rounded-2xl bg-zinc-50 flex items-center justify-center ${stat.color}`}>
                                      <stat.icon className="h-5 w-5" />
                                   </div>
                                   <div>
                                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{stat.label}</p>
                                      <p className="text-lg font-black text-zinc-900">{stat.value}</p>
                                   </div>
                                </div>
                             ))}
                          </div>

                          {/* Timetable Section */}
                          <div className="space-y-6">
                             <div className="flex items-center gap-3">
                                <div className="h-8 w-1.5 bg-indigo-600 rounded-full" />
                                <h3 className="text-xl font-black uppercase tracking-tight text-zinc-900">Weekly Schedule</h3>
                             </div>
                             {renderTimetable(selectedStaff.name, "Full Academic Timetable", false)}
                          </div>
                       </div>
                    </div>
                 )}
              </DialogContent>
           </Dialog>
        </div>
     );
  }

  return (
    <div className="py-20 text-center animate-pulse">
       <Zap className="mx-auto h-12 w-12 text-zinc-200 mb-4" />
       <p className="text-zinc-400 font-black uppercase tracking-widest italic">Initializing Command Center...</p>
    </div>
  );
}
