import { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { 
  fetchAllFaculty, 
  timetableCollection,
  facultyCollection
} from '../services/dataService';
import { Faculty, TimetableEntry } from '../types';
import { Search, Plus, Mail, BookOpen, Clock, Trash2, Edit, Save } from 'lucide-react';
import { Input } from '../components/ui/input';
import { getDocs, query, where, addDoc } from 'firebase/firestore';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetFooter
} from '../components/ui/sheet';
import { toast } from 'sonner';

export default function FacultyList() {
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null);
  const [facultyTimetable, setFacultyTimetable] = useState<TimetableEntry[]>([]);
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newFaculty, setNewFaculty] = useState({
    name: '',
    email: '',
    department: 'CS',
    designation: 'Assisstant Professor',
    subjects: '',
    workload: 12
  });

  const loadData = async () => {
    try {
      const f = await fetchAllFaculty();
      setFaculty(f);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openProfile = async (f: Faculty) => {
    setSelectedFaculty(f);
    const q = query(timetableCollection, where('facultyId', '==', f.id));
    const snapshot = await getDocs(q);
    setFacultyTimetable(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TimetableEntry)));
  };

  const handleAddFaculty = async () => {
    if (!newFaculty.name || !newFaculty.email) {
      toast.error('Please fill required fields');
      return;
    }
    try {
      await addDoc(facultyCollection, {
        ...newFaculty,
        subjects: newFaculty.subjects.split(',').map(s => s.trim()),
        isAvailable: true,
        continuousClasses: 0,
        acceptanceRate: 1.0,
        workload: Number(newFaculty.workload)
      });
      toast.success('Faculty added successfully');
      setIsAddOpen(false);
      loadData();
    } catch (error) {
       toast.error('Failed to add faculty');
    }
  };

  const filteredFaculty = faculty.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    f.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input 
            placeholder="Search faculty..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Faculty
        </Button>
      </div>

      <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Add New Faculty</SheetTitle>
            <SheetDescription>Enter faculty details to add them to the master records.</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 py-6">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-zinc-400">Name</label>
              <Input value={newFaculty.name} onChange={(e) => setNewFaculty({...newFaculty, name: e.target.value})} placeholder="Dr. John Doe" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-zinc-400">Email</label>
              <Input value={newFaculty.email} onChange={(e) => setNewFaculty({...newFaculty, email: e.target.value})} placeholder="john@university.edu" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-zinc-400">Department</label>
              <Input value={newFaculty.department} onChange={(e) => setNewFaculty({...newFaculty, department: e.target.value})} placeholder="CS" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-zinc-400">Subjects (comma separated)</label>
              <Input value={newFaculty.subjects} onChange={(e) => setNewFaculty({...newFaculty, subjects: e.target.value})} placeholder="React, NodeJS, DB" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-zinc-400">Weekly Workload (hrs)</label>
              <Input type="number" value={newFaculty.workload} onChange={(e) => setNewFaculty({...newFaculty, workload: Number(e.target.value)})} />
            </div>
          </div>
          <SheetFooter>
            <Button className="w-full" onClick={handleAddFaculty}>
              <Save className="mr-2 h-4 w-4" />
              Save Faculty
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Card>
        <CardHeader>
          <CardTitle>Faculty Master List</CardTitle>
          <CardDescription>Manage your institution's faculty members and their core specifications.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Faculty Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Spec. Subjects</TableHead>
                <TableHead>Workload</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFaculty.map((f) => (
                <TableRow key={f.id} className="cursor-pointer hover:bg-zinc-50" onClick={() => openProfile(f)}>
                  <TableCell className="font-medium">
                    <div>
                      {f.name}
                      <p className="text-[10px] text-zinc-400 uppercase tracking-wider">{f.designation}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-zinc-500">{f.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal">{f.department}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {f.subjects.slice(0, 2).map((s, i) => (
                        <span key={i} className="text-[10px] bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-600">{s}</span>
                      ))}
                      {f.subjects.length > 2 && <span className="text-[10px] text-zinc-400">+{f.subjects.length - 2} more</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                       <span className="text-xs font-bold">{f.workload} hrs</span>
                       <div className="h-1.5 w-12 bg-zinc-100 rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${Math.min(100, (f.workload / 25) * 100)}%` }} />
                       </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-1" onClick={(e) => e.stopPropagation()}>
                       <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-400 hover:text-zinc-900"><Edit className="h-4 w-4" /></Button>
                       <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-400 hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={!!selectedFaculty} onOpenChange={(open) => !open && setSelectedFaculty(null)}>
        <SheetContent className="sm:max-w-xl font-sans overflow-y-auto">
          {selectedFaculty && (
            <div className="space-y-8 py-4">
              <SheetHeader>
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary text-3xl font-bold text-white shadow-lg">
                  {selectedFaculty.name.charAt(0)}
                </div>
                <div className="pt-4">
                  <SheetTitle className="text-2xl font-bold">{selectedFaculty.name}</SheetTitle>
                  <SheetDescription className="text-base">{selectedFaculty.designation} • Dept of {selectedFaculty.department}</SheetDescription>
                </div>
              </SheetHeader>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-zinc-100 p-4">
                  <div className="mb-1 flex items-center text-zinc-400">
                    <Mail className="mr-2 h-4 w-4" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Contact</span>
                  </div>
                  <p className="text-sm font-medium">{selectedFaculty.email}</p>
                </div>
                <div className="rounded-xl border border-zinc-100 p-4">
                  <div className="mb-1 flex items-center text-zinc-400">
                    <Clock className="mr-2 h-4 w-4" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Weekly Workload</span>
                  </div>
                  <p className="text-sm font-medium">{selectedFaculty.workload} Hours / Week</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center text-zinc-400">
                  <BookOpen className="mr-2 h-4 w-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Master Timetable</span>
                </div>
                
                <div className="space-y-2">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => {
                    const dayEntries = facultyTimetable.filter(t => t.day === day).sort((a,b) => a.period - b.period);
                    return (
                      <div key={day} className="flex border-b border-zinc-100 pb-2 last:border-0">
                        <div className="w-24 text-sm font-bold text-zinc-400">{day.slice(0, 3)}</div>
                        <div className="flex flex-1 flex-wrap gap-2">
                          {dayEntries.length === 0 ? (
                            <span className="text-xs text-zinc-300 italic">No classes</span>
                          ) : (
                            dayEntries.map(entry => (
                              <div key={entry.id} className="rounded-lg bg-zinc-50 px-2 py-1 border border-zinc-100">
                                <p className="text-[10px] font-bold text-primary">P{entry.period}</p>
                                <p className="text-xs font-semibold">{entry.subject}</p>
                                <p className="text-[10px] text-zinc-500">{entry.class}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-6">
                <Button className="w-full">View Detailed Analytics</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
