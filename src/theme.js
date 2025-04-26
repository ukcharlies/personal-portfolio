// Theme toggle script for the portfolio website
document.addEventListener("DOMContentLoaded", () => {
  // Check for saved theme preference or use the default (dark)
  const savedTheme = localStorage.getItem("theme") || "dark";
  document.documentElement.classList.add(savedTheme);

  // Add theme toggle functionality if needed in the future
  // For now, we're using the dark theme with brown/golden accents as requested
  function setTheme(theme) {
    if (theme === "light") {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
  }

  // Expose the setTheme function globally for use in the HTML
  window.setTheme = setTheme;
});
