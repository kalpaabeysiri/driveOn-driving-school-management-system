# Exam Schedules and Student Progress Tracking Module

A comprehensive full-stack module for managing driving school exam schedules, student assignments, and progress tracking with role-based access control.

## 🎯 Business Overview

**Important Business Logic:**
- **Admin CREATES official exams** within the system
- Exams are treated as manually created by Admin based on official announcements
- External exam sources can still be imported for convenience but primary method is manual creation
- **Maximum students per exam = 10**
- Students can only check their assigned exam status
- Instructors can view assigned student counts

## 🏗️ Architecture

### Backend (Node.js + Express + MongoDB)
- **Models**: TheoryExam, PracticalExam, ExamResult, AttendanceRecord, StudentProgress
- **Controllers**: Complete CRUD operations with role-based access
- **API Routes**: RESTful endpoints with authentication middleware
- **Validation**: Comprehensive input validation and error handling

### Frontend (React Native)
- **Modern UI**: Responsive design with role-based navigation
- **Screens**: Dashboard, exam lists, details, progress tracking
- **Real-time Updates**: Live seat availability and assignment status
- **User Experience**: Loading states, error handling, intuitive workflows

## 📋 Core Features

### 1. Exam Management
- ✅ **Create theory and practical exams** manually
- ✅ **Role-based exam details display**
- ✅ **Import external exam data** (optional feature)
- ✅ **Search and filter exams**
- ✅ **Real-time seat availability tracking**

### 2. Student Assignment
- ✅ **Admin assigns students to exams** (max 10 seats)
- ✅ **Seat capacity enforcement with race condition protection**
- ✅ **Eligibility validation** (active account, not already assigned)
- ✅ **Unassign students before exam date**
- ✅ **Bulk assignment support**

### 3. Progress Tracking
- ✅ **Comprehensive student progress monitoring**
- ✅ **Overall status tracking** (Not Started → Completed)
- ✅ **Exam attempt history**
- ✅ **Pass/fail statistics**
- ✅ **Attendance analytics**

### 4. Role-Based Access

#### Admin Permissions:
- Create, view, edit, and delete exams
- View exam details
- Assign/unassign students to exams
- View attendance reports
- View student progress
- Record exam results
- Import/seed exam data

#### Student Permissions:
- View own assigned exams only
- View exam details for assigned exams
- View own exam history
- View own progress and completion status
- Cannot assign/unassign themselves

#### Instructor Permissions:
- View upcoming exams
- View assigned student counts per exam
- View counts by exam type/date
- Verify attendance
- Cannot create exams or assign students (default)

## 🛠️ Technical Implementation

### Database Schema

#### TheoryExam
```javascript
{
  examName: String,
  date: Date,
  startTime: String,
  endTime: String,
  locationOrHall: String,
  language: ['English', 'Sinhala', 'Tamil'],
  status: ['Scheduled', 'Completed', 'Cancelled'],
  maxSeats: { type: Number, default: 10 },
  sourceType: ['manual', 'external', 'imported', 'seeded'],
  sourceNote: String,  // Admin notes about exam source
  createdBy: ObjectId,  // Admin who created the exam
  enrolledStudents: [ObjectId],
  results: [ObjectId]
}
```

#### PracticalExam
```javascript
{
  date: Date,
  startTime: String,
  endTime: String,
  trialLocation: String,
  vehicleCategory: ['Light', 'Heavy', 'Bike'],
  status: ['Scheduled', 'Completed', 'Cancelled'],
  maxSeats: { type: Number, default: 10 },
  sourceType: ['manual', 'external', 'imported', 'seeded'],
  sourceNote: String,  // Admin notes about exam source
  createdBy: ObjectId,  // Admin who created the exam
  examiner: ObjectId,
  assignedVehicle: ObjectId,
  enrolledStudents: [ObjectId],
  results: [ObjectId]
}
```

#### StudentProgress
```javascript
{
  student: ObjectId,
  overallStatus: [
    'Not Started',
    'In Progress', 
    'Assigned for Theory Exam',
    'Theory Passed',
    'Assigned for Practical Exam',
    'Practical Passed',
    'Completed'
  ],
  theoryExamAttempts: Number,
  practicalExamAttempts: Number,
  theoryExamStatus: ['Not Attempted', 'Failed', 'Passed'],
  practicalExamStatus: ['Not Attempted', 'Failed', 'Passed'],
  totalTheoryHours: Number,
  totalPracticalHours: Number,
  theoryAttendanceRate: Number,
  practicalAttendanceRate: Number
}
```

### API Endpoints

#### Exam Management
```
GET    /api/exams/theory              - Get all theory exams
GET    /api/exams/theory/:id          - Get theory exam details
GET    /api/exams/theory/upcoming     - Get upcoming theory exams
POST   /api/exams/theory              - Create new theory exam
PUT    /api/exams/theory/:id          - Update theory exam
DELETE /api/exams/theory/:id          - Delete theory exam

GET    /api/exams/practical           - Get all practical exams
GET    /api/exams/practical/:id       - Get practical exam details
GET    /api/exams/practical/upcoming  - Get upcoming practical exams
POST   /api/exams/practical           - Create new practical exam
PUT    /api/exams/practical/:id       - Update practical exam
DELETE /api/exams/practical/:id       - Delete practical exam
```

#### Student Assignment
```
GET    /api/exams/theory/:id/assignable-students    - Get assignable students
POST   /api/exams/theory/:id/assign-student         - Assign student
POST   /api/exams/theory/:id/unassign-student       - Unassign student
GET    /api/exams/practical/:id/assignable-students  - Get assignable students
POST   /api/exams/practical/:id/assign-student       - Assign student
POST   /api/exams/practical/:id/unassign-student     - Unassign student
```

#### Progress Tracking
```
GET    /api/progress/students           - Get all student progress
GET    /api/progress/students/:id       - Get specific student progress
GET    /api/progress/stats              - Get progress statistics
POST   /api/progress/students/:id/update - Update student progress
```

#### Attendance & Results
```
GET    /api/attendance                  - Get attendance records
POST   /api/attendance                  - Create attendance record
GET    /api/attendance/analytics         - Get attendance analytics
GET    /api/attendance/reports          - Get attendance reports
POST   /api/results                     - Create exam result
GET    /api/results/student/:id         - Get student results
GET    /api/results/exam/:type/:id      - Get exam results
```

## 🚀 Setup Instructions

### Prerequisites
- Node.js 16+
- MongoDB 4.4+
- React Native development environment

### Backend Setup

1. **Install Dependencies**
```bash
cd backend
npm install
```

2. **Environment Variables**
Create `.env` file:
```env
MONGODB_URI=mongodb://localhost:27017/driveon
JWT_SECRET=your_jwt_secret_here
NODE_ENV=development
PORT=5000
```

3. **Run Seed Data**
```bash
node seeds/examSystemSeed.js
```

4. **Start Server**
```bash
npm run dev
```

### Frontend Setup

1. **Install Dependencies**
```bash
cd frontend
npm install
```

2. **Environment Variables**
Create `.env` file:
```env
API_URL=http://localhost:5000/api
```

3. **Start Development Server**
```bash
npm start
```

## 📱 Frontend Screens

### 1. Exam Dashboard
- **Admin**: Overview stats, upcoming exams, quick actions
- **Instructor**: Exam overview, student counts
- **Student**: Personal status, assigned exams

### 2. Theory Exam List
- Filter by status, language, date
- Search functionality
- Seat availability indicators
- Real-time updates

### 3. Practical Exam List
- Filter by status, vehicle category, date
- Search functionality
- Seat availability indicators
- Real-time updates

### 4. Create/Edit Exam
- Manual exam creation form
- All exam fields (date, time, location, capacity)
- Source tracking (manual vs imported)
- Admin notes field for exam source

### 5. Exam Details
- Complete exam information
- Enrolled students list
- Seat availability visualization
- Student assignment interface (Admin only)
- Personal assignment status (Students)

### 6. Progress Tracking
- Student progress overview
- Exam attempt history
- Attendance analytics
- Performance statistics
- Role-based data access

## 🎯 Key Business Rules

### Exam Creation
- **Primary Method**: Manual creation by Admin
- **Secondary Option**: Import external exam data
- **Source Tracking**: `sourceType` field (manual/external/imported/seeded)
- **Admin Notes**: `sourceNote` field for additional context

### Seat Management
- **Maximum 10 students per exam**
- **Strict enforcement at backend level**
- **Race condition protection**
- **Real-time availability updates**

### Assignment Rules
- **Admin can assign only if:**
  - Exam status is 'Scheduled'
  - Exam date is upcoming
  - Student account is active
  - Student not already assigned
  - Seats are available (< 10)

### Progress Status Flow
```
Not Started → In Progress → Assigned for Theory Exam → Theory Passed → 
Assigned for Practical Exam → Practical Passed → Completed
```

### Eligibility Logic
- **Theory Exam**: Active student account
- **Practical Exam**: Theory exam passed + matching vehicle category
- **Optional**: Payment status, attendance thresholds

## 🧪 Testing & Validation

### Seed Data Includes:
- ✅ Multiple upcoming theory exams
- ✅ Multiple upcoming practical exams
- ✅ Partially filled exams (6/10, 3/10 seats)
- ✅ One full exam (10/10 seats)
- ✅ Students with different progress statuses
- ✅ Exam results (pass/fail history)
- ✅ Attendance records
- ✅ Suspended student account

### Test Scenarios:
1. **Exam Creation**: Create manual exams with all fields
2. **Seat Capacity**: Try to assign 11th student
3. **Race Conditions**: Simultaneous assignments
4. **Role Access**: Test with different user roles
5. **Progress Updates**: Automatic status changes
6. **Attendance**: Record and analytics
7. **Source Tracking**: Verify manual vs imported exam handling

## 🔒 Security Features

- **Role-based access control**
- **JWT authentication**
- **Input validation and sanitization**
- **MongoDB injection prevention**
- **Rate limiting on sensitive endpoints**
- **Audit trail for exam assignments**

## 📊 Analytics & Reporting

### Available Reports:
- **Student Progress Overview**
- **Exam Assignment Reports**
- **Pass/Fail Statistics**
- **Attendance Analytics**
- **Seat Utilization Reports**
- **Performance Trends**

### Dashboard Metrics:
- Upcoming exam counts
- Seat utilization rates
- Pass/fail percentages
- Student progress distribution
- Attendance statistics

## 🔄 External Integration

### Exam Creation Options:
1. **Manual Creation**: Primary method - Admin creates exams based on official announcements
2. **Import External Data**: Secondary method - Import from external systems
3. **Seed Data**: Initial setup and testing
4. **API Integration**: Future - Sync with external systems

### Source Tracking:
- `sourceType`: manual/external/imported/seeded
- `sourceNote`: Admin notes about exam source
- `externalReferenceId`: Original system ID (for imported exams)
- `importedAt`: Import timestamp

## 🚀 Deployment

### Backend Deployment
```bash
# Production build
npm run build
# Start production server
npm start
```

### Frontend Deployment
```bash
# Build for production
npx expo build:android
npx expo build:ios
```

## 📞 Support & Maintenance

### Monitoring:
- API response times
- Database performance
- Error tracking
- User activity logs

### Backup Strategy:
- Daily database backups
- Exam data archival
- Student progress backup
- Configuration backups

## 🎉 Conclusion

This module provides a complete, production-ready solution for managing driving school exam schedules with:

- **✅ Manual exam creation** by Admin based on official announcements
- **✅ Flexible import options** for external data
- **✅ Robust seat management** (10 max per exam)
- **✅ Role-based access control**
- **✅ Real-time updates**
- **✅ Comprehensive progress tracking**
- **✅ Modern, responsive UI**
- **✅ Complete documentation**
- **✅ Seed data for testing**

The system is ready for immediate deployment and can handle real-world driving school exam management scenarios efficiently and securely.
