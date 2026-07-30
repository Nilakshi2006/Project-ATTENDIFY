const ATTENDANCE_API = "http://localhost:5000/api/attendance/today";
const STUDENT_API = "http://localhost:5000/api/students";

let attendanceData = [];
let studentData = [];

async function fetchReportData() {
  try {
    const [attendanceRes, studentRes] = await Promise.all([
      fetch(ATTENDANCE_API),
      fetch(STUDENT_API)
    ]);

    attendanceData = await attendanceRes.json();
    studentData = await studentRes.json();

    applyFilters();
  } catch (err) {
    console.error("Report Load Error:", err);
    const table = document.getElementById("reportTable");
    if (table) {
      table.innerHTML = `<tr><td colspan="4" class="empty">Unable to load report data</td></tr>`;
    }
  }
}

function getStudentCountForClass(cls) {
  if (!studentData || studentData.length === 0) return 0;
  if (cls === "all") return studentData.length;
  return studentData.filter(student => student.class === cls).length;
}

function loadTable(filteredData, cls = "all") {
  const table = document.getElementById("reportTable");
  table.innerHTML = "";

  if (!filteredData || filteredData.length === 0) {
    table.innerHTML = `<tr><td colspan="4" class="empty">No data found</td></tr>`;
  } else {
    let present = 0;

    filteredData.forEach(record => {
      const date = record.date && record.date.includes("T")
        ? record.date.split("T")[0]
        : record.date || "N/A";

      if (record.status === "present") present++;

      const studentName = record.studentName || "Unknown";
      const studentClass = record.studentClass || "N/A";

      table.innerHTML += `
        <tr>
          <td>${studentName}</td>
          <td>${studentClass}</td>
          <td>${date}</td>
          <td class="${record.status === 'present' ? 'present' : 'absent'}">
            ${record.status}
          </td>
        </tr>
      `;
    });

    const totalStudents = getStudentCountForClass(cls);
    const absent = Math.max(0, totalStudents - present);
    const percent = totalStudents ? ((present / totalStudents) * 100).toFixed(1) : 0;

    document.getElementById("totalStudents").innerText = totalStudents;
    document.getElementById("presentCount").innerText = present;
    document.getElementById("absentCount").innerText = absent;
    document.getElementById("attendancePercent").innerText = percent + "%";
    return;
  }

  // SUMMARY when no rows are displayed
  const totalStudents = getStudentCountForClass(cls);
  document.getElementById("totalStudents").innerText = totalStudents;
  document.getElementById("presentCount").innerText = 0;
  document.getElementById("absentCount").innerText = totalStudents;
  document.getElementById("attendancePercent").innerText = totalStudents ? "0%" : "0%";
}

function applyFilters() {
  const date = document.getElementById("dateFilter").value;
  const cls = document.getElementById("classFilter").value;

  const filtered = attendanceData.filter(record => {
    const recordDate = record.date && record.date.includes("T")
      ? record.date.split("T")[0]
      : record.date || "";

    const dateMatches = date ? recordDate === date : true;
    const classMatches = cls === "all"
      ? true
      : (record.studentClass || "").toString() === cls;

    return dateMatches && classMatches;
  });

  loadTable(filtered, cls);
}

function filterData() {
  applyFilters();
}

// DARK MODE
function toggleTheme() {
  const html = document.documentElement;
  html.dataset.theme = html.dataset.theme === "dark" ? "" : "dark";
}

// INITIAL LOAD
fetchReportData();
