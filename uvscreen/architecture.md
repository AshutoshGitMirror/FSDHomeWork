# Architecture — Sunscreen Advisor (UV Screen)

## 1. What Is This Project?

A **server-side rendered website** that answers: *"Do you need sunscreen today?"*  
It takes latitude/longitude input, calls the **OpenUV API** for real-time UV data, and displays the result with charts and recommendations.

---

## 2. Technology Stack

| Technology | Role |
|---|---|
| **Node.js** | JavaScript runtime (runs JS outside the browser) |
| **Express.js** | Web framework — handles routing, middleware, HTTP |
| **Axios** | HTTP client — makes API calls to OpenUV |
| **EJS** | Templating engine — generates HTML with dynamic data |
| **dotenv** | Loads `.env` variables into `process.env` |

---

## 3. Project Structure

```
uvscreen/
├── index.js          ← Server: routes, API calls, business logic
├── .env              ← API key (secret, not committed to git)
├── package.json      ← Dependencies and scripts
├── views/
│   ├── index.ejs     ← Landing page (form)
│   ├── result.ejs    ← Results page (UV data + charts)
│   └── error.ejs     ← Error page
└── public/
    ├── css/style.css  ← All styling
    └── js/main.js     ← Client-side JS (form validation)
```

---

## 4. Architecture / Flow

```
User Browser                Express Server              OpenUV API
     │                           │                          │
     │── GET / ─────────────────>│                          │
     │<── render index.ejs ──────│                          │
     │                           │                          │
     │── POST /check ───────────>│                          │
     │   (lat=19.076,lng=72.87)  │── GET /uv ──────────────>│
     │                           │── GET /protection ──────>│
     │                           │── GET /forecast ────────>│
     │                           │<── JSON responses ───────│
     │                           │                          │
     │                           │ (process + classify UV)  │
     │<── render result.ejs ─────│                          │
```

Key point: **The browser never talks to OpenUV directly.** The Express server is a middleman — it keeps the API key secret and processes the raw data before rendering HTML.

---

## 5. Key Code Explained

### 5.1 Setting Up Express

```js
import express from "express";
const app = express();
```
- `express()` creates an application instance
- `app` is the central object — you attach routes and middleware to it

### 5.2 Middleware

```js
app.set("view engine", "ejs");          // Use EJS for templates
app.use(express.static("public"));      // Serve CSS/JS from public/
app.use(express.urlencoded({ extended: true })); // Parse form POST data
```

**What is middleware?**  
Functions that run between receiving a request and sending a response. They can modify `req`, `res`, or end the request cycle. `app.use()` registers middleware.

### 5.3 Axios Instance with Custom Config

```js
const uvApi = axios.create({
  baseURL: "https://api.openuv.io/api/v1",
  headers: { "x-access-token": process.env.OPENUV_API_KEY },
  timeout: 10000,
});
```

- `axios.create()` makes a reusable HTTP client with defaults
- Every request to `uvApi` automatically includes the API key header
- `timeout: 10000` = abort if no response in 10 seconds

### 5.4 Axios Interceptors

```js
// Runs BEFORE every request is sent
uvApi.interceptors.request.use((config) => {
  console.log(`→ OpenUV ${config.method.toUpperCase()} ${config.url}`);
  return config;
});

// Runs AFTER every response is received
uvApi.interceptors.response.use(
  (res) => res.data,           // Success: unwrap .data
  (err) => Promise.reject(...) // Error: format message
);
```

**Why interceptors?**  
- **Request interceptor**: logging, adding auth tokens  
- **Response interceptor**: unwrap nested data, centralised error handling

### 5.5 Concurrent API Calls with Promise.all

```js
const [uvData, protectionData, forecastData] = await Promise.all([
  uvApi.get("/uv", { params: { lat, lng } }),
  uvApi.get("/protection", { params: { lat, lng, from: 3, to: 10 } }),
  uvApi.get("/forecast", { params: { lat, lng } }),
]);
```

- **`Promise.all()`** fires all 3 requests simultaneously (not one after another)
- Returns when ALL resolve, or rejects if ANY fail
- **Destructuring assignment** `[a, b, c]` unpacks the array into named variables
- Much faster than sequential calls (3 requests in ~1 network round trip instead of 3)

### 5.6 Route Parameters & Form Data

```js
// Form data comes from req.body (because of urlencoded middleware)
app.post("/check", async (req, res) => {
  const lat = parseFloat(req.body.lat);
  const lng = parseFloat(req.body.lng);
  // ...
});
```

### 5.7 Rendering EJS Templates

```js
res.render("result", { currentUV, maxUV, forecast, ... });
```

- `res.render("result", data)` finds `views/result.ejs`, injects `data`, returns HTML
- In EJS: `<%= currentUV %>` outputs the value, `<% if (...) %>` runs JS logic

### 5.8 Error Handling

```js
try {
  // API calls...
} catch (err) {
  res.render("error", { title: "API Error", message: err.message });
}
```

- `try/catch` with `async/await` catches any network or API errors
- User sees a friendly error page, not a crash

---

## 6. Environment Variables & dotenv

```
# .env file (NEVER commit this to git)
OPENUV_API_KEY=openuv-b5h8hormo0o6pmb-io
PORT=3000
```

```js
import "dotenv/config";  // Loads .env into process.env
process.env.OPENUV_API_KEY  // → "openuv-b5h8hormo0o6pmb-io"
```

**Why?** API keys are secrets. `.env` keeps them out of source code. `.gitignore` prevents committing them.

---

## 7. OpenUV API Details

| Endpoint | Returns |
|---|---|
| `GET /api/v1/uv?lat=...&lng=...` | Current UV index, max UV, ozone |
| `GET /api/v1/protection?lat=...&lng=...&from=3&to=10` | Time window needing sun protection |
| `GET /api/v1/forecast?lat=...&lng=...` | Hourly UV forecast for the day |

**Authentication**: API key sent in `x-access-token` HTTP header.

---

## 8. Viva Questions & Answers

### What is an API?
An **Application Programming Interface** — a set of rules that let software programs communicate. In our case, OpenUV provides a web API (REST) that returns UV data as JSON when we send HTTP requests.

### What is REST?
**Representational State Transfer** — an architectural style for web APIs. It uses standard HTTP methods (GET, POST, PUT, DELETE) and URLs to identify resources.

### What is Express.js?
A minimal, unopinionated web framework for Node.js. It provides routing, middleware support, and HTTP utilities to build web servers.

### What is middleware in Express?
A function with signature `(req, res, next)` that can:
- Execute code, modify `req`/`res`, end the request, or call `next()` to pass control
- Examples: `express.json()` (parse JSON body), `express.static()` (serve files)

### What is Axios? How is it different from fetch?
Both make HTTP requests. Axios adds:
- Automatic JSON parsing
- Request/response interceptors
- Timeout support
- Custom instances with defaults
- Better error handling (rejects on non-2xx)

### What is EJS?
**Embedded JavaScript** — a templating language. Lets you write HTML with embedded JS expressions (`<%= %>`) that get replaced with actual data at render time. Server-side rendering.

### What is `async/await`?
Syntactic sugar over Promises. `async` marks a function as returning a Promise. `await` pauses execution until the Promise resolves. Makes asynchronous code read like synchronous code.

### What is `Promise.all()`?
Takes an array of Promises and returns a single Promise that resolves when ALL input Promises resolve. Used to run multiple async operations in parallel.

### What is destructuring?
```js
const { name, branch } = req.body;  // Object destructuring
const [a, b, c] = await Promise.all([...]); // Array destructuring
```
Extracts values from objects/arrays into individual variables.

### What does `app.listen(3000)` do?
Binds the Express app to port 3000 and starts listening for incoming HTTP connections. The server is now "running."

### What is the difference between `app.get()` and `app.post()`?
- `app.get()` handles HTTP GET requests (retrieving data, loading pages)
- `app.post()` handles HTTP POST requests (submitting forms, creating data)

### What is `req.body`?
The parsed body of an incoming request. Populated by middleware like `express.json()` (for JSON) or `express.urlencoded()` (for form data).

### What are HTTP status codes?
- **200** OK — success
- **201** Created — resource created
- **400** Bad Request — invalid input
- **404** Not Found — resource doesn't exist
- **500** Internal Server Error — server crashed

---

## 9. Complete HTTP Reference

### 9.1 All HTTP Methods

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

### 9.2 All HTTP Status Codes

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
| 429 | Too Many Requests | Rate limit exceeded (OpenUV free plan: 50/day) |

#### 5xx — Server Errors (problem on the server side)

| Code | Name | Meaning |
|---|---|---|
| **500** | **Internal Server Error** | Generic server crash / unhandled exception |
| 501 | Not Implemented | Server doesn't support the functionality |
| 502 | Bad Gateway | Server acting as proxy got an invalid response |
| 503 | Service Unavailable | Server is overloaded or down for maintenance |
| 504 | Gateway Timeout | Proxy server didn't get a response in time |

**Boldface** = codes used in our projects.

### 9.3 HTTP Headers We Use

| Header | Purpose | Example |
|---|---|---|
| `Content-Type` | Tells the server/client what format the body is in | `application/json`, `application/x-www-form-urlencoded` |
| `x-access-token` | Custom header for API authentication (OpenUV) | `openuv-b5h8h...` |
| `Accept` | Tells the server what format the client wants back | `application/json` |

---

## 10. Additional Viva Questions

### What is Node.js?
A **JavaScript runtime** built on Chrome's V8 engine. Lets you run JavaScript on the server side (outside the browser). It's event-driven and non-blocking, making it ideal for I/O-heavy tasks like APIs and web servers.

### What is npm?
**Node Package Manager** — the default package manager for Node.js. It:
- Installs dependencies (`npm install express`)
- Manages versions via `package.json` and `package-lock.json`
- Runs scripts (`npm run dev`)
- Hosts the largest open-source registry in the world (~2M packages)

### What is `package.json`?
The project manifest file. Contains:
- **name, version** — project metadata
- **scripts** — runnable commands (`npm run dev`)
- **dependencies** — packages needed in production
- **devDependencies** — packages needed only during development (e.g. nodemon)

### What is `package-lock.json`?
An auto-generated file that locks the **exact versions** of every installed package (including sub-dependencies). Ensures reproducible builds across machines.

### What is nodemon?
A dev tool that **watches files for changes** and automatically restarts the Node.js server. You don't have to manually stop and restart after every code edit.

### What is the difference between `require()` and `import`?
- `require()` — CommonJS syntax (older, Node.js default)
- `import` — ES Module syntax (modern, needs `"type": "module"` in package.json)
- Both load modules, but `import` supports static analysis and tree-shaking

### What is the difference between `==` and `===` in JS?
- `==` — loose equality, performs type coercion (`"5" == 5` is `true`)
- `===` — strict equality, no type coercion (`"5" === 5` is `false`)
- Always use `===` to avoid bugs

### What is `res.status(201).json(data)`?
Method chaining. First sets the HTTP status code to 201, then sends `data` as JSON. Could also be written as two lines:
```js
res.status(201);
res.json(data);
```

### What is the difference between `app.use()` and `app.get()`?
- `app.use()` — runs middleware for **all** HTTP methods on the given path
- `app.get()` — runs handler only for **GET** requests on the given path
- `app.use()` with no path runs for **every** request (global middleware)

### What is CORS?
**Cross-Origin Resource Sharing** — a browser security feature. By default, a webpage on `localhost:5173` cannot make requests to an API on `localhost:3000`. CORS headers (`Access-Control-Allow-Origin`) are needed to allow cross-origin requests.

### What is JSON?
**JavaScript Object Notation** — a lightweight data format for transmitting structured data. Human-readable, language-independent. Uses key-value pairs and arrays:
```json
{ "name": "Aarav", "year": 3, "subjects": ["CN", "OS", "DBMS"] }
```

### What is the difference between server-side and client-side rendering?
- **SSR (Server-Side Rendering)**: Server generates complete HTML, sends it to browser (our UV Screen project with EJS)
- **CSR (Client-Side Rendering)**: Server sends minimal HTML + JS, browser builds the page (React, Angular)
- SSR = faster initial load, better SEO. CSR = more interactive, app-like feel.
