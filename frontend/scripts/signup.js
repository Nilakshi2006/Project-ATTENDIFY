const form = document.getElementById("signup-form");
const errorMsg = document.getElementById("signup-error");

form.addEventListener("submit", async function (e) {

  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirm-password").value;

  errorMsg.style.display = "none";

  // password match check
  if (password !== confirmPassword) {
    errorMsg.style.display = "block";
    errorMsg.style.background = "#fef2f2";
    errorMsg.style.color = "#dc2626";
    errorMsg.innerText = "Passwords do not match!";
    return;
  }

  try {

    const response = await fetch("https://project-attendify.onrender.com//api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name,
        email,
        password
      })
    });

    const data = await response.json();

    if (!response.ok) {
      errorMsg.style.display = "block";
      errorMsg.style.background = "#fef2f2";
      errorMsg.style.color = "#dc2626";
      errorMsg.innerText = data.message || "Signup failed";
      return;
    }

    // success message
    errorMsg.style.display = "block";
    errorMsg.style.background = "#ecfdf5";
    errorMsg.style.color = "#065f46";
    errorMsg.innerText = "Account created successfully! Redirecting to login...";

    form.reset();

    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 1500);

  } catch (error) {

    errorMsg.style.display = "block";
    errorMsg.style.background = "#fef2f2";
    errorMsg.style.color = "#dc2626";
    errorMsg.innerText = "Server error. Please try again.";

  }

});