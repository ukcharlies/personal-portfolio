document.addEventListener("DOMContentLoaded", () => {
  const cards = Array.from(document.querySelectorAll(".project-card"));

  cards.forEach((card, index) => {
    const image = card.querySelector(".card-image");
    const linksWrap = card.querySelector(".card-links");

    if (!image || !linksWrap) return;

    const linkEls = Array.from(linksWrap.querySelectorAll("a[href]"));
    const githubLink = linkEls.find((link) => /github\.com/i.test(link.href));
    const demoLink = linkEls.find((link) => {
      if (link === githubLink) return false;
      const label = (link.textContent || "").toLowerCase();
      return (
        /demo|live|site|video|docs|preview/i.test(label) ||
        /^https?:\/\//i.test(link.href)
      );
    });

    if (githubLink) {
      const readmeHref = `${githubLink.href.replace(/\/$/, "")}#readme`;
      const hasReadMore = linksWrap.querySelector(".read-more-link");

      if (!hasReadMore) {
        const readMoreLink = document.createElement("a");
        readMoreLink.className = "card-link read-more-link";
        readMoreLink.href = readmeHref;
        readMoreLink.target = "_blank";
        readMoreLink.rel = "noopener noreferrer";
        readMoreLink.textContent = "Read More";
        linksWrap.appendChild(readMoreLink);
      }
    }

    const quickActions = document.createElement("div");
    quickActions.className = "card-quick-actions";

    if (demoLink) {
      quickActions.appendChild(
        createQuickAction({
          href: demoLink.href,
          label: "Open live link",
          icon: "external",
        })
      );
    }

    if (githubLink) {
      quickActions.appendChild(
        createQuickAction({
          href: githubLink.href,
          label: "Open GitHub repository",
          icon: "github",
        })
      );
    }

    if (quickActions.children.length > 0) {
      image.appendChild(quickActions);
    }

    card.style.transitionDelay = `${Math.min(index * 70, 500)}ms`;
  });

  if (window.matchMedia("(hover: none)").matches) {
    cards.forEach((card) => card.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.2,
      rootMargin: "0px 0px -8% 0px",
    }
  );

  cards.forEach((card) => observer.observe(card));
});

function createQuickAction({ href, label, icon }) {
  const link = document.createElement("a");
  link.className = "card-quick-action";
  link.href = href;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.setAttribute("aria-label", label);

  link.innerHTML = icon === "github" ? githubIcon() : externalIcon();
  return link;
}

function externalIcon() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M14 3h7v7"/><path stroke-linecap="round" stroke-linejoin="round" d="M10 14L21 3"/><path stroke-linecap="round" stroke-linejoin="round" d="M21 14v7h-7"/><path stroke-linecap="round" stroke-linejoin="round" d="M3 10V3h7"/><path stroke-linecap="round" stroke-linejoin="round" d="M3 21l7-7"/></svg>';
}

function githubIcon() {
  return '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>';
}
