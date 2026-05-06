# 📚 ClassAssign

### AI-Based Smart Faculty Substitution System

---

## 🚀 Overview

**ClassAssign** is an intelligent system designed to automate faculty attendance tracking and substitute teacher assignment in educational institutions.

When a teacher is **absent or on duty (OD)**, the system automatically finds the best available replacement using timetable data, workload balancing, and smart decision-making logic.

---

## 🎯 Problem Statement

In most colleges, assigning substitute teachers is a manual and time-consuming process. It can lead to:

* Scheduling conflicts
* Uneven workload distribution
* Delays in decision-making

**ClassAssign solves this problem by automating the entire process efficiently.**

---

## 💡 Key Features

### ✅ Attendance Management

* Mark faculty as Present / Absent / On Duty
* Maintain attendance history

### 🤖 Smart Substitution Engine

* Detect free teachers using timetable
* Prioritize:

  * Same subject expertise
  * Same department
  * Low workload
* Uses scoring-based decision logic

### 🔁 Dynamic Reassignment

* If a teacher rejects:

  * Automatically assigns next best candidate
* Allows teacher suggestions

### 🔔 Notification System

* Sends assignment requests to faculty
* Options:

  * Accept
  * Reject
  * Suggest alternative

### ⚖️ Workload Optimization

* Prevents overloading
* Ensures fair distribution

### 📊 Dashboard

* Admin view:

  * Substitutions
  * Attendance logs
  * Workload insights
* Faculty view:

  * Assigned classes
  * Personal timetable

### 📈 Reports & Analytics

* Substitution history
* Acceptance rates
* Attendance trends

---

## 🧠 How It Works

1. Teacher marked as **Absent / OD**
2. System retrieves timetable
3. Identifies free teachers
4. Applies smart filters
5. Calculates score for each teacher
6. Assigns best candidate
7. Sends notification
8. Confirms or reassigns

---

## 🧮 Scoring Algorithm

```
Score =
+50 → Same subject  
+30 → Same department  
-20 → High workload  
-10 → Continuous classes  
+10 → High acceptance rate  
-15 → Recently assigned  
```

---

## 🏗️ System Architecture

### Modules:

* Attendance Module
* Substitution Engine
* Notification System
* Database
* Dashboard UI

---

## 🗄️ Database Design

### Tables:

* Faculty
* Timetable
* Attendance
* Substitution
* Notifications

---

## 🛠️ Tech Stack

| Layer         | Technology                    |
| ------------- | ----------------------------- |
| Backend       | Python (Flask / Django)       |
| Frontend      | HTML, CSS, JavaScript / React |
| Database      | MySQL / Firebase              |
| Notifications | Firebase / Twilio             |

---

## ⚙️ Installation & Setup

```bash
# Clone repository
git clone https://github.com/your-username/classassign.git

# Navigate to project
cd classassign

# Install dependencies
pip install -r requirements.txt

# Run server
python app.py
```

---

## ▶️ Usage

1. Admin logs in
2. Marks faculty attendance
3. System automatically assigns substitute
4. Faculty receives notification
5. Faculty accepts or rejects

---

## 🔮 Future Enhancements

* AI-based absence prediction
* Mobile application
* Biometric attendance integration
* Advanced analytics dashboard

---

## 🎓 Project Type

Final Year Engineering Project

---

## 📌 Conclusion

**ClassAssign** simplifies and automates faculty substitution using intelligent decision-making, reducing manual effort and improving scheduling efficiency.

---

## 👨‍💻 Author

KARTIK SINGH
---

## 📄 License

This project is for academic purposes.
