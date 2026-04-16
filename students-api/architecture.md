# Architecture — Student Records REST API

## 1. What Is This Project?

A **RESTful API** that performs CRUD operations on student records. No frontend — it's a pure JSON API meant to be tested with tools like `curl`, Postman, or Thunder Client.

---

## 2. Technology Stack

| Technology | Role |
|---|---|
| **Node.js** | JavaScript runtime |
| **Express.js** | Web framework — routing & middleware |

No database — data is stored in an **in-memory JavaScript array**. This is fine for a demo; in production you'd use MongoDB, PostgreSQL, etc.

---

## 3. Project Structure

```
students-api/
├── index.js       ← Entire API (routes + data store)
└── package.json   ← Dependencies
```

---

## 4. REST API Design

### What is REST?

REST uses **HTTP methods** as verbs and **URLs** as nouns:

| HTTP Method | URL | Action | CRUD |
|---|---|---|---|
| `GET` | `/students` | Get all students | **R**ead |
| `GET` | `/students/:id` | Get one student | **R**ead |
| `POST` | `/students` | Create a student | **C**reate |
| `PATCH` | `/students/:id` | Update a student | **U**pdate |
| `DELETE` | `/students/:id` | Delete a student | **D**elete |

### Student Schema

```json
{
  "id": 1,
  "name": "Aarav Sharma",
  "branch": "Computer Engineering",
  "year": 3
}
```

---

## 5. Key Code Explained

### 5.1 Setting Up

```js
import express from "express";
const app = express();
const PORT = 3000;
```

### 5.2 JSON Middleware

```js
app.use(express.json());
```

This **parses incoming JSON** request bodies and puts the data in `req.body`. Without this, `req.body` would be `undefined` when a client sends JSON.

Compare with the UV screen project which uses `express.urlencoded()` — that parses HTML form data. Here we parse JSON because this is a pure API (no HTML forms).

### 5.3 In-Memory Data Store

```js
let students = [
  { id: 1, name: "Aarav Sharma", branch: "Computer Engineering", year: 3 },
  // ...
];
let nextId = 4;
```

- `let` (not `const`) because the array will be mutated (push, splice)
- `nextId` is a simple auto-increment counter for new student IDs
- Data resets when the server restarts (in-memory only)

### 5.4 GET /students — Read All

```js
app.get("/students", (_req, res) => {
  res.json(students);
});
```

- `_req` is prefixed with `_` because we don't use it (convention)
- `res.json()` sends a JSON response with `Content-Type: application/json`

### 5.5 GET /students/:id — Read One

```js
app.get("/students/:id", (req, res) => {
  const student = students.find((s) => s.id === parseInt(req.params.id));
  if (!student) {
    return res.status(404).json({ error: `Student with id ${req.params.id} not found` });
  }
  res.json(student);
});
```

- **`:id`** is a route parameter — Express extracts it into `req.params.id`
- `parseInt()` converts the string param to a number (params are always strings)
- `.find()` returns the first match or `undefined`
- **404** status if not found — proper REST convention

### 5.6 POST /students — Create

```js
app.post("/students", (req, res) => {
  const { name, branch, year } = req.body;  // Destructuring

  if (!name || !branch || !year) {
    return res.status(400).json({ error: "name, branch, and year are required" });
  }

  const student = { id: nextId++, name, branch, year: parseInt(year) };
  students.push(student);
  res.status(201).json(student);
});
```

- **Destructuring**: `const { name, branch, year } = req.body` extracts fields
- **Validation**: returns 400 Bad Request if required fields are missing
- **`nextId++`**: post-increment — uses current value, then increments
- **201 Created**: proper HTTP status for resource creation
- **Shorthand property**: `{ id, name, branch }` is same as `{ id: id, name: name, ... }`

### 5.7 PATCH /students/:id — Update

```js
app.patch("/students/:id", (req, res) => {
  const student = students.find((s) => s.id === parseInt(req.params.id));
  if (!student) {
    return res.status(404).json({ error: `...` });
  }

  const { name, branch, year } = req.body;
  if (name) student.name = name;       // Only update if provided
  if (branch) student.branch = branch;
  if (year) student.year = parseInt(year);

  res.json(student);
});
```

**PATCH vs PUT:**
- **PATCH** = partial update (only send fields you want to change)
- **PUT** = full replacement (send the entire object)

We use PATCH because you might only want to update the year, not resend name and branch.

### 5.8 DELETE /students/:id — Delete

```js
app.delete("/students/:id", (req, res) => {
  const index = students.findIndex((s) => s.id === parseInt(req.params.id));
  if (index === -1) {
    return res.status(404).json({ error: `...` });
  }

  const deleted = students.splice(index, 1)[0];
  res.json({ message: `Student '${deleted.name}' deleted`, student: deleted });
});
```

- `.findIndex()` returns the array index (or -1 if not found)
- `.splice(index, 1)` removes 1 element at `index`, returns array of removed items
- `[0]` gets the first (only) removed element
- Response includes the deleted student data for confirmation

---

## 6. Testing with curl

```bash
# Get all students
curl http://localhost:3000/students

# Get student with id 2
curl http://localhost:3000/students/2

# Create a new student
curl -X POST http://localhost:3000/students \
  -H "Content-Type: application/json" \
  -d '{"name":"Sneha Iyer","branch":"IT","year":1}'

# Update student's year
curl -X PATCH http://localhost:3000/students/4 \
  -H "Content-Type: application/json" \
  -d '{"year":2}'

# Delete a student
curl -X DELETE http://localhost:3000/students/3
```

---

## 7. Viva Questions & Answers

### What is an API?
An **Application Programming Interface** — a contract that defines how software components communicate. A web API accepts HTTP requests and returns data (usually JSON).

### What is REST?
**Representational State Transfer** — an architecture for designing networked applications. It uses:
- **Resources** identified by URLs (`/students`, `/students/1`)
- **HTTP methods** as actions (GET, POST, PATCH, DELETE)
- **Stateless** communication (each request is independent)
- **JSON** as the data format

### What is CRUD?
The four basic operations on data: **C**reate, **R**ead, **U**pdate, **D**elete. Maps to POST, GET, PATCH/PUT, DELETE.

### What is the difference between `res.json()` and `res.send()`?
- `res.json()` — sets `Content-Type: application/json` and stringifies the object
- `res.send()` — sends a generic response (could be string, Buffer, or object)
- Use `res.json()` for APIs, `res.send()` for simple text responses

### What is `req.params` vs `req.body` vs `req.query`?

```
GET /students/5?sort=name
         ↑          ↑
    req.params.id   req.query.sort
    (from URL)      (from ?key=value)

POST /students  with JSON body {"name":"..."}
                     ↑
                req.body.name
                (from request body)
```

| Property | Source | Example |
|---|---|---|
| `req.params` | URL path (`:id`) | `/students/5` → `req.params.id = "5"` |
| `req.query` | Query string | `?sort=name` → `req.query.sort = "name"` |
| `req.body` | Request body (POST/PATCH) | `{"name":"X"}` → `req.body.name = "X"` |

### What does `express.json()` do?
It's built-in middleware that parses incoming requests with JSON payloads. Without it, `req.body` is `undefined` for POST/PATCH requests.

### Why use `parseInt(req.params.id)`?
URL parameters are always strings. `req.params.id` is `"5"` (string), not `5` (number). `parseInt()` converts it so `===` comparison works with the numeric `id` in our data.

### What is the difference between PATCH and PUT?
- **PUT** replaces the entire resource (all fields required)
- **PATCH** partially updates the resource (only changed fields required)

### What HTTP status codes does this API use?
| Code | Meaning | When |
|---|---|---|
| 200 | OK | GET, PATCH, DELETE success |
| 201 | Created | POST success (new resource) |
| 400 | Bad Request | Missing required fields |
| 404 | Not Found | Student ID doesn't exist |

---

## 8. Complete HTTP Reference

### 8.1 All HTTP Methods

| Method | Purpose | Has Body? | Idempotent? | Safe? |
|---|---|---|---|---|
| **GET** | Retrieve a resource | No | Yes | Yes |
| **POST** | Create a new resource | Yes | No | No |
| **PUT** | Replace a resource entirely | Yes | Yes | No |
| **PATCH** | Partially update a resource | Yes | No | No |
| **DELETE** | Remove a resource | Optional | Yes | No |
| **HEAD** | Same as GET but no response body (headers only) | No | Yes | Yes |
| **OPTIONS** | Describe communication options (used in CORS preflight) | No | Yes | Yes |
| **TRACE** | Echoes back the request (for debugging) | No | Yes | Yes |
| **CONNECT** | Establish a tunnel (used for HTTPS proxying) | No | No | No |

**Key terms:**
- **Idempotent** = calling it multiple times has the same effect as calling once (GET `/students/1` ten times returns the same student)
- **Safe** = does not modify server state (GET is safe, DELETE is not)

**PATCH vs PUT in detail:**

```
PUT /students/1
Body: { "name": "Aarav", "branch": "CE", "year": 4 }
→ Replaces the ENTIRE student object. Missing fields get removed.

PATCH /students/1
Body: { "year": 4 }
→ Updates ONLY the year. Name and branch stay unchanged.
```

### 8.2 All HTTP Status Codes

#### 1xx — Informational (request received, processing)

| Code | Name | Meaning |
|---|---|---|
| 100 | Continue | Server received headers, client should send body |
| 101 | Switching Protocols | Server is switching to a different protocol (e.g. WebSocket) |
| 102 | Processing | Server is processing but no response yet (WebDAV) |
| 103 | Early Hints | Send preliminary headers before final response |

#### 2xx — Success (request accepted and processed)

| Code | Name | Meaning |
|---|---|---|
| **200** | **OK** | Standard success. Used for GET, PATCH, DELETE |
| **201** | **Created** | New resource created. Used for POST |
| 202 | Accepted | Request accepted but not yet processed (async) |
| 204 | No Content | Success but no response body. Common for DELETE |

#### 3xx — Redirection (further action needed)

| Code | Name | Meaning |
|---|---|---|
| 301 | Moved Permanently | Resource moved to new URL forever |
| 302 | Found | Resource temporarily at a different URL |
| 304 | Not Modified | Cached version is still valid (no need to re-download) |
| 307 | Temporary Redirect | Like 302, but must use same HTTP method |
| 308 | Permanent Redirect | Like 301, but must use same HTTP method |

#### 4xx — Client Errors (problem with the request)

| Code | Name | Meaning |
|---|---|---|
| **400** | **Bad Request** | Malformed request or missing required fields |
| 401 | Unauthorized | Authentication required (no credentials or invalid token) |
| 403 | Forbidden | Authenticated but not allowed to access this resource |
| **404** | **Not Found** | Resource doesn't exist |
| 405 | Method Not Allowed | HTTP method not supported for this URL |
| 408 | Request Timeout | Client took too long to send the request |
| 409 | Conflict | Request conflicts with current state (e.g. duplicate entry) |
| 413 | Payload Too Large | Request body exceeds server limit |
| 415 | Unsupported Media Type | Content-Type not supported (e.g. sending XML to a JSON API) |
| 422 | Unprocessable Entity | Request is valid JSON but semantically wrong |
| 429 | Too Many Requests | Rate limit exceeded |

#### 5xx — Server Errors (problem on the server side)

| Code | Name | Meaning |
|---|---|---|
| **500** | **Internal Server Error** | Generic server crash / unhandled exception |
| 501 | Not Implemented | Server doesn't support the functionality |
| 502 | Bad Gateway | Server acting as proxy got an invalid response |
| 503 | Service Unavailable | Server is overloaded or down for maintenance |
| 504 | Gateway Timeout | Proxy server didn't get a response in time |

**Boldface** = codes used in our project.

### 8.3 HTTP Headers

| Header | Purpose | Example |
|---|---|---|
| `Content-Type` | What format the body is in | `application/json` |
| `Accept` | What format the client wants back | `application/json` |
| `Authorization` | Credentials for authentication | `Bearer <token>` |

---

## 9. Additional Viva Questions

### What is Node.js?
A **JavaScript runtime** built on Chrome's V8 engine. Lets you run JavaScript on the server side. It's event-driven and non-blocking, making it ideal for I/O-heavy tasks like APIs.

### What is npm?
**Node Package Manager** — installs dependencies, manages versions via `package.json` and `package-lock.json`, and runs scripts (`npm run dev`).

### What is `package.json`?
The project manifest file. Contains: name, version, scripts, dependencies, devDependencies.

### What is `package-lock.json`?
Auto-generated file that locks **exact versions** of every installed package. Ensures everyone gets the same dependency tree.

### What is nodemon?
A dev tool that **watches files for changes** and automatically restarts the server. Avoids manual stop/restart after every edit.

### What is the difference between `require()` and `import`?
- `require()` — CommonJS (older, Node.js default)
- `import` — ES Modules (modern, needs `"type": "module"` in package.json)

### What is the difference between `==` and `===`?
- `==` — loose equality with type coercion (`"5" == 5` → `true`)
- `===` — strict equality, no coercion (`"5" === 5` → `false`)
- Always use `===`

### What is `res.status(201).json(data)`?
Method chaining. Sets HTTP status to 201, then sends JSON. Same as:
```js
res.status(201);
res.json(data);
```

### What is the difference between `app.use()` and `app.get()`?
- `app.use()` — middleware for **all** HTTP methods on a path
- `app.get()` — handler only for **GET** requests
- `app.use()` with no path → global middleware (every request)

### What is CORS?
**Cross-Origin Resource Sharing** — browser security. By default, a page on one origin can't make requests to a different origin. CORS headers allow it.

### What is JSON?
**JavaScript Object Notation** — lightweight, human-readable data format using key-value pairs and arrays:
```json
{ "name": "Aarav", "year": 3, "subjects": ["CN", "OS"] }
```

### What is the event loop in Node.js?
Node.js is **single-threaded** but uses an **event loop** to handle concurrent requests non-blockingly. I/O operations (DB calls, file reads, network) are offloaded to the OS, and callbacks fire when they complete. This is why Node is efficient for I/O-heavy apps.

### What is the difference between server-side and client-side rendering?
- **SSR**: Server generates complete HTML (EJS, Pug, Handlebars)
- **CSR**: Server sends minimal HTML + JS, browser builds the page (React, Angular)
- SSR = faster initial load, better SEO. CSR = more interactive.
