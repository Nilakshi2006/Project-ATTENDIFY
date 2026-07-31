  const API_URL = "https://project-attendify.onrender.com/api/students";
  let students = [];

  function getAvatarColor(name) {
    const colors = ["#4f46e5","#10b981","#f59e0b","#ef4444","#06b6d4","#8b5cf6","#ec4899"];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  async function fetchStudents() {
    const res = await fetch(API_URL);
    students = await res.json();
    renderStudents();
  }

  function renderStudents() {
    const grid = document.getElementById("studentGrid");
    const search = document.getElementById("searchInput").value.toLowerCase();
    grid.innerHTML = "";

    const filtered = students.filter(s =>
      (s.name || "").toLowerCase().includes(search)
    );

    document.getElementById("emptyText").style.display =
      filtered.length ? "none" : "block";

    filtered.forEach(student => {
      const card = document.createElement("div");
      card.className = "student-card";

      card.innerHTML = `
        <div class="avatar" style="background:${getAvatarColor(student.name)}">
          ${student.name.charAt(0).toUpperCase()}
        </div>
        <div class="student-name">${student.name}</div>
        <div class="student-id">ID: ${student.studentId}</div>
        <div class="actions">
          <button class="edit" onclick="editProfile('${student._id}')">Edit Profile</button>
          <button class="attendance" onclick="viewAttendance('${student._id}')">Attendance</button>
          <button class="delete" onclick="deleteStudent('${student._id}')">Delete</button>
        </div>
      `;

      grid.appendChild(card);
    });
  }

  function editProfile(id) {
    window.location.href = `student-view.html?studentId=${id}&edit=true`;
  }

  function viewAttendance(id) {
    window.location.href = `student-view.html?studentId=${id}`;
  }

  async function deleteStudent(id) {
    if (!confirm("Delete this student?")) return;
    await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    fetchStudents();
  }

  document.getElementById("searchInput").addEventListener("input", renderStudents);
  fetchStudents();
