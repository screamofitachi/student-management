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

  function showAlert(type, msg) {
    alertArea.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
  }

  function statusBadge(status) {
    if (status === "Riskli") return `<span class="badge text-bg-danger">Riskli</span>`;
    if (status === "Orta") return `<span class="badge text-bg-warning">Orta</span>`;
    if (status === "Basarili") return `<span class="badge text-bg-success">Başarılı</span>`;
    return `<span class="badge text-bg-secondary">${status || "-"}</span>`;
  }

  async function loadDeleted() {
    alertArea.innerHTML = "";
    try {
      // includeDeleted=true ile hepsi gelir, biz sadece isDeleted=true göstereceğiz
      const res = await fetch("/api/students?includeDeleted=true&sortBy=createdAt&order=desc");
      if (!res.ok) throw new Error("API hata: " + res.status);

      const all = await res.json();
      const deleted = all.filter((s) => s.isDeleted);

      countEl.textContent = deleted.length;

      if (deleted.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted">Silinen kayıt yok.</td></tr>`;
        return;
      }

      tbody.innerHTML = deleted.map((s) => `
        <tr>
          <td>${s.id ?? ""}</td>
          <td>${s.fullName ?? ""}</td>
          <td>${s.studentNo ?? ""}</td>
          <td>${s.department ?? ""}</td>
          <td>${s.grade ?? ""}</td>
          <td>${Number(s.gpa ?? 0).toFixed(2)}</td>
          <td>${statusBadge(s.status)}</td>
          <td>
            <button class="btn btn-sm btn-success btn-restore" data-id="${s.id}">Geri Yükle</button>
            <button class="btn btn-sm btn-outline-danger btn-permanent" data-id="${s.id}">Kalıcı Sil</button>
          </td>
        </tr>
      `).join("");

      // Restore
      document.querySelectorAll(".btn-restore").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const id = btn.dataset.id;
          const ok = confirm("Bu öğrenciyi geri yüklemek istiyor musun?");
          if (!ok) return;

          try {
            const r = await fetch(`/api/students/${id}/restore`, { method: "POST" });
            const text = await r.text();
            let data = {};
            try { data = text ? JSON.parse(text) : {}; } catch {}

            if (!r.ok) {
              showAlert("danger", data.message || "Restore hatası");
              return;
            }
            showAlert("success", "Geri yüklendi ✅");
            await loadDeleted();
          } catch (err) {
            showAlert("danger", "Sunucu hatası: " + err.message);
          }
        });
      });

      // Permanent delete
      document.querySelectorAll(".btn-permanent").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const id = btn.dataset.id;
          const ok = confirm("DİKKAT: Kalıcı silinecek. Devam edilsin mi?");
          if (!ok) return;

          try {
            const r = await fetch(`/api/students/${id}/permanent`, { method: "DELETE" });
            const text = await r.text();
            let data = {};
            try { data = text ? JSON.parse(text) : {}; } catch {}

            if (!r.ok) {
              showAlert("danger", data.message || "Kalıcı silme hatası");
              return;
            }
            showAlert("success", "Kalıcı olarak silindi ✅");
            await loadDeleted();
          } catch (err) {
            showAlert("danger", "Sunucu hatası: " + err.message);
          }
        });
      });
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center text-danger">Yükleme hatası</td></tr>`;
      showAlert("danger", "Silinenler çekilemedi: " + err.message);
    }
  }

  await loadDeleted();
});
