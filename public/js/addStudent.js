document.addEventListener("DOMContentLoaded", () => {
  // Login kontrol
  if (localStorage.getItem("isLoggedIn") !== "true") {
    window.location.href = "/login";
    return;
  }

  const form = document.getElementById("addForm");
  const alertArea = document.getElementById("alertArea");
  const logoutBtn = document.getElementById("logoutBtn");

  // Not inputları
  const elMidterm = document.getElementById("midterm");
  const elFinal = document.getElementById("final");
  const elProject = document.getElementById("project");

  // Preview alanları
  const elOverall = document.getElementById("overall");
  const elLetter = document.getElementById("letter");
  const elGpa = document.getElementById("gpa");
  const elStatus = document.getElementById("status");

  // Basit güvenlik: elemanlar yoksa net hata ver
  if (!form || !alertArea) {
    console.error("addForm veya alertArea bulunamadı. add-student.html içindeki id'leri kontrol et.");
    return;
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("isLoggedIn");
      window.location.href = "/login";
    });
  }

  // ===== Helpers (server.js ile aynı mantık) =====
  function clampScore(x) {
    const n = Number(x);
    if (Number.isNaN(n)) return 0;
    return Math.max(0, Math.min(100, n));
  }

  function calcOverall(midterm = 0, final = 0, project = 0) {
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

  // İlk açılışta preview çalışsın
  renderPreview();

  // Input değişince canlı hesap
  [elMidterm, elFinal, elProject].forEach((inp) => {
    if (!inp) return;
    inp.addEventListener("input", renderPreview);
  });

  // ===== Submit =====
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    alertArea.innerHTML = "";

    const payload = {
      fullName: document.getElementById("fullName").value.trim(),
      studentNo: document.getElementById("studentNo").value.trim(),
      department: document.getElementById("department").value.trim(),
      grade: document.getElementById("grade").value.trim(),

      midterm: clampScore(elMidterm?.value ?? 0),
      final: clampScore(elFinal?.value ?? 0),
      project: clampScore(elProject?.value ?? 0),
    };

    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // JSON değilse patlamasın diye güvenli parse
      const text = await res.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error("Sunucu JSON döndürmedi: " + text.slice(0, 120));
      }

      if (!res.ok) {
        alertArea.innerHTML = `<div class="alert alert-danger">${data.message || "Hata oluştu"}</div>`;
        return;
      }

      alertArea.innerHTML = `<div class="alert alert-success">Öğrenci eklendi ✅</div>`;
      setTimeout(() => {
        window.location.href = "/pages/students.html";
      }, 650);
    } catch (err) {
      alertArea.innerHTML = `<div class="alert alert-danger">Sunucu hatası: ${err.message}</div>`;
    }
  });
});
