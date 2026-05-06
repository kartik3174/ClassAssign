import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Substitution } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

const COURSES = [
  { code: '20AIPC601', name: 'Robotics Process Automation', abv: 'RPA', type: 'CORE', hrs: 5, staff: 'Dr. A. Rajasekar' },
  { code: '20AIPW602', name: 'Big Data Analytics with Laboratory', abv: 'BDA', type: 'CORE', hrs: 5, staff: 'Mrs.S.Kirithika' },
  { code: '20AIPW603', name: 'Optimization Techniques for Programming with Laboratory', abv: 'OTP', type: 'CORE', hrs: 5, staff: 'Ms.S.Anusuya' },
  { code: '20HSMC501', name: 'Universal Human Values 2: Understanding Harmony', abv: 'UHV-II', type: 'OPEN ELECTIVE', hrs: 5, staff: 'Ms.T.Uma Mageswari' },
  { code: '20AIEL602', name: 'Wireless Sensor Networks', abv: 'WSN', type: 'PROF ELECTIVE', hrs: 4, staff: 'Dr.P.Vijayakumari' },
  { code: '20AIEL603', name: 'Information Retrieval Techniques', abv: 'IRT', type: 'PROF ELECTIVE', hrs: 4, staff: 'Ms.J.Ilakkiya' },
  { code: '20AIEL605', name: 'Cryptography and Network security', abv: 'CNS', type: 'PROF ELECTIVE', hrs: 4, staff: 'Ms. M. Ganga' },
  { code: '20AIEL608', name: 'Agent Based Intelligent System', abv: 'ABIS', type: 'PROF ELECTIVE', hrs: 4, staff: 'Ms.J.Anitha' },
  { code: '20AIPL601', name: 'Robotics Laboratory', abv: 'RB LAB', type: 'LAB', hrs: 3, staff: 'Dr. A. Rajasekar' },
  { code: '20AIP 601', name: 'Innovative Design Project', abv: 'IDP LAB', type: 'LAB', hrs: 3, staff: 'Ms. M. Ganga' },
  { code: '20HSPL501', name: 'Communication and Soft Skills Laboratory', abv: 'CS LAB', type: 'LAB', hrs: 2, staff: 'Ms.P.Yamini' },
  { code: '20AITP501', name: 'Skill Enhancement', abv: 'SE', type: 'VA', hrs: 2, staff: 'Mrs.S.Kirithika' },
  { code: 'NPTEL', name: 'NPTEL Online Course', abv: 'NPTEL', type: 'ONLINE', hrs: 1, staff: 'Dr.P.Vijayakumari' },
];

const ELECTIVE_STR = "20AIEL602-WSN/20AIEL603-IRT/20AIEL605-CNS/20AIEL608-ABIS";

const WEEKLY_TIMETABLE: Record<string, any[]> = {
  'Monday': [
    { type: 'subject', code: '20AITP601', abv: 'SE', staff: 'Mrs.S.Kirithika', p: 1 },
    { type: 'subject', code: '20HSMC501', abv: 'UHV', staff: 'Ms.T.Uma Mageswari', p: 2 },
    { type: 'break', name: 'Short Break' },
    { type: 'subject', code: '20AIPW602', abv: 'BDA', staff: 'Mrs.S.Kirithika', p: 3 },
    { type: 'subject', code: '20AIPW603', abv: 'OTP', staff: 'Ms.S.Anusuya', p: 4 },
    { type: 'break', name: 'Lunch' },
    { type: 'subject', code: '20AIPL601', abv: 'Robotics Lab', staff: 'Dr. A. Rajasekar', p: 6, span: 2 },
    { type: 'break', name: 'Short Break' },
    { type: 'subject', code: '20AIPL601', abv: 'Robotics Lab', staff: 'Dr. A. Rajasekar', p: 8 },
  ],
  'Tuesday': [
    { type: 'subject', code: '20AIPW603', abv: 'OTP Lab', staff: 'Ms.S.Anusuya', p: 1, span: 2 },
    { type: 'break', name: 'Short Break' },
    { type: 'subject', code: '20HSMC501', abv: 'UHV', staff: 'Ms.T.Uma Mageswari', p: 3 },
    { type: 'subject', code: 'NPTEL', abv: 'NPTEL', staff: 'Dr.P.Vijayakumari', p: 4 },
    { type: 'break', name: 'Lunch' },
    { type: 'subject', code: '20AIPW603', abv: 'OTP', staff: 'Ms.S.Anusuya', p: 6 },
    { type: 'subject', code: '20AIPW602', abv: 'BDA', staff: 'Mrs.S.Kirithika', p: 7 },
    { type: 'break', name: 'Short Break' },
    { type: 'subject', code: '20AIPC601', abv: 'RPA', staff: 'Dr. A. Rajasekar', p: 8 },
  ],
  'Wednesday': [
    { type: 'subject', code: '20AIPC601', abv: 'RPA', staff: 'Dr. A. Rajasekar', p: 1 },
    { type: 'subject', code: '20AIPW602', abv: 'BDA', staff: 'Mrs.S.Kirithika', p: 2 },
    { type: 'break', name: 'Short Break' },
    { type: 'subject', code: '20AIPW602', abv: 'BDA Lab', staff: 'Mrs.S.Kirithika', p: 3, span: 2 },
    { type: 'break', name: 'Lunch' },
    { type: 'subject', code: '20AIPC601', abv: 'RPA', staff: 'Dr. A. Rajasekar', p: 6 },
    { type: 'subject', code: '20HSMC501', abv: 'UHV', staff: 'Ms.T.Uma Mageswari', p: 7 },
    { type: 'break', name: 'Short Break' },
    { type: 'subject', code: 'Elective', abv: ELECTIVE_STR, staff: 'Multiple Staff', p: 8 },
  ],
  'Thursday': [
    { type: 'subject', code: 'Elective', abv: ELECTIVE_STR, staff: 'Multiple Staff', p: 1 },
    { type: 'subject', code: '20AIPC601', abv: 'RPA', staff: 'Dr. A. Rajasekar', p: 2 },
    { type: 'break', name: 'Short Break' },
    { type: 'subject', code: '20AITP601', abv: 'SE', staff: 'Mrs.S.Kirithika', p: 3 },
    { type: 'subject', code: 'Elective', abv: ELECTIVE_STR, staff: 'Multiple Staff', p: 4 },
    { type: 'break', name: 'Lunch' },
    { type: 'subject', code: '20HSPL501', abv: 'Communication and Soft Skills Lab', staff: 'Ms.P.Yamini', p: 6, span: 2 },
    { type: 'break', name: 'Short Break' },
    { type: 'subject', code: '20AIPW603', abv: 'OTP', staff: 'Ms.S.Anusuya', p: 8 },
  ],
  'Friday': [
    { type: 'subject', code: '20HSMC501', abv: 'UHV', staff: 'Ms.T.Uma Mageswari', p: 1 },
    { type: 'subject', code: 'Elective', abv: ELECTIVE_STR, staff: 'Multiple Staff', p: 2 },
    { type: 'break', name: 'Short Break' },
    { type: 'subject', code: '20AIPC601', abv: 'RPA', staff: 'Dr. A. Rajasekar', p: 3 },
    { type: 'subject', code: 'Elective', abv: ELECTIVE_STR, staff: 'Multiple Staff', p: 4 },
    { type: 'break', name: 'Lunch' },
    { type: 'subject', code: '20AIP 601', abv: 'IDP', staff: 'Ms. M. Ganga', p: 6, span: 2 },
    { type: 'break', name: 'Short Break' },
    { type: 'subject', code: '20AIP 601', abv: 'IDP', staff: 'Ms. M. Ganga', p: 8 },
  ],
};

export default function StudentDashboard({ activeTab }: { activeTab?: string }) {
  const [subTab, setSubTab] = useState<'timetable' | 'substitutions'>('timetable');
  const [substitutions, setSubstitutions] = useState<Substitution[]>([]);
  const [today, setToday] = useState('');
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const cDate = new Date().toISOString().split('T')[0];
    setToday(currentDay);
    setCurrentDate(cDate);

    const sQuery = query(collection(db, 'substitution'), orderBy('date', 'desc'));
    const unsubscribeSubs = onSnapshot(sQuery, (snapshot) => {
      setSubstitutions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Substitution)));
    });

    return () => unsubscribeSubs();
  }, []);


  const dailySubstitutions = substitutions.filter(s => s.date === currentDate);

  const getSubForPeriod = (period: number) => {
    return dailySubstitutions.find(s => s.period === period);
  };

  if (activeTab === 'staff-list') {
    return (
      <motion.div 
        key="staff"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {COURSES.map((course, i) => (
          <Card key={i} className="border-2 border-zinc-900 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all group overflow-hidden">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <Badge className="bg-zinc-900 text-white border-none rounded-none font-black text-[9px] uppercase tracking-widest">{course.type}</Badge>
                <span className="text-[10px] font-black text-zinc-400">#{course.code}</span>
              </div>
              <h3 className="text-sm font-black text-zinc-900 leading-tight mb-4 group-hover:text-indigo-600 transition-colors uppercase italic">{course.name}</h3>
              <div className="flex items-center justify-between pt-4 border-t-2 border-zinc-900">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Handling Staff</p>
                  <p className="text-xs font-bold text-zinc-900">{course.staff}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Hrs/Wk</p>
                  <p className="text-xs font-bold text-indigo-600">{course.hrs}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-4xl font-black text-zinc-900 tracking-tighter uppercase italic leading-none">
            Student <span className="text-indigo-600">Dashboard</span>
          </h1>
          <p className="text-zinc-500 font-bold mt-2 uppercase tracking-tight">III Year AI&DS | Live Updates & Substitutions</p>
        </motion.div>

        <div className="flex bg-zinc-100 p-1.5 rounded-2xl w-fit">
          <button 
            onClick={() => setSubTab('timetable')}
            className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${subTab === 'timetable' ? 'bg-zinc-900 text-white shadow-xl scale-105' : 'text-zinc-500 hover:text-zinc-900'}`}
          >
            Class Timetable
          </button>
          <button 
            onClick={() => setSubTab('substitutions')}
            className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${subTab === 'substitutions' ? 'bg-zinc-900 text-white shadow-xl scale-105' : 'text-zinc-500 hover:text-zinc-900'}`}
          >
            Substitution Details
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {subTab === 'timetable' ? (
          <motion.div 
            key="timetable"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="bg-white border-2 border-zinc-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-center text-xs border-collapse border border-zinc-900">
                  <thead>
                    <tr className="bg-zinc-50 border-b-2 border-zinc-900">
                      <th className="px-4 py-6 font-black border-r-2 border-zinc-900 w-24">Day /<br/>Hour</th>
                      <th className="px-2 py-4 border-r border-zinc-900">1<br/><span className="font-bold">9.00 to 9.50 a.m</span></th>
                      <th className="px-2 py-4 border-r-2 border-zinc-900">2<br/><span className="font-bold">9.50 to 10.40 a.m</span></th>
                      <th className="px-2 py-4 border-r-2 border-zinc-900 text-[10px] font-black leading-tight w-8">10.40<br/>to<br/>10.55<br/>a.m</th>
                      <th className="px-2 py-4 border-r border-zinc-900">3<br/><span className="font-bold">10.55 to 11.45 a.m</span></th>
                      <th className="px-2 py-4 border-r-2 border-zinc-900">4<br/><span className="font-bold">11.45 to 12.35 p.m</span></th>
                      <th className="px-2 py-4 border-r-2 border-zinc-900 text-[10px] font-black leading-tight w-8">5*<br/><span className="font-bold">12.35 to 1.25 p.m</span></th>
                      <th className="px-2 py-4 border-r border-zinc-900">6<br/><span className="font-bold">1.25 to 2.15 p.m</span></th>
                      <th className="px-2 py-4 border-r-2 border-zinc-900">7<br/><span className="font-bold">2.15 to 3.05 p.m</span></th>
                      <th className="px-2 py-4 border-r-2 border-zinc-900 text-[10px] font-black leading-tight w-8">3.05<br/>to<br/>3.20<br/>p.m</th>
                      <th className="px-2 py-4 border-zinc-900">8<br/><span className="font-bold">3.20 to 4.10 p.m</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(WEEKLY_TIMETABLE).map(([day, slots]) => (
                      <tr key={day} className={`border-b border-zinc-900 ${today === day ? 'bg-indigo-50/30' : ''}`}>
                        <td className="px-4 py-8 font-black border-r-2 border-zinc-900 bg-zinc-50 italic">
                          {day}
                          {today === day && <div className="text-[8px] bg-indigo-600 text-white px-1 rounded mt-1">TODAY</div>}
                        </td>
                        {slots.map((slot, i) => {
                          if (slot.type === 'break') {
                            return (
                              <td key={i} className="px-1 py-4 border-r-2 border-zinc-900 font-black uppercase text-[10px] bg-zinc-50/50" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                                {slot.name}
                              </td>
                            );
                          }
                          const sub = today === day ? getSubForPeriod(slot.p) : null;
                          return (
                            <td key={i} colSpan={slot.span || 1} className={`px-2 py-6 border-r border-zinc-900 relative ${sub ? 'bg-amber-50' : ''}`}>
                              <div className="flex flex-col gap-2">
                                <p className={`font-black tracking-tighter leading-tight ${slot.abv.length > 20 ? 'text-[9px]' : 'text-[11px]'} ${sub ? 'text-amber-700' : 'text-zinc-900'}`}>
                                  {slot.code && `${slot.code} - `}{slot.abv}
                                </p>
                                {sub ? (
                                  <>
                                    <p className="text-[8px] font-bold text-zinc-400 line-through leading-tight">{slot.staff}</p>
                                    <div className="flex items-center gap-1 mt-1 bg-amber-500/10 p-1 rounded border border-amber-500/20">
                                      <p className="text-[8px] font-black text-amber-700 leading-none">{sub.assignedTeacherId}</p>
                                    </div>
                                  </>
                                ) : (
                                  <p className="text-[9px] font-bold text-zinc-500 leading-tight italic">{slot.staff}</p>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="substitutions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="bg-white border-2 border-zinc-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-zinc-900 text-white">
                    <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px]">Date & Day</th>
                    <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px]">Period</th>
                    <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px]">Subject</th>
                    <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px]">Absent / OD Staff</th>
                    <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px]">Assigned Staff</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-zinc-900">
                  {substitutions.length > 0 ? (
                    substitutions.map((sub) => (
                      <tr key={sub.id} className={`hover:bg-zinc-50 ${sub.date === currentDate ? 'bg-amber-50/30' : ''}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                             <p className="font-black text-zinc-900">{sub.date}</p>
                             {sub.date === currentDate && <Badge className="bg-indigo-600 text-white text-[8px] font-black">TODAY</Badge>}
                          </div>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase">Status: {sub.status}</p>
                        </td>
                        <td className="px-6 py-4">
                          <Badge className="bg-zinc-100 text-zinc-900 border-2 border-zinc-900 rounded-none font-black text-[10px]">P{sub.period}</Badge>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-black text-indigo-600">{sub.subject}</p>
                          <p className="text-[10px] font-bold text-zinc-400">{sub.class}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-red-600 italic">{sub.absentTeacherId}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded bg-zinc-900 flex items-center justify-center text-white font-black text-[10px]">
                              {sub.assignedTeacherId?.[0]}
                            </div>
                            <p className="font-black text-emerald-600">{sub.assignedTeacherId}</p>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center">
                        <p className="text-zinc-400 font-black italic text-lg uppercase tracking-widest opacity-20">No active substitutions recorded</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
