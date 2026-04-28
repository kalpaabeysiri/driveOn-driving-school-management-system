# DriveOn - Full Stack Mobile Application
### SE2020 Web & Mobile Technologies | Group Assignment 2026
### IT2150 IT Project | 2026

---

## Tech Stack
| Layer     | Technology                    |
|-----------|-------------------------------|
| Frontend  | React Native (Expo SDK 51)    |
| Backend   | Node.js + Express.js          |
| Database  | MongoDB Atlas                 |
| Auth      | JWT + bcryptjs                |
| Storage   | Multer (image uploads)        |
| Deploy    | Railway (backend)             |

---

## Project Structure
```
DriveOnApp/
├── backend/
│   ├── config/          → MongoDB connection
│   ├── middleware/       → JWT auth, file upload
│   ├── models/           → User, Session, Instructor, Vehicle, Payment, Quiz, Progress
│   ├── controllers/      → Business logic for all entities
│   ├── routes/           → API endpoints
│   ├── uploads/          → Uploaded images (auto-created)
│   ├── server.js         → Entry point
│   └── .env.example      → Environment variable template
│
└── frontend/
    ├── src/
    │   ├── context/      → AuthContext (global login state)
    │   ├── navigation/   → AppNavigator (tabs + auth flow)
    │   ├── screens/      → All screens
    │   │   ├── auth/     → Login, Register
    │   │   ├── sessions/ → SessionsScreen, BookSessionScreen
    │   │   ├── learning/ → LearningScreen, QuizScreen
    │   │   └── payments/ → PaymentsScreen, AddPaymentScreen
    │   ├── services/     → api.js (all Axios API calls)
    │   └── theme/        → Colors
    ├── App.js            → Entry point
    └── app.json          → Expo config
```

---

## API Endpoints

| Module              | Method | Endpoint                                                   | Access    | Purpose                         |
|---------------------|--------|------------------------------------------------------------|-----------|---------------------------------|
| Health              | GET    | /                                                          | Public    | Check API status                |
| Auth                | POST   | /api/auth/register                                         | Public    | Register user                   |
| Auth                | POST   | /api/auth/login                                            | Public    | Login user                      |
| Auth                | GET    | /api/auth/profile                                          | Protected | Get profile                     |
| Auth                | PUT    | /api/auth/profile                                          | Protected | Update profile                  |
| Auth                | GET    | /api/auth/test                                             | Public    | Test auth route                 |
| Students            | POST   | /api/students/login                                        | Public    | Student login                   |
| Students            | GET    | /api/students/report/monthly                               | Admin     | Monthly student report          |
| Students            | GET    | /api/students                                              | Admin     | Get all students                |
| Students            | POST   | /api/students                                              | Admin     | Create student                  |
| Students            | GET    | /api/students/:id                                          | Protected | Get student by ID               |
| Students            | PUT    | /api/students/:id                                          | Admin     | Update student                  |
| Students            | DELETE | /api/students/:id                                          | Admin     | Delete student                  |
| Students            | PATCH  | /api/students/:id/status                                   | Admin     | Update student status           |
| Students            | PATCH  | /api/students/:id/reminders                                | Protected | Toggle reminders                |
| Students            | POST   | /api/students/:id/book-session                             | Protected | Book session                    |
| Sessions            | GET    | /api/sessions/report/monthly                               | Admin     | Monthly session report          |
| Sessions            | GET    | /api/sessions/available                                    | Protected | Get available sessions          |
| Sessions            | GET    | /api/sessions/my-bookings                                  | Protected | Get my bookings                 |
| Sessions            | GET    | /api/sessions                                              | Protected | Get sessions                    |
| Sessions            | POST   | /api/sessions                                              | Admin     | Create session                  |
| Sessions            | GET    | /api/sessions/:id                                          | Protected | Get session by ID               |
| Sessions            | PUT    | /api/sessions/:id                                          | Admin     | Update session                  |
| Sessions            | DELETE | /api/sessions/:id                                          | Admin     | Delete session                  |
| Sessions            | POST   | /api/sessions/:id/book                                     | Protected | Book session                    |
| Sessions            | DELETE | /api/sessions/:id/book                                     | Protected | Cancel booking                  |
| Sessions            | POST   | /api/sessions/:id/enroll                                   | Admin     | Enroll student                  |
| Sessions            | DELETE | /api/sessions/:id/enroll/:studentId                        | Admin     | Remove enrolled student         |
| Instructors         | POST   | /api/instructors/login                                     | Public    | Instructor login                |
| Instructors         | GET    | /api/instructors                                           | Protected | Get instructors                 |
| Instructors         | POST   | /api/instructors                                           | Admin     | Create instructor               |
| Instructors         | GET    | /api/instructors/:id                                       | Protected | Get instructor by ID            |
| Instructors         | PUT    | /api/instructors/:id                                       | Admin     | Update instructor               |
| Instructors         | DELETE | /api/instructors/:id                                       | Admin     | Delete instructor               |
| Instructors         | POST   | /api/instructors/:id/assign-vehicle                        | Admin     | Assign vehicle                  |
| Instructors         | DELETE | /api/instructors/:id/assign-vehicle/:vehicleId             | Admin     | Remove assigned vehicle         |
| Instructors         | GET    | /api/instructors/:id/notifications                         | Protected | Get instructor notifications    |
| Instructors         | PATCH  | /api/instructors/:id/notifications/read-all                | Protected | Mark all notifications read     |
| Instructors         | PATCH  | /api/instructors/notifications/:notifId/read               | Protected | Mark notification read          |
| Instructor Exams    | GET    | /api/instructor-exams/exams/upcoming                       | Protected | Get instructor upcoming exams   |
| Instructor Exams    | GET    | /api/instructor-exams/exams/upcoming/counts                | Protected | Get upcoming exam counts        |
| Vehicles            | GET    | /api/vehicles/report/usage                                 | Protected | Vehicle usage report            |
| Vehicles            | GET    | /api/vehicles/alerts/expiry                                | Protected | Vehicle expiry alerts           |
| Vehicles            | GET    | /api/vehicles                                              | Protected | Get vehicles                    |
| Vehicles            | POST   | /api/vehicles                                              | Admin     | Create vehicle                  |
| Vehicles            | GET    | /api/vehicles/:id                                          | Protected | Get vehicle by ID               |
| Vehicles            | PUT    | /api/vehicles/:id                                          | Admin     | Update vehicle                  |
| Vehicles            | DELETE | /api/vehicles/:id                                          | Admin     | Delete vehicle                  |
| Vehicles            | PATCH  | /api/vehicles/:id/status                                   | Admin     | Update vehicle status           |
| Vehicles            | POST   | /api/vehicles/:id/insurance                                | Admin     | Add insurance                   |
| Vehicles            | PUT    | /api/vehicles/:id/insurance                                | Admin     | Update insurance                |
| Vehicles            | POST   | /api/vehicles/:id/usage                                    | Protected | Add vehicle usage               |
| Payments            | GET    | /api/payments                                              | Protected | Get payments                    |
| Payments            | POST   | /api/payments                                              | Protected | Create payment                  |
| Payments            | GET    | /api/payments/:id                                          | Protected | Get payment by ID               |
| Payments            | PUT    | /api/payments/:id                                          | Protected | Update payment                  |
| Payments            | DELETE | /api/payments/:id                                          | Protected | Delete payment                  |
| Quizzes             | GET    | /api/quizzes                                               | Protected | Get quizzes                     |
| Quizzes             | POST   | /api/quizzes                                               | Admin     | Create quiz                     |
| Quizzes             | GET    | /api/quizzes/:id                                           | Protected | Get quiz by ID                  |
| Quizzes             | PUT    | /api/quizzes/:id                                           | Admin     | Update quiz                     |
| Quizzes             | DELETE | /api/quizzes/:id                                           | Admin     | Delete quiz                     |
| Learning            | GET    | /api/learning/catalog                                      | Protected | Get learning catalog            |
| Learning            | POST   | /api/learning/progress/lessons/:lessonId                   | Protected | Update lesson progress          |
| Learning            | POST   | /api/learning/quizzes/:quizId/start                        | Protected | Start quiz attempt              |
| Learning            | POST   | /api/learning/quizzes/:quizId/submit                       | Protected | Submit quiz attempt             |
| Learning            | GET    | /api/learning/student/performance                          | Protected | Get student performance         |
| Learning            | GET    | /api/learning/student/quiz-history                         | Protected | Get quiz history                |
| Learning            | GET    | /api/learning/student/lesson-progress                      | Protected | Get lesson progress             |
| Learning Topics     | GET    | /api/learning/topics                                       | Protected | Get topics                      |
| Learning Topics     | POST   | /api/learning/topics                                       | Admin     | Create topic                    |
| Learning Topics     | GET    | /api/learning/topics/:id                                   | Protected | Get topic by ID                 |
| Learning Topics     | PUT    | /api/learning/topics/:id                                   | Admin     | Update topic                    |
| Learning Topics     | DELETE | /api/learning/topics/:id                                   | Admin     | Delete topic                    |
| Learning Lessons    | GET    | /api/learning/lessons                                      | Protected | Get lessons                     |
| Learning Lessons    | POST   | /api/learning/lessons                                      | Admin     | Create lesson                   |
| Learning Lessons    | GET    | /api/learning/lessons/:id                                  | Protected | Get lesson by ID                |
| Learning Lessons    | PUT    | /api/learning/lessons/:id                                  | Admin     | Update lesson                   |
| Learning Lessons    | DELETE | /api/learning/lessons/:id                                  | Admin     | Delete lesson                   |
| Learning Videos     | GET    | /api/learning/videos                                       | Protected | Get videos                      |
| Learning Videos     | POST   | /api/learning/videos                                       | Admin     | Upload video                    |
| Learning Videos     | PUT    | /api/learning/videos/:id                                   | Admin     | Update video                    |
| Learning Videos     | DELETE | /api/learning/videos/:id                                   | Admin     | Delete video                    |
| Learning Analytics  | GET    | /api/learning/analytics/quizzes/:quizId                    | Admin     | Quiz analytics                  |
| Learning Analytics  | GET    | /api/learning/analytics/lessons/:lessonId                  | Admin     | Lesson analytics                |
| Learning Analytics  | GET    | /api/learning/analytics/topics/:topicId                    | Admin     | Topic analytics                 |
| License Categories  | GET    | /api/license-categories                                    | Protected | Get license categories          |
| License Categories  | POST   | /api/license-categories                                    | Admin     | Create license category         |
| License Categories  | GET    | /api/license-categories/:id                                | Protected | Get license category by ID      |
| License Categories  | PUT    | /api/license-categories/:id                                | Admin     | Update license category         |
| License Categories  | DELETE | /api/license-categories/:id                                | Admin     | Delete license category         |
| Vehicle Classes     | GET    | /api/vehicle-classes                                       | Protected | Get vehicle classes             |
| Vehicle Classes     | POST   | /api/vehicle-classes                                       | Admin     | Create vehicle class            |
| Vehicle Classes     | GET    | /api/vehicle-classes/:id                                   | Protected | Get vehicle class by ID         |
| Vehicle Classes     | PUT    | /api/vehicle-classes/:id                                   | Admin     | Update vehicle class            |
| Vehicle Classes     | DELETE | /api/vehicle-classes/:id                                   | Admin     | Delete vehicle class            |
| Enrollment          | GET    | /api/enrollment/courses                                    | Protected | Get courses                     |
| Enrollment          | POST   | /api/enrollment/courses                                    | Admin     | Create course                   |
| Enrollment          | GET    | /api/enrollment/courses/:id                                | Protected | Get course by ID                |
| Enrollment          | PUT    | /api/enrollment/courses/:id                                | Admin     | Update course                   |
| Enrollment          | DELETE | /api/enrollment/courses/:id                                | Admin     | Delete course                   |
| Enrollment Payments | GET    | /api/enrollment/payments                                   | Protected | Get enrollment payments         |
| Enrollment Payments | POST   | /api/enrollment/payments                                   | Admin     | Create enrollment payment       |
| Enrollment Payments | GET    | /api/enrollment/payments/:id                               | Protected | Get enrollment payment by ID    |
| Enrollment Payments | DELETE | /api/enrollment/payments/:id                               | Admin     | Delete enrollment payment       |
| Owners              | GET    | /api/owners                                                | Protected | Get owners                      |
| Owners              | POST   | /api/owners                                                | Admin     | Create owner                    |
| Owners              | GET    | /api/owners/:id                                            | Protected | Get owner by ID                 |
| Owners              | PUT    | /api/owners/:id                                            | Admin     | Update owner                    |
| Owners              | DELETE | /api/owners/:id                                            | Admin     | Delete owner                    |
| Feedbacks           | GET    | /api/feedbacks/templates                                   | Protected | Get feedback templates          |
| Feedbacks           | POST   | /api/feedbacks/templates                                   | Admin     | Create feedback template        |
| Feedbacks           | DELETE | /api/feedbacks/templates/:id                               | Admin     | Delete feedback template        |
| Feedbacks           | GET    | /api/feedbacks                                             | Protected | Get feedbacks                   |
| Feedbacks           | POST   | /api/feedbacks                                             | Protected | Submit feedback                 |
| Feedbacks           | GET    | /api/feedbacks/:id                                         | Protected | Get feedback by ID              |
| Feedbacks           | DELETE | /api/feedbacks/:id                                         | Admin     | Delete feedback                 |
| Staff               | POST   | /api/staff/login                                           | Public    | Staff login                     |
| Staff               | GET    | /api/staff                                                 | Protected | Get staff                       |
| Staff               | POST   | /api/staff                                                 | Admin     | Create staff                    |
| Staff               | GET    | /api/staff/attendance/members                              | Admin     | Get attendance members          |
| Staff               | GET    | /api/staff/attendance                                      | Admin     | Get staff attendance            |
| Staff               | POST   | /api/staff/attendance                                      | Admin     | Mark staff attendance           |
| Staff               | GET    | /api/staff/performance                                     | Admin     | Get staff performance           |
| Staff               | GET    | /api/staff/:id                                             | Protected | Get staff by ID                 |
| Staff               | PUT    | /api/staff/:id                                             | Admin     | Update staff                    |
| Staff               | DELETE | /api/staff/:id                                             | Admin     | Delete staff                    |
| Notifications       | GET    | /api/notifications                                         | Protected | Get notifications               |
| Notifications       | POST   | /api/notifications                                         | Admin     | Send notification               |
| Notifications       | PATCH  | /api/notifications/:id/read                                | Protected | Mark notification read          |
| Notifications       | PATCH  | /api/notifications/read-all                                | Protected | Mark all notifications read     |
| Notifications       | DELETE | /api/notifications/:id                                     | Protected | Delete notification             |
| Notifications       | GET    | /api/notifications/stats                                   | Admin     | Notification statistics         |
| Inquiries           | GET    | /api/inquiries/stats                                       | Admin     | Inquiry statistics              |
| Inquiries           | GET    | /api/inquiries                                             | Protected | Get inquiries                   |
| Inquiries           | POST   | /api/inquiries                                             | Protected | Create inquiry                  |
| Inquiries           | PUT    | /api/inquiries/:id/reply                                   | Admin     | Reply to inquiry                |
| Inquiries           | PATCH  | /api/inquiries/:id/close                                   | Admin     | Close inquiry                   |
| Inquiries           | PUT    | /api/inquiries/:id                                         | Protected | Update inquiry                  |
| Inquiries           | DELETE | /api/inquiries/:id                                         | Protected | Delete inquiry                  |
| Theory Exams        | GET    | /api/exams/theory                                          | Protected | Get theory exams                |
| Theory Exams        | POST   | /api/exams/theory                                          | Admin     | Create theory exam              |
| Theory Exams        | GET    | /api/exams/theory/upcoming                                 | Protected | Get upcoming theory exams       |
| Theory Exams        | GET    | /api/exams/theory/:id                                      | Protected | Get theory exam by ID           |
| Theory Exams        | PUT    | /api/exams/theory/:id                                      | Admin     | Update theory exam              |
| Theory Exams        | DELETE | /api/exams/theory/:id                                      | Admin     | Delete theory exam              |
| Theory Exams        | GET    | /api/exams/theory/:id/assignable-students                  | Admin     | Get assignable students         |
| Theory Exams        | POST   | /api/exams/theory/:id/assign-student                       | Admin     | Assign student                  |
| Theory Exams        | POST   | /api/exams/theory/:id/unassign-student                     | Admin     | Unassign student                |
| Practical Exams     | GET    | /api/exams/practical                                       | Protected | Get practical exams             |
| Practical Exams     | POST   | /api/exams/practical                                       | Admin     | Create practical exam           |
| Practical Exams     | GET    | /api/exams/practical/upcoming                              | Protected | Get upcoming practical exams    |
| Practical Exams     | GET    | /api/exams/practical/:id                                   | Protected | Get practical exam by ID        |
| Practical Exams     | PUT    | /api/exams/practical/:id                                   | Admin     | Update practical exam           |
| Practical Exams     | DELETE | /api/exams/practical/:id                                   | Admin     | Delete practical exam           |
| Practical Exams     | GET    | /api/exams/practical/:id/assignable-students               | Admin     | Get assignable students         |
| Practical Exams     | POST   | /api/exams/practical/:id/assign-student                    | Admin     | Assign student                  |
| Practical Exams     | POST   | /api/exams/practical/:id/unassign-student                  | Admin     | Unassign student                |
| Exam Progress       | GET    | /api/exam-progress/students                                | Admin     | Get all student progress        |
| Exam Progress       | GET    | /api/exam-progress/stats                                   | Admin     | Progress statistics             |
| Exam Progress       | GET    | /api/exam-progress/students/:studentId                     | Protected | Get student progress            |
| Exam Progress       | POST   | /api/exam-progress/students/:studentId/update              | Admin     | Update student progress         |
| Exam Progress       | POST   | /api/exam-progress/recalculate-all                         | Admin     | Recalculate all progress        |
| Exam Attendance     | GET    | /api/exam-attendance                                       | Protected | Get attendance records          |
| Exam Attendance     | POST   | /api/exam-attendance                                       | Protected | Create attendance record        |
| Exam Attendance     | GET    | /api/exam-attendance/analytics                             | Protected | Attendance analytics            |
| Exam Attendance     | GET    | /api/exam-attendance/reports                               | Admin     | Attendance reports              |
| Exam Results        | POST   | /api/exam-results                                          | Admin     | Create exam result              |
| Exam Results        | GET    | /api/exam-results/exam/:examType/:examId                   | Protected | Get exam results                |
| Exam Results        | GET    | /api/exam-results/stats                                    | Admin     | Result statistics               |
| Exam Results        | GET    | /api/exam-results/student/:studentId                       | Protected | Get student results             |
| Student Exams       | GET    | /api/student-exams/me/exams                                | Protected | Get current student exams       |
| Student Exams       | GET    | /api/student-exams/me/exams/:id                            | Protected | Get student exam by ID          |
| Student Exams       | GET    | /api/student-exams/me/exam-status                          | Protected | Get student exam status         |
| Attendance          | GET    | /api/attendance/analytics                                  | Admin     | Attendance analytics            |
| Attendance          | GET    | /api/attendance/session/:sessionId                         | Admin     | Get session attendance          |
| Attendance          | GET    | /api/attendance/student/:studentId                         | Protected | Get student attendance          |
| Attendance          | GET    | /api/attendance/progress/:studentId                        | Admin     | Get student progress            |
| Attendance          | POST   | /api/attendance                                            | Admin     | Mark attendance                 |
| Attendance          | PUT    | /api/attendance/:id                                        | Admin     | Update attendance               |
---

## Setup Instructions

### Step 1 — Clone & setup backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:
```
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/driveon
JWT_SECRET=your_secret_key_here
```

```bash
npm run dev   # starts on http://localhost:5000
```

### Step 2 — Setup frontend

```bash
cd frontend
npm install
npx expo install --fix
```

Edit `src/services/api.js`:
```js
// For local testing (replace with your PC's IP):
export const BASE_URL = 'http://192.168.x.x:5000';

// For deployed backend:
export const BASE_URL = 'https://your-app-production.up.railway.app';
```

```bash
npx expo start --clear
```
Scan QR code with Expo Go app.

---

## Deployment (Render - Free)

1. Push backend folder to GitHub
2. Go to https://railway.com → New Web Service
3. Connect your repo, set root directory to `backend`
4. Set environment variables:
   - `MONGO_URI` = your MongoDB Atlas URI
   - `JWT_SECRET` = your secret key
   - `NODE_ENV` = production
5. Deploy → copy the live URL
6. Update `BASE_URL` in frontend `src/services/api.js`

---

## MongoDB Atlas Setup

1. Go to https://cloud.mongodb.com
2. Create free cluster
3. Create database user
4. Whitelist IP: `0.0.0.0/0` (allow all for deployment)
5. Copy connection string → paste into `.env` as `MONGO_URI`

---

## Workload Distribution (6 Members)

| Member | Module                                     | Entity                 | Focus Area                                 |
|--------|--------------------------------------------|------------------------|--------------------------------------------|
| 1      | Student Enrollment and Managing Module     |Student /Payment/Inquiry| CRUD operations + session reminder feature |
| 2      | Session Management Module                  | Session                | Book, View, Cancel, Manage Sessions        |
| 3      | Instructor and Vehicle Management Module   | Instructor / Vehicle   | CRUD + Image Upload                        |
| 4      | Exams and Student Progress Tracking Module | Quiz / Progress        | Create Exams, Track Results                |
| 5      | Admin and Internal Staff Managing Module   | Staff / Admin          | Staff CRUD, Roles, Attendance              |
| 6      | Learning Content Management Module         | Learning Content       | Create, View, Update Learning Content      |
