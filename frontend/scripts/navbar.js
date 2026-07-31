/* 🔷 SHARED NAVBAR LOGIC */

document.addEventListener("DOMContentLoaded", () => {
    const hamburger = document.querySelector(".hamburger");
    const navLinks = document.querySelector(".nav-links");

    const closeMenu = () => {
        navLinks.classList.remove("active");
        const icon = hamburger.querySelector("i");
        if (icon) {
            icon.classList.remove("fa-times");
            icon.classList.add("fa-bars");
        }
    };

    const openMenu = () => {
        navLinks.classList.add("active");
        const icon = hamburger.querySelector("i");
        if (icon) {
            icon.classList.remove("fa-bars");
            icon.classList.add("fa-times");
        }
    };

    if (hamburger && navLinks) {
        // Toggle on hamburger click
        hamburger.addEventListener("click", (e) => {
            e.stopPropagation();
            if (navLinks.classList.contains("active")) {
                closeMenu();
            } else {
                openMenu();
            }
        });

        // Close when clicking a nav link
        navLinks.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", () => {
                closeMenu();
            });
        });

        // Close when clicking anywhere outside the menu or hamburger
        document.addEventListener("click", (e) => {
            if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
                closeMenu();
            }
        });

        // Close menu on Escape key
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") closeMenu();
        });

        // Highlight active link based on current page
        const currentPath = window.location.pathname.split("/").pop();
        const links = navLinks.querySelectorAll("a");
        
        links.forEach(link => {
            const href = link.getAttribute("href");
            if (href === currentPath) {
                link.classList.add("active");
            } else if (currentPath === "" && href === "index.html") {
                link.classList.add("active");
            }
        });
    }
});
