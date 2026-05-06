import React, { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { 
  Mail, 
  Lock, 
  ShieldCheck, 
  RefreshCw,
  ArrowRight,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import logo from '../assets/sairam-logo.jpg';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'faculty' | 'hod' | 'admin' | 'student'>('faculty');

  const AUTHORIZED_FACULTY = [
    "Dr.Suganthi", "Mr.J.Jeya Ganesan", "Mr.B.Ravi Kumar", "Mr.S.Gopinathan",
    "Dr. A. Rajasekar", "Ms.T.Uma Mageswari", "Mrs.S.Kirithika", "Ms.J.Ilakkiya",
    "Ms.J.Anitha", "Ms. M. Ganga", "Dr.S.Parvathi", "Dr.P.Vijayakumari",
    "Ms.S.Anusuya", "Ms.D.Madhi Vadhani", "Dr. A. Raja Brundha", "Ms.R.Krishnapriya",
    "Ms. R. Noousheen", "Ms.R.Vijayalakshmi", "Dr. C.R. Senthilnathan",
    "Dr.K.Baranidharan", "Dr. R. Avudainayaki", "Dr. M. Devendran"
  ];

  const AUTHORIZED_STUDENTS = ["MADHUMITHA VD", "SRIKANTH R"];

  const generateCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptcha(result);
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  const isEmailAllowed = (userEmail: string) => {
    const lowEmail = userEmail.toLowerCase();
    return lowEmail.includes('sairamit') || lowEmail.includes('sairam');
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      
      const userEmail = result.user.email || '';
      if (!isEmailAllowed(userEmail)) {
        await auth.signOut();
        toast.error('Access Restricted', {
          description: 'Only Sairam Institution emails (sairamit/sairam) are permitted.'
        });
        return;
      }

      if (selectedRole === 'hod' && result.user.displayName !== 'Dr.Suganthi' && result.user.email !== 'suganthi@sairamit.edu.in') {
        await auth.signOut();
        toast.error('Access Restricted', {
          description: 'Only Dr. Suganthi is authorized to access the HOD portal.'
        });
        return;
      }

      if (selectedRole === 'admin' && result.user.displayName !== 'KARTIK SINGH' && result.user.email !== 'kartik.singh@sairamit.edu.in') {
        await auth.signOut();
        toast.error('Access Restricted', {
          description: 'Only KARTIK SINGH is authorized to access the Admin portal.'
        });
        return;
      }

      if (selectedRole === 'student') {
        const isAuthorizedStudent = AUTHORIZED_STUDENTS.some(
          s => s.toLowerCase() === result.user.displayName?.toLowerCase() || 
               s.toLowerCase().replace(' ', '.') + '@sairamit.edu.in' === result.user.email?.toLowerCase()
        );
        
        if (!isAuthorizedStudent) {
          await auth.signOut();
          toast.error('Access Restricted', {
            description: 'Only MADHUMITHA VD and SRIKANTH R are authorized to access the Student portal.'
          });
          return;
        }
      }
      
      localStorage.setItem('userRole', selectedRole);
      localStorage.setItem('facultyName', result.user.displayName || '');
      
      // Save role in Firestore
      const { createUserProfile } = await import('@/services/dataService');
      await createUserProfile(result.user.uid, {
        name: result.user.displayName,
        email: result.user.email,
        role: selectedRole,
        department: 'AI&DS'
      });

      toast.success(`Logged in successfully as ${selectedRole} with Google`);
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
        toast.error(error.message || 'Google login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (captchaInput.toUpperCase() !== captcha) {
      toast.error('Invalid Captcha');
      generateCaptcha();
      setCaptchaInput('');
      return;
    }

    // Special handling for Faculty Name Login
    if (selectedRole === 'faculty') {
      const matchedFaculty = AUTHORIZED_FACULTY.find(f => f.toLowerCase() === email.toLowerCase());
      if (matchedFaculty) {
        localStorage.setItem('userRole', 'faculty');
        localStorage.setItem('facultyName', matchedFaculty);
        toast.success(`Welcome ${matchedFaculty}`, {
          description: "Accessing your personal timetable..."
        });
        window.location.reload();
        return;
      }
    }

    // Special handling for HOD login
    if (selectedRole === 'hod') {
      if (email !== 'Dr.Suganthi') {
        toast.error('Access Denied', {
          description: 'Only authorized HOD (Dr. Suganthi) can access this portal.'
        });
        return;
      }
      localStorage.setItem('userRole', 'hod');
      localStorage.setItem('facultyName', 'Dr.Suganthi');
      toast.success('Welcome HOD Dr. Suganthi');
      window.location.reload();
      return;
    }

    // Special handling for Admin login
    if (selectedRole === 'admin') {
      if (email.toUpperCase() !== 'KARTIK SINGH') {
        toast.error('Access Denied', {
          description: 'Only KARTIK SINGH is authorized to access the Admin portal.'
        });
        return;
      }
      localStorage.setItem('userRole', 'admin');
      localStorage.setItem('facultyName', 'KARTIK SINGH');
      toast.success('Welcome Admin KARTIK SINGH');
      window.location.reload();
      return;
    }

    // Special handling for Student login
    if (selectedRole === 'student') {
      const lowEmail = email.toLowerCase();
      const matchedStudent = AUTHORIZED_STUDENTS.find(s => 
        s.toLowerCase() === lowEmail || 
        (s.toLowerCase().replace(' ', '.') + '@sairamit.edu.in') === lowEmail
      );
      if (matchedStudent) {
        localStorage.setItem('userRole', 'student');
        localStorage.setItem('facultyName', matchedStudent);
        toast.success(`Welcome CR ${matchedStudent}`);
        window.location.reload();
        return;
      } else {
        toast.error('Access Denied', {
          description: 'Only MADHUMITHA VD and SRIKANTH R are authorized to access the Student portal.'
        });
        return;
      }
    }

    if (!isEmailAllowed(email)) {
      toast.error('Access Restricted', {
        description: 'Manual login also requires a Sairam Institution authorized email.'
      });
      return;
    }

    try {
      setLoading(true);
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
        // Save role in local storage for demo (In production, use Firestore user profile)
        localStorage.setItem('userRole', selectedRole);
        toast.success('Account created successfully', {
          description: `Welcome to AI&DS Staff Assign! You are now signed in as ${selectedRole}.`
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        localStorage.setItem('userRole', selectedRole);
        toast.success(`Logged in successfully as ${selectedRole}`);
      }
    } catch (error: any) {
      console.error("Auth Error:", error.code, error.message);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        toast.error('Authentication Failed', {
          description: 'Invalid email or password. If you haven\'t created an account yet, click Sign Up below.',
          action: {
            label: 'Sign Up Now',
            onClick: () => setIsRegistering(true)
          }
        });
      } else if (error.code === 'auth/email-already-in-use') {
        toast.error('Registration Failed', {
          description: 'This email is already registered. Please sign in instead.',
          action: {
            label: 'Sign In',
            onClick: () => setIsRegistering(false)
          }
        });
      } else if (error.code === 'auth/weak-password') {
        toast.error('Weak Password', {
          description: 'Password should be at least 6 characters long.'
        });
      } else {
        toast.error('Authentication Error', {
          description: error.message || 'An unexpected error occurred.'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-mesh p-4">
      {/* Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] h-[40%] w-[40%] rounded-full bg-primary/20 blur-[120px] animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] right-[-10%] h-[40%] w-[40%] rounded-full bg-accent/20 blur-[120px] animate-pulse-slow"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="z-10 w-full max-w-[450px]"
      >
        <Card className="glass border-white/20 shadow-2xl overflow-hidden rounded-3xl">
          <CardHeader className="text-center pt-10 pb-6">
            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 12 }}
              className="mx-auto mb-6 flex items-center justify-center"
            >
              <img src={logo} className="h-20 w-auto object-contain drop-shadow-xl" alt="Sairam Logo" />
            </motion.div>
            <CardTitle className="flex flex-col items-center mb-2">
              <span className="text-6xl font-black italic tracking-tighter drop-shadow-md" style={{ background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>AI&DS</span>
              <span className="text-sm font-bold uppercase tracking-[0.3em] text-zinc-500">Staff Assign</span>
            </CardTitle>
            <CardDescription className="text-zinc-600 font-medium">
              Intelligent Faculty Resource Management
            </CardDescription>
            
            <div className="flex flex-col items-center space-y-4 mt-6">
              <div className="flex justify-center p-1 bg-zinc-100 rounded-2xl w-fit mx-auto">
                {(['faculty', 'hod', 'admin', 'student'] as const).map((role) => (
                  <button
                    key={role}
                    onClick={() => setSelectedRole(role)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      selectedRole === role 
                        ? 'bg-zinc-900 text-white shadow-lg' 
                        : 'text-zinc-400 hover:text-zinc-600'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setLoading(true);
                  const promise = new Promise((resolve) => setTimeout(resolve, 1500));
                  toast.promise(promise, {
                    loading: 'Synchronizing system data...',
                    success: 'Data synchronized successfully',
                    error: 'Synchronization failed',
                  });
                  promise.finally(() => {
                    setLoading(false);
                    generateCaptcha();
                  });
                }}
                disabled={loading}
                className="h-9 px-4 rounded-xl border-dashed border-zinc-300 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-indigo-600 hover:border-indigo-300 transition-all gap-2"
              >
                <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                Sync Data
              </Button>
            </div>
          </CardHeader>

          <CardContent className="px-8 pb-10">
            <AnimatePresence mode="wait">
              {!showManual ? (
                <motion.div
                  key="social"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  <Button 
                    variant="outline" 
                    onClick={handleGoogleLogin} 
                    className="h-14 w-full bg-white text-zinc-800 border-zinc-200 hover:bg-zinc-50 rounded-2xl text-lg font-bold shadow-sm transition-all hover:shadow-md"
                    disabled={loading}
                  >
                    <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Continue with Google
                  </Button>
                  
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-zinc-200"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-transparent px-2 text-zinc-500 font-bold backdrop-blur-sm">Or use administration login</span>
                    </div>
                  </div>

                  <Button 
                    variant="ghost" 
                    onClick={() => setShowManual(true)}
                    className="w-full h-12 text-zinc-600 hover:text-primary font-bold group"
                  >
                    Use Email & Password
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </motion.div>
              ) : (
                <motion.form
                  key="manual"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleManualLogin}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
                      <Input 
                        type={selectedRole === 'faculty' || selectedRole === 'hod' || selectedRole === 'admin' || selectedRole === 'student' ? "text" : "email"} 
                        placeholder={
                          selectedRole === 'faculty' ? "Enter Faculty Name" : 
                          selectedRole === 'hod' ? "Enter HOD Name" :
                          selectedRole === 'admin' ? "Enter Admin Name" :
                          "Enter Student Name"
                        } 
                        className="h-12 pl-10 rounded-xl bg-white/50 border-zinc-200"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
                      <Input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="Password" 
                        className="h-12 pl-10 pr-10 rounded-xl bg-white/50 border-zinc-200"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-zinc-400 hover:text-zinc-600"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3 rounded-2xl bg-zinc-50/50 p-4 border border-zinc-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Verification</span>
                      </div>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6" 
                        onClick={generateCaptcha}
                      >
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex h-12 flex-1 items-center justify-center rounded-xl bg-zinc-900 font-mono text-xl font-black italic tracking-widest text-white select-none">
                        {captcha}
                      </div>
                      <Input 
                        placeholder="Type here..." 
                        className="h-12 w-32 rounded-xl bg-white text-center font-bold"
                        value={captchaInput}
                        onChange={(e) => setCaptchaInput(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                   <div className="pt-2 space-y-3">
                    <Button 
                      type="submit" 
                      className="h-14 w-full bg-gradient-premium rounded-2xl text-lg font-bold shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:scale-[1.02]"
                      disabled={loading}
                    >
                      {loading ? 'Processing...' : (isRegistering ? 'Create Account' : 'Sign In Now')}
                    </Button>
                    
                    <Button 
                      variant="link" 
                      type="button"
                      onClick={() => setIsRegistering(!isRegistering)}
                      className="w-full text-primary font-bold"
                    >
                      {isRegistering ? 'Already have an account? Sign In' : 'Need an administrator account? Sign Up'}
                    </Button>

                    <Button 
                      variant="ghost" 
                      type="button"
                      onClick={() => {
                        setShowManual(false);
                        setIsRegistering(false);
                      }}
                      className="w-full text-xs font-bold text-zinc-500 hover:text-zinc-800"
                    >
                      Back to Social Login
                    </Button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
        
        <p className="mt-8 text-center text-xs font-medium text-zinc-400">
          © 2026 AI&DS Staff Assign • Secure Academic Infrastructure
        </p>
      </motion.div>
    </div>
  );
}
