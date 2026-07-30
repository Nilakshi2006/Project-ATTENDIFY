# Attendify

**Attendify** is a face recognition–based attendance management system for classrooms. It uses a webcam to automatically identify students and mark their attendance in real time — no roll calls, no manual entry.

---

## Features

- **Automated face recognition** — detects and identifies students from a live webcam feed using OpenCV's LBPH (Local Binary Pattern Histogram) algorithm
- **Student registration** — capture face samples via the browser and register students with their ID and class
- **Attendance dashboard** — view today's attendance records and class statistics at a glance
- **Monthly attendance reports** — per-student history with attendance percentage calculations
- **JWT authentication** — secure login/signup for teachers and admins
- **REST API backend** — Node.js + Express server with MongoDB storage

---
## Screenshots

### Dashboard Page



























## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla HTML, CSS, JavaScript |
| Backend | Node.js, Express.js |
| Database | MongoDB (via Mongoose) |
| Face Recognition | Python, OpenCV (LBPH), Haar Cascade |
| Auth | JWT, bcryptjs |

---

## Project Structure

```
Attendify/
├── frontend/              # HTML pages and client-side scripts
│   ├── scripts/           # JavaScript for each page
│   ├── styles/            # CSS stylesheets
│   ├── models/            # face-api.js model weights (browser-side)
│   ├── login.html
│   ├── dashboard.html
│   ├── attendance.html
│   ├── register-face.html
│   ├── students.html
│   └── report.html
│
├── backend/               # Node.js API server
│   ├── config/db.js       # MongoDB connection
│   ├── controllers/       # Route handler logic
│   ├── models/            # Mongoose schemas (User, Student, Attendance)
│   ├── routes/            # Express route definitions
│   ├── middleware/        # Auth middleware (JWT verification)
│   └── server.js          # App entry point
│
└── face_engine/           # Python face recognition engine
    ├── train_lbph.py      # Trains the LBPH model from saved face images
    ├── recognize_face.py  # Reads a base64 image and returns identified faces
    ├── faces/students/    # Face image dataset (created on registration)
    └── models/            # Saved LBPH model, labels, and Haar Cascade XML
```

---

## Prerequisites

- **Node.js** v18+
- **Python** 3.8+ with the following packages:
  - `opencv-contrib-python`
  - `numpy`
  - `requests`
- **MongoDB** (local instance or MongoDB Atlas connection string)

Install Python dependencies:

```bash
pip install opencv-contrib-python numpy requests
```

---

## Setup & Installation

### 1. Clone the repository

```bash
git clone https://github.com/your-username/attendify.git
cd attendify
```

### 2. Configure environment variables

Create a `.env` file inside the `backend/` directory:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/attendify
JWT_SECRET=your_jwt_secret_key
```

### 3. Install backend dependencies

```bash
cd backend
npm install
```

### 4. Start the backend server

```bash
npm run dev      # development (nodemon)
# or
npm start        # production
```

The server will start at `http://localhost:5000`.

### 5. Open the frontend

Open `frontend/login.html` directly in your browser, or serve the `frontend/` folder with a static server:

```bash
# Example using Python's built-in server
cd frontend
python -m http.server 3000
```

Then navigate to `http://localhost:3000/login.html`.

---

## How It Works

### Registering a Student

1. Go to the **Register Face** page.
2. Enter the student's name, ID, and class.
3. Capture face images through the browser webcam.
4. The images are sent to the backend, saved to `face_engine/faces/students/<id>/`, and the LBPH model is retrained automatically.

### Marking Attendance

1. Go to the **Attendance** page.
2. The webcam feed is captured and sent as a base64 image to `POST /api/attendance/mark`.
3. The backend passes the image to `recognize_face.py` via a child process.
4. The Python script detects faces, runs LBPH recognition, and returns identified student IDs.
5. Matched students are looked up in MongoDB and their attendance is recorded for the day (no duplicates).

### Viewing Reports

- The **Dashboard** shows today's attendance summary.
- The **Report** page shows a per-student monthly attendance history with present/absent breakdown and percentage.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup` | Register a new user account |
| POST | `/api/auth/login` | Login and receive a JWT |
| GET | `/api/students` | List all students |
| POST | `/api/students` | Add a new student |
| POST | `/api/train/register-face` | Register face images and retrain model |
| POST | `/api/attendance/mark` | Mark attendance from a webcam image |
| GET | `/api/attendance/today` | Get today's attendance records |
| DELETE | `/api/attendance/today` | Clear today's attendance records |
| GET | `/api/attendance/student/:studentId` | Get monthly attendance for a student |

---

## Notes

- The face recognition model must be trained at least once before attendance marking will work. Registering the first student triggers training automatically.
- The LBPH confidence threshold is set to `90` — faces with a confidence score above this are classified as `Unknown`.
- The backend spawns the Python scripts as child processes, so Python must be available in the system PATH (or adjust the executable path in `attendanceRoutes.js`).
- `node_modules/` and `face_engine/venv/` are excluded from version control via `.gitignore`.

---

## License

This project is open source and available under the [MIT License](LICENSE).