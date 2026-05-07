import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { Faculty, SystemLog, UserRole } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { toast } from 'sonner';
import { Users, Activity, Settings, Plus, Trash2, Edit2, Search, Database, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import timetableData from '../../Data/timetable.json';
import { addDoc } from 'firebase/firestore';

export default function AdminPanel({ activeTab = 'dashboard' }: { activeTab?: string }) {
  const [users, setUsers] = useState<Faculty[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const handleSyncTimetable = async () => {
    setSyncing(true);
    try {
      const timetableRef = collection(db, 'timetable');
      let count = 0;
      
      for (const [facultyName, schedule] of Object.entries(timetableData)) {
        for (const [day, periods] of Object.entries(schedule)) {
          for (let i = 0; i < (periods as any[]).length; i++) {
            const subject = (periods as any[])[i];
            if (subject) {
              await addDoc(timetableRef, {
                facultyId: facultyName,
                day: day,
                period: i + 1,
                subject: subject,
                class: 'III AI&DS',
                department: 'AI&DS',
                room: 'B-101',
                type: subject.toLowerCase().includes('lab') ? 'Lab' : 'Theory'
              });
              count++;
            }
          }
        }
      }
      toast.success(`Successfully synced ${count} timetable entries!`);
    } catch (error) {
      toast.error('Sync failed');
    } finally {
      setSyncing(false);
    }
  };
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'faculty' as UserRole,
    department: 'AI&DS',
    designation: 'Assistant Professor'
  });

  useEffect(() => {
    // 1. Fetch Users
    const uQuery = collection(db, 'faculty');
    const unsubscribeUsers = onSnapshot(uQuery, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Faculty)));
    });

    // 2. Fetch Logs
    const lQuery = collection(db, 'logs');
    const unsubscribeLogs = onSnapshot(lQuery, (snapshot) => {
      setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SystemLog)));
    });

    return () => {
      unsubscribeUsers();
      unsubscribeLogs();
    };
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const id = newUser.email.split('@')[0];
      await setDoc(doc(db, 'faculty', id), {
        ...newUser,
        id,
        subjects: [],
        workload: 0,
        isAvailable: true,
        continuousClasses: 0,
        acceptanceRate: 1.0,
      });
      toast.success('User added successfully');
      setIsAddingUser(false);
    } catch (error) {
      toast.error('Failed to add user');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteDoc(doc(db, 'faculty', id));
        toast.success('User deleted');
      } catch (error) {
        toast.error('Deletion failed');
      }
    }
  };

  // Remove duplicate names
  const uniqueUsers = Array.from(new Map(users.map(u => [u.name.trim().toLowerCase(), u])).values());

  const filteredUsers = uniqueUsers.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCleanupDuplicates = async () => {
    if (!window.confirm('This will permanently remove duplicate staff records (same name) from the database. Continue?')) return;
    
    setSyncing(true);
    try {
      const nameMap = new Map<string, string[]>();
      users.forEach(u => {
        const name = u.name.trim().toLowerCase();
        if (!nameMap.has(name)) nameMap.set(name, []);
        nameMap.get(name)!.push(u.id);
      });

      let count = 0;
      for (const [_name, ids] of nameMap.entries()) {
        if (ids.length > 1) {
          const toDelete = ids.slice(1);
          for (const id of toDelete) {
            await deleteDoc(doc(db, 'faculty', id));
            count++;
          }
        }
      }
      toast.success(`Removed ${count} duplicate staff records!`);
    } catch (error) {
      toast.error('Cleanup failed');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-10 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-4xl font-black text-zinc-900 tracking-tighter uppercase italic">
            Admin <span className="text-indigo-600">{activeTab === 'dashboard' ? 'Core' : activeTab.replace('-', ' ')}</span>
          </h1>
          <p className="text-zinc-500 font-medium mt-1">
            {activeTab === 'dashboard' && "System-wide configuration and security."}
            {activeTab === 'personnel' && "Manage and monitor faculty accounts."}
            {activeTab === 'logs' && "Historical and real-time activity tracking."}
          </p>
        </motion.div>
        
        {activeTab === 'personnel' && (
          <Button 
            onClick={() => setIsAddingUser(!isAddingUser)}
            className="h-14 px-8 rounded-2xl bg-zinc-900 hover:bg-indigo-600 text-white font-bold shadow-2xl transition-all gap-3"
          >
            <Plus className="h-5 w-5" />
            Add New User
          </Button>
        )}
      </div>

      {activeTab === 'dashboard' && (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="glass shadow-sm border-none overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><Users className="h-24 w-24" /></div>
              <CardHeader className="pb-2">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Total Personnel</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-black text-zinc-900">{uniqueUsers.length}</div>
                <p className="text-xs font-bold text-zinc-400 mt-1 uppercase tracking-tighter">Registered in Database</p>
              </CardContent>
            </Card>

            <Card className="glass shadow-sm border-none overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><Activity className="h-24 w-24" /></div>
              <CardHeader className="pb-2">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-zinc-400">System Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-black text-indigo-600">{logs.length}</div>
                <p className="text-xs font-bold text-zinc-400 mt-1 uppercase tracking-tighter">Historical Events Tracked</p>
              </CardContent>
            </Card>

            <Card className="glass shadow-sm border-none overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><Activity className="h-24 w-24" /></div>
              <CardHeader className="pb-2">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Admin Logins</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-black text-amber-600">
                  {logs.filter(l => l.type === 'Auth' && (l.message.includes('Admin') || l.message.includes('KARTIK'))).length}
                </div>
                <p className="text-xs font-bold text-zinc-400 mt-1 uppercase tracking-tighter">Total Sessions Tracked</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <Card className="border-zinc-200 bg-white/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xs font-black uppercase tracking-widest text-zinc-400">System Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={handleSyncTimetable}
                  disabled={syncing}
                  variant="outline" 
                  className="w-full justify-start rounded-xl font-bold text-xs h-12 border-dashed border-zinc-300 hover:border-indigo-500 hover:text-indigo-600 transition-all"
                >
                  {syncing ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
                  {syncing ? 'Syncing...' : 'Sync Timetable Data'}
                </Button>
                <Button 
                  onClick={handleCleanupDuplicates}
                  disabled={syncing}
                  variant="outline" 
                  className="w-full justify-start rounded-xl font-bold text-xs h-12 border-dashed border-zinc-300 hover:border-red-500 hover:text-red-600 transition-all"
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Cleanup Duplicate Staff
                </Button>
                <Button variant="outline" className="w-full justify-start rounded-xl font-bold text-xs h-12 border-dashed border-zinc-300">
                  <Settings className="mr-2 h-4 w-4" /> Global Constraints
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 text-white shadow-2xl border-none">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400">Recent Activity</CardTitle>
                <Activity className="h-4 w-4 text-indigo-400 animate-pulse" />
              </CardHeader>
              <CardContent className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                {logs.slice(0, 5).sort((a,b) => b.timestamp.localeCompare(a.timestamp)).map(log => (
                  <div key={log.id} className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs">
                    <div className="flex justify-between mb-1">
                      <span className={`font-black uppercase tracking-widest text-[9px] ${
                        log.type === 'Substitution' ? 'text-emerald-400' : 
                        log.type === 'Auth' ? 'text-indigo-400' : 'text-zinc-400'
                      }`}>{log.type}</span>
                      <span className="text-zinc-600 text-[9px]">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-zinc-300 font-medium leading-relaxed">{log.message}</p>
                  </div>
                ))}
                {logs.length === 0 && <p className="text-zinc-500 text-center py-10">No recent activity</p>}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {activeTab === 'personnel' && (
        <div className="space-y-6">
          <Card className="border-none shadow-xl bg-white/60 backdrop-blur-xl">
            <CardHeader className="border-b border-zinc-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input 
                  placeholder="Search personnel..." 
                  className="pl-10 h-10 rounded-xl bg-zinc-50/50 border-none text-sm w-full"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <Badge variant="outline" className="font-bold w-fit">{uniqueUsers.length} Total</Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left min-w-[700px]">
                  <thead className="bg-zinc-50/50 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    <tr>
                      <th className="px-6 py-4">Name & Email</th>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4">Dept</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b border-zinc-50 hover:bg-white transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-zinc-900">{user.name}</p>
                          <p className="text-[10px] text-zinc-400">{user.email}</p>
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={`uppercase text-[9px] font-black ${
                            user.role === 'admin' ? 'bg-red-100 text-red-600' : 
                            user.role === 'hod' ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'
                          } border-none`}>
                            {user.role}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 font-medium text-zinc-500">{user.department}</td>
                        <td className="px-6 py-4 text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-zinc-400 hover:text-indigo-600"><Edit2 className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-zinc-400 hover:text-red-600" onClick={() => handleDeleteUser(user.id)}><Trash2 className="h-4 w-4" /></Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-zinc-900 text-white shadow-2xl border-none overflow-hidden rounded-[2rem]">
              <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 pb-6">
                <div>
                  <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400">System-wide Event Log</CardTitle>
                  <p className="text-[10px] text-zinc-500 mt-1 uppercase font-bold">Real-time audit trail of all actions</p>
                </div>
                <Activity className="h-5 w-5 text-indigo-400 animate-pulse" />
              </CardHeader>
              <CardContent className="p-0 max-h-[700px] overflow-y-auto custom-scrollbar">
                <div className="divide-y divide-white/5">
                  {logs.sort((a,b) => b.timestamp.localeCompare(a.timestamp)).map(log => (
                    <div key={log.id} className="p-6 hover:bg-white/5 transition-colors group">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className={`uppercase text-[9px] font-black border-none px-0 ${
                            log.type === 'Substitution' ? 'text-emerald-400' : 
                            log.type === 'Auth' ? 'text-indigo-400' : 'text-zinc-400'
                          }`}>{log.type}</Badge>
                          <span className="h-1 w-1 rounded-full bg-zinc-800" />
                          <span className="text-zinc-600 text-[10px] font-bold uppercase tracking-tight">{new Date(log.timestamp).toLocaleDateString()}</span>
                          <span className="text-zinc-600 text-[10px] font-bold uppercase tracking-tight">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </div>
                      <p className="text-sm text-zinc-300 font-medium leading-relaxed group-hover:text-white transition-colors">{log.message}</p>
                    </div>
                  ))}
                  {logs.length === 0 && (
                    <div className="py-32 text-center">
                      <div className="h-16 w-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Activity className="h-8 w-8 text-zinc-700" />
                      </div>
                      <p className="text-zinc-500 font-black uppercase tracking-[0.2em] text-xs">No activity records found</p>
                      <p className="text-zinc-700 text-[10px] mt-2 font-bold uppercase">Activity will appear here as users interact with the system</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-none shadow-xl bg-white rounded-[2rem] overflow-hidden">
              <CardHeader className="bg-zinc-50 border-b border-zinc-100">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-zinc-500">Security Insights</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div>
                  <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4">Login Distribution</h4>
                  <div className="space-y-4">
                    {['Admin', 'HOD', 'Faculty', 'Student'].map(role => {
                      const count = logs.filter(l => l.type === 'Auth' && l.message.toLowerCase().includes(role.toLowerCase())).length;
                      const total = logs.filter(l => l.type === 'Auth').length || 1;
                      const percentage = (count / total) * 100;
                      
                      return (
                        <div key={role} className="space-y-1.5">
                          <div className="flex justify-between text-[10px] font-bold uppercase">
                            <span className="text-zinc-600">{role}</span>
                            <span className="text-zinc-400">{count} Logins</span>
                          </div>
                          <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }} 
                              animate={{ width: `${percentage}%` }}
                              className={`h-full ${
                                role === 'Admin' ? 'bg-indigo-500' :
                                role === 'HOD' ? 'bg-emerald-500' :
                                role === 'Faculty' ? 'bg-blue-500' : 'bg-amber-500'
                              }`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-100">
                  <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100">
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Last Admin Session</p>
                    <p className="text-sm font-bold text-indigo-900">
                      {logs.find(l => l.type === 'Auth' && l.message.includes('Admin')) 
                        ? new Date(logs.find(l => l.type === 'Auth' && l.message.includes('Admin'))!.timestamp).toLocaleString() 
                        : 'No session recorded'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {isAddingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-md">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-3xl overflow-hidden">
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black italic uppercase tracking-tighter">Add <span className="text-indigo-600">Personnel</span></h2>
                <Button variant="ghost" onClick={() => setIsAddingUser(false)} className="rounded-full h-10 w-10 p-0">×</Button>
              </div>

              <form onSubmit={handleAddUser} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Full Name</label>
                  <Input value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="h-12 rounded-xl" required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Email Address</label>
                  <Input type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="h-12 rounded-xl" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Role</label>
                    <select 
                      className="w-full h-12 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium outline-none"
                      value={newUser.role}
                      onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})}
                    >
                      <option value="faculty">Faculty</option>
                      <option value="hod">HOD</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Dept</label>
                    <Input value={newUser.department} disabled className="h-12 rounded-xl bg-zinc-50" />
                  </div>
                </div>
                <Button type="submit" className="w-full h-14 rounded-2xl bg-indigo-600 text-white font-bold text-lg shadow-xl shadow-indigo-200">
                  Register User
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
