document.addEventListener("DOMContentLoaded", () => {
  // Login kontrol
  if (localStorage.getItem("isLoggedIn") !== "true") {
    window.location.href = "/login";
    return;
  }

  const form = document.getElementById("addForm");
  const alertArea = document.getElementById("alertArea");
  const logoutBtn = document.getElementById("logoutBtn");

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

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    alertArea.innerHTML = "";

    const payload = {
      fullName: document.getElementById("fullName").value.trim(),
      studentNo: document.getElementById("studentNo").value.trim(),
      department: document.getElementById("department").value.trim(),
      grade: document.getElementById("grade").value.trim(),
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
      }, 600);
    } catch (err) {
      alertArea.innerHTML = `<div class="alert alert-danger">Sunucu hatası: ${err.message}</div>`;
    }
  });
});
