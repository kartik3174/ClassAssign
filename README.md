# 🎓 AI&DS Staff Assign

### Intelligent Faculty Resource Management System

AI&DS Staff Assign is a **smart, role-based faculty management system** designed to automate leave handling and substitution assignment in academic institutions.

---

## 🧠 Key Features

### 👨‍🏫 Faculty

* Apply Leave / On Duty (OD)
* Select date and periods
* View request status (Pending / Approved / Rejected)
* View assigned substitutions
* Accept / Reject substitution requests

---

### 👨‍💼 HOD (Head of Department)

* View all faculty leave requests
* Approve / Reject requests
* Trigger automatic substitution system
* Override manual assignments
* Monitor department activity

---

### 👨‍💻 Admin

* Manage users and roles
* Upload and manage timetable
* Configure system rules (workload limits, priorities)
* View system analytics
* Access logs and reports

---

### 🎓 Student

* View timetable (read-only)
* View real-time substitution updates

---

## 🔄 System Workflow

```text
Faculty applies leave
        ↓
HOD approves/rejects
        ↓
System assigns substitute teachers
        ↓
Assigned faculty accepts/rejects
        ↓
Dashboard updates in real-time
        ↓
Students view updated timetable
```

---

## 🧠 Smart Substitution Engine

The system automatically assigns substitute teachers based on:

* ✔ Subject matching
* ✔ Free timetable slots
* ✔ Workload balancing

### 📊 Selection Logic

```ts
score =
  + subjectMatch
  + availability
  - workload
```

---

## ⚡ Real-Time Updates

* Live updates using Firebase Firestore
* No manual refresh required
* Instant UI synchronization

---

## 🔐 Authentication & Roles

* Firebase Authentication (Google / Email)
* Role-based access control:

  * Faculty
  * HOD
  * Admin
  * Student

---

## 🗂️ Tech Stack

* **Frontend:** React (Vite + TypeScript)
* **Backend:** Firebase (Firestore + Auth)
* **Styling:** Tailwind CSS
* **Deployment:** Vercel

---

## 📁 Project Structure

```
src/
  components/
  pages/
  services/
  hooks/
  context/
  firebase/
  utils/
```

---

## 📊 Firestore Collections

* users
* leave_requests
* timetable
* subjects
* workload
* substitution
* substitution_logs

---

## 🎨 UI Highlights

* Modern gradient dashboard
* Role-based navigation
* Responsive design
* Clean and intuitive layout

---

## 🚀 Future Enhancements

* 📧 Email / Notification system
* 📊 Advanced analytics dashboard
* 🤖 AI-based teacher recommendation
* 📱 Mobile optimization

---

## 🌐 Live Demo

👉 (Add your Vercel link here)

---

## 👨‍💻 Author

**Kartik Singh**
AI&DS Department

---

## 📌 Note

This project is developed as part of an academic system to demonstrate **real-time resource management using modern web technologies**.
