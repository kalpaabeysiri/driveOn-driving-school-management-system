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

| Method | Endpoint                    | Access  | Description              |
|--------|-----------------------------|---------|--------------------------|
| POST   | /api/auth/register          | Public  | Register new user        |
| POST   | /api/auth/login             | Public  | Login user               |
| GET    | /api/auth/profile           | Private | Get profile              |
| PUT    | /api/auth/profile           | Private | Update profile           |
| GET    | /api/sessions               | Private | Get all/my sessions      |
| POST   | /api/sessions               | Private | Book a session           |
| PUT    | /api/sessions/:id           | Private | Update session           |
| DELETE | /api/sessions/:id           | Private | Cancel session           |
| GET    | /api/instructors            | Private | Get all instructors      |
| POST   | /api/instructors            | Admin   | Add instructor           |
| PUT    | /api/instructors/:id        | Admin   | Update instructor        |
| DELETE | /api/instructors/:id        | Admin   | Delete instructor        |
| GET    | /api/vehicles               | Private | Get all vehicles         |
| POST   | /api/vehicles               | Admin   | Add vehicle              |
| PUT    | /api/vehicles/:id           | Admin   | Update vehicle           |
| DELETE | /api/vehicles/:id           | Admin   | Delete vehicle           |
| GET    | /api/payments               | Private | Get all/my payments      |
| POST   | /api/payments               | Private | Record payment           |
| PUT    | /api/payments/:id           | Admin   | Update payment status    |
| DELETE | /api/payments/:id           | Admin   | Delete payment           |
| GET    | /api/quizzes                | Private | Get all quizzes          |
| POST   | /api/quizzes                | Admin   | Create quiz              |
| GET    | /api/quizzes/:id            | Private | Get single quiz          |
| PUT    | /api/quizzes/:id            | Admin   | Update quiz              |
| DELETE | /api/quizzes/:id            | Admin   | Delete quiz              |
| GET    | /api/progress               | Private | Get my progress          |
| POST   | /api/progress               | Private | Submit quiz result       |
| GET    | /api/progress/quiz/:quizId  | Private | Get progress by quiz     |

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
