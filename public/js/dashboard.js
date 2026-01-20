document.addEventListener("DOMContentLoaded", async () => {
  // Giriş kontrolü
  if (localStorage.getItem("isLoggedIn") !== "true") {
    window.location.href = "/login";
    return;
  }

  // Logout
  const logoutBtn = document.getElementById("logoutBtn");
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("isLoggedIn");
    window.location.href = "/login";
  });

  // Şimdilik students.json boş, ama sayı göstereceğiz (API gelince gerçek olacak)
  // Geçici: localStorage'dan say
  const totalEl = document.getElementById("totalStudents");
  totalEl.textContent = "0";
});
