

const STUDENT_API = "https://project-attendify.onrender.com//api/students";
const ATTENDANCE_API = "https://project-attendify.onrender.com//api/attendance/today";

// Display current date on header
document.getElementById("currentDate").innerText =
  new Date().toLocaleDateString("en-IN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });

async function loadDashboard() {
  try {
    const [studentRes, attendanceRes] = await Promise.all([
      fetch(STUDENT_API),
      fetch(ATTENDANCE_API)
    ]);

    const students = await studentRes.json();
    const attendance = await attendanceRes.json();

    // Update Counter Cards
    document.getElementById("totalStudents").innerText = students.length;
    document.getElementById("presentToday").innerText = attendance.length;
    document.getElementById("absentToday").innerText = Math.max(0, students.length - attendance.length);

    renderRecentActivity(attendance);

  } catch (err) {
    console.error("Dashboard Load Error:", err);
  }
}

function renderRecentActivity(data) {
  const tbody = document.getElementById("recentTable");

  if (!data || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:20px;">No records found for today.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(rec => `
    <tr>
      <td>${rec.studentId || "N/A"}</td>
      <td><strong>${rec.studentName || "Unknown"}</strong></td>
      <td>${rec.time || "--:--"}</td>
      <td><span class="status-present" style="color:green">● Present</span></td>
      <td><button class="btn-view">Details</button></td>
    </tr>
  `).join("");
}

// ================= DELETE LOGIC =================
async function deleteTodayAttendance() {
  const confirmDelete = confirm("Are you sure you want to delete all attendance records for today? This cannot be undone.");
  
  if (!confirmDelete) return;

  try {
    const response = await fetch(ATTENDANCE_API, { 
        method: "DELETE" 
    });
    
    const result = await response.json();

    if (result.success) {
      alert(`Success! Deleted ${result.deletedCount || 0} records.`);
      loadDashboard(); // UI Refresh
    } else {
      alert("Failed to delete records.");
    }
  } catch (err) {
    console.error("Delete Error:", err);
    alert("Network error occurred while deleting.");
  }
}

// Initialize and Auto-Refresh every 10 seconds
loadDashboard();
setInterval(loadDashboard, 10000);