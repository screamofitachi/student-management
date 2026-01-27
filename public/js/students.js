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

  const tbody = document.getElementById("tbody");
  const countEl = document.getElementById("count");
  const alertArea = document.getElementById("alertArea");

  // Filtre elemanları (students.html’de eklediklerimiz)
  const qEl = document.getElementById("q");
  const depEl = document.getElementById("department");
  const gradeEl = document.getElementById("grade");
  const statusEl = document.getElementById("status");
  const onlyRiskyEl = document.getElementById("onlyRisky");
  const sortByEl = document.getElementById("sortBy");
  const orderEl = document.getElementById("order");
  const btnApply = document.getElementById("btnApply");
  const btnReset = document.getElementById("btnReset");

  function showAlert(type, msg) {
    alertArea.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
  }

  function statusBadge(status) {
    if (status === "Riskli") return `<span class="badge text-bg-danger">Riskli</span>`;
    if (status === "Orta") return `<span class="badge text-bg-warning">Orta</span>`;
    if (status === "Basarili") return `<span class="badge text-bg-success">Başarılı</span>`;
    return `<span class="badge text-bg-secondary">${status || "-"}</span>`;
  }

  // Dropdownları öğrencilerden doldur (department & grade)
  function fillFilterOptions(students) {
    // Bölüm
    const deps = Array.from(new Set(students.map(s => s.department).filter(Boolean))).sort();
    depEl.innerHTML = `<option value="">Tümü</option>` + deps.map(d => `<option value="${d}">${d}</option>`).join("");

    // Sınıf
    const grades = Array.from(new Set(students.map(s => s.grade).filter(Boolean))).sort((a,b)=>String(a).localeCompare(String(b)));
    gradeEl.innerHTML = `<option value="">Tümü</option>` + grades.map(g => `<option value="${g}">${g}</option>`).join("");
  }

  function buildQueryParams() {
    const params = new URLSearchParams();

    const q = (qEl?.value || "").trim();
    const department = depEl?.value || "";
    const grade = gradeEl?.value || "";
    const sortBy = sortByEl?.value || "createdAt";
    const order = orderEl?.value || "desc";

    // Durum: checkbox işaretliyse status=Riskli
    let status = statusEl?.value || "";
    if (onlyRiskyEl?.checked) status = "Riskli";

    if (q) params.set("q", q);
    if (department) params.set("department", department);
    if (grade) params.set("grade", grade);
    if (status) params.set("status", status);

    params.set("sortBy", sortBy);
    params.set("order", order);

    return params.toString();
  }

  async function loadStudents(isFirstLoad = false) {
    alertArea.innerHTML = "";

    try {
      const qs = buildQueryParams();
      const res = await fetch(`/api/students?${qs}`);
      if (!res.ok) throw new Error("API hata: " + res.status);

      const students = await res.json();
      countEl.textContent = students.length;

      // İlk yüklemede filtre seçeneklerini dolduralım (department/grade)
      if (isFirstLoad) {
        // Burada filtreyi bozmayacak şekilde, seçenekleri dolu görmek için
        // tüm öğrencileri çekiyoruz (filtrelemeden)
        const allRes = await fetch(`/api/students?sortBy=createdAt&order=desc`);
        const allStudents = allRes.ok ? await allRes.json() : students;
        fillFilterOptions(allStudents);
      }

      if (students.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted">Kayıt bulunamadı.</td></tr>`;
        return;
      }

      // tabloyu bas
      tbody.innerHTML = students.map((s) => `
        <tr>
          <td>${s.id ?? ""}</td>
          <td>${s.fullName ?? ""}</td>
          <td>${s.studentNo ?? ""}</td>
          <td>${s.department ?? ""}</td>
          <td>${s.grade ?? ""}</td>
          <td>${(s.gpa ?? 0).toFixed ? Number(s.gpa ?? 0).toFixed(2) : (s.gpa ?? 0)}</td>
          <td>${statusBadge(s.status)}</td>
          <td>
            <a class="btn btn-sm btn-primary" href="/pages/edit-student.html?id=${s.id}">Güncelle</a>
            <button class="btn btn-sm btn-outline-danger btn-delete" data-id="${s.id}">Sil</button>
          </td>
        </tr>
      `).join("");

      // Sil butonları (soft delete çağırır)
      document.querySelectorAll(".btn-delete").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const id = btn.dataset.id;

          const ok = confirm("Bu öğrenciyi silmek istediğine emin misin? (Geri alınabilir)");
          if (!ok) return;

          try {
            const delRes = await fetch(`/api/students/${id}`, { method: "DELETE" });

            const text = await delRes.text();
            let data = {};
            try { data = text ? JSON.parse(text) : {}; } catch {}

            if (!delRes.ok) {
              showAlert("danger", data.message || "Silme hatası");
              return;
            }

            showAlert("success", "Öğrenci silindi (soft delete) ✅");
            await loadStudents(false);
          } catch (err) {
            showAlert("danger", "Sunucu hatası: " + err.message);
          }
        });
      });

    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center text-danger">Yükleme hatası</td></tr>`;
      showAlert("danger", "Öğrenciler çekilemedi: " + err.message);
    }
  }

  // Butonlar
  if (btnApply) btnApply.addEventListener("click", () => loadStudents(false));

  if (btnReset) {
    btnReset.addEventListener("click", () => {
      if (qEl) qEl.value = "";
      if (depEl) depEl.value = "";
      if (gradeEl) gradeEl.value = "";
      if (statusEl) statusEl.value = "";
      if (onlyRiskyEl) onlyRiskyEl.checked = false;
      if (sortByEl) sortByEl.value = "createdAt";
      if (orderEl) orderEl.value = "desc";
      loadStudents(false);
    });
  }

  // Enter’a basınca arama uygula
  if (qEl) {
    qEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") loadStudents(false);
    });
  }

  // Checkbox tıklanınca direkt uygula
  if (onlyRiskyEl) {
    onlyRiskyEl.addEventListener("change", () => loadStudents(false));
  }

  // İlk yükleme
  await loadStudents(true);
});
