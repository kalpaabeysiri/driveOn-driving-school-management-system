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

| Module         | Method | Endpoint                                         | Access      | Purpose                             |
|----------------|--------|--------------------------------------------------|-------------|-------------------------------------|
| Auth           | POST   | /api/auth/register                               | Public      | Register user                       |
| Auth           | POST   | /api/auth/login                                  | Public      | User login                          |
| Auth           | GET    | /api/auth/profile                                | Protected   | Get user profile                    |
| Auth           | PUT    | /api/auth/profile                                | Protected   | Update user profile                 |
| Students       | GET    | /api/students                                    | Admin       | Get all students                    |
| Students       | POST   | /api/students                                    | Admin       | Add student                         |
| Students       | GET    | /api/students/:id                                | Protected   | Get student by ID                   |
| Students       | PUT    | /api/students/:id                                | Admin       | Update student                      |
| Students       | DELETE | /api/students/:id                                | Admin       | Delete student                      |
| Students       | PATCH  | /api/students/:id/status                         | Admin       | Update student status               |
| Sessions       | GET    | /api/sessions                                    | Protected   | Get all sessions                    |
| Sessions       | POST   | /api/sessions                                    | Admin       | Create session                      |
| Sessions       | GET    | /api/sessions/available                          | Protected   | View available sessions             |
| Sessions       | POST   | /api/sessions/:id/book                           | Protected   | Book session                        |
| Sessions       | DELETE | /api/sessions/:id/book                           | Protected   | Cancel booking                      |
| Instructors    | GET    | /api/instructors                                 | Protected   | Get instructors                     |
| Instructors    | POST   | /api/instructors                                 | Admin       | Add instructor                      |
| Instructors    | PUT    | /api/instructors/:id                             | Admin       | Update instructor                   |
| Instructors    | DELETE | /api/instructors/:id                             | Admin       | Delete instructor                   |
| Vehicles       | GET    | /api/vehicles                                    | Protected   | Get vehicles                        |
| Vehicles       | POST   | /api/vehicles                                    | Admin       | Add vehicle                         |
| Vehicles       | PUT    | /api/vehicles/:id                                | Admin       | Update vehicle                      |
| Vehicles       | DELETE | /api/vehicles/:id                                | Admin       | Delete vehicle                      |
| Payments       | GET    | /api/payments                                    | Protected   | View payments                       |
| Payments       | POST   | /api/payments                                    | Protected   | Record payment                      |
| Payments       | GET    | /api/payments/:id                                | Protected   | Get payment details                 |
| Payments       | PUT    | /api/payments/:id                                | Protected   | Update payment                      |
| Payments       | DELETE | /api/payments/:id                                | Protected   | Delete payment                      |
| Quizzes        | GET    | /api/quizzes                                     | Protected   | View quizzes                        |
| Quizzes        | POST   | /api/quizzes                                     | Admin       | Create quiz                         |
| Quizzes        | PUT    | /api/quizzes/:id                                 | Admin       | Update quiz                         |
| Quizzes        | DELETE | /api/quizzes/:id                                 | Admin       | Delete quiz                         |
| Learning       | GET    | /api/learning/lessons                            | Protected   | Get lessons                         |
| Learning       | POST   | /api/learning/lessons                            | Admin       | Add lesson                          |
| Learning       | GET    | /api/learning/student/progress                   | Protected   | Track student progress              |
| Exams          | GET    | /api/exams/theory                                | Protected   | View theory exams                   |
| Exams          | POST   | /api/exams/theory                                | Admin       | Create theory exam                  |
| Exams          | GET    | /api/exams/practical                             | Protected   | View practical exams                |
| Exams          | POST   | /api/exams/practical                             | Admin       | Create practical exam               |
| Attendance     | GET    | /api/attendance/session/:sessionId               | Admin       | Get session attendance              |
| Attendance     | POST   | /api/attendance                                  | Admin       | Mark attendance                     |
| Attendance     | GET    | /api/attendance/student/:studentId               | Protected   | View student attendance             |
| Feedback       | GET    | /api/feedbacks                                   | Protected   | Get feedback                        |
| Feedback       | POST   | /api/feedbacks                                   | Protected   | Submit feedback                     |
| Inquiries      | GET    | /api/inquiries                                   | Protected   | View inquiries                      |
| Inquiries      | POST   | /api/inquiries                                   | Protected   | Submit inquiry                      |
| Notifications  | GET    | /api/notifications                               | Protected   | View notifications                  |
| Notifications  | POST   | /api/notifications                               | Admin       | Send notifications                  |
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
