import { useState, useEffect } from 'react';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { getDoc, doc } from 'firebase/firestore';
import { Toaster, toast } from 'sonner';
import { 
  Users, 
  Calendar, 
  LayoutDashboard, 
  LogOut, 
  ChevronRight,
  Menu,
  X,
  Zap,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import FacultyDashboard from './pages/faculty/Dashboard';
import HODDashboard from './pages/hod/Dashboard';
import AdminPanel from './pages/admin/Dashboard';
import StudentDashboard from './pages/student/Dashboard';
import Login from './pages/Login';

import logo from './assets/sairam-logo.jpg';

const SESSION_TIMEOUT = 300; // 5 minutes

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<'faculty' | 'hod' | 'admin' | 'student' | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [timeLeft, setTimeLeft] = useState(SESSION_TIMEOUT);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        // Fetch role from Firestore
        const userDoc = await getDoc(doc(db, 'users', u.uid));
        if (userDoc.exists()) {
          setRole(userDoc.data().role);
        } else {
          // Fallback to localStorage for demo/mock users
          const savedRole = localStorage.getItem('userRole') as any;
          setRole(savedRole || 'student');
        }
      } else {
        const mockName = localStorage.getItem('facultyName');
        if (mockName) {
           setUser({ displayName: mockName, email: `${mockName.toLowerCase()}@sairam.edu.in` } as any);
           setRole(localStorage.getItem('userRole') as any || 'faculty');
        } else {
           setUser(null);
           setRole(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (user && timeLeft > 0) {
      const id = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
             handleLogout();
             return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(id);
    }
  }, [user]);

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.clear();
    setUser(null);
    setRole(null);
    toast.info('Logged out successfully');
  };

  const getNavItems = () => {
    const common = [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }];
    
    if (role === 'faculty') return [...common, { id: 'schedule', label: 'My Schedule', icon: Calendar }];
    if (role === 'hod') return [
      ...common, 
      { id: 'approvals', label: 'Leave Requests', icon: Zap },
      { id: 'staff-timetable', label: 'Staff Timetable', icon: Calendar },
      { id: 'master-staff', label: 'Master Staff', icon: Users }
    ];
    if (role === 'admin') return [...common, { id: 'personnel', label: 'Personnel', icon: Users }, { id: 'logs', label: 'System Logs', icon: Activity }];
    if (role === 'student') return [...common, { id: 'staff-list', label: 'Staff List', icon: Users }];
    return common;
  };

  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-zinc-950 text-white font-black italic">INITIALIZING AI&DS...</div>;
  if (!user) return <Login />;

  const navItems = getNavItems();

  return (
    <div className="min-h-screen bg-[#F8F9FC] text-zinc-900 flex">
      <Toaster position="top-right" richColors />
      
      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-zinc-100 transition-all duration-500 ease-in-out shadow-2xl ${sidebarOpen ? 'w-72' : 'w-0 opacity-0 overflow-hidden'}`}
      >
        <div className="h-20 flex items-center px-8 border-b border-zinc-50">
           <img src={logo} className="h-10 w-auto" alt="Logo" />
           <div className="ml-3">
              <p className="text-xl font-black tracking-tighter italic text-zinc-900 leading-none">AI&DS</p>
              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Staff Assign</p>
           </div>
        </div>

        <nav className="p-6 space-y-2">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${
                activeTab === item.id ? 'bg-zinc-900 text-white shadow-xl' : 'text-zinc-500 hover:bg-zinc-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className="h-5 w-5" />
                <span className="text-sm font-bold">{item.label}</span>
              </div>
              {activeTab === item.id && <ChevronRight className="h-4 w-4" />}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full p-6 space-y-4">
           <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-2">Session Timer</p>
              <div className="h-1.5 w-full bg-zinc-200 rounded-full overflow-hidden">
                 <div className="h-full bg-indigo-600 transition-all" style={{ width: `${(timeLeft / SESSION_TIMEOUT) * 100}%` }} />
              </div>
           </div>
           <Button onClick={handleLogout} variant="outline" className="w-full h-12 rounded-xl font-bold border-zinc-200 text-zinc-500 hover:text-red-600 hover:bg-red-50 hover:border-red-100">
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
           </Button>
        </div>
      </div>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-500 ${sidebarOpen ? 'ml-72' : 'ml-0'}`}>
        <header className="h-20 bg-white/80 backdrop-blur-xl border-b border-zinc-100 sticky top-0 z-40 px-8 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="rounded-xl">
                 {sidebarOpen ? <X /> : <Menu />}
              </Button>
              <div>
                 <h1 className="text-lg font-black uppercase tracking-tight italic">{activeTab}</h1>
                 <Badge variant="outline" className="text-[9px] uppercase tracking-widest font-black border-zinc-200">{role} PERSPECTIVE</Badge>
              </div>
           </div>
           
           <div className="flex items-center gap-3">
              <div className="text-right mr-3 hidden md:block">
                 <p className="text-xs font-black text-zinc-900">{user.displayName}</p>
                 <p className="text-[10px] font-bold text-zinc-400">{user.email}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-zinc-900 flex items-center justify-center text-white font-black">
                 {user.displayName?.[0] || 'A'}
              </div>
           </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
           {role === 'faculty' && <FacultyDashboard activeTab={activeTab} />}
           {role === 'hod' && <HODDashboard activeTab={activeTab} user={user} />}
           {role === 'admin' && <AdminPanel activeTab={activeTab} />}
           {role === 'student' && <StudentDashboard activeTab={activeTab} />}
        </div>
      </main>
    </div>
  );
}
