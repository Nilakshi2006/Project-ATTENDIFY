/* 🔷 LOGOUT LOGIC */

let currentUser = null;

async function initLogout() {
    // 1. Get user from localStorage
    const userStr = localStorage.getItem("user");
    
    if (userStr) {
        currentUser = JSON.parse(userStr);
        const email = currentUser.email || "your account";
        document.getElementById("logout-email-text").innerHTML = `Are you sure you want to log out as <strong style="color:#4f46e5">${email}</strong>?`;
    }

    // 2. Setup button listeners
    document.getElementById("confirmLogoutBtn").addEventListener("click", processLogout);
    document.getElementById("cancelLogoutBtn").addEventListener("click", () => {
        window.location.href = "index.html";
    });
}

async function processLogout() {
    try {
        // Switch UI to processing state
        document.getElementById("logout-confirm").classList.add("hidden");
        document.getElementById("logout-processing").classList.remove("hidden");

        const userId = currentUser ? (currentUser.id || currentUser._id) : null;

        // 2. Perform Backend Logout (Delete User Record)
        if (userId) {
            console.log(`Terminating session for user: ${userId}`);
            
            await fetch(`https://project-attendify.onrender.com/api/auth/logout/${userId}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json"
                }
            });
        }

        // 3. Clear Local Storage
        localStorage.removeItem("user");
        localStorage.clear();

        // 4. Visual Delay and Redirect
        setTimeout(() => {
            window.location.href = "login.html";
        }, 1500);

    } catch (error) {
        console.error("Logout Error:", error);
        localStorage.clear();
        setTimeout(() => {
            window.location.href = "login.html";
        }, 1000);
    }
}

// Initialize on load
document.addEventListener("DOMContentLoaded", initLogout);
