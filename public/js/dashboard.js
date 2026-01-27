document.addEventListener("DOMContentLoaded", () => {
  let deptChartInstance = null;
  let gradeChartInstance = null;

  fetch("/api/stats")
    .then((res) => {
      if (!res.ok) throw new Error("Stats API error: " + res.status);
      return res.json();
    })
    .then((data) => {
      // ✅ Kartlar
      const totalEl = document.getElementById("totalStudents");
      const avgEl = document.getElementById("avgGpa");
      const riskyEl = document.getElementById("riskyCount");

      if (totalEl) totalEl.textContent = data.total ?? 0;
      if (avgEl) avgEl.textContent = Number(data.avgGpa ?? 0).toFixed(2);
      if (riskyEl) riskyEl.textContent = data.riskyCount ?? 0;

      // ✅ Son öğrenciler
      const tbody = document.getElementById("recentStudents");
      if (tbody) {
        tbody.innerHTML = "";
        const recent = Array.isArray(data.recent) ? data.recent : [];

        if (recent.length === 0) {
          tbody.innerHTML = `<tr><td colspan="4" class="text-muted">Kayıt yok</td></tr>`;
        } else {
          recent.forEach((s) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
              <td>${s.fullName ?? "-"}</td>
              <td>${s.department ?? "-"}</td>
              <td>${Number(s.gpa ?? 0).toFixed(2)}</td>
              <td class="${s.status === "Riskli" ? "text-danger" : "text-success"}">
                ${s.status ?? "-"}
              </td>
            `;
            tbody.appendChild(tr);
          });
        }
      }

      // ✅ Grafik verileri
      const byDepartment = data.byDepartment || {};
      const byGrade = data.byGrade || {};

      const deptLabels = Object.keys(byDepartment);
      const deptValues = Object.values(byDepartment);

      const gradeLabels = Object.keys(byGrade);
      const gradeValues = Object.values(byGrade);

      // ✅ Bölüm grafiği (Bar)
      const deptCanvas = document.getElementById("deptChart");
      if (deptCanvas && window.Chart) {
        if (deptChartInstance) deptChartInstance.destroy();

        deptChartInstance = new Chart(deptCanvas, {
          type: "bar",
          data: {
            labels: deptLabels.length ? deptLabels : ["Veri Yok"],
            datasets: [
              {
                label: "Öğrenci Sayısı",
                data: deptValues.length ? deptValues : [0],
              },
            ],
          },
          options: {
            responsive: true,
            plugins: {
              legend: { display: true },
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: { precision: 0 },
              },
            },
          },
        });
      }

      // ✅ Sınıf grafiği (Pie)
      const gradeCanvas = document.getElementById("gradeChart");
      if (gradeCanvas && window.Chart) {
        if (gradeChartInstance) gradeChartInstance.destroy();

        gradeChartInstance = new Chart(gradeCanvas, {
          type: "pie",
          data: {
            labels: gradeLabels.length ? gradeLabels : ["Veri Yok"],
            datasets: [
              {
                label: "Sınıf Dağılımı",
                data: gradeValues.length ? gradeValues : [0],
              },
            ],
          },
          options: {
            responsive: true,
            plugins: {
              legend: { position: "bottom" },
            },
          },
        });
      }
    })
    .catch((err) => {
      console.error("Dashboard yüklenemedi:", err);
    });
});
