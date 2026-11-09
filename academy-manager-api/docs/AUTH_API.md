# Academy Manager API — Authentication Documentation 🔐

Base URL: `http://localhost:5000/api/v1/auth`

---

## Overview & Security Highlights

- **JWT Dual-Token Architecture**:
  - **Access Token**: Short-lived (15 minutes), payload `{ sub: userId, academyId, role }`. Passed in the `Authorization: Bearer <accessToken>` header.
  - **Refresh Token**: Long-lived (7 days), payload `{ sub, academyId, role, jti }`. Stored securely as an `HttpOnly` cookie (`sameSite: 'lax'`, `path: '/api/v1/auth'`).
- **Database Storage**: Refresh tokens and reset tokens are **NEVER stored in plaintext** in the database; only cryptographic **SHA-256 hashes** are stored.
- **Token Rotation**: Every `/refresh` call automatically revokes the old token and issues a new refresh token and access token.
- **Password Security**: Passwords are required to be $\ge 8$ characters containing letters and numbers, hashed with `bcryptjs` at work factor **12**.
- **Brute-Force & Lockout Protection**:
  - Accounts are automatically locked for **15 minutes** after **5 consecutive failed login attempts**.
  - Sensitive endpoints (`/signup`, `/login`, `/parent-login`, `/forgot-password`) enforce strict IP rate limiting (**10 requests per 15 minutes**).
- **Anti-Enumeration**: `/forgot-password` and `/login` return uniform, non-leaking error and status messages.
- **Audit Logging**: Every signup, login, logout, password change, and password reset is logged to the `activity_logs` table.

---

## Endpoints

### 1. Register / Signup
- **Method & Path**: `POST /signup` (or `POST /register`)
- **Rate Limit**: 10 req / 15 mins
- **Description**: Atomically creates the Academy, creates the Owner user (`role: 'owner'`), inserts optional subjects, logs activity, sets the refresh cookie, and returns the access token.

**Request Body**:
```json
{
  "name": "Prof. Muhammad Tariq",
  "email": "tariq@scienceacademy.pk",
  "phone": "03001234567",
  "password": "Password123",
  "academyName": "Apex Science Academy",
  "city": "Lahore",
  "studentsRange": "50-100",
  "subjects": ["Physics", "Chemistry", "Mathematics"]
}
```

**Success Response (`201 Created`)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 115,
      "academyId": 4,
      "name": "Prof. Muhammad Tariq",
      "email": "tariq@scienceacademy.pk",
      "phone": "03001234567",
      "role": "owner"
    },
    "academy": {
      "id": 4,
      "name": "Apex Science Academy",
      "slug": "apex-science-academy",
      "city": "Lahore",
      "plan": "free_pilot"
    },
    "accessToken": "eyJhbGciOi..."
  }
}
```
*Note: Also sets an `HttpOnly` cookie `refreshToken`.*

---

### 2. Login (Owner, Teacher, Staff)
- **Method & Path**: `POST /login`
- **Rate Limit**: 10 req / 15 mins
- **Description**: Authenticates via email and password. Increments failed attempt count and locks for 15 minutes on 5 consecutive failures.

**Request Body**:
```json
{
  "email": "owner@demo.com",
  "password": "Demo@1234"
}
```

**Success Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "academyId": 1,
      "name": "Arqam Ishaq",
      "email": "owner@demo.com",
      "phone": "0300-5551234",
      "role": "owner",
      "avatarUrl": "https://images.unsplash.com/...",
      "lastLoginAt": "2026-11-09T07:44:27.000Z"
    },
    "academy": {
      "id": 1,
      "name": "Bright Future Academy",
      "slug": "bright-future-academy",
      "city": "Lahore",
      "plan": "standard"
    },
    "accessToken": "eyJhbGciOi..."
  }
}
```

---

### 3. Parent Login
- **Method & Path**: `POST /parent-login`
- **Rate Limit**: 10 req / 15 mins
- **Description**: Designed specifically for parents logging in with Pakistani mobile phone number and password.

**Request Body**:
```json
{
  "phone": "0300-1110001",
  "password": "Demo@1234"
}
```

**Success Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 101,
      "academyId": 1,
      "name": "Tariq Mehmood",
      "email": "parent.tariq@demo.com",
      "phone": "0300-1110001",
      "role": "parent",
      "avatarUrl": null
    },
    "academy": {
      "id": 1,
      "name": "Bright Future Academy",
      "slug": "bright-future-academy"
    },
    "accessToken": "eyJhbGciOi..."
  }
}
```

---

### 4. Refresh Access Token
- **Method & Path**: `POST /refresh`
- **Description**: Reads refresh token from cookie (or optional `{ "refreshToken": "..." }` body). Validates SHA-256 hash in database, ensures token is not revoked and not expired, rotates the token pair, and returns a new access token.

**Success Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOi..."
  }
}
```

---

### 5. Get Current Profile (`/me`)
- **Method & Path**: `GET /me`
- **Headers**: `Authorization: Bearer <accessToken>`
- **Description**: Returns profile info of the logged-in user and full academy configuration.

**Success Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "academyId": 1,
      "name": "Arqam Ishaq",
      "email": "owner@demo.com",
      "phone": "0300-5551234",
      "role": "owner",
      "avatarUrl": "...",
      "lastLoginAt": "2026-11-09T07:44:27.000Z",
      "createdAt": "2026-11-09 12:00:00"
    },
    "academy": {
      "id": 1,
      "name": "Bright Future Academy",
      "slug": "bright-future-academy",
      "city": "Lahore",
      "phone": "0300-5551234",
      "email": "contact@brightfuture.edu.pk",
      "logoUrl": "...",
      "plan": "standard",
      "feeDueDay": 10,
      "lateFeeEnabled": true,
      "lateFeeAmount": 200
    }
  }
}
```

---

### 6. Update Current Profile (`/me`)
- **Method & Path**: `PATCH /me`
- **Headers**: `Authorization: Bearer <accessToken>`
- **Description**: Updates profile details (`name`, `phone`, `avatarUrl`).

**Request Body**:
```json
{
  "name": "Prof. Arqam Ishaq",
  "phone": "0300-5551234",
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

---

### 7. Change Password
- **Method & Path**: `POST /change-password`
- **Headers**: `Authorization: Bearer <accessToken>`
- **Description**: Verifies current password, hashes new password with bcrypt (cost 12), and immediately revokes all other active refresh sessions for the user.

**Request Body**:
```json
{
  "currentPassword": "Demo@1234",
  "newPassword": "NewStrongPassword123"
}
```

**Success Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "message": "Password changed successfully. All other active sessions have been revoked."
  }
}
```

---

### 8. Forgot Password
- **Method & Path**: `POST /forgot-password`
- **Rate Limit**: 10 req / 15 mins
- **Description**: Generates a random cryptographic reset token, saves its SHA-256 hash with 30-minute expiry, and logs the reset link to the server console. Returns a generic response to prevent email enumeration.

**Request Body**:
```json
{
  "email": "owner@demo.com"
}
```

**Success Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "message": "If an account with that email exists, a password reset link has been generated."
  }
}
```

---

### 9. Reset Password
- **Method & Path**: `POST /reset-password`
- **Description**: Validates token hash and expiration timestamp, updates user's password with cost 12 bcrypt hash, resets any lockout count, and revokes all active sessions.

**Request Body**:
```json
{
  "token": "4f18b3d...",
  "email": "owner@demo.com",
  "newPassword": "BrandNewPassword123"
}
```

**Success Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "message": "Password has been reset successfully. You can now log in with your new password."
  }
}
```

---

### 10. Logout (Current Session)
- **Method & Path**: `POST /logout`
- **Description**: Marks the caller's refresh token as revoked in the database and clears the HttpOnly cookie.

**Success Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

---

### 11. Logout All Sessions
- **Method & Path**: `POST /logout-all`
- **Headers**: `Authorization: Bearer <accessToken>`
- **Description**: Revokes every active refresh token belonging to the authenticated user and clears the current cookie.

**Success Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "message": "All sessions have been revoked successfully."
  }
}
```

