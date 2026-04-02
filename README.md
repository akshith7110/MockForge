# MockForge — API Mock Server

<div align="center">

![MockForge](https://img.shields.io/badge/MockForge-API%20Mock%20Server-4e8ef7?style=for-the-badge&logo=node.js&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-v18%2B-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-v5-000000?style=for-the-badge&logo=express&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

**A web-based developer utility that generates mock API endpoints and simulates custom JSON responses — no backend required.**

[Features](#-features) · [Demo](#-demo) · [Quick Start](#-quick-start) · [API Reference](#-api-reference) · [Screenshots](#-screenshots)

</div>

---

##  What is MockForge?

MockForge is a lightweight developer tool built with **Node.js** and **Express.js** that lets you spin up fake REST API endpoints in seconds. Instead of waiting for a backend to be ready, you configure mock routes through a dashboard UI — complete with custom JSON responses, HTTP status codes, and simulated network delays.

```
Your Frontend  →  http://localhost:3000/mock/api/users  →  MockForge  →  { "users": [...] }
```

---

##  Features

| Feature | Description |
|---|---|
|  **Dynamic Wildcard Routing** | One handler serves all registered paths — any method, any depth |
|  **Real-Time JSON Validation** | Live validation as you type in the dashboard |
|  **Custom Status Codes** | Simulate 200, 201, 401, 404, 500 and any code in between |
|  **Simulated Latency** | Configure delays from 0ms to 30s to test loading states |
|  **File Persistence** | Endpoints survive server restarts — saved to `data/db.json` |
|  **Import / Export** | Share mock configs with your team as portable JSON files |
|  **Request Logger** | Live log of every request hitting your mock endpoints |
|  **Open CORS** | Any frontend on any origin can call mock endpoints freely |

---

##  Quick Start

### Prerequisites

- Node.js v18+
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/mock-api-server.git
cd mock-api-server

# Install dependencies
npm install express cors uuid

# Start the server
npx nodemon server.js
```

### Open the Dashboard

```
http://localhost:3000
```

That's it. Create your first mock endpoint from the dashboard and start calling it from your frontend.

---

##  Project Structure

```
mock-api-server/
├── server.js               # Express entry point — middleware, routes, CORS
├── store.js                # In-memory endpoint store with persistence hooks
├── persistence.js          # File I/O — reads/writes data/db.json
├── routes/
│   ├── admin.js            # CRUD API for managing mock endpoints
│   ├── mock.js             # Wildcard handler — matches requests to mocks
│   └── importExport.js     # Import & export config routes
├── public/
│   └── index.html          # Single-file dashboard UI
├── data/
│   └── db.json             # Auto-generated persistence file
└── package.json
```

---

##  Usage

### 1. Register a Mock Endpoint

Use the dashboard at `http://localhost:3000` or call the admin API directly:

```bash
curl -X POST http://localhost:3000/admin/endpoints \
  -H "Content-Type: application/json" \
  -d '{
    "method": "GET",
    "path": "/api/users",
    "statusCode": 200,
    "delay": 500,
    "body": {
      "users": [
        { "id": 1, "name": "Alice", "role": "Admin" },
        { "id": 2, "name": "Bob",   "role": "Editor" }
      ]
    }
  }'
```

### 2. Call the Mock from Your Frontend

```js
// All mock endpoints live under /mock/
const BASE_URL = 'http://localhost:3000/mock';

const res = await fetch(`${BASE_URL}/api/users`);
const data = await res.json();
// → { users: [{ id: 1, name: 'Alice', role: 'Admin' }, ...] }
// → Response arrives after 500ms (simulated delay)
```

### 3. Switch to Real Backend

```js
// Change ONE line — no other code changes needed
const BASE_URL = 'https://api.yourapp.com'; // was: 'http://localhost:3000/mock'
```

---

## 📡 API Reference

### Admin Endpoints

> All admin routes are locked to `localhost:3000` by default.

| Method | Route | Description |
|---|---|---|
| `GET` | `/admin/endpoints` | List all registered mock endpoints |
| `GET` | `/admin/endpoints/:id` | Get a single endpoint by ID |
| `POST` | `/admin/endpoints` | Register a new mock endpoint |
| `PUT` | `/admin/endpoints/:id` | Update an existing mock endpoint |
| `DELETE` | `/admin/endpoints/:id` | Delete a specific mock endpoint |
| `DELETE` | `/admin/endpoints` | Clear all mock endpoints |
| `POST` | `/admin/validate-json` | Validate a JSON string |
| `GET` | `/admin/export` | Download all mocks as a `.json` config file |
| `POST` | `/admin/import` | Import a config file (`merge` or `replace` mode) |
| `GET` | `/admin/logs` | View the last 100 request log entries |

### Endpoint Object Schema

```json
{
  "method":      "GET",
  "path":        "/api/users",
  "statusCode":  200,
  "delay":       500,
  "description": "Returns a list of users",
  "body": {
    "users": []
  }
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `method` | string | ✅ | HTTP method: GET, POST, PUT, PATCH, DELETE |
| `path` | string | ✅ | Must start with `/` |
| `statusCode` | number | ❌ | Default: `200`. Range: 100–599 |
| `delay` | number | ❌ | Default: `0`. Range: 0–30000 (ms) |
| `body` | object | ❌ | Default: `{}`. Must be valid JSON |
| `description` | string | ❌ | Optional label for the endpoint |

---

##  Import / Export

### Export all mocks

```bash
curl http://localhost:3000/admin/export -o my-mocks.json
```

### Import a config

```bash
# Merge (keep existing endpoints)
curl -X POST http://localhost:3000/admin/import \
  -H "Content-Type: application/json" \
  -d "{\"config\": $(cat my-mocks.json), \"mode\": \"merge\"}"

# Replace (clear all first)
curl -X POST http://localhost:3000/admin/import \
  -H "Content-Type: application/json" \
  -d "{\"config\": $(cat my-mocks.json), \"mode\": \"replace\"}"
```

### Config File Format

```json
{
  "version": 1,
  "exportedAt": "2025-01-01T00:00:00.000Z",
  "endpoints": [
    {
      "method": "GET",
      "path": "/api/users",
      "statusCode": 200,
      "delay": 500,
      "body": { "users": [] },
      "description": "Returns all users"
    }
  ]
}
```

---

## Testing All HTTP Methods

```bash
# GET
curl http://localhost:3000/mock/api/users

# POST
curl -X POST http://localhost:3000/mock/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Charlie"}'

# PUT
curl -X PUT http://localhost:3000/mock/api/users/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Name"}'

# PATCH
curl -X PATCH http://localhost:3000/mock/api/users/1 \
  -H "Content-Type: application/json" \
  -d '{"status":"inactive"}'

# DELETE
curl -X DELETE http://localhost:3000/mock/api/users/1

# Test simulated delay
curl -w "\nTime: %{time_total}s\n" http://localhost:3000/mock/api/users
```

---

##  CORS Configuration

MockForge uses a **two-tier CORS strategy**:

| Route | CORS Policy | Why |
|---|---|---|
| `/admin/*` | `localhost:3000` only | Admin API is protected — only the dashboard can manage mocks |
| `/mock/*` | `*` (all origins) | Mock endpoints must be accessible from any frontend app |

To change the admin origin, set the environment variable:

```bash
ADMIN_ORIGIN=http://localhost:5173 node server.js
```

---

##  Use Cases

- **Frontend development** — Build full UIs before the backend exists
- **Testing edge cases** — Simulate 401, 500, slow responses, empty states
- **Team collaboration** — Export mock configs and share with teammates
- **Demo environments** — Set up realistic data for product demos
- **Learning REST APIs** — Understand HTTP methods and status codes hands-on

---

## 🔧 Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Port the server listens on |
| `ADMIN_ORIGIN` | `http://localhost:3000` | Allowed origin for admin routes |

```bash
PORT=8080 ADMIN_ORIGIN=http://localhost:5173 node server.js
```

---

##  Known Issues & Fixes

### Express v5 Wildcard Syntax

If you see `PathError: Missing parameter name at index 2: /*`, you're on Express v5. Use the new wildcard syntax:

```js
//  Express v4
router.all('/*', handler);

//  Express v5
router.all('/{*path}', handler);
```

### PUT/PATCH/DELETE CORS Issues

Browsers send an OPTIONS preflight before non-simple methods. Ensure your server handles it:

```js
app.use(cors());                          // global — catches all preflights
app.options(/.*/, mockCors);              // explicit OPTIONS handler
app.use('/mock', mockCors, mockRouter);   // mock routes with open CORS
```

---

##  Dependencies

```json
{
  "dependencies": {
    "express": "^5.x",
    "cors": "^2.x",
    "uuid": "^9.x"
  },
  "devDependencies": {
    "nodemon": "^3.x"
  }
}
```

---

##  Roadmap

- [ ] WebSocket mock support
- [ ] Response templates (paginated, error envelope, empty state)
- [ ] Environment variable injection in response bodies
- [ ] Mock groups / collections
- [ ] Request body matching (respond differently based on request payload)
- [ ] Docker support

---

##  License

MIT — free to use, modify, and distribute.

---

<div align="center">

Built with Node.js + Express.js · No database · No build step · Just mock it.

</div>
