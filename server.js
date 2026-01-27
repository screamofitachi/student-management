const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

console.log("SERVER.JS VERSION: ENHANCED (GPA + SOFT DELETE + STATS + EXPORT) ✅");

const DATA_PATH = path.join(__dirname, "data", "students.json");

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, "public")));

// Root -> login
app.get("/", (req, res) => {
  res.redirect("/pages/login.html");
});

// Login route
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public/pages/login.html"));
});

// Helper: öğrencileri kaydet
function writeStudents(students) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(students, null, 2), "utf-8");
}

/* ==============================
   GPA / STATUS HELPERS ✅
================================ */
function clampScore(x) {
  const n = Number(x);
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

function calcOverall({ midterm = 0, final = 0, project = 0 }) {
  // ağırlıklar: %30 vize, %50 final, %20 proje
  const m = clampScore(midterm);
  const f = clampScore(final);
  const p = clampScore(project);
  return m * 0.3 + f * 0.5 + p * 0.2;
}

function overallToLetter(overall) {
  if (overall >= 90) return "AA";
  if (overall >= 85) return "BA";
  if (overall >= 80) return "BB";
  if (overall >= 75) return "CB";
  if (overall >= 70) return "CC";
  if (overall >= 65) return "DC";
  if (overall >= 60) return "DD";
  if (overall >= 50) return "FD";
  return "FF";
}

function overallToGpa(overall) {
  // basit dönüşüm
  if (overall >= 90) return 4.0;
  if (overall >= 85) return 3.5;
  if (overall >= 80) return 3.0;
  if (overall >= 75) return 2.5;
  if (overall >= 70) return 2.0;
  if (overall >= 65) return 1.5;
  if (overall >= 60) return 1.0;
  if (overall >= 50) return 0.5;
  return 0.0;
}

function gpaToStatus(gpa) {
  if (gpa < 2.0) return "Riskli";
  if (gpa < 3.0) return "Orta";
  return "Basarili";
}

function normalizeStudent(s) {
  const midterm = clampScore(s.midterm ?? 0);
  const final = clampScore(s.final ?? 0);
  const project = clampScore(s.project ?? 0);

  const overall = calcOverall({ midterm, final, project });
  const letterGrade = s.letterGrade ?? overallToLetter(overall);

  const gpaNum = Number(s.gpa);
  const gpa = Number.isFinite(gpaNum) ? gpaNum : overallToGpa(overall);

  const status = s.status ?? gpaToStatus(gpa);

  return {
    ...s,
    midterm,
    final,
    project,
    overall: Number(overall.toFixed(2)),
    letterGrade,
    gpa: Number(gpa.toFixed(2)),
    status,
    isDeleted: Boolean(s.isDeleted ?? false),
    createdAt: s.createdAt ?? new Date().toISOString(),
  };
}

// Helper: öğrencileri güvenli oku (normalize ile)
function readStudents() {
  const raw = fs.readFileSync(DATA_PATH, "utf-8");
  const arr = raw && raw.trim() ? JSON.parse(raw) : [];
  return arr.map(normalizeStudent);
}

/* ==============================
   API ROUTES ✅
================================ */

// ✅ GET all (with filters)
app.get("/api/students", (req, res) => {
  try {
    const {
      q = "",
      department = "",
      grade = "",
      status = "",
      includeDeleted = "false",
      sortBy = "createdAt", // gpa | fullName | createdAt | overall
      order = "desc", // asc | desc
    } = req.query;

    let students = readStudents();

    const incDel = String(includeDeleted).toLowerCase() === "true";
    if (!incDel) students = students.filter((s) => !s.isDeleted);

    const qq = String(q).trim().toLowerCase();
    if (qq) {
      students = students.filter(
        (s) =>
          String(s.fullName).toLowerCase().includes(qq) ||
          String(s.studentNo).toLowerCase().includes(qq)
      );
    }

    if (department) {
      const dep = String(department).toLowerCase();
      students = students.filter((s) => String(s.department).toLowerCase() === dep);
    }

    if (grade) {
      const gr = String(grade).toLowerCase();
      students = students.filter((s) => String(s.grade).toLowerCase() === gr);
    }

    if (status) {
      const st = String(status).toLowerCase();
      students = students.filter((s) => String(s.status).toLowerCase() === st);
    }

    const dir = String(order).toLowerCase() === "asc" ? 1 : -1;
    students.sort((a, b) => {
      const key = String(sortBy);
      const av = a[key];
      const bv = b[key];

      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });

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
    const { fullName, studentNo, department, grade, midterm, final, project } = req.body;

    if (!fullName || !studentNo || !department || !grade) {
      return res.status(400).json({ message: "Tüm alanlar zorunludur." });
    }

    const students = readStudents();

    const newId =
      students.length > 0
        ? Math.max(...students.map((s) => Number(s.id) || 0)) + 1
        : 1;

    const newStudentRaw = {
      id: newId,
      fullName: String(fullName).trim(),
      studentNo: String(studentNo).trim(),
      department: String(department).trim(),
      grade: String(grade).trim(),

      midterm: clampScore(midterm ?? 0),
      final: clampScore(final ?? 0),
      project: clampScore(project ?? 0),

      isDeleted: false,
      createdAt: new Date().toISOString(),
    };

    const newStudent = normalizeStudent(newStudentRaw);

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
    const { fullName, studentNo, department, grade, midterm, final, project } = req.body;

    if (!fullName || !studentNo || !department || !grade) {
      return res.status(400).json({ message: "Tüm alanlar zorunludur." });
    }

    const students = readStudents();
    const index = students.findIndex((s) => Number(s.id) === id);

    if (index === -1) return res.status(404).json({ message: "Öğrenci bulunamadı." });

    students[index] = normalizeStudent({
      ...students[index],
      fullName: String(fullName).trim(),
      studentNo: String(studentNo).trim(),
      department: String(department).trim(),
      grade: String(grade).trim(),

      midterm: clampScore(midterm ?? students[index].midterm ?? 0),
      final: clampScore(final ?? students[index].final ?? 0),
      project: clampScore(project ?? students[index].project ?? 0),
    });

    writeStudents(students);
    res.json(students[index]);
  } catch (err) {
    res.status(500).json({ message: "Güncelleme hatası", error: String(err) });
  }
});

// ✅ DELETE (SOFT DELETE)
app.delete("/api/students/:id", (req, res) => {
  try {
    const id = Number(req.params.id);

    const students = readStudents();
    const index = students.findIndex((s) => Number(s.id) === id);

    if (index === -1) return res.status(404).json({ message: "Öğrenci bulunamadı." });

    students[index].isDeleted = true;
    writeStudents(students);

    res.json({ message: "Soft deleted ✅", student: students[index] });
  } catch (err) {
    res.status(500).json({ message: "Silme hatası", error: String(err) });
  }
});

// ✅ RESTORE
app.post("/api/students/:id/restore", (req, res) => {
  try {
    const id = Number(req.params.id);

    const students = readStudents();
    const index = students.findIndex((s) => Number(s.id) === id);

    if (index === -1) return res.status(404).json({ message: "Öğrenci bulunamadı." });

    students[index].isDeleted = false;
    writeStudents(students);

    res.json({ message: "Restored ✅", student: students[index] });
  } catch (err) {
    res.status(500).json({ message: "Restore hatası", error: String(err) });
  }
});

// ✅ TEST DELETE
app.delete("/test-delete", (req, res) => {
  res.json({ ok: true, message: "DELETE works ✅" });
});

// ✅ STATS (Dashboard)
app.get("/api/stats", (req, res) => {
  try {
    const students = readStudents().filter((s) => !s.isDeleted);

    const total = students.length;
    const avgGpa = total ? students.reduce((acc, s) => acc + (s.gpa || 0), 0) / total : 0;
    const riskyCount = students.filter((s) => s.status === "Riskli").length;

    const byDepartment = {};
    const byGrade = {};

    for (const s of students) {
      byDepartment[s.department] = (byDepartment[s.department] || 0) + 1;
      byGrade[s.grade] = (byGrade[s.grade] || 0) + 1;
    }

    const recent = [...students]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    res.json({
      total,
      avgGpa: Number(avgGpa.toFixed(2)),
      riskyCount,
      byDepartment,
      byGrade,
      recent,
    });
  } catch (err) {
    res.status(500).json({ message: "Stats hatası", error: String(err) });
  }
});

// ✅ EXPORT CSV
app.get("/api/export/students.csv", (req, res) => {
  try {
    const students = readStudents().filter((s) => !s.isDeleted);

    const header = [
      "id",
      "fullName",
      "studentNo",
      "department",
      "grade",
      "midterm",
      "final",
      "project",
      "overall",
      "letterGrade",
      "gpa",
      "status",
      "createdAt",
    ];

    const lines = [header.join(",")];

    for (const s of students) {
      const row = header.map((k) => {
        const v = s[k] ?? "";
        const safe = String(v).replaceAll('"', '""');
        return `"${safe}"`;
      });
      lines.push(row.join(","));
    }

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=students.csv");
    res.send(lines.join("\n"));
  } catch (err) {
    res.status(500).json({ message: "Export hatası", error: String(err) });
  }
});

// SERVER HER ZAMAN EN SON
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
