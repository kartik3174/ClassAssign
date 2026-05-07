import React, { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { toast } from 'sonner';
import { Lock, Eye, EyeOff, ShieldCheck, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import logo from '../assets/sairam-logo.jpg';

interface ResetPasswordProps {
  oobCode: string;
  onComplete: () => void;
}

export default function ResetPassword({ oobCode, onComplete }: ResetPasswordProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    const verifyCode = async () => {
      try {
        const userEmail = await verifyPasswordResetCode(auth, oobCode);
        setEmail(userEmail);
        setIsVerified(true);
      } catch (error: any) {
        toast.error('Invalid or Expired Link', {
          description: 'The password reset link is invalid or has expired. Please request a new one.'
        });
        setTimeout(onComplete, 3000);
      }
    };
    verifyCode();
  }, [oobCode]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password too short', { description: 'Password must be at least 6 characters.' });
      return;
    }

    setLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setResetSuccess(true);
      toast.success('Password Updated Successfully');
    } catch (error: any) {
      toast.error('Failed to reset password', { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (!isVerified) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-zinc-950 text-white font-black italic">
        VERIFYING SECURITY CODE...
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-mesh p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="z-10 w-full max-w-[450px]"
      >
        <Card className="glass border-white/20 shadow-2xl overflow-hidden rounded-3xl">
          {!resetSuccess ? (
            <>
              <CardHeader className="text-center pt-10 pb-6">
                <div className="mx-auto mb-6 flex items-center justify-center">
                  <img src={logo} className="h-16 w-auto object-contain" alt="Sairam Logo" />
                </div>
                <CardTitle className="text-3xl font-black italic uppercase tracking-tighter mb-2">
                  Create <span className="text-indigo-600">Password</span>
                </CardTitle>
                <CardDescription className="text-zinc-600 font-medium">
                  Set a strong password for <span className="text-zinc-900 font-bold">{email}</span>
                </CardDescription>
              </CardHeader>

              <CardContent className="px-8 pb-10">
                <form onSubmit={handleReset} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
                      <Input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="Min. 6 characters" 
                        className="h-12 pl-10 pr-10 rounded-xl bg-white/50 border-zinc-200"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
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

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Confirm Password</label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
                      <Input 
                        type="password" 
                        placeholder="Repeat new password" 
                        className="h-12 pl-10 rounded-xl bg-white/50 border-zinc-200"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="pt-4 space-y-4">
                    <Button 
                      type="submit" 
                      className="h-14 w-full bg-zinc-900 text-white rounded-2xl text-lg font-bold shadow-xl transition-all hover:scale-[1.02]"
                      disabled={loading}
                    >
                      {loading ? 'Updating...' : 'Save Password'}
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      type="button"
                      onClick={onComplete}
                      className="w-full text-zinc-500 font-bold gap-2"
                    >
                      <ArrowLeft className="h-4 w-4" /> Back to Login
                    </Button>
                  </div>
                </form>
              </CardContent>
            </>
          ) : (
            <CardContent className="p-12 text-center space-y-8">
              <div className="mx-auto w-20 h-20 bg-green-50 rounded-full flex items-center justify-center animate-bounce-short">
                <ShieldCheck className="h-10 w-10 text-green-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black italic uppercase tracking-tight text-zinc-900">Security Updated</h3>
                <p className="text-zinc-500 font-medium leading-relaxed">
                  Your password has been changed successfully. You can now use your new credentials to access AI&DS Staff Assign.
                </p>
              </div>
              <Button 
                onClick={onComplete} 
                className="h-14 w-full bg-zinc-900 text-white rounded-2xl text-lg font-bold shadow-xl transition-all hover:scale-[1.02]"
              >
                Continue to Login
              </Button>
            </CardContent>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
