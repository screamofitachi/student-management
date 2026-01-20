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

  async function loadStudents() {
    alertArea.innerHTML = "";

    try {
      const res = await fetch("/api/students");
      if (!res.ok) throw new Error("API hata: " + res.status);

      const students = await res.json();
      countEl.textContent = students.length;

      if (students.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">Kayıt bulunamadı.</td></tr>`;
        return;
      }

      // tabloyu bas
      tbody.innerHTML = students
        .map(
          (s) => `
          <tr>
            <td>${s.id ?? ""}</td>
            <td>${s.fullName ?? ""}</td>
            <td>${s.studentNo ?? ""}</td>
            <td>${s.department ?? ""}</td>
            <td>${s.grade ?? ""}</td>
            <td>
              <a class="btn btn-sm btn-primary" href="/pages/edit-student.html?id=${s.id}">Güncelle</a>
              <button class="btn btn-sm btn-outline-danger btn-delete" data-id="${s.id}">Sil</button>
            </td>
          </tr>
        `
        )
        .join("");

      // ✅ tablo basıldıktan sonra sil butonlarına event bağla
      document.querySelectorAll(".btn-delete").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const id = btn.dataset.id;

          // ✅ CONFIRM
          const ok = confirm("Bu öğrenciyi silmek istediğine emin misin?");
          if (!ok) return;

          try {
            const delRes = await fetch(`/api/students/${id}`, { method: "DELETE" });

            // json dönmezse patlamasın
            const text = await delRes.text();
            let data = {};
            try {
              data = text ? JSON.parse(text) : {};
            } catch {}

            if (!delRes.ok) {
              alertArea.innerHTML = `<div class="alert alert-danger">${data.message || "Silme hatası"}</div>`;
              return;
            }

            alertArea.innerHTML = `<div class="alert alert-success">Öğrenci silindi ✅</div>`;
            await loadStudents(); // listeyi yenile
          } catch (err) {
            alertArea.innerHTML = `<div class="alert alert-danger">Sunucu hatası: ${err.message}</div>`;
          }
        });
      });
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Yükleme hatası</td></tr>`;
      alertArea.innerHTML = `<div class="alert alert-danger">Öğrenciler çekilemedi: ${err.message}</div>`;
    }
  }

  await loadStudents();
});
