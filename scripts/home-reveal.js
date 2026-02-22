document.addEventListener("DOMContentLoaded", () => {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const targets = Array.from(
    document.querySelectorAll(
      [
        ".hero-section",
        ".about-section",
        ".skills-section .grid.grid-cols-2 > div",
        ".education-section .edu-card",
        ".resume-section .experience-row",
        ".contact-section .contact-card",
        ".contact-section .contact-meta",
        ".site-footer",
      ].join(",")
    )
  );

  if (!targets.length) return;

  targets.forEach((el, i) => {
    el.classList.add("reveal-on-scroll");
    if (
      el.matches(".skills-section .grid.grid-cols-2 > div") ||
      el.matches(".education-section .edu-card") ||
      el.matches(".resume-section .experience-row")
    ) {
      el.classList.add(i % 2 === 0 ? "reveal-left" : "reveal-right");
    }
    el.style.transitionDelay = `${Math.min(i * 45, 420)}ms`;
  });

  if (reduced) {
    targets.forEach((el) => {
      el.classList.add("reveal-visible");
      el.style.transitionDelay = "0ms";
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("reveal-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.18,
      rootMargin: "0px 0px -8% 0px",
    }
  );

  targets.forEach((el) => observer.observe(el));
});
