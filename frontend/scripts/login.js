const form = document.getElementById("login-form");
const errorMsg = document.getElementById("login-error");

form.addEventListener("submit", async function (e) {

  e.preventDefault();

  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;

  errorMsg.style.display = "none";

  try {

    const response = await fetch("https://project-attendify.onrender.com//api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        password
      })
    });

    const data = await response.json();

    if (!response.ok) {
      errorMsg.style.display = "block";
      errorMsg.innerText = data.message || "Invalid credentials";
      return;
    }

    // store logged user
    localStorage.setItem("user", JSON.stringify(data.user));

    // redirect to dashboard
    window.location.href = "dashboard.html";

  } catch (error) {

    errorMsg.style.display = "block";
    errorMsg.innerText = "Server error. Please try again.";

  }

});