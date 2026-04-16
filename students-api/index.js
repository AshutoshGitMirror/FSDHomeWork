import express from "express";

const app = express();
const PORT = 3000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json());

// ── In-memory data store ─────────────────────────────────────────────────────
let students = [
  { id: 1, name: "Aarav Sharma", branch: "Computer Engineering", year: 3 },
  { id: 2, name: "Priya Patel", branch: "Electronics Engineering", year: 2 },
  { id: 3, name: "Rohan Desai", branch: "Mechanical Engineering", year: 4 },
];
let nextId = 4;

// ── GET /students — Get all students ─────────────────────────────────────────
app.get("/students", (_req, res) => {
  res.json(students);
});

// ── GET /students/:id — Get a specific student ──────────────────────────────
app.get("/students/:id", (req, res) => {
  const student = students.find((s) => s.id === parseInt(req.params.id));
  if (!student) {
    return res.status(404).json({ error: `Student with id ${req.params.id} not found` });
  }
  res.json(student);
});

// ── POST /students — Add a new student ──────────────────────────────────────
app.post("/students", (req, res) => {
  const { name, branch, year } = req.body;

  if (!name || !branch || !year) {
    return res.status(400).json({ error: "name, branch, and year are required" });
  }

  const student = { id: nextId++, name, branch, year: parseInt(year) };
  students.push(student);
  res.status(201).json(student);
});

// ── PATCH /students/:id — Update student details ────────────────────────────
app.patch("/students/:id", (req, res) => {
  const student = students.find((s) => s.id === parseInt(req.params.id));
  if (!student) {
    return res.status(404).json({ error: `Student with id ${req.params.id} not found` });
  }

  const { name, branch, year } = req.body;
  if (name) student.name = name;
  if (branch) student.branch = branch;
  if (year) student.year = parseInt(year);

  res.json(student);
});

// ── DELETE /students/:id — Delete a student ─────────────────────────────────
app.delete("/students/:id", (req, res) => {
  const index = students.findIndex((s) => s.id === parseInt(req.params.id));
  if (index === -1) {
    return res.status(404).json({ error: `Student with id ${req.params.id} not found` });
  }

  const deleted = students.splice(index, 1)[0];
  res.json({ message: `Student '${deleted.name}' deleted`, student: deleted });
});

// ── Start server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`📚 Student Records API running at http://localhost:${PORT}`);
});
