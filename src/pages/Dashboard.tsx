import { useState, useEffect } from 'react';
import { 
  Users, 
  UserX, 
  AlertCircle,
  TrendingUp,
  Clock,
  Database
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { 
  fetchAllFaculty,
  attendanceCollection,
  substitutionCollection 
} from '../services/dataService';
import { Faculty, Substitution } from '../types';
import { getDocs, query, where } from 'firebase/firestore';
import { toast } from 'sonner';

import { getAISuggestions } from '../services/aiService';
import { Sparkles } from 'lucide-react';

import { motion } from 'motion/react';

export default function Dashboard() {
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [subs, setSubs] = useState<Substitution[]>([]);
  const [absentTodayCount, setAbsentTodayCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [aiInsight, setAiInsight] = useState<string>('Analyzing trends...');

  const loadData = async () => {
    try {
      const f = await fetchAllFaculty() as Faculty[];
      setFaculty(f);

      const date = new Date().toISOString().split('T')[0];
      const attQuery = query(attendanceCollection, where('date', '==', date), where('status', 'in', ['Absent', 'On Duty']));
      const attSnapshot = await getDocs(attQuery);
      setAbsentTodayCount(attSnapshot.size);

      const s = await getDocs(substitutionCollection);
      const subsData = s.docs.map(doc => ({ id: doc.id, ...doc.data() } as Substitution));
      setSubs(subsData);
      
      if (f.length > 0) {
        const insight = await getAISuggestions(f, subsData);
        setAiInsight(insight);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSeed = async () => {
    try {
      setIsSyncing(true);
      const { uploadAllData } = await import('../services/firestoreUploadService');
      await uploadAllData();
      await loadData();
      toast.success('Database synchronized successfully');
    } catch (error: any) {
      toast.error('Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  const totalFaculty = faculty.length;
  const absentToday = absentTodayCount;
  const pendingSubs = subs.filter(s => s.status === 'Requested').length;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10 pb-12"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
           <h2 className="text-4xl font-black tracking-tight text-zinc-900 drop-shadow-sm">
             System <span className="italic" style={{ background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Overview</span>
           </h2>
           <p className="text-zinc-500 font-medium mt-1">Monitoring real-time academic resource allocation.</p>
        </div>
        <div className="flex items-center space-x-3">
           <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Current Status</p>
              <p className="flex items-center text-sm font-bold text-green-500">
                 <div className="mr-1.5 h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                 Database Live
              </p>
           </div>
           <Button onClick={handleSeed} disabled={isSyncing} className="h-11 rounded-xl bg-zinc-900 shadow-lg shadow-zinc-200">
              <Database className="mr-2 h-4 w-4" />
              {isSyncing ? 'Syncing...' : 'Sync Data'}
           </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <motion.div
           initial={{ scale: 0.95, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           transition={{ delay: 0.1 }}
           className="col-span-full"
        >
          <Card className="glass border-primary/20 bg-white/40 card-shadow overflow-hidden relative group">
            <div className="absolute -top-12 -right-12 p-4 opacity-5 transition-transform duration-700 group-hover:scale-110 group-hover:rotate-12">
               <Sparkles className="h-48 w-48 text-primary" />
            </div>
            <CardHeader className="flex flex-row items-center space-x-2 pb-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              </div>
              <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-primary">AI Strategy & Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold leading-relaxed text-zinc-800 italic">
                "{faculty.length === 0 ? "Sync data to generate AI insights." : aiInsight}"
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {[
          { title: 'Total Faculty', icon: Users, color: 'text-white', value: totalFaculty, sub: 'Database Status', bg: 'bg-gradient-blue' },
          { title: 'Absent Today', icon: UserX, color: 'text-white', value: absentToday, sub: 'Substitutions Needed', bg: 'bg-gradient-primary' },
          { title: 'Pending Subs', icon: Clock, color: 'text-white', value: pendingSubs, sub: 'Awaiting Action', bg: 'bg-gradient-orange' },
          { title: 'System Health', icon: TrendingUp, color: 'text-white', value: '98.4%', sub: 'Load Efficiency', bg: 'bg-gradient-purple' },
        ].map((stat, idx) => (
          <motion.div
            key={stat.title}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 + idx * 0.1 }}
            className="hover-lift"
          >
            <Card className="border-white/40 bg-white/60 backdrop-blur-xl card-shadow transition-all hover:bg-white/80 overflow-hidden relative">
              <div className={`absolute top-0 right-0 h-1 w-full ${stat.bg}`} />
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{stat.title}</CardTitle>
                <div className={`p-2 rounded-xl ${stat.bg} shadow-lg shadow-zinc-200/50`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-black text-zinc-900 tracking-tight">{stat.value}</div>
                <div className="mt-2 flex items-center space-x-1">
                   <div className={`h-1.5 w-1.5 rounded-full ${stat.bg.replace('bg-', 'bg-').replace('50', '500')}`} />
                   <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">{stat.sub}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2 card-shadow border-zinc-100">
          <CardHeader className="border-b border-zinc-50 pb-6">
            <CardTitle className="flex items-center text-lg font-bold">
              <TrendingUp className="mr-2 h-5 w-5 text-indigo-500" />
              Faculty Workload Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-6 sm:grid-cols-2">
              {faculty.slice(0, 6).map(f => (
                <div key={f.id} className="group rounded-2xl border border-zinc-50 bg-zinc-50/30 p-4 transition-all hover:bg-white hover:border-zinc-100">
                  <div className="mb-3 flex justify-between text-sm">
                    <div>
                      <p className="font-bold text-zinc-900">{f.name}</p>
                      <p className="text-[10px] font-medium text-zinc-400">{f.department}</p>
                    </div>
                    <Badge variant="outline" className="h-fit bg-white font-black">{f.workload}H</Badge>
                  </div>
                  <Progress value={(f.workload / 25) * 100} className="h-2 bg-zinc-200" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow border-zinc-100">
          <CardHeader className="border-b border-zinc-50 pb-6">
            <CardTitle className="flex items-center text-lg font-bold">
              <Clock className="mr-2 h-5 w-5 text-amber-500" />
              Activity Stream
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {subs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                   <AlertCircle className="mb-2 h-10 w-10 text-zinc-100" />
                   <p className="text-xs font-bold text-zinc-300 uppercase tracking-widest">No Recent Logs</p>
                </div>
              ) : (
                subs.slice(0, 6).map(s => (
                  <div key={s.id} className="relative flex items-start space-x-4 pb-4 last:pb-0">
                    <div className="absolute top-0 left-[11px] h-full w-[2px] bg-zinc-50 last:hidden" />
                    <div className={`z-10 mt-1 h-6 w-6 shrink-0 rounded-full border-4 border-white shadow-sm ${
                      s.status === 'Accepted' ? 'bg-green-500' : 'bg-amber-500'
                    }`} />
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center justify-between">
                         <p className="truncate text-xs font-bold text-zinc-900">{s.subject}</p>
                         <span className="text-[9px] font-black text-zinc-300 uppercase">P{s.period}</span>
                      </div>
                      <p className="truncate text-[10px] font-medium text-zinc-400">{s.class} • Status: {s.status}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
