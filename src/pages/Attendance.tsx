import { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  fetchAllFaculty, 
  attendanceCollection, 
  markAttendance,
  removeSubstitutionRequestsForFaculty
} from '../services/dataService';
import { Faculty, Attendance } from '../types';
import { getDocs, query, where } from 'firebase/firestore';
import { toast } from 'sonner';
import { Search, UserCheck, UserX, Clock, Send } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

export default function AttendancePage() {
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [attendance, setAttendance] = useState<Record<string, Attendance['status']>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    startDate: '',
    endDate: '',
    type: 'Leave' as 'Leave' | 'On Duty',
    reason: ''
  });

  const loggedInRole = localStorage.getItem('userRole');
  const loggedInName = localStorage.getItem('facultyName');

  const loadData = async (date: string) => {
    try {
      setLoading(true);
      const f = await fetchAllFaculty();
      setFaculty(f);
      
      const q = query(attendanceCollection, where('date', '==', date));
      const snapshot = await getDocs(q);
      const attMap: Record<string, Attendance['status']> = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data() as Attendance;
        attMap[data.facultyId] = data.status;
      });
      setAttendance(attMap);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedDate);
  }, [selectedDate]);

  const handleStatusChange = async (facultyId: string, status: Attendance['status']) => {
    try {
      await markAttendance(facultyId, status, selectedDate);
      
      // Automatic Removal: If marked as Present, remove any substitution requests
      if (status === 'Present') {
        await removeSubstitutionRequestsForFaculty(facultyId, selectedDate);
      }
      
      setAttendance(prev => ({ ...prev, [facultyId]: status }));
      toast.success(`Marked as ${status} for ${selectedDate}`);
    } catch (error) {
      toast.error('Failed to update attendance');
    }
  };

  const filteredFaculty = faculty.filter(f => {
    if (loggedInRole === 'faculty' && loggedInName) {
      return f.name === loggedInName;
    }
    return f.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           f.department.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggedInName) return;

    try {
      await addDoc(collection(db, 'leaveRequests'), {
        ...leaveForm,
        facultyId: loggedInName,
        status: 'Pending',
        createdAt: new Date().toISOString()
      });
      toast.success('Leave request submitted to HOD');
      setShowLeaveForm(false);
      setLeaveForm({ startDate: '', endDate: '', type: 'Leave', reason: '' });
    } catch (error: any) {
      toast.error(`Failed to submit: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {loggedInRole !== 'faculty' && (
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input 
              placeholder="Search faculty or department..." 
              className="pl-10 h-11 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        )}
        <div className={`flex items-center space-x-3 rounded-xl border border-zinc-200 bg-white p-2 px-4 shadow-sm ${loggedInRole === 'faculty' ? 'w-full justify-between' : ''}`}>
          <div className="text-right flex items-center space-x-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Target Date</p>
              <input 
                type="date" 
                className="bg-transparent font-bold text-zinc-800 outline-none"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
          </div>
          <div className="h-8 w-[1px] bg-zinc-200" />
          <Clock className="h-5 w-5 text-zinc-400" />
        </div>
      </div>

      {loggedInRole === 'faculty' && (
        <Card className="glass border-indigo-500/20 shadow-xl shadow-indigo-500/10">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold">Leave & OD Management</CardTitle>
            <Button onClick={() => setShowLeaveForm(!showLeaveForm)} className="bg-zinc-900 text-white rounded-xl px-6 hover:bg-indigo-600 transition-all">
              <Send className="mr-2 h-4 w-4" />
              {showLeaveForm ? 'Close Form' : 'Apply Leave / OD'}
            </Button>
          </CardHeader>
          {showLeaveForm && (
            <CardContent>
              <form onSubmit={handleSubmitLeave} className="space-y-4 max-w-2xl">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase ml-1">Start Date</p>
                    <Input type="date" value={leaveForm.startDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLeaveForm({...leaveForm, startDate: e.target.value})} required className="h-11" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase ml-1">End Date</p>
                    <Input type="date" value={leaveForm.endDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLeaveForm({...leaveForm, endDate: e.target.value})} required className="h-11" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase ml-1">Request Type</p>
                  <select className="w-full h-11 px-3 rounded-lg border border-zinc-200 bg-white text-sm" value={leaveForm.type} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setLeaveForm({...leaveForm, type: e.target.value as 'Leave' | 'On Duty'})}>
                    <option value="Leave">Casual Leave</option>
                    <option value="On Duty">On Duty (OD)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase ml-1">Reason</p>
                  <Textarea placeholder="Explain the reason for your absence..." value={leaveForm.reason} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setLeaveForm({...leaveForm, reason: e.target.value})} required className="min-h-[100px]" />
                </div>
                <Button type="submit" className="w-full bg-indigo-600 text-white font-bold h-12 rounded-xl shadow-lg shadow-indigo-200">Submit to HOD</Button>
              </form>
            </CardContent>
          )}
        </Card>
      )}

      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="px-0">
          <CardTitle className="text-lg font-black uppercase tracking-tighter italic">
            {loggedInRole === 'faculty' ? 'My Presence Record' : 'Daily Faculty Attendance'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Faculty Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Current Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFaculty.map((f) => {
                const status = attendance[f.id];
                return (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">
                      <div>
                        {f.name}
                        <p className="text-[10px] text-zinc-400 uppercase">{f.designation}</p>
                      </div>
                    </TableCell>
                    <TableCell>{f.department}</TableCell>
                    <TableCell>
                      {status ? (
                        <Badge variant={
                          status === 'Present' ? 'default' : 
                          status === 'Absent' ? 'destructive' : 'secondary'
                        }>
                          {status}
                        </Badge>
                      ) : (
                        <span className="text-xs text-zinc-400 italic">Not marked</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button 
                          size="sm" 
                          variant={status === 'Present' ? 'default' : 'outline'}
                          onClick={() => handleStatusChange(f.id, 'Present')}
                        >
                          <UserCheck className="mr-1 h-4 w-4" />
                          P
                        </Button>
                        <Button 
                          size="sm" 
                          variant={status === 'Absent' ? 'destructive' : 'outline'}
                          onClick={() => handleStatusChange(f.id, 'Absent')}
                        >
                          <UserX className="mr-1 h-4 w-4" />
                          A
                        </Button>
                        <Button 
                          size="sm" 
                          variant={status === 'On Duty' ? 'secondary' : 'outline'}
                          onClick={() => handleStatusChange(f.id, 'On Duty')}
                        >
                          <Clock className="mr-1 h-4 w-4" />
                          OD
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
