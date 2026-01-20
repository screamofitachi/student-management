const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

console.log("SERVER.JS VERSION: DELETE ROUTE SHOULD EXIST ✅");



const DATA_PATH = path.join(__dirname, "data", "students.json");

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, "public")));

// Test route
app.get("/", (req, res) => {
  res.redirect("/pages/login.html");
});


// Login route
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public/pages/login.html"));
});

// Helper: öğrencileri güvenli oku
function readStudents() {
  const raw = fs.readFileSync(DATA_PATH, "utf-8");
  return raw && raw.trim() ? JSON.parse(raw) : [];
}

// Helper: öğrencileri kaydet
function writeStudents(students) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(students, null, 2), "utf-8");
}

// ✅ GET all
app.get("/api/students", (req, res) => {
  try {
    const students = readStudents();
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: "students.json okunamadı", error: String(err) });
  }
});

// ✅ GET by id
app.get("/api/students/:id", (req, res) => {
  try {
    const id = Number(req.params.id);
    const students = readStudents();

    const student = students.find((s) => Number(s.id) === id);
    if (!student) return res.status(404).json({ message: "Öğrenci bulunamadı." });

    res.json(student);
  } catch (err) {
    res.status(500).json({ message: "Okuma hatası", error: String(err) });
  }
});

// ✅ POST (create)
app.post("/api/students", (req, res) => {
  try {
    const { fullName, studentNo, department, grade } = req.body;

    if (!fullName || !studentNo || !department || !grade) {
      return res.status(400).json({ message: "Tüm alanlar zorunludur." });
    }

    const students = readStudents();

    const newId =
      students.length > 0
        ? Math.max(...students.map((s) => Number(s.id) || 0)) + 1
        : 1;

    const newStudent = {
      id: newId,
      fullName: String(fullName).trim(),
      studentNo: String(studentNo).trim(),
      department: String(department).trim(),
      grade: String(grade).trim(),
    };

    students.push(newStudent);
    writeStudents(students);

    res.status(201).json(newStudent);
  } catch (err) {
    res.status(500).json({ message: "Öğrenci eklenemedi", error: String(err) });
  }
});

// ✅ PUT (update)
app.put("/api/students/:id", (req, res) => {
  try {
    const id = Number(req.params.id);
    const { fullName, studentNo, department, grade } = req.body;

    if (!fullName || !studentNo || !department || !grade) {
      return res.status(400).json({ message: "Tüm alanlar zorunludur." });
    }

    const students = readStudents();
    const index = students.findIndex((s) => Number(s.id) === id);

    if (index === -1) return res.status(404).json({ message: "Öğrenci bulunamadı." });

    students[index] = {
      ...students[index],
      fullName: String(fullName).trim(),
      studentNo: String(studentNo).trim(),
      department: String(department).trim(),
      grade: String(grade).trim(),
    };

    writeStudents(students);
    res.json(students[index]);
  } catch (err) {
    res.status(500).json({ message: "Güncelleme hatası", error: String(err) });
  }
});

// ✅ DELETE
app.delete("/api/students/:id", (req, res) => {
  try {
    const id = Number(req.params.id);

    const students = readStudents();
    const index = students.findIndex((s) => Number(s.id) === id);

    if (index === -1) return res.status(404).json({ message: "Öğrenci bulunamadı." });

    const deleted = students.splice(index, 1)[0];
    writeStudents(students);

    res.json({ message: "Silindi", deleted });
  } catch (err) {
    res.status(500).json({ message: "Silme hatası", error: String(err) });
  }
});
app.delete("/test-delete", (req, res) => {
  res.json({ ok: true, message: "DELETE works ✅" });
});

// SERVER HER ZAMAN EN SON
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
