document.addEventListener("DOMContentLoaded", () => {
  fetch("/api/stats")
    .then((res) => {
      if (!res.ok) throw new Error("Stats API error: " + res.status);
      return res.json();
    })
    .then((data) => {
      // Kartlar
      const totalEl = document.getElementById("totalStudents");
      const avgEl = document.getElementById("avgGpa");
      const riskyEl = document.getElementById("riskyCount");

      if (totalEl) totalEl.textContent = data.total ?? 0;
      if (avgEl) avgEl.textContent = Number(data.avgGpa ?? 0).toFixed(2);
      if (riskyEl) riskyEl.textContent = data.riskyCount ?? 0;

      // Son öğrenciler
      const tbody = document.getElementById("recentStudents");
      if (!tbody) return;

      tbody.innerHTML = "";

      const recent = Array.isArray(data.recent) ? data.recent : [];
      if (recent.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-muted">Kayıt yok</td></tr>`;
        return;
      }

      recent.forEach((s) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${s.fullName ?? "-"}</td>
          <td>${s.department ?? "-"}</td>
          <td>${s.gpa ?? 0}</td>
          <td class="${s.status === "Riskli" ? "text-danger" : "text-success"}">
            ${s.status ?? "-"}
          </td>
        `;
        tbody.appendChild(tr);
      });
    })
    .catch((err) => {
      console.error("Dashboard yüklenemedi:", err);
    });
});
