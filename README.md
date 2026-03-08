# Tickets API

A ticket management REST API built with Fastify.

## Tech Stack

- **Fastify** — Web framework
- **Sequelize** — ORM
- **MySQL** — Database
- **JWT** — Authentication

## Getting Started

### Prerequisites
- Node.js (v20.19+ or v22.12+)
- MySQL

### Installation

```bash
npm install
```

### Configuration

Create a `.env` file at the root with the following variables:

```env
PORT=3000
HOST=0.0.0.0
DB_NAME=ticket_system
DB_USER=root
DB_PASSWORD=
DB_HOST=localhost
DB_PORT=8080
JWT_SECRET=your_jwt_secret
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
UPLOAD_PATH=./uploads
```

### Development

```bash
npm run dev
```

### Production

```bash
npm start
```

## Project Structure

```
Tickets_system/
├── src/
│   ├── app.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── adminController.js
│   │   └── commercialController.js
│   ├── models/
│   │   ├── User.js
│   │   └── Ticket.js
│   ├── plugins/
│   │   ├── db.js
│   │   ├── auth.js
│   │   └── upload.js
│   └── routes/
│       ├── authRoutes.js
│       ├── adminRoutes.js
│       └── commercialRoutes.js
├── server.js
├── test.http
└── package.json
```

## Data Models

### User

| Field            | Type                          | Notes                          |
|------------------|-------------------------------|--------------------------------|
| id               | INTEGER (PK, auto-increment)  |                                |
| name             | STRING                        | required                       |
| email            | STRING                        | required, unique               |
| password         | STRING                        | required, hashed               |
| role             | ENUM(`admin`, `commercial`)   | default: `commercial`          |
| bio              | TEXT                          | nullable                       |
| status           | ENUM(`active`, `suspended`)   | nullable (null for admin)      |
| profileImagePath | STRING                        | nullable                       |

### Ticket

| Field      | Type                                    | Notes            |
|------------|-----------------------------------------|------------------|
| id         | INTEGER (PK, auto-increment)            |                  |
| title      | STRING                                  | required         |
| description| TEXT                                    | optional         |
| amount     | DECIMAL(10,2)                           | required         |
| imagePath  | STRING                                  | required         |
| status     | ENUM(`pending`, `verified`, `paid`)     | default: `pending`|
| ticketDate | DATE                                    | required         |
| userId     | INTEGER (FK -> User)                    |                  |

## API Endpoints

### Authentication

| Method | Endpoint           | Description   | Auth |
|--------|--------------------|---------------|------|
| POST   | `/api/auth/login`  | Login         | No   |
| GET    | `/api/auth/me`     | Current user  | Yes  |

#### `POST /api/auth/login`

**Body (JSON):**
```json
{ "email": "john@example.com", "password": "secret" }
```

**Response:**
```json
{
  "token": "eyJhbG...",
  "user": { "id": 1, "email": "john@example.com", "role": "commercial" }
}
```

#### `GET /api/auth/me`

**Response:**
```json
{
  "user": {
    "id": 1, "name": "John Doe", "email": "john@example.com",
    "role": "commercial", "bio": "...", "status": "active",
    "profileImagePath": "uploads/profiles/abc.jpg",
    "createdAt": "...", "updatedAt": "..."
  }
}
```

---

### Admin (requires admin role)

| Method | Endpoint                              | Description                  |
|--------|---------------------------------------|------------------------------|
| GET    | `/api/admin/commercials`              | List all commercials         |
| GET    | `/api/admin/commercials/:id`          | Get commercial details       |
| GET    | `/api/admin/commercials/:id/tickets`  | Get commercial's tickets     |
| POST   | `/api/admin/commercials`              | Create commercial account    |
| PATCH  | `/api/admin/commercials/:id`          | Update commercial            |
| GET    | `/api/admin/tickets`                  | List all tickets             |
| GET    | `/api/admin/tickets/:id/image`        | Get ticket image path        |
| PATCH  | `/api/admin/tickets/:id/status`       | Update ticket status         |

#### `POST /api/admin/commercials`

**Body (multipart/form-data):**
- `name` (required), `email` (required), `password` (required), `bio` (optional), profile image file (optional)

**Response (201):**
```json
{ "message": "Commercial account created successfully", "id": 1 }
```

#### `PATCH /api/admin/commercials/:id`

**Body (multipart/form-data):**
- `name` (optional), `bio` (optional), `status`: `active` | `suspended` (optional), profile image file (optional)

**Response:**
```json
{
  "message": "Commercial updated successfully",
  "commercial": {
    "id": 1, "name": "John Doe", "email": "john@example.com",
    "role": "commercial", "bio": "...", "status": "active",
    "profileImagePath": "uploads/profiles/abc.jpg",
    "createdAt": "...", "updatedAt": "..."
  }
}
```

#### `GET /api/admin/commercials/:id/tickets`

**Response:** (no `imagePath`)
```json
[
  {
    "id": 1, "title": "Office supplies", "description": "Printer ink",
    "amount": "150.00", "status": "pending",
    "ticketDate": "2026-03-01T00:00:00.000Z",
    "createdAt": "...", "updatedAt": "...", "userId": 1
  }
]
```

#### `GET /api/admin/tickets`

**Response:** (no `imagePath`)
```json
[
  {
    "id": 1, "title": "Office supplies", "description": "Printer ink",
    "amount": "150.00", "status": "pending",
    "ticketDate": "2026-03-01T00:00:00.000Z",
    "createdAt": "...", "updatedAt": "...", "userId": 1,
    "owner": { "email": "john@example.com" }
  }
]
```

#### `GET /api/admin/tickets/:id/image`

**Response:**
```json
{ "id": 1, "imagePath": "uploads/some-uuid.jpg" }
```

#### `PATCH /api/admin/tickets/:id/status`

**Body (JSON):**
```json
{ "status": "verified" }
```

**Response:**
```json
{ "message": "Ticket 1 is now verified" }
```

---

### Commercial (requires authentication)

| Method | Endpoint                              | Description          |
|--------|---------------------------------------|----------------------|
| PATCH  | `/api/commercials/profile`            | Update own profile   |
| GET    | `/api/commercials/tickets`            | List own tickets     |
| GET    | `/api/commercials/tickets/:id/image`  | Get ticket image path|
| POST   | `/api/commercials/tickets`            | Create ticket        |

#### `PATCH /api/commercials/profile`

**Body (multipart/form-data):**
- `name` (optional), `bio` (optional), profile image file (optional)

**Response:**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": 1, "name": "John Doe", "email": "john@example.com",
    "role": "commercial", "bio": "...", "status": "active",
    "profileImagePath": "uploads/profiles/abc.jpg",
    "createdAt": "...", "updatedAt": "..."
  }
}
```

#### `GET /api/commercials/tickets`

**Response:** (no `imagePath`)
```json
[
  {
    "id": 1, "title": "Office supplies", "description": "Printer ink",
    "amount": "150.00", "status": "pending",
    "ticketDate": "2026-03-01T00:00:00.000Z",
    "createdAt": "...", "updatedAt": "...", "userId": 1
  }
]
```

#### `GET /api/commercials/tickets/:id/image`

**Response:**
```json
{ "id": 1, "imagePath": "uploads/some-uuid.jpg" }
```

#### `POST /api/commercials/tickets`

**Body (multipart/form-data):**
- `title` (required), `amount` (required), `ticketDate` (required), `description` (optional), ticket image file (required)

**Response (201):**
```json
{
  "message": "Ticket created successfully",
  "ticket": {
    "id": 1, "title": "Office supplies", "description": "Printer ink",
    "amount": "150.00", "imagePath": "uploads/some-uuid.jpg",
    "status": "pending", "ticketDate": "2026-03-01T00:00:00.000Z",
    "userId": 1, "createdAt": "...", "updatedAt": "..."
  }
}
```

---

### Health

| Method | Endpoint  | Description  |
|--------|-----------|--------------|
| GET    | `/health` | Health check |

## Docker

```bash
docker-compose up --build
```
