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

## API Endpoints

### Authentication
- `POST /api/auth/login` — Login
- `GET /api/auth/me` — Current user

### Admin (requires admin role)
- `POST /api/admin/commercials` — Create commercial account
- `GET /api/admin/commercials` — List commercials
- `GET /api/admin/commercials/:id` — Get commercial details
- `GET /api/admin/tickets` — List all tickets
- `GET /api/admin/tickets/:id` — Get ticket details
- `PATCH /api/admin/tickets/:id/status` — Update ticket status

### Commercial (requires authentication)
- `GET /api/commercials/tickets` — List own tickets
- `POST /api/commercials/tickets` — Create ticket (multipart/form-data)

### Health
- `GET /health` — Health check
