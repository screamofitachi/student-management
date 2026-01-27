document.addEventListener("DOMContentLoaded", () => {
  fetch("/api/stats")
    .then(res => res.json())
    .then(data => {
      // Kartlar
      document.getElementById("totalStudents").textContent = data.total;
      document.getElementById("avgGpa").textContent = data.avgGpa.toFixed(2);
      document.getElementById("riskyCount").textContent = data.riskyCount;

      // Son öğrenciler
      const tbody = document.getElementById("recentStudents");
      tbody.innerHTML = "";

      if (data.recent.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4">Kayıt yok</td></tr>`;
        return;
      }

      data.recent.forEach(s => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${s.fullName}</td>
          <td>${s.department}</td>
          <td>${s.gpa}</td>
          <td class="${s.status === "Riskli" ? "text-danger" : "text-success"}">
            ${s.status}
          </td>
        `;
        tbody.appendChild(tr);
      });
    })
    .catch(err => {
      console.error("Dashboard yüklenemedi:", err);
    });
});
