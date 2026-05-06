import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

// Import JSON data
import facultyData from '../Data/faculty.json';
import timetableData from '../Data/timetable.json';
import subjectsData from '../Data/subjects.json';
import workloadData from '../Data/workload.json';

/**
 * 1. Upload Faculty
 * Each faculty in the array becomes a separate document.
 */
export const uploadFaculty = async () => {
  try {
    const facultyCollection = collection(db, 'faculty');
    
    // Create a map to merge all faculty
    const facultyMap = new Map<string, any>();
    
    // 1. Add all from faculty.json
    for (const f of facultyData) {
      facultyMap.set(f.name, { ...f });
    }
    
    // 2. Add missing faculty from timetable.json
    let nextId = 5; // Starting ID for auto-generated faculty
    for (const teacherName of Object.keys(timetableData)) {
      if (!facultyMap.has(teacherName)) {
        facultyMap.set(teacherName, {
          id: teacherName.replace(/[^a-zA-Z0-9]/g, '_'),
          name: teacherName,
          department: 'AI&DS',
          designation: teacherName.includes('Dr.') ? 'Professor' : 'Asst. Professor',
          subjects: [],
          workload: 15,
          isAvailable: true,
          continuousClasses: 0,
          acceptanceRate: 0.9
        });
      }
    }
    
    // Upload merged faculty
    for (const faculty of Array.from(facultyMap.values())) {
      // Use the faculty 'id' as the document ID if available, otherwise let Firestore auto-generate
      const docRef = faculty.id ? doc(facultyCollection, faculty.id) : doc(facultyCollection);
      
      const facultyDataToUpload = {
        ...faculty,
        // The firestore.rules require an email and department field!
        email: faculty.name.replace(/[^a-zA-Z]/g, '').toLowerCase() + '@univ.edu',
        department: faculty.department || 'AI&DS',
      };

      await setDoc(docRef, facultyDataToUpload);
      console.log(`Successfully uploaded faculty: ${faculty.name}`);
    }
  } catch (error) {
    console.error('Error uploading faculty:', error);
    throw error;
  }
};

/**
 * 2. Upload Timetable
 * The JSON is an object keyed by teacher name.
 * Each teacher's timetable becomes a document with a 'name' field.
 */
export const uploadTimetable = async () => {
  try {
    const timetableCollection = collection(db, 'timetable');
    
    // timetableData is an object like { "Dr.Suganthi": { "Monday": [...] } }
    for (const [teacherName, schedule] of Object.entries(timetableData)) {
      // Using the teacher's name as the document ID for easy querying
      const docRef = doc(timetableCollection, teacherName.replace(/[^a-zA-Z0-9]/g, '_'));
      
      await setDoc(docRef, {
        name: teacherName,
        schedule: schedule
      });
      console.log(`Successfully uploaded timetable for: ${teacherName}`);
    }
  } catch (error) {
    console.error('Error uploading timetables:', error);
    throw error;
  }
};

/**
 * 3. Upload Subjects
 * The JSON is an object keyed by subject name.
 * Each subject becomes a document containing the list of assigned faculty.
 */
export const uploadSubjects = async () => {
  try {
    const subjectsCollection = collection(db, 'subjects');
    
    // subjectsData is an object like { "WT&MAD": ["Dr.S.Parvathi"] }
    for (const [subjectName, facultyList] of Object.entries(subjectsData)) {
      // Using the subject name as the document ID
      const docRef = doc(subjectsCollection, subjectName.replace(/[^a-zA-Z0-9]/g, '_'));
      
      await setDoc(docRef, {
        subjectName: subjectName,
        assignedFaculty: facultyList
      });
      console.log(`Successfully uploaded subject: ${subjectName}`);
    }
  } catch (error) {
    console.error('Error uploading subjects:', error);
    throw error;
  }
};

/**
 * 4. Upload Workload
 * The JSON is an array of workload entries.
 * Each workload entry becomes a separate document.
 */
export const uploadWorkload = async () => {
  try {
    const workloadCollection = collection(db, 'workload');
    
    // workloadData is an array like [{ "name": "Dr.Suganthi", "totalHours": 9 }]
    for (const workload of workloadData) {
      // Using the teacher's name as the document ID
      const docRef = doc(workloadCollection, workload.name.replace(/[^a-zA-Z0-9]/g, '_'));
      
      await setDoc(docRef, workload);
      console.log(`Successfully uploaded workload for: ${workload.name}`);
    }
  } catch (error) {
    console.error('Error uploading workloads:', error);
    throw error;
  }
};

/**
 * MASTER FUNCTION: Upload All Data
 * Runs all individual upload functions sequentially.
 */
export const uploadAllData = async () => {
  try {
    console.log('Starting full database upload...');
    
    await uploadFaculty();
    await uploadTimetable();
    await uploadSubjects();
    await uploadWorkload();
    
    console.log('🎉 All data successfully uploaded to Firestore!');
    return true;
  } catch (error) {
    console.error('❌ Database upload failed:', error);
    throw error;
  }
};
