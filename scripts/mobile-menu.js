document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  const toggle = document.getElementById("mobile-menu-toggle");
  const panel = document.getElementById("mobile-menu-panel");
  const backdrop = document.getElementById("mobile-menu-backdrop");

  if (!toggle || !panel || !backdrop) return;

  const menuLinks = panel.querySelectorAll("a");

  function setMenuState(isOpen) {
    body.classList.toggle("menu-open", isOpen);
    panel.hidden = !isOpen;
    backdrop.hidden = !isOpen;
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute(
      "aria-label",
      isOpen ? "Close navigation menu" : "Open navigation menu"
    );
  }

  function toggleMenu() {
    const isOpen = toggle.getAttribute("aria-expanded") === "true";
    setMenuState(!isOpen);
  }

  toggle.addEventListener("click", toggleMenu);
  backdrop.addEventListener("click", () => setMenuState(false));

  menuLinks.forEach((link) => {
    link.addEventListener("click", () => setMenuState(false));
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth >= 1024) {
      setMenuState(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setMenuState(false);
    }
  });
});
