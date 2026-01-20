document.addEventListener("DOMContentLoaded", async () => {
  if (localStorage.getItem("isLoggedIn") !== "true") {
    window.location.href = "/login";
    return;
  }

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("isLoggedIn");
      window.location.href = "/login";
    });
  }

  const alertArea = document.getElementById("alertArea");
  const form = document.getElementById("editForm");

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (!id) {
    alertArea.innerHTML = `<div class="alert alert-danger">ID bulunamadı.</div>`;
    return;
  }

  // 1) Öğrenciyi getir
  try {
    const res = await fetch(`/api/students/${id}`);
    const student = await res.json();

    if (!res.ok) {
      alertArea.innerHTML = `<div class="alert alert-danger">${student.message || "Öğrenci bulunamadı"}</div>`;
      return;
    }

    document.getElementById("fullName").value = student.fullName || "";
    document.getElementById("studentNo").value = student.studentNo || "";
    document.getElementById("department").value = student.department || "";
    document.getElementById("grade").value = student.grade || "1";
  } catch (err) {
    alertArea.innerHTML = `<div class="alert alert-danger">Sunucu hatası: ${err.message}</div>`;
    return;
  }

  // 2) Güncelle
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

      alertArea.innerHTML = `<div class="alert alert-success">Güncellendi ✅</div>`;
      setTimeout(() => {
        window.location.href = "/pages/students.html";
      }, 600);
    } catch (err) {
      alertArea.innerHTML = `<div class="alert alert-danger">Sunucu hatası: ${err.message}</div>`;
    }
  });
});
