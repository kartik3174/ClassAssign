import { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { fetchAllFaculty, fetchTimetables } from '../services/dataService';
import { Faculty, TimetableEntry } from '../types';
import { Clock, UserCheck, CalendarDays, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { motion } from 'motion/react';

const SLOTS = [
  { id: 1, label: 'P1', time: '9:00-9:50', isBreak: false },
  { id: 2, label: 'P2', time: '9:50-10:40', isBreak: false },
  { id: 'b1', label: 'BRK', time: '10:40-10:55', isBreak: true },
  { id: 3, label: 'P3', time: '10:55-11:45', isBreak: false },
  { id: 4, label: 'P4', time: '11:45-12:35', isBreak: false },
  { id: 'l1', label: 'LNCH', time: '12:35-1:25', isBreak: true },
  { id: 5, label: 'P5', time: '1:25-2:15', isBreak: false },
  { id: 6, label: 'P6', time: '2:15-3:05', isBreak: false },
  { id: 'b2', label: 'BRK', time: '3:05-3:20', isBreak: true },
  { id: 7, label: 'P7', time: '3:20-4:10', isBreak: false },
];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export default function MasterTimetable({ facultyId }: { facultyId?: string }) {
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [timetables, setTimetables] = useState<TimetableEntry[]>([]);
  const [selectedDay, setSelectedDay] = useState(new Date().toLocaleDateString('en-US', { weekday: 'long' }) === 'Saturday' || new Date().toLocaleDateString('en-US', { weekday: 'long' }) === 'Sunday' ? 'Monday' : new Date().toLocaleDateString('en-US', { weekday: 'long' }));
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [f, t] = await Promise.all([fetchAllFaculty(), fetchTimetables()]);
        setFaculty(f);
        setTimetables(t);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredFaculty = faculty.filter(f => {
    if (facultyId) return f.name === facultyId;
    return f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           f.department.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getEntry = (facultyId: string, facultyName: string, periodId: number | string) => {
    if (typeof periodId !== 'number') return null;
    
    const cleanFacultyName = facultyName.trim().toLowerCase();

    // 1. Try NEW Schema (Single document per teacher with 'schedule' array)
    const newSchemaDoc: any = timetables.find((t: any) => 
      t.name && t.name.trim().toLowerCase() === cleanFacultyName
    );
    if (newSchemaDoc && newSchemaDoc.schedule && newSchemaDoc.schedule[selectedDay]) {
      const subject = newSchemaDoc.schedule[selectedDay][periodId - 1];
      if (subject) return { subject, class: 'AI&DS', room: `R-${100 + periodId}` };
    }
    
    // 2. Try OLD Schema (Separate document per period with 'facultyId')
    const oldSchemaDoc: any = timetables.find((t: any) => 
      t.facultyId === facultyId && 
      t.period === periodId && 
      t.day === selectedDay
    );
    if (oldSchemaDoc && oldSchemaDoc.subject) return oldSchemaDoc;

    return null;
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
        <span className="ml-3 font-bold text-zinc-500">Loading master schedule...</span>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input 
            placeholder="Search faculty..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Tabs value={selectedDay} onValueChange={setSelectedDay} className="w-fit">
          <TabsList className="bg-zinc-100">
            {DAYS.map(day => (
              <TabsTrigger key={day} value={day} className="text-xs">
                {day.slice(0, 3)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <Card className="overflow-hidden border-zinc-200 shadow-sm">
        <CardHeader className="bg-zinc-50 border-b border-zinc-100">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Institutional Master Schedule: {selectedDay}</CardTitle>
              <CardDescription>Visualizing academic hours from 09:00 AM to 04:00 PM.</CardDescription>
            </div>
            <div className="flex items-center space-x-4 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              <div className="flex items-center"><div className="mr-2 h-2 w-2 rounded-full bg-emerald-500" /> Available</div>
              <div className="flex items-center"><div className="mr-2 h-2 w-2 rounded-full bg-zinc-900" /> In Class</div>
              <div className="flex items-center"><div className="mr-2 h-2 w-2 rounded-full bg-amber-400" /> Break</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-zinc-50 hover:bg-zinc-50">
                  <TableHead className="sticky left-0 z-20 w-48 bg-zinc-50 font-bold border-r border-zinc-200">Faculty Member</TableHead>
                  {SLOTS.map(slot => (
                    <TableHead key={slot.id} className={`text-center font-bold px-4 py-3 ${slot.isBreak ? 'bg-amber-50/50' : ''}`}>
                      <div className="flex flex-col items-center">
                        <span className={slot.isBreak ? 'text-amber-700' : 'text-zinc-900'}>{slot.label}</span>
                        <span className="text-[10px] font-normal text-zinc-400 whitespace-nowrap">{slot.time}</span>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFaculty.map((f) => (
                  <TableRow key={f.id} className="group border-b border-zinc-100">
                    <TableCell className="sticky left-0 z-10 w-48 bg-white font-medium border-r border-zinc-200 group-hover:bg-zinc-50">
                      <div className="flex items-center space-x-2">
                        <div className="h-7 w-7 rounded-lg bg-zinc-900 flex items-center justify-center text-[11px] font-bold text-white">
                           {f.name.charAt(0)}
                        </div>
                        <div className="overflow-hidden">
                           <p className="truncate text-sm font-semibold">{f.name}</p>
                           <p className="text-[9px] text-zinc-400 uppercase">{f.department}</p>
                        </div>
                      </div>
                    </TableCell>
                    {SLOTS.map(slot => {
                      if (slot.isBreak) {
                        return (
                          <TableCell key={slot.id} className="p-0 text-center bg-amber-50/30">
                            <div className="h-16 flex items-center justify-center">
                               <span className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-500 -rotate-90">BREAK</span>
                            </div>
                          </TableCell>
                        );
                      }
                      const entry = getEntry(f.id, f.name, slot.id);
                      return (
                        <TableCell key={slot.id} className="p-2 text-center min-w-[140px]">
                          {entry ? (
                            <motion.div 
                              whileHover={{ scale: 1.02 }}
                              className="rounded-lg bg-zinc-900 px-3 py-2 text-white shadow-md border-l-4 border-primary"
                            >
                              <p className="text-[11px] font-bold leading-tight">{entry.subject}</p>
                              <div className="mt-1 flex items-center justify-center space-x-2 text-[9px] text-zinc-400">
                                 <span className="font-medium bg-zinc-800 px-1 rounded">{entry.class}</span>
                                 <span>•</span>
                                 <span>{entry.room}</span>
                              </div>
                            </motion.div>
                          ) : (
                            <div className="group/slot flex flex-col h-12 items-center justify-center rounded-lg border border-dashed border-emerald-200 bg-emerald-50/20 text-emerald-600 transition-all hover:bg-emerald-50 hover:border-emerald-300">
                              <UserCheck className="h-4 w-4 opacity-40 transition-opacity group-hover/slot:opacity-80" />
                              <span className="text-[9px] font-bold tracking-tighter">AVAILABLE</span>
                            </div>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid gap-4 md:grid-cols-3">
         <div className="flex items-start space-x-3 rounded-xl border border-zinc-100 bg-white p-4">
            <Clock className="mt-1 h-5 w-5 text-indigo-500" />
            <div>
               <p className="text-xs font-bold uppercase text-zinc-400">Total Workload</p>
               <p className="text-lg font-bold">Weekly View</p>
               <p className="text-xs text-zinc-500">Based on master records</p>
            </div>
         </div>
         <div className="flex items-start space-x-3 rounded-xl border border-zinc-100 bg-white p-4">
            <UserCheck className="mt-1 h-5 w-5 text-emerald-500" />
            <div>
               <p className="text-xs font-bold uppercase text-zinc-400">Capacity</p>
               <p className="text-lg font-bold">Available Slots</p>
               <p className="text-xs text-zinc-500">Ideal for substitution</p>
            </div>
         </div>
         <div className="flex items-start space-x-3 rounded-xl border border-zinc-100 bg-white p-4">
            <CalendarDays className="mt-1 h-5 w-5 text-orange-500" />
            <div>
               <p className="text-xs font-bold uppercase text-zinc-400">Status</p>
               <p className="text-lg font-bold">Academic Term</p>
               <p className="text-xs text-zinc-500">Spring Semester 2024</p>
            </div>
         </div>
      </div>
    </motion.div>
  );
}
