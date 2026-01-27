document.addEventListener("DOMContentLoaded", async () => {
  // Login kontrol
  if (localStorage.getItem("isLoggedIn") !== "true") {
    window.location.href = "/login";
    return;
  }

  // Logout
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("isLoggedIn");
      window.location.href = "/login";
    });
  }

  const alertArea = document.getElementById("alertArea");
  const form = document.getElementById("editForm");

  const elFullName = document.getElementById("fullName");
  const elStudentNo = document.getElementById("studentNo");
  const elDepartment = document.getElementById("department");
  const elGrade = document.getElementById("grade");

  const elMidterm = document.getElementById("midterm");
  const elFinal = document.getElementById("final");
  const elProject = document.getElementById("project");

  const elOverall = document.getElementById("overall");
  const elLetter = document.getElementById("letter");
  const elGpa = document.getElementById("gpa");
  const elStatus = document.getElementById("status");

  // URL -> id
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (!id) {
    alertArea.innerHTML = `<div class="alert alert-danger">ID bulunamadı.</div>`;
    return;
  }

  // ===== Helpers (UI için) =====
  function clampScore(x) {
    const n = Number(x);
    if (Number.isNaN(n)) return 0;
    return Math.max(0, Math.min(100, n));
  }

  function calcOverall(midterm = 0, final = 0, project = 0) {
    // server.js ile aynı: %30 vize, %50 final, %20 proje
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
    return "Başarılı";
  }

  function normalizeStatusText(s) {
    // backend "Basarili" dönebilir, UI’da "Başarılı" yazalım
    const val = String(s || "").toLowerCase();
    if (val === "basarili") return "Başarılı";
    if (val === "orta") return "Orta";
    if (val === "riskli") return "Riskli";
    return s || "-";
  }

  function renderPreview() {
    const m = clampScore(elMidterm?.value ?? 0);
    const f = clampScore(elFinal?.value ?? 0);
    const p = clampScore(elProject?.value ?? 0);

    const overall = calcOverall(m, f, p);
    const letter = overallToLetter(overall);
    const gpa = overallToGpa(overall);
    const status = gpaToStatus(gpa);

    if (elOverall) elOverall.textContent = overall.toFixed(2);
    if (elLetter) elLetter.textContent = letter;
    if (elGpa) elGpa.textContent = gpa.toFixed(2);

    if (elStatus) {
      elStatus.textContent = status;
      elStatus.className =
        status === "Riskli"
          ? "text-danger fw-bold"
          : status === "Orta"
          ? "text-warning fw-bold"
          : "text-success fw-bold";
    }
  }

  // Not inputları değişince canlı hesap
  [elMidterm, elFinal, elProject].forEach((inp) => {
    if (!inp) return;
    inp.addEventListener("input", renderPreview);
  });

  // ===== 1) Öğrenciyi getir =====
  try {
    const res = await fetch(`/api/students/${id}`);
    const student = await res.json();

    if (!res.ok) {
      alertArea.innerHTML = `<div class="alert alert-danger">${student.message || "Öğrenci bulunamadı"}</div>`;
      return;
    }

    elFullName.value = student.fullName || "";
    elStudentNo.value = student.studentNo || "";
    elDepartment.value = student.department || "";
    elGrade.value = student.grade || "1";

    // notlar (yoksa 0 bas)
    if (elMidterm) elMidterm.value = student.midterm ?? 0;
    if (elFinal) elFinal.value = student.final ?? 0;
    if (elProject) elProject.value = student.project ?? 0;

    // backend hesaplarını da gösterebiliriz (varsa)
    if (elOverall && student.overall != null) elOverall.textContent = Number(student.overall).toFixed(2);
    if (elLetter && student.letterGrade) elLetter.textContent = student.letterGrade;
    if (elGpa && student.gpa != null) elGpa.textContent = Number(student.gpa).toFixed(2);
    if (elStatus && student.status) {
      elStatus.textContent = normalizeStatusText(student.status);
    }

    // yine de inputlardan hesapla (en güncel UI)
    renderPreview();
  } catch (err) {
    alertArea.innerHTML = `<div class="alert alert-danger">Sunucu hatası: ${err.message}</div>`;
    return;
  }

  // ===== 2) Güncelle =====
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    alertArea.innerHTML = "";

    const payload = {
      fullName: elFullName.value.trim(),
      studentNo: elStudentNo.value.trim(),
      department: elDepartment.value.trim(),
      grade: String(elGrade.value).trim(),

      midterm: clampScore(elMidterm?.value ?? 0),
      final: clampScore(elFinal?.value ?? 0),
      project: clampScore(elProject?.value ?? 0),
    };

    try {
      const res = await fetch(`/api/students/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        alertArea.innerHTML = `<div class="alert alert-danger">${data.message || "Güncelleme hatası"}</div>`;
        return;
      }

      // backend zaten overall/gpa/status döndürüyor, UI’ı da güncelleyelim
      if (data) {
        if (elOverall && data.overall != null) elOverall.textContent = Number(data.overall).toFixed(2);
        if (elLetter && data.letterGrade) elLetter.textContent = data.letterGrade;
        if (elGpa && data.gpa != null) elGpa.textContent = Number(data.gpa).toFixed(2);
        if (elStatus && data.status) elStatus.textContent = normalizeStatusText(data.status);
      }

      alertArea.innerHTML = `<div class="alert alert-success">Güncellendi ✅</div>`;
      setTimeout(() => {
        window.location.href = "/pages/students.html";
      }, 650);
    } catch (err) {
      alertArea.innerHTML = `<div class="alert alert-danger">Sunucu hatası: ${err.message}</div>`;
    }
  });
});
