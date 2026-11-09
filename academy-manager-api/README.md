# Academy Manager Backend API 🚀

REST API service for the **Tuition Academy Manager** SaaS web application, tailored for small tuition centers and coaching institutes in Pakistan.

Built with **Node.js (ES Modules)**, **Express.js**, and **MySQL 8** (using `mysql2` Promise connection pool with plain parameterized SQL queries, no ORM).

---

## 📋 Features

- **Multi-Tenant Architecture**: Organizes students, classes, fees, attendance, and exams by academy ID.
- **Authentication & RBAC**: JWT Access & Refresh tokens with cookie support and role guards (`admin`, `teacher`, `staff`, `student`, `parent`).
- **Student Management**: Full CRUD for matric, intermediate, and entry-test students.
- **Attendance Marking**: Fast daily batch marking and monthly summaries.
- **Fee Management**: PKR tuition vouchers, partial payment tracking, receipts, and WhatsApp reminder endpoints.
- **Exams & Results**: Exam scheduling, marks ledger, and report cards with Pakistani grading scales.
- **Robust Security**: Helmet security headers, CORS origin protection, compression, cookie parsing, and rate limiting (100 req / 15 mins).
- **Zod Validation**: Validates body, query, and params with structured 422 field-level error responses.
- **Centralized Error Handling**: Automatically handles operational `ApiError`, Zod validation errors, MySQL constraint errors (e.g. 1062 duplicate key -> 409, 1451/1452 FK failure -> 400), and unknown 500 errors.

---

## 🛠️ Tech Stack & Dependencies

- **Runtime**: Node.js v18+ (ES Modules: `"type": "module"`)
- **Framework**: Express.js 4.x
- **Database**: MySQL 8.x with `mysql2/promise` connection pool
- **Validation**: Zod 3.x
- **Security & Utilities**:
  - `helmet` - HTTP security headers
  - `cors` - Cross-Origin Resource Sharing
  - `compression` - HTTP response compression
  - `morgan` - HTTP request logger
  - `express-rate-limit` - IP rate limiting
  - `bcryptjs` - Password hashing
  - `jsonwebtoken` - Access & Refresh JWTs
  - `cookie-parser` - HttpOnly cookie parsing
  - `multer` - File upload handling
  - `node-cron` - Background jobs

---

## 📁 Project Structure

```
academy-manager-api/
├── database/
│   ├── schema.sql        # MySQL 8 database schema (tables & constraints)
│   └── seed.sql          # Sample Pakistani demo data (Punjab Coaching Center)
├── src/
│   ├── config/
│   │   ├── env.js        # Environment validation with Zod
│   │   └── db.js         # MySQL2 pool, query() & withTransaction() helpers
│   ├── controllers/      # Thin request controllers
│   ├── middleware/       # auth, roleGuard, validate, upload, errorHandler, notFound
│   ├── routes/           # Modular Express routers & index.js
│   ├── services/         # Business logic & parameterized SQL queries
│   ├── utils/            # ApiError, asyncHandler, response, pagination, logger
│   ├── validators/       # Zod validation schemas
│   ├── jobs/             # Scheduled background jobs (node-cron)
│   ├── app.js            # Express app configuration & middleware pipeline
│   └── server.js         # Server bootstrap, DB health check & graceful shutdown
├── uploads/              # Local storage for student photos & slips (.gitkeep)
├── .env.example          # Sample environment variables
├── .gitignore
├── package.json
└── README.md
```

---

## 🚀 Setup & Installation

### Step 1: Clone & Navigate

```bash
cd Tuition-Academy-Manager/academy-manager-api
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Verify or update the variables in `.env`:

```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=academy_manager
JWT_ACCESS_SECRET=your_jwt_access_secret_min_32_characters_long
JWT_REFRESH_SECRET=your_jwt_refresh_secret_min_32_characters_long
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
CLIENT_URL=http://localhost:3000
COOKIE_SECURE=false
```

### Step 4: Create Database & Run Schema

Open your MySQL client (MySQL Workbench, phpMyAdmin, or command-line):

```sql
-- 1. Create the database and tables
SOURCE database/schema.sql;

-- 2. (Optional) Load sample Pakistani academy data
SOURCE database/seed.sql;
```

Or via CLI:

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```

### Step 5: Start the Development Server

```bash
npm run dev
```

The server will start on `http://localhost:5000` with hot-reloading via `nodemon`.

---

## 🧪 Health Check & Key Endpoints

### 1. Health Check
```http
GET http://localhost:5000/api/v1/health
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "db": "connected",
    "time": "2026-11-09T06:15:00.000Z"
  }
}
```

### 2. Available Route Groups (Under `/api/v1`)

| Module | Route Prefix | Key Endpoints |
|---|---|---|
| **Health** | `/api/v1/health` | `GET /` |
| **Auth** | `/api/v1/auth` | `POST /register`, `POST /login`, `POST /refresh`, `GET /me`, `POST /logout` |
| **Students** | `/api/v1/students` | `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id` |
| **Classes** | `/api/v1/classes` | `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id` |
| **Attendance** | `/api/v1/attendance` | `POST /mark`, `GET /class`, `GET /summary` |
| **Fees** | `/api/v1/fees` | `GET /invoices`, `POST /collect`, `GET /receipts/:id` |
| **Results** | `/api/v1/results` | `GET /exams`, `POST /exams`, `POST /marks`, `GET /report-card/:studentId` |

---

## 🛡️ Response & Error Format

All responses follow a predictable JSON format:

### Success:
```json
{
  "success": true,
  "data": { ... },
  "meta": { "page": 1, "limit": 10, "total": 35 } // optional
}
```

### Error:
```json
{
  "success": false,
  "message": "Human readable error description",
  "errors": [
    { "field": "email", "message": "Invalid email address format" }
  ]
}
```

