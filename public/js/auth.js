document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const msg = document.getElementById("msg");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const u = document.getElementById("username").value.trim();
    const p = document.getElementById("password").value.trim();

    if (u === "admin" && p === "1234") {
      localStorage.setItem("isLoggedIn", "true");
      msg.innerHTML = `<div class="alert alert-success">Giriş başarılı ✅ Yönlendiriliyorsun...</div>`;
      setTimeout(() => {
        window.location.href = "/pages/index.html";
      }, 700);
    } else {
      msg.innerHTML = `<div class="alert alert-danger">Hatalı kullanıcı adı veya şifre ❌</div>`;
    }
  });
});
