// Parse URL Params
const urlParams = new URLSearchParams(window.location.search);
const studentId = urlParams.get('studentId'); 

let currentStudent = null;

// Modal Elements
const editModal = document.getElementById("editModal");
const openEditModalBtn = document.getElementById("openEditModal");
const closeModalBtn = document.getElementById("closeModal");
const saveStudentBtn = document.getElementById("saveStudentBtn");

async function fetchStudentDetails() {
    if (!studentId) {
        document.getElementById("studentName").innerText = "Student Not Found";
        return;
    }

    try {
        const res = await fetch("https://project-attendify.onrender.com/api/students");
        const students = await res.json();
        
        currentStudent = students.find(s => s._id === studentId);
        
        if (!currentStudent) {
            document.getElementById("studentName").innerText = "Student Not Found";
            return;
        }

        renderDetails(currentStudent);

        // Check if we should auto-open the edit modal
        if (urlParams.get('edit') === 'true') {
            openEditModal();
        }

        // Fetch Attendance History
        const attRes = await fetch(`https://project-attendify.onrender.com/api/attendance/student/${studentId}`);
        const attendanceData = await attRes.json();
        
        if (attendanceData && typeof attendanceData.totalClasses !== 'undefined') {
            document.getElementById("totalClasses").innerText = attendanceData.totalClasses;
            document.getElementById("totalPresent").innerText = attendanceData.presentCount;
            document.getElementById("attendancePercent").innerText = attendanceData.attendancePercent;
            
            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            document.getElementById("calendarMonthTitle").innerText = `${monthNames[attendanceData.month - 1]} ${attendanceData.year} Attendance`;
            
            const grid = document.getElementById("calendarGrid");
            grid.innerHTML = "";
            
            attendanceData.history.forEach(dayInfo => {
                const badge = document.createElement("div");
                badge.className = `day-badge ${dayInfo.status}`;
                badge.innerHTML = `${dayInfo.day}<span>${dayInfo.status.toUpperCase()}</span>`;
                grid.appendChild(badge);
            });
        }

    } catch (err) {
        console.error("Error fetching student details:", err);
    }
}

function renderDetails(student) {
    document.getElementById("studentName").innerText = student.name;
    document.getElementById("studentId").innerText = student.studentId;
    document.getElementById("studentClass").innerText = student.class || "N/A";
    document.getElementById("studentAvatar").innerText = student.name.charAt(0).toUpperCase();
}

function openEditModal() {
    if (!currentStudent) return;
    document.getElementById("editName").value = currentStudent.name;
    document.getElementById("editId").value = currentStudent.studentId;
    document.getElementById("editClass").value = currentStudent.class || "";
    editModal.style.display = "flex";
}

// 🔷 MODAL LOGIC
openEditModalBtn.addEventListener("click", openEditModal);

closeModalBtn.addEventListener("click", () => {
    editModal.style.display = "none";
});

saveStudentBtn.addEventListener("click", async () => {
    const updatedName = document.getElementById("editName").value;
    const updatedClass = document.getElementById("editClass").value;

    try {
        const response = await fetch(`https://project-attendify.onrender.com/api/students/${currentStudent._id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: updatedName, class: updatedClass })
        });

        if (response.ok) {
            const updatedStudent = await response.json();
            currentStudent = updatedStudent;
            renderDetails(currentStudent);
            editModal.style.display = "none";
            alert("Profile updated successfully!");
        } else {
            alert("Failed to update profile.");
        }
    } catch (err) {
        console.error("Error updating student:", err);
        alert("Error connecting to server.");
    }
});

fetchStudentDetails();
