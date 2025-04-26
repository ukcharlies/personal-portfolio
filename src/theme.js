// Theme toggle script for the portfolio website
document.addEventListener("DOMContentLoaded", () => {
  const themeToggle = document.getElementById("theme-toggle");
  const moonIcon = document.getElementById("moon-icon");
  const sunIcon = document.getElementById("sun-icon");
  const html = document.documentElement;

  // Function to set the theme (class, storage, icon)
  function setTheme(theme) {
    localStorage.setItem("theme", theme);
    if (theme === "light") {
      html.classList.remove("dark");
      html.classList.add("light");
      moonIcon?.classList.add("hidden");
      sunIcon?.classList.remove("hidden");
    } else {
      // Default to dark
      html.classList.remove("light");
      html.classList.add("dark");
      sunIcon?.classList.add("hidden");
      moonIcon?.classList.remove("hidden");
    }
  }

  // Check for saved theme preference or use system preference or default to dark
  const savedTheme =
    localStorage.getItem("theme") ||
    (window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark");

  // Apply the initial theme
  setTheme(savedTheme);

  // Function to check scroll position and show/hide button
  function checkScrollPosition() {
    // Only run if the button exists
    if (!themeToggle) return;

    const halfwayPoint = window.innerHeight / 2;
    const scrollPosition = window.scrollY;

    if (scrollPosition > halfwayPoint) {
      themeToggle.classList.remove("opacity-0", "translate-y-10");
      themeToggle.classList.add("opacity-100", "translate-y-0");
    } else {
      themeToggle.classList.add("opacity-0", "translate-y-10");
      themeToggle.classList.remove("opacity-100", "translate-y-0");
    }
  }

  // Initial check and add scroll listener
  checkScrollPosition();
  window.addEventListener("scroll", checkScrollPosition);

  // Add click listener to the toggle button
  themeToggle?.addEventListener("click", () => {
    const currentTheme = html.classList.contains("dark") ? "dark" : "light";
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    setTheme(newTheme);
  });
});
